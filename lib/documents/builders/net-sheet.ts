// KOANO document engine — Buyer / Seller Net Sheet (Transaction).
// Estimated proceeds (seller) or cash-to-close (buyer) at an assumed price.
// KOANO is explicit about what it CANNOT source: exact transfer taxes, title
// fees, commissions, and mortgage payoff are USER-SUPPLIED inputs, not figures
// KOANO knows — structured as fill-ins (like the IC memo's analyst placeholders).
// The one KOANO-derived figure — the assumed sale price — is labeled
// unmistakably as an indicative value from recorded sales, NOT an appraisal,
// listing, or offer price (it is the top line and the most likely to be misread
// as authoritative). Deterministic (zero narrative calls).

import type { ZoningInfo, MlsCompsSummary } from '../../providers/types';
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

export interface NetSheetFacts {
  addressLabel: string;
  bbl: string | null;
  buildingAreaSqft: number | null;
  medianPsf: number;
  salesCount: number;
  scopeNote: string;
  indicativeValue: number | null;
}

export function extractNetSheetFacts(
  data: DocumentData,
): { ok: true; facts: NetSheetFacts } | { ok: false; error: string } {
  const zoning = data.blocks.zoning?.data as ZoningInfo | null | undefined;
  const comps = data.blocks.mls_comps?.data as MlsCompsSummary | null | undefined;
  if (!zoning) return { ok: false, error: 'Zoning/PLUTO data unavailable for this address.' };
  if (!comps || comps.sales_count <= 0) {
    return { ok: false, error: 'No recorded comparable sales available for this area. Cannot derive an indicative price.' };
  }
  const area = zoning.building_area_sqft;
  return {
    ok: true,
    facts: {
      addressLabel: data.resolved_address.normalized || data.resolved_address.input,
      bbl: data.resolved_address.bbl,
      buildingAreaSqft: area,
      medianPsf: comps.median_price_per_sqft,
      salesCount: comps.sales_count,
      scopeNote: comps.scope_note,
      indicativeValue: area && area > 0 ? comps.median_price_per_sqft * area : null,
    },
  };
}

export function buildNetSheetModel(args: {
  facts: NetSheetFacts;
  letterhead: Letterhead;
  appendix: RenderModel['appendix'];
  generatedAt: string;
}): RenderModel {
  const { facts: f, letterhead, appendix, generatedAt } = args;
  const sections: RenderSection[] = [];

  // 1 — The assumed sale price, labeled unmistakably as KOANO-derived indicative.
  sections.push({
    heading: 'Assumed Sale Price',
    provenanceNote: {
      provenance: 'live',
      text: 'THIS IS A KOANO-DERIVED INDICATIVE VALUE from recorded comparable sales. NOT an appraisal, a listing price, or an accepted offer. It is a starting figure for this estimate; replace it with your actual contract or list price.',
    },
    highlight: {
      figures: [
        {
          label: 'KOANO indicative value (recorded sales)',
          value: fmtMoney(f.indicativeValue),
          sub: `${fmtMoney(f.medianPsf)}/sq ft median × ${fmtInt(f.buildingAreaSqft)} sq ft · ${fmtInt(f.salesCount)} recorded sales`,
          emphasis: true,
        },
      ],
    },
    paragraphs: [
      'Every line below is estimated FROM this figure. If you have a contract price, a list price, or an appraised value, use that instead. This indicative value is only a placeholder so the sheet is usable before those exist.',
    ],
  });

  // 2 — The fill-in cost lines: what KOANO cannot source.
  sections.push({
    heading: 'Closing Costs: You Provide These',
    provenanceNote: {
      provenance: 'representative',
      text: 'KOANO does not know these figures. Rates and amounts vary by property, party, lender, and contract. Fill them in from your closing statement, lender, and attorney.',
    },
    table: {
      columns: ['Line item', 'Amount', 'Why KOANO cannot source it'],
      rows: [
        ['Transfer taxes (NYC RPTT + NY State)', '_____________', 'Rate depends on price band, property type, and party. Enter from your calculation.'],
        ['Title insurance & search', '_____________', 'Set by the title company; not a public figure.'],
        ['Broker commission', '_____________', 'Negotiated per engagement; KOANO does not hold your agreement.'],
        ['Mortgage payoff (seller)', '_____________', 'Your outstanding loan balance, from your lender.'],
        ['Attorney / recording / misc.', '_____________', 'Varies by counsel and filing.'],
      ],
      caption: 'These are inputs, not KOANO outputs. Leave blank until you have the real figures.',
    },
  });

  // 3 — The net formula (structure, not a fabricated total).
  sections.push({
    heading: 'Estimated Net',
    paragraphs: [
      'Seller net proceeds  =  sale price  −  (transfer taxes  +  title  +  commission  +  mortgage payoff  +  attorney/misc.)',
      'Buyer cash to close  =  down payment  +  (transfer taxes  +  title  +  attorney/misc.)  −  credits',
      `Using the assumed sale price of ${fmtMoney(f.indicativeValue)}, the net is that figure minus the totals you enter above. KOANO does not compute a net total, because the inputs are yours to supply. A number here would be false precision.`,
    ],
  });

  return {
    docTitle: 'Buyer / Seller Net Sheet',
    subtitle: f.addressLabel,
    letterhead,
    sections,
    appendix,
    generatedAt,
  };
}
