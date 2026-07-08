// Step 2 verification — hits every real provider for a real NYC address and
// prints what came back. Run: npx tsx scripts/test-providers.ts [address]

import { registry } from '../lib/providers/registry';
import type { ProviderResult } from '../lib/providers/types';

const ADDRESS = process.argv[2] ?? '175 3rd Street, Brooklyn, NY 11215'; // Gowanus — active development area

function print(name: string, r: ProviderResult<unknown>) {
  const tag = r.provenance === 'live' ? 'LIVE' : 'REPRESENTATIVE';
  console.log(`\n━━━ ${name} ━━━ [${tag}] ok=${r.ok}`);
  console.log(`    source: ${r.source}`);
  if (r.error) console.log(`    error:  ${r.error}`);
  console.log(
    '    data:   ' +
      JSON.stringify(r.data, null, 2)
        .split('\n')
        .join('\n            ')
  );
}

async function main() {
  console.log(`KOANO provider test — address: "${ADDRESS}"\n`);

  const geo = await registry.geocode.resolve(ADDRESS);
  print('geocode (NYC GeoSearch + Census)', geo);
  if (!geo.ok || !geo.data) {
    console.error('\nGeocoding failed — cannot continue.');
    process.exit(1);
  }
  const addr = geo.data;

  const results = await Promise.all([
    registry.permits.getPermits(addr).then((r) => ['nyc-permits', r] as const),
    registry.zoning.getZoning(addr).then((r) => ['nyc-zoning', r] as const),
    registry.opportunityZones.getOpportunityZone(addr).then((r) => ['irs-opportunity', r] as const),
    registry.demographics.getDemographics(addr).then((r) => ['census-acs', r] as const),
    registry.hpi.getHpi(addr).then((r) => ['fhfa-hpi', r] as const),
    registry.flood.getFloodZone(addr).then((r) => ['fema-flood', r] as const),
    registry.crime.getCrimeStats(addr).then((r) => ['fbi-ucr', r] as const),
    registry.searchTrends.getSearchTrends(addr).then((r) => ['google-trends', r] as const),
  ]);

  for (const [name, r] of results) print(name, r);

  const live = results.filter(([, r]) => r.provenance === 'live').map(([n]) => n);
  const rep = results.filter(([, r]) => r.provenance === 'representative').map(([n]) => n);
  console.log(`\n━━━ SUMMARY ━━━`);
  console.log(`LIVE (${live.length}): ${live.join(', ') || 'none'}`);
  console.log(`REPRESENTATIVE (${rep.length}): ${rep.join(', ') || 'none'}`);

  const critical = ['nyc-permits', 'nyc-zoning'] as const;
  const criticalLive = critical.every((c) => live.includes(c));
  console.log(`\nCheckpoint (nyc-permits + nyc-zoning live): ${criticalLive ? 'PASS' : 'FAIL'}`);
  process.exit(criticalLive ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
