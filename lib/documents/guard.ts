// KOANO document engine — the guard layer.
// Three gates, in the cheapest-first order, layered on the existing spend guard:
//   1. Tier gate  — is the user's plan allowed to generate this document?
//                   (free → never; otherwise homeTier and above.)
//   2. Doc cap    — per-user rolling-24h document ceiling (abuse bound),
//                   a COUNT over the documents table (which doubles as the
//                   audit trail — no separate counter).
//   3. Content    — a FRESH build is one `content` generation through the
//                   existing guardSpend; a VERDICT build costs zero (it reuses
//                   a stored verdict's synthesis, no model call).
//
// FAIL CLOSED, like guardSpend: any real DB error denies (503). A missing
// profile row is not an error — it defaults to the free plan (→ tier-gate 402).

import { supabaseAdmin } from '../supabase/server';
import {
  guardSpend,
  resolvePlan,
  type GuardResult,
  type GuardDenial,
  type Plan,
} from '../koano-guard';
import { TIER_LADDER, type Tier, type BuildSource } from './types';
import type { DocumentType } from './types';

const WINDOW_MS = 24 * 60 * 60 * 1000;

// Which user plans may generate a document with this homeTier: the home tier
// and every richer plan. Monotonic by construction — a lower plan is never in
// the set, so a community subscriber can't generate a portfolio-home document.
export function allowedPlansFor(homeTier: Tier): Tier[] {
  return TIER_LADDER.slice(TIER_LADDER.indexOf(homeTier));
}

function documentDailyCap(): number {
  const n = Number(process.env.KOANO_DAILY_DOCUMENT_CAP ?? '30');
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 30;
}

function failClosed(detail: string): GuardDenial {
  console.error('[koano-document-guard] failing closed:', detail);
  return {
    ok: false,
    status: 503,
    body: { error: 'Access control is unavailable — request denied.' },
  };
}

// A `free` plan (or any value outside the paid ladder) can never generate.
function isPaidTier(plan: Plan): plan is Tier {
  return (TIER_LADDER as readonly string[]).includes(plan);
}

// Run the three gates. Called AFTER the route has validated that the document
// exists, is not `blocked`, and supports the requested format.
export async function guardDocument(args: {
  userId: string;
  doc: DocumentType;
  buildSource: BuildSource;
  route: string;
}): Promise<GuardResult> {
  const { userId, doc, buildSource, route } = args;

  try {
    const sb = supabaseAdmin();
    const plan = await resolvePlan(userId);

    // --- Gate 1: tier -------------------------------------------------------
    // Free users generate no documents; the free preview is the analyses/
    // reasoning chains, not a deliverable.
    if (!isPaidTier(plan)) {
      return {
        ok: false,
        status: 402,
        body: {
          error:
            'Generating documents requires a paid plan. Free access includes the analyses and reasoning chains; documents are a paid deliverable.',
          upgrade_required: true,
          plan,
          required_tier: doc.homeTier,
        },
      };
    }
    const allowed = allowedPlansFor(doc.homeTier);
    if (!allowed.includes(plan)) {
      return {
        ok: false,
        status: 403,
        body: {
          error: `The ${doc.title} is a ${doc.homeTier}-tier document. Your ${plan} plan cannot generate it — upgrade to ${doc.homeTier} or higher.`,
          upgrade_required: true,
          plan,
          required_tier: doc.homeTier,
          allowed_tiers: allowed,
        },
      };
    }

    // --- Gate 2: document cap (rolling 24h, abuse bound) --------------------
    // A pre-check COUNT, not reserve-then-recount: the documents table is
    // append-only (its immutability trigger blocks DELETE), so we cannot roll a
    // reservation back. The row is inserted only after a document renders. This
    // admits a tiny race under burst-parallel requests; acceptable for an abuse
    // bound (the model spend on fresh builds is metered exactly by guardSpend).
    const windowStart = new Date(Date.now() - WINDOW_MS).toISOString();
    const cap = documentDailyCap();
    const counted = await sb
      .from('documents')
      .select('id', { count: 'exact', head: true })
      .eq('clerk_user_id', userId)
      .gte('created_at', windowStart);
    if (counted.error) {
      return failClosed(`document cap count: ${counted.error.message}`);
    }
    if ((counted.count ?? 0) >= cap) {
      // Reset = 24h after the OLDEST document in the current window.
      const oldest = await sb
        .from('documents')
        .select('created_at')
        .eq('clerk_user_id', userId)
        .gte('created_at', windowStart)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();
      const resetAt =
        !oldest.error && oldest.data?.created_at
          ? new Date(new Date(oldest.data.created_at as string).getTime() + WINDOW_MS).toISOString()
          : null;
      return {
        ok: false,
        status: 429,
        body: {
          error: `Daily document limit reached (${cap} per rolling 24 hours). This bound is independent of your plan's content allowance.`,
          document_cap: cap,
          ...(resetAt ? { reset_at: resetAt } : {}),
        },
      };
    }

    // --- Gate 3: content meter (fresh builds only) -------------------------
    // A fresh build makes one model call → one `content` generation through the
    // existing guard (plan limits + global breaker). A verdict-sourced build
    // reuses stored synthesis and makes no model call, so it is not metered
    // here — only the document cap bounds it.
    if (buildSource === 'fresh') {
      const spend = await guardSpend({ userId, kind: 'content', route });
      if (!spend.ok) return spend;
    }

    return { ok: true };
  } catch (e) {
    return failClosed(`guardDocument threw: ${e instanceof Error ? e.message : String(e)}`);
  }
}
