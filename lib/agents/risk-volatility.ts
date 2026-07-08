// KOANO Risk & Volatility agent — Step 4d.
// MIXED inputs: crime (fbi-ucr → NYPD live fallback) + flood zone (fema-flood) — live;
// premium climate hazard (premium-hazard) — representative until First Street is licensed.
// Depends ONLY on the provider registry. Output: AgentVerdict (KoanoVerdict schema).

import { registry } from '../providers/registry';
import type { DataPoint, ResolvedAddress } from '../providers/types';
import { assembleAgentVerdict, callAgentLLM, type AgentVerdict } from './shared';

const SYSTEM_PROMPT = `You are KOANO's Risk & Volatility specialist agent — one of five specialist real estate reasoning agents.

Your domain: downside — crime, climate/flood exposure, and hazard trajectory. You quantify what can go wrong and whether it is priced in.

How to reason:
- FEMA flood zone is the regulatory/insurance reality TODAY (Zone X = minimal hazard, A/AE/VE = Special Flood Hazard Area with mandatory insurance). Premium hazard factors (flood/fire/heat 1-10) are the forward-looking climate trajectory.
- A property outside the SFHA but with a non-trivial 30-year flood probability is carrying unpriced tail risk — flag it.
- Crime: level matters less than trend. Falling crime in a transitioning area is a classic risk-compression signal; rising crime is a leading indicator of value erosion. Note what the counts cover (rate_note).
- Heat factor affects operating costs (cooling) and long-run livability, not acute loss.
- Treat any data point with provenance "representative" as indicative only — say so explicitly in the observation that uses it.
- Your verdict is about risk posture: "buy" = risk is low or compressing (risk-adjusted entry attractive), "hold" = risk stable and priced, "wait" = rising uncertainty, "sell"/"drop" = material unpriced risk.
- risk_score is your headline output: 0-100, higher = riskier, synthesized across crime, flood, and climate trajectory.`;

export async function runRiskVolatilityAgent(addr: ResolvedAddress): Promise<AgentVerdict> {
  const [crimeRes, floodRes, hazardRes] = await Promise.all([
    registry.crime.getCrimeStats(addr),
    registry.flood.getFloodZone(addr),
    registry.premiumHazard.getHazards(addr),
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

  if (hazardRes.data) {
    const h = hazardRes.data;
    const s = hazardRes.source;
    const p = hazardRes.provenance;
    dataPoints.push(
      { label: 'climate_flood_factor_1_to_10', value: h.flood_factor_1_to_10, provenance: p, source: s },
      { label: 'climate_fire_factor_1_to_10', value: h.fire_factor_1_to_10, provenance: p, source: s },
      { label: 'climate_heat_factor_1_to_10', value: h.heat_factor_1_to_10, provenance: p, source: s },
      { label: 'thirty_yr_flood_probability_pct', value: h.thirty_yr_flood_probability_pct, provenance: p, source: s }
    );
  } else {
    dataPoints.push({ label: 'premium_hazard_unavailable', value: hazardRes.error ?? 'no data', provenance: hazardRes.provenance, source: hazardRes.source });
  }

  const llm = await callAgentLLM({
    agent: 'risk-volatility',
    systemPrompt: SYSTEM_PROMPT,
    addressLabel: addr.normalized || addr.input,
    dataPoints,
  });

  return assembleAgentVerdict({ agent: 'risk-volatility', llm, dataPoints });
}
