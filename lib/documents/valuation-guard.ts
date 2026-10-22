// Valuation guardrail (UI sprint WS1 / Phase 0 item 30-4, kill-list #2).
//
// KOANO's indicative value is "median recorded $/sq ft of nearby 1-3 family
// sales × the subject's PLUTO building area". That arithmetic is only meaningful
// for a subject that trades as a whole building in that comp pool. Applied to a
// co-op, a condo, or a multifamily building it produced absurd figures (about
// $149M for a co-op two-bedroom and about $75M for a 66-unit rental) because
// co-op and condo recorded sales carry no unit area in DOF data, and whole-
// building multifamily does not trade on 1-3 family $/sq ft.
//
// Rule (deterministic, shared by every document builder and dashboard panel):
// no building-area valuation when the subject is a co-op (D4, C6, C8), a condo
// (any R-class building class), or has 7 or more residential units. The caller
// prints the reason instead of a number. Pure and client-safe.

import type { ZoningInfo, MlsComp, MlsCompsSummary } from '../providers/types';
import { COOP_CLASSES, streetKey } from '../agents/direction';

export interface ValuationGuard {
  allowed: boolean;
  // Plain-language reason shown IN PLACE of the figure when blocked.
  reason: string | null;
  // Short tag for compact UI ("co-op", "condo", "7+ units").
  kind: 'coop' | 'condo' | 'multifamily' | null;
}

export const MULTIFAMILY_UNIT_THRESHOLD = 7;

export function valuationGuard(zoning: Pick<ZoningInfo, 'building_class' | 'residential_units'> | null | undefined): ValuationGuard {
  if (!zoning) return { allowed: true, reason: null, kind: null };
  const cls = (zoning.building_class ?? '').trim().toUpperCase();
  const units = zoning.residential_units ?? null;
  if (cls && COOP_CLASSES.has(cls)) {
    return {
      allowed: false,
      kind: 'coop',
      reason: `No unit-comparable valuation available: this is a co-op (DOF building class ${cls}), and recorded co-op sales carry no unit area in DOF data. Enter unit square footage or connect your MLS for a unit-level valuation.`,
    };
  }
  if (cls && /^R/.test(cls)) {
    return {
      allowed: false,
      kind: 'condo',
      reason: `No unit-comparable valuation available: this is a condominium (DOF building class ${cls}), and recorded condo sales carry no unit area in DOF data. Enter unit square footage or connect your MLS for a unit-level valuation.`,
    };
  }
  if (units != null && units >= MULTIFAMILY_UNIT_THRESHOLD) {
    return {
      allowed: false,
      kind: 'multifamily',
      reason: `No building-area valuation available: this building has ${units} residential units, and 1-3 family recorded $/sq ft does not price a multifamily building. Multifamily comps (DOF classes 07 and 08, $/unit) are not sourced today.`,
    };
  }
  return { allowed: true, reason: null, kind: null };
}

// Exclude the subject from its own comparable pool. Recorded sales carry a
// street address, not a BBL, so the match is on the normalized house number +
// street, which is how DOF prints both.
export function excludeSubject<T extends { address: string }>(comps: T[], subjectNormalized: string | null | undefined): T[] {
  const key = streetKey(subjectNormalized ?? '');
  if (!key) return comps;
  return comps.filter((c) => streetKey(c.address) !== key);
}

// ONE comparable pool for every valuation figure KOANO prints or shows for a
// property: the provider's distance-ranked comparables with the subject's own
// recorded sale excluded, and the central $/sq ft = the trimmed median of that
// pool. The pricing sheet, CMA, net sheet, property intelligence report, tax
// appeal packet, IC memo, one-pager and the dashboard panels all read this, so
// two KOANO surfaces on one property never disagree on the central value. The
// provider's `median_price_per_sqft` (the ZIP/1-mile market median over ALL
// qualifying sales) remains a MARKET statistic and is labeled as such.
export interface CompPool {
  comps: MlsComp[];
  psfSorted: number[]; // ascending $/sq ft of the pool
  medianPsf: number | null; // trimmed median of psfSorted
  p25Psf: number | null;
  p75Psf: number | null;
  subjectExcluded: boolean;
}

export function compPool(summary: Pick<MlsCompsSummary, 'comps'> | null | undefined, subjectNormalized: string | null | undefined): CompPool {
  const all = summary?.comps ?? [];
  const comps = excludeSubject(all, subjectNormalized);
  const psfSorted = comps.map((c) => c.price_per_sqft).filter((n) => Number.isFinite(n) && n > 0).sort((a, b) => a - b);
  return {
    comps,
    psfSorted,
    medianPsf: psfSorted.length ? trimmedMedianPsf(psfSorted) : null,
    p25Psf: psfSorted.length ? percentile(psfSorted, 25) : null,
    p75Psf: psfSorted.length ? percentile(psfSorted, 75) : null,
    subjectExcluded: comps.length !== all.length,
  };
}

// Trimmed median of a sorted ascending $/sq ft pool: 10% off each end once
// there are at least 10 sales (so an outlier never sets the midpoint); below
// that, the plain median.
export function trimmedMedianPsf(sorted: number[]): number {
  if (sorted.length === 0) return 0;
  const cut = sorted.length >= 10 ? Math.floor(sorted.length * 0.1) : 0;
  const s = sorted.slice(cut, sorted.length - cut);
  const m = Math.floor(s.length / 2);
  return Math.round(s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2);
}

// Linear-interpolated percentile of a sorted ascending array.
export function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return NaN;
  if (sorted.length === 1) return sorted[0];
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}
