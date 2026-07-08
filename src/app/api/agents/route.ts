// KOANO agents API — Step 6.
// POST { address } → runs the full 5-agent + synthesis pipeline server-side,
// persists the verdict to Supabase, returns the unified KoanoVerdict.
// Clerk-protected: unauthenticated requests get 401.

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { runKoanoPipeline } from '../../../../lib/agents/synthesis';
import { supabaseAdmin } from '../../../../lib/supabase/server';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // full pipeline runs ~60s

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { address?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const address = typeof body.address === 'string' ? body.address.trim() : '';
  if (!address) {
    return NextResponse.json({ error: '"address" is required' }, { status: 400 });
  }

  let result;
  try {
    result = await runKoanoPipeline(address);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'pipeline failed';
    return NextResponse.json({ error: msg }, { status: 422 });
  }
  const { resolved_address, verdict } = result;

  // Persist (append-only verdicts table — Step 7 schema). If the table does not
  // exist yet, still return the verdict but flag that persistence failed.
  let persisted = false;
  let persist_error: string | null = null;
  try {
    const { error } = await supabaseAdmin().from('verdicts').insert({
      clerk_user_id: userId,
      address_input: address,
      address_normalized: resolved_address.normalized,
      bbl: resolved_address.bbl,
      tract_geoid: resolved_address.tract_geoid,
      verdict: verdict.verdict,
      confidence: verdict.confidence,
      risk_score: verdict.risk_score,
      signal_window_months: verdict.signal_window_months,
      headline: verdict.headline,
      overall_provenance: verdict.overall_provenance,
      reasoning_chain: verdict.reasoning_chain,
      minority_signals: verdict.minority_signals,
      top_data_sources: verdict.top_data_sources,
      agent_summaries: verdict.agent_summaries,
    });
    if (error) persist_error = error.message;
    else persisted = true;
  } catch (e) {
    persist_error = e instanceof Error ? e.message : 'persist failed';
  }

  return NextResponse.json({
    resolved_address: {
      input: resolved_address.input,
      normalized: resolved_address.normalized,
      bbl: resolved_address.bbl,
      tract_geoid: resolved_address.tract_geoid,
    },
    verdict,
    persisted,
    persist_error,
  });
}
