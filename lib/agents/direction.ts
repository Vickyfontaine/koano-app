// Deterministic DIRECTIONAL nudge — the third instance of the facts-drive pattern
// (after entitlement risk and confidence). The specialist agents regress to
// "hold" (the prompt correctly discourages manufacturing conviction from weak
// signal), so when a site has a CLEAR structural signal the engine says nothing.
// This computes a directional lean from the zoning + permit FACTS and adds it to
// the synthesis score — but ONLY on unambiguous facts, so genuine hold survives.
//
// GUARDS (UI sprint WS1 / Phase 0 item 30-1, kill-list #24). The FAR-headroom
// buy-lean reads "this lot can be built up as-of-right, so a buyer captures the
// upside". That is false, and was shown to be false on the 175 3rd St demo, when:
//   - the lot already has ACTIVE ground-up construction (a new-building,
//     demolition or foundation permit on the subject itself): the upside is being
//     executed by the current owner, not waiting for a buyer;
//   - the building is a CO-OP or CONDO (DOF classes D4/C6/C8, any R-class): the
//     development rights sit with the unit owners collectively, not with a buyer
//     of one unit;
//   - the building is LIKELY RENT-STABILIZED (6+ units, built before 1974):
//     redevelopment is constrained by tenant protections.
// When a guard fires the positive FAR nudge is SUPPRESSED and the site is FLAGGED
// (the driver names the guard), so the verdict math shows why the headroom was
// not counted. The over-max "needs a variance" lean is a subject constraint and
// still applies. Landmark status is not a fact the engine fetches yet (a Phase 0
// data task); Phase 0 added it: an individual landmark or a lot in a historic
// district (MapPLUTO's LPC fields) suppresses the lean the same way.
//
// Pure and client-safe (types only). Returns the nudge (on the score's [-2,2]
// axis) and the drivers, so the panel can SHOW which facts produced the lean.

import type { AgentVerdict } from './shared';

export interface StructuralFacts {
  unusedFarPct: number | null;
  builtFar: number | null;
  maxResidentialFar: number | null;
  maxCommercialFar: number | null;
  newBuildingPermits: number | null; // tract, 24mo
  // Occupancy / tenure facts (regulatory-policy data points).
  buildingClass: string | null;
  residentialUnits: number | null;
  yearBuilt: number | null;
  // Ground-up permits on the SUBJECT lot (infrastructure data points, matched
  // to the subject address): e.g. "Foundation permit issued 2026-03-04".
  subjectActiveConstruction: string[];
  // LPC designations on the subject lot (regulatory-policy data points, Phase 0).
  individualLandmark: string | null;
  historicDistrict: string | null;
}

export interface StructuralDirection {
  nudge: number; // added to the aggregate score; + = buy-ward, − = wait/sell-ward
  drivers: string[]; // the facts that produced the lean (shown to the user)
  // The guard that suppressed the FAR lean, if any (shown as a flag on the site).
  guard: 'active_construction' | 'landmark' | 'coop_condo' | 'likely_stabilized' | null;
}

function num(v: unknown): number | null {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
}

function str(v: unknown): string | null {
  return typeof v === 'string' && v.trim() ? v.trim() : null;
}

// The regulatory agent writes "none" when a lot carries no designation.
function designation(v: unknown): string | null {
  const s = str(v);
  return s && s.toLowerCase() !== 'none' ? s : null;
}

// "175 3 STREET, Brooklyn, NY, USA" and "175 3 STREET" → "175 3 st"; tolerant of
// ordinal suffixes and the usual street-type abbreviations DOF/DOB print.
export function streetKey(address: string): string {
  const first = (address.split(',')[0] ?? '').toLowerCase();
  return first
    .replace(/\b(\d+)(st|nd|rd|th)\b/g, '$1')
    .replace(/\bstreet\b/g, 'st')
    .replace(/\bavenue\b/g, 'ave')
    .replace(/\bboulevard\b/g, 'blvd')
    .replace(/\bplace\b/g, 'pl')
    .replace(/\broad\b/g, 'rd')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const GROUND_UP = /new building|demolition|foundation|excavation|earthwork/i;
const DEAD_STATUS = /expired|revoked|withdrawn|rejected|disapproved/i;

// Pull the structural facts out of the agents' data points (regulatory-policy
// carries zoning + occupancy, infrastructure carries permits). Tolerant to which
// agent holds which point — scans them all. `subjectAddress` (the normalized
// address) lets the subject's OWN permits be told apart from the tract's.
export function extractStructuralFacts(agents: AgentVerdict[], subjectAddress?: string | null): StructuralFacts {
  const byLabel = new Map<string, unknown>();
  for (const a of agents) for (const d of a.data_points) if (!byLabel.has(d.label)) byLabel.set(d.label, d.value);
  const find = (re: RegExp): unknown => Array.from(byLabel).find(([label]) => re.test(label))?.[1];

  const subjectKey = subjectAddress ? streetKey(subjectAddress) : '';
  const subjectActiveConstruction: string[] = [];
  if (subjectKey) {
    for (const [label, value] of Array.from(byLabel)) {
      if (!/^recent_permit_\d+$/.test(label) || typeof value !== 'string') continue;
      // "2026-03-04 — Foundation / Foundation (Permit Issued) @ 175 3 STREET, BROOKLYN"
      const at = value.lastIndexOf(' @ ');
      if (at < 0) continue;
      const where = value.slice(at + 3);
      const what = value.slice(0, at);
      if (streetKey(where) !== subjectKey) continue;
      if (!GROUND_UP.test(what) || DEAD_STATUS.test(what)) continue;
      const date = what.match(/^(\d{4}-\d{2}-\d{2})/)?.[1];
      const kind = what.match(/—\s*([^/(]+)/)?.[1]?.trim() ?? 'ground-up';
      subjectActiveConstruction.push(`${kind} permit${date ? ` issued ${date}` : ''}`);
    }
  }
  // DOB NOW job filings (Phase 0): a New Building or Full Demolition job still in
  // progress on the subject lot, matched by BBL in the provider, so no address
  // match is needed. "New Building job B00123456-I1, Permit Entire, filed 2025-06-02"
  for (const [label, value] of Array.from(byLabel)) {
    if (!/^subject_active_job_\d+$/.test(label) || typeof value !== 'string') continue;
    const m = value.match(/^(.+?) job (\S+), (.+?), filed (\d{4}-\d{2}-\d{2})$/);
    subjectActiveConstruction.push(m ? `${m[1]} job ${m[2]} (${m[3]}, filed ${m[4]})` : value);
  }

  return {
    unusedFarPct: num(find(/^unused_far_pct/)),
    builtFar: num(find(/^built_far$/)),
    maxResidentialFar: num(find(/^max_residential_far$/)),
    maxCommercialFar: num(find(/^max_commercial_far$/)),
    newBuildingPermits: num(find(/^new_building_permits/)),
    buildingClass: str(find(/^building_class$/)),
    residentialUnits: num(find(/^residential_units$/)),
    yearBuilt: num(find(/^year_built$/)),
    subjectActiveConstruction: Array.from(new Set(subjectActiveConstruction)),
    individualLandmark: designation(find(/^individual_landmark$/)),
    historicDistrict: designation(find(/^historic_district$/)),
  };
}

// DOF co-op building classes: D0 (elevator co-op, loft/warehouse conversion),
// D4 (elevator co-op), C6 (walk-up co-op), C8 (walk-up co-op, conversion).
// Condos are any R-class. Shared with the valuation guard.
export const COOP_CLASSES = new Set(['D0', 'D4', 'C6', 'C8']);
export function isCoopOrCondoClass(buildingClass: string | null | undefined): boolean {
  const cls = (buildingClass ?? '').trim().toUpperCase();
  return !!cls && (COOP_CLASSES.has(cls) || /^R/.test(cls));
}

export function occupancyGuard(f: StructuralFacts): { guard: StructuralDirection['guard']; reason: string } | null {
  if (f.subjectActiveConstruction.length > 0) {
    return {
      guard: 'active_construction',
      reason: `active construction on the lot (${f.subjectActiveConstruction.slice(0, 2).join('; ')}): the as-of-right upside is already being executed by the current owner, not waiting for a buyer`,
    };
  }
  if (f.individualLandmark || f.historicDistrict) {
    const what = [f.individualLandmark ? `an individual landmark (${f.individualLandmark.toLowerCase()})` : null, f.historicDistrict ? `in the ${f.historicDistrict}` : null]
      .filter(Boolean)
      .join(' and ');
    return {
      guard: 'landmark',
      reason: `the lot is ${what}: exterior changes and new construction need Landmarks Preservation Commission approval, so the as-of-right upside is not one a buyer can count on`,
    };
  }
  const cls = (f.buildingClass ?? '').toUpperCase();
  if (isCoopOrCondoClass(cls)) {
    return {
      guard: 'coop_condo',
      reason: `${COOP_CLASSES.has(cls) ? 'co-op' : 'condominium'} building class ${cls}: the development rights sit with the unit owners collectively, not with a buyer of one unit`,
    };
  }
  if (f.residentialUnits != null && f.residentialUnits >= 6 && f.yearBuilt != null && f.yearBuilt > 0 && f.yearBuilt < 1974) {
    return {
      guard: 'likely_stabilized',
      reason: `${f.residentialUnits} units built ${f.yearBuilt}, likely rent-stabilized: redevelopment is constrained by tenant protections`,
    };
  }
  return null;
}

export function structuralDirection(f: StructuralFacts): StructuralDirection {
  let nudge = 0;
  const drivers: string[] = [];

  const overMax =
    (f.builtFar != null && f.maxResidentialFar != null && f.maxResidentialFar > 0 && f.builtFar >= f.maxResidentialFar &&
      (f.maxCommercialFar == null || f.maxCommercialFar <= 0 || f.builtFar >= f.maxCommercialFar));
  const zeroHeadroom = f.unusedFarPct != null && f.unusedFarPct <= 0;
  const guard = occupancyGuard(f);

  // Over-max / zero headroom — the SUBJECT can't develop as-of-right; realizing
  // any value needs a discretionary variance. This is a subject-level constraint,
  // so it DOMINATES (and blocks the tract buy-lean below from cancelling it).
  if (zeroHeadroom || overMax) {
    nudge -= 0.7;
    drivers.push('no as-of-right FAR headroom (built at/over the district max): realizing value needs a variance → wait');
  } else if (guard && f.unusedFarPct != null && f.unusedFarPct >= 50) {
    // The headroom is real but a buyer cannot capture it: flag, do not lean.
    drivers.push(`${f.unusedFarPct}% unused FAR not counted as upside: ${guard.reason}`);
  } else if (f.unusedFarPct != null && f.unusedFarPct >= 80) {
    // Very high as-of-right headroom — strong latent development upside.
    nudge += 1.0;
    drivers.push(`${f.unusedFarPct}% unused FAR: large as-of-right development upside → buy`);
  } else if (f.unusedFarPct != null && f.unusedFarPct >= 50) {
    nudge += 0.6;
    drivers.push(`${f.unusedFarPct}% unused FAR: meaningful as-of-right room → buy-lean`);
  }
  // NB: 15–49% headroom deliberately produces NO nudge — that is the ambiguous
  // middle the hold bias is meant to catch.

  // Active ground-up development in the tract reinforces a buy — but only when the
  // subject itself has room (not over-max) and is not guarded, so it never offsets
  // the variance wait and never reads the subject's own job as neighborhood momentum.
  if (!zeroHeadroom && !overMax && !guard && f.newBuildingPermits != null && f.newBuildingPermits >= 3) {
    nudge += 0.3;
    drivers.push(`${f.newBuildingPermits} new-building permits in the tract (24mo): active ground-up development → buy-lean`);
  }

  // Clamp so the nudge complements agent consensus, never steamrolls it.
  return { nudge: Math.max(-1.5, Math.min(1.5, Math.round(nudge * 100) / 100)), drivers, guard: guard?.guard ?? null };
}
