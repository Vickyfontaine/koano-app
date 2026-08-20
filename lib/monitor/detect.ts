// KOANO monitoring — the deterministic change-detection engine.
//
// Pure functions: (priorSnapshotData | null, currentSnapshotData) -> RawChange[].
// NO database, NO network, NO model call, NO Date/now. Given the same two
// snapshots it always produces the same changes — so a notification is as
// reproducible as the reasoning chain.
//
// GROUNDING DISCIPLINE (enforced STRUCTURALLY, not by prompt):
//   1. A RawChange has NO free-text field. The detector cannot write prose — it
//      only copies literal values out of the snapshot `data` (before/after/facts)
//      and picks a signal_type + severity from fixed rules.
//   2. Human text (title/body) is produced later by renderNotification(), which
//      receives ONLY a RawChange and interpolates its literal values into FIXED
//      template strings. There is no place to inject a computed adjective, an
//      unsupported severity word, or an inference — the template literals are the
//      only prose, and they are written here, once, under review.
//   3. `severity` is an enum from literal comparisons, never language.
// A notification is a factual claim that leaves the product by email; this is the
// same rigor as the reasoning-chain grounding gate, made impossible to violate.
//
// NO-PRIOR IS A FIRST-CLASS CASE, not an edge case: with ~1 week of history
// almost every property has a single snapshot. Every detector returns [] when
// prior is null — a baseline, never a change. The first run is therefore silent
// by construction; a wave of false notifications cannot happen.

export type Severity = 'info' | 'material' | 'high';
export type SignalType =
  | 'permit'
  | 'violation_new'
  | 'violation_resolved'
  | 'ownership_change'
  | 'contamination'
  | 'disaster'
  | 'comp_price';

// A detected change: literal snapshot values + a fixed classification. NO title/
// body — those are rendered later from a fixed template. `before`/`after` and
// every value in `facts` are copied verbatim from snapshot `data` (or are a
// transparent arithmetic delta of two such values, e.g. a count or a %).
export interface RawChange {
  signal_type: SignalType;
  severity: Severity;
  before: string | number | boolean | null;
  after: string | number | boolean | null;
  facts: Record<string, string | number | boolean>;
}

const SEVERITY_RANK: Record<Severity, number> = { info: 0, material: 1, high: 2 };
function maxSev(a: Severity | null, b: Severity): Severity {
  if (!a) return b;
  return SEVERITY_RANK[a] >= SEVERITY_RANK[b] ? a : b;
}

// --- snapshot `data` shapes (exactly what lib/archive/capture.ts writes) ------

export interface ViolationsData {
  hpd_open: number;
  hpd_total: number;
  hpd_open_by_class: { A: number; B: number; C: number; I: number };
  ecb_active: number;
  ecb_total: number;
  dob_active: number;
  dob_total: number;
  hpd_registered: boolean;
}
export interface LandlordData {
  registered_owner: string | null;
  on_speculation_watch_list: boolean;
}
export interface FilingsData {
  subject_filing_count: number;
  community_district: string | null;
}
export interface ContaminationData {
  radius_mi: number;
  superfund_sites_within_radius: number;
  brownfield_within_radius: number;
  nearest_site_name: string | null;
  nearest_site_distance_mi: number | null;
}
export interface DisasterData {
  total_declarations: number;
  most_recent_declaration: string | null;
}
export interface CompData {
  median_price_per_sqft: number;
  sales_count: number;
  price_trend: string;
}

// Thresholds — tuned so a user is not notified about noise (Section: material
// change). Class A (non-hazardous) churns, so it needs a larger delta; comp
// medians on small samples are noisy, so they need a % floor AND a sample floor.
export const THRESHOLDS = {
  classAMinDelta: 3,
  compMinPct: 0.05,
  compMinSales: 5,
} as const;

// --- detectors (each: prior|null, current -> RawChange[]) ---------------------

export function detectViolations(prior: ViolationsData | null, current: ViolationsData): RawChange[] {
  if (!prior) return []; // no baseline -> silent (first-class case)
  const out: RawChange[] = [];
  const pc = prior.hpd_open_by_class;
  const cc = current.hpd_open_by_class;

  const facts: Record<string, number> = {};
  let sev: Severity | null = null;
  if (cc.C > pc.C) { facts.class_c_before = pc.C; facts.class_c_after = cc.C; sev = maxSev(sev, 'high'); }
  if (cc.B > pc.B) { facts.class_b_before = pc.B; facts.class_b_after = cc.B; sev = maxSev(sev, 'material'); }
  if (current.ecb_active > prior.ecb_active) { facts.ecb_before = prior.ecb_active; facts.ecb_after = current.ecb_active; sev = maxSev(sev, 'material'); }
  if (cc.A - pc.A >= THRESHOLDS.classAMinDelta) { facts.class_a_before = pc.A; facts.class_a_after = cc.A; sev = maxSev(sev, 'info'); }
  if (sev) {
    out.push({ signal_type: 'violation_new', severity: sev, before: prior.hpd_open, after: current.hpd_open, facts });
  }

  // Resolution: net decrease in total open HPD violations (good news).
  if (current.hpd_open < prior.hpd_open) {
    out.push({
      signal_type: 'violation_resolved',
      severity: 'info',
      before: prior.hpd_open,
      after: current.hpd_open,
      facts: { resolved: prior.hpd_open - current.hpd_open },
    });
  }
  return out;
}

export function detectOwnership(prior: LandlordData | null, current: LandlordData): RawChange[] {
  if (!prior) return [];
  const ownerChanged =
    !!prior.registered_owner && !!current.registered_owner && prior.registered_owner !== current.registered_owner;
  const watchFlip = !prior.on_speculation_watch_list && current.on_speculation_watch_list;

  if (ownerChanged) {
    return [{
      signal_type: 'ownership_change',
      severity: 'high',
      before: prior.registered_owner,
      after: current.registered_owner,
      facts: { watch_list_added: watchFlip },
    }];
  }
  if (watchFlip) {
    return [{
      signal_type: 'ownership_change',
      severity: 'material',
      before: false,
      after: true,
      facts: { watch_list_only: true },
    }];
  }
  return [];
}

export function detectFilings(prior: FilingsData | null, current: FilingsData): RawChange[] {
  if (!prior) return [];
  if (current.subject_filing_count > prior.subject_filing_count) {
    return [{
      signal_type: 'permit',
      severity: 'material',
      before: prior.subject_filing_count,
      after: current.subject_filing_count,
      facts: { new_filings: current.subject_filing_count - prior.subject_filing_count },
    }];
  }
  return [];
}

export function detectContamination(prior: ContaminationData | null, current: ContaminationData): RawChange[] {
  if (!prior) return [];
  if (current.superfund_sites_within_radius > prior.superfund_sites_within_radius) {
    return [{
      signal_type: 'contamination',
      severity: 'high',
      before: prior.superfund_sites_within_radius,
      after: current.superfund_sites_within_radius,
      facts: {
        radius_mi: current.radius_mi,
        nearest_site_name: current.nearest_site_name ?? '',
        nearest_site_distance_mi: current.nearest_site_distance_mi ?? -1,
      },
    }];
  }
  if (current.brownfield_within_radius > prior.brownfield_within_radius) {
    return [{
      signal_type: 'contamination',
      severity: 'material',
      before: prior.brownfield_within_radius,
      after: current.brownfield_within_radius,
      facts: { radius_mi: current.radius_mi, kind: 'brownfield' },
    }];
  }
  return [];
}

export function detectDisaster(prior: DisasterData | null, current: DisasterData): RawChange[] {
  if (!prior) return [];
  if (current.total_declarations > prior.total_declarations) {
    return [{
      signal_type: 'disaster',
      severity: 'material',
      before: prior.total_declarations,
      after: current.total_declarations,
      facts: { most_recent: current.most_recent_declaration ?? '' },
    }];
  }
  return [];
}

// Comp: `baseline` is chosen by the caller (Slice 4) — the ~4-week-prior
// snapshot, not necessarily last week — to avoid re-firing on a sustained move.
export function detectComp(baseline: CompData | null, current: CompData): RawChange[] {
  if (!baseline) return [];
  if (current.sales_count < THRESHOLDS.compMinSales || baseline.sales_count < THRESHOLDS.compMinSales) return [];
  if (baseline.median_price_per_sqft <= 0) return [];
  const pct = (current.median_price_per_sqft - baseline.median_price_per_sqft) / baseline.median_price_per_sqft;
  if (Math.abs(pct) < THRESHOLDS.compMinPct) return [];
  return [{
    signal_type: 'comp_price',
    severity: 'material',
    before: baseline.median_price_per_sqft,
    after: current.median_price_per_sqft,
    // pct is a transparent arithmetic of the two verbatim values above.
    facts: { pct_change: Math.round(pct * 1000) / 10, sales_count: current.sales_count },
  }];
}

// --- fixed templates: RawChange -> { title, body } ----------------------------
// The ONLY prose in a notification. Written once, here, under review. Each reads
// only literal values off the RawChange. Words like "immediately hazardous" are
// STANDARD DEFINITIONS of a coded field (HPD Class C), not interpretation.

// Thousands separators on displayed numbers ($1,085 not $1085) — every other
// KOANO surface does this. Formats a verbatim value; does not alter it.
function fmtNum(v: string | number | boolean | null): string {
  return typeof v === 'number' && Number.isFinite(v) ? v.toLocaleString('en-US') : String(v);
}

function violationNewBody(f: Record<string, string | number | boolean>): string {
  const parts: string[] = [];
  if ('class_c_before' in f) parts.push(`Class C (immediately hazardous): ${f.class_c_before} → ${f.class_c_after}`);
  if ('class_b_before' in f) parts.push(`Class B (hazardous): ${f.class_b_before} → ${f.class_b_after}`);
  if ('ecb_before' in f) parts.push(`ECB active: ${f.ecb_before} → ${f.ecb_after}`);
  if ('class_a_before' in f) parts.push(`Class A (non-hazardous): ${f.class_a_before} → ${f.class_a_after}`);
  return `${parts.join('; ')}.`;
}

const TEMPLATES: Record<SignalType, (r: RawChange) => { title: string; body: string }> = {
  violation_new: (r) => ({
    title: r.severity === 'high' ? 'New immediately-hazardous (Class C) HPD violation' : 'New HPD/ECB violation',
    body: violationNewBody(r.facts),
  }),
  violation_resolved: (r) => ({
    title: 'HPD violations resolved',
    body: `Open HPD violations: ${r.before} → ${r.after} (${r.facts.resolved} resolved).`,
  }),
  ownership_change: (r) =>
    r.facts.watch_list_only
      ? {
          title: 'Added to the NYC Speculation Watch List',
          body: 'This building was added to the NYC Speculation Watch List (a signal of possible speculative purchase). Ownership on the tax registration is unchanged.',
        }
      : {
          // Amendment: the sale-vs-re-registration ambiguity leads, not a parenthetical.
          title: 'Ownership record changed',
          body:
            `This may be a sale OR the same owner re-registering under a slightly different name — KOANO matches names exactly and cannot tell the two apart. ` +
            `Registered owner: ${r.before} → ${r.after}.`,
        },
  permit: (r) => ({
    title: 'New filing on the subject lot',
    body: `Subject-lot DOB job filings: ${r.before} → ${r.after} (${r.facts.new_filings} new).`,
  }),
  contamination: (r) =>
    r.facts.kind === 'brownfield'
      ? {
          title: `New brownfield site within ${r.facts.radius_mi} miles`,
          body: `Brownfield (ACRES) sites within ${r.facts.radius_mi} mi: ${r.before} → ${r.after}.`,
        }
      : {
          title: `New Superfund site within ${r.facts.radius_mi} miles`,
          body:
            `Superfund (SEMS) sites within ${r.facts.radius_mi} mi: ${r.before} → ${r.after}.` +
            (r.facts.nearest_site_name ? ` Nearest: ${r.facts.nearest_site_name} at ${r.facts.nearest_site_distance_mi} mi.` : ''),
        },
  disaster: (r) => ({
    title: 'New federal disaster declaration for this county',
    body:
      `Federal disaster declarations for this county (all-time): ${r.before} → ${r.after}.` +
      (r.facts.most_recent ? ` Most recent: ${r.facts.most_recent}.` : '') +
      // FEMA's required non-endorsement notice — this is FEMA data, and it leaves
      // the product by email, so the disclaimer travels with it.
      ' This product uses the FEMA OpenFEMA API but is not endorsed by FEMA.',
  }),
  comp_price: (r) => ({
    title: 'Comp price movement in this ZIP',
    body: `Median recorded $/sq ft in this ZIP: $${fmtNum(r.before)} → $${fmtNum(r.after)} (${r.facts.pct_change}%), over ${fmtNum(r.facts.sales_count)} recorded sales.`,
  }),
};

export function renderNotification(r: RawChange): { title: string; body: string } {
  return TEMPLATES[r.signal_type](r);
}
