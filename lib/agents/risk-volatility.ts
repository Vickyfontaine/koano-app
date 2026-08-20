// KOANO Risk & Volatility agent — Phase 1: fully live.
// ALL-LIVE inputs: crime (fbi-ucr → NYPD live fallback) + flood zone (fema-flood)
// + building violations (HPD/ECB/DOB, nyc-violations) + environmental & climate
// hazard from federal free sources — EPA Superfund/brownfield proximity, USGS
// seismic, OpenFEMA disaster history, and NOAA climate normals. These re-base the
// agent off the former premium-hazard mock onto authoritative national data, so
// hazard is genuinely live at any US address (and the EPA proximity datapoint
// closes the hallucinated-Superfund gap — the agent is handed real sites, not a
// guess). Depends ONLY on the provider registry.
// NOTE: violations feed SUMMARY data points only — recent_items is UI-only by
// contract (token cost); never serialize raw rows into the prompt.

import { registry } from '../providers/registry';
import type { DataPoint, ResolvedAddress } from '../providers/types';
import { assembleAgentVerdict, callAgentLLM, type AgentVerdict } from './shared';

const SYSTEM_PROMPT = `You are KOANO's Risk & Volatility specialist agent — one of five specialist real estate reasoning agents.

Your domain: downside — crime, climate/flood exposure, and hazard trajectory. You quantify what can go wrong and whether it is priced in.

How to reason:
- FEMA flood zone is the regulatory/insurance reality TODAY (Zone X = minimal hazard, A/AE/VE = Special Flood Hazard Area with mandatory insurance). It is the current regulatory zone — distinct from disaster HISTORY below.
- Disaster history (OpenFEMA): how often this county has actually been federally declared a disaster, and for what perils. This is historical multi-peril frequency, COMPLEMENTARY to the flood zone — a county repeatedly declared for floods/hurricanes carries realized risk the current zone may under-state. A property outside the SFHA in a county with frequent flood declarations is carrying tail risk — flag it.
- Environmental contamination (EPA): Superfund (SEMS) and brownfield (ACRES) sites within a 2-mile radius. Proximity to active cleanup sites is a value/liability risk and can gate financing/insurance. Cite the actual nearest site the data gives you; if zero within the radius, say so plainly — that is a real result, not "no risk everywhere". Do NOT name a specific Superfund site or program unless the data point supplies that name.
- Seismic (USGS): ASCE 7-22 mapped design values (PGA, Ss, S1) and the Seismic Design Category, plus the count of nearby historical earthquakes. Higher PGA / SDC = higher seismic exposure and construction cost; most of the US Northeast is low (SDC A/B). Treat this as structural/insurance context.
- Climate normals (NOAA), when present: long-run temperature/precipitation context for operating cost and livability, not acute loss. If climate data is marked unavailable, simply omit it — do not infer.
- Crime: level matters less than trend. Falling crime in a transitioning area is a classic risk-compression signal; rising crime is a leading indicator of value erosion. Note what the counts cover (rate_note).
- Building condition: open HPD class C violations are immediately hazardous; class B hazardous; class A non-hazardous. A rising 24-month violation count versus the prior 24 months signals deteriorating maintenance — a leading indicator of capex risk and regulatory exposure. Active ECB violations carry penalties. IMPORTANT: hpd_registered=false means the building is outside HPD's universe (HPD covers registered rentals with 3+ units), so HPD zeros are a coverage fact, not a clean bill of health — do not read them as low risk.
- Treat any data point with provenance "representative" as indicative only — say so explicitly in the observation that uses it.
- Your verdict is about risk posture: "buy" = risk is low or compressing (risk-adjusted entry attractive), "hold" = risk stable and priced, "wait" = rising uncertainty, "sell"/"drop" = material unpriced risk.
- risk_score is your headline output: 0-100, higher = riskier, synthesized across crime, flood, contamination, seismic, and disaster history.`;

export async function runRiskVolatilityAgent(addr: ResolvedAddress): Promise<AgentVerdict> {
  const [crimeRes, floodRes, contaminationRes, seismicRes, disasterRes, climateRes, violationsRes] =
    await Promise.all([
      registry.crime.getCrimeStats(addr),
      registry.flood.getFloodZone(addr),
      registry.contamination.getContamination(addr),
      registry.seismic.getSeismic(addr),
      registry.disasterHistory.getDisasterHistory(addr),
      registry.climate.getClimate(addr),
      registry.buildingViolations.getViolations(addr),
    ]);

  const dataPoints: DataPoint[] = [];

  if (crimeRes.data) {
    const c = crimeRes.data;
    const s = crimeRes.source;
    const p = crimeRes.provenance;
    dataPoints.push(
      { label: `crime_jurisdiction (${c.period})`, value: c.jurisdiction, provenance: p, source: s },
      { label: 'violent_incidents', value: c.violent_incidents, provenance: p, source: s },
      { label: 'property_incidents', value: c.property_incidents, provenance: p, source: s },
      { label: 'total_incidents', value: c.total_incidents, provenance: p, source: s },
      { label: 'crime_coverage_note', value: c.rate_note, provenance: p, source: s },
      { label: 'crime_trend', value: c.trend, provenance: p, source: s }
    );
  } else {
    dataPoints.push({ label: 'crime_data_unavailable', value: crimeRes.error ?? 'no data', provenance: crimeRes.provenance, source: crimeRes.source });
  }

  if (floodRes.data) {
    const f = floodRes.data;
    const s = floodRes.source;
    const p = floodRes.provenance;
    dataPoints.push(
      { label: 'fema_flood_zone', value: f.flood_zone, provenance: p, source: s },
      { label: 'fema_zone_subtype', value: f.zone_subtype, provenance: p, source: s },
      { label: 'in_special_flood_hazard_area', value: f.in_special_flood_hazard_area, provenance: p, source: s },
      { label: 'static_base_flood_elevation_ft', value: f.static_bfe_ft, provenance: p, source: s }
    );
  } else {
    dataPoints.push({ label: 'flood_data_unavailable', value: floodRes.error ?? 'no data', provenance: floodRes.provenance, source: floodRes.source });
  }

  // Environmental contamination (EPA Superfund + brownfields).
  if (contaminationRes.data) {
    const c = contaminationRes.data;
    const s = contaminationRes.source;
    const p = contaminationRes.provenance;
    dataPoints.push(
      { label: `superfund_sites_within_${c.radius_mi}mi`, value: c.superfund_sites_within_radius, provenance: p, source: s },
      { label: `brownfield_sites_within_${c.radius_mi}mi`, value: c.brownfield_within_radius, provenance: p, source: s },
      { label: 'nearest_cleanup_site', value: c.nearest_site_name ?? 'none within radius', provenance: p, source: s },
      { label: 'nearest_cleanup_site_distance_mi', value: c.nearest_site_distance_mi, provenance: p, source: s },
      { label: 'nearest_cleanup_site_program', value: c.nearest_site_program ?? 'none', provenance: p, source: s },
      { label: 'contamination_coverage_note', value: c.scope_note, provenance: p, source: s }
    );
  } else {
    dataPoints.push({ label: 'contamination_unavailable', value: contaminationRes.error ?? 'no data', provenance: contaminationRes.provenance, source: contaminationRes.source });
  }

  // Seismic hazard (USGS).
  if (seismicRes.data) {
    const q = seismicRes.data;
    const s = seismicRes.source;
    const p = seismicRes.provenance;
    dataPoints.push(
      { label: 'seismic_pga_g', value: q.pga_g, provenance: p, source: s },
      { label: 'seismic_ss_g', value: q.ss_g, provenance: p, source: s },
      { label: 'seismic_s1_g', value: q.s1_g, provenance: p, source: s },
      { label: 'seismic_design_reference', value: q.design_reference, provenance: p, source: s },
      { label: 'historical_quakes_50km_m3plus', value: q.historical_quakes_50km_m3plus, provenance: p, source: s },
      { label: 'largest_nearby_earthquake_magnitude', value: q.largest_nearby_magnitude, provenance: p, source: s }
    );
  } else {
    dataPoints.push({ label: 'seismic_unavailable', value: seismicRes.error ?? 'no data', provenance: seismicRes.provenance, source: seismicRes.source });
  }

  // Disaster declaration history (OpenFEMA) — complements the FEMA flood zone.
  if (disasterRes.data) {
    const dh = disasterRes.data;
    const s = disasterRes.source;
    const p = disasterRes.provenance;
    dataPoints.push(
      { label: 'fema_disaster_declarations_total', value: dh.total_declarations, provenance: p, source: s },
      { label: 'fema_disaster_declarations_last_10yr', value: dh.declarations_last_10yr, provenance: p, source: s },
      { label: 'fema_disaster_incident_types', value: dh.distinct_incident_types.join(', ') || 'none', provenance: p, source: s },
      { label: 'fema_most_common_incident', value: dh.most_common_incident ?? 'none', provenance: p, source: s },
      { label: 'fema_most_recent_declaration', value: dh.most_recent_declaration ?? 'none', provenance: p, source: s },
      { label: 'disaster_history_coverage_note', value: dh.scope_note, provenance: p, source: s }
    );
  } else {
    dataPoints.push({ label: 'disaster_history_unavailable', value: disasterRes.error ?? 'no data', provenance: disasterRes.provenance, source: disasterRes.source });
  }

  // Climate normals (NOAA) — coverage note only when the free token is unset
  // (data:null, live) so it never drags provenance.
  if (climateRes.data) {
    const cl = climateRes.data;
    const s = climateRes.source;
    const p = climateRes.provenance;
    dataPoints.push(
      { label: 'annual_avg_temp_f', value: cl.annual_avg_temp_f, provenance: p, source: s },
      { label: 'annual_precip_in', value: cl.annual_precip_in, provenance: p, source: s },
      { label: 'climate_normals_period', value: cl.normals_period, provenance: p, source: s },
      { label: 'climate_coverage_note', value: cl.scope_note, provenance: p, source: s }
    );
  } else {
    dataPoints.push({ label: 'climate_unavailable', value: climateRes.error ?? 'no data', provenance: climateRes.provenance, source: climateRes.source });
  }

  if (violationsRes.data) {
    const v = violationsRes.data;
    const s = violationsRes.source;
    const p = violationsRes.provenance;
    // Summary counts only — recent_items is UI-only by contract.
    dataPoints.push(
      { label: 'hpd_registered_multiple_dwelling', value: v.hpd_registered, provenance: p, source: s },
      { label: 'violations_coverage_note', value: v.scope_note, provenance: p, source: s },
      { label: 'hpd_open_violations_total', value: v.hpd.open, provenance: p, source: s },
      { label: 'hpd_open_class_c_immediately_hazardous', value: v.hpd.open_by_class.C, provenance: p, source: s },
      { label: 'hpd_open_class_b_hazardous', value: v.hpd.open_by_class.B, provenance: p, source: s },
      { label: 'hpd_violations_last_24mo', value: v.hpd.last_24mo, provenance: p, source: s },
      { label: 'hpd_violations_prior_24mo', value: v.hpd.prior_24mo, provenance: p, source: s },
      { label: 'ecb_active_violations', value: v.ecb.active, provenance: p, source: s },
      {
        label: 'ecb_active_by_severity',
        value: Object.entries(v.ecb.active_by_severity).map(([k, n]) => `${k}: ${n}`).join(', ') || 'none',
        provenance: p,
        source: s,
      },
      { label: 'dob_complaints_active', value: v.dob_complaints.active, provenance: p, source: s },
      { label: 'dob_complaints_last_24mo', value: v.dob_complaints.last_24mo, provenance: p, source: s }
    );
  } else {
    dataPoints.push({ label: 'building_violations_unavailable', value: violationsRes.error ?? 'no data', provenance: violationsRes.provenance, source: violationsRes.source });
  }

  const llm = await callAgentLLM({
    agent: 'risk-volatility',
    systemPrompt: SYSTEM_PROMPT,
    addressLabel: addr.normalized || addr.input,
    dataPoints,
  });

  return assembleAgentVerdict({ agent: 'risk-volatility', llm, dataPoints });
}
