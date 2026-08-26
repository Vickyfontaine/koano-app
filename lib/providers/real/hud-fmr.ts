// HUD Fair Market Rents — rent benchmark by bedroom for the county/metro.
// National, public domain. Requires a free HUD_USER_TOKEN (bearer).
//
// Provenance discipline (same as NOAA): no token → data:null tagged `live`
// (coverage absence, NOT representative), so a missing free token never drags a
// verdict; a runtime failure WITH the token → labeled representative.
//
// NOTE: the live (token-present) path is built against the documented HUD USER
// FMR API and verified once HUD_USER_TOKEN is configured; the token-absent
// degradation is covered by the provider test.

import type { FairMarketRentInfo, FairMarketRentProvider, ProviderResult, ResolvedAddress } from '../types';
import { errMsg, fetchJson } from './http';

const HUD_FMR = 'https://www.huduser.gov/hudapi/public/fmr/data';

// HUD's API terms REQUIRE this notice displayed prominently wherever HUD data
// appears. Carried in scope_note (same handling as OpenFEMA's non-endorsement
// disclaimer) so it flows into the agent's data points and any document/panel
// that surfaces this figure.
const HUD_DISCLAIMER =
  'This product uses the HUD User Data API but is not endorsed or certified by HUD User.';

// HUD returns basicdata as an object (non-SAFMR area) or an array of ZIP rows
// (SAFMR area). Fields are the human bedroom labels.
interface FmrRow {
  Efficiency?: number | string;
  'One-Bedroom'?: number | string;
  'Two-Bedroom'?: number | string;
  'Three-Bedroom'?: number | string;
  'Four-Bedroom'?: number | string;
  year?: string | number; // HUD nests the fiscal year INSIDE basicdata, not on data
}
interface HudFmrResponse {
  data?: {
    area_name?: string;
    county_name?: string;
    year?: string | number;
    basicdata?: FmrRow | FmrRow[];
  };
}

function num(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

const REPRESENTATIVE_FALLBACK: FairMarketRentInfo = {
  area_name: 'REPRESENTATIVE',
  fiscal_year: 'unknown',
  fmr_studio: 1900,
  fmr_1br: 2100,
  fmr_2br: 2500,
  fmr_3br: 3200,
  fmr_4br: 3500,
  scope_note: `REPRESENTATIVE — HUD USER FMR was unreachable; a labeled metro stand-in. ${HUD_DISCLAIMER}`,
};

export const hudFmr: FairMarketRentProvider = {
  name: 'HUD Fair Market Rents',

  async getFairMarketRent(addr: ResolvedAddress): Promise<ProviderResult<FairMarketRentInfo>> {
    const fetched_at = new Date().toISOString();
    const token = process.env.HUD_USER_TOKEN;

    if (!token) {
      return {
        ok: false,
        data: null,
        provenance: 'live', // coverage absence, never representative
        source: 'HUD Fair Market Rents',
        fetched_at,
        error: 'HUD_USER_TOKEN not configured — Fair Market Rents omitted (set the free token to enable)',
      };
    }
    if (!addr.state_fips || !addr.county_fips) {
      return {
        ok: false,
        data: null,
        provenance: 'live',
        source: 'HUD Fair Market Rents',
        fetched_at,
        error: 'No county FIPS resolved — Fair Market Rents omitted',
      };
    }

    // County entity id = 5-digit county FIPS + 99999.
    const entity = `${addr.state_fips}${addr.county_fips}99999`;
    try {
      const res = await fetchJson<HudFmrResponse>(`${HUD_FMR}/${entity}`, {
        headers: { Authorization: `Bearer ${token}` },
        timeoutMs: 20000,
      });
      const d = res.data;
      const basic = Array.isArray(d?.basicdata) ? d?.basicdata[0] : d?.basicdata;
      if (!d || !basic) throw new Error('HUD FMR returned no basicdata');

      // HUD nests the fiscal year inside basicdata (data.year is absent); fall
      // back to data.year for safety.
      const fy = basic.year ?? d.year ?? null;
      const data: FairMarketRentInfo = {
        area_name: d.area_name ?? d.county_name ?? null,
        fiscal_year: fy != null ? String(fy) : 'unknown',
        fmr_studio: num(basic.Efficiency),
        fmr_1br: num(basic['One-Bedroom']),
        fmr_2br: num(basic['Two-Bedroom']),
        fmr_3br: num(basic['Three-Bedroom']),
        fmr_4br: num(basic['Four-Bedroom']),
        scope_note: `HUD Fair Market Rents FY${fy ?? '—'} for the county/metro (public domain). ${HUD_DISCLAIMER}`,
      };

      return {
        ok: true,
        data,
        provenance: 'live',
        source: 'HUD USER — Fair Market Rents',
        endpoint: `${HUD_FMR}/${entity}`,
        fetched_at,
      };
    } catch (e) {
      return {
        ok: true,
        data: REPRESENTATIVE_FALLBACK,
        provenance: 'fetch_failed',
        source: 'HUD Fair Market Rents [FALLBACK]',
        fetched_at,
        error: `Live call failed: ${errMsg(e)}`,
      };
    }
  },
};
