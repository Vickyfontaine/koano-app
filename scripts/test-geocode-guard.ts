// Regression guard for the NYC address-resolution failure class (CLAUDE.md §05).
// Bitten twice: a non-NYC fuzzy match sneaking through, and a genuinely-NYC
// address whose wrong ZIP made the two geocoders disagree.
//
// The bar: KOANO returns nothing before it returns a confident wrong answer —
// but a wall was the wrong end state. An ambiguous NYC address must now surface
// BOTH candidates for the user to disambiguate (never silently pick), and the
// chosen candidate must re-derive its real BBL server-side, confirmed. A clean
// NYC address still resolves to its real BBL, confirmed, in one shot.
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
  //    are NYC, so we cannot pick a building: surface BOTH candidates.
  console.log('\nBad-ZIP NYC address (must disambiguate, not wall or degrade):');
  const bad = await registry.geocode.resolveDetailed('175 3 Street, Brooklyn NY 11201');
  check('is ambiguous', bad.kind === 'ambiguous', `kind=${bad.kind}`);
  const candidates = bad.kind === 'ambiguous' ? bad.candidates : [];
  check('offers >= 2 candidates', candidates.length >= 2, `n=${candidates.length}`);
  const exact = candidates.find((c) => c.match_reason === 'Exact street match');
  check(
    'ranks an exact-street candidate first',
    candidates[0]?.match_reason === 'Exact street match',
    `top="${candidates[0]?.match_reason}" (${candidates[0]?.label ?? '—'})`,
  );
  check(
    'the exact-street candidate is the 3rd St (Gowanus) building',
    !!exact && /3RD ST|3 ST/i.test(exact.label),
    exact ? `"${exact.label}"` : 'no exact-street candidate',
  );

  // 2. Selecting the correct candidate re-derives its real BBL server-side.
  console.log('\nSelecting the correct candidate (BBL re-derived server-side):');
  if (exact) {
    const picked = await registry.geocode.resolveCandidate(exact);
    check('resolves (ok:true)', picked.ok === true, `ok=${picked.ok}`);
    check('real BBL 3009720058', picked.data?.bbl === '3009720058', `bbl=${picked.data?.bbl}`);
    check(
      'location_confidence = confirmed',
      picked.data?.location_confidence === 'confirmed',
      picked.data?.location_confidence,
    );
  } else {
    check('exact-street candidate present to select', false, 'skipped — none found');
  }

  // 3. The clean address must still resolve to the real BBL, confirmed, in one shot.
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
