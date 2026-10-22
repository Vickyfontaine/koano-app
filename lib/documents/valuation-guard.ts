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

import type { ZoningInfo } from '../providers/types';

export interface ValuationGuard {
  allowed: boolean;
  // Plain-language reason shown IN PLACE of the figure when blocked.
  reason: string | null;
  // Short tag for compact UI ("co-op", "condo", "7+ units").
  kind: 'coop' | 'condo' | 'multifamily' | null;
}

const COOP_CLASSES = new Set(['D4', 'C6', 'C8']);
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

function streetKey(address: string): string {
  // "175 3 STREET, Brooklyn, NY, USA" → "175 3 street"; "175 3RD ST" → "175 3 st"
  const first = address.split(',')[0] ?? '';
  return first
    .toLowerCase()
    .replace(/\b(\d+)(st|nd|rd|th)\b/g, '$1')
    .replace(/\bstreet\b/g, 'st')
    .replace(/\bavenue\b/g, 'ave')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
