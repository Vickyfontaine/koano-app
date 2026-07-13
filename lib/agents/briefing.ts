// KOANO portfolio briefing generator — Phase B, Cluster 5.
// Composes a Monday-morning-format portfolio briefing for institutional
// users from REAL data only: the portfolio's latest verdicts (append-only
// audit trail), live permit activity and flood status per property, and the
// live metro price index. Written by the runtime model, labeled as generated,
// provenance = weakest input. Decision support, never decision-making —
// the prompt enforces the language (Section 08, Cluster 5 liability).

import { registry } from '../providers/registry';
import type { DataPoint, Provenance } from '../providers/types';
import { getAnthropicClient, KOANO_RUNTIME_MODEL, weakestProvenance } from './shared';

const SYSTEM_PROMPT = `You are KOANO's portfolio briefing writer for institutional real estate teams (REITs, funds, C-suite). Write a Monday-morning portfolio briefing from the provided data.

Rules:
- Use ONLY the provided data points. Never invent holdings, transactions, valuations, or events not present in the data.
- Cite concrete figures (scores, counts, percentages, zones) with their subject property.
- Data points marked provenance "representative" are indicative stand-ins, not live market data — say "indicative" when using them.
- Decision-support language only: "the data shows", "worth reviewing", "flag for diligence". NEVER "you should buy/sell", never guarantees or predictions beyond the data.
- Sober institutional tone. No hype.
- Structure with exactly these four plain-text section headers, each on its own line, in caps:
PORTFOLIO SUMMARY
PROPERTY NOTES
RISK WATCH
THE WEEK AHEAD
- Under PROPERTY NOTES, one short paragraph per property. Under THE WEEK AHEAD, only follow-ups grounded in the data (e.g. re-run analysis where confidence was low, review a flood designation) — no invented events.
- 250-400 words total. Plain text only.`;

export interface BriefingProperty {
  address: string; // normalized
  bbl: string | null;
  latest_verdict: {
    verdict: string;
    confidence: number;
    risk_score: number;
    overall_provenance: Provenance;
    headline: string;
    created_at: string;
  } | null;
}

export interface BriefingResult {
  briefing: string;
  overall_provenance: Provenance;
  sources: string[];
  properties_covered: number;
  generated_at: string;
}

const MAX_PROPERTIES = 5;

export async function generateBriefing(properties: BriefingProperty[]): Promise<BriefingResult> {
  if (properties.length === 0) {
    throw new Error('No properties in the portfolio — add properties first');
  }
  const covered = properties.slice(0, MAX_PROPERTIES);

  const dataPoints: DataPoint[] = [];
  const push = (
    label: string,
    value: string | number | null,
    p: { provenance: Provenance; source: string },
  ) => {
    if (value !== null && value !== undefined) {
      dataPoints.push({ label, value, provenance: p.provenance, source: p.source });
    }
  };

  // Per-property: latest verdict (audit trail) + live permits + live flood.
  await Promise.all(
    covered.map(async (prop) => {
      const label = prop.address;
      if (prop.latest_verdict) {
        const v = prop.latest_verdict;
        push(
          `${label} — latest KOANO verdict (${v.created_at.slice(0, 10)})`,
          `${v.verdict}, confidence ${v.confidence}, risk ${v.risk_score}: ${v.headline}`,
          { provenance: v.overall_provenance, source: 'KOANO verdict audit trail' },
        );
      } else {
        push(`${label} — latest KOANO verdict`, 'none yet — analysis not run', {
          provenance: 'live',
          source: 'KOANO verdict audit trail',
        });
      }

      const geo = await registry.geocode.resolve(prop.address);
      if (!geo.ok || !geo.data) return;
      const [permits, flood] = await Promise.all([
        registry.permits.getPermits(geo.data),
        registry.flood.getFloodZone(geo.data),
      ]);
      if (permits.data) {
        push(
          `${label} — construction permits last 24 months`,
          `${permits.data.total_permits_24mo} total, ${permits.data.new_building_permits} new-building, ${permits.data.demolition_permits} demolition`,
          permits,
        );
      }
      if (flood.data) {
        push(
          `${label} — FEMA flood status`,
          `zone ${flood.data.flood_zone ?? 'unknown'}, ${flood.data.in_special_flood_hazard_area ? 'INSIDE' : 'outside'} Special Flood Hazard Area`,
          flood,
        );
      }
    }),
  );

  // Metro price index once (same metro for NYC portfolios).
  const firstGeo = await registry.geocode.resolve(covered[0].address);
  if (firstGeo.ok && firstGeo.data) {
    const hpi = await registry.hpi.getHpi(firstGeo.data);
    if (hpi.data) {
      push(
        `Metro price index — ${hpi.data.region} (${hpi.data.latest_period})`,
        `${hpi.data.yoy_change_pct}% yoy, ${hpi.data.five_yr_change_pct}% 5yr`,
        hpi,
      );
    }
  }

  if (dataPoints.length === 0) {
    throw new Error('No data available to write a briefing from');
  }

  const msg = await getAnthropicClient().messages.create({
    model: KOANO_RUNTIME_MODEL,
    max_tokens: 1200,
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
            portfolio_size: properties.length,
            properties_in_briefing: covered.length,
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
    throw new Error('Briefing generation returned no text');
  }

  return {
    briefing: textBlock.text.trim(),
    overall_provenance: weakestProvenance(dataPoints),
    sources: Array.from(new Set(dataPoints.map((d) => d.source))),
    properties_covered: covered.length,
    generated_at: new Date().toISOString(),
  };
}
