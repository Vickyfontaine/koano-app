// Persist a synthesized verdict to the append-only verdicts table.
// Shared by /api/agents (JSON) and /api/agents/stream (NDJSON) so the two
// routes can never drift. If the insert fails the verdict is still returned
// to the caller — persistence failure is reported, never hidden.

import { supabaseAdmin } from './server';
import type { ResolvedAddress } from '../providers/types';
import type { SynthesisResult } from '../agents/synthesis';

export interface PersistOutcome {
  persisted: boolean;
  persist_error: string | null;
  /** The stored row id when persisted (the share link needs it). */
  verdict_id?: string | null;
}

export async function persistVerdict(args: {
  clerkUserId: string;
  addressInput: string;
  resolvedAddress: ResolvedAddress;
  verdict: SynthesisResult;
}): Promise<PersistOutcome> {
  const { clerkUserId, addressInput, resolvedAddress, verdict } = args;
  const base = {
    clerk_user_id: clerkUserId,
    address_input: addressInput,
    address_normalized: resolvedAddress.normalized,
    bbl: resolvedAddress.bbl,
    tract_geoid: resolvedAddress.tract_geoid,
    verdict: verdict.verdict,
    confidence: verdict.confidence,
    risk_score: verdict.risk_score,
    signal_window_months: verdict.signal_window_months,
    headline: verdict.headline,
    overall_provenance: verdict.overall_provenance,
    // Verdict-engine markers for the calibration record (migration-021). If that
    // migration is not yet applied the insert fails and persist_error is reported
    // (the verdict is still returned) — never a silent loss.
    method: verdict.weighting_breakdown.method,
    inputs_era: verdict.weighting_breakdown.inputs_era ?? null,
    reasoning_chain: verdict.reasoning_chain,
    minority_signals: verdict.minority_signals,
    top_data_sources: verdict.top_data_sources,
    agent_summaries: verdict.agent_summaries,
  };
  try {
    // The scored math (incl. the structural nudge + guard) rides with the verdict
    // (migration-023) so a rebuilt history verdict reproduces the nudge. Deploy-
    // safe: if the column does not exist yet, retry without it rather than lose
    // the row; the UI then re-derives the agent-vote part and says so.
    const { data, error } = await supabaseAdmin()
      .from('verdicts')
      .insert({ ...base, weighting_breakdown: verdict.weighting_breakdown })
      .select('id')
      .single();
    if (!error) return { persisted: true, persist_error: null, verdict_id: (data as { id: string } | null)?.id ?? null };
    if (/weighting_breakdown/.test(error.message)) {
      const retry = await supabaseAdmin().from('verdicts').insert(base).select('id').single();
      if (retry.error) return { persisted: false, persist_error: retry.error.message, verdict_id: null };
      return { persisted: true, persist_error: null, verdict_id: (retry.data as { id: string } | null)?.id ?? null };
    }
    return { persisted: false, persist_error: error.message, verdict_id: null };
  } catch (e) {
    return { persisted: false, persist_error: e instanceof Error ? e.message : 'persist failed', verdict_id: null };
  }
}
