// Slice 0 verification — Development memo provider enhancements.
// Zoning (City of Yes FAR + owner + CD), assemblage (block-level), entitlement
// (DOB filings track record). All must be live for a NYC dev site.
// Usage: npx tsx scripts/test-development-providers.ts ["address"]

import { registry } from '../lib/providers/registry';
import { nycAssemblage } from '../lib/providers/real/nyc-assemblage';
import { nycDobFilings } from '../lib/providers/real/nyc-dob-filings';

const address = process.argv[2] ?? '175 3rd Street, Brooklyn, NY';

(async () => {
  const geo = await registry.geocode.resolve(address);
  if (!geo.ok || !geo.data) throw new Error(`geocode failed: ${geo.error}`);
  const addr = geo.data;
  console.log(`\nresolved: ${addr.normalized} | bbl ${addr.bbl}`);

  console.log('\n=== [1] Zoning (City of Yes FAR + owner + CD) ===');
  const z = await registry.zoning.getZoning(addr);
  console.log('provenance:', z.provenance, '| ok:', z.ok);
  if (z.data) {
    const d = z.data;
    console.log(`district: ${d.zoning_district} | CD: ${d.community_district} | owner: ${d.owner_name}`);
    console.log(`base residFAR: ${d.max_residential_far} | AFFORDABLE residFAR: ${d.max_affordable_residential_far} | commFAR: ${d.max_commercial_far} | facilFAR: ${d.max_facility_far}`);
    console.log(`lot area: ${d.lot_area_sqft} | bldg area: ${d.building_area_sqft} | built FAR: ${d.built_far}`);
    if (d.max_residential_far && d.lot_area_sqft) {
      const base = Math.round(d.max_residential_far * d.lot_area_sqft);
      const aff = d.max_affordable_residential_far ? Math.round(d.max_affordable_residential_far * d.lot_area_sqft) : null;
      console.log(`→ base as-of-right floor area: ${base.toLocaleString()} sq ft${aff ? ` | affordable max: ${aff.toLocaleString()} sq ft (+${(aff - base).toLocaleString()})` : ''}`);
    }
  }

  console.log('\n=== [2] Assemblage (block-level ownership + air rights) ===');
  const a = await nycAssemblage.getAssemblage(addr);
  console.log('provenance:', a.provenance, '| ok:', a.ok);
  if (a.error) console.log('error:', a.error);
  if (a.data) {
    const d = a.data;
    console.log(`subject owner: ${d.subject_owner_name}`);
    console.log(`block lot count: ${d.block_lot_count} | same-owner other lots: ${d.same_owner_lot_count}`);
    console.log(`same-owner BBLs: ${d.same_owner_bbls.join(', ') || '(none)'}`);
    console.log(`block unused FAR floor area: ${d.block_unused_far_floor_area_sqft.toLocaleString()} sq ft | same-owner: ${d.same_owner_unused_far_floor_area_sqft.toLocaleString()} sq ft`);
    console.log(`neighbors shown: ${d.neighbors.length}; top: ${d.neighbors.slice(0, 3).map((n) => `${n.bbl}(${n.owner_name}, unused ${n.unused_far_floor_area_sqft})`).join(' | ')}`);
  }

  console.log('\n=== [3] Entitlement (DOB filings track record) ===');
  const e = await nycDobFilings.getEntitlement(addr);
  console.log('provenance:', e.provenance, '| ok:', e.ok);
  if (e.error) console.log('error:', e.error);
  if (e.data) {
    const d = e.data;
    console.log(`CD: ${d.community_district} | subject filings: ${d.subject_filing_count}`);
    console.log(`CD total: ${d.cd_total_filings} | approved: ${d.cd_approved} | DISAPPROVED: ${d.cd_disapproved} | withdrawn: ${d.cd_withdrawn} | suspended: ${d.cd_suspended} | in-process: ${d.cd_in_process}`);
    console.log(`approval ratio: ${d.cd_approval_ratio_pct}% | median timeline: ${d.cd_median_timeline_days} days`);
    console.log(`subject recent: ${d.subject_recent_items.slice(0, 3).map((i) => `${i.job_type}:${i.status}`).join(' | ') || '(none)'}`);
  }
  console.log('');
})();
