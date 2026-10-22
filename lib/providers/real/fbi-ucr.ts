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
  ofns_desc?: string;
  count?: string;
}

// Offense classification (UI sprint WS1 / Phase 0 item 30-14, kill-list #18).
// NYPD's law_cat_cd (FELONY / MISDEMEANOR / VIOLATION) is a SEVERITY tier, not a
// violent/property split: a grand larceny is a felony and is not violent. Counts
// are therefore classified by offense description against the FBI UCR Part I
// definitions: violent = murder, rape, robbery, felony (aggravated) assault;
// property = burglary, larceny, motor-vehicle theft, arson (plus criminal
// mischief, the NYPD property-damage category).
const VIOLENT_OFFENSE = /MURDER|MANSLAUGHTER|RAPE|ROBBERY|FELONY ASSAULT/i;
const PROPERTY_OFFENSE = /BURGLARY|LARCENY|MOTOR VEHICLE|ARSON|CRIMINAL MISCHIEF/i;

interface NypdCounts {
  violent: number;
  property: number;
  total: number;
}

async function nypdCountsWithinMile(
  dataset: string,
  lat: number,
  lon: number,
  extraWhere?: string
): Promise<NypdCounts> {
  const where = `within_circle(lat_lon, ${lat}, ${lon}, 1609)` + (extraWhere ? ` AND ${extraWhere}` : '');
  const url =
    `${dataset}?$select=ofns_desc,count(*)%20as%20count` +
    `&$where=${encodeURIComponent(where)}&$group=ofns_desc&$limit=500`;
  const rows = await fetchJson<NypdGroupRow[]>(url, { timeoutMs: 45000 });
  const out: NypdCounts = { violent: 0, property: 0, total: 0 };
  for (const r of rows) {
    const n = Number(r.count ?? 0);
    const d = (r.ofns_desc ?? '').toUpperCase();
    out.total += n;
    if (VIOLENT_OFFENSE.test(d)) out.violent += n;
    else if (PROPERTY_OFFENSE.test(d)) out.property += n;
  }
  return out;
}

// The same year-to-date window one year earlier (Jan 1 → today's month/day of the
// prior year), so the trend compares like with like instead of a partial year
// against a hard-coded full one.
function priorYtdWindow(now: Date): { from: string; to: string; label: string } {
  const y = now.getUTCFullYear() - 1;
  const mm = String(now.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(now.getUTCDate()).padStart(2, '0');
  return { from: `${y}-01-01T00:00:00.000`, to: `${y}-${mm}-${dd}T23:59:59.000`, label: `Jan 1 to ${mm}/${dd}, ${y}` };
}

// FBI Crime Data Explorer — summarized state response (current shape, verified
// 2026): a per-month series keyed by "<State> Offenses" / "<State> Clearances".
interface FbiCdeResponse {
  offenses?: { actuals?: Record<string, Record<string, number>> };
}

// Latest COMPLETE calendar year of statewide violent-crime OFFENSES (+ YoY trend
// vs the prior complete year). Only 12-month years are used, so a partial latest
// year never reads as a crime drop.
function parseFbiViolent(res: FbiCdeResponse, stateAbbr: string): CrimeStats | null {
  const actuals = res.offenses?.actuals;
  if (!actuals) return null;
  const key = Object.keys(actuals).find((k) => /Offenses$/i.test(k) && !/United States/i.test(k));
  if (!key) return null;
  const byYear = new Map<string, { sum: number; n: number; min: number }>();
  for (const [mmYyyy, v] of Object.entries(actuals[key])) {
    const yr = mmYyyy.split('-')[1];
    if (!yr) continue;
    const val = Number(v) || 0;
    const e = byYear.get(yr) ?? { sum: 0, n: 0, min: Infinity };
    e.sum += val;
    e.n += 1;
    e.min = Math.min(e.min, val);
    byYear.set(yr, e);
  }
  // A COMPLETE year has all 12 months AND no zero month — the API zero-pads the
  // requested range, and a real statewide month is never 0, so this rejects a
  // partial current year masquerading (with trailing zeros) as complete.
  const complete = Array.from(byYear.entries())
    .filter(([, e]) => e.n >= 12 && e.min > 0)
    .sort(([a], [b]) => a.localeCompare(b));
  if (complete.length === 0) return null;
  const [latestYr, latest] = complete[complete.length - 1];
  const prior = complete.length >= 2 ? complete[complete.length - 2][1] : null;
  let trend: CrimeStats['trend'] = 'unknown';
  if (prior && prior.sum > 0) {
    trend = latest.sum > prior.sum * 1.03 ? 'rising' : latest.sum < prior.sum * 0.97 ? 'falling' : 'flat';
  }
  return {
    jurisdiction: `${stateAbbr} statewide (FBI UCR)`,
    period: latestYr,
    violent_incidents: Math.round(latest.sum),
    property_incidents: null,
    total_incidents: null,
    rate_note:
      'FBI Crime Data Explorer: statewide violent-crime offenses, latest complete year. Property-local data is not available for this market (NYPD covers NYC only).',
    trend,
  };
}

export const fbiUcr: CrimeProvider = {
  name: 'FBI UCR / NYPD complaint data',

  async getCrimeStats(addr: ResolvedAddress): Promise<ProviderResult<CrimeStats>> {
    const fetched_at = new Date().toISOString();

    // --- Attempt 1 (PREFERRED): NYPD complaints within 1 mile of the property ---
    // A property-local (1-mile) read beats a state-level estimate, so NYPD is tried
    // FIRST. It covers NYC ONLY: a non-NYC point returns zero rows and falls through
    // to the FBI national source below. (Order matters: with FBI first, a real FBI
    // key silently DOWNGRADED NYC crime from this local read to a whole-state
    // estimate — NYPD-first keeps NYC local and still gives non-NYC national FBI.)
    const nypdEndpoint = `${NYPD_CURRENT} (+ ${NYPD_HISTORIC} for prior-year trend)`;
    let nypdError: string | null = null;
    try {
      const now = new Date();
      const current = await nypdCountsWithinMile(NYPD_CURRENT, addr.latitude, addr.longitude);
      const total = current.total;

      if (total > 0) {
        // Trend: this year-to-date vs the SAME year-to-date window last year.
        let trend: CrimeStats['trend'] = 'unknown';
        const win = priorYtdWindow(now);
        let trendNote = 'Trend unavailable (prior-year window could not be read).';
        try {
          const prior = await nypdCountsWithinMile(
            NYPD_HISTORIC,
            addr.latitude,
            addr.longitude,
            `cmplnt_fr_dt >= '${win.from}' AND cmplnt_fr_dt <= '${win.to}'`
          );
          if (prior.total > 0) {
            trend = total > prior.total * 1.03 ? 'rising' : total < prior.total * 0.97 ? 'falling' : 'flat';
            trendNote = `Trend compares this year to date (${total} complaints) with the same window last year (${win.label}: ${prior.total}).`;
          }
        } catch {
          trend = 'unknown';
        }

        return {
          ok: true,
          data: {
            jurisdiction: `1-mile radius of ${addr.normalized}`,
            period: `${now.getUTCFullYear()} year to date`,
            violent_incidents: current.violent,
            property_incidents: current.property,
            total_incidents: total,
            rate_note:
              'NYPD complaints within 1,609 m of the property, classified by offense: violent = murder, rape, robbery and felony assault; property = burglary, larceny, motor-vehicle theft, criminal mischief and arson; total = all complaint categories. ' +
              trendNote,
            trend,
          },
          provenance: 'live',
          source: 'NYPD Complaint Data via NYC Open Data (5uac-w243)',
          endpoint: nypdEndpoint,
          fetched_at,
        };
      }
      // Zero rows = a non-NYC point (outside NYPD's geography) → fall through to FBI.
    } catch (e) {
      nypdError = errMsg(e); // transient NYPD failure — try FBI, else fetch_failed below
    }

    // --- Attempt 2: FBI Crime Data Explorer, keyed to the address's OWN state ---
    // National coverage (any US state), derived from state_fips — never hardcoded.
    // Needs FBI_CRIME_API_KEY (free api.data.gov key); DEMO_KEY is heavily rate-
    // limited. State-level is coarser than NYPD, so it is the FALLBACK — used where
    // NYPD does not apply (non-NYC) or as a backstop when the NYPD call failed.
    const stateAbbr = uspsFromFips(addr.state_fips);
    const fbiKey = process.env.FBI_CRIME_API_KEY ?? 'DEMO_KEY';
    if (stateAbbr) {
      // Current CDE path (2026): /summarized/state/{ST}/violent-crime with MM-YYYY
      // dates. The old /estimate/state/{ST}/... path was retired (404); the shape is
      // a monthly series, not results[]. A forward `to` clamps to available data.
      const nowY = new Date().getUTCFullYear();
      const fbiUrl =
        `https://api.usa.gov/crime/fbi/cde/summarized/state/${stateAbbr}/violent-crime` +
        `?from=01-${nowY - 4}&to=12-${nowY}&API_KEY=${fbiKey}`;
      try {
        const res = await fetchJson<FbiCdeResponse>(fbiUrl, { retries: 0, timeoutMs: 15000 });
        const data = parseFbiViolent(res, stateAbbr);
        if (data) {
          return {
            ok: true,
            data,
            provenance: 'live',
            source: 'FBI Crime Data Explorer (UCR: summarized state violent crime)',
            endpoint: fbiUrl.replace(fbiKey, '***'),
            fetched_at,
          };
        }
      } catch {
        // FBI failed too → fall to omission / fetch_failed below.
      }
    }

    // --- No usable source ---
    if (nypdError) {
      // The NYC source (NYPD) failed transiently and FBI didn't cover it → retryable.
      return {
        ok: true,
        data: null,
        provenance: 'fetch_failed',
        source: 'NYPD complaint data [live call failed]',
        endpoint: nypdEndpoint,
        fetched_at,
        error: `Live crime call failed (NYPD): ${nypdError}`,
      };
    }
    // Non-NYC with no usable FBI (no key / rate-limited / shape drift) → honest omission.
    return {
      ok: true,
      data: null,
      provenance: 'live',
      source: 'FBI Crime Data Explorer / NYPD: no crime source for this location',
      fetched_at,
      error:
        'No live crime source for this address: FBI Crime Data Explorer needs FBI_CRIME_API_KEY (free), and NYPD complaint data covers NYC only.',
    };
  },
};
