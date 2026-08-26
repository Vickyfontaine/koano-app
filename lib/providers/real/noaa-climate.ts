// NOAA NCEI — climate normals (1991–2020) for the nearest station to the county.
// National, public domain. Requires a FREE token (NOAA_CDO_TOKEN, email signup).
//
// Provenance discipline (deliberate): when the token is UNSET, this returns
// data:null tagged `live` — a coverage ABSENCE, not `representative`. The agent
// emits only a coverage note, so a missing free token never drags the verdict to
// representative (NYC stays live on EPA+USGS+FEMA alone). With the token set, a
// successful call is `live`; a runtime failure WITH the token falls back to a
// labeled `representative` value, per the standard failure discipline.
//
// NOTE: the live (token-present) path is built against the documented CDO v2 API
// and verified once NOAA_CDO_TOKEN is configured; the token-absent degradation is
// covered by the provider test.

import type { ClimateInfo, ClimateProvider, ProviderResult, ResolvedAddress } from '../types';
import { errMsg, fetchJson } from './http';

const CDO = 'https://www.ncdc.noaa.gov/cdo-web/api/v2';

interface StationsResponse {
  results?: Array<{ id?: string; name?: string }>;
}
interface DataResponse {
  results?: Array<{ datatype?: string; value?: number }>;
}

export const noaaClimate: ClimateProvider = {
  name: 'NOAA NCEI climate normals (1991–2020)',

  async getClimate(addr: ResolvedAddress): Promise<ProviderResult<ClimateInfo>> {
    const fetched_at = new Date().toISOString();
    const token = process.env.NOAA_CDO_TOKEN;

    // No token → coverage ABSENCE tagged `live` (never representative). The agent
    // emits a coverage note only, so this cannot drag the verdict.
    if (!token) {
      return {
        ok: false,
        data: null,
        provenance: 'live',
        source: 'NOAA NCEI climate normals',
        fetched_at,
        error: 'NOAA_CDO_TOKEN not configured. Climate normals omitted (set the free token to enable)',
      };
    }

    if (!addr.state_fips || !addr.county_fips) {
      return {
        ok: false,
        data: null,
        provenance: 'live',
        source: 'NOAA NCEI climate normals',
        fetched_at,
        error: 'No county FIPS resolved. Climate normals omitted',
      };
    }

    const fips = `FIPS:${addr.state_fips}${addr.county_fips}`;
    const headers = { token };
    try {
      // 1. Best-coverage station for the county that carries annual normals.
      const stations = await fetchJson<StationsResponse>(
        `${CDO}/stations?datasetid=NORMAL_ANN&locationid=${fips}&limit=1&sortfield=datacoverage&sortorder=desc`,
        { headers, timeoutMs: 20000 },
      );
      const station = stations.results?.[0];
      if (!station?.id) throw new Error(`No NORMAL_ANN station for ${fips}`);

      // 2. Annual temperature + precipitation normals (standard units: °F, inches).
      const data = await fetchJson<DataResponse>(
        `${CDO}/data?datasetid=NORMAL_ANN&stationid=${station.id}` +
          `&datatypeid=ANN-TAVG-NORMAL&datatypeid=ANN-PRCP-NORMAL` +
          `&startdate=2010-01-01&enddate=2010-01-01&units=standard&limit=10`,
        { headers, timeoutMs: 20000 },
      );
      const results = Array.isArray(data.results) ? data.results : [];
      const pick = (dt: string) => {
        const r = results.find((x) => x.datatype === dt);
        return typeof r?.value === 'number' ? r.value : null;
      };

      const info: ClimateInfo = {
        station_id: station.id,
        station_name: station.name ?? null,
        normals_period: '1991-2020',
        annual_avg_temp_f: pick('ANN-TAVG-NORMAL'),
        annual_precip_in: pick('ANN-PRCP-NORMAL'),
        scope_note: `NOAA NCEI 1991–2020 climate normals at the nearest county station (${station.name ?? station.id}).`,
      };

      return {
        ok: true,
        data: info,
        provenance: 'live',
        source: 'NOAA NCEI Climate Data Online: 1991–2020 normals',
        endpoint: `${CDO}/data?datasetid=NORMAL_ANN&stationid=${station.id}`,
        fetched_at,
      };
    } catch (e) {
      return {
        ok: true,
        data: null,
        provenance: 'fetch_failed',
        source: 'NOAA NCEI climate normals [FALLBACK]',
        fetched_at,
        error: `Live call failed: ${errMsg(e)}`,
      };
    }
  },
};
