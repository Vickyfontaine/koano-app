// KOANO spend guard — Phase B lockdown. Server-side only.
// Three layers, enforced in order on every route that can cost money:
//   1. Approval gate — profiles.access_status must be 'approved'
//   2. Per-user rolling-24h rate limits (verdict: 5, content: 5)
//   3. Global circuit breaker — KOANO_DAILY_RUN_CAP attempts across all
//      users per rolling 24h (default 50; env var, no deploy to change)
//
// FAIL CLOSED: any database error (including missing migration-002 schema)
// denies the request. Never trust the client; never spend on error.
//
// Usage rows are reserved BEFORE the Anthropic call (insert → recount →
// roll back own row if over), which bounds races such as Cluster 4 firing
// three parallel pipeline requests. Attempts count toward the limit even if
// the pipeline later fails — the safe direction for a metered demo.

import { supabaseAdmin } from './supabase/server';

const WINDOW_MS = 24 * 60 * 60 * 1000;

export const VERDICT_LIMIT_PER_24H = 5; // /api/agents + /api/agents/stream
export const CONTENT_LIMIT_PER_24H = 5; // /api/narrative + /api/briefing combined

export type SpendKind = 'verdict' | 'content';

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

const NOT_APPROVED = (status: string): GuardDenial => ({
  ok: false,
  status: 403,
  body: {
    error:
      'KOANO is in private demo — access is by request. Your account is not approved yet.',
    access_status: status,
  },
});

// Layer 1 — approval gate. Also used alone on non-spending dashboard APIs.
export async function requireApproved(userId: string): Promise<GuardDenial | null> {
  try {
    const { data, error } = await supabaseAdmin()
      .from('profiles')
      .select('access_status')
      .eq('clerk_user_id', userId)
      .maybeSingle();
    if (error) return failClosed(`approval check: ${error.message}`);
    const status = (data?.access_status as string | undefined) ?? 'pending';
    if (status !== 'approved') return NOT_APPROVED(status);
    return null;
  } catch (e) {
    return failClosed(`approval check threw: ${e instanceof Error ? e.message : String(e)}`);
  }
}

// Layers 1+2+3 — call before ANY code path that reaches Anthropic.
export async function guardSpend(args: {
  userId: string;
  kind: SpendKind;
  route: string;
}): Promise<GuardResult> {
  const { userId, kind, route } = args;

  const denied = await requireApproved(userId);
  if (denied) return denied;

  try {
    const sb = supabaseAdmin();
    const windowStart = new Date(Date.now() - WINDOW_MS).toISOString();

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

    // Layer 3 — global circuit breaker across ALL users and kinds.
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

    // Layer 2 — per-user rolling-24h limit for this kind.
    const limit = kind === 'verdict' ? VERDICT_LIMIT_PER_24H : CONTENT_LIMIT_PER_24H;
    const mine = await sb
      .from('usage_events')
      .select('created_at')
      .eq('clerk_user_id', userId)
      .eq('kind', kind)
      .gte('created_at', windowStart)
      .order('created_at', { ascending: true });
    if (mine.error) {
      await rollback();
      return failClosed(`user count: ${mine.error.message}`);
    }
    const rows = mine.data ?? [];
    if (rows.length > limit) {
      await rollback();
      // The oldest counted attempt ages out first — that's when a slot frees.
      const resetAt = new Date(
        new Date(rows[0].created_at as string).getTime() + WINDOW_MS,
      ).toISOString();
      return {
        ok: false,
        status: 429,
        body: {
          error: `Rate limit reached: ${limit} ${kind === 'verdict' ? 'verdict runs' : 'generated documents'} per rolling 24 hours. Attempts count even if a run fails.`,
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
