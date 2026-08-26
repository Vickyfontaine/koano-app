// KOANO document engine — Client Neighborhood Report (Transaction).
// What a buyer or seller wants to know about an area, in plain language, on the
// agent's white-label letterhead: recorded sales trend + $/sqft, price-index
// movement, permit activity, demographic direction (where live), flood exposure.
// One grounded narrative call (may reference only the rendered figures);
// everything else deterministic. Demographics are best-effort (dropped + noted
// if not live) so the report stays honestly labeled.

import type {
  ZoningInfo,
  MlsCompsSummary,
  HpiTrend,
  PermitsSummary,
  AcsDemographics,
  FloodInfo,
  DataPoint,
} from '../../providers/types';
import type { SiteDetailBlock } from '../../providers/blocks';
import type { DocumentData, Letterhead } from '../types';
import type { RenderModel, RenderSection } from '../render/model';

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

export interface NeighborhoodFacts {
  addressLabel: string;
  borough: string | null;
  medianPsf: number | null;
  salesCount: number;
  priceTrend: 'rising' | 'falling' | 'flat' | null;
  compsScopeNote: string | null;
  hpiRegion: string | null;
  hpiYoY: number | null;
  hpi5yr: number | null;
  permits24mo: number | null;
  newBuilding24mo: number | null;
  demoLive: boolean;
  medianIncome: number | null;
  medianRent: number | null;
  medianHomeValue: number | null;
  population: number | null;
  demoVintage: string | null;
  floodZone: string | null;
  inSFHA: boolean | null;
}

export function extractNeighborhoodFacts(
  data: DocumentData,
): { ok: true; facts: NeighborhoodFacts } | { ok: false; error: string } {
  const zoning = data.blocks.zoning?.data as ZoningInfo | null | undefined; // not required, only for context
  void zoning;
  const comps = data.blocks.mls_comps?.data as MlsCompsSummary | null | undefined;
  const hpi = data.blocks.hpi?.data as HpiTrend | null | undefined;
  const permits = data.blocks.permits?.data as PermitsSummary | null | undefined;
  const flood = data.blocks.flood?.data as FloodInfo | null | undefined;
  const demoLive = isLive(data.blocks.demographics);
  const demo = demoLive ? (data.blocks.demographics?.data as AcsDemographics) : null;

  if (!comps && !hpi && !permits) {
    return { ok: false, error: 'No neighborhood market data available for this address.' };
  }
  return {
    ok: true,
    facts: {
      addressLabel: data.resolved_address.normalized || data.resolved_address.input,
      borough: data.resolved_address.borough,
      medianPsf: comps && comps.sales_count > 0 ? comps.median_price_per_sqft : null,
      salesCount: comps?.sales_count ?? 0,
      priceTrend: comps && comps.sales_count > 0 ? comps.price_trend : null,
      compsScopeNote: comps?.scope_note ?? null,
      hpiRegion: hpi?.region ?? null,
      hpiYoY: hpi?.yoy_change_pct ?? null,
      hpi5yr: hpi?.five_yr_change_pct ?? null,
      permits24mo: permits?.total_permits_24mo ?? null,
      newBuilding24mo: permits?.new_building_permits ?? null,
      demoLive,
      medianIncome: demo?.median_household_income ?? null,
      medianRent: demo?.median_gross_rent ?? null,
      medianHomeValue: demo?.median_home_value ?? null,
      population: demo?.population ?? null,
      demoVintage: demo?.vintage ?? null,
      floodZone: flood?.flood_zone ?? null,
      inSFHA: flood?.in_special_flood_hazard_area ?? null,
    },
  };
}

// Data points the narrative is allowed to reference (exactly the rendered
// figures), for the grounding gate.
export function neighborhoodDataPoints(f: NeighborhoodFacts): DataPoint[] {
  const dp = (label: string, value: string | number | null): DataPoint => ({
    label,
    value: value ?? '',
    provenance: 'live',
    source: 'neighborhood report figures',
  });
  const out: DataPoint[] = [
    dp('median recorded sale per square foot', f.medianPsf),
    dp('recorded sales in scope', f.salesCount),
    dp('recorded price trend', f.priceTrend),
    dp('house price index region', f.hpiRegion),
    dp('house price index year over year percent', f.hpiYoY),
    dp('house price index five year percent', f.hpi5yr),
    dp('area permits last 24 months', f.permits24mo),
    dp('new building permits 24 months', f.newBuilding24mo),
    dp('flood zone', f.floodZone),
    dp('in special flood hazard area', String(f.inSFHA)),
  ];
  if (f.demoLive) {
    out.push(dp('median household income', f.medianIncome));
    out.push(dp('median gross rent', f.medianRent));
    out.push(dp('median home value', f.medianHomeValue));
    out.push(dp('population', f.population));
  }
  return out;
}

export function neighborhoodFactsForModel(f: NeighborhoodFacts) {
  return {
    subject_area: f.addressLabel,
    recorded_median_psf: f.medianPsf,
    recorded_sales_in_scope: f.salesCount,
    recorded_price_trend: f.priceTrend,
    house_price_index: f.hpiRegion ? { region: f.hpiRegion, yoy_pct: f.hpiYoY, five_yr_pct: f.hpi5yr } : null,
    area_permits_24mo: f.permits24mo,
    new_building_permits_24mo: f.newBuilding24mo,
    demographics: f.demoLive
      ? { median_household_income: f.medianIncome, median_gross_rent: f.medianRent, median_home_value: f.medianHomeValue, population: f.population }
      : 'unavailable this run',
    flood_zone: f.floodZone,
    in_special_flood_hazard_area: f.inSFHA,
  };
}

export const NEIGHBORHOOD_SYSTEM_PROMPT = `You are KOANO's neighborhood writer, preparing a client-facing report a real estate agent will send to a buyer or seller. Write the "Neighborhood Narrative" — 130-190 words, plain language a non-expert understands, no jargon.

Rules:
- Use ONLY the figures in the JSON provided. They are exactly what the report's tables show. Do NOT name a neighborhood, program, statute, year, or designation that is not in the figures.
- Where demographics are "unavailable this run," simply do not mention them.
- Explain what the numbers mean for someone buying or selling here, honestly — do not oversell. This is information, not a sales pitch.
- No headings, no markdown, no preamble. Output the narrative paragraphs only.`;

export function deterministicNeighborhoodNarrative(f: NeighborhoodFacts): string[] {
  const paras: string[] = [];
  const bits: string[] = [];
  if (f.medianPsf != null) bits.push(`recorded homes here have sold at a median of ${fmtMoney(f.medianPsf)} per square foot across ${fmtInt(f.salesCount)} recent sales`);
  if (f.priceTrend) bits.push(`recent prices are ${f.priceTrend}`);
  if (f.hpiYoY != null) bits.push(`the broader ${f.hpiRegion ?? 'regional'} market is ${fmtPct(f.hpiYoY)} over the past year`);
  if (bits.length) paras.push(`On price: ${bits.join('; ')}.`);
  const bits2: string[] = [];
  if (f.permits24mo != null) bits2.push(`${fmtInt(f.permits24mo)} building permits were filed nearby in the last two years${f.newBuilding24mo ? ` (${fmtInt(f.newBuilding24mo)} for new buildings)` : ''}, a sign of how much construction activity is around`);
  if (f.demoLive && f.medianIncome != null) bits2.push(`the surrounding area reports a median household income of ${fmtMoney(f.medianIncome)}`);
  if (bits2.length) paras.push(`On the area: ${bits2.join('; ')}.`);
  if (f.floodZone) paras.push(`On flood risk: the property is in FEMA flood zone ${f.floodZone}${f.inSFHA ? ', a Special Flood Hazard Area, which affects insurance and resale' : ', outside the higher-risk Special Flood Hazard Area'}.`);
  return paras;
}

export function buildNeighborhoodModel(args: {
  facts: NeighborhoodFacts;
  letterhead: Letterhead;
  narrative: string[];
  appendix: RenderModel['appendix'];
  generatedAt: string;
}): RenderModel {
  const { facts: f, letterhead, narrative, appendix, generatedAt } = args;
  const sections: RenderSection[] = [];

  const snapshotRows: string[][] = [
    ['Recorded home sales: median $/sq ft', fmtMoney(f.medianPsf)],
    ['Recorded sales in scope / recent trend', f.priceTrend ? `${fmtInt(f.salesCount)} / ${f.priceTrend}` : '—'],
    ['Price index: past year / 5 years', `${fmtPct(f.hpiYoY)} / ${fmtPct(f.hpi5yr)}${f.hpiRegion ? ` — ${f.hpiRegion}` : ''}`],
    ['Building permits nearby (last 24 months)', fmtInt(f.permits24mo)],
    ['FEMA flood zone', f.floodZone ? `${f.floodZone}${f.inSFHA ? ' — Special Flood Hazard Area' : ''}` : '—'],
  ];
  if (f.demoLive) {
    snapshotRows.push(['Median household income (area)', fmtMoney(f.medianIncome)]);
    snapshotRows.push(['Median gross rent / home value (area)', `${fmtMoney(f.medianRent)} / ${fmtMoney(f.medianHomeValue)}`]);
  }
  const snapshot: RenderSection = {
    heading: 'Neighborhood Snapshot',
    provenanceNote: { provenance: 'live', text: 'Recorded residential sales (NYC DOF), FHFA price index, NYC DOB permits, FEMA flood. All live. Not an appraisal.' },
    table: { columns: ['Indicator', 'Reading'], rows: snapshotRows, caption: f.demoVintage ? `Demographics: ${f.demoVintage}.` : undefined },
  };
  if (!f.demoLive) {
    snapshot.trimNote = 'Census ACS demographics (income, rent, home value) were unavailable this run and are omitted rather than shown as approximate.';
  }
  sections.push(snapshot);

  sections.push({ heading: 'Neighborhood Narrative', paragraphs: narrative });

  return {
    docTitle: 'Client Neighborhood Report',
    subtitle: f.addressLabel,
    letterhead,
    sections,
    appendix,
    generatedAt,
  };
}
