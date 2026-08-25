// Client-safe verdict math — the confidence-weighted aggregation constants and
// the PURE reconstruction of a verdict's weighting breakdown from its stored
// agent_summaries. NO server imports (no Anthropic SDK, no providers registry),
// so the synthesis pipeline (server) AND the UI (client) share ONE source of
// truth for the arithmetic. Types below are the same ones synthesis re-exports.

import type { Verdict } from './shared';
import type { Provenance } from '../providers/types';

// Position of each verdict on the act↔avoid axis.
export const DIRECTION: Record<Verdict, number> = { buy: 2, hold: 0, wait: -1, sell: -2, drop: -2 };

// Verdict-engine INPUTS era — a boundary marker DISTINCT from `method` (the
// aggregation math, unchanged). `method` answers "how were the votes combined";
// this answers "what evidence existed when this verdict was produced". The
// calibration record buckets on it so verdicts produced before and after a signal
// expansion are never compared as like-for-like.
//   era 1 (implicit, pre-marker): the post-grounding-gate NYC + federal-macro engine.
//   era 2 (this): adds the FEMA National Risk Index hazard composite (Slice 3a),
//     and — arriving in the same federal expansion — HUD QCT/DDA (regulatory) and
//     the Census Building Permits Survey supply signal (Slices 3b/3c).
// A live verdict stamps this; a breakdown RECONSTRUCTED from a persisted verdict's
// stored summaries cannot know the era it was produced under, so it leaves this
// unset rather than mislabel an old verdict with today's marker.
export const VERDICT_INPUTS_ERA = 'v2-federal-risk-supply';

// Score→verdict bands. Boundaries resolve DOWN (to the more conservative
// verdict); the band widths are the margin that stops a single agent's
// confidence-weighted move from flip-flopping the category.
export const THRESHOLDS = { buy: 1.0, hold: -0.3, wait: -1.2 };
export function verdictFromScore(s: number): Verdict {
  if (s >= THRESHOLDS.buy) return 'buy';
  if (s >= THRESHOLDS.hold) return 'hold';
  if (s >= THRESHOLDS.wait) return 'wait';
  return 'sell';
}

export interface AgentContribution {
  agent: string;
  verdict: Verdict;
  confidence: number;
  direction: number; // DIRECTION[verdict]
  weight: number; // = confidence
  contribution: number; // confidence × direction
}

export interface WeightingBreakdown {
  method: string; // AGGREGATION methodology marker (how votes combine) — distinct from inputs_era
  // The verdict-engine INPUTS era (see VERDICT_INPUTS_ERA). Set on a live verdict;
  // left undefined on a breakdown reconstructed from stored summaries (the era a
  // persisted verdict was produced under is not recoverable from its summaries).
  inputs_era?: string;
  agents: AgentContribution[];
  total_weight: number;
  aggregate_score: number; // confidence-weighted S from the agent votes (before the nudge)
  thresholds: { buy: number; hold: number; wait: number };
  chosen_verdict: Verdict;
  // Deterministic structural nudge added to aggregate_score before the verdict is
  // read off the thresholds. final_score = aggregate_score + structural_nudge. The
  // drivers are the facts that produced the lean (shown in the panel). Absent on a
  // reconstructed breakdown (agent_summaries don't carry the structural facts).
  structural_nudge?: number;
  structural_drivers?: string[];
  final_score?: number;
  // TRUE when this breakdown was RE-DERIVED now from a persisted verdict's stored
  // inputs, rather than computed live at verdict time. Same arithmetic, same
  // stored inputs — but a reader auditing an old verdict should know which they
  // are seeing. Live aggregate() leaves this undefined.
  reconstructed?: boolean;
}

export interface AgentSummary {
  agent: string;
  verdict: string;
  confidence: number;
  risk_score: number;
  overall_provenance: Provenance;
  headline: string;
}

// Reconstruct the confidence-weighted breakdown from the fields a persisted
// verdict already stores (agent_summaries: agent + verdict + confidence). The
// verdicts table does not persist weighting_breakdown, but it is a PURE function
// of these stored fields, so a document (e.g. the IC memo) or the UI can rebuild
// the exact math the analyst saw with zero model calls and no schema migration.
// Uses the SAME DIRECTION/THRESHOLDS constants as aggregate() — one source of
// truth. Marked reconstructed:true so a re-derivation is never presented as a
// live computation.
export function breakdownFromSummaries(
  summaries: AgentSummary[],
  chosenVerdict: Verdict,
): WeightingBreakdown {
  const agents: AgentContribution[] = summaries.map((sm) => {
    const v = sm.verdict as Verdict;
    const direction = DIRECTION[v] ?? 0;
    return {
      agent: sm.agent,
      verdict: v,
      confidence: sm.confidence,
      direction,
      weight: sm.confidence,
      contribution: sm.confidence * direction,
    };
  });
  const total_weight = agents.reduce((s, c) => s + c.weight, 0) || 1;
  const score = agents.reduce((s, c) => s + c.contribution, 0) / total_weight;
  return {
    method: 'confidence-weighted v1',
    agents,
    total_weight,
    aggregate_score: Math.round(score * 100) / 100,
    thresholds: THRESHOLDS,
    chosen_verdict: chosenVerdict,
    reconstructed: true,
  };
}
