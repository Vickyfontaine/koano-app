// Liveness gate for the disambiguation fix. Walks the FULL user flow on the
// bug address — enter bad-ZIP address → disambiguate → pick the correct
// candidate → run the whole pipeline on the server-re-derived address — and
// tallies provenance across every datapoint. Expectation: the confirmed NYC
// building rolls up fully LIVE (the Aug-20 baseline). Any representative
// datapoint on a confirmed address is a real regression and is listed.
//
// Run: npx tsx scripts/liveness-disambiguation.ts

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

const BAD = '175 3 Street, Brooklyn NY 11201';

async function main() {
  const { registry } = await import('../lib/providers/registry');
  const { runKoanoPipelineForAddress } = await import('../lib/agents/synthesis');

  console.log(`\n=== Disambiguation liveness check ===`);
  console.log(`Input (bad ZIP): ${BAD}\n`);

  // 1. Ambiguous → candidates.
  const det = await registry.geocode.resolveDetailed(BAD);
  if (det.kind !== 'ambiguous') {
    console.error(`EXPECTED ambiguous, got ${det.kind}`);
    process.exit(1);
  }
  const pick = det.candidates.find((c) => c.match_reason === 'Exact street match') ?? det.candidates[0];
  console.log(`Candidates: ${det.candidates.map((c) => `${c.label} [${c.match_reason}]`).join('  |  ')}`);
  console.log(`Picking:    ${pick.label}\n`);

  // 2. Re-derive the confirmed address server-side from the pick.
  const rc = await registry.geocode.resolveCandidate(pick);
  if (!rc.ok || !rc.data) {
    console.error(`resolveCandidate failed: ${rc.error}`);
    process.exit(1);
  }
  const addr = rc.data;
  console.log(`Re-derived: bbl=${addr.bbl} borough=${addr.borough} confidence=${addr.location_confidence}`);
  console.log(`            lat=${addr.latitude} lon=${addr.longitude} tract=${addr.tract_geoid}\n`);

  // 3. Run the full pipeline on the confirmed address.
  const t0 = Date.now();
  const result = await runKoanoPipelineForAddress(addr);
  const ms = Date.now() - t0;

  let live = 0;
  let total = 0;
  const nonLive: string[] = [];
  console.log('--- specialist panel (provenance rollup) ---');
  for (const a of result.agents) {
    const l = a.data_points.filter((d) => d.provenance === 'live').length;
    live += l;
    total += a.data_points.length;
    for (const d of a.data_points) {
      if (d.provenance !== 'live') nonLive.push(`${a.agent}: "${d.label}" = ${d.provenance} (${d.source})`);
    }
    console.log(
      `  ${a.agent.padEnd(18)} prov=${a.overall_provenance.toUpperCase().padEnd(14)} live_dp=${l}/${a.data_points.length}`,
    );
  }

  console.log('\n--- rollup ---');
  console.log(`overall_provenance: ${result.verdict.overall_provenance.toUpperCase()}`);
  console.log(`live datapoints:    ${live}/${total}`);
  console.log(`elapsed:            ${(ms / 1000).toFixed(1)}s`);

  if (nonLive.length > 0) {
    console.log(`\n⚠ NON-LIVE DATAPOINTS ON A CONFIRMED ADDRESS (investigate — possible regression):`);
    for (const n of nonLive) console.log(`   - ${n}`);
  } else {
    console.log(`\n✓ Every datapoint LIVE on the confirmed building.`);
  }

  const ok =
    addr.bbl === '3009720058' &&
    addr.location_confidence === 'confirmed' &&
    result.verdict.overall_provenance === 'live' &&
    nonLive.length === 0;
  console.log(ok ? '\nLIVENESS GATE: PASS\n' : '\nLIVENESS GATE: FAIL\n');
  process.exit(ok ? 0 : 1);
}

main().catch((e) => {
  console.error('liveness check errored:', e);
  process.exit(1);
});
