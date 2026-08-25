// The DECISION SURFACE of a KOANO verdict — the deterministic fields the Phase 5
// fixture asserts byte-identical on replay. Explicitly EXCLUDES the temp-0.4
// narrator prose (headline, reasoning observations, minority-signal text) and all
// timestamps (generated_at, fetched_at): those are either non-deterministic or
// irrelevant to the decision. What remains is what the reproducibility promise is
// actually about.
//
// Fields, mapped to the user's list:
//   verdict / confidence / risk_score / signal_window_months / overall_provenance
//     → the rolled-up verdict + provenance rollup
//   agents[].{verdict,confidence,risk_score,...}  → per-agent bands (regulatory-
//     policy.risk_score carries the blended ENTITLEMENT score)
//   breakdown.{aggregate_score, final_score, structural_nudge, structural_drivers,
//     thresholds, per-agent contributions} → the weighting breakdown + nudge/drivers

import type { PipelineResult } from '../../lib/agents/synthesis';

export interface DecisionSurface {
  address: { normalized: string; bbl: string | null; tract_geoid: string | null; location_confidence: string };
  verdict: string;
  confidence: number;
  risk_score: number;
  signal_window_months: number;
  overall_provenance: string;
  agents: Array<{
    agent: string;
    verdict: string;
    confidence: number;
    risk_score: number;
    signal_window_months: number;
    overall_provenance: string;
  }>;
  breakdown: {
    method: string;
    aggregate_score: number;
    final_score: number;
    structural_nudge: number;
    structural_drivers: string[];
    chosen_verdict: string;
    thresholds: Record<string, number>;
    total_weight: number;
    agents: Array<{
      agent: string;
      verdict: string;
      confidence: number;
      direction: number;
      weight: number;
      contribution: number;
    }>;
  };
}

export function decisionSurface(r: PipelineResult): DecisionSurface {
  const v = r.verdict;
  const b = v.weighting_breakdown;
  return {
    address: {
      normalized: r.resolved_address.normalized,
      bbl: r.resolved_address.bbl,
      tract_geoid: r.resolved_address.tract_geoid,
      location_confidence: r.resolved_address.location_confidence,
    },
    verdict: v.verdict,
    confidence: v.confidence,
    risk_score: v.risk_score,
    signal_window_months: v.signal_window_months,
    overall_provenance: v.overall_provenance,
    agents: [...r.agents]
      .sort((a, c) => a.agent.localeCompare(c.agent))
      .map((a) => ({
        agent: a.agent,
        verdict: a.verdict,
        confidence: a.confidence,
        risk_score: a.risk_score,
        signal_window_months: a.signal_window_months,
        overall_provenance: a.overall_provenance,
      })),
    breakdown: {
      method: b.method,
      aggregate_score: b.aggregate_score,
      // final_score / structural_nudge are always set by aggregate() but typed
      // optional on WeightingBreakdown — coalesce (never triggers in practice) so
      // the surface stays strictly typed and stable.
      final_score: b.final_score ?? b.aggregate_score,
      structural_nudge: b.structural_nudge ?? 0,
      structural_drivers: b.structural_drivers ?? [],
      chosen_verdict: b.chosen_verdict,
      thresholds: b.thresholds as unknown as Record<string, number>,
      total_weight: b.total_weight,
      agents: [...b.agents]
        .sort((x, y) => x.agent.localeCompare(y.agent))
        .map((c) => ({
          agent: c.agent,
          verdict: c.verdict,
          confidence: c.confidence,
          direction: c.direction,
          weight: c.weight,
          contribution: c.contribution,
        })),
    },
  };
}

// Key-order-independent canonical form, for a byte-identity compare.
export function canonical(v: unknown): string {
  if (v === null || typeof v !== 'object') return JSON.stringify(v) ?? 'null';
  if (Array.isArray(v)) return '[' + v.map(canonical).join(',') + ']';
  const obj = v as Record<string, unknown>;
  return '{' + Object.keys(obj).sort().map((k) => JSON.stringify(k) + ':' + canonical(obj[k])).join(',') + '}';
}
