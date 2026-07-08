// KOANO Market Timing agent — Step 4e.
// MIXED inputs: house price index (fhfa-hpi) + demographics (census-acs) — live;
// MLS comps (mls-comps) — representative until an MLS/ATTOM feed is licensed.
// Depends ONLY on the provider registry. Output: AgentVerdict (KoanoVerdict schema).

import { registry } from '../providers/registry';
import type { DataPoint, ResolvedAddress } from '../providers/types';
import { assembleAgentVerdict, callAgentLLM, type AgentVerdict } from './shared';

const SYSTEM_PROMPT = `You are KOANO's Market Timing specialist agent — one of five specialist real estate reasoning agents.

Your domain: WHEN — pricing velocity, days-on-market trends, and cycle position. You answer "is this the right moment to transact in this market?"

How to reason:
- The HPI trend is the macro cycle signal: YoY appreciation vs the 5-year run tells you whether the market is accelerating, cruising, or decelerating. Strong 5-yr + moderating YoY = mid-to-late cycle.
- Days-on-market is the micro liquidity signal: compressing DOM = demand outrunning supply (seller's momentum); expanding DOM = buyers regaining leverage.
- Comp price-per-sqft vs tract median home value shows whether recent transactions are printing above or below the standing stock — above = market repricing upward.
- Timing verdicts: "buy" = early enough in the acceleration to capture appreciation, "hold" = mid-cycle, no urgency either way, "wait" = late-cycle or decelerating (better entry likely ahead), "sell" = peak signals (sell into strength).
- Treat any data point with provenance "representative" as indicative only — say so explicitly in the observation that uses it.
- risk_score reflects timing risk: buying at a local top, liquidity drying up, rate sensitivity.
- signal_window_months = how long your timing read stays valid.`;

export async function runMarketTimingAgent(addr: ResolvedAddress): Promise<AgentVerdict> {
  const [hpiRes, demoRes, compsRes] = await Promise.all([
    registry.hpi.getHpi(addr),
    registry.demographics.getDemographics(addr),
    registry.mlsComps.getComps(addr),
  ]);

  const dataPoints: DataPoint[] = [];

  if (hpiRes.data) {
    const h = hpiRes.data;
    const s = hpiRes.source;
    const p = hpiRes.provenance;
    dataPoints.push(
      { label: `hpi_region (${h.region_type})`, value: h.region, provenance: p, source: s },
      { label: `hpi_latest_index (${h.latest_period})`, value: h.latest_index, provenance: p, source: s },
      { label: 'hpi_yoy_change_pct', value: h.yoy_change_pct, provenance: p, source: s },
      { label: 'hpi_5yr_change_pct', value: h.five_yr_change_pct, provenance: p, source: s }
    );
  } else {
    dataPoints.push({ label: 'hpi_unavailable', value: hpiRes.error ?? 'no data', provenance: hpiRes.provenance, source: hpiRes.source });
  }

  if (demoRes.data) {
    const d = demoRes.data;
    dataPoints.push(
      { label: `tract_median_home_value_usd (${d.vintage})`, value: d.median_home_value, provenance: demoRes.provenance, source: demoRes.source },
      { label: 'tract_median_gross_rent_usd', value: d.median_gross_rent, provenance: demoRes.provenance, source: demoRes.source }
    );
  } else {
    dataPoints.push({ label: 'demographics_unavailable', value: demoRes.error ?? 'no data', provenance: demoRes.provenance, source: demoRes.source });
  }

  if (compsRes.data) {
    const c = compsRes.data;
    const s = compsRes.source;
    const p = compsRes.provenance;
    dataPoints.push(
      { label: 'comps_median_days_on_market', value: c.median_dom, provenance: p, source: s },
      { label: 'comps_median_price_per_sqft_usd', value: c.median_price_per_sqft, provenance: p, source: s },
      { label: 'comps_dom_trend', value: c.dom_trend, provenance: p, source: s }
    );
    c.comps.slice(0, 4).forEach((comp, i) => {
      dataPoints.push({
        label: `comp_${i + 1}`,
        value: `${comp.address}: $${comp.sale_price.toLocaleString()} on ${comp.sale_date}, ${comp.days_on_market} DOM, $${comp.price_per_sqft}/sqft`,
        provenance: p,
        source: s,
      });
    });
  } else {
    dataPoints.push({ label: 'comps_unavailable', value: compsRes.error ?? 'no data', provenance: compsRes.provenance, source: compsRes.source });
  }

  const llm = await callAgentLLM({
    agent: 'market-timing',
    systemPrompt: SYSTEM_PROMPT,
    addressLabel: addr.normalized || addr.input,
    dataPoints,
  });

  return assembleAgentVerdict({ agent: 'market-timing', llm, dataPoints });
}
