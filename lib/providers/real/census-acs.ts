// US Census ACS 5-year demographics at tract level.
// Primary: api.census.gov (requires free CENSUS_API_KEY as of 2025).
// Keyless live path: Census Reporter API (censusreporter.org), which serves the
// same official ACS releases. Both are provenance "live".

import type { AcsDemographics, DemographicsProvider, ProviderResult, ResolvedAddress } from '../types';
import { errMsg, fetchJson } from './http';

const CENSUS_VINTAGE = '2023';

function num(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

const REPRESENTATIVE_FALLBACK: AcsDemographics = {
  tract_geoid: 'unknown',
  tract_name: 'REPRESENTATIVE — live Census ACS calls failed (typical Brownstone-Brooklyn tract)',
  population: 3800,
  median_household_income: 128000,
  median_gross_rent: 2900,
  median_home_value: 1250000,
  bachelors_or_higher_pct: 68,
  vintage: 'ACS 5-year [REPRESENTATIVE]',
};

// --- Census Reporter (keyless) ---

interface CensusReporterResponse {
  data?: Record<
    string,
    {
      B01003?: { estimate?: Record<string, number> };
      B19013?: { estimate?: Record<string, number> };
      B25064?: { estimate?: Record<string, number> };
      B25077?: { estimate?: Record<string, number> };
      B15003?: { estimate?: Record<string, number> };
    }
  >;
  geography?: Record<string, { name?: string }>;
  release?: { name?: string };
}

async function fromCensusReporter(geoid: string): Promise<{ data: AcsDemographics; endpoint: string; release: string }> {
  const geoKey = `14000US${geoid}`;
  const endpoint =
    `https://api.censusreporter.org/1.0/data/show/latest` +
    `?table_ids=B01003,B19013,B25064,B25077,B15003&geo_ids=${geoKey}`;
  const res = await fetchJson<CensusReporterResponse>(endpoint);
  const d = res.data?.[geoKey];
  if (!d) throw new Error('Census Reporter returned no data for tract');

  const edu = d.B15003?.estimate ?? {};
  const eduDenom = num(edu['B15003001']);
  const eduSum =
    (num(edu['B15003022']) ?? 0) + // bachelor's
    (num(edu['B15003023']) ?? 0) + // master's
    (num(edu['B15003024']) ?? 0) + // professional
    (num(edu['B15003025']) ?? 0); // doctorate
  const release = res.release?.name ?? 'ACS 5-year (latest)';

  return {
    endpoint,
    release,
    data: {
      tract_geoid: geoid,
      tract_name: res.geography?.[geoKey]?.name ?? null,
      population: num(d.B01003?.estimate?.['B01003001']),
      median_household_income: num(d.B19013?.estimate?.['B19013001']),
      median_gross_rent: num(d.B25064?.estimate?.['B25064001']),
      median_home_value: num(d.B25077?.estimate?.['B25077001']),
      bachelors_or_higher_pct: eduDenom && eduDenom > 0 ? Math.round((eduSum / eduDenom) * 100) : null,
      vintage: release,
    },
  };
}

// --- api.census.gov (key required) ---

const VARS = [
  'NAME',
  'B01003_001E',
  'B19013_001E',
  'B25064_001E',
  'B25077_001E',
  'B15003_001E',
  'B15003_022E',
  'B15003_023E',
  'B15003_024E',
  'B15003_025E',
];

async function fromCensusGov(addr: ResolvedAddress, key: string): Promise<{ data: AcsDemographics; endpoint: string }> {
  const url =
    `https://api.census.gov/data/${CENSUS_VINTAGE}/acs/acs5?get=${VARS.join(',')}` +
    `&for=tract:${addr.tract_code}&in=state:${addr.state_fips}%20county:${addr.county_fips}&key=${key}`;
  const rows = await fetchJson<string[][]>(url);
  const header = rows[0];
  const row = rows[1];
  if (!header || !row) throw new Error('Empty ACS response');
  const get = (v: string) => row[header.indexOf(v)];
  const eduDenom = num(get('B15003_001E'));
  const eduSum =
    (num(get('B15003_022E')) ?? 0) +
    (num(get('B15003_023E')) ?? 0) +
    (num(get('B15003_024E')) ?? 0) +
    (num(get('B15003_025E')) ?? 0);
  return {
    endpoint: url.replace(key, '***'),
    data: {
      tract_geoid: addr.tract_geoid ?? `${addr.state_fips}${addr.county_fips}${addr.tract_code}`,
      tract_name: get('NAME') ?? null,
      population: num(get('B01003_001E')),
      median_household_income: num(get('B19013_001E')),
      median_gross_rent: num(get('B25064_001E')),
      median_home_value: num(get('B25077_001E')),
      bachelors_or_higher_pct: eduDenom && eduDenom > 0 ? Math.round((eduSum / eduDenom) * 100) : null,
      vintage: `ACS 5-year ${CENSUS_VINTAGE}`,
    },
  };
}

export const censusAcs: DemographicsProvider = {
  name: 'US Census ACS 5-year',

  async getDemographics(addr: ResolvedAddress): Promise<ProviderResult<AcsDemographics>> {
    const fetched_at = new Date().toISOString();
    if (!addr.tract_geoid) {
      return {
        ok: true,
        data: REPRESENTATIVE_FALLBACK,
        provenance: 'representative',
        source: 'US Census ACS 5-year [FALLBACK]',
        fetched_at,
        error: 'No census tract resolved for address',
      };
    }

    const key = process.env.CENSUS_API_KEY;
    try {
      if (key) {
        const { data, endpoint } = await fromCensusGov(addr, key);
        return {
          ok: true,
          data,
          provenance: 'live',
          source: `US Census Bureau — api.census.gov ACS 5-year ${CENSUS_VINTAGE}`,
          endpoint,
          fetched_at,
        };
      }
      const { data, endpoint, release } = await fromCensusReporter(addr.tract_geoid);
      return {
        ok: true,
        data,
        provenance: 'live',
        source: `US Census ACS via Census Reporter (${release})`,
        endpoint,
        fetched_at,
      };
    } catch (e) {
      return {
        ok: true,
        data: REPRESENTATIVE_FALLBACK,
        provenance: 'representative',
        source: 'US Census ACS 5-year [FALLBACK]',
        fetched_at,
        error: `Live call failed: ${errMsg(e)}`,
      };
    }
  },
};
