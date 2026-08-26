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
import { isTrustedProvenance } from '../providers/provenance';

export const CONFIDENCE_FACT_WEIGHT = 0.65;

// ~this many trusted signals reads as a fully-rich evidence base.
const RICHNESS_SATURATION = 20;
// Converging → conflicted, by minority-signal count (0,1,2,3+).
const AGREEMENT_BY_MINORITY = [1.0, 0.75, 0.5, 0.35];

export function deterministicConfidence(dataPoints: DataPoint[], minoritySignalCount: number): number {
  const total = dataPoints.length || 1;
  // TRUSTED = present real data (live or partner). Everything else is a caveat —
  // a stand-in, a failed fetch, or an uncovered market — none of which supports
  // high confidence. (A pure-live run has caveatFrac 0, so this is unchanged for a
  // fully-live NYC verdict; a non-NYC verdict with coverage_absent inputs is now
  // correctly penalized, not treated as fully evidenced.)
  const trusted = dataPoints.filter((d) => isTrustedProvenance(d.provenance)).length;
  const caveatFrac = dataPoints.filter((d) => !isTrustedProvenance(d.provenance)).length / total;

  const agreement = AGREEMENT_BY_MINORITY[Math.min(minoritySignalCount, 3)];
  const richness = Math.max(0, Math.min(1, trusted / RICHNESS_SATURATION));

  // base 50 + up to 30 (agreement) + up to 12 (richness) − up to 28 (caveat evidence)
  let det = 50 + 30 * agreement + 12 * richness - 28 * caveatFrac;
  if (caveatFrac > 0) det = Math.min(det, 74); // non-trusted evidence caps confidence
  return Math.max(40, Math.min(92, Math.round(det)));
}

export function blendConfidence(deterministic: number, agentBand: number): number {
  return Math.round(CONFIDENCE_FACT_WEIGHT * deterministic + (1 - CONFIDENCE_FACT_WEIGHT) * agentBand);
}
