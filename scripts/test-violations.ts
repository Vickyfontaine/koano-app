// Slice test — building violations + landlord portfolio providers.
// Usage: npx tsx scripts/test-violations.ts ["address"] [--portfolio]

import { registry } from '../lib/providers/registry';

const address = process.argv[2] ?? '1318 Clay Avenue, Bronx, NY';
const portfolio = process.argv.includes('--portfolio');

(async () => {
  const geo = await registry.geocode.resolve(address);
  if (!geo.ok || !geo.data) throw new Error(`geocode failed: ${geo.error}`);
  console.log('resolved:', geo.data.normalized, '| bbl', geo.data.bbl, '| bin', geo.data.bin);

  const v = await registry.buildingViolations.getViolations(geo.data);
  console.log('\n--- violations provenance:', v.provenance, '| ok:', v.ok);
  if (v.error) console.log('error:', v.error);
  console.log(JSON.stringify(v.data, null, 2));

  if (portfolio) {
    const p = await registry.landlordPortfolio.getPortfolio(geo.data);
    console.log('\n--- portfolio provenance:', p.provenance, '| ok:', p.ok);
    if (p.error) console.log('error:', p.error);
    console.log(JSON.stringify(p.data, null, 2));
  }
})();
