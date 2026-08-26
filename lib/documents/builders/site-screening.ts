// KOANO document engine — Development Site Screening Memo (Cluster 4).
// A SCREENING memo, not a feasibility study: all-live public data, no financial
// modelling, no pro forma. It answers "is this site worth a closer look, and
// will they get to build it?" — deliberately positioned against competitors who
// sell financial models on top of a zoning envelope.
//
// The base-vs-affordable FAR contrast (City of Yes) is rendered as a HEADLINE
// figure, not a table row. Trimming to the 2-page ceiling is always VISIBLE.

import type {
  AcsDemographics,
  AssemblageSummary,
  BuildingViolationsSummary,
  EntitlementSummary,
  FloodInfo,
  HpiTrend,
  LandlordPortfolioSummary,
  MlsCompsSummary,
  OpportunityZoneInfo,
  PermitsSummary,
  Provenance,
  ZoningInfo,
} from '../../providers/types';
import type { BlockKey, SiteDetailBlock } from '../../providers/blocks';
import { weakestProvenance } from '../../providers/provenance';
import { buildProvenanceAppendix, type ProvenanceAppendix } from '../disclaimer';
import type { DocumentData, Letterhead } from '../types';
import type { RenderModel, RenderSection } from '../render/model';
import { getAnthropicClient, KOANO_RUNTIME_MODEL } from '../../agents/shared';

// Caps that keep the memo within its 2-page ceiling. Overflow past a cap is
// stated visibly (never silent). DD register is intentionally uncapped.
const MAX_RISK_ROWS = 5;
const MAX_PROOF_POINTS = 5;

function fmtInt(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return Math.round(n).toLocaleString('en-US');
}
function fmtMoney(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return `$${Math.round(n).toLocaleString('en-US')}`;
}
function fmtFar(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return n.toFixed(2);
}
function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, Math.round(n)));
}
function blockData<T>(b: SiteDetailBlock<unknown> | undefined): T | null {
  return (b?.data as T) ?? null;
}
function isLive(b: SiteDetailBlock<unknown> | undefined): boolean {
  return b?.provenance === 'live' && b?.data != null;
}

export interface ScreeningFacts {
  addressLabel: string;
  bbl: string | null;
  borough: string | null;
  communityDistrict: string | null;
  ownerName: string | null;
  // envelope
  zoningDistrict: string | null;
  lotAreaSqft: number | null;
  buildingAreaSqft: number | null;
  buildingClass: string | null;
  yearBuilt: number | null;
  baseResidFar: number | null;
  affResidFar: number | null;
  commFar: number | null;
  facilFar: number | null;
  builtFar: number | null;
  unusedFarPct: number | null;
  baseMaxFloorArea: number | null;
  affMaxFloorArea: number | null;
  unusedDevRights: number | null;
  isOpportunityZone: boolean;
  // entitlement
  approvalRatio: number | null;
  cdDisapproved: number;
  cdWithdrawn: number;
  cdSuspended: number;
  cdTotalFilings: number;
  cdMedianTimelineDays: number | null;
  subjectFilingCount: number;
  // assemblage
  blockLotCount: number;
  sameOwnerLotCount: number;
  sameOwnerBbls: string[];
  blockUnusedFar: number;
  sameOwnerUnusedFar: number;
  assemblageBlockNote: string;
  // proof points / risk
  permits24mo: number | null;
  compsMedianPsf: number | null;
  compsPriceTrend: string | null;
  compsSalesCount: number | null;
  demoIncome: number | null;
  demoPopulation: number | null;
  demoLive: boolean;
  demoVintage: string | null;
  hpiYoy: number | null;
  hpiRegion: string | null;
  floodZone: string | null;
  inSFHA: boolean;
  openViolationsLot: number;
  onSpeculationWatch: boolean;
  portfolioBuildingCount: number;
}

export function extractScreeningFacts(
  data: DocumentData,
): { ok: true; facts: ScreeningFacts } | { ok: false; error: string } {
  const b = data.blocks;
  const zoning = blockData<ZoningInfo>(b.zoning);
  if (!zoning) return { ok: false, error: 'Zoning/PLUTO data unavailable. Cannot screen this site.' };
  const oz = blockData<OpportunityZoneInfo>(b.opportunity_zone);
  const ent = blockData<EntitlementSummary>(b.entitlement);
  const asm = blockData<AssemblageSummary>(b.assemblage);
  const permits = blockData<PermitsSummary>(b.permits);
  const comps = blockData<MlsCompsSummary>(b.mls_comps);
  const demo = blockData<AcsDemographics>(b.demographics);
  const hpi = blockData<HpiTrend>(b.hpi);
  const flood = blockData<FloodInfo>(b.flood);
  const viol = blockData<BuildingViolationsSummary>(b.building_violations);
  const land = blockData<LandlordPortfolioSummary>(b.landlord_portfolio);

  const lot = zoning.lot_area_sqft;
  const baseFar = zoning.max_residential_far;
  const affFar = zoning.max_affordable_residential_far;
  const baseMax = baseFar != null && lot != null ? Math.round(baseFar * lot) : null;
  const affMax = affFar != null && lot != null ? Math.round(affFar * lot) : null;
  const unusedRights =
    baseMax != null && zoning.building_area_sqft != null ? Math.max(0, baseMax - zoning.building_area_sqft) : baseMax;

  return {
    ok: true,
    facts: {
      addressLabel: data.resolved_address.normalized || data.resolved_address.input,
      bbl: data.resolved_address.bbl,
      borough: data.resolved_address.borough,
      communityDistrict: zoning.community_district ?? ent?.community_district ?? null,
      ownerName: zoning.owner_name,
      zoningDistrict: zoning.zoning_district,
      lotAreaSqft: lot,
      buildingAreaSqft: zoning.building_area_sqft,
      buildingClass: zoning.building_class,
      yearBuilt: zoning.year_built,
      baseResidFar: baseFar,
      affResidFar: affFar,
      commFar: zoning.max_commercial_far,
      facilFar: zoning.max_facility_far,
      builtFar: zoning.built_far,
      unusedFarPct: zoning.unused_far_pct,
      baseMaxFloorArea: baseMax,
      affMaxFloorArea: affMax,
      unusedDevRights: unusedRights,
      isOpportunityZone: !!oz?.is_opportunity_zone,
      approvalRatio: ent?.cd_approval_ratio_pct ?? null,
      cdDisapproved: ent?.cd_disapproved ?? 0,
      cdWithdrawn: ent?.cd_withdrawn ?? 0,
      cdSuspended: ent?.cd_suspended ?? 0,
      cdTotalFilings: ent?.cd_total_filings ?? 0,
      cdMedianTimelineDays: ent?.cd_median_timeline_days ?? null,
      subjectFilingCount: ent?.subject_filing_count ?? 0,
      blockLotCount: asm?.block_lot_count ?? 0,
      sameOwnerLotCount: asm?.same_owner_lot_count ?? 0,
      sameOwnerBbls: asm?.same_owner_bbls ?? [],
      blockUnusedFar: asm?.block_unused_far_floor_area_sqft ?? 0,
      sameOwnerUnusedFar: asm?.same_owner_unused_far_floor_area_sqft ?? 0,
      assemblageBlockNote: asm?.block_note ?? '',
      permits24mo: permits?.total_permits_24mo ?? null,
      compsMedianPsf: comps?.median_price_per_sqft ?? null,
      compsPriceTrend: comps?.price_trend ?? null,
      compsSalesCount: comps?.sales_count ?? null,
      demoIncome: demo?.median_household_income ?? null,
      demoPopulation: demo?.population ?? null,
      demoLive: isLive(b.demographics),
      demoVintage: demo?.vintage ?? null,
      hpiYoy: hpi?.yoy_change_pct ?? null,
      hpiRegion: hpi?.region ?? null,
      floodZone: flood?.flood_zone ?? null,
      inSFHA: !!flood?.in_special_flood_hazard_area,
      openViolationsLot: viol?.hpd?.open ?? 0,
      onSpeculationWatch: !!land?.on_speculation_watch_list,
      portfolioBuildingCount: land?.portfolio_building_count ?? 0,
    },
  };
}

export interface ScreeningVerdict {
  decision: 'ADVANCE' | 'HOLD' | 'PASS';
  tone: 'positive' | 'warning' | 'negative';
  confidence: number;
  rationale: string;
}

// The selection rule, stated verbatim so the reasoning narrative can cite it.
export const SELECTION_RULE =
  'A site ADVANCEs when development headroom is material and the community district’s entitlement approval record is favorable, unless a flood, violation, or speculation flag disqualifies it; it HOLDs on mixed signals and PASSes when headroom or entitlement is weak.';

// Deterministic ADVANCE / HOLD / PASS — transparent scoring over live signals.
export function computeVerdict(f: ScreeningFacts): ScreeningVerdict {
  // Continuous scoring so magnitude actually moves the number — two sites with
  // different headroom and different entitlement timelines must not land on the
  // same figure. Base 50; each driver is a signed, bounded contribution.
  let score = 50;
  const pos: string[] = [];
  const neg: string[] = [];

  // 1. Headroom MAGNITUDE (primary): absolute buildable rights, continuous.
  //    ~+1 per 20k sq ft, capped at +20 (≈400k sq ft saturates).
  if (f.unusedDevRights != null) {
    const mag = clamp(f.unusedDevRights / 20000, 0, 20);
    score += mag;
    if (mag >= 12) pos.push(`${fmtInt(f.unusedDevRights)} sq ft of unused development rights`);
    else if (mag <= 3) neg.push('limited unused development rights');
  }
  // 2. Headroom EFFICIENCY (%): is the lot underbuilt relative to its district?
  if (f.unusedFarPct != null) {
    if (f.unusedFarPct >= 50) score += 8;
    else if (f.unusedFarPct >= 20) score += 4;
    else if (f.unusedFarPct < 5) { score -= 10; neg.push('little development headroom'); }
  }
  // 3. Entitlement FAVORABILITY: CD approval rate, continuous around 70%.
  if (f.approvalRatio != null) {
    score += clamp((f.approvalRatio - 70) / 2.5, -12, 12);
    if (f.approvalRatio >= 90) pos.push(`a ${f.approvalRatio}% CD approval rate`);
    else if (f.approvalRatio < 60) neg.push('a weak CD approval rate');
  }
  // 4. Entitlement TIMELINE friction: longer median filing timeline lowers the
  //    score, faster raises it — a real input, not a noted-but-ignored factor.
  if (f.cdMedianTimelineDays != null) {
    const friction = clamp((f.cdMedianTimelineDays - 300) / 40, -4, 12); // >300d penalizes, <300d rewards
    score -= friction;
    if (f.cdMedianTimelineDays >= 500) neg.push(`a ~${fmtInt(f.cdMedianTimelineDays)}-day entitlement timeline`);
    else if (f.cdMedianTimelineDays <= 300) pos.push('a fast entitlement timeline');
  }
  // 5. Flags.
  if (f.isOpportunityZone) { score += 5; pos.push('Opportunity Zone status'); }
  if (f.hpiYoy != null && f.hpiYoy < -3) { score -= 8; neg.push('falling area prices'); }
  if (f.inSFHA) { score -= 12; neg.push('a FEMA special flood hazard area'); }
  if (f.openViolationsLot > 0) { score -= 8; neg.push(`${f.openViolationsLot} open HPD violations`); }
  if (f.onSpeculationWatch) { score -= 8; neg.push('Speculation Watch List status'); }

  score = clamp(score, 0, 100);
  const decision: ScreeningVerdict['decision'] = score >= 66 ? 'ADVANCE' : score >= 45 ? 'HOLD' : 'PASS';
  const tone: ScreeningVerdict['tone'] = decision === 'ADVANCE' ? 'positive' : decision === 'HOLD' ? 'warning' : 'negative';

  // Confidence tracks the score's distance from the decision midpoint (a strong
  // signal either way is high confidence); trimmed if the highest-weight
  // entitlement signal is missing.
  let confidence = clamp(50 + Math.abs(score - 50) * 0.9, 45, 95);
  if (f.approvalRatio == null) confidence = clamp(confidence - 12, 40, 90);

  const posPart = pos.length ? pos.slice(0, 2).join(' and ') : 'limited positive signal';
  const negPart = neg.length ? `, against ${neg.slice(0, 2).join(' and ')}` : ', with no disqualifying flags';
  const rationale = `${posPart.charAt(0).toUpperCase()}${posPart.slice(1)}${negPart}.`;

  return { decision, tone, confidence, rationale };
}

// ---- reasoning narrative (the single model call; verdict path is template) --

export const SCREENING_REASONING_SYSTEM_PROMPT = `You are KOANO's development site screening analyst. Write the "Reasoning" section of a screening memo: 4 to 6 sentences, plain professional language.

Rules:
- Use ONLY the provided facts. Never invent figures, rules, or entitlement outcomes.
- Do NOT speculate beyond the facts or contradict the memo's deterministic sections. When a value is zero or absent because the underlying condition does not apply, say the condition does not apply — do NOT invent a market or physical explanation. Specifically: if sole_lot_on_block is true, adjacent_block_unused_far_sqft is zero because there are no adjacent lots on the tax block; never suggest neighboring parcels are built out, at capacity, or unavailable.
- You MUST state the selection rule (provided) — explain why this site earned its verdict under that rule, not just the conclusion.
- This is a screening memo, not a feasibility study: no financial modelling, no pro forma, no residual land value, no rents or returns.
- Neutral, decision-support tone. Not investment advice, not a guarantee.
- No headings, no markdown, no preamble. Output the section body as plain sentences.`;

function factsForModel(f: ScreeningFacts, v: ScreeningVerdict) {
  return {
    verdict: v.decision,
    confidence: v.confidence,
    selection_rule: SELECTION_RULE,
    address: f.addressLabel,
    zoning_district: f.zoningDistrict,
    base_max_floor_area_sqft: f.baseMaxFloorArea,
    affordable_max_floor_area_sqft: f.affMaxFloorArea,
    unused_far_pct: f.unusedFarPct,
    cd_approval_ratio_pct: f.approvalRatio,
    cd_median_timeline_days: f.cdMedianTimelineDays,
    opportunity_zone: f.isOpportunityZone,
    in_special_flood_hazard_area: f.inSFHA,
    open_hpd_violations: f.openViolationsLot,
    on_speculation_watch: f.onSpeculationWatch,
    block_lot_count: f.blockLotCount,
    sole_lot_on_block: f.blockLotCount <= 1,
    same_owner_adjacent_lots: f.sameOwnerLotCount,
    adjacent_block_unused_far_sqft: f.blockUnusedFar, // excludes the subject lot
  };
}

export function deterministicReasoning(f: ScreeningFacts, v: ScreeningVerdict): string[] {
  return [
    `${SELECTION_RULE} On that rule, this site is a ${v.decision} at confidence ${v.confidence}.`,
    `${v.rationale} Development headroom is ${f.unusedFarPct != null ? `${f.unusedFarPct}% unused FAR` : 'unavailable'}, and the community district’s recorded approval rate is ${f.approvalRatio != null ? `${f.approvalRatio}%` : 'unavailable'} with a median filing timeline of ${f.cdMedianTimelineDays != null ? `${f.cdMedianTimelineDays} days` : 'unavailable'}. This is a screening read of public record, not a feasibility study. It carries no financial modelling.`,
  ];
}

// Enforce the spec's 4–6 sentence ceiling on model prose regardless of what the
// model returns, grouped into paragraphs of three for readability.
export function capSentences(paras: string[], max = 6): string[] {
  const joined = paras.join(' ').replace(/\s+/g, ' ').trim();
  const sentences = (joined.match(/[^.!?]+[.!?]+/g) ?? [joined]).map((s) => s.trim()).filter(Boolean).slice(0, max);
  if (sentences.length === 0) return paras;
  const out: string[] = [];
  for (let i = 0; i < sentences.length; i += 3) out.push(sentences.slice(i, i + 3).join(' '));
  return out;
}

export async function generateScreeningReasoning(f: ScreeningFacts, v: ScreeningVerdict): Promise<string[]> {
  const msg = await getAnthropicClient().messages.create({
    model: KOANO_RUNTIME_MODEL,
    max_tokens: 380,
    system: [{ type: 'text', text: SCREENING_REASONING_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: JSON.stringify(factsForModel(f, v), null, 2) }],
  });
  const block = msg.content.find((b) => b.type === 'text');
  const text = block && block.type === 'text' ? block.text.trim() : '';
  if (!text) return deterministicReasoning(f, v);
  return capSentences(text.split(/\n{2,}/).map((p) => p.replace(/\s+/g, ' ').trim()).filter(Boolean));
}

// ---- assembly ---------------------------------------------------------------

// Provenance from the blocks the memo actually asserts from. Demographics is a
// best-effort proof point: if it is not live, it is dropped (not asserted), so
// one soft source cannot drag an otherwise all-live memo to representative. A
// CORE block that ever falls back IS kept and badged honestly.
function usedAppendix(data: DocumentData, demoLive: boolean): ProvenanceAppendix {
  const blocks: Partial<Record<BlockKey, SiteDetailBlock<unknown>>> = {};
  for (const key of Object.keys(data.blocks) as BlockKey[]) {
    if (key === 'demographics' && !demoLive) continue; // dropped, with a visible proof-point note
    const blk = data.blocks[key];
    if (blk) blocks[key] = blk;
  }
  const overall: Provenance = weakestProvenance(
    Object.values(blocks).filter((b): b is NonNullable<typeof b> => !!b),
  );
  return buildProvenanceAppendix({ ...data, blocks, overall_provenance: overall });
}

// The DD register is a fixed pre-acquisition checklist — independent of the
// site's facts (it states what KOANO verified vs what needs a vendor).
function ddRegisterSection(): RenderSection {
  const rows: string[][] = [
    ['Zoning verification', 'Verified: NYC MapPLUTO (26v1, City of Yes)'],
    ['Permit research', 'Verified: DOB permits + Job Application Filings'],
    ['Flood zone evaluation', 'Verified: FEMA NFHL'],
    ['Violations', 'Verified: HPD / ECB / DOB'],
    ['Ownership', 'Verified: HPD registrations (block-level)'],
    ['Title examination', 'Open: requires a title company; liens/encumbrances are not in public record here'],
    ['Boundary & land survey', 'Open: requires a licensed surveyor; PLUTO lot area is not survey-grade'],
    ['Environmental assessment', 'Open: requires a Phase I/II; contamination history not screened'],
    ['Utility access review', 'Open: requires utility confirmation of capacity/hookups'],
    ['Easement analysis', 'Open: requires counsel; recorded easements affect the buildable area'],
  ];
  return {
    heading: 'Due Diligence Gap Register',
    keepTogether: true, // never split the register mid-table across a page break
    table: { columns: ['Item', 'Status'], rows },
    paragraphs: ['This register states what KOANO verified from public record and what remains open. It is not a complete due-diligence report.'],
  };
}

export function buildScreeningModel(args: {
  data: DocumentData;
  facts: ScreeningFacts;
  verdict: ScreeningVerdict;
  letterhead: Letterhead;
  reasoning: string[];
  generatedAt: string;
}): RenderModel {
  const { data, facts: f, verdict: v, letterhead, reasoning, generatedAt } = args;
  const sections: RenderSection[] = [];

  // 1. Verdict headline (pyramid — the conclusion first).
  sections.push({ verdict: { decision: v.decision, tone: v.tone, confidence: v.confidence, rationale: v.rationale } });

  // 2. Site identity band.
  sections.push({
    heading: 'Site Identity',
    band: {
      items: [
        { label: 'Address', value: f.addressLabel },
        { label: 'BBL', value: f.bbl ?? '—' },
        { label: 'Borough', value: f.borough ?? '—' },
        { label: 'Lot area', value: `${fmtInt(f.lotAreaSqft)} sq ft` },
        { label: 'Zoning', value: f.zoningDistrict ?? '—' },
        { label: 'Opportunity Zone', value: f.isOpportunityZone ? 'Yes' : 'No' },
      ],
    },
  });

  // 3. As-of-right envelope — the base-vs-affordable FAR contrast as a HEADLINE.
  const delta = f.baseMaxFloorArea != null && f.affMaxFloorArea != null ? f.affMaxFloorArea - f.baseMaxFloorArea : null;
  sections.push({
    heading: 'As-of-Right Envelope',
    highlight: {
      figures: [
        {
          label: 'Base as-of-right max floor area',
          value: `${fmtInt(f.baseMaxFloorArea)} sq ft`,
          sub: `residential FAR ${fmtFar(f.baseResidFar)}`,
        },
        {
          label: 'City of Yes affordable-housing max',
          value: `${fmtInt(f.affMaxFloorArea)} sq ft`,
          sub: delta != null ? `FAR ${fmtFar(f.affResidFar)}  ·  +${fmtInt(delta)} sq ft with affordability` : `FAR ${fmtFar(f.affResidFar)}`,
          emphasis: true,
        },
      ],
    },
    table: {
      columns: ['Envelope', 'Value'],
      rows: [
        ['Zoning district', f.zoningDistrict ?? '—'],
        ['Commercial / community-facility FAR', `${fmtFar(f.commFar)} / ${fmtFar(f.facilFar)}`],
        ['Existing building area', `${fmtInt(f.buildingAreaSqft)} sq ft (built FAR ${fmtFar(f.builtFar)})`],
        [
          'Unused development rights (base)',
          f.unusedDevRights === 0 && (f.buildingAreaSqft ?? 0) > 0
            ? 'Built out at base FAR (affordable-housing rights may remain, see above)'
            : `${fmtInt(f.unusedDevRights)} sq ft`,
        ],
        ['Year built / building class', `${f.yearBuilt ?? '—'} / ${f.buildingClass ?? '—'}`],
      ],
    },
    paragraphs: [
      'Envelope covers FAR and floor area only, under current PLUTO (26v1, City of Yes-updated). It is not height- or parking-complete, and excludes special-district modifications and discretionary actions.',
    ],
  });

  // 4. Entitlement risk read.
  sections.push({
    heading: 'Entitlement Risk Read',
    table: {
      columns: ['Community district track record', 'Value'],
      rows: [
        ['CD approval ratio', f.approvalRatio != null ? `${f.approvalRatio}%` : '—'],
        ['Disapproved filings', fmtInt(f.cdDisapproved)],
        ['Withdrawn / suspended', `${fmtInt(f.cdWithdrawn)} / ${fmtInt(f.cdSuspended)}`],
        ['Median filing timeline', f.cdMedianTimelineDays != null ? `${fmtInt(f.cdMedianTimelineDays)} days` : '—'],
        ['Filings on this lot', fmtInt(f.subjectFilingCount)],
      ],
      caption: 'DOB Job Application Filings (legacy BIS) for the subject community district: a disposition track record, not a prediction.',
    },
  });

  // 5. Assemblage & air rights (block-level rule). Block-level unused FAR always
  // leads; same-owner adjacency earns space ONLY when it fires (it is rare, and
  // dead "0" rows waste the 2-page ceiling).
  // "Other block lots" is explicit: block_unused_far EXCLUDES the subject lot
  // (the subject's own unused rights are the envelope, above), so a single-lot
  // block correctly reads 0 — no adjacent lots to assemble from.
  const hasSameOwner = f.sameOwnerLotCount > 0;
  const soleLot = f.blockLotCount <= 1;
  const asmRows: string[][] = [
    ['Registered owner', f.ownerName ?? '—'],
    ['Lots on the tax block', fmtInt(f.blockLotCount)],
    ['Other lots on block', fmtInt(Math.max(0, f.blockLotCount - 1))],
    ['Unused rights on OTHER block lots', `${fmtInt(f.blockUnusedFar)} sq ft`],
  ];
  if (hasSameOwner) {
    asmRows.push([
      'Same-owner lots on block',
      `${fmtInt(f.sameOwnerLotCount)}${f.sameOwnerBbls.length ? ` (${f.sameOwnerBbls.slice(0, 4).join(', ')})` : ''}`,
    ]);
    asmRows.push(['Same-owner unused rights', `${fmtInt(f.sameOwnerUnusedFar)} sq ft`]);
  }
  sections.push({
    heading: 'Assemblage & Air Rights',
    table: { columns: ['Block-level (excludes the subject lot)', 'Value'], rows: asmRows },
    paragraphs: [
      soleLot
        ? 'The subject is the only lot on its tax block, so there are no adjacent block lots to assemble; its own unused rights are in the envelope above.'
        : hasSameOwner
          ? 'A single entity already controls adjacent block lots, a potential assemblage opportunity.'
          : `Adjacent block lots hold ${fmtInt(f.blockUnusedFar)} sq ft of unused development rights (separate from the subject's own).`,
      f.assemblageBlockNote,
    ],
  });

  // 6. Due diligence gap register (never trimmed).
  sections.push(ddRegisterSection());

  // 7. Proof points (best-effort ACS is dropped visibly when not live).
  const proof: string[][] = [];
  proof.push(['Permit activity (24mo)', f.permits24mo != null ? `${fmtInt(f.permits24mo)} permits in catchment` : '—']);
  proof.push([
    'Recorded sales',
    f.compsMedianPsf != null ? `${fmtMoney(f.compsMedianPsf)}/sq ft median · ${f.compsPriceTrend ?? 'n/a'} (${fmtInt(f.compsSalesCount)} sales)` : '—',
  ]);
  proof.push(['FHFA price index', f.hpiYoy != null ? `${f.hpiYoy > 0 ? '+' : ''}${f.hpiYoy}% yoy · ${f.hpiRegion ?? ''}` : '—']);
  proof.push(['FEMA flood', f.floodZone ? `Zone ${f.floodZone}${f.inSFHA ? ' · in SFHA' : ' · outside SFHA'}` : '—']);
  if (f.demoLive) {
    proof.push(['ACS demographics', `median HH income ${fmtMoney(f.demoIncome)} · pop ${fmtInt(f.demoPopulation)} (${f.demoVintage ?? ''})`]);
  }
  const proofShown = proof.slice(0, MAX_PROOF_POINTS);
  const proofSection: RenderSection = {
    heading: 'Proof Points',
    table: { columns: ['Signal', 'Reading'], rows: proofShown },
  };
  if (!f.demoLive) proofSection.trimNote = 'Showing 4 of 5 proof points; ACS demographic direction was unavailable this run.';
  sections.push(proofSection);

  // 8. Risk & mitigant. Only REAL risks make a table; when none fire, say so in
  // a line of prose rather than rendering a one-row table with a non-risk.
  const risks: string[][] = [];
  if (f.openViolationsLot > 0) risks.push([`${fmtInt(f.openViolationsLot)} open HPD violations on the lot`, 'Price the cure; confirm no vacate orders before closing.']);
  if (f.portfolioBuildingCount > 1) risks.push([`Owner holds ${fmtInt(f.portfolioBuildingCount)} buildings (concentration)`, 'Ownership concentration can signal portfolio-level distress or leverage.']);
  if (f.onSpeculationWatch) risks.push(['On the NYC Speculation Watch List', 'Rapid-flip pattern; scrutinize prior sale and financing.']);
  if (f.inSFHA) risks.push([`Flood zone ${f.floodZone ?? ''} (in SFHA)`, 'Flood insurance + resilient design required; affects cost and financing.']);
  if (risks.length === 0) {
    sections.push({
      heading: 'Risk & Mitigant',
      paragraphs: ['No disqualifying public-record flags were found on the lot. Open due-diligence items still apply.'],
    });
  } else {
    const risksShown = risks.slice(0, MAX_RISK_ROWS);
    const riskSection: RenderSection = {
      heading: 'Risk & Mitigant',
      table: { columns: ['Risk', 'Mitigant / note'], rows: risksShown },
    };
    if (risks.length > MAX_RISK_ROWS) {
      riskSection.trimNote = `Showing ${risksShown.length} of ${risks.length} risk factors; the full set is in the dashboard.`;
    }
    sections.push(riskSection);
  }

  // 9. Reasoning (the single model call, or the deterministic template).
  sections.push({ heading: 'Reasoning', paragraphs: reasoning });

  return {
    docTitle: 'Development Site Screening Memo',
    subtitle: f.addressLabel,
    letterhead,
    sections,
    appendix: usedAppendix(data, f.demoLive),
    generatedAt,
    compact: true, // dense 2-page memo
  };
}
