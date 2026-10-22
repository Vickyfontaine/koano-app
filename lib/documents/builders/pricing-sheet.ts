// KOANO document engine — Pricing Recommendation Sheet (Transaction).
// A DEFENSIBLE price RANGE from live recorded sales. The credibility failure
// agents face is cherry-picked comps, so two things are made visible:
//   1. the comp SELECTION RULE (which sales qualify), verbatim from the provider;
//   2. how the RANGE ITSELF is computed — the interquartile spread (25th–75th
//      percentile) of comparable $/sqft — so the band's origin is transparent,
//      not three numbers that appear from nowhere.
// Deterministic (zero narrative calls). Live: NYC DOF recorded sales + PLUTO.

import type { ZoningInfo, MlsCompsSummary } from '../../providers/types';
import type { DocumentData, Letterhead } from '../types';
import type { RenderModel, RenderSection } from '../render/model';
import { valuationGuard, compPool } from '../valuation-guard';

const MAX_COMPS_SHOWN = 12;

function fmtMoney(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return `$${Math.round(n).toLocaleString('en-US')}`;
}
function fmtInt(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return Math.round(n).toLocaleString('en-US');
}


export interface PricingFacts {
  addressLabel: string;
  bbl: string | null;
  buildingClass: string | null;
  buildingAreaSqft: number | null;
  salesCount: number;
  priceTrend: 'rising' | 'falling' | 'flat';
  scopeNote: string;
  comps: MlsCompsSummary['comps'];
  // interquartile band of comp $/sqft
  p25Psf: number;
  medianPsf: number;
  p75Psf: number;
  lowValue: number | null;
  midValue: number | null;
  highValue: number | null;
  // Non-null when the building-area valuation is withheld (co-op, condo, 7+
  // units): the reason is printed IN PLACE of the dollar figures.
  valuationBlockedReason: string | null;
  subjectExcluded: boolean; // the subject's own recorded sale was removed from its comp pool
}

export function extractPricingFacts(
  data: DocumentData,
): { ok: true; facts: PricingFacts } | { ok: false; error: string } {
  const zoning = data.blocks.zoning?.data as ZoningInfo | null | undefined;
  const comps = data.blocks.mls_comps?.data as MlsCompsSummary | null | undefined;
  if (!zoning) return { ok: false, error: 'Zoning/PLUTO data unavailable for this address.' };
  if (!comps || comps.sales_count <= 0 || comps.comps.length === 0) {
    return { ok: false, error: 'No recorded comparable sales available for this area. Cannot build a price band.' };
  }
  // ONE comp pool for the band edges, the midpoint and (in the CMA) the HPI
  // adjustment: the distance-ranked comparables, with the subject's own recorded
  // sale excluded so a property never prices itself. The midpoint is the TRIMMED
  // median of that same pool (the pricing sheet, CMA and net sheet all share
  // this function, so two documents on one property never disagree).
  const pool = compPool(comps, data.resolved_address.normalized);
  if (pool.medianPsf == null || pool.p25Psf == null || pool.p75Psf == null) {
    return { ok: false, error: 'No comparable recorded sales with a $/sq ft remain after excluding the subject. Cannot build a price band.' };
  }
  const p25 = pool.p25Psf;
  const p75 = pool.p75Psf;
  const median = pool.medianPsf;
  const subjectExcluded = pool.subjectExcluded;
  const guard = valuationGuard(zoning);
  const area = zoning.building_area_sqft;
  const scale = guard.allowed && area && area > 0 ? area : null;
  return {
    ok: true,
    facts: {
      addressLabel: data.resolved_address.normalized || data.resolved_address.input,
      bbl: data.resolved_address.bbl,
      buildingClass: zoning.building_class,
      buildingAreaSqft: area,
      salesCount: comps.sales_count,
      priceTrend: comps.price_trend,
      scopeNote: comps.scope_note,
      comps: pool.comps,
      p25Psf: p25,
      medianPsf: median,
      p75Psf: p75,
      lowValue: scale ? p25 * scale : null,
      midValue: scale ? median * scale : null,
      highValue: scale ? p75 * scale : null,
      valuationBlockedReason: guard.allowed ? null : guard.reason,
      subjectExcluded,
    },
  };
}

export function buildPricingModel(args: {
  facts: PricingFacts;
  letterhead: Letterhead;
  appendix: RenderModel['appendix'];
  generatedAt: string;
}): RenderModel {
  const { facts: f, letterhead, appendix, generatedAt } = args;
  const sections: RenderSection[] = [];

  // 1 — The recommended band (headline figures) + how it was computed. When the
  // building-area valuation is withheld (co-op, condo, 7+ units) the per-sq-ft
  // band still prints, the dollar figures do not, and the reason is stated.
  const blocked = f.valuationBlockedReason;
  sections.push({
    heading: 'Recommended Price Band',
    provenanceNote: {
      provenance: 'live',
      text: blocked
        ? 'The band below is per square foot of comparable recorded sales. No whole-building dollar value is printed for this subject; the reason is stated under the figures.'
        : 'The band is the interquartile spread (25th to 75th percentile) of comparable recorded $/sq ft, applied to the subject building area. It is an indicative range from recorded sales, not an appraisal or a list price.',
    },
    highlight: {
      figures: blocked
        ? [
            { label: 'Low (25th percentile)', value: `${fmtMoney(f.p25Psf)}/sq ft` },
            { label: 'Midpoint (trimmed median)', value: `${fmtMoney(f.medianPsf)}/sq ft`, emphasis: true },
            { label: 'High (75th percentile)', value: `${fmtMoney(f.p75Psf)}/sq ft` },
          ]
        : [
            { label: 'Low (25th percentile)', value: fmtMoney(f.lowValue), sub: `${fmtMoney(f.p25Psf)}/sq ft` },
            { label: 'Midpoint (trimmed median)', value: fmtMoney(f.midValue), sub: `${fmtMoney(f.medianPsf)}/sq ft`, emphasis: true },
            { label: 'High (75th percentile)', value: fmtMoney(f.highValue), sub: `${fmtMoney(f.p75Psf)}/sq ft` },
          ],
    },
    paragraphs: [
      ...(blocked ? [blocked] : []),
      `Derivation: the ${fmtInt(f.comps.length)} comparable recorded sales${f.subjectExcluded ? ' (the subject\'s own recorded sale excluded)' : ''} were reduced to their price per square foot. The 25th and 75th percentiles of that distribution (${fmtMoney(f.p25Psf)} and ${fmtMoney(f.p75Psf)} per sq ft) set the low and high edges: the interquartile spread, the middle 50% of comparable sales, which deliberately excludes the cheapest and most expensive outliers on both ends. The trimmed median of the same pool (${fmtMoney(f.medianPsf)} per sq ft) sets the midpoint.${blocked ? '' : ` All three were applied to the subject's ${fmtInt(f.buildingAreaSqft)} sq ft of building area.`}`,
      `Local recorded-sale prices are ${f.priceTrend}, which the reviewer should weigh alongside the band.`,
    ],
  });

  // 2 — The comp selection rule, made visible (the anti-cherry-pick section).
  sections.push({
    heading: 'How These Comparables Were Selected',
    paragraphs: [
      'To keep the selection defensible rather than cherry-picked, a fixed rule is applied to NYC DOF recorded sales. The analyst does not hand-pick the set:',
      '• Residential recorded sales only (DOF building classes 01, 02, 03, 09, 10, 12, 13: one- to three-family homes, condos, co-ops).',
      '• A trailing window of recent recorded sales, ranked by true distance from the subject (recorded sale → PLUTO centroid), preferring the nearest.',
      '• Sales with a recorded gross square footage (so a $/sq ft can be computed); sales without it are excluded.',
      '• A trimmed median is used for the central figure to damp outliers.',
      `Provider scope note: ${f.scopeNote}`,
    ],
  });

  // 3 — The comps themselves.
  const shown = f.comps.slice(0, MAX_COMPS_SHOWN);
  const compsSection: RenderSection = {
    heading: 'Comparable Recorded Sales',
    table: {
      columns: ['Address', 'Sale date', 'Sale price', '$/sq ft', 'Sq ft', 'Class'],
      rows: shown.map((c) => [
        c.address,
        (c.sale_date || '').slice(0, 10),
        fmtMoney(c.sale_price),
        fmtMoney(c.price_per_sqft),
        fmtInt(c.gross_square_feet),
        c.building_class,
      ]),
      caption: `${fmtInt(f.salesCount)} qualifying recorded sales in scope; ${fmtInt(f.comps.length)} in the comparable pool. Recorded sales have no days-on-market.`,
    },
  };
  if (f.comps.length > shown.length) {
    compsSection.trimNote = `Showing ${shown.length} of ${fmtInt(f.comps.length)} comparable sales; the full set informed the percentiles above.`;
  }
  sections.push(compsSection);

  return {
    docTitle: 'Pricing Recommendation Sheet',
    subtitle: f.addressLabel,
    letterhead,
    sections,
    appendix,
    generatedAt,
  };
}
