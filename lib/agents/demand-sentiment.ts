// KOANO Demand Sentiment agent — Step 4c.
// MIXED inputs: search trends (google-trends) + demographics (census-acs) — live path;
// foot traffic (placer-traffic) — representative until Placer.ai is licensed.
// Depends ONLY on the provider registry. Output: AgentVerdict (KoanoVerdict schema).

import { registry } from '../providers/registry';
import type { DataPoint, ResolvedAddress } from '../providers/types';
import { assembleAgentVerdict, callAgentLLM, type AgentVerdict } from './shared';

const SYSTEM_PROMPT = `You are KOANO's Demand Sentiment specialist agent — one of five specialist real estate reasoning agents.

Your domain: who wants to be in this neighborhood and how badly — foot traffic, search interest, and the demographic profile of current residents. You estimate demand momentum and gentrification stage.

How to reason:
- Rising search interest + rising foot traffic = demand momentum building before it prices in.
- Demographics tell you WHERE in the arc a neighborhood is: high income + high education + high home values = late-stage (stages 5-7, less upside, more stability); moderate income with strong education influx = mid-arc (stages 3-5, most price appreciation happens here).
- Weekend foot-traffic share indicates destination/retail pull vs pure residential.
- Treat any data point with provenance "representative" as indicative only — say so explicitly in the observation that uses it, and cap how much weight it carries.
- Your verdict is about demand: "buy" = demand momentum building, "hold" = stable demand, "wait" = signals unclear or early, "sell"/"drop" = demand deteriorating.
- risk_score reflects demand-side risk (demand reversal, tourist-dependence, displacement pressure).
- In one reasoning step, estimate the gentrification stage on a 1-7 scale and justify it from the demographics.`;

export async function runDemandSentimentAgent(addr: ResolvedAddress): Promise<AgentVerdict> {
  const [trendsRes, demoRes, footRes] = await Promise.all([
    registry.searchTrends.getSearchTrends(addr),
    registry.demographics.getDemographics(addr),
    registry.footTraffic.getFootTraffic(addr),
  ]);

  const dataPoints: DataPoint[] = [];

  if (trendsRes.data) {
    const t = trendsRes.data;
    dataPoints.push(
      { label: `search_interest_current (term: "${t.term}")`, value: t.interest_current, provenance: trendsRes.provenance, source: trendsRes.source },
      { label: 'search_interest_12mo_avg', value: t.interest_12mo_avg, provenance: trendsRes.provenance, source: trendsRes.source },
      { label: 'search_momentum', value: t.momentum, provenance: trendsRes.provenance, source: trendsRes.source }
    );
  } else {
    dataPoints.push({ label: 'search_trends_unavailable', value: trendsRes.error ?? 'no data', provenance: trendsRes.provenance, source: trendsRes.source });
  }

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

  if (footRes.data) {
    const f = footRes.data;
    const s = footRes.source;
    const p = footRes.provenance;
    dataPoints.push(
      { label: `foot_traffic_monthly_visits (${f.area})`, value: f.monthly_visits, provenance: p, source: s },
      { label: 'foot_traffic_yoy_change_pct', value: f.yoy_change_pct, provenance: p, source: s },
      { label: 'foot_traffic_weekend_share_pct', value: f.weekend_share_pct, provenance: p, source: s }
    );
  } else {
    dataPoints.push({ label: 'foot_traffic_unavailable', value: footRes.error ?? 'no data', provenance: footRes.provenance, source: footRes.source });
  }

  const llm = await callAgentLLM({
    agent: 'demand-sentiment',
    systemPrompt: SYSTEM_PROMPT,
    addressLabel: addr.normalized || addr.input,
    dataPoints,
  });

  return assembleAgentVerdict({ agent: 'demand-sentiment', llm, dataPoints });
}
