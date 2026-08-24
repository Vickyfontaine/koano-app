// KOANO neighborhood narrative generator — Phase B, Cluster 2.
// Produces a client-ready neighborhood narrative for agents/brokers, written
// by the runtime model from provider data ONLY (never invented facts).
// The output is a GENERATED text: the UI labels it as such, and its
// provenance rolls up to the weakest input (Section 06). Comps are now LIVE
// NYC recorded sales; any remaining representative input (on a live-call
// fallback) is still referred to as an indicative benchmark, never as live
// market data.

import { registry } from '../providers/registry';
import type { DataPoint, Provenance, ResolvedAddress } from '../providers/types';
import { getAnthropicClient, KOANO_RUNTIME_MODEL, weakestProvenance } from './shared';

const SYSTEM_PROMPT = `You are KOANO's neighborhood narrative writer for real estate agents and brokers. Write a client-ready neighborhood narrative for the subject address: 150-220 words, plain professional language a client can read as-is.

Rules:
- Use ONLY the provided data points. Never invent facts, comps, amenities, school ratings, or trends not present in the data.
- Cite concrete figures from the data (prices, percentages, counts, periods) — that is what makes the narrative credible.
- Data points marked provenance "representative" are indicative benchmarks, NOT live market data. When you use one, call it an "indicative benchmark" — never imply live MLS access.
- No hype words (hot, skyrocketing, once-in-a-lifetime). No investment guarantees. No predictions beyond what the data shows.
- Structure: neighborhood character from demographics → market conditions (prices, velocity) → activity signals (permits, mortgage lending, employment) → one measured closing sentence.
- Output the narrative as plain text only. No headings, no markdown, no preamble.`;

export interface NarrativeResult {
  narrative: string;
  overall_provenance: Provenance;
  sources: string[];
  generated_at: string;
}

export async function generateNarrative(address: string): Promise<NarrativeResult> {
  const geo = await registry.geocode.resolve(address);
  if (!geo.ok || !geo.data) {
    throw new Error(`Geocoding failed for "${address}": ${geo.error ?? 'no data'}`);
  }
  return generateNarrativeForAddress(geo.data);
}

// Narrative from an ALREADY-RESOLVED address — used when the caller has re-derived
// the address server-side from a chosen disambiguation candidate, so resolution
// is never re-run (and never re-ambiguates).
export async function generateNarrativeForAddress(addr: ResolvedAddress): Promise<NarrativeResult> {
  const [demo, hpi, permits, mortgage, employment, comps] = await Promise.all([
    registry.demographics.getDemographics(addr),
    registry.hpi.getHpi(addr),
    registry.permits.getPermits(addr),
    registry.mortgageDemand.getMortgageDemand(addr),
    registry.employment.getEmployment(addr),
    registry.mlsComps.getComps(addr),
  ]);

  const dataPoints: DataPoint[] = [];
  const push = (label: string, value: string | number | null, p: { provenance: Provenance; source: string }) => {
    if (value !== null && value !== undefined) {
      dataPoints.push({ label, value, provenance: p.provenance, source: p.source });
    }
  };

  if (demo.data) {
    push(`population (${demo.data.vintage})`, demo.data.population, demo);
    push('median household income', demo.data.median_household_income, demo);
    push('median gross rent', demo.data.median_gross_rent, demo);
    push('median home value (owner-estimated)', demo.data.median_home_value, demo);
    push('bachelors degree or higher %', demo.data.bachelors_or_higher_pct, demo);
  }
  if (hpi.data) {
    push(`house price index region`, hpi.data.region, hpi);
    push(`home price change yoy % (${hpi.data.latest_period})`, hpi.data.yoy_change_pct, hpi);
    push('home price change 5yr %', hpi.data.five_yr_change_pct, hpi);
  }
  if (permits.data) {
    push('construction permits last 24 months', permits.data.total_permits_24mo, permits);
    push('new building permits last 24 months', permits.data.new_building_permits, permits);
  }
  if (mortgage.data) {
    push(`mortgage originations (${mortgage.data.year})`, mortgage.data.originations, mortgage);
    push('mortgage originations YoY %', mortgage.data.originations_yoy_pct, mortgage);
    push('mortgage denial rate %', mortgage.data.denial_rate_pct, mortgage);
  }
  if (employment.data) {
    push(`county employment (${employment.data.period})`, employment.data.total_employment, employment);
    push('employment YoY %', employment.data.employment_yoy_pct, employment);
    push('average weekly wage YoY %', employment.data.avg_weekly_wage_yoy_pct, employment);
  }
  if (comps.data) {
    push('median recorded-sale price per sq ft (NYC DOF recorded sales)', comps.data.median_price_per_sqft, comps);
    push('recorded residential sales in ZIP, last 12 months', comps.data.sales_count, comps);
    push('local price trend from recorded sales (recent vs prior period)', comps.data.price_trend, comps);
  }

  if (dataPoints.length === 0) {
    throw new Error('No provider data available to write a narrative from');
  }

  const msg = await getAnthropicClient().messages.create({
    model: KOANO_RUNTIME_MODEL,
    max_tokens: 700,
    system: [
      {
        type: 'text',
        text: SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' }, // prompt caching on the system prompt
      },
    ],
    messages: [
      {
        role: 'user',
        content: JSON.stringify(
          {
            subject_address: addr.normalized || addr.input,
            borough: addr.borough,
            data_points: dataPoints.map((d) => ({
              label: d.label,
              value: d.value,
              provenance: d.provenance,
              source: d.source,
            })),
          },
          null,
          2,
        ),
      },
    ],
  });

  const textBlock = msg.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text' || !textBlock.text.trim()) {
    throw new Error('Narrative generation returned no text');
  }

  return {
    narrative: textBlock.text.trim(),
    overall_provenance: weakestProvenance(dataPoints),
    sources: Array.from(new Set(dataPoints.map((d) => d.source))),
    generated_at: new Date().toISOString(),
  };
}
