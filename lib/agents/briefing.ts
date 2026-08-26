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
import { buildAllowedTokens, groundObservation } from './grounding';

// Shown in place of a briefing line that reproduces a claim not traceable to the
// portfolio data (the last model call in the product behind the grounding gate).
const WITHHELD_BRIEFING_LINE =
  '[A statement was withheld from this briefing because it could not be traced to the portfolio data.]';

const SYSTEM_PROMPT = `You are KOANO's portfolio briefing writer for institutional real estate teams (REITs, funds, C-suite). Write a Monday-morning portfolio briefing from the provided data.

Rules:
- Use ONLY the provided data points. Never invent holdings, transactions, valuations, or events not present in the data.
- GROUNDING (critical): do NOT name a place, neighborhood, program, statute, year, or designation that is not present in the data points. In particular, do not expand a coded value (a special-district letter, a zoning code) into a named district or program from general knowledge, and do not repeat such an expansion even if it appears inside a verdict headline you were given — reference the property by its address and the figures you were given.
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
  // Per-source provenance (weakest across that source's data points), so a
  // consumer (the Monday Briefing PDF) can build an honest provenance appendix.
  // The verdict IS one of these sources ("KOANO verdict audit trail"), so the
  // rollup already accounts for both data and verdict provenance.
  source_provenance: { source: string; provenance: Provenance }[];
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

  const userPayload = JSON.stringify(
    {
      portfolio_size: properties.length,
      properties_in_briefing: covered.length,
      data_points: dataPoints.map((d) => ({ label: d.label, value: d.value, provenance: d.provenance, source: d.source })),
    },
    null,
    2,
  );

  async function runModel(messages: { role: 'user' | 'assistant'; content: string }[]): Promise<string> {
    const msg = await getAnthropicClient().messages.create({
      model: KOANO_RUNTIME_MODEL,
      max_tokens: 1200,
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
      messages,
    });
    const tb = msg.content.find((b) => b.type === 'text');
    if (!tb || tb.type !== 'text' || !tb.text.trim()) throw new Error('Briefing generation returned no text');
    return tb.text.trim();
  }

  // --- GROUNDING GATE ---------------------------------------------------------
  // The briefing is the last model call in the product; it demonstrably
  // reproduces verdict headlines into prose, so it runs the same detector as the
  // agents and document narratives: every specific claim must trace to a
  // portfolio data point. On a miss, re-prompt once, then WITHHOLD the offending
  // line visibly (never silently) — the exposure that produced the Superfund claim.
  const allowed = buildAllowedTokens(dataPoints, covered.map((p) => p.address).join(' '));
  // Structural headers are not claims — skip them (they are all-caps and would
  // otherwise read as acronyms). Ground only content lines.
  const HEADERS = new Set(['PORTFOLIO SUMMARY', 'PROPERTY NOTES', 'RISK WATCH', 'THE WEEK AHEAD']);
  const isContent = (line: string): boolean => {
    const t = line.trim();
    return t.length > 0 && !HEADERS.has(t.toUpperCase());
  };
  const ungroundedTermsIn = (text: string): string[] =>
    Array.from(
      new Set(
        text
          .split('\n')
          .filter(isContent)
          .flatMap((l) => groundObservation(l.trim(), allowed).ungrounded),
      ),
    );

  const firstText = await runModel([{ role: 'user', content: userPayload }]);
  let briefingText = firstText;
  const firstBad = ungroundedTermsIn(firstText);
  if (firstBad.length > 0) {
    console.warn(`[grounding] briefing: untraceable ${JSON.stringify(firstBad)} — re-prompting once`);
    const correction =
      `Some statements could not be traced to the provided data points: ${firstBad
        .map((t) => `"${t}"`)
        .join(', ')}. These read as general knowledge, not sourced facts. Rewrite using ONLY the data points — do not name a place, program, statute, year, or designation that is not present in the data. Keep the exact four section headers. Return the briefing text only.`;
    const secondText = await runModel([
      { role: 'user', content: userPayload },
      { role: 'assistant', content: firstText },
      { role: 'user', content: correction },
    ]);
    // Withhold any CONTENT line still ungrounded; headers and clean lines pass.
    briefingText = secondText
      .split('\n')
      .map((line) => {
        if (!isContent(line)) return line;
        if (groundObservation(line.trim(), allowed).grounded) return line;
        console.warn('[grounding] briefing: WITHHELD a line that stayed untraceable after retry');
        return WITHHELD_BRIEFING_LINE;
      })
      .join('\n');
  }

  // Weakest provenance per source (a source is representative if ANY of its
  // points are), preserving first-seen order.
  const bySource = new Map<string, Provenance>();
  for (const d of dataPoints) {
    const prev = bySource.get(d.source);
    bySource.set(d.source, prev ? weakestProvenance([{ provenance: prev }, { provenance: d.provenance }]) : d.provenance);
  }

  return {
    briefing: briefingText,
    overall_provenance: weakestProvenance(dataPoints),
    sources: Array.from(new Set(dataPoints.map((d) => d.source))),
    source_provenance: Array.from(bySource, ([source, provenance]) => ({ source, provenance })),
    properties_covered: covered.length,
    generated_at: new Date().toISOString(),
  };
}
