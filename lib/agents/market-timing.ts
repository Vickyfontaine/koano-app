// KOANO Market Timing agent — Step 4e (Phase 1: + market supplements).
// LIVE inputs: house price index (fhfa-hpi) + demographics (census-acs) +
// comparable recorded sales (nyc-sales) + the financing/affordability
// environment — Freddie Mac PMMS mortgage rate and HUD Fair Market Rents.
// Recorded sales give price movement (price_trend), not days-on-market (an MLS
// concept). Depends ONLY on the provider registry. Output: AgentVerdict.

import { registry } from '../providers/registry';
import type { DataPoint, ResolvedAddress } from '../providers/types';
import { assembleAgentVerdict, callAgentLLM, type AgentVerdict } from './shared';

const SYSTEM_PROMPT = `You are KOANO's Market Timing specialist agent — one of five specialist real estate reasoning agents.

Your domain: WHEN — pricing velocity, transaction price movement, and cycle position. You answer "is this the right moment to transact in this market?"

How to reason:
- The HPI trend is the macro cycle signal: YoY appreciation vs the 5-year run tells you whether the market is accelerating, cruising, or decelerating. Strong 5-yr + moderating YoY = mid-to-late cycle.
- Recorded-sales price_trend is the local micro signal: "rising" = recent local sales printing higher $/sqft than the prior period (seller's momentum); "falling" = local softening; "flat" = stable. It reflects actual closed sales, not listings. (Recorded sales do not carry days-on-market; that would require MLS data we do not have.)
- Comp price-per-sqft vs tract median home value shows whether recent transactions are printing above or below the standing stock — above = market repricing upward. Note the comp coverage from the scope note (ZIP-keyed, NYC 1-3 family skew).
- Financing environment (Freddie Mac PMMS): the national 30-yr fixed rate is the affordability/timing headwind or tailwind. Elevated rates compress buyer purchasing power and slow transactions regardless of local momentum; falling rates unlock demand. Weigh it against the local price trend.
- Rent benchmark (HUD Fair Market Rents), when present: rents relative to prices frame buy-vs-rent and investor yield support. If FMR is marked unavailable, simply omit it — do not infer.
- Timing verdicts: "buy" = early enough in the acceleration to capture appreciation, "hold" = mid-cycle, no urgency either way, "wait" = late-cycle or decelerating (better entry likely ahead), "sell" = peak signals (sell into strength).
- Treat any data point with provenance "representative" as indicative only — say so explicitly in the observation that uses it.
- risk_score reflects timing risk: buying at a local top, liquidity drying up, rate sensitivity.
- signal_window_months = how long your timing read stays valid.`;

export async function runMarketTimingAgent(addr: ResolvedAddress): Promise<AgentVerdict> {
  const [hpiRes, demoRes, compsRes, rateRes, fmrRes] = await Promise.all([
    registry.hpi.getHpi(addr),
    registry.demographics.getDemographics(addr),
    registry.mlsComps.getComps(addr),
    registry.mortgageRate.getMortgageRate(addr),
    registry.fairMarketRent.getFairMarketRent(addr),
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
    // Same 3-slot summary as before (token parity): DOM→sales_count,
    // dom_trend→price_trend. The full scope_note is UI-facing, not prompted.
    dataPoints.push(
      { label: 'comps_median_price_per_sqft_usd', value: c.median_price_per_sqft, provenance: p, source: s },
      { label: 'comps_recorded_sales_count_12mo', value: c.sales_count, provenance: p, source: s },
      { label: 'comps_price_trend', value: c.price_trend, provenance: p, source: s }
    );
    c.comps.slice(0, 4).forEach((comp, i) => {
      dataPoints.push({
        label: `comp_${i + 1}`,
        value: `${comp.address}: $${comp.sale_price.toLocaleString()} on ${comp.sale_date}, $${comp.price_per_sqft}/sqft (${comp.gross_square_feet} sqft, ${comp.building_class})`,
        provenance: p,
        source: s,
      });
    });
  } else {
    dataPoints.push({ label: 'comps_unavailable', value: compsRes.error ?? 'no data', provenance: compsRes.provenance, source: compsRes.source });
  }

  // Financing environment (national mortgage rate) — Freddie Mac PMMS.
  if (rateRes.data) {
    const r = rateRes.data;
    dataPoints.push(
      { label: `mortgage_rate_30yr_pct (week ${r.week})`, value: r.rate_30yr_pct, provenance: rateRes.provenance, source: rateRes.source },
      { label: 'mortgage_rate_15yr_pct', value: r.rate_15yr_pct, provenance: rateRes.provenance, source: rateRes.source }
    );
  } else {
    dataPoints.push({ label: 'mortgage_rate_unavailable', value: rateRes.error ?? 'no data', provenance: rateRes.provenance, source: rateRes.source });
  }

  // Rent benchmark (HUD FMR) — omitted (coverage note, live) when the free token
  // is unset, so it never drags provenance.
  if (fmrRes.data) {
    const f = fmrRes.data;
    dataPoints.push(
      { label: `fmr_2br_usd (FY${f.fiscal_year})`, value: f.fmr_2br, provenance: fmrRes.provenance, source: fmrRes.source },
      { label: 'fmr_1br_usd', value: f.fmr_1br, provenance: fmrRes.provenance, source: fmrRes.source }
    );
  } else {
    dataPoints.push({ label: 'fair_market_rent_unavailable', value: fmrRes.error ?? 'no data', provenance: fmrRes.provenance, source: fmrRes.source });
  }

  const llm = await callAgentLLM({
    agent: 'market-timing',
    systemPrompt: SYSTEM_PROMPT,
    addressLabel: addr.normalized || addr.input,
    dataPoints,
  });

  return assembleAgentVerdict({ agent: 'market-timing', llm, dataPoints });
}
