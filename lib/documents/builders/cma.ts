// KOANO document engine — Comparative Market Analysis (Transaction, Cluster 2).
// The named broker marquee. Built entirely on live data: NYC DOF recorded sales
// (now DISTANCE-RANKED via PLUTO centroids), FHFA HPI, and CFPB HMDA lending.
// Its value-add over the pricing sheet: distance-ranked comps, an HPI TIME
// ADJUSTMENT (each comp's $/sq ft moved to today by the regional index), and a
// grounded market narrative.
//
// Honest scope: this is a RECORDED-SALES CMA. Recorded sales carry price, date,
// gross sqft, class, and location — NOT beds/baths/condition, active listings,
// or days-on-market (those are MLS, paid). The document says so; it never implies
// MLS access.

import type { HpiTrend, MlsComp, MortgageDemandInfo } from '../../providers/types';
import type { DataPoint } from '../../providers/types';
import type { DocumentData, Letterhead } from '../types';
import type { RenderModel, RenderSection } from '../render/model';
import { extractPricingFacts, type PricingFacts } from './pricing-sheet';

function fmtMoney(n: number | null | undefined): string {
  return n == null || !Number.isFinite(n) ? '—' : `$${Math.round(n).toLocaleString('en-US')}`;
}
function fmtInt(n: number | null | undefined): string {
  return n == null || !Number.isFinite(n) ? '—' : Math.round(n).toLocaleString('en-US');
}
function fmtPct(n: number | null | undefined): string {
  return n == null || !Number.isFinite(n) ? '—' : `${n > 0 ? '+' : ''}${n}%`;
}
function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}
function trimmedMedian(nums: number[]): number {
  if (nums.length < 5) return median(nums);
  const s = [...nums].sort((a, b) => a - b);
  const cut = Math.floor(s.length * 0.1);
  return median(s.slice(cut, s.length - cut));
}

// Move a comp's $/sq ft to today using the regional annual HPI rate compounded
// over the years since sale. A transparent index adjustment of a verbatim value.
function hpiAdjust(psf: number, saleDate: string, annualPct: number | null): number {
  if (annualPct == null || !saleDate) return psf;
  const t = new Date(saleDate).getTime();
  if (!(t > 0)) return psf;
  const yrs = (Date.now() - t) / (365.25 * 86_400_000);
  return Math.round(psf * Math.pow(1 + annualPct / 100, yrs));
}

interface AdjComp extends MlsComp {
  adjustedPsf: number;
}

export interface CmaFacts extends PricingFacts {
  adjComps: AdjComp[];
  timeAdjustedMedianPsf: number;
  timeAdjustedMidValue: number | null;
  hpiRegion: string | null;
  hpiYoy: number | null;
  hpi5yr: number | null;
  hpiPeriod: string | null;
  denialRatePct: number | null;
  originationsYoyPct: number | null;
  hmdaYear: number | null;
}

export function extractCmaFacts(
  data: DocumentData,
): { ok: true; facts: CmaFacts } | { ok: false; error: string } {
  const pricing = extractPricingFacts(data);
  if (!pricing.ok) return pricing;
  const hpi = data.blocks.hpi?.data as HpiTrend | null | undefined;
  const mortgage = data.blocks.mortgage_demand?.data as MortgageDemandInfo | null | undefined;
  const yoy = hpi?.yoy_change_pct ?? null;

  const adjComps: AdjComp[] = pricing.facts.comps.map((c) => ({ ...c, adjustedPsf: hpiAdjust(c.price_per_sqft, c.sale_date, yoy) }));
  const adjPsf = adjComps.map((c) => c.adjustedPsf).filter((n) => Number.isFinite(n) && n > 0);
  const timeAdjustedMedianPsf = adjPsf.length ? trimmedMedian(adjPsf) : pricing.facts.medianPsf;
  const area = pricing.facts.buildingAreaSqft;

  return {
    ok: true,
    facts: {
      ...pricing.facts,
      adjComps,
      timeAdjustedMedianPsf,
      timeAdjustedMidValue: area && area > 0 ? timeAdjustedMedianPsf * area : null,
      hpiRegion: hpi?.region ?? null,
      hpiYoy: yoy,
      hpi5yr: hpi?.five_yr_change_pct ?? null,
      hpiPeriod: hpi?.latest_period ?? null,
      denialRatePct: mortgage?.denial_rate_pct ?? null,
      originationsYoyPct: mortgage?.originations_yoy_pct ?? null,
      hmdaYear: mortgage?.year ?? null,
    },
  };
}

export const CMA_SYSTEM_PROMPT = `You are KOANO's CMA market analyst. Write a client-ready market narrative for a Comparative Market Analysis, 130–200 words, plain professional language a broker can hand to a client.
Rules:
- Use ONLY the provided data points. Never invent comps, amenities, school ratings, days-on-market, or active listings — this is built on recorded sales, not MLS.
- Cite the concrete figures given (median $/sq ft, the price band, the HPI move, mortgage denial rate). That is what makes it credible.
- No hype words (hot, skyrocketing, once-in-a-lifetime). No guarantees. No predictions beyond what the data shows.
- Structure: price positioning from the comp band → market direction from HPI + local price trend → financing/affordability context from HMDA → one measured closing sentence.
- Output plain text paragraphs only. No headings, no markdown, no preamble.`;

export function cmaDataPoints(f: CmaFacts): DataPoint[] {
  const dp = (label: string, value: string | number | null): DataPoint => ({ label, value: value ?? 'n/a', provenance: 'live', source: 'KOANO CMA facts' });
  return [
    dp('subject_address', f.addressLabel),
    dp('median_price_per_sqft', f.medianPsf),
    dp('time_adjusted_median_price_per_sqft', f.timeAdjustedMedianPsf),
    dp('price_band_low_per_sqft', Math.round(f.p25Psf)),
    dp('price_band_high_per_sqft', Math.round(f.p75Psf)),
    dp('comparable_sales_count', f.salesCount),
    dp('local_recorded_price_trend', f.priceTrend),
    dp('hpi_region', f.hpiRegion),
    dp('hpi_yoy_change_pct', f.hpiYoy),
    dp('hpi_5yr_change_pct', f.hpi5yr),
    dp('mortgage_denial_rate_pct', f.denialRatePct),
    dp('mortgage_originations_yoy_pct', f.originationsYoyPct),
  ];
}

export function cmaFactsForModel(f: CmaFacts): Record<string, unknown> {
  return {
    subject_address: f.addressLabel,
    price_band: { low_per_sqft: Math.round(f.p25Psf), median_per_sqft: f.medianPsf, high_per_sqft: Math.round(f.p75Psf), time_adjusted_median_per_sqft: f.timeAdjustedMedianPsf },
    comparable_sales_count: f.salesCount,
    local_recorded_price_trend: f.priceTrend,
    hpi: { region: f.hpiRegion, yoy_change_pct: f.hpiYoy, five_yr_change_pct: f.hpi5yr, period: f.hpiPeriod },
    mortgage: { denial_rate_pct: f.denialRatePct, originations_yoy_pct: f.originationsYoyPct, year: f.hmdaYear },
  };
}

export function deterministicCmaNarrative(f: CmaFacts): string[] {
  const band = `The comparable recorded sales place value in a band of ${fmtMoney(f.p25Psf)} to ${fmtMoney(f.p75Psf)} per square foot, with a central figure of ${fmtMoney(f.medianPsf)} (${fmtMoney(f.timeAdjustedMedianPsf)} adjusted to today's market via the ${f.hpiRegion ?? 'regional'} House Price Index). Local recorded-sale prices are ${f.priceTrend}.`;
  const macro = f.hpiYoy != null
    ? `The ${f.hpiRegion ?? 'regional'} House Price Index moved ${fmtPct(f.hpiYoy)} year over year (${f.hpiPeriod ?? 'latest period'})${f.hpi5yr != null ? ` and ${fmtPct(f.hpi5yr)} over five years` : ''}, the macro backdrop against which these comparables should be read.`
    : 'House Price Index context was unavailable for this call.';
  const fin = f.denialRatePct != null
    ? `On financing, ${f.denialRatePct}% of mortgage applications in the county were denied${f.originationsYoyPct != null ? ` and originations moved ${fmtPct(f.originationsYoyPct)} year over year` : ''} (CFPB HMDA${f.hmdaYear ? ` ${f.hmdaYear}` : ''}) — a read on how readily buyers here can transact.`
    : '';
  const close = 'This is an indicative range from recorded sales, not an appraisal; recorded sales carry no bed/bath, condition, or days-on-market detail, which the reviewing agent should weigh.';
  return [band, macro, fin, close].filter(Boolean);
}

export function buildCmaModel(args: {
  facts: CmaFacts;
  letterhead: Letterhead;
  narrative: string[];
  appendix: RenderModel['appendix'];
  generatedAt: string;
}): RenderModel {
  const { facts: f, letterhead, narrative, appendix, generatedAt } = args;
  const sections: RenderSection[] = [];

  // 1 — Pricing recommendation (band + HPI time adjustment).
  sections.push({
    heading: 'Pricing Recommendation',
    provenanceNote: { provenance: 'live', text: 'An indicative range from distance-ranked recorded sales, not an appraisal or a list price. The midpoint is also shown adjusted to today via the regional House Price Index.' },
    highlight: {
      figures: [
        { label: 'Low (25th percentile)', value: fmtMoney(f.lowValue), sub: `${fmtMoney(f.p25Psf)}/sq ft` },
        { label: 'Midpoint (trimmed median)', value: fmtMoney(f.midValue), sub: `${fmtMoney(f.medianPsf)}/sq ft`, emphasis: true },
        { label: 'HPI-adjusted midpoint', value: fmtMoney(f.timeAdjustedMidValue), sub: `${fmtMoney(f.timeAdjustedMedianPsf)}/sq ft` },
      ],
    },
    paragraphs: [
      `The band is the interquartile spread (25th–75th percentile) of ${fmtInt(f.salesCount)} comparable recorded $/sq ft — the middle 50% of nearby sales, excluding outliers on both ends — applied to the subject's ${fmtInt(f.buildingAreaSqft)} sq ft. Comparables are ranked by true distance from the subject (recorded sale → PLUTO centroid).`,
      `The HPI-adjusted midpoint moves each comparable's price to today using the ${f.hpiRegion ?? 'regional'} House Price Index (${fmtPct(f.hpiYoy)} YoY${f.hpiPeriod ? `, ${f.hpiPeriod}` : ''}), so older sales are not read at stale prices. Local recorded-sale prices are ${f.priceTrend}.`,
    ],
  });

  // 2 — The comps (with distance + time-adjusted $/sq ft).
  const shown = f.adjComps.slice(0, 12);
  sections.push({
    heading: 'Comparable Sales',
    table: {
      columns: ['Address', 'Dist.', 'Sale date', 'Sale price', '$/sq ft', 'Adj. $/sq ft', 'Sq ft', 'Class'],
      rows: shown.map((c) => [
        c.address,
        c.distance_mi != null ? `${c.distance_mi} mi` : '—',
        (c.sale_date || '').slice(0, 10),
        fmtMoney(c.sale_price),
        fmtMoney(c.price_per_sqft),
        fmtMoney(c.adjustedPsf),
        fmtInt(c.gross_square_feet),
        c.building_class,
      ]),
      caption: `${fmtInt(f.salesCount)} qualifying recorded sales, distance-ranked. Recorded sales carry no beds/baths, condition, or days-on-market (those require MLS). ${f.scopeNote}`,
    },
  });

  // 3 — Market narrative (the single grounded model call).
  sections.push({ heading: 'Market Narrative', paragraphs: narrative });

  return { docTitle: 'Comparative Market Analysis', subtitle: f.addressLabel, letterhead, sections, appendix, generatedAt };
}
