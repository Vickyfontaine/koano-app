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
const PLUTO = 'https://data.cityofnewyork.us/resource/64uk-42ks.json'; // MapPLUTO — has a lat/lng centroid per BBL

const MIN_PRICE = 100000; // excludes $1 non-arms-length transfers
const MIN_GSF = 300; // excludes bad/placeholder square footage
const COMPS_SHOWN = 10;
const TRIM_PCT = 0.1; // trim top/bottom decile of $/sqft before the median
const RADIUS_MI = 1.0; // prefer comps within a mile of the subject
const MIN_RADIUS_COMPS = 5; // below this, fall back to the nearest sales regardless of radius
const NEAREST_FALLBACK = 20; // how many nearest to keep when the radius is sparse

interface SaleRow {
  borough?: string;
  block?: string;
  lot?: string;
  address?: string;
  sale_price?: string;
  sale_date?: string;
  gross_square_feet?: string;
  building_class_category?: string;
  residential_units?: string;
  zip_code?: string;
}

function haversineMi(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 3958.8;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

// Centroid lat/lng for a set of BBLs, from MapPLUTO (one batch query). PLUTO
// stores bbl as a number-formatted string ("3009720058.00000000"); we key the
// map by the plain integer BBL to match the DOF-derived BBL.
async function plutoCoords(bbls: string[]): Promise<Map<string, { lat: number; lon: number }>> {
  const m = new Map<string, { lat: number; lon: number }>();
  if (bbls.length === 0) return m;
  const list = bbls.map((b) => `'${b}'`).join(',');
  const url = `${PLUTO}?$where=${encodeURIComponent(`bbl in (${list})`)}&$select=bbl,latitude,longitude&$limit=5000`;
  const rows = await fetchJson<{ bbl?: string; latitude?: string; longitude?: string }[]>(url, { timeoutMs: 30000 });
  for (const r of rows) {
    const bbl = r.bbl ? String(Math.trunc(Number(r.bbl))) : null;
    const lat = Number(r.latitude);
    const lon = Number(r.longitude);
    if (bbl && Number.isFinite(lat) && Number.isFinite(lon)) m.set(bbl, { lat, lon });
  }
  return m;
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
          `&$select=borough,block,lot,address,sale_price,sale_date,gross_square_feet,building_class_category,residential_units,zip_code` +
          `&$order=sale_date DESC&$limit=2000`,
        { timeoutMs: 30000 },
      );

      // Per-comp $/sq ft from each row's own gross_square_feet.
      interface Qualified {
        comp: MlsComp;
        psf: number;
        dateMs: number;
        bbl: string | null;
        dist: number; // miles from subject; Infinity until PLUTO coords resolve
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
        const bbl =
          r.borough && r.block && r.lot
            ? `${r.borough}${String(r.block).padStart(5, '0')}${String(r.lot).padStart(4, '0')}`
            : null;
        qualified.push({
          psf,
          dateMs,
          bbl,
          dist: Infinity,
          comp: {
            address: r.address ?? '',
            sale_price: price,
            sale_date: (r.sale_date ?? '').slice(0, 10),
            price_per_sqft: psf,
            gross_square_feet: gsf,
            building_class: r.building_class_category ?? '',
            distance_mi: null,
          },
        });
      }

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

      // --- Real distance: DOF BBL → PLUTO centroid → haversine from subject.
      //     Prefer comps within RADIUS_MI; fall back to the nearest when sparse.
      //     If PLUTO coords are unavailable, degrade to the ZIP-keyed set.
      const bbls = Array.from(new Set(qualified.map((q) => q.bbl).filter(Boolean))) as string[];
      const coords =
        addr.latitude && addr.longitude
          ? await plutoCoords(bbls).catch(() => new Map<string, { lat: number; lon: number }>())
          : new Map<string, { lat: number; lon: number }>();

      let pool: Qualified[] = qualified;
      let distanceRanked = false;
      if (coords.size > 0) {
        distanceRanked = true;
        for (const q of qualified) {
          const c = q.bbl ? coords.get(q.bbl) : undefined;
          q.dist = c ? haversineMi(addr.latitude, addr.longitude, c.lat, c.lon) : Infinity;
        }
        const sorted = qualified.filter((q) => Number.isFinite(q.dist)).sort((a, b) => a.dist - b.dist);
        const within = sorted.filter((q) => q.dist <= RADIUS_MI);
        pool = within.length >= MIN_RADIUS_COMPS ? within : sorted.slice(0, NEAREST_FALLBACK);
        if (pool.length === 0) pool = qualified; // never empty when candidates exist
        for (const q of pool) q.comp.distance_mi = Math.round(q.dist * 100) / 100;
      }

      // price_trend: recent-6mo vs prior-6mo median $/sqft within the comp pool.
      const sixMonthsMs = new Date(monthsAgoIso(6)).getTime();
      const recent = pool.filter((q) => q.dateMs >= sixMonthsMs).map((q) => q.psf);
      const prior = pool.filter((q) => q.dateMs < sixMonthsMs).map((q) => q.psf);
      let price_trend: 'rising' | 'falling' | 'flat' = 'flat';
      if (recent.length >= 3 && prior.length >= 3) {
        const rMed = trimmedMedian(recent);
        const pMed = trimmedMedian(prior);
        if (pMed > 0) {
          const change = (rMed - pMed) / pMed;
          price_trend = change > 0.03 ? 'rising' : change < -0.03 ? 'falling' : 'flat';
        }
      }

      const withinCount = distanceRanked ? pool.filter((q) => q.dist <= RADIUS_MI).length : 0;
      const scope_note = distanceRanked
        ? `Comparables are recorded residential sales ranked by true distance from the subject ` +
          `(DOF sale → PLUTO centroid), last 12 months. ` +
          `${withinCount >= MIN_RADIUS_COMPS ? `${pool.length} within ${RADIUS_MI} mi.` : `Sparse within ${RADIUS_MI} mi — the ${pool.length} nearest sales are used.`} ` +
          'Condos/co-ops without recorded square footage are excluded, so comps skew to 1-3 family homes. NYC only.'
        : `Comparables are recorded residential sales in ZIP ${zip} (last 12 months); PLUTO coordinates ` +
          'were unavailable this call, so proximity is ZIP-keyed. Condos/co-ops without recorded square ' +
          'footage are excluded, so comps skew to 1-3 family homes. NYC only.';

      const data: MlsCompsSummary = {
        comps: pool.slice(0, COMPS_SHOWN).map((q) => q.comp),
        median_price_per_sqft: trimmedMedian(pool.map((q) => q.psf)),
        sales_count: pool.length,
        price_trend,
        scope_note,
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
