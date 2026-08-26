// KOANO document engine — Portfolio Investment Committee Memo (Cluster 5).
// The first DOCX-primary, long-form type. It is a SCAFFOLD, not a complete IC
// memo: KOANO fills the five sections live public record supports and renders
// formatted, clearly-labeled placeholder sections for the four it cannot honestly
// source (financials, business plan, exit, key terms). It never fabricates or
// approximates the sections it cannot source.
//
// The verdict is REUSED from a stored analysis (the committee sees the same
// verdict the analyst brought forward), never re-run here. Its weighting
// breakdown is reconstructed from the stored agent_summaries (see
// breakdownFromSummaries) — zero model calls. At most one model call is made,
// for the executive summary narrative (fresh path only).

import type {
  ZoningInfo,
  MlsCompsSummary,
  HpiTrend,
  AcsDemographics,
  PermitsSummary,
  BuildingViolationsSummary,
  LandlordPortfolioSummary,
  FloodInfo,
  OpportunityZoneInfo,
  EntitlementSummary,
  Provenance,
} from '../../providers/types';
import type { SiteDetailBlock } from '../../providers/blocks';
import { isTrustedProvenance, PROVENANCE_LABEL } from '../../providers/provenance';
import type { DocumentData, Letterhead } from '../types';
import type { RenderModel, RenderSection } from '../render/model';
import { appendixWithVerdict, type ProvenanceAppendix } from '../disclaimer';
import { getAnthropicClient, KOANO_RUNTIME_MODEL } from '../../agents/shared';
import type { ReasoningStep } from '../../agents/shared';
import type { WeightingBreakdown } from '../../agents/synthesis';

const VERDICT_STALE_DAYS = 30;
const MAX_COMPS = 15;

function fmtMoney(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return `$${Math.round(n).toLocaleString('en-US')}`;
}
function fmtInt(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return Math.round(n).toLocaleString('en-US');
}
function fmtPct(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return `${n > 0 ? '+' : ''}${n.toFixed(1)}%`;
}
function fmtFar(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return n.toFixed(2);
}
function isLive(b: SiteDetailBlock<unknown> | undefined): boolean {
  return b?.provenance === 'live' && b?.data != null;
}

// verdict → title-page word + tone + a plain recommendation verb.
const VERDICT_PRESENTATION: Record<string, { word: string; tone: 'positive' | 'warning' | 'negative'; recommend: string }> = {
  buy: { word: 'BUY', tone: 'positive', recommend: 'advance to underwriting' },
  hold: { word: 'HOLD', tone: 'warning', recommend: 'hold and monitor' },
  wait: { word: 'WAIT', tone: 'warning', recommend: 'defer pending better entry' },
  sell: { word: 'SELL', tone: 'negative', recommend: 'exit / do not acquire' },
  drop: { word: 'PASS', tone: 'negative', recommend: 'pass' },
};

// The stored verdict the memo is built from (loaded by the route).
export interface IcMemoVerdict {
  verdict: string;
  confidence: number;
  risk_score: number;
  signal_window_months: number;
  headline: string;
  overall_provenance: Provenance;
  reasoning_chain: ReasoningStep[];
  breakdown: WeightingBreakdown;
  verdictGeneratedAt: string; // ISO — the stored verdict's created_at
}

export interface IcMemoFacts {
  addressLabel: string;
  bbl: string | null;
  borough: string | null;
  verdict: IcMemoVerdict;
  // Property (PLUTO)
  zoning: ZoningInfo | null;
  // Market
  hpi: HpiTrend | null;
  comps: MlsCompsSummary | null;
  permits: PermitsSummary | null;
  demoLive: boolean;
  demo: AcsDemographics | null;
  oz: OpportunityZoneInfo | null;
  // Risk
  violations: BuildingViolationsSummary | null;
  portfolio: LandlordPortfolioSummary | null;
  flood: FloodInfo | null;
  entitlement: EntitlementSummary | null;
}

export function extractIcMemoFacts(
  data: DocumentData,
  verdict: IcMemoVerdict,
): { ok: true; facts: IcMemoFacts } | { ok: false; error: string } {
  const zoning = data.blocks.zoning?.data as ZoningInfo | null | undefined;
  if (!zoning) return { ok: false, error: 'Zoning/PLUTO data unavailable — cannot build the property description.' };

  const demoLive = isLive(data.blocks.demographics);
  return {
    ok: true,
    facts: {
      addressLabel: data.resolved_address.normalized || data.resolved_address.input,
      bbl: data.resolved_address.bbl,
      borough: data.resolved_address.borough,
      verdict,
      zoning,
      hpi: (data.blocks.hpi?.data as HpiTrend) ?? null,
      comps: (data.blocks.mls_comps?.data as MlsCompsSummary) ?? null,
      permits: (data.blocks.permits?.data as PermitsSummary) ?? null,
      demoLive,
      demo: demoLive ? (data.blocks.demographics?.data as AcsDemographics) : null,
      oz: (data.blocks.opportunity_zone?.data as OpportunityZoneInfo) ?? null,
      violations: (data.blocks.building_violations?.data as BuildingViolationsSummary) ?? null,
      portfolio: (data.blocks.landlord_portfolio?.data as LandlordPortfolioSummary) ?? null,
      flood: (data.blocks.flood?.data as FloodInfo) ?? null,
      entitlement: (data.blocks.entitlement?.data as EntitlementSummary) ?? null,
    },
  };
}

// Whole days between two ISO timestamps (pure — no Date.now()).
export function daysBetween(fromIso: string, toIso: string): number {
  const ms = new Date(toIso).getTime() - new Date(fromIso).getTime();
  return Math.max(0, Math.floor(ms / 86_400_000));
}

export function stalenessBanner(verdictAgeDays: number): string | null {
  if (verdictAgeDays <= VERDICT_STALE_DAYS) return null;
  return (
    `STALENESS NOTICE: the underlying KOANO verdict is ${verdictAgeDays} days old. ` +
    `The market data in this memo was fetched at generation time, but the verdict, its confidence, and its reasoning reflect conditions as of the verdict date above. ` +
    `Re-run the analysis before relying on the recommendation.`
  );
}

// Appendix that (a) drops non-live demographics (best-effort ACS) so a transient
// miss doesn't flip the whole memo, and (b) accounts for the VERDICT itself as a
// provenance source. The verdict is not a data block — it is derived from agent
// inputs whose weakest provenance it carries — so a live-data memo built on a
// representative verdict is honestly a REPRESENTATIVE document. Overall document
// provenance is the weakest of the rendered blocks AND the verdict.
export function icMemoAppendix(
  data: DocumentData,
  demoLive: boolean,
  verdictProvenance: Provenance,
  verdictGeneratedAt: string,
): ProvenanceAppendix {
  return appendixWithVerdict(data, {
    dropDemographicsIfNotLive: true,
    demoLive,
    verdict: { provenance: verdictProvenance, generatedAt: verdictGeneratedAt },
  });
}

// --- executive summary (the single, optional narrative call) ---

// The payload is EXACTLY the figures the memo renders in its tables — nothing
// else. In particular it excludes the verdict headline and the agents' free-text
// reasoning, which are not rendered anywhere in the memo, so the narrative
// cannot cite a specific permit, district, or project that the reader can't see.
function execFactsForModel(f: IcMemoFacts) {
  const v = f.verdict;
  return {
    subject_address: f.addressLabel,
    recommendation: VERDICT_PRESENTATION[v.verdict]?.recommend ?? v.verdict,
    verdict: v.verdict,
    confidence: v.confidence,
    risk_score: v.risk_score,
    signal_window_months: v.signal_window_months,
    confidence_weighted_score: v.breakdown.aggregate_score,
    thresholds: v.breakdown.thresholds,
    property: {
      building_class: f.zoning?.building_class,
      year_built: f.zoning?.year_built,
      residential_units: f.zoning?.residential_units,
      zoning_district: f.zoning?.zoning_district,
      special_district: f.zoning?.special_district,
    },
    market: {
      hpi_yoy_pct: f.hpi?.yoy_change_pct,
      recorded_median_psf: f.comps?.median_price_per_sqft,
      recorded_price_trend: f.comps?.price_trend,
      area_permits_24mo: f.permits?.total_permits_24mo,
      new_building_permits_24mo: f.permits?.new_building_permits,
    },
    risk: {
      hpd_open_violations: f.violations?.hpd.open,
      flood_zone: f.flood?.flood_zone,
      in_special_flood_hazard_area: f.flood?.in_special_flood_hazard_area,
      speculation_watch: f.portfolio?.on_speculation_watch_list,
    },
  };
}

export const IC_MEMO_EXEC_SYSTEM_PROMPT = `You are KOANO's investment-committee memo writer. Write the "Executive Summary & Recommendation" section of an institutional IC memo: 150-210 words, sober institutional register.

Grounding — this is strict:
- Reference ONLY the figures in the JSON provided. They are EXACTLY what this memo renders in its tables. If a figure is not in the JSON, you may not mention it.
- Do NOT name any specific permit, special district, zoning program, incentive, Superfund/environmental designation, or named development project. Do NOT describe development activity beyond what the permit COUNTS state — e.g. if new_building_permits_24mo is 0, do not claim ground-up or active redevelopment.
- Never invent returns, cap rates, prices, or comps.
- Do NOT enumerate or attribute individual agent verdicts (e.g. "infrastructure returned buy") — Exhibit B lists the per-agent votes and getting one wrong would contradict it. Speak only to the aggregate score and the figure-based drivers.

Content:
- Open with the recommendation and the KOANO verdict, and cite the confidence-weighted score against the thresholds so the committee sees this is a scored decision, not an opinion.
- Name the strongest driver(s) and the chief risk in plain terms, drawn only from the provided market and risk figures.
- State plainly that this is decision-support built on public record, that KOANO cannot source financials/returns, and that those sections are left for the analyst.
- No headings, no markdown, no preamble. Output the section body as plain paragraphs only.`;

// Deterministic exec summary — grounded ONLY in the figures the memo renders
// (no agent free-text), so it can never assert a fact the reader cannot see.
export function deterministicExecSummary(f: IcMemoFacts): string[] {
  const v = f.verdict;
  const pres = VERDICT_PRESENTATION[v.verdict] ?? { word: v.verdict.toUpperCase(), recommend: v.verdict };
  const paras: string[] = [];
  paras.push(
    `KOANO's recommendation for ${f.addressLabel} is to ${pres.recommend}. The engine returns a ${v.verdict.toUpperCase()} verdict at confidence ${v.confidence}/100, with a confidence-weighted panel score of ${v.breakdown.aggregate_score} against thresholds (buy >= ${v.breakdown.thresholds.buy}, hold >= ${v.breakdown.thresholds.hold}, wait >= ${v.breakdown.thresholds.wait}). The assessed risk score is ${v.risk_score}/100 over a ${v.signal_window_months}-month signal window.`,
  );
  const marketBits: string[] = [];
  if (f.hpi?.yoy_change_pct != null) marketBits.push(`the ${f.hpi.region ?? 'regional'} House Price Index is ${fmtPct(f.hpi.yoy_change_pct)} year over year`);
  if (f.comps && f.comps.sales_count > 0) marketBits.push(`recorded residential sales are ${f.comps.price_trend} at a ${fmtMoney(f.comps.median_price_per_sqft)}/sq ft median across ${fmtInt(f.comps.sales_count)} sales`);
  if (f.permits) marketBits.push(`the area recorded ${fmtInt(f.permits.total_permits_24mo)} permits over 24 months (${fmtInt(f.permits.new_building_permits)} new-building)`);
  if (marketBits.length) paras.push(`Market signals: ${marketBits.join('; ')}.`);
  const riskBits: string[] = [];
  if (f.violations) riskBits.push(`${fmtInt(f.violations.hpd.open)} open HPD violations`);
  if (f.flood?.flood_zone) riskBits.push(`FEMA flood zone ${f.flood.flood_zone}${f.flood.in_special_flood_hazard_area ? ' (Special Flood Hazard Area)' : ' (outside the SFHA)'}`);
  if (f.portfolio?.on_speculation_watch_list) riskBits.push('the owner appears on the NYC speculation watch list');
  if (riskBits.length) paras.push(`Risk read: ${riskBits.join('; ')}.`);
  paras.push(
    `This memo is decision-support built on the public record. KOANO cannot source deal financials, returns, or terms; the Financial Analysis, Business Plan, Exit Strategy, and Key Terms sections are scaffolded for the analyst to complete before committee.`,
  );
  return paras;
}

export async function generateExecSummary(f: IcMemoFacts): Promise<string[]> {
  const msg = await getAnthropicClient().messages.create({
    model: KOANO_RUNTIME_MODEL,
    max_tokens: 520,
    system: [{ type: 'text', text: IC_MEMO_EXEC_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: JSON.stringify(execFactsForModel(f), null, 2) }],
  });
  const block = msg.content.find((b) => b.type === 'text');
  const text = block && block.type === 'text' ? block.text.trim() : '';
  if (!text) return deterministicExecSummary(f);
  // Strip any markdown emphasis the model emits despite the prompt (e.g.
  // **hold and monitor**), which would render as literal asterisks.
  return text
    .split(/\n{2,}/)
    .map((p) => p.replace(/\*\*(.+?)\*\*/g, '$1').replace(/(?<!\w)\*(?!\s)([^*]+?)\*(?!\w)/g, '$1').replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

// --- the pure model builder ---

export function buildIcMemoModel(args: {
  facts: IcMemoFacts;
  letterhead: Letterhead;
  execSummary: string[];
  appendix: RenderModel['appendix'];
  generatedAt: string;
}): RenderModel {
  const { facts: f, letterhead, execSummary, appendix, generatedAt } = args;
  const v = f.verdict;
  const pres = VERDICT_PRESENTATION[v.verdict] ?? { word: v.verdict.toUpperCase(), tone: 'warning' as const, recommend: v.verdict };
  const ageDays = daysBetween(v.verdictGeneratedAt, generatedAt);
  // Document provenance = weakest of blocks AND verdict (computed in the
  // appendix). Stated at the top so a representative document says so up front.
  const docProv = appendix.overall;
  const documentProvenanceNote = !isTrustedProvenance(docProv)
    ? `PROVENANCE: NOT FULLY LIVE (${PROVENANCE_LABEL[docProv].toUpperCase()}) — this memo includes a verdict and/or figures that are not fully live. See Sources & Provenance.`
    : 'PROVENANCE: LIVE — every rendered figure and the underlying verdict derive from live public data.';
  const sections: RenderSection[] = [];

  // 1 — Executive Summary & Recommendation.
  sections.push({
    number: '1',
    heading: 'Executive Summary & Recommendation',
    pageBreakBefore: true,
    provenanceNote: {
      provenance: v.overall_provenance,
      text:
        `Built from a stored KOANO verdict generated ${v.verdictGeneratedAt.slice(0, 10)} (${ageDays} day${ageDays === 1 ? '' : 's'} before this memo). ` +
        `Verdict provenance: ${v.overall_provenance}.`,
    },
    paragraphs: execSummary,
  });

  // 2 — Property Description (PLUTO).
  const z = f.zoning;
  sections.push({
    number: '2',
    heading: 'Property Description',
    table: {
      columns: ['Field', 'Value'],
      rows: [
        ['Address', f.addressLabel],
        ['BBL', f.bbl ?? '—'],
        ['Borough / community district', [f.borough, z?.community_district].filter(Boolean).join(' / ') || '—'],
        ['Zoning district', z?.zoning_district ?? '—'],
        ['Commercial overlay / special district', [z?.commercial_overlay, z?.special_district].filter(Boolean).join(' / ') || '—'],
        ['Building class / land use', [z?.building_class, z?.land_use_code].filter(Boolean).join(' / ') || '—'],
        ['Lot area / building area', `${fmtInt(z?.lot_area_sqft)} sq ft / ${fmtInt(z?.building_area_sqft)} sq ft`],
        ['Built FAR / max residential FAR', `${fmtFar(z?.built_far)} / ${fmtFar(z?.max_residential_far)}`],
        ['Max affordable-housing FAR (City of Yes)', fmtFar(z?.max_affordable_residential_far)],
        ['Year built / residential units', `${z?.year_built ?? '—'} / ${fmtInt(z?.residential_units)}`],
        ['Recorded owner', z?.owner_name ?? '—'],
        ['Assessed total / land (DOF)', `${fmtMoney(z?.assessed_total_usd)} / ${fmtMoney(z?.assessed_land_usd)}`],
      ],
      caption: 'Source: NYC DOF assessment roll via MapPLUTO (live).',
    },
  });

  // 3 — Market & Submarket Analysis.
  const marketRows: string[][] = [
    ['House Price Index — YoY', f.hpi ? `${fmtPct(f.hpi.yoy_change_pct)}${f.hpi.region ? ` (${f.hpi.region})` : ''}` : '—'],
    ['House Price Index — 5-year', fmtPct(f.hpi?.five_yr_change_pct)],
    ['Recorded sale $/sq ft (median)', fmtMoney(f.comps?.median_price_per_sqft)],
    ['Recorded sales in scope / trend', f.comps ? `${fmtInt(f.comps.sales_count)} / ${f.comps.price_trend}` : '—'],
    ['Neighborhood permits (24 months)', fmtInt(f.permits?.total_permits_24mo)],
    ['New-building permits (24 months)', fmtInt(f.permits?.new_building_permits)],
    ['Opportunity Zone', f.oz ? (f.oz.is_opportunity_zone ? 'Yes' : 'No') : '—'],
  ];
  if (f.demoLive && f.demo) {
    marketRows.push(['Median household income (tract)', fmtMoney(f.demo.median_household_income)]);
    marketRows.push(['Median gross rent (tract)', fmtMoney(f.demo.median_gross_rent)]);
    marketRows.push(['Median home value / population', `${fmtMoney(f.demo.median_home_value)} / ${fmtInt(f.demo.population)}`]);
  }
  const marketSection: RenderSection = {
    number: '3',
    heading: 'Market & Submarket Analysis',
    table: { columns: ['Indicator', 'Reading'], rows: marketRows, caption: f.demo?.vintage ? `Demographics: ${f.demo.vintage}.` : undefined },
  };
  if (!f.demoLive) {
    marketSection.trimNote = 'Census ACS demographics were unavailable this run and are omitted rather than shown representative.';
  }
  sections.push(marketSection);

  // 4 — Risk Factors & Mitigants.
  const riskRows: string[][] = [];
  if (f.violations) {
    riskRows.push([
      `Building violations — HPD ${fmtInt(f.violations.hpd.open)} open of ${fmtInt(f.violations.hpd.total)}; ECB ${fmtInt(f.violations.ecb.active)} active; DOB ${fmtInt(f.violations.dob_complaints.active)} active`,
      f.violations.hpd_registered ? 'Quantify remediation cost in diligence; open Class C are immediately hazardous.' : 'Building outside HPD 3+-unit coverage — zeros are a coverage fact, not a clean record.',
    ]);
  }
  if (f.flood) {
    riskRows.push([
      `Flood — FEMA zone ${f.flood.flood_zone ?? 'n/a'}${f.flood.in_special_flood_hazard_area ? ' (Special Flood Hazard Area)' : ''}`,
      f.flood.in_special_flood_hazard_area ? 'Flood insurance required; model premium + resale impact into returns.' : 'Outside SFHA — limited flood exposure on current maps.',
    ]);
  }
  if (f.portfolio) {
    // The bare "0 buildings" reading is misleading when it simply means the
    // building is not an HPD-registered multiple dwelling — HPD registration
    // (3+ residential units) is a different lens from the PLUTO recorded owner.
    // Make that distinction explicit rather than printing a bare zero next to a
    // named PLUTO owner.
    if (f.portfolio.hpd_registered && f.portfolio.portfolio_building_count > 0) {
      riskRows.push([
        `Ownership concentration — ${fmtInt(f.portfolio.portfolio_building_count)} building(s) under the HPD-registered owner; ${fmtInt(f.portfolio.portfolio_open_hpd_violations)} open HPD violations portfolio-wide${f.portfolio.on_speculation_watch_list ? '; on NYC speculation watch list' : ''}`,
        f.portfolio.on_speculation_watch_list ? 'Speculation-watch status warrants a closer read of the seller and title.' : 'Confirm seller motivation and any cross-collateralization across the portfolio.',
      ]);
    } else {
      riskRows.push([
        `Ownership — PLUTO recorded owner is ${f.zoning?.owner_name ?? 'not recorded'}. The building is not an HPD-registered multiple dwelling, so an HPD portfolio-concentration read does not apply here`,
        'Concentration and related-party risk must come from title, ACRIS, and DOF records; HPD registration covers only 3+-unit residential buildings, which this is not.',
      ]);
    }
  }
  if (f.entitlement) {
    riskRows.push([
      `Entitlement track record — CD ${f.entitlement.community_district ?? ''} approval ratio ${f.entitlement.cd_approval_ratio_pct != null ? f.entitlement.cd_approval_ratio_pct + '%' : '—'}, median timeline ${f.entitlement.cd_median_timeline_days != null ? f.entitlement.cd_median_timeline_days + ' days' : '—'}`,
      'Track record is community-district level; a project-specific pre-application read is still required.',
    ]);
  }
  if (riskRows.length === 0) riskRows.push(['No public-record risk flags retrieved', 'Absence of flags is not clearance — complete standard diligence.']);
  sections.push({
    number: '4',
    heading: 'Risk Factors & Mitigants',
    table: { columns: ['Risk factor', 'Mitigant / note'], rows: riskRows, caption: 'Public-record risk read; not a substitute for third-party diligence.' },
  });

  // 5 — Comparable Sales (body overview; full set in Exhibit A).
  const compsCount = f.comps?.sales_count ?? 0;
  sections.push({
    number: '5',
    heading: 'Comparable Sales',
    provenanceNote: {
      provenance: 'live',
      text: 'RESIDENTIAL recorded sales from NYC DOF Rolling Sales — NOT institutional CRE transactions. Recorded sales have no days-on-market.',
    },
    paragraphs: [
      compsCount > 0
        ? `${fmtInt(compsCount)} qualifying residential recorded sales are in scope, at a median of ${fmtMoney(f.comps?.median_price_per_sqft)}/sq ft with a ${f.comps?.price_trend} recent trend. ${f.comps?.scope_note ?? ''} The full comparable set is in Exhibit A.`
        : 'No qualifying residential recorded sales were returned in scope for this address. See Exhibit A.',
    ],
  });

  // 6–9 — Analyst placeholders.
  const placeholders: Array<[string, string, string]> = [
    ['6', 'Financial Analysis, Returns & Sensitivity', 'Underwriting model, going-in and stabilized yields, IRR/equity multiple, and a sensitivity table across rent, exit cap, and cost assumptions. KOANO does not source deal financials.'],
    ['7', 'Business Plan', 'The value-creation thesis: acquisition basis, capital plan, lease-up or reposition strategy, and operating assumptions.'],
    ['8', 'Exit Strategy', 'Hold period, exit route (sale/refi/recap), target exit pricing, and the buyer universe at exit.'],
    ['9', 'Key Terms', 'Structure, price, financing terms, closing conditions, and material contingencies.'],
  ];
  for (const [num, heading, note] of placeholders) {
    sections.push({ number: num, heading, placeholder: { note } });
  }

  // Exhibit A — full comparable set.
  const comps = f.comps?.comps ?? [];
  const shownComps = comps.slice(0, MAX_COMPS);
  const exhibitA: RenderSection = {
    number: 'A',
    heading: 'Exhibit A — Comparable Recorded Sales (Full Set)',
    pageBreakBefore: true,
    provenanceNote: { provenance: 'live', text: 'Residential recorded sales (NYC DOF Rolling Sales). Not institutional CRE comps.' },
    table: {
      columns: ['Address', 'Sale date', 'Sale price', '$/sq ft', 'Sq ft', 'Class'],
      rows: shownComps.map((c) => [c.address, (c.sale_date || '').slice(0, 10), fmtMoney(c.sale_price), fmtMoney(c.price_per_sqft), fmtInt(c.gross_square_feet), c.building_class]),
      caption: `${fmtInt(compsCount)} sales in scope.`,
    },
  };
  if (comps.length > shownComps.length) {
    exhibitA.trimNote = `Showing ${shownComps.length} of ${fmtInt(comps.length)} comparable sales; the remainder are omitted for length.`;
  }
  sections.push(exhibitA);

  // Exhibit B — Verdict Math (the reconstructed weighting breakdown).
  const b = v.breakdown;
  sections.push({
    number: 'B',
    heading: 'Exhibit B — Verdict Math',
    paragraphs: [
      `KOANO's verdict is a confidence-weighted vote across five specialist agents. Each agent's confidence is its weight; its verdict sets a direction; contribution = confidence × direction. The weighted score is compared to fixed thresholds (method: ${b.method}).`,
    ],
    table: {
      columns: ['Agent', 'Verdict', 'Confidence (weight)', 'Direction', 'Contribution'],
      rows: [
        ...b.agents.map((a) => [a.agent, a.verdict, fmtInt(a.confidence), String(a.direction), (a.contribution >= 0 ? '+' : '') + fmtInt(a.contribution)]),
        ['— Weighted score —', '', fmtInt(b.total_weight), '', String(b.aggregate_score)],
      ],
      caption: `Weighted score ${b.aggregate_score} vs thresholds: buy ≥ ${b.thresholds.buy}, hold ≥ ${b.thresholds.hold}, wait ≥ ${b.thresholds.wait} → ${b.chosen_verdict.toUpperCase()} at confidence ${v.confidence}/100.`,
    },
  });

  return {
    docTitle: 'Investment Committee Memo',
    subtitle: f.addressLabel,
    letterhead,
    longForm: true,
    titleBanner: { decision: pres.word, tone: pres.tone, confidence: v.confidence },
    verdictGeneratedAt: v.verdictGeneratedAt,
    stalenessBanner: stalenessBanner(ageDays),
    documentProvenance: docProv,
    documentProvenanceNote,
    sections,
    appendix,
    generatedAt,
  };
}
