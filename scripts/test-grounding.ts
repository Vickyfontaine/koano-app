// Grounding-detector regression. The case that MUST be covered is the one that
// actually shipped: a single-character coded field ("special_district = G")
// expanded into named entities (Gowanus, Mandatory Inclusionary Housing,
// Superfund) under a valid citation — the exact pattern that defeated the
// structural citation test. Plus clean cases that must NOT false-positive.
// Usage: npx tsx scripts/test-grounding.ts

import { buildAllowedTokens, groundObservation, WITHHELD_OBSERVATION } from '../lib/agents/grounding';
import type { DataPoint } from '../lib/providers/types';

let failures = 0;
function check(name: string, cond: boolean, detail?: string) {
  console.log(`  ${cond ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`);
  if (!cond) failures++;
}

const ADDR = '175 3rd Street, Brooklyn, NY';
const dp = (label: string, value: string | number, source: string): DataPoint => ({
  label,
  value,
  provenance: 'live',
  source,
});

// The exact provider data the regulatory agent actually had.
const ZONING_DATA: DataPoint[] = [
  dp('zoning_district', 'M1-4/R7-2', 'NYC Open Data — MapPLUTO (64uk-42ks)'),
  dp('special_district', 'G', 'NYC Open Data — MapPLUTO (64uk-42ks)'),
  dp('building_class', 'G9', 'NYC Open Data — MapPLUTO (64uk-42ks)'),
];
const allowed = buildAllowedTokens(ZONING_DATA, ADDR);

console.log('\n[1] THE SHIPPED FAILURE — single coded field "G" expanded into named entities');
const SHIPPED =
  "Special District 'G' (Gowanus) is a critical constraint: the Gowanus Special District, adopted in 2021, imposes site-specific requirements including mandatory affordable housing (Mandatory Inclusionary Housing), environmental remediation obligations tied to the Gowanus Superfund site, and design controls.";
const g1 = groundObservation(SHIPPED, allowed);
check('flagged as ungrounded', !g1.grounded);
check('catches "Gowanus"', g1.ungrounded.some((t) => /gowanus/i.test(t)), g1.ungrounded.join(' | '));
check('catches "Mandatory Inclusionary Housing"', g1.ungrounded.some((t) => /inclusionary/i.test(t)));
check('catches "Superfund"', g1.ungrounded.some((t) => /superfund/i.test(t)));
check('catches the year "2021"', g1.ungrounded.includes('2021'));

console.log('\n[2] THE CORRECT VERSION — states the code, does not expand it');
const CLEAN = 'Special district G is in effect on this lot, per the zoning source. Special districts modify as-of-right development.';
check('grounded', groundObservation(CLEAN, allowed).grounded, groundObservation(CLEAN, allowed).ungrounded.join(' | '));

console.log('\n[3] SOURCED specifics survive — a real permit work_type from the data');
const PERMIT_DATA = [dp('recent_permit_4', '2026-03-04 — Foundation / Foundation @ 175 3 STREET', 'NYC Open Data — DOB permits')];
const permitAllowed = buildAllowedTokens(PERMIT_DATA, ADDR);
check('"A Foundation permit was issued on 2026-03-04 at 175 3 Street" grounds', groundObservation('A Foundation permit was issued on 2026-03-04 at 175 3 Street on the subject parcel.', permitAllowed).grounded);

console.log('\n[4] STANDARD DEFINITIONS allowed — FEMA zone meaning + HPD class severity');
const FLOOD_DATA = [dp('in_special_flood_hazard_area', 'false', 'FEMA NFHL')];
check('"outside the Special Flood Hazard Area" grounds', groundObservation('The lot is outside the Special Flood Hazard Area.', buildAllowedTokens(FLOOD_DATA, ADDR)).grounded);
check('"class C violations are immediately hazardous" grounds', groundObservation('Open class C violations are immediately hazardous.', allowed).grounded);

console.log('\n[5] NO false positive on ordinary sentence-initial vocabulary');
for (const s of ['Liquidity is compressed in this submarket.', 'Massive alteration volume dominates the tract.', 'Their portfolio carries no open violations.', 'Gentrification is at an early stage here.', 'Treated as indicative only, the fallback value is modest.']) {
  const r = groundObservation(s, allowed);
  check(`"${s.slice(0, 34)}…" grounds`, r.grounded, r.ungrounded.join(' | '));
}

console.log('\n[6] The withheld message is stable');
check('WITHHELD_OBSERVATION is non-empty and self-describing', /withheld/i.test(WITHHELD_OBSERVATION) && /traced/i.test(WITHHELD_OBSERVATION));

console.log(`\n${failures === 0 ? '✓ ALL GROUNDING CHECKS PASSED' : `✗ ${failures} CHECK(S) FAILED`}\n`);
process.exit(failures === 0 ? 0 : 1);
