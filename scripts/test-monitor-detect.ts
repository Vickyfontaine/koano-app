// Unit tests for the deterministic monitoring diff engine (lib/monitor/detect).
// No DB, no network — pure functions on synthetic snapshots.
//   npm run test:monitor
//
// FIRST-CLASS scenario (not an edge case): "no prior snapshot". Almost every
// property is in this state right now, so it is the most likely path to run in
// production this Monday. A single-snapshot property MUST produce zero changes,
// and a newly-tracked property MUST baseline silently.

import {
  detectViolations, detectOwnership, detectFilings, detectContamination, detectDisaster, detectComp,
  renderNotification, THRESHOLDS,
  type RawChange, type ViolationsData, type LandlordData, type FilingsData,
  type ContaminationData, type DisasterData, type CompData,
} from '../lib/monitor/detect';

let failures = 0;
function ok(cond: boolean, msg: string) {
  if (cond) console.log(`  ✓ ${msg}`);
  else { console.error(`  ✗ ${msg}`); failures++; }
}
function eq<T>(a: T, b: T, msg: string) { ok(JSON.stringify(a) === JSON.stringify(b), `${msg} (${JSON.stringify(a)} === ${JSON.stringify(b)})`); }

// --- synthetic snapshots ------------------------------------------------------
const V = (over: Partial<ViolationsData> = {}): ViolationsData => ({
  hpd_open: 0, hpd_total: 0, hpd_open_by_class: { A: 0, B: 0, C: 0, I: 0 },
  ecb_active: 0, ecb_total: 0, dob_active: 0, dob_total: 0, hpd_registered: true, ...over,
});
const L = (over: Partial<LandlordData> = {}): LandlordData => ({ registered_owner: 'ACME HOLDINGS LLC', on_speculation_watch_list: false, ...over });
const F = (over: Partial<FilingsData> = {}): FilingsData => ({ subject_filing_count: 2, community_district: '306', ...over });
const C = (over: Partial<ContaminationData> = {}): ContaminationData => ({ radius_mi: 2, superfund_sites_within_radius: 1, brownfield_within_radius: 3, nearest_site_name: 'GOWANUS CANAL', nearest_site_distance_mi: 0.3, ...over });
const D = (over: Partial<DisasterData> = {}): DisasterData => ({ total_declarations: 24, most_recent_declaration: '2024-01 — Flood', ...over });
const CP = (over: Partial<CompData> = {}): CompData => ({ median_price_per_sqft: 100, sales_count: 10, price_trend: 'flat', ...over });

// =============================================================================
console.log('\n[1] NO PRIOR SNAPSHOT — first-class: baseline established, zero changes');
// Every detector, prior = null → [].
eq(detectViolations(null, V({ hpd_open: 9, hpd_open_by_class: { A: 1, B: 2, C: 3, I: 0 } })), [], 'violations: no prior → no change');
eq(detectOwnership(null, L({ registered_owner: 'NEW OWNER LLC' })), [], 'ownership: no prior → no change');
eq(detectFilings(null, F({ subject_filing_count: 99 })), [], 'filings: no prior → no change');
eq(detectContamination(null, C({ superfund_sites_within_radius: 12 })), [], 'contamination: no prior → no change');
eq(detectDisaster(null, D({ total_declarations: 99 })), [], 'disaster: no prior → no change');
eq(detectComp(null, CP({ median_price_per_sqft: 999 })), [], 'comp: no prior → no change');

console.log('\n[2] NEWLY-TRACKED PROPERTY — one snapshot, all detectors, silent baseline');
const firstRun: RawChange[] = [
  ...detectViolations(null, V({ hpd_open: 5 })),
  ...detectOwnership(null, L()),
  ...detectFilings(null, F()),
  ...detectContamination(null, C()),
  ...detectDisaster(null, D()),
  ...detectComp(null, CP()),
];
eq(firstRun.length, 0, 'a property with only a current snapshot produces zero notifications');

// =============================================================================
console.log('\n[3] THRESHOLDS — noise stays silent, real change fires');
// violations
eq(detectViolations(V(), V()).length, 0, 'violations: unchanged → no change');
eq(detectViolations(V({ hpd_open: 0, hpd_open_by_class: { A: 2, B: 0, C: 0, I: 0 } }), V({ hpd_open: 0, hpd_open_by_class: { A: 2, B: 0, C: 0, I: 0 } })).length, 0, 'violations: class A flat → no change');
{ const a = V({ hpd_open: 0, hpd_open_by_class: { A: 0, B: 0, C: 0, I: 0 } }); const b = V({ hpd_open: 2, hpd_open_by_class: { A: 2, B: 0, C: 0, I: 0 } });
  eq(detectViolations(a, b).length, 0, `violations: class A +2 (< ${THRESHOLDS.classAMinDelta}) → no change (noise muted)`); }
{ const a = V({ hpd_open: 0, hpd_open_by_class: { A: 0, B: 0, C: 0, I: 0 } }); const b = V({ hpd_open: 1, hpd_open_by_class: { A: 0, B: 0, C: 1, I: 0 } });
  const r = detectViolations(a, b);
  ok(r.length === 1 && r[0].signal_type === 'violation_new' && r[0].severity === 'high', 'violations: new Class C → violation_new, severity high');
  eq([r[0].before, r[0].after], [0, 1], 'violations: before/after = total open, verbatim'); }
{ const a = V({ hpd_open: 5, hpd_open_by_class: { A: 0, B: 0, C: 5, I: 0 } }); const b = V({ hpd_open: 2, hpd_open_by_class: { A: 0, B: 0, C: 2, I: 0 } });
  const r = detectViolations(a, b);
  ok(r.some((c) => c.signal_type === 'violation_resolved' && c.facts.resolved === 3), 'violations: net decrease → violation_resolved (resolved=3)'); }
// ownership
eq(detectOwnership(L(), L()).length, 0, 'ownership: same owner → no change');
eq(detectOwnership(L({ registered_owner: null }), L({ registered_owner: 'X LLC' })).length, 0, 'ownership: null→named (unregistered→registered) → no change');
{ const r = detectOwnership(L({ registered_owner: 'ACME HOLDINGS LLC' }), L({ registered_owner: 'VERNON PROPCO LLC' }));
  ok(r.length === 1 && r[0].severity === 'high', 'ownership: owner change → ownership_change high');
  eq([r[0].before, r[0].after], ['ACME HOLDINGS LLC', 'VERNON PROPCO LLC'], 'ownership: before/after = literal owner strings'); }
{ const r = detectOwnership(L({ on_speculation_watch_list: false }), L({ on_speculation_watch_list: true }));
  ok(r.length === 1 && r[0].facts.watch_list_only === true && r[0].severity === 'material', 'ownership: watch-list flip only → material'); }
// filings
eq(detectFilings(F({ subject_filing_count: 2 }), F({ subject_filing_count: 2 })).length, 0, 'filings: unchanged → no change');
{ const r = detectFilings(F({ subject_filing_count: 2 }), F({ subject_filing_count: 3 }));
  ok(r.length === 1 && r[0].signal_type === 'permit' && r[0].facts.new_filings === 1, 'filings: +1 → permit (new_filings=1)'); }
// contamination
eq(detectContamination(C(), C()).length, 0, 'contamination: unchanged → no change');
{ const r = detectContamination(C({ superfund_sites_within_radius: 1 }), C({ superfund_sites_within_radius: 2 }));
  ok(r.length === 1 && r[0].severity === 'high', 'contamination: new Superfund → high'); }
{ const r = detectContamination(C({ superfund_sites_within_radius: 1, brownfield_within_radius: 3 }), C({ superfund_sites_within_radius: 1, brownfield_within_radius: 4 }));
  ok(r.length === 1 && r[0].severity === 'material' && r[0].facts.kind === 'brownfield', 'contamination: new brownfield → material'); }
// disaster
eq(detectDisaster(D({ total_declarations: 24 }), D({ total_declarations: 24 })).length, 0, 'disaster: unchanged → no change');
{ const r = detectDisaster(D({ total_declarations: 24 }), D({ total_declarations: 25 }));
  ok(r.length === 1 && r[0].signal_type === 'disaster', 'disaster: +1 declaration → disaster'); }
// comp
eq(detectComp(CP({ median_price_per_sqft: 100 }), CP({ median_price_per_sqft: 104 })).length, 0, 'comp: +4% (< 5%) → no change (noise muted)');
eq(detectComp(CP({ median_price_per_sqft: 100, sales_count: 10 }), CP({ median_price_per_sqft: 120, sales_count: 3 })).length, 0, 'comp: +20% but only 3 sales (< 5) → no change (small-sample noise)');
{ const r = detectComp(CP({ median_price_per_sqft: 100, sales_count: 10 }), CP({ median_price_per_sqft: 106, sales_count: 10 }));
  ok(r.length === 1 && r[0].signal_type === 'comp_price', 'comp: +6% with 10 sales → comp_price');
  eq(r[0].facts.pct_change, 6, 'comp: pct_change = transparent arithmetic of before/after (6.0)'); }

// =============================================================================
console.log('\n[4] GROUNDING DISCIPLINE — structural: only verbatim values + fixed template');
// Gather one RawChange of every signal_type.
const samples: RawChange[] = [
  detectViolations(V({ hpd_open: 0, hpd_open_by_class: { A: 0, B: 0, C: 0, I: 0 } }), V({ hpd_open: 1, hpd_open_by_class: { A: 0, B: 0, C: 1, I: 0 } }))[0],
  detectViolations(V({ hpd_open: 5, hpd_open_by_class: { A: 0, B: 0, C: 5, I: 0 } }), V({ hpd_open: 2, hpd_open_by_class: { A: 0, B: 0, C: 2, I: 0 } }))[0],
  detectOwnership(L({ registered_owner: 'ACME HOLDINGS LLC' }), L({ registered_owner: 'VERNON PROPCO LLC' }))[0],
  detectFilings(F({ subject_filing_count: 2 }), F({ subject_filing_count: 3 }))[0],
  detectContamination(C({ superfund_sites_within_radius: 1 }), C({ superfund_sites_within_radius: 2 }))[0],
  detectDisaster(D({ total_declarations: 24 }), D({ total_declarations: 25 }))[0],
  detectComp(CP({ median_price_per_sqft: 100, sales_count: 10 }), CP({ median_price_per_sqft: 106, sales_count: 10 }))[0],
];

// (a) A RawChange has NO free-text field — the detector cannot write prose.
const allowedKeys = new Set(['signal_type', 'severity', 'before', 'after', 'facts']);
ok(samples.every((s) => Object.keys(s).every((k) => allowedKeys.has(k))), 'RawChange has no title/body/message field — detector cannot emit prose');

// (b) render is a PURE function of the RawChange (same input → same output).
ok(samples.every((s) => JSON.stringify(renderNotification(s)) === JSON.stringify(renderNotification(s))), 'renderNotification is pure (deterministic)');

// (c) NO computed adjective / unsupported severity language / inference anywhere.
const FORBIDDEN = ['surging', 'surge', 'significant', 'significantly', 'concerning', 'alarming', 'sharp', 'sharply',
  'hot', 'cooling', 'booming', 'plummet', 'soaring', 'likely', 'suggests', 'appears', 'seems', 'dramatic', 'massive', 'huge', 'worrying', 'danger'];
for (const s of samples) {
  const text = `${renderNotification(s).title} ${renderNotification(s).body}`.toLowerCase();
  const hit = FORBIDDEN.find((w) => new RegExp(`\\b${w}\\b`).test(text));
  ok(!hit, `no adjective/inference in ${s.signal_type}${hit ? ` (found "${hit}")` : ''}`);
}

// (d) Every dynamic value shown is a literal from the RawChange (before/after/facts).
for (const s of samples) {
  // Strip thousands separators — a formatted "$1,085" still shows the literal 1085.
  const body = renderNotification(s).body.replace(/,/g, '');
  const vals = [s.before, s.after, ...Object.values(s.facts)].filter((v) => v !== '' && v !== null && v !== false && v !== -1).map(String);
  ok(vals.every((v) => body.includes(v)), `${s.signal_type}: body shows only literal RawChange values`);
}

// (e) Ownership wording: the sale-vs-re-registration ambiguity leads (amendment 3).
{ const body = renderNotification(detectOwnership(L({ registered_owner: 'ACME HOLDINGS LLC' }), L({ registered_owner: 'VERNON PROPCO LLC' }))[0]).body;
  ok(/may be a sale/i.test(body) && /re-registering/i.test(body), 'ownership: notification leads with the sale-vs-re-registration ambiguity'); }

console.log(`\n${failures === 0 ? '✓ ALL MONITOR-DETECT CHECKS PASSED' : `✗ ${failures} CHECK(S) FAILED`}`);
process.exit(failures === 0 ? 0 : 1);
