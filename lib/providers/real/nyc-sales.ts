// Comparable sales — live NYC Open Data (SODA):
//   NYC Citywide Rolling Calendar Sales (usep-8jbt) — recorded residential
//   sales, ~last 12 months. Each row carries its own gross_square_feet, so
//   $/sq ft is per-comp real (sale_price / gross_square_feet). The subject's
//   indicative value is computed downstream (median $/sq ft × live PLUTO
//   building area) — this provider stays independent of the zoning provider.
//
// Honesty / coverage (surfaced in scope_note, never hidden):
// - NYC only. Recent sales lag until recorded.
// - Condos/co-ops record 0 gross_square_feet in DOF sales, so they are excluded
//   from $/sq ft; comps skew to 1-3 family homes.
// - Proximity is keyed to the subject's ZIP (this dataset has no lat/lng). A
//   large or mixed ZIP may include less-comparable sales — a known v1 limit;
//   block-level or BBL-radius proximity is a future refinement.
// - An empty result is a COVERAGE FACT (live, empty comps + note), not a
//   failure. Representative fallback fires only on an actual API error.

import type {
  MlsComp,
  MlsCompsProvider,
  MlsCompsSummary,
  ProviderResult,
  ResolvedAddress,
} from '../types';
import { errMsg, fetchJson } from './http';

const ROLLING_SALES = 'https://data.cityofnewyork.us/resource/usep-8jbt.json';

const MIN_PRICE = 100000; // excludes $1 non-arms-length transfers
const MIN_GSF = 300; // excludes bad/placeholder square footage
const COMPS_SHOWN = 10;
const TRIM_PCT = 0.1; // trim top/bottom decile of $/sqft before the median

interface SaleRow {
  address?: string;
  sale_price?: string;
  sale_date?: string;
  gross_square_feet?: string;
  building_class_category?: string;
  residential_units?: string;
  zip_code?: string;
}

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

// Median of the middle (1 - 2*TRIM_PCT) of values — robust to the wide
// $/sqft outlier spread in recorded sales.
function trimmedMedian(nums: number[]): number {
  if (nums.length < 5) return median(nums);
  const s = [...nums].sort((a, b) => a - b);
  const cut = Math.floor(s.length * TRIM_PCT);
  return median(s.slice(cut, s.length - cut));
}

function monthsAgoIso(n: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() - n);
  return d.toISOString().slice(0, 19);
}

const REPRESENTATIVE_FALLBACK: MlsCompsSummary = {
  comps: [],
  median_price_per_sqft: 900,
  sales_count: 0,
  price_trend: 'flat',
  scope_note:
    'REPRESENTATIVE — live NYC recorded-sales call failed. Typical brownstone-Brooklyn $/sq ft profile.',
};

export const nycSalesComps: MlsCompsProvider = {
  name: 'NYC recorded sales comps (DOF Rolling Sales via NYC Open Data)',

  async getComps(addr: ResolvedAddress): Promise<ProviderResult<MlsCompsSummary>> {
    const fetched_at = new Date().toISOString();
    const zip = addr.zip;

    try {
      // Outside NYC: a Census-geocoded address has a ZIP but no BBL. Without this
      // guard we would query NYC DOF sales with an out-of-town ZIP, match nothing,
      // and return a LIVE `sales_count: 0` that reads as "no sales here" — and,
      // being tagged live, would not even flag the verdict as representative.
      // Recorded-sales comps are NYC-only, so a non-NYC address is out of coverage.
      if (!addr.bbl) {
        return {
          ok: true,
          data: {
            comps: [],
            median_price_per_sqft: 0,
            sales_count: 0,
            price_trend: 'flat',
            scope_note:
              'Recorded-sales comps cover NYC only (DOF Rolling Sales). This address is outside NYC, ' +
              'so no live comparable set is available — a national MLS integration would fill this.',
          },
          provenance: 'representative',
          source: 'NYC Open Data — DOF Rolling Calendar Sales (usep-8jbt) — outside NYC coverage',
          fetched_at,
        };
      }

      if (!zip) {
        // No ZIP resolved → coverage fact (can't key proximity), still live.
        return {
          ok: true,
          data: {
            comps: [],
            median_price_per_sqft: 0,
            sales_count: 0,
            price_trend: 'flat',
            scope_note:
              'No ZIP resolved for this address, so no comparable set could be drawn. Recorded sales cover NYC only.',
          },
          provenance: 'live',
          source: 'NYC Open Data — DOF Rolling Calendar Sales (usep-8jbt)',
          fetched_at,
        };
      }

      const cutoff12 = monthsAgoIso(12);
      // Residential HOME classes only (category prefix): 01/02/03 one-two-three
      // family, 09/10 co-ops, 12/13 condos. Excludes rental buildings (07/08)
      // and commercial — a whole-apartment-building sale is not a home comp.
      const homeClasses =
        "(building_class_category like '01%' OR building_class_category like '02%' OR " +
        "building_class_category like '03%' OR building_class_category like '09%' OR " +
        "building_class_category like '10%' OR building_class_category like '12%' OR " +
        "building_class_category like '13%')";
      const where = encodeURIComponent(
        `zip_code='${zip}' AND sale_price > ${MIN_PRICE} AND gross_square_feet > ${MIN_GSF} ` +
          `AND sale_date > '${cutoff12}' AND ${homeClasses}`,
      );
      const rows = await fetchJson<SaleRow[]>(
        `${ROLLING_SALES}?$where=${where}` +
          `&$select=address,sale_price,sale_date,gross_square_feet,building_class_category,residential_units,zip_code` +
          `&$order=sale_date DESC&$limit=2000`,
        { timeoutMs: 30000 },
      );

      // Per-comp $/sq ft from each row's own gross_square_feet.
      interface Qualified {
        comp: MlsComp;
        psf: number;
        dateMs: number;
      }
      const qualified: Qualified[] = [];
      for (const r of rows) {
        const price = Number(r.sale_price);
        const gsf = Number(r.gross_square_feet);
        if (!Number.isFinite(price) || !Number.isFinite(gsf) || gsf < MIN_GSF || price < MIN_PRICE) {
          continue;
        }
        const psf = Math.round(price / gsf);
        const dateMs = r.sale_date ? new Date(r.sale_date).getTime() : 0;
        qualified.push({
          psf,
          dateMs,
          comp: {
            address: r.address ?? '',
            sale_price: price,
            sale_date: (r.sale_date ?? '').slice(0, 10),
            price_per_sqft: psf,
            gross_square_feet: gsf,
            building_class: r.building_class_category ?? '',
          },
        });
      }

      const proximityNote =
        `Comparables are recorded residential sales in ZIP ${zip} (last 12 months). ` +
        'Proximity is ZIP-keyed — this dataset has no coordinates — so a large or mixed ZIP may ' +
        'include less-comparable sales; block-level/radius proximity is a future refinement. ' +
        'Condos/co-ops without recorded square footage are excluded, so comps skew to 1-3 family homes. NYC only.';

      if (qualified.length === 0) {
        // Coverage fact, not a failure.
        return {
          ok: true,
          data: {
            comps: [],
            median_price_per_sqft: 0,
            sales_count: 0,
            price_trend: 'flat',
            scope_note:
              `No qualifying recorded residential sales in ZIP ${zip} in the last 12 months. ` +
              'Recorded sales cover NYC only and exclude units without recorded square footage.',
          },
          provenance: 'live',
          source: 'NYC Open Data — DOF Rolling Calendar Sales (usep-8jbt)',
          fetched_at,
        };
      }

      // price_trend: recent-6mo vs prior-6mo median $/sqft (from one query).
      const sixMonthsMs = new Date(monthsAgoIso(6)).getTime();
      const recent = qualified.filter((q) => q.dateMs >= sixMonthsMs).map((q) => q.psf);
      const prior = qualified.filter((q) => q.dateMs < sixMonthsMs).map((q) => q.psf);
      let price_trend: 'rising' | 'falling' | 'flat' = 'flat';
      if (recent.length >= 3 && prior.length >= 3) {
        const rMed = trimmedMedian(recent);
        const pMed = trimmedMedian(prior);
        if (pMed > 0) {
          const change = (rMed - pMed) / pMed;
          price_trend = change > 0.03 ? 'rising' : change < -0.03 ? 'falling' : 'flat';
        }
      }

      const data: MlsCompsSummary = {
        comps: qualified.slice(0, COMPS_SHOWN).map((q) => q.comp),
        median_price_per_sqft: trimmedMedian(qualified.map((q) => q.psf)),
        sales_count: qualified.length,
        price_trend,
        scope_note: proximityNote,
      };

      return {
        ok: true,
        data,
        provenance: 'live',
        source: 'NYC Open Data — DOF Rolling Calendar Sales (usep-8jbt)',
        fetched_at,
      };
    } catch (e) {
      return {
        ok: true,
        data: REPRESENTATIVE_FALLBACK,
        provenance: 'representative',
        source: 'NYC recorded sales comps [FALLBACK]',
        fetched_at,
        error: `Live call failed: ${errMsg(e)}`,
      };
    }
  },
};
