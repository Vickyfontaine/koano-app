// Mortgage rate — Freddie Mac Primary Mortgage Market Survey (PMMS), the
// national 30-yr and 15-yr weekly average fixed rate. National, weekly.
// provenance: "live".
//
// LICENSE: pulled DIRECTLY from Freddie Mac's published PMMS CSV, which permits
// reuse with attribution and no alteration. We deliberately do NOT source this
// from FRED (MORTGAGE30US) — FRED classifies the Freddie PMMS series as
// "Copyrighted: Citation Required", which does not cover commercial
// redistribution to paying users. Direct-from-Freddie sidesteps that entirely.
// Cite "Freddie Mac PMMS".

import type { MortgageRateInfo, MortgageRateProvider, ProviderResult, ResolvedAddress } from '../types';
import { errMsg, fetchText } from './http';

const PMMS_CSV = 'https://www.freddiemac.com/pmms/docs/PMMS_history.csv';

export const freddiePmms: MortgageRateProvider = {
  name: 'Freddie Mac PMMS mortgage rate',

  // Address-agnostic: PMMS is a single national series.
  async getMortgageRate(_addr: ResolvedAddress): Promise<ProviderResult<MortgageRateInfo>> {
    const fetched_at = new Date().toISOString();
    try {
      const csv = await fetchText(PMMS_CSV, { timeoutMs: 20000, retries: 1 });
      const lines = csv.split('\n').filter((l) => l.trim());
      const header = lines[0].split(',').map((h) => h.trim());
      const iDate = header.indexOf('date');
      const i30 = header.indexOf('pmms30');
      const i15 = header.indexOf('pmms15');

      // Walk from the newest row backward to the last one with a 30-yr value.
      for (let i = lines.length - 1; i >= 1; i--) {
        const f = lines[i].split(',');
        const r30 = Number(f[i30]);
        if (Number.isFinite(r30) && f[i30]?.trim()) {
          const r15 = Number(f[i15]);
          const data: MortgageRateInfo = {
            week: (f[iDate] ?? '').trim(),
            rate_30yr_pct: r30,
            rate_15yr_pct: Number.isFinite(r15) && f[i15]?.trim() ? r15 : null,
            scope_note: 'National 30-yr / 15-yr fixed weekly average — Freddie Mac PMMS (published direct, attribution required).',
          };
          return {
            ok: true,
            data,
            provenance: 'live',
            source: 'Freddie Mac Primary Mortgage Market Survey (PMMS)',
            endpoint: PMMS_CSV,
            fetched_at,
          };
        }
      }
      throw new Error('No usable PMMS row found');
    } catch (e) {
      return {
        ok: true,
        data: null,
        provenance: 'fetch_failed',
        source: 'Freddie Mac PMMS [FALLBACK]',
        endpoint: PMMS_CSV,
        fetched_at,
        error: `Live call failed: ${errMsg(e)}`,
      };
    }
  },
};
