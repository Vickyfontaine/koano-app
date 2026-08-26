// BLS QCEW — county employment level, average weekly wage, and their year-over-
// year change. Keyless CSV "slice" (one file = all industries/ownerships for a
// county/quarter); we read the county-total row. National, public domain.
// provenance: "live". Cite "BLS — QCEW"; never use the BLS emblem.

import type { EmploymentInfo, EmploymentProvider, ProviderResult, ResolvedAddress } from '../types';
import { errMsg, fetchText } from './http';

const QCEW = 'https://data.bls.gov/cew/data/api';

// The most recent ~6 quarters, newest first. QCEW publishes ~2 quarters in
// arrears, so the first candidate(s) 404 until we hit the latest published one.
function recentQuarters(): Array<{ year: number; qtr: number }> {
  const now = new Date();
  let y = now.getUTCFullYear();
  let q = Math.floor(now.getUTCMonth() / 3) + 1;
  const out: Array<{ year: number; qtr: number }> = [];
  for (let i = 0; i < 6; i++) {
    out.push({ year: y, qtr: q });
    q -= 1;
    if (q < 1) { q = 4; y -= 1; }
  }
  return out;
}

function parseCountyTotal(csv: string): EmploymentInfo | null {
  const lines = csv.split('\n').filter((l) => l.trim());
  if (lines.length < 2) return null;
  const header = lines[0].split(',').map((h) => h.replace(/"/g, '').trim());
  const idx = (name: string) => header.indexOf(name);
  const iOwn = idx('own_code'), iInd = idx('industry_code'), iAgg = idx('agglvl_code');
  const iYear = idx('year'), iQtr = idx('qtr');
  const iEmp = idx('month3_emplvl'), iWage = idx('avg_wkly_wage'), iEstab = idx('qtrly_estabs');
  const iEmpChg = idx('oty_month3_emplvl_pct_chg'), iWageChg = idx('oty_avg_wkly_wage_pct_chg');
  if (iOwn < 0 || iInd < 0 || iAgg < 0) return null;

  for (const line of lines.slice(1)) {
    const f = line.split(',').map((v) => v.replace(/"/g, '').trim());
    // County total: all ownerships (0), all industries (10), county aggregation (70).
    if (f[iOwn] === '0' && f[iInd] === '10' && f[iAgg] === '70') {
      const num = (i: number) => (i >= 0 && Number.isFinite(Number(f[i])) ? Number(f[i]) : null);
      return {
        period: `${f[iYear]} Q${f[iQtr]}`,
        total_employment: num(iEmp),
        avg_weekly_wage_usd: num(iWage),
        employment_yoy_pct: num(iEmpChg),
        avg_weekly_wage_yoy_pct: num(iWageChg),
        establishments: num(iEstab),
        scope_note:
          'BLS QCEW county totals (all ownerships & industries): month-3 employment, average weekly wage, ' +
          'and their over-the-year % change (from the QCEW file). Quarterly, ~5-month lag.',
      };
    }
  }
  return null;
}

export const blsQcew: EmploymentProvider = {
  name: 'BLS QCEW county employment & wages',

  async getEmployment(addr: ResolvedAddress): Promise<ProviderResult<EmploymentInfo>> {
    const fetched_at = new Date().toISOString();

    if (!addr.state_fips || !addr.county_fips) {
      return {
        ok: true,
        data: null,
        provenance: 'live',
        source: 'BLS QCEW (county) — not queried',
        fetched_at,
        error: 'No county FIPS resolved',
      };
    }

    const fips = `${addr.state_fips}${addr.county_fips}`;
    let lastEndpoint = '';
    try {
      for (const { year, qtr } of recentQuarters()) {
        const url = `${QCEW}/${year}/${qtr}/area/${fips}.csv`;
        lastEndpoint = url;
        let csv: string;
        try {
          csv = await fetchText(url, { timeoutMs: 25000, retries: 1 });
        } catch {
          continue; // quarter not published yet → try the previous one
        }
        const info = parseCountyTotal(csv);
        if (info) {
          return {
            ok: true,
            data: info,
            provenance: 'live',
            source: `BLS QCEW (${info.period}, county totals)`,
            endpoint: url,
            fetched_at,
          };
        }
      }
      throw new Error('No published QCEW quarter with a county-total row in the last 6 quarters');
    } catch (e) {
      return {
        ok: true,
        data: null,
        provenance: 'fetch_failed',
        source: 'BLS QCEW [FALLBACK]',
        endpoint: lastEndpoint,
        fetched_at,
        error: `Live call failed: ${errMsg(e)}`,
      };
    }
  },
};
