// Deterministic confidence — derived from the EVIDENCE, not the model's
// self-reported conviction band (which regressed to "medium"=72 on nearly every
// agent, making the confidence-weighted synthesis an unweighted vote count).
// Same pattern as entitlement: the facts drive, the agent's band only adjusts.
//
// Three evidence signals, all deterministic and comparable across agents:
//   STRENGTH   — representative/degraded evidence can't support high confidence.
//   RICHNESS   — how many live signals the agent actually reasoned over (a
//                43-signal risk read IS better-supported than a 5-signal one).
//   AGREEMENT  — contradicting evidence (minority signals) lowers confidence;
//                converging evidence raises it.

import type { DataPoint } from '../providers/types';

export const CONFIDENCE_FACT_WEIGHT = 0.65;

// ~this many live signals reads as a fully-rich evidence base.
const RICHNESS_SATURATION = 20;
// Converging → conflicted, by minority-signal count (0,1,2,3+).
const AGREEMENT_BY_MINORITY = [1.0, 0.75, 0.5, 0.35];

export function deterministicConfidence(dataPoints: DataPoint[], minoritySignalCount: number): number {
  const total = dataPoints.length || 1;
  const live = dataPoints.filter((d) => d.provenance === 'live').length;
  const repFrac = dataPoints.filter((d) => d.provenance === 'representative').length / total;

  const agreement = AGREEMENT_BY_MINORITY[Math.min(minoritySignalCount, 3)];
  const richness = Math.max(0, Math.min(1, live / RICHNESS_SATURATION));

  // base 50 + up to 30 (agreement) + up to 12 (richness) − up to 28 (representative)
  let det = 50 + 30 * agreement + 12 * richness - 28 * repFrac;
  if (repFrac > 0) det = Math.min(det, 74); // representative evidence caps confidence
  return Math.max(40, Math.min(92, Math.round(det)));
}

export function blendConfidence(deterministic: number, agentBand: number): number {
  return Math.round(CONFIDENCE_FACT_WEIGHT * deterministic + (1 - CONFIDENCE_FACT_WEIGHT) * agentBand);
}
