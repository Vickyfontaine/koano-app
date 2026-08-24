// KOANO verdict history API — Checkpoint 4 (Phase B).
// GET ?limit=N → the requesting user's most recent verdicts from the
// append-only verdicts table (the audit trail). Clerk-protected.

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '../../../../lib/supabase/server';
import { requireApproved } from '../../../../lib/koano-guard';
import type { AgentSummary } from '../../../../lib/agents/breakdown';

export const dynamic = 'force-dynamic';

export interface VerdictHistoryRow {
  id: string;
  address_input: string;
  address_normalized: string | null;
  verdict: string;
  confidence: number;
  risk_score: number;
  signal_window_months: number;
  headline: string;
  overall_provenance: 'live' | 'representative';
  created_at: string;
  // Stored votes — enough to RE-DERIVE the verdict math for a history row with no
  // model call (weighting_breakdown isn't persisted; it's a pure function of these).
  agent_summaries: AgentSummary[];
  // User-curated "hide from view" flag (side table; the verdict itself is
  // immutable). The UI hides these by default with a "show hidden" toggle.
  hidden: boolean;
}

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const denied = await requireApproved(userId);
  if (denied) return NextResponse.json(denied.body, { status: denied.status });

  const url = new URL(req.url);
  const limitRaw = Number(url.searchParams.get('limit') ?? 20);
  const limit = Number.isFinite(limitRaw) ? Math.min(100, Math.max(1, Math.floor(limitRaw))) : 20;

  const { data, error } = await supabaseAdmin()
    .from('verdicts')
    .select(
      'id, address_input, address_normalized, verdict, confidence, risk_score, signal_window_months, headline, overall_provenance, created_at, agent_summaries',
    )
    .eq('clerk_user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Which of these verdicts has the user hidden? Deploy-safe: if migration-019
  // isn't applied, the table is missing → treat nothing as hidden.
  const hiddenSet = new Set<string>();
  const hiddenRes = await supabaseAdmin()
    .from('verdict_hidden')
    .select('verdict_id')
    .eq('clerk_user_id', userId);
  if (!hiddenRes.error) {
    for (const r of hiddenRes.data ?? []) hiddenSet.add((r as { verdict_id: string }).verdict_id);
  }

  const verdicts = ((data ?? []) as Record<string, unknown>[]).map((r) => ({
    ...(r as object),
    hidden: hiddenSet.has(r.id as string),
  })) as VerdictHistoryRow[];
  return NextResponse.json({ verdicts });
}

// POST { verdict_id, hidden } → set/clear the per-user hide flag. The verdict
// itself is never modified (append-only audit trail); this only curates the view.
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const denied = await requireApproved(userId);
  if (denied) return NextResponse.json(denied.body, { status: denied.status });

  let body: { verdict_id?: unknown; hidden?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const verdictId = typeof body.verdict_id === 'string' ? body.verdict_id : '';
  if (!verdictId) return NextResponse.json({ error: '"verdict_id" is required' }, { status: 400 });
  const hidden = body.hidden === true;

  const admin = supabaseAdmin();
  const { error } = hidden
    ? await admin
        .from('verdict_hidden')
        .upsert({ clerk_user_id: userId, verdict_id: verdictId }, { onConflict: 'clerk_user_id,verdict_id' })
    : await admin.from('verdict_hidden').delete().eq('clerk_user_id', userId).eq('verdict_id', verdictId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, verdict_id: verdictId, hidden });
}
