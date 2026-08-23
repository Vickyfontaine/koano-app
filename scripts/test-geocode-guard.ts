// Regression guard for the NYC address-resolution failure class (CLAUDE.md §05).
// Bitten twice now: a non-NYC fuzzy match sneaking through, and — this case — a
// genuinely-NYC address whose wrong ZIP made the two geocoders disagree, which
// silently degraded to a confident run on the WRONG building.
//
// The bar: KOANO returns nothing before it returns a confident wrong answer.
// So an ambiguous NYC resolution must REFUSE (ok:false), and a clean NYC address
// must still resolve to its real BBL, confirmed.
//
// Live test (hits NYC GeoSearch + US Census). Run: npm run test:geocode

import { readFileSync } from 'node:fs';
try {
  const env = readFileSync('.env.local', 'utf8');
  for (const l of env.split('\n')) {
    const m = l.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {
  /* rely on shell env */
}

async function main() {
  const { registry } = await import('../lib/providers/registry');
  let failures = 0;
  const check = (name: string, cond: boolean, detail?: string) => {
    console.log(`  ${cond ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`);
    if (!cond) failures++;
  };

  // 1. The exact regression: "175 3 Street, Brooklyn NY 11201". The wrong ZIP
  //    (11201 = Downtown Brooklyn) makes GeoSearch fuzzy-match "175 Adams St"
  //    while Census correctly finds "175 3rd St" (Gowanus) — 2.5 km apart. Both
  //    are NYC, so we cannot pick a building: REFUSE.
  console.log('\nBad-ZIP NYC address (must refuse, not degrade):');
  const bad = await registry.geocode.resolve('175 3 Street, Brooklyn NY 11201');
  check('refuses to resolve (ok:false)', bad.ok === false, `ok=${bad.ok}`);
  check('returns no data', bad.data == null, bad.data ? 'DATA PRESENT (should be null)' : 'null');
  check(
    'error explains the ambiguity',
    !!bad.error && /candidate|km apart|ambiguous|check the address/i.test(bad.error),
    bad.error ? `"${bad.error.slice(0, 90)}…"` : 'no error message',
  );

  // 2. The clean address must still resolve to the real BBL, confirmed.
  console.log('\nCorrect address (must resolve with BBL, confirmed):');
  const good = await registry.geocode.resolve('175 3rd Street, Brooklyn, NY 11215');
  check('resolves (ok:true)', good.ok === true, `ok=${good.ok}`);
  check('real BBL 3009720058', good.data?.bbl === '3009720058', `bbl=${good.data?.bbl}`);
  check('borough Brooklyn', good.data?.borough === 'Brooklyn', `borough=${good.data?.borough}`);
  check(
    'location_confidence = confirmed',
    good.data?.location_confidence === 'confirmed',
    good.data?.location_confidence,
  );

  console.log(failures === 0 ? '\nALL PASSED\n' : `\n${failures} CHECK(S) FAILED\n`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((e) => {
  console.error('geocode guard test errored:', e);
  process.exit(1);
});
