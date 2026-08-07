// KOANO spend guard — tier-based (Phase 2 of the paywall migration).
// Server-side only. Enforced on every route that can cost money:
//   1. Per-user plan limit for this kind. FREE counts LIFETIME (all-time) —
//      3 verdict + 3 content, so a signed-in user can preview the engine and
//      then hits a distinct "upgrade required" (HTTP 402). PAID plans count a
//      rolling 24h window, so pre-upgrade free usage ages out and never
//      permanently blocks a paid user (limit keys off the CURRENT plan).
//   2. Global circuit breaker — KOANO_DAILY_RUN_CAP attempts across all users
//      per rolling 24h (default 50; env var, no deploy to change). Backstop.
//
// The approval gate (profiles.access_status) is retired: any signed-in user
// gets their free allotment immediately. requireApproved is kept as an
// allow-all shim only so the data-route call sites stay untouched this phase.
//
// FAIL CLOSED: any real DB error denies (503). A MISSING profile row is not an
// error — it defaults to the free plan. Never trust the client; never spend on
// error. Usage rows are reserved BEFORE the Anthropic call (insert → recount →
// roll back own row if over), bounding races such as Cluster 4 firing three
// parallel pipeline requests. Attempts that pass the guard count even if the
// pipeline later fails — the safe direction for a metered product.

import { supabaseAdmin } from './supabase/server';

const WINDOW_MS = 24 * 60 * 60 * 1000;

export type SpendKind = 'verdict' | 'content';

export type Plan = 'free' | 'community' | 'transaction' | 'development' | 'portfolio';

interface PlanLimit {
  verdict: number;
  content: number;
  lifetime: boolean; // true = count all-time (free); false = rolling 24h (paid)
}

// Free gives a bounded lifetime preview; paid gives rolling-24h allotments.
export const PLAN_LIMITS: Record<Plan, PlanLimit> = {
  free: { verdict: 3, content: 3, lifetime: true },
  community: { verdict: 20, content: 20, lifetime: false },
  transaction: { verdict: 50, content: 50, lifetime: false },
  development: { verdict: 150, content: 150, lifetime: false },
  portfolio: { verdict: 500, content: 500, lifetime: false },
};

const VALID_PLANS = Object.keys(PLAN_LIMITS) as Plan[];

export interface GuardDenial {
  ok: false;
  status: number;
  body: Record<string, unknown>;
}
export type GuardResult = { ok: true } | GuardDenial;

function dailyRunCap(): number {
  const n = Number(process.env.KOANO_DAILY_RUN_CAP ?? '50');
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 50;
}

function failClosed(detail: string): GuardDenial {
  // Deliberately generic to the client; detail goes to the server log.
  console.error('[koano-guard] failing closed:', detail);
  return {
    ok: false,
    status: 503,
    body: { error: 'Access control is unavailable — request denied.' },
  };
}

// Resolve a user's plan. A missing profile row → free (not an error). Only a
// real DB error fails closed (surfaced via the thrown branch in the caller).
async function resolvePlan(userId: string): Promise<Plan> {
  const { data, error } = await supabaseAdmin()
    .from('profiles')
    .select('plan')
    .eq('clerk_user_id', userId)
    .maybeSingle();
  if (error) throw new Error(`plan lookup: ${error.message}`);
  const plan = data?.plan as string | undefined;
  return plan && (VALID_PLANS as string[]).includes(plan) ? (plan as Plan) : 'free';
}

// Approval gating is retired. Kept as an allow-all shim so the non-spending
// data-route call sites (site-detail, verdicts, properties) stay untouched
// this phase; a signed-in user is sufficient. To be removed in a later phase.
export async function requireApproved(_userId: string): Promise<GuardDenial | null> {
  return null;
}

// Call before ANY code path that reaches Anthropic.
export async function guardSpend(args: {
  userId: string;
  kind: SpendKind;
  route: string;
}): Promise<GuardResult> {
  const { userId, kind, route } = args;

  try {
    const sb = supabaseAdmin();
    const plan = await resolvePlan(userId);
    const planLimit = PLAN_LIMITS[plan];
    const limit = planLimit[kind];

    // Reserve the attempt first, then recount including our own row.
    const ins = await sb
      .from('usage_events')
      .insert({ clerk_user_id: userId, kind, route })
      .select('id')
      .single();
    if (ins.error || !ins.data) {
      return failClosed(`usage reserve: ${ins.error?.message ?? 'no row'}`);
    }
    const usageId = ins.data.id as string;
    const rollback = async () => {
      await sb.from('usage_events').delete().eq('id', usageId);
    };

    // Backstop — global circuit breaker across ALL users and kinds (24h).
    const windowStart = new Date(Date.now() - WINDOW_MS).toISOString();
    const cap = dailyRunCap();
    const global = await sb
      .from('usage_events')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', windowStart);
    if (global.error) {
      await rollback();
      return failClosed(`breaker count: ${global.error.message}`);
    }
    if ((global.count ?? 0) > cap) {
      await rollback();
      return {
        ok: false,
        status: 503,
        body: {
          error:
            "KOANO's demo capacity for the day is used up. The engine pauses until the 24-hour window resets — no requests are being sent to the model.",
          daily_cap: cap,
        },
      };
    }

    // Per-user plan limit. FREE counts all-time; PAID counts the rolling 24h
    // window (so pre-upgrade free usage ages out — the limit keys off the
    // CURRENT plan, never cumulative history).
    let mineQuery = sb
      .from('usage_events')
      .select('created_at')
      .eq('clerk_user_id', userId)
      .eq('kind', kind)
      .order('created_at', { ascending: true });
    if (!planLimit.lifetime) mineQuery = mineQuery.gte('created_at', windowStart);
    const mine = await mineQuery;
    if (mine.error) {
      await rollback();
      return failClosed(`user count: ${mine.error.message}`);
    }
    const rows = mine.data ?? [];
    if (rows.length > limit) {
      await rollback();
      const noun = kind === 'verdict' ? 'verdict runs' : 'generated documents';

      // Free over-limit → distinct upgrade signal (402), no reset window.
      if (plan === 'free') {
        return {
          ok: false,
          status: 402,
          body: {
            error: `You've used all ${limit} free ${noun}. Upgrade to a paid plan to keep going.`,
            upgrade_required: true,
            plan,
            kind,
            limit,
          },
        };
      }

      // Paid over-limit → rolling-window rate limit (429) with reset time.
      const resetAt = new Date(
        new Date(rows[0].created_at as string).getTime() + WINDOW_MS,
      ).toISOString();
      return {
        ok: false,
        status: 429,
        body: {
          error: `Rate limit reached: ${limit} ${noun} per rolling 24 hours on the ${plan} plan. Attempts count even if a run fails.`,
          plan,
          kind,
          limit,
          remaining: 0,
          reset_at: resetAt,
        },
      };
    }

    return { ok: true };
  } catch (e) {
    return failClosed(`guardSpend threw: ${e instanceof Error ? e.message : String(e)}`);
  }
}
