// Crime statistics. Primary: FBI Crime Data Explorer API (requires api.data.gov
// key — FBI_CRIME_API_KEY, DEMO_KEY attempted otherwise). Secondary LIVE
// fallback: NYPD complaint data within 1 mile of the property via NYC Open Data
// (still genuinely live, clearly attributed). Final fallback: representative.

import type { CrimeProvider, CrimeStats, ProviderResult, ResolvedAddress } from '../types';
import { errMsg, fetchJson } from './http';

const NYPD_CURRENT = 'https://data.cityofnewyork.us/resource/5uac-w243.json'; // complaints, current year to date
const NYPD_HISTORIC = 'https://data.cityofnewyork.us/resource/qgea-i56i.json'; // complaints, historic

interface NypdGroupRow {
  law_cat_cd?: string;
  count?: string;
}

const REPRESENTATIVE_FALLBACK: CrimeStats = {
  jurisdiction: 'Brooklyn, NY (REPRESENTATIVE — all live crime sources failed)',
  period: 'last 12 months',
  violent_incidents: 210,
  property_incidents: 540,
  total_incidents: 980,
  rate_note: 'Typical 1-mile-radius complaint volume for a mixed-use Brooklyn neighborhood.',
  trend: 'flat',
};

async function nypdCountsWithinMile(
  dataset: string,
  lat: number,
  lon: number,
  extraWhere?: string
): Promise<Record<string, number>> {
  const where = `within_circle(lat_lon, ${lat}, ${lon}, 1609)` + (extraWhere ? ` AND ${extraWhere}` : '');
  const url =
    `${dataset}?$select=law_cat_cd,count(*)%20as%20count` +
    `&$where=${encodeURIComponent(where)}&$group=law_cat_cd`;
  const rows = await fetchJson<NypdGroupRow[]>(url, { timeoutMs: 45000 });
  const out: Record<string, number> = {};
  for (const r of rows) out[(r.law_cat_cd ?? 'UNKNOWN').toUpperCase()] = Number(r.count ?? 0);
  return out;
}

export const fbiUcr: CrimeProvider = {
  name: 'FBI UCR / NYPD complaint data',

  async getCrimeStats(addr: ResolvedAddress): Promise<ProviderResult<CrimeStats>> {
    const fetched_at = new Date().toISOString();

    // --- Attempt 1: FBI Crime Data Explorer (state-level UCR estimates) ---
    const fbiKey = process.env.FBI_CRIME_API_KEY ?? 'DEMO_KEY';
    const fbiUrl =
      `https://api.usa.gov/crime/fbi/cde/estimate/state/NY/violent-crime` +
      `?from=2021&to=2023&API_KEY=${fbiKey}`;
    try {
      const res = await fetchJson<Record<string, unknown>>(fbiUrl, { retries: 0, timeoutMs: 15000 });
      const results = (res as { results?: Array<Record<string, unknown>> }).results;
      if (Array.isArray(results) && results.length > 0) {
        const latest = results[results.length - 1];
        const prev = results[0];
        const latestCount = Number(latest.violent_crime ?? latest.count ?? NaN);
        const prevCount = Number(prev.violent_crime ?? prev.count ?? NaN);
        if (Number.isFinite(latestCount)) {
          return {
            ok: true,
            data: {
              jurisdiction: 'New York State (FBI UCR estimate)',
              period: String(latest.year ?? latest.data_year ?? '2023'),
              violent_incidents: latestCount,
              property_incidents: null,
              total_incidents: null,
              rate_note: 'State-level UCR violent crime estimate.',
              trend: Number.isFinite(prevCount)
                ? latestCount > prevCount * 1.03
                  ? 'rising'
                  : latestCount < prevCount * 0.97
                    ? 'falling'
                    : 'flat'
                : 'unknown',
            },
            provenance: 'live',
            source: 'FBI Crime Data Explorer (UCR)',
            endpoint: fbiUrl.replace(fbiKey, '***'),
            fetched_at,
          };
        }
      }
      throw new Error('FBI CDE returned no usable results');
    } catch {
      // fall through to NYPD live data
    }

    // --- Attempt 2 (still LIVE): NYPD complaints within 1 mile ---
    const nypdEndpoint = `${NYPD_CURRENT} (+ ${NYPD_HISTORIC} for prior-year trend)`;
    try {
      const current = await nypdCountsWithinMile(NYPD_CURRENT, addr.latitude, addr.longitude);
      const violent = current['FELONY'] ?? 0;
      const misd = current['MISDEMEANOR'] ?? 0;
      const viol = current['VIOLATION'] ?? 0;
      const total = violent + misd + viol;
      if (total === 0) throw new Error('NYPD query returned zero rows — treating as failure');

      // Prior-year same-scope count for a trend signal (best-effort)
      let trend: CrimeStats['trend'] = 'unknown';
      try {
        const prior = await nypdCountsWithinMile(
          NYPD_HISTORIC,
          addr.latitude,
          addr.longitude,
          `cmplnt_fr_dt > '2023-01-01T00:00:00.000' AND cmplnt_fr_dt < '2024-01-01T00:00:00.000'`
        );
        const priorTotal = Object.values(prior).reduce((a, b) => a + b, 0);
        if (priorTotal > 0) {
          const annualized = total; // YTD vs full prior year — direction only
          trend = annualized > priorTotal ? 'rising' : annualized < priorTotal * 0.5 ? 'falling' : 'flat';
        }
      } catch {
        trend = 'unknown';
      }

      return {
        ok: true,
        data: {
          jurisdiction: `1-mile radius of ${addr.normalized}`,
          period: 'current year to date',
          violent_incidents: violent,
          property_incidents: misd,
          total_incidents: total,
          rate_note:
            'NYPD complaint counts by law category (FELONY/MISDEMEANOR/VIOLATION) within 1609m of the property. FBI CDE unavailable without API key; this is a live local substitute.',
          trend,
        },
        provenance: 'live',
        source: 'NYPD Complaint Data via NYC Open Data (5uac-w243)',
        endpoint: nypdEndpoint,
        fetched_at,
      };
    } catch (e) {
      return {
        ok: true,
        data: REPRESENTATIVE_FALLBACK,
        provenance: 'representative',
        source: 'FBI UCR / NYPD [FALLBACK]',
        endpoint: nypdEndpoint,
        fetched_at,
        error: `All live crime sources failed: ${errMsg(e)}`,
      };
    }
  },
};
