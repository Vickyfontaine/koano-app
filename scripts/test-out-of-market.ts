// Slice 1 verification — out-of-market fabrication kill.
//   NYC address     → every municipal provider still LIVE with non-null data
//                     (proves the hard constraint: NYC path untouched).
//   Non-NYC address → every municipal provider returns coverage-absent
//                     (data === null, honest note), NEVER a stand-in value.
// LLM-free and deterministic — provider layer only.
// Usage: npx tsx scripts/test-out-of-market.ts

import { loadEnv } from './_loadenv';
loadEnv();
import { registry } from '../lib/providers/registry';
import type { ProviderResult, ResolvedAddress } from '../lib/providers/types';

const NYC = '175 3rd Street, Brooklyn, NY';
const NON_NYC = '233 S Wacker Dr, Chicago, IL 60606';

// The six municipal providers changed in Slice 1 (nyc-sales + nyc-geometry were
// already coverage-clean, so they are not asserted here).
const MUNI: { name: string; call: (a: ResolvedAddress) => Promise<ProviderResult<unknown>> }[] = [
  { name: 'zoning', call: (a) => registry.zoning.getZoning(a) },
  { name: 'permits', call: (a) => registry.permits.getPermits(a) },
  { name: 'violations', call: (a) => registry.buildingViolations.getViolations(a) },
  { name: 'landlord', call: (a) => registry.landlordPortfolio.getPortfolio(a) },
  { name: 'entitlement', call: (a) => registry.entitlement.getEntitlement(a) },
  { name: 'assemblage', call: (a) => registry.assemblage.getAssemblage(a) },
];

let failures = 0;
function check(name: string, cond: boolean, detail?: string) {
  console.log(`  ${cond ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`);
  if (!cond) failures++;
}

(async () => {
  console.log(`\n[NYC] ${NYC} — municipal layer must stay LIVE with real data (hard constraint)`);
  const nyc = await registry.geocode.resolve(NYC);
  check('NYC address resolved with a BBL', !!nyc.data?.bbl, nyc.data?.bbl ?? 'none');
  if (nyc.data) {
    const results = await Promise.all(MUNI.map((m) => m.call(nyc.data as ResolvedAddress)));
    MUNI.forEach((m, i) => {
      const r = results[i];
      check(
        `${m.name}: live + non-null data`,
        r.provenance === 'live' && r.data !== null,
        `prov=${r.provenance} data=${r.data === null ? 'null' : 'present'}`,
      );
    });
  }

  console.log(`\n[NON-NYC] ${NON_NYC} — municipal layer must be COVERAGE-ABSENT, never a stand-in`);
  const chi = await registry.geocode.resolve(NON_NYC);
  check('non-NYC address resolved with NULL bbl', !!chi.data && chi.data.bbl === null, `bbl=${chi.data?.bbl ?? 'null'}`);
  if (chi.data) {
    const results = await Promise.all(MUNI.map((m) => m.call(chi.data as ResolvedAddress)));
    MUNI.forEach((m, i) => {
      const r = results[i];
      // The core assertion: data is null (no fabricated figure) and the note names
      // the layer + says it is a coverage gap.
      const noteOk = !!r.error && /coverage/i.test(r.error) && !/typical|profile/i.test(r.error);
      check(
        `${m.name}: data === null (no stand-in) + honest coverage note`,
        r.data === null && noteOk,
        `data=${r.data === null ? 'null' : 'PRESENT(!)'} note="${(r.error ?? '').slice(0, 60)}…"`,
      );
    });
  }

  console.log(`\n${failures === 0 ? '✓ SLICE 1 PROVIDER-LEVEL CHECKS PASSED' : `✗ ${failures} CHECK(S) FAILED`}\n`);
  process.exit(failures === 0 ? 0 : 1);
})();
