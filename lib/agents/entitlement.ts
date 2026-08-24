// Deterministic entitlement risk — computed from the zoning FACTS we hold, not an
// LLM band. Higher = harder / more uncertain to realize the developable envelope.
// Pure and client-safe (only imports types), so the regulatory-policy agent uses
// it to DRIVE its risk_score (the model's judgment only adjusts) AND the Cluster 4
// panel uses it to show WHY. A computed score from facts beats a coarse band.

import type { ZoningInfo, Provenance } from '../providers/types';

export interface EntitlementRisk {
  score: number; // 0–100, higher = harder to entitle
  factors: string[]; // the facts that drove the score (shown to the user)
}

// The facts drive; the agent adjusts. Weight the facts heavily.
export const ENTITLEMENT_FACT_WEIGHT = 0.7;

export function blendEntitlementRisk(deterministic: number, agentBand: number): number {
  return Math.round(ENTITLEMENT_FACT_WEIGHT * deterministic + (1 - ENTITLEMENT_FACT_WEIGHT) * agentBand);
}

// Returns null when the zoning facts aren't LIVE — you cannot compute a fact-driven
// score from representative/absent data, so the caller falls back to the agent band
// (and its representative flag stands).
export function deterministicEntitlementRisk(
  zoning: ZoningInfo | null | undefined,
  provenance: Provenance,
): EntitlementRisk | null {
  if (!zoning || provenance !== 'live') return null;

  let score = 35; // neutral base
  const factors: string[] = [];

  const dist = zoning.zoning_district ?? '';
  const headroom = zoning.unused_far_pct; // % of allowable FAR still unbuilt
  const built = zoning.built_far;
  const maxRes = zoning.max_residential_far;
  const maxCom = zoning.max_commercial_far;

  // 1. Headroom / variance need — the dominant factor. No by-right room means any
  //    development needs a variance (a hard, discretionary, uncertain process).
  const overResidential = built != null && maxRes != null && maxRes > 0 && built >= maxRes;
  const overCommercial = built != null && maxCom != null && maxCom > 0 && built >= maxCom;
  const overMax = (overResidential && (maxCom == null || maxCom <= 0 || overCommercial)) || (overCommercial && (maxRes == null || maxRes <= 0));
  if (headroom != null && headroom <= 0) {
    score += 35;
    factors.push('no as-of-right FAR headroom — any development needs a variance');
  } else if (overMax) {
    score += 35;
    factors.push('built FAR at or over the district maximum — needs a variance');
  } else if (headroom != null && headroom < 15) {
    score += 12;
    factors.push(`only ${headroom}% unused FAR — little by-right room`);
  } else if (headroom != null && headroom >= 50) {
    score -= 12;
    factors.push(`${headroom}% unused FAR — ample as-of-right development room`);
  } else if (headroom != null) {
    factors.push(`${headroom}% unused FAR — workable by-right room`);
  }

  // 2. Special district — added discretionary review, design / affordability rules.
  if (zoning.special_district) {
    score += 22;
    factors.push(`special district ${zoning.special_district} (per the zoning source) — added review / requirements`);
  }

  // 3. Zoning family. Manufacturing without residential rights = residential needs
  //    a rezoning (high risk); a special mixed-use M/R = realized through the
  //    special-district framework (moderate added complexity).
  const hasM = /(^|[^A-Z])M\d/.test(dist);
  const hasR = /(^|[^A-Z])R\d/.test(dist);
  if (hasM && !hasR && (maxRes == null || maxRes <= 0)) {
    score += 25;
    factors.push('manufacturing zoning without residential rights — residential needs a rezoning');
  } else if (hasM && hasR) {
    score += 10;
    factors.push('special mixed-use (M/R) district — development realized through the special-district framework');
  }

  // 4. Commercial overlay — minor added complexity on a residential base.
  if (zoning.commercial_overlay) {
    score += 5;
    factors.push(`commercial overlay ${zoning.commercial_overlay}`);
  }

  return { score: Math.max(0, Math.min(100, Math.round(score))), factors };
}
