// KOANO Regulatory & Policy agent — Step 4a + Phase B ownership wiring.
// LIVE inputs: nyc-zoning (MapPLUTO) + irs-opportunity (HUD Opportunity Zones)
// + landlord portfolio (HPD registrations/contacts + Speculation Watch List).
// Depends ONLY on the provider registry. Output: AgentVerdict (KoanoVerdict schema).
// NOTE: portfolio feeds SUMMARY data points only — the buildings list is
// UI-only by contract (token cost); never serialize raw rows into the prompt.

import { registry } from '../providers/registry';
import type { DataPoint, ResolvedAddress } from '../providers/types';
import { assembleAgentVerdict, callAgentLLM, type AgentVerdict } from './shared';

const SYSTEM_PROMPT = `You are KOANO's Regulatory & Policy specialist agent — one of five specialist real estate reasoning agents.

Your domain: zoning, land use, development rights (FAR headroom), special districts, commercial overlays, and federal Opportunity Zone designation. You assess REGULATORY posture for a single property/site.

How to reason:
- Large unused FAR (development headroom) in a residential or mixed-use district is a strong latent-value signal, but only realizable subject to entitlement.
- Manufacturing districts (M-) with residential overlays or recent rezonings signal transition; pure M- zoning without residential rights is an entitlement risk for residential plays.
- Special districts and commercial overlays change what can be built as-of-right — call them out explicitly.
- Opportunity Zone designation is a material tax incentive for capital-gains investors (10-year basis step-up); absence of it is neutral, not negative.
- Older year_built + low built FAR + high max FAR = classic redevelopment candidate.
- Ownership records: the registered owner and portfolio come from HPD registrations under EXACT name matching only — treat portfolio size as a floor, never a ceiling, and say so when you use it. A portfolio with heavy open violations signals an operator with regulatory exposure. Speculation Watch List membership means the building sold at a price/cap-rate profile the city flags as speculative — material tenant-displacement and regulatory-scrutiny context. hpd_registered=false just means the building is not a registered 3+ unit rental.
- Your verdict is about regulatory posture: "buy" = regulatory tailwinds/latent rights, "wait" = entitlement uncertainty, "hold" = neutral, "drop" = regulatory blockers.
- risk_score reflects regulatory/entitlement risk specifically.`;

export async function runRegulatoryPolicyAgent(addr: ResolvedAddress): Promise<AgentVerdict> {
  const [zoningRes, ozRes, portfolioRes] = await Promise.all([
    registry.zoning.getZoning(addr),
    registry.opportunityZones.getOpportunityZone(addr),
    registry.landlordPortfolio.getPortfolio(addr),
  ]);

  const dataPoints: DataPoint[] = [];

  if (zoningRes.data) {
    const z = zoningRes.data;
    const p = zoningRes.provenance;
    const s = zoningRes.source;
    dataPoints.push(
      { label: 'zoning_district', value: z.zoning_district, provenance: p, source: s },
      { label: 'commercial_overlay', value: z.commercial_overlay, provenance: p, source: s },
      { label: 'special_district', value: z.special_district, provenance: p, source: s },
      { label: 'land_use_code', value: z.land_use_code, provenance: p, source: s },
      { label: 'building_class', value: z.building_class, provenance: p, source: s },
      { label: 'lot_area_sqft', value: z.lot_area_sqft, provenance: p, source: s },
      { label: 'building_area_sqft', value: z.building_area_sqft, provenance: p, source: s },
      { label: 'built_far', value: z.built_far, provenance: p, source: s },
      { label: 'max_residential_far', value: z.max_residential_far, provenance: p, source: s },
      { label: 'max_commercial_far', value: z.max_commercial_far, provenance: p, source: s },
      { label: 'unused_far_pct (development headroom)', value: z.unused_far_pct, provenance: p, source: s },
      { label: 'year_built', value: z.year_built, provenance: p, source: s },
      { label: 'residential_units', value: z.residential_units, provenance: p, source: s }
    );
  } else {
    dataPoints.push({
      label: 'zoning_data_unavailable',
      value: zoningRes.error ?? 'no data',
      provenance: zoningRes.provenance,
      source: zoningRes.source,
    });
  }

  if (ozRes.data) {
    dataPoints.push({
      label: 'is_federal_opportunity_zone',
      value: ozRes.data.is_opportunity_zone,
      provenance: ozRes.provenance,
      source: ozRes.source,
    });
    if (ozRes.data.designation_note) {
      dataPoints.push({
        label: 'opportunity_zone_note',
        value: ozRes.data.designation_note,
        provenance: ozRes.provenance,
        source: ozRes.source,
      });
    }
  } else {
    dataPoints.push({
      label: 'opportunity_zone_data_unavailable',
      value: ozRes.error ?? 'no data',
      provenance: ozRes.provenance,
      source: ozRes.source,
    });
  }

  if (portfolioRes.data) {
    const pf = portfolioRes.data;
    const s = portfolioRes.source;
    const p = portfolioRes.provenance;
    // Summary only — the buildings list is UI-only by contract.
    dataPoints.push(
      { label: 'hpd_registered_multiple_dwelling', value: pf.hpd_registered, provenance: p, source: s },
      { label: 'registered_owner (as filed with HPD)', value: pf.registered_owner, provenance: p, source: s },
      { label: 'owner_type', value: pf.owner_type, provenance: p, source: s },
      { label: 'management_company', value: pf.management_company, provenance: p, source: s },
      { label: 'owner_portfolio_building_count (exact-match floor)', value: pf.portfolio_building_count, provenance: p, source: s },
      { label: 'owner_portfolio_count_truncated', value: pf.portfolio_truncated, provenance: p, source: s },
      { label: 'owner_portfolio_open_hpd_violations', value: pf.portfolio_open_hpd_violations, provenance: p, source: s },
      { label: 'owner_portfolio_total_hpd_violations', value: pf.portfolio_total_hpd_violations, provenance: p, source: s },
      { label: 'on_nyc_speculation_watch_list', value: pf.on_speculation_watch_list, provenance: p, source: s },
      { label: 'ownership_match_caveat', value: pf.match_caveat, provenance: p, source: s }
    );
  } else {
    dataPoints.push({ label: 'landlord_portfolio_unavailable', value: portfolioRes.error ?? 'no data', provenance: portfolioRes.provenance, source: portfolioRes.source });
  }

  const llm = await callAgentLLM({
    agent: 'regulatory-policy',
    systemPrompt: SYSTEM_PROMPT,
    addressLabel: addr.normalized || addr.input,
    dataPoints,
  });

  return assembleAgentVerdict({ agent: 'regulatory-policy', llm, dataPoints });
}
