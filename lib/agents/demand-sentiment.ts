// KOANO Demand Sentiment agent — Phase 1: re-based onto federal housing-demand
// signals. LIVE inputs: housing-cost context (census-acs: median rent and home
// value, tract population) + mortgage lending (CFPB HMDA) + employment & wages
// (BLS QCEW) + county migration with income (IRS SOI, self-hosted). These replace
// the foot-traffic and search-interest mocks with genuine housing-demand data that
// works at any US address. Depends ONLY on the provider registry.
//
// RESIDENT COMPOSITION IS NOT A VERDICT INPUT (UI sprint WS1 / Phase 0 item 30-8,
// kill-list #3). The agent no longer receives education attainment or household
// income as data points and no longer estimates a "gentrification stage": a
// buy/sell vote must not be fed by who lives somewhere, and the reasoning text is
// stored immutably and shown to renters. The grounding layer additionally bans
// that language from any stored observation (lib/agents/grounding.ts).
// Output: AgentVerdict (KoanoVerdict schema).

import { registry } from '../providers/registry';
import type { DataPoint, ResolvedAddress } from '../providers/types';
import { assembleAgentVerdict, callAgentLLM, type AgentVerdict } from './shared';

const SYSTEM_PROMPT = `You are KOANO's Demand Sentiment specialist agent — one of five specialist real estate reasoning agents.

Your domain: how much housing demand is acting on this market and whether buyers can act on it — mortgage lending activity, the local jobs-and-wages base, migration flows, and the housing-cost level demand is pushing against. You estimate demand momentum. You do NOT characterize who the residents are.

How to reason:
- Mortgage lending (HMDA) is realized housing demand: rising originations year-over-year = strengthening purchase demand; a high or rising denial rate = tightening credit access that caps demand. Read origination momentum and denial rate together.
- Employment & wages (QCEW) are the demand FOUNDATION: rising employment and rising average weekly wage support housing demand and price support; falling employment is a leading indicator of demand softening. Note the YoY change, not just the level.
- Migration (IRS SOI), when present: net in-migration = demand inflow; compare the AVERAGE INCOME of in-movers vs out-movers — higher-income households moving in is a classic early gentrification / upward-pressure signal, higher-income households leaving is the reverse. If migration data is absent, simply omit it — do not infer.
- Housing-cost context (median gross rent, median home value, tract population) is the PRICE LEVEL demand acts against: strengthening lending and employment against a lower cost base leaves more room for price support than the same signals against an already-high base. Use these as price context only; never infer anything about the residents (income, education, class, ethnicity, tenure, "character") from them.
- Treat any data point with provenance "representative" as indicative only — say so explicitly in the observation that uses it, and cap how much weight it carries.
- Your verdict is about demand: "buy" = demand momentum building, "hold" = stable demand, "wait" = signals unclear or early, "sell"/"drop" = demand deteriorating.
- risk_score reflects demand-side risk (demand reversal, credit tightening, out-migration).
- Language rules: never use the words gentrification, gentrifying, affluent, wealthy, upscale, educated, college-educated, demographic profile/shift, or any description of residents by income, education, class, race, ethnicity or origin. Describe the market signals, not the people.`;

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
    // Housing-cost context only. Household income and education attainment are
    // deliberately NOT passed: resident composition is not a verdict input.
    dataPoints.push(
      { label: `tract_population (${d.vintage})`, value: d.population, provenance: p, source: s },
      { label: 'median_gross_rent_usd', value: d.median_gross_rent, provenance: p, source: s },
      { label: 'median_home_value_usd', value: d.median_home_value, provenance: p, source: s }
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
