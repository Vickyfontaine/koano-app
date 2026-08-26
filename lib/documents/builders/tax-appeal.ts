// KOANO document engine — Property Tax Appeal Evidence Packet (Community).
// The first concrete document type. All-live for NYC: DOF assessed value + PLUTO
// building area (zoning block) and recorded-sale comps (mls_comps block).
//
// HONESTY POSTURE (this is a tax document a homeowner may file):
// - We show the DOF assessed value (live, from PLUTO) and an INDICATIVE market
//   value derived from recorded comparable sales (median $/sqft × building
//   area). We do NOT auto-compute an "over-assessed by X%" claim: PLUTO carries
//   the assessed value, which is a class-dependent FRACTION of the DOF market
//   value — comparing it directly to a market-value estimate would mislead.
//   The packet instead tells the reader exactly which figure on their DOF
//   Notice of Property Value to compare against the indicative value, and the
//   disclaimer footer (structural) reinforces that this is evidence, not advice.

import type { ZoningInfo, MlsCompsSummary } from '../../providers/types';
import type { DocumentData, Letterhead } from '../types';
import type { RenderModel, RenderSection } from '../render/model';
import { getAnthropicClient, KOANO_RUNTIME_MODEL } from '../../agents/shared';

const MAX_COMPS_SHOWN = 10;

function fmtMoney(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—';
  return `$${Math.round(n).toLocaleString('en-US')}`;
}
function fmtInt(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—';
  return Math.round(n).toLocaleString('en-US');
}

export interface TaxAppealFacts {
  addressLabel: string;
  bbl: string | null;
  buildingClass: string | null;
  yearBuilt: number | null;
  buildingAreaSqft: number | null;
  assessedTotal: number | null;
  assessedLand: number | null;
  medianPsf: number;
  salesCount: number;
  priceTrend: 'rising' | 'falling' | 'flat';
  scopeNote: string;
  comps: MlsCompsSummary['comps'];
  indicativeValue: number | null; // median psf × building area (modeled from live inputs)
}

// Pull the tax-appeal facts out of assembled data. Returns an error string if a
// required input is missing (e.g. no building area or no comps for the area).
export function extractTaxAppealFacts(
  data: DocumentData,
): { ok: true; facts: TaxAppealFacts } | { ok: false; error: string } {
  const zoning = data.blocks.zoning?.data as ZoningInfo | null | undefined;
  const comps = data.blocks.mls_comps?.data as MlsCompsSummary | null | undefined;

  if (!zoning) return { ok: false, error: 'Zoning/PLUTO data unavailable for this address.' };
  if (!comps || comps.sales_count <= 0) {
    return { ok: false, error: 'No recorded comparable sales available for this area. Cannot build a comps-based packet.' };
  }
  const buildingAreaSqft = zoning.building_area_sqft;
  const indicativeValue =
    buildingAreaSqft && buildingAreaSqft > 0 ? comps.median_price_per_sqft * buildingAreaSqft : null;

  return {
    ok: true,
    facts: {
      addressLabel: data.resolved_address.normalized || data.resolved_address.input,
      bbl: data.resolved_address.bbl,
      buildingClass: zoning.building_class,
      yearBuilt: zoning.year_built,
      buildingAreaSqft,
      assessedTotal: zoning.assessed_total_usd,
      assessedLand: zoning.assessed_land_usd,
      medianPsf: comps.median_price_per_sqft,
      salesCount: comps.sales_count,
      priceTrend: comps.price_trend,
      scopeNote: comps.scope_note,
      comps: comps.comps,
      indicativeValue,
    },
  };
}

// Deterministic argument prose (build-from-verdict path: 0 model tokens).
export function deterministicArgument(f: TaxAppealFacts): string[] {
  const paras: string[] = [];
  paras.push(
    `The subject property at ${f.addressLabel}${f.bbl ? ` (BBL ${f.bbl})` : ''} carries a current DOF total assessed value of ${fmtMoney(f.assessedTotal)}. ` +
      `Recorded sales of comparable properties indicate a market value of approximately ${fmtMoney(f.indicativeValue)}, based on a median of ${fmtMoney(f.medianPsf)} per square foot across ${fmtInt(f.salesCount)} recorded sales applied to the property's ${fmtInt(f.buildingAreaSqft)} square feet of building area.`,
  );
  paras.push(
    `Local recorded-sale prices are ${f.priceTrend}. To evaluate an appeal, compare the market value shown on your DOF Notice of Property Value against the indicative market value above. A material gap between the two is the basis for a Request for Review or a Tax Commission appeal. The comparable sales supporting this figure are listed above; ${f.scopeNote}`,
  );
  return paras;
}

// Facts payload the model is allowed to write from (fresh path: 1 content gen).
export function factsForModel(f: TaxAppealFacts) {
  return {
    subject_address: f.addressLabel,
    bbl: f.bbl,
    dof_assessed_total_usd: f.assessedTotal,
    building_area_sqft: f.buildingAreaSqft,
    indicative_market_value_usd: f.indicativeValue,
    median_recorded_sale_psf: f.medianPsf,
    recorded_sales_count: f.salesCount,
    local_price_trend: f.priceTrend,
    scope_note: f.scopeNote,
  };
}

export const TAX_APPEAL_ARGUMENT_SYSTEM_PROMPT = `You are KOANO's property tax appeal writer. Write the "Basis for Appeal" section of a homeowner's tax-appeal evidence packet: 120-180 words, plain professional language.

Rules:
- Use ONLY the provided figures. Never invent comps, assessment ratios, deadlines, or legal claims.
- Explain the comparison the homeowner should make: the DOF market value on their Notice of Property Value vs the indicative market value derived from recorded comparable sales. Do NOT claim a specific over-assessment percentage — the provided assessed value is a class-dependent fraction of DOF market value, not the market value itself.
- Neutral, evidence-based tone. This is decision-support, not legal or tax advice, and not a guarantee of any outcome.
- No headings, no markdown, no preamble. Output the section body as plain paragraphs only.`;

// Fresh path: one model call for a tailored "Basis for Appeal". Prompt-cached
// system prompt (only the unique facts are billed per call). Falls back to the
// deterministic argument if the model returns nothing, so a document never
// ships without this section.
export async function generateTaxAppealArgument(f: TaxAppealFacts): Promise<string[]> {
  const msg = await getAnthropicClient().messages.create({
    model: KOANO_RUNTIME_MODEL,
    max_tokens: 500,
    system: [
      {
        type: 'text',
        text: TAX_APPEAL_ARGUMENT_SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{ role: 'user', content: JSON.stringify(factsForModel(f), null, 2) }],
  });
  const textBlock = msg.content.find((b) => b.type === 'text');
  const text = textBlock && textBlock.type === 'text' ? textBlock.text.trim() : '';
  if (!text) return deterministicArgument(f);
  return text
    .split(/\n{2,}/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

// Assemble the RenderModel. `argument` is supplied by the route (deterministic
// or model-generated); the builder itself is pure and model-free so it can be
// unit-tested without any API call.
export function buildTaxAppealModel(args: {
  data: DocumentData;
  facts: TaxAppealFacts;
  letterhead: Letterhead;
  argument: string[];
  appendix: RenderModel['appendix'];
  generatedAt: string;
}): RenderModel {
  const { facts: f, letterhead, argument, appendix, generatedAt } = args;

  const sections: RenderSection[] = [];

  // Assessment summary (all live from PLUTO / DOF roll).
  sections.push({
    heading: 'Assessment Summary',
    table: {
      columns: ['Field', 'Value'],
      rows: [
        ['DOF total assessed value', fmtMoney(f.assessedTotal)],
        ['Assessed land value', fmtMoney(f.assessedLand)],
        ['Building area', `${fmtInt(f.buildingAreaSqft)} sq ft`],
        ['Building class', f.buildingClass ?? '—'],
        ['Year built', f.yearBuilt ? String(f.yearBuilt) : '—'],
        ['BBL', f.bbl ?? '—'],
      ],
      caption: 'Source: NYC DOF assessment roll via MapPLUTO (live).',
    },
  });

  // Comparable recorded sales.
  const shown = f.comps.slice(0, MAX_COMPS_SHOWN);
  sections.push({
    heading: 'Comparable Recorded Sales',
    provenanceNote: {
      provenance: 'live',
      text: 'Recorded sales pulled live from NYC DOF Rolling Sales. Recorded sales have no days-on-market.',
    },
    table: {
      columns: ['Address', 'Sale date', 'Sale price', '$/sq ft', 'Sq ft'],
      rows: shown.map((c) => [
        c.address,
        (c.sale_date || '').slice(0, 10),
        fmtMoney(c.sale_price),
        fmtMoney(c.price_per_sqft),
        fmtInt(c.gross_square_feet),
      ]),
      caption: `${fmtInt(f.salesCount)} qualifying recorded sales in scope (showing ${shown.length}). ${f.scopeNote}`,
    },
  });

  // Indicative value vs assessment.
  sections.push({
    heading: 'Indicative Value vs. Assessment',
    paragraphs: [
      `Indicative market value from recorded comparable sales: ${fmtMoney(f.indicativeValue)} ` +
        `(${fmtMoney(f.medianPsf)}/sq ft median × ${fmtInt(f.buildingAreaSqft)} sq ft building area).`,
      `DOF total assessed value: ${fmtMoney(f.assessedTotal)}. Note: the assessed value is a class-dependent fraction of the DOF market value, so it is not directly comparable to the indicative market value above. Compare the indicative value to the MARKET VALUE printed on your DOF Notice of Property Value.`,
    ],
  });

  // Basis for appeal (narrative — supplied by route).
  sections.push({ heading: 'Basis for Appeal', paragraphs: argument });

  return {
    docTitle: 'Property Tax Appeal Evidence Packet',
    subtitle: f.addressLabel,
    letterhead,
    sections,
    appendix,
    generatedAt,
  };
}
