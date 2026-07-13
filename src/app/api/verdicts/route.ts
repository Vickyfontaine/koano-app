// KOANO verdict history API — Checkpoint 4 (Phase B).
// GET ?limit=N → the requesting user's most recent verdicts from the
// append-only verdicts table (the audit trail). Clerk-protected.

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '../../../../lib/supabase/server';
import { requireApproved } from '../../../../lib/koano-guard';

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
      'id, address_input, address_normalized, verdict, confidence, risk_score, signal_window_months, headline, overall_provenance, created_at',
    )
    .eq('clerk_user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ verdicts: (data ?? []) as VerdictHistoryRow[] });
}
