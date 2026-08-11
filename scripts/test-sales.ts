// Slice test — live NYC recorded-sales comps provider.
// Usage: npx tsx scripts/test-sales.ts ["address"]

import { registry } from '../lib/providers/registry';

const address = process.argv[2] ?? '175 3rd Street, Brooklyn, NY';

(async () => {
  const geo = await registry.geocode.resolve(address);
  if (!geo.ok || !geo.data) throw new Error(`geocode failed: ${geo.error}`);
  console.log('resolved:', geo.data.normalized, '| zip', geo.data.zip, '| bbl', geo.data.bbl);

  const r = await registry.mlsComps.getComps(geo.data);
  console.log('\nprovenance:', r.provenance, '| source:', r.source);
  if (r.error) console.log('error:', r.error);
  const d = r.data!;
  console.log('sales_count:', d.sales_count, '| median $/sqft:', d.median_price_per_sqft, '| price_trend:', d.price_trend);
  console.log('scope_note:', d.scope_note);
  console.log('comps (top 5):');
  for (const c of d.comps.slice(0, 5)) {
    console.log(`  $${c.sale_price.toLocaleString()} / ${c.gross_square_feet} gsf = $${c.price_per_sqft}/sqft  ${c.sale_date}  ${c.building_class.slice(0, 22)}  ${c.address.slice(0, 30)}`);
  }
})();
