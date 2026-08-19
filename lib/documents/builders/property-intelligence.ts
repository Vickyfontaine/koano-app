// KOANO document engine — Property Intelligence Report (Community).
// The BRIEFING document: the one a user sends to someone who does not know the
// property at all — a partner, a lender, a family member, an advisor. Its job
// is breadth and orientation, not depth in one domain. It answers, in one pass,
// "what is this property, what is it worth, where is the neighborhood heading,
// and what should I watch?" — and then does REAL SYNTHESIS in the Neighborhood
// Trajectory narrative rather than stacking another table on the pile.
//
// This is deliberately NOT a superset of the other Community documents:
//   - The Violation & Ownership Record lists every violation with its ID; this
//     report shows only summary counts as one signal among many.
//   - The Permit History Report lists every permit; this shows activity level.
//   - The Tax Appeal packet argues an assessment; this doesn't argue anything.
// Its distinct value is the synthesized forward read for an outsider, drawing
// value, price trend, permits, demographics, and risk into a single picture.
//
// All-live for NYC (demographics via ACS is best-effort: if it is not live this
// run, it is dropped from the trajectory and the provenance appendix rather than
// dragging the whole document to representative — the report stays honest).
// Exactly one model call (the trajectory), prompt-cached.

import type {
  ZoningInfo,
  MlsCompsSummary,
  PermitsSummary,
  BuildingViolationsSummary,
  LandlordPortfolioSummary,
  FloodInfo,
  OpportunityZoneInfo,
  AcsDemographics,
  HpiTrend,
} from '../../providers/types';
import type { SiteDetailBlock, BlockKey } from '../../providers/blocks';
import type { Provenance } from '../../providers/types';
import type { DocumentData, Letterhead } from '../types';
import type { RenderModel, RenderSection } from '../render/model';
import { buildProvenanceAppendix, type ProvenanceAppendix } from '../disclaimer';
import { getAnthropicClient, KOANO_RUNTIME_MODEL } from '../../agents/shared';

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
function isLive(b: SiteDetailBlock<unknown> | undefined): boolean {
  return b?.provenance === 'live' && b?.data != null;
}

export interface PropertyIntelligenceFacts {
  addressLabel: string;
  bbl: string | null;
  borough: string | null;
  // Identity
  buildingClass: string | null;
  yearBuilt: number | null;
  residentialUnits: number | null;
  zoningDistrict: string | null;
  buildingAreaSqft: number | null;
  // Value
  indicativeValue: number | null;
  medianPsf: number | null;
  salesCount: number;
  priceTrend: 'rising' | 'falling' | 'flat' | null;
  compsScopeNote: string | null;
  // Trajectory signals
  hpiRegion: string | null;
  hpiYoY: number | null;
  hpi5yr: number | null;
  neighborhoodPermits24mo: number | null;
  newBuilding24mo: number | null;
  isOpportunityZone: boolean | null;
  // Demographics (best-effort — may be null/dropped)
  demoLive: boolean;
  medianIncome: number | null;
  medianRent: number | null;
  medianHomeValue: number | null;
  population: number | null;
  demoVintage: string | null;
  // Record / watch-items
  hpdOpen: number | null;
  ecbActive: number | null;
  dobActive: number | null;
  hpdRegistered: boolean;
  registeredOwner: string | null;
  floodZone: string | null;
  inSFHA: boolean | null;
}

export function extractPropertyIntelligenceFacts(
  data: DocumentData,
): { ok: true; facts: PropertyIntelligenceFacts } | { ok: false; error: string } {
  const zoning = data.blocks.zoning?.data as ZoningInfo | null | undefined;
  if (!zoning) return { ok: false, error: 'Zoning/PLUTO data unavailable for this address.' };

  const comps = data.blocks.mls_comps?.data as MlsCompsSummary | null | undefined;
  const permits = data.blocks.permits?.data as PermitsSummary | null | undefined;
  const viol = data.blocks.building_violations?.data as BuildingViolationsSummary | null | undefined;
  const port = data.blocks.landlord_portfolio?.data as LandlordPortfolioSummary | null | undefined;
  const flood = data.blocks.flood?.data as FloodInfo | null | undefined;
  const oz = data.blocks.opportunity_zone?.data as OpportunityZoneInfo | null | undefined;
  const hpi = data.blocks.hpi?.data as HpiTrend | null | undefined;

  const demoLive = isLive(data.blocks.demographics);
  const demo = demoLive ? (data.blocks.demographics?.data as AcsDemographics) : null;

  const area = zoning.building_area_sqft;
  const indicativeValue =
    comps && comps.sales_count > 0 && area && area > 0 ? comps.median_price_per_sqft * area : null;

  return {
    ok: true,
    facts: {
      addressLabel: data.resolved_address.normalized || data.resolved_address.input,
      bbl: data.resolved_address.bbl,
      borough: data.resolved_address.borough,
      buildingClass: zoning.building_class,
      yearBuilt: zoning.year_built,
      residentialUnits: zoning.residential_units,
      zoningDistrict: zoning.zoning_district,
      buildingAreaSqft: area,
      indicativeValue,
      medianPsf: comps && comps.sales_count > 0 ? comps.median_price_per_sqft : null,
      salesCount: comps?.sales_count ?? 0,
      priceTrend: comps && comps.sales_count > 0 ? comps.price_trend : null,
      compsScopeNote: comps?.scope_note ?? null,
      hpiRegion: hpi?.region ?? null,
      hpiYoY: hpi?.yoy_change_pct ?? null,
      hpi5yr: hpi?.five_yr_change_pct ?? null,
      neighborhoodPermits24mo: permits?.total_permits_24mo ?? null,
      newBuilding24mo: permits?.new_building_permits ?? null,
      isOpportunityZone: oz?.is_opportunity_zone ?? null,
      demoLive,
      medianIncome: demo?.median_household_income ?? null,
      medianRent: demo?.median_gross_rent ?? null,
      medianHomeValue: demo?.median_home_value ?? null,
      population: demo?.population ?? null,
      demoVintage: demo?.vintage ?? null,
      hpdOpen: viol?.hpd.open ?? null,
      ecbActive: viol?.ecb.active ?? null,
      dobActive: viol?.dob_complaints.active ?? null,
      hpdRegistered: viol?.hpd_registered ?? false,
      registeredOwner: port?.registered_owner ?? null,
      floodZone: flood?.flood_zone ?? null,
      inSFHA: flood?.in_special_flood_hazard_area ?? null,
    },
  };
}

// Provenance appendix that DROPS non-live demographics (the one best-effort
// block) so a transient ACS miss doesn't drag the whole briefing to
// representative. The drop is already surfaced visibly in the context section's
// trimNote, so nothing is hidden. Every other block is all-live NYC data.
export function propertyIntelligenceAppendix(data: DocumentData, demoLive: boolean): ProvenanceAppendix {
  const blocks: Partial<Record<BlockKey, SiteDetailBlock<unknown>>> = {};
  for (const key of Object.keys(data.blocks) as BlockKey[]) {
    if (key === 'demographics' && !demoLive) continue;
    const blk = data.blocks[key];
    if (blk) blocks[key] = blk;
  }
  const overall: Provenance = Object.values(blocks).some((b) => b && b.provenance === 'representative')
    ? 'representative'
    : 'live';
  return buildProvenanceAppendix({ ...data, blocks, overall_provenance: overall });
}

// Compact fact payload for the trajectory model call.
function factsForModel(f: PropertyIntelligenceFacts) {
  return {
    subject_address: f.addressLabel,
    borough: f.borough,
    building: { class: f.buildingClass, year_built: f.yearBuilt, residential_units: f.residentialUnits, zoning: f.zoningDistrict },
    indicative_value_usd: f.indicativeValue,
    median_recorded_sale_psf: f.medianPsf,
    recorded_sales_count: f.salesCount,
    local_price_trend: f.priceTrend,
    house_price_index: f.hpiRegion ? { region: f.hpiRegion, yoy_pct: f.hpiYoY, five_yr_pct: f.hpi5yr } : null,
    neighborhood_permits_24mo: f.neighborhoodPermits24mo,
    new_building_permits_24mo: f.newBuilding24mo,
    opportunity_zone: f.isOpportunityZone,
    demographics: f.demoLive
      ? { median_household_income: f.medianIncome, median_gross_rent: f.medianRent, median_home_value: f.medianHomeValue, population: f.population, vintage: f.demoVintage }
      : 'unavailable this run',
    open_violations: { hpd_open: f.hpdOpen, ecb_active: f.ecbActive, dob_active: f.dobActive, hpd_registered: f.hpdRegistered },
    flood_zone: f.floodZone,
    in_special_flood_hazard_area: f.inSFHA,
  };
}

export const TRAJECTORY_SYSTEM_PROMPT = `You are KOANO's neighborhood analyst. Write the "Neighborhood Trajectory" section of a Property Intelligence Report — a briefing the reader will forward to someone who has NEVER seen this property (a partner, a lender, a family member).

Your job is SYNTHESIS, not restatement. Do not list the figures back; the report already has tables for that. Instead, connect them into a single forward-looking read: is this neighborhood strengthening, softening, or steady, and what does that mean for this specific property? Weave value, the price trend, the House Price Index, permit/development activity, demographics, and any risk (violations, flood) into ONE coherent picture a newcomer can act on.

Rules:
- Use ONLY the provided figures. Never invent comps, forecasts, percentages, or facts not given.
- Where demographics are "unavailable this run," simply do not reference them — do not apologize or flag it.
- If signals conflict (e.g. rising prices but open violations, or heavy permits but flood exposure), SAY SO plainly — an honest tension is more useful than a smooth story.
- 150-220 words. Plain, professional, neutral. This is decision-support, not a sales pitch and not a guarantee.
- No headings, no markdown, no preamble. Output the section body as plain paragraphs only.`;

// Deterministic synthesis (verdict/reuse path — 0 model tokens). Still real
// synthesis: it draws the signals into a connected read, not a table dump.
export function deterministicTrajectory(f: PropertyIntelligenceFacts): string[] {
  const paras: string[] = [];

  const valueBits: string[] = [];
  if (f.indicativeValue != null) {
    valueBits.push(
      `Recorded comparable sales place an indicative value near ${fmtMoney(f.indicativeValue)} (${fmtMoney(f.medianPsf)}/sq ft across ${fmtInt(f.salesCount)} sales)`,
    );
  }
  if (f.priceTrend) valueBits.push(`local recorded-sale prices are ${f.priceTrend}`);
  if (f.hpiYoY != null) valueBits.push(`the ${f.hpiRegion ?? 'regional'} House Price Index is ${fmtPct(f.hpiYoY)} year over year`);
  paras.push(
    (valueBits.length ? valueBits.join('; ') + '. ' : '') +
      'Together these frame where the property sits in the current market rather than at any single point in time.',
  );

  const momentumBits: string[] = [];
  if (f.neighborhoodPermits24mo != null) {
    momentumBits.push(
      `The surrounding area recorded ${fmtInt(f.neighborhoodPermits24mo)} permits over the last 24 months${f.newBuilding24mo ? ` (${fmtInt(f.newBuilding24mo)} new-building)` : ''}, a proxy for how actively the block is being reinvested in`,
    );
  }
  if (f.demoLive && f.medianIncome != null) {
    momentumBits.push(`the surrounding tract reports a median household income of ${fmtMoney(f.medianIncome)}${f.medianRent ? ` and median gross rent of ${fmtMoney(f.medianRent)}` : ''} (${f.demoVintage ?? 'ACS'})`);
  }
  if (f.isOpportunityZone) momentumBits.push('the property sits inside a federal Opportunity Zone, a signal of directed investment incentives');
  if (momentumBits.length) paras.push(momentumBits.join('; ') + '.');

  const watchBits: string[] = [];
  const openViol = (f.hpdOpen ?? 0) + (f.ecbActive ?? 0) + (f.dobActive ?? 0);
  if (openViol > 0) {
    watchBits.push(`there are ${fmtInt(openViol)} open enforcement records across HPD/ECB/DOB that a buyer should reconcile against the price story`);
  } else if (!f.hpdRegistered) {
    watchBits.push('no open violations were found, though the building is outside HPD multiple-dwelling coverage, so that is a coverage fact rather than a clean bill');
  }
  if (f.inSFHA) watchBits.push(`the property is in FEMA flood zone ${f.floodZone ?? ''} (a Special Flood Hazard Area), which carries insurance and resale implications`);
  else if (f.floodZone) watchBits.push(`FEMA maps the property in flood zone ${f.floodZone}, outside the Special Flood Hazard Area`);
  if (watchBits.length) paras.push('Watch-items: ' + watchBits.join('; ') + '.');

  return paras;
}

export async function generateTrajectory(f: PropertyIntelligenceFacts): Promise<string[]> {
  const msg = await getAnthropicClient().messages.create({
    model: KOANO_RUNTIME_MODEL,
    max_tokens: 520,
    system: [{ type: 'text', text: TRAJECTORY_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: JSON.stringify(factsForModel(f), null, 2) }],
  });
  const block = msg.content.find((b) => b.type === 'text');
  const text = block && block.type === 'text' ? block.text.trim() : '';
  if (!text) return deterministicTrajectory(f);
  return text.split(/\n{2,}/).map((p) => p.replace(/\s+/g, ' ').trim()).filter(Boolean);
}

export function buildPropertyIntelligenceModel(args: {
  facts: PropertyIntelligenceFacts;
  letterhead: Letterhead;
  trajectory: string[];
  appendix: RenderModel['appendix'];
  generatedAt: string;
}): RenderModel {
  const { facts: f, letterhead, trajectory, appendix, generatedAt } = args;
  const sections: RenderSection[] = [];

  // 1 — What this property is (orientation for someone who's never seen it).
  sections.push({
    heading: 'What This Property Is',
    band: {
      items: [
        { label: 'Address', value: f.addressLabel },
        { label: 'BBL', value: f.bbl ?? '—' },
        { label: 'Borough', value: f.borough ?? '—' },
        { label: 'Building class', value: f.buildingClass ?? '—' },
        { label: 'Year built', value: f.yearBuilt ? String(f.yearBuilt) : '—' },
        { label: 'Residential units', value: f.residentialUnits != null ? fmtInt(f.residentialUnits) : '—' },
        { label: 'Zoning', value: f.zoningDistrict ?? '—' },
        { label: 'Opportunity Zone', value: f.isOpportunityZone == null ? '—' : f.isOpportunityZone ? 'Yes' : 'No' },
      ],
    },
  });

  // 2 — Indicative value.
  sections.push({
    heading: 'What It Is Worth (Indicative)',
    provenanceNote: {
      provenance: 'live',
      text: 'Indicative value = median recorded $/sq ft (NYC DOF Rolling Sales) × PLUTO building area. Indicative, not an appraisal.',
    },
    table: {
      columns: ['Field', 'Value'],
      rows: [
        ['Indicative market value', fmtMoney(f.indicativeValue)],
        ['Median recorded sale $/sq ft', fmtMoney(f.medianPsf)],
        ['Building area', f.buildingAreaSqft != null ? `${fmtInt(f.buildingAreaSqft)} sq ft` : '—'],
        ['Recorded sales in scope', fmtInt(f.salesCount)],
        ['Local price trend', f.priceTrend ?? '—'],
      ],
      caption: f.compsScopeNote ?? 'Recorded sales; recorded sales have no days-on-market.',
    },
  });

  // 3 — Neighborhood context (the forward indicators).
  const contextRows: string[][] = [
    ['Regional House Price Index (YoY)', f.hpiYoY != null ? `${fmtPct(f.hpiYoY)}${f.hpiRegion ? ` — ${f.hpiRegion}` : ''}` : '—'],
    ['House Price Index (5-year)', fmtPct(f.hpi5yr)],
    ['Area permits (last 24 months)', fmtInt(f.neighborhoodPermits24mo)],
    ['New-building permits (24 months)', fmtInt(f.newBuilding24mo)],
  ];
  if (f.demoLive) {
    contextRows.push(['Median household income (tract)', fmtMoney(f.medianIncome)]);
    contextRows.push(['Median gross rent (tract)', fmtMoney(f.medianRent)]);
    contextRows.push(['Tract population', fmtInt(f.population)]);
  }
  const contextSection: RenderSection = {
    heading: 'Where the Neighborhood Is Heading',
    table: { columns: ['Indicator', 'Reading'], rows: contextRows, caption: f.demoVintage ? `Demographics: ${f.demoVintage}.` : undefined },
  };
  if (!f.demoLive) {
    contextSection.trimNote = 'Census ACS demographics (income, rent, population) were unavailable this run and are omitted rather than shown representative.';
  }
  sections.push(contextSection);

  // 4 — Public record / what to watch.
  const openViol = (f.hpdOpen ?? 0) + (f.ecbActive ?? 0) + (f.dobActive ?? 0);
  sections.push({
    heading: 'Public Record — What to Watch',
    table: {
      columns: ['Field', 'Value'],
      rows: [
        ['Open HPD violations', fmtInt(f.hpdOpen)],
        ['Active ECB violations', fmtInt(f.ecbActive)],
        ['Active DOB complaints', fmtInt(f.dobActive)],
        ['HPD-registered (3+ units)', f.hpdRegistered ? 'Yes' : 'No — HPD zeros are a coverage fact'],
        ['Registered owner', f.registeredOwner ?? '—'],
        ['FEMA flood zone', f.floodZone ? `${f.floodZone}${f.inSFHA ? ' — Special Flood Hazard Area' : ''}` : '—'],
      ],
      caption:
        openViol > 0
          ? 'Open records above should be reconciled against the value story. The full detail is in the Violation & Ownership Record.'
          : 'For the complete, citable violation and ownership detail, see the Violation & Ownership Record.',
    },
  });

  // 5 — Neighborhood Trajectory (the synthesized read — the distinct value).
  sections.push({ heading: 'Neighborhood Trajectory', paragraphs: trajectory });

  return {
    docTitle: 'Property Intelligence Report',
    subtitle: f.addressLabel,
    letterhead,
    sections,
    appendix,
    generatedAt,
  };
}
