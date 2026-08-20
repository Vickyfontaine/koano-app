// KOANO Demand Sentiment agent — Phase 1: re-based onto federal housing-demand
// signals. LIVE inputs: demographics (census-acs) + mortgage lending (CFPB HMDA)
// + employment & wages (BLS QCEW) + county migration with income (IRS SOI, self-
// hosted). These replace the foot-traffic and search-interest mocks with genuine
// housing-demand data that works at any US address. Depends ONLY on the provider
// registry. Output: AgentVerdict (KoanoVerdict schema).

import { registry } from '../providers/registry';
import type { DataPoint, ResolvedAddress } from '../providers/types';
import { assembleAgentVerdict, callAgentLLM, type AgentVerdict } from './shared';

const SYSTEM_PROMPT = `You are KOANO's Demand Sentiment specialist agent — one of five specialist real estate reasoning agents.

Your domain: who wants to be in this market and how badly, and whether they can afford to act — mortgage lending activity, the local jobs-and-wages base, migration flows, and the demographic profile of residents. You estimate demand momentum and gentrification stage.

How to reason:
- Mortgage lending (HMDA) is realized housing demand: rising originations year-over-year = strengthening purchase demand; a high or rising denial rate = tightening credit access that caps demand. Read origination momentum and denial rate together.
- Employment & wages (QCEW) are the demand FOUNDATION: rising employment and rising average weekly wage support housing demand and price support; falling employment is a leading indicator of demand softening. Note the YoY change, not just the level.
- Migration (IRS SOI), when present: net in-migration = demand inflow; compare the AVERAGE INCOME of in-movers vs out-movers — higher-income households moving in is a classic early gentrification / upward-pressure signal, higher-income households leaving is the reverse. If migration data is absent, simply omit it — do not infer.
- Demographics tell you WHERE in the arc a neighborhood is: high income + high education + high home values = late-stage (stages 5-7, less upside, more stability); moderate income with strong education influx = mid-arc (stages 3-5, most price appreciation happens here).
- Treat any data point with provenance "representative" as indicative only — say so explicitly in the observation that uses it, and cap how much weight it carries.
- Your verdict is about demand: "buy" = demand momentum building, "hold" = stable demand, "wait" = signals unclear or early, "sell"/"drop" = demand deteriorating.
- risk_score reflects demand-side risk (demand reversal, credit tightening, out-migration, displacement pressure).
- In one reasoning step, estimate the gentrification stage on a 1-7 scale and justify it from the demographics and migration/lending signals.`;

export async function runDemandSentimentAgent(addr: ResolvedAddress): Promise<AgentVerdict> {
  const [demoRes, mortgageRes, employmentRes, migrationRes] = await Promise.all([
    registry.demographics.getDemographics(addr),
    registry.mortgageDemand.getMortgageDemand(addr),
    registry.employment.getEmployment(addr),
    registry.migration.getMigration(addr),
  ]);

  const dataPoints: DataPoint[] = [];

  if (demoRes.data) {
    const d = demoRes.data;
    const s = demoRes.source;
    const p = demoRes.provenance;
    dataPoints.push(
      { label: `tract_population (${d.vintage})`, value: d.population, provenance: p, source: s },
      { label: 'median_household_income_usd', value: d.median_household_income, provenance: p, source: s },
      { label: 'median_gross_rent_usd', value: d.median_gross_rent, provenance: p, source: s },
      { label: 'median_home_value_usd', value: d.median_home_value, provenance: p, source: s },
      { label: 'bachelors_or_higher_pct', value: d.bachelors_or_higher_pct, provenance: p, source: s }
    );
  } else {
    dataPoints.push({ label: 'demographics_unavailable', value: demoRes.error ?? 'no data', provenance: demoRes.provenance, source: demoRes.source });
  }

  if (mortgageRes.data) {
    const m = mortgageRes.data;
    const s = mortgageRes.source;
    const p = mortgageRes.provenance;
    dataPoints.push(
      { label: `mortgage_originations (${m.year})`, value: m.originations, provenance: p, source: s },
      { label: 'mortgage_denials', value: m.denials, provenance: p, source: s },
      { label: 'mortgage_denial_rate_pct', value: m.denial_rate_pct, provenance: p, source: s },
      { label: 'mortgage_originations_yoy_pct', value: m.originations_yoy_pct, provenance: p, source: s }
    );
  } else {
    dataPoints.push({ label: 'mortgage_demand_unavailable', value: mortgageRes.error ?? 'no data', provenance: mortgageRes.provenance, source: mortgageRes.source });
  }

  if (employmentRes.data) {
    const e = employmentRes.data;
    const s = employmentRes.source;
    const p = employmentRes.provenance;
    dataPoints.push(
      { label: `county_employment (${e.period})`, value: e.total_employment, provenance: p, source: s },
      { label: 'avg_weekly_wage_usd', value: e.avg_weekly_wage_usd, provenance: p, source: s },
      { label: 'employment_yoy_pct', value: e.employment_yoy_pct, provenance: p, source: s },
      { label: 'avg_weekly_wage_yoy_pct', value: e.avg_weekly_wage_yoy_pct, provenance: p, source: s }
    );
  } else {
    dataPoints.push({ label: 'employment_unavailable', value: employmentRes.error ?? 'no data', provenance: employmentRes.provenance, source: employmentRes.source });
  }

  // Migration is additive: when unseeded it returns data:null tagged live, so we
  // emit a coverage note that does not drag provenance.
  if (migrationRes.data) {
    const mig = migrationRes.data;
    const s = migrationRes.source;
    const p = migrationRes.provenance;
    dataPoints.push(
      { label: `net_migration_returns (${mig.vintage})`, value: mig.net_migration_returns, provenance: p, source: s },
      { label: 'inflow_agi_per_return_usd', value: mig.inflow_agi_per_return_usd, provenance: p, source: s },
      { label: 'outflow_agi_per_return_usd', value: mig.outflow_agi_per_return_usd, provenance: p, source: s }
    );
  } else {
    dataPoints.push({ label: 'migration_unavailable', value: migrationRes.error ?? 'no data', provenance: migrationRes.provenance, source: migrationRes.source });
  }

  const llm = await callAgentLLM({
    agent: 'demand-sentiment',
    systemPrompt: SYSTEM_PROMPT,
    addressLabel: addr.normalized || addr.input,
    dataPoints,
  });

  return assembleAgentVerdict({ agent: 'demand-sentiment', llm, dataPoints });
}
