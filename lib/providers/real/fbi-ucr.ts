// Crime statistics. Primary: FBI Crime Data Explorer API (requires api.data.gov
// key — FBI_CRIME_API_KEY, DEMO_KEY attempted otherwise). Secondary LIVE
// fallback: NYPD complaint data within 1 mile of the property via NYC Open Data
// (still genuinely live, clearly attributed). Final fallback: representative.

import type { CrimeProvider, CrimeStats, ProviderResult, ResolvedAddress } from '../types';
import { errMsg, fetchJson } from './http';
import { uspsFromFips } from './us-states';

const NYPD_CURRENT = 'https://data.cityofnewyork.us/resource/5uac-w243.json'; // complaints, current year to date
const NYPD_HISTORIC = 'https://data.cityofnewyork.us/resource/qgea-i56i.json'; // complaints, historic

interface NypdGroupRow {
  law_cat_cd?: string;
  count?: string;
}

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
    // Keyed to the ADDRESS's state (derived from state_fips) — never hardcoded, or
    // every address gets one state's crime. Needs FBI_CRIME_API_KEY (a free
    // api.data.gov key); DEMO_KEY is heavily rate-limited, so without the key this
    // usually falls through to the NYC-only NYPD source.
    const stateAbbr = uspsFromFips(addr.state_fips);
    const fbiKey = process.env.FBI_CRIME_API_KEY ?? 'DEMO_KEY';
    const fbiUrl = stateAbbr
      ? `https://api.usa.gov/crime/fbi/cde/estimate/state/${stateAbbr}/violent-crime?from=2021&to=2023&API_KEY=${fbiKey}`
      : null;
    try {
      if (!fbiUrl) throw new Error('no state resolved for FBI CDE');
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
              jurisdiction: `${stateAbbr} statewide (FBI UCR estimate)`,
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

    // --- Attempt 2 (still LIVE, NYC ONLY): NYPD complaints within 1 mile ---
    const nypdEndpoint = `${NYPD_CURRENT} (+ ${NYPD_HISTORIC} for prior-year trend)`;
    try {
      const current = await nypdCountsWithinMile(NYPD_CURRENT, addr.latitude, addr.longitude);
      const violent = current['FELONY'] ?? 0;
      const misd = current['MISDEMEANOR'] ?? 0;
      const viol = current['VIOLATION'] ?? 0;
      const total = violent + misd + viol;

      if (total > 0) {
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
      }

      // Zero rows = the address is OUTSIDE NYPD's geography (a non-NYC address).
      // That is a coverage gap, NOT a failure and NOT a transient problem — so OMIT
      // (data:null tagged live), never a fabricated NYC-flavored stand-in. The
      // omission rule: with no FBI key, FBI CDE is unavailable and NYPD covers NYC
      // only, so no free crime source applies here. A real FBI_CRIME_API_KEY lights
      // this up nationally (see CLAUDE.md §14).
      return {
        ok: true,
        data: null,
        provenance: 'live',
        source: 'FBI Crime Data Explorer / NYPD — no crime source for this location',
        endpoint: nypdEndpoint,
        fetched_at,
        error:
          'No live crime source for this address: FBI Crime Data Explorer needs FBI_CRIME_API_KEY (free), and NYPD complaint data covers NYC only.',
      };
    } catch (e) {
      // A genuine transient failure of the live NYPD call → fetch_failed, data:null.
      // Never a fabricated NYC-flavored stand-in.
      return {
        ok: true,
        data: null,
        provenance: 'fetch_failed',
        source: 'NYPD complaint data [live call failed]',
        endpoint: nypdEndpoint,
        fetched_at,
        error: `Live crime call failed: ${errMsg(e)}`,
      };
    }
  },
};
