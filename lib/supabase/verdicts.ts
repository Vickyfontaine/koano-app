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
}

export async function persistVerdict(args: {
  clerkUserId: string;
  addressInput: string;
  resolvedAddress: ResolvedAddress;
  verdict: SynthesisResult;
}): Promise<PersistOutcome> {
  const { clerkUserId, addressInput, resolvedAddress, verdict } = args;
  try {
    const { error } = await supabaseAdmin().from('verdicts').insert({
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
      reasoning_chain: verdict.reasoning_chain,
      minority_signals: verdict.minority_signals,
      top_data_sources: verdict.top_data_sources,
      agent_summaries: verdict.agent_summaries,
    });
    if (error) return { persisted: false, persist_error: error.message };
    return { persisted: true, persist_error: null };
  } catch (e) {
    return { persisted: false, persist_error: e instanceof Error ? e.message : 'persist failed' };
  }
}
