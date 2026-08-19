// Permits provider sanity harness — a loud guard against the two SILENT bugs
// that have surfaced in this provider:
//   1. DOB NOW vs legacy gap (subject-BBL history read empty for pre-2021 lots);
//   2. census-tract matching failure (whole-number tracts like 137.00 matched
//      nothing and fell back to the subject BBL's own count → "0 neighborhood
//      permits"), which then rendered as a market conclusion in a client doc.
//
// It hits a set of KNOWN, genuinely-active NYC addresses spanning WHOLE-NUMBER
// and DECIMAL census tracts and asserts the neighborhood count is (a) LIVE,
// (b) TRACT-scoped (not a silent fall-back to the subject BBL), and (c) at least
// a conservative floor — so a fall-back to zero or to a subject count FAILS
// LOUDLY here instead of shipping as a plausible-looking figure.
//
// Run: npx tsx scripts/test-permits-sanity.ts

import { loadEnv } from './_loadenv';
loadEnv();
import { registry } from '../lib/providers/registry';

interface Case {
  address: string;
  tract: 'whole' | 'decimal'; // '.00' suffix vs '.NN' — the two format classes
  minPermits: number; // conservative floor for this known-active tract
}

// Thresholds are set well BELOW observed counts so the test guards against a
// silent collapse (0 / single-digit subject count) without flaking on normal
// month-to-month variation.
const CASES: Case[] = [
  { address: '369 6th Street, Brooklyn, NY', tract: 'whole', minPermits: 40 }, // tract 137.00 — the exact bug case
  { address: '350 5th Avenue, New York, NY', tract: 'whole', minPermits: 100 }, // tract 76.00 — whole-number, Midtown
  { address: '175 3rd Street, Brooklyn, NY', tract: 'decimal', minPermits: 100 }, // tract 119.01 — Gowanus
  { address: '30-30 Northern Boulevard, Long Island City, NY', tract: 'decimal', minPermits: 25 }, // 171.02
  { address: '1 Bay Street, Staten Island, NY', tract: 'decimal', minPermits: 40 }, // 516.01
];

let failures = 0;
function check(name: string, cond: boolean, detail: string) {
  console.log(`  ${cond ? '✓' : '✗'} ${name} — ${detail}`);
  if (!cond) failures++;
}

(async () => {
  console.log('\nPermits sanity — neighborhood counts must be live, tract-scoped, and plausible\n');
  for (const c of CASES) {
    const geo = await registry.geocode.resolve(c.address);
    if (!geo.ok || !geo.data) {
      check(c.address, false, 'geocode failed');
      continue;
    }
    const tc = geo.data.tract_code ?? '';
    const suffix = tc.slice(-2);
    const isWhole = suffix === '00';
    const res = await registry.permits.getPermits(geo.data);
    const p = res.data;
    if (!p) {
      check(c.address, false, 'no permits data returned');
      continue;
    }
    const tractScoped = /Census tract/.test(p.scope_note); // vs the "Subject BBL" fall-back
    const label = `${c.address} (tract ${tc}, ${isWhole ? 'whole' : 'decimal'})`;

    // The tract class must match what we expect (guards the whole/decimal split).
    check(`${label}: tract class`, (c.tract === 'whole') === isWhole, `expected ${c.tract}`);
    // (a) live — not a representative fall-back from a failed DOB call.
    check(`${label}: provenance live`, res.provenance === 'live', res.provenance);
    // (b) tract-scoped — the silent subject-BBL fall-back would say "Subject BBL".
    check(`${label}: tract-scoped (not subject-BBL fallback)`, tractScoped, tractScoped ? 'tract' : `SUBJECT-BBL FALLBACK: "${p.scope_note}"`);
    // (c) plausible floor — a collapse to 0 / a subject count fails here.
    check(`${label}: count >= ${c.minPermits}`, p.total_permits_24mo >= c.minPermits, `${p.total_permits_24mo} permits/24mo`);
  }

  console.log(`\n${failures === 0 ? '✓ ALL PERMITS SANITY CHECKS PASSED' : `✗ ${failures} CHECK(S) FAILED`}\n`);
  process.exit(failures === 0 ? 0 : 1);
})();
