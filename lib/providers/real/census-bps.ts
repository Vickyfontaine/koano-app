// Census Building Permits Survey — county-level residential NEW-SUPPLY volume +
// YoY trend. Live, keyless, national (Census www2 annual county files). A market-
// wide supply frame for Market-Timing (see BuildingPermitsSupply / the agent
// prompt) — NOT parcel construction activity, and deliberately NOT on Infrastructure
// (BPS aggregates the same local DOB filings, so it would double-count there).
//
// DURABLE READ-THROUGH CACHE (built now, not deferred): the source is a ~1 MB
// per-county annual TEXT file. Fetching it per verdict on Vercel is the FHFA /tmp
// cold-start class — /tmp is per-instance, so cold instances re-download and the
// source rate-blocks. bps_cache (migration-022) is a SHARED Supabase cache: on a
// miss we fetch the file once, extract the county's summary, store it, and every
// later request (any instance) reads the small cached row. TTL is long (BPS is
// annual). Cache read/write are best-effort — if migration-022 isn't applied the
// provider still works (always-live), it just loses the shared cache.
//
// LAG is stated honestly: annual county data trails the calendar ~12–18 months, so
// scope_note frames this as a STRUCTURAL supply read, not current conditions.

import type {
  BuildingPermitsProvider,
  BuildingPermitsSupply,
  ProviderResult,
  ResolvedAddress,
} from '../types';
import { errMsg, fetchText } from './http';
import { supabaseAdmin } from '../../supabase/server';

const BASE = 'https://www2.census.gov/econ/bps/County';
const CACHE_TTL_MS = 120 * 24 * 60 * 60 * 1000; // BPS is annual; 120 days is safe

interface CountyYear {
  year: number;
  county_name: string | null;
  total_units: number;
  single_family_units: number; // 1-unit
  multifamily_units: number; // 5+ unit
}

// Parse one county's row out of a BPS annual county file. Columns (comma-split):
// [0]year [1]stateFIPS [2]countyFIPS [3]region [4]division [5]countyName
// then groups of (Bldgs,Units,Value) for 1-unit, 2-units, 3-4 units, 5+ units:
// units at indices 7, 10, 13, 16.
function extractCounty(csv: string, stateFips: string, countyFips: string): CountyYear | null {
  const s = String(Number(stateFips)); // "36" ; tolerate zero-padding differences
  const c = String(Number(countyFips)); // "47"
  for (const line of csv.split('\n')) {
    const f = line.split(',');
    if (f.length < 17) continue;
    if (String(Number(f[1])) !== s || String(Number(f[2])) !== c) continue;
    const year = Number(f[0]);
    const u1 = Number(f[7]);
    const u2 = Number(f[10]);
    const u34 = Number(f[13]);
    const u5 = Number(f[16]);
    if (![year, u1, u2, u34, u5].every(Number.isFinite)) continue;
    return {
      year,
      county_name: (f[5] ?? '').trim() || null,
      total_units: u1 + u2 + u34 + u5,
      single_family_units: u1,
      multifamily_units: u5,
    };
  }
  return null;
}

async function fetchCountyYear(
  year: number,
  stateFips: string,
  countyFips: string,
): Promise<CountyYear | null> {
  try {
    const csv = await fetchText(`${BASE}/co${year}a.txt`, { timeoutMs: 45000 });
    return extractCounty(csv, stateFips, countyFips);
  } catch {
    return null; // 404 for a not-yet-published year, or a transient failure
  }
}

// The live computation. Finds the latest published annual year (BPS lags ≥1 year),
// then the prior year for the YoY trend. Throws if no year resolves.
async function fetchLiveBps(stateFips: string, countyFips: string): Promise<BuildingPermitsSupply> {
  const thisYear = new Date().getUTCFullYear();
  let latest: CountyYear | null = null;
  for (const y of [thisYear - 1, thisYear - 2, thisYear - 3]) {
    latest = await fetchCountyYear(y, stateFips, countyFips);
    if (latest) break;
  }
  if (!latest) throw new Error(`No BPS county data found for ${stateFips}${countyFips}`);

  const prior = await fetchCountyYear(latest.year - 1, stateFips, countyFips);
  const yoy =
    prior && prior.total_units > 0
      ? Number((((latest.total_units - prior.total_units) / prior.total_units) * 100).toFixed(1))
      : null;

  return {
    county_name: latest.county_name,
    fips_state: stateFips,
    fips_county: countyFips,
    latest_year: latest.year,
    total_units_latest: latest.total_units,
    single_family_units_latest: latest.single_family_units,
    multifamily_units_latest: latest.multifamily_units,
    prior_year: prior?.year ?? null,
    total_units_prior: prior?.total_units ?? null,
    yoy_change_pct: yoy,
    scope_note:
      `Census Building Permits Survey — ${latest.county_name ?? 'county'} residential building permits, ` +
      `${latest.total_units.toLocaleString()} units permitted in ${latest.year} ` +
      `(${latest.single_family_units.toLocaleString()} single-family, ${latest.multifamily_units.toLocaleString()} in 5+ unit buildings)` +
      `${yoy != null ? `, ${yoy >= 0 ? '+' : ''}${yoy}% vs ${prior?.year}` : ''}. ` +
      `County-wide market supply, NOT parcel-level activity. Annual data lags the calendar ~12–18 months, ` +
      `so this is a structural supply read (the trend/level of new supply the market is adding), not a current-conditions signal.`,
  };
}

async function readCache(
  stateFips: string,
  countyFips: string,
): Promise<{ data: BuildingPermitsSupply; ageMs: number } | null> {
  try {
    const { data } = await supabaseAdmin()
      .from('bps_cache')
      .select('data, fetched_at')
      .eq('fips_state', stateFips)
      .eq('fips_county', countyFips)
      .maybeSingle();
    const d = data as { data?: BuildingPermitsSupply; fetched_at?: string } | null;
    if (d?.data && d.fetched_at) return { data: d.data, ageMs: Date.now() - new Date(d.fetched_at).getTime() };
    return null;
  } catch {
    return null; // migration not applied / DB unreachable → fall through to live
  }
}

async function writeCache(stateFips: string, countyFips: string, data: BuildingPermitsSupply): Promise<void> {
  try {
    await supabaseAdmin()
      .from('bps_cache')
      .upsert(
        { fips_state: stateFips, fips_county: countyFips, data, fetched_at: new Date().toISOString() },
        { onConflict: 'fips_state,fips_county' },
      );
  } catch {
    // best-effort — a failed cache write just means the next call refetches
  }
}

export const censusBps: BuildingPermitsProvider = {
  name: 'Census Building Permits Survey (county) via KOANO durable cache',

  async getBuildingPermits(addr: ResolvedAddress): Promise<ProviderResult<BuildingPermitsSupply>> {
    const fetched_at = new Date().toISOString();
    const stateFips = addr.state_fips;
    const countyFips = addr.county_fips;

    // Needs a county key. Missing (rare for a geocoded US address) → OMIT
    // (data:null, live), never a fabricated supply figure — the omission rule.
    if (!stateFips || !countyFips) {
      return {
        ok: true,
        data: null,
        provenance: 'live',
        source: 'Census Building Permits Survey (county)',
        fetched_at,
        error: 'No county FIPS resolved for this address. Building Permits Survey not queried.',
      };
    }

    const cached = await readCache(stateFips, countyFips);
    if (cached && cached.ageMs < CACHE_TTL_MS) {
      return {
        ok: true,
        data: cached.data,
        provenance: 'live',
        source: `Census Building Permits Survey (county ${stateFips}${countyFips}, ${cached.data.latest_year}, via KOANO durable cache)`,
        fetched_at,
      };
    }

    try {
      const data = await fetchLiveBps(stateFips, countyFips);
      await writeCache(stateFips, countyFips, data);
      return {
        ok: true,
        data,
        provenance: 'live',
        source: `Census Building Permits Survey (county ${stateFips}${countyFips}, ${data.latest_year})`,
        endpoint: `${BASE}/co${data.latest_year}a.txt`,
        fetched_at,
      };
    } catch (e) {
      // Refresh failed. Serve a stale cache if present (labeled), else omit — never
      // a fabricated supply number.
      if (cached) {
        return {
          ok: true,
          data: {
            ...cached.data,
            scope_note: `STALE (${cached.data.latest_year}; live refresh failed) — ${cached.data.scope_note}`,
          },
          provenance: 'fetch_failed',
          source: `Census Building Permits Survey (STALE ${cached.data.latest_year}, refresh failed)`,
          fetched_at,
          error: `Live BPS refresh failed and cache is stale: ${errMsg(e)}`,
        };
      }
      return {
        ok: true,
        data: null,
        provenance: 'fetch_failed',
        source: 'Census Building Permits Survey [live call failed]',
        fetched_at,
        error: `Live BPS call failed: ${errMsg(e)}`,
      };
    }
  },
};
