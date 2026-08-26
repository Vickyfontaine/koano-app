// CFPB HMDA — mortgage demand for the county: originations, denials, denial
// rate, and year-over-year origination momentum. Live, keyless aggregations API
// (ffiec.cfpb.gov). National, public domain. provenance: "live".
//
// County grain in Phase 1 (fast keyless call). Tract-level (via the raw
// modified-LAR CSV) is a planned fast-follow ingestion — see the Phase 1 plan.

import type {
  MortgageDemandInfo,
  MortgageDemandProvider,
  ProviderResult,
  ResolvedAddress,
} from '../types';
import { errMsg, fetchJson } from './http';

const HMDA = 'https://ffiec.cfpb.gov/v2/data-browser-api/view/aggregations';
// Latest HMDA year with a full, stable public release. Bump annually (the prior
// year is used for the YoY momentum signal). Vintage is labeled on the output.
const HMDA_YEAR = 2024;

interface Aggregation {
  count?: number;
  actions_taken?: string;
}
interface HmdaResponse {
  aggregations?: Aggregation[];
}

async function originationsAndDenials(fips: string, year: number): Promise<{ orig: number; denied: number }> {
  const res = await fetchJson<HmdaResponse>(
    `${HMDA}?counties=${fips}&years=${year}&actions_taken=1,3`,
    { timeoutMs: 25000 },
  );
  const aggs = Array.isArray(res.aggregations) ? res.aggregations : [];
  const pick = (action: string) => aggs.find((a) => a.actions_taken === action)?.count ?? 0;
  return { orig: pick('1'), denied: pick('3') };
}

export const cfpbHmda: MortgageDemandProvider = {
  name: 'CFPB HMDA mortgage demand',

  async getMortgageDemand(addr: ResolvedAddress): Promise<ProviderResult<MortgageDemandInfo>> {
    const fetched_at = new Date().toISOString();

    if (!addr.state_fips || !addr.county_fips) {
      return {
        ok: true,
        data: null,
        provenance: 'live',
        source: 'CFPB HMDA (county), not queried',
        fetched_at,
        error: 'No county FIPS resolved',
      };
    }

    const fips = `${addr.state_fips}${addr.county_fips}`;
    try {
      const [cur, prior] = await Promise.all([
        originationsAndDenials(fips, HMDA_YEAR),
        // prior year for the YoY momentum signal (best-effort; failure → null yoy)
        originationsAndDenials(fips, HMDA_YEAR - 1).catch(() => null),
      ]);

      const decisioned = cur.orig + cur.denied;
      const denial_rate_pct = decisioned > 0 ? Math.round((cur.denied / decisioned) * 1000) / 10 : null;
      const originations_yoy_pct =
        prior && prior.orig > 0 ? Math.round(((cur.orig - prior.orig) / prior.orig) * 1000) / 10 : null;

      const data: MortgageDemandInfo = {
        year: HMDA_YEAR,
        originations: cur.orig,
        denials: cur.denied,
        denial_rate_pct,
        originations_yoy_pct,
        scope_note:
          `CFPB HMDA ${HMDA_YEAR} for the county (all lenders). Originations = loans made; denial rate = ` +
          `denials / (originations + denials). YoY compares ${HMDA_YEAR} vs ${HMDA_YEAR - 1} originations. ` +
          'County grain; tract-level is a planned refinement.',
      };

      return {
        ok: true,
        data,
        provenance: 'live',
        source: `CFPB HMDA Data Browser (${HMDA_YEAR}, county aggregations)`,
        endpoint: `${HMDA}?counties=${fips}&years=${HMDA_YEAR}&actions_taken=1,3`,
        fetched_at,
      };
    } catch (e) {
      return {
        ok: true,
        data: null,
        provenance: 'fetch_failed',
        source: 'CFPB HMDA [FALLBACK]',
        fetched_at,
        error: `Live call failed: ${errMsg(e)}`,
      };
    }
  },
};
