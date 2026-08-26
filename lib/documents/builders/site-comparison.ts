// KOANO document engine — Three-Site Comparison Brief (Cluster 4).
// The screening memo's read, across up to three sites, rendered as a single
// comparison grid: sites are columns, every row is present for every site, so
// the three are genuinely comparable. Same all-live constraint, same
// deterministic verdict rule; one model call ranks and recommends.

import { buildProvenanceAppendix, type ProvenanceAppendix } from '../disclaimer';
import type { BlockKey, SiteDetailBlock } from '../../providers/blocks';
import type { Provenance } from '../../providers/types';
import { weakestProvenance, isTrustedProvenance } from '../../providers/provenance';
import type { DocumentData, Letterhead } from '../types';
import type { RenderModel, RenderSection } from '../render/model';
import { getAnthropicClient, KOANO_RUNTIME_MODEL } from '../../agents/shared';
import { SELECTION_RULE, capSentences, type ScreeningFacts, type ScreeningVerdict } from './site-screening';

export interface ComparisonSite {
  address: string;
  data: DocumentData;
  facts: ScreeningFacts;
  verdict: ScreeningVerdict;
}

function fmtInt(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return Math.round(n).toLocaleString('en-US');
}
function fmtMoney(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return `$${Math.round(n).toLocaleString('en-US')}`;
}
// Short, non-truncating column label: abbreviate street types, then only
// ellipsize at a word boundary if still long (never mid-word like "Bouleva").
function shortAddr(a: string): string {
  let s = (a.split(',')[0] || a).trim();
  s = s
    .replace(/\bBoulevard\b/gi, 'Blvd')
    .replace(/\bStreet\b/gi, 'St')
    .replace(/\bAvenue\b/gi, 'Ave')
    .replace(/\bPlace\b/gi, 'Pl')
    .replace(/\bRoad\b/gi, 'Rd')
    .replace(/\bDrive\b/gi, 'Dr')
    .replace(/\bParkway\b/gi, 'Pkwy')
    .replace(/\bTerrace\b/gi, 'Ter');
  if (s.length > 22) s = s.slice(0, 21).replace(/\s\S*$/, '').trim() + '…';
  return s;
}
function decisionScore(d: ScreeningVerdict['decision']): number {
  return d === 'ADVANCE' ? 2 : d === 'HOLD' ? 1 : 0;
}
// Risk-adjusted rank key: decision dominates, confidence breaks ties.
function rankKey(v: ScreeningVerdict): number {
  return decisionScore(v.decision) * 100 + v.confidence;
}

// Combined provenance across the sites: for each block key, the weakest
// provenance across sites; demographics (best-effort) dropped unless live for
// every site, so one soft proof point can't drag the brief to representative.
function combinedAppendix(sites: ComparisonSite[]): ProvenanceAppendix {
  const keys = new Set<BlockKey>();
  for (const s of sites) for (const k of Object.keys(s.data.blocks) as BlockKey[]) keys.add(k);

  const blocks: Partial<Record<BlockKey, SiteDetailBlock<unknown>>> = {};
  for (const k of Array.from(keys)) {
    if (k === 'demographics') {
      const allLive = sites.every((s) => s.data.blocks.demographics?.provenance === 'live');
      if (!allLive) continue;
    }
    // pick a representative example row (prefer a representative one so its
    // fallback note shows), else the first live one.
    let chosen: SiteDetailBlock<unknown> | undefined;
    for (const s of sites) {
      const b = s.data.blocks[k];
      if (!b) continue;
      // Surface the weakest (least-trusted) instance of this block across sites.
      if (!isTrustedProvenance(b.provenance)) { chosen = b; break; }
      chosen = chosen ?? b;
    }
    if (chosen) blocks[k] = chosen;
  }
  const overall: Provenance = weakestProvenance(
    Object.values(blocks).filter((b): b is NonNullable<typeof b> => !!b),
  );
  // Use the first site's resolved_address only to satisfy the shape; the
  // appendix renders block rows, not the address.
  return buildProvenanceAppendix({ ...sites[0].data, blocks, overall_provenance: overall });
}

// ---- reasoning (single model call across all sites) -------------------------

export const COMPARISON_REASONING_SYSTEM_PROMPT = `You are KOANO's development site screening analyst comparing up to three sites. Write the "Reasoning" section of a comparison brief: 4 to 6 sentences, plain professional language.

Rules:
- Use ONLY the provided facts. Never invent figures or entitlement outcomes.
- Do NOT speculate beyond the facts. When a value is zero because a condition does not apply (e.g. adjacent-block unused FAR is zero on a single-lot block), do not invent an explanation for it.
- You MUST state the selection rule (provided) and rank the sites under it — explain why the top site ranks first, not just which one.
- Screening, not feasibility: no financial modelling, no pro forma, no rents or returns.
- Neutral, decision-support tone. Not investment advice, not a guarantee.
- No headings, no markdown, no preamble. Output plain sentences only.`;

function factsForModel(sites: ComparisonSite[]) {
  return {
    selection_rule: SELECTION_RULE,
    sites: sites.map((s) => ({
      site: shortAddr(s.address),
      verdict: s.verdict.decision,
      confidence: s.verdict.confidence,
      unused_far_pct: s.facts.unusedFarPct,
      base_max_floor_area_sqft: s.facts.baseMaxFloorArea,
      affordable_max_floor_area_sqft: s.facts.affMaxFloorArea,
      cd_approval_ratio_pct: s.facts.approvalRatio,
      cd_median_timeline_days: s.facts.cdMedianTimelineDays,
      opportunity_zone: s.facts.isOpportunityZone,
      in_special_flood_hazard_area: s.facts.inSFHA,
      open_hpd_violations: s.facts.openViolationsLot,
      block_unused_far_sqft: s.facts.blockUnusedFar,
    })),
  };
}

export function deterministicComparisonReasoning(sites: ComparisonSite[]): string[] {
  const ranked = [...sites].sort((a, b) => rankKey(b.verdict) - rankKey(a.verdict));
  const order = ranked.map((s) => `${shortAddr(s.address)} (${s.verdict.decision}, conf ${s.verdict.confidence})`).join(', then ');
  return [
    `${SELECTION_RULE} Applying that rule across the sites, the ranking is: ${order}.`,
    `The top-ranked site leads on development headroom and the community district’s entitlement record, net of any flood, violation, or speculation flag. This is a screening comparison of public record, not a feasibility study — it carries no financial modelling.`,
  ];
}

export async function generateComparisonReasoning(sites: ComparisonSite[]): Promise<string[]> {
  const msg = await getAnthropicClient().messages.create({
    model: KOANO_RUNTIME_MODEL,
    max_tokens: 400,
    system: [{ type: 'text', text: COMPARISON_REASONING_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: JSON.stringify(factsForModel(sites), null, 2) }],
  });
  const block = msg.content.find((b) => b.type === 'text');
  const text = block && block.type === 'text' ? block.text.trim() : '';
  if (!text) return deterministicComparisonReasoning(sites);
  return capSentences(text.split(/\n{2,}/).map((p) => p.replace(/\s+/g, ' ').trim()).filter(Boolean));
}

// ---- assembly ---------------------------------------------------------------

export function buildComparisonModel(args: {
  sites: ComparisonSite[];
  letterhead: Letterhead;
  reasoning: string[];
  generatedAt: string;
}): RenderModel {
  const { sites, letterhead, reasoning, generatedAt } = args;

  // Rank map (1 = best) by risk-adjusted key.
  const ranked = [...sites].sort((a, b) => rankKey(b.verdict) - rankKey(a.verdict));
  const rankOf = new Map<ComparisonSite, number>();
  ranked.forEach((s, i) => rankOf.set(s, i + 1));

  const cols = ['Metric', ...sites.map((s) => shortAddr(s.address))];
  const row = (label: string, val: (s: ComparisonSite) => string): string[] => [label, ...sites.map(val)];

  const rows: string[][] = [
    row('KOANO verdict', (s) => `${s.verdict.decision} (${s.verdict.confidence})`),
    row('Risk-adjusted rank', (s) => `#${rankOf.get(s)}`),
    row('Zoning district', (s) => s.facts.zoningDistrict ?? '—'),
    row('Base max floor area', (s) => `${fmtInt(s.facts.baseMaxFloorArea)} sf`),
    row('City of Yes affordable max', (s) => `${fmtInt(s.facts.affMaxFloorArea)} sf`),
    row('Unused development rights', (s) =>
      s.facts.unusedDevRights === 0 && (s.facts.buildingAreaSqft ?? 0) > 0
        ? '0 · built out'
        : `${fmtInt(s.facts.unusedDevRights)} sf`,
    ),
    row('CD approval ratio', (s) => (s.facts.approvalRatio != null ? `${s.facts.approvalRatio}%` : '—')),
    row('Median filing timeline', (s) => (s.facts.cdMedianTimelineDays != null ? `${fmtInt(s.facts.cdMedianTimelineDays)} d` : '—')),
    row('Opportunity Zone', (s) => (s.facts.isOpportunityZone ? 'Yes' : 'No')),
    row('Adjacent block unused FAR', (s) => `${fmtInt(s.facts.blockUnusedFar)} sf`),
    row('Flood (SFHA)', (s) => (s.facts.floodZone ? `${s.facts.floodZone}${s.facts.inSFHA ? ' · SFHA' : ''}` : '—')),
    row('Open HPD violations', (s) => fmtInt(s.facts.openViolationsLot)),
    row('Speculation watch', (s) => (s.facts.onSpeculationWatch ? 'Yes' : 'No')),
    row('Permit activity (24mo)', (s) => fmtInt(s.facts.permits24mo)),
    row('Recorded sales $/sf', (s) => (s.facts.compsMedianPsf != null ? fmtMoney(s.facts.compsMedianPsf) : '—')),
  ];

  const sections: RenderSection[] = [
    {
      heading: 'Site Comparison',
      table: {
        columns: cols,
        rows,
        caption: 'Identical structure across all sites — every row is present for every site. Envelope is FAR / floor area only, not height- or parking-complete.',
      },
    },
    { heading: 'Reasoning', paragraphs: reasoning },
  ];

  return {
    docTitle: 'Three-Site Comparison Brief',
    subtitle: sites.map((s) => shortAddr(s.address)).join('  ·  '),
    letterhead,
    sections,
    appendix: combinedAppendix(sites),
    generatedAt,
    compact: true,
  };
}
