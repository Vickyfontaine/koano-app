// NYC landmark status (Phase 0) — MapPLUTO (64uk-42ks) `landmark` and
// `histdist`, the Landmarks Preservation Commission designations DCP carries on
// every tax lot: an individual (or interior) landmark, and the historic district
// the lot sits in, if any. Either one means exterior changes and new
// construction need LPC approval, so the construction guard (direction.ts) does
// not count as-of-right FAR as upside a buyer could capture.
//
// Omission over fabrication: a non-NYC address is coverage_absent; a failed
// live call returns data:null tagged fetch_failed. A lot PLUTO does not list
// returns live with both fields null (not designated).

import type { LandmarkProvider, LandmarkStatus, ProviderResult, ResolvedAddress } from '../types';
import { errMsg, fetchJson } from './http';
import { outOfMarketMunicipal } from './coverage';

const PLUTO = 'https://data.cityofnewyork.us/resource/64uk-42ks.json';
const LABEL = 'NYC Open Data, MapPLUTO (64uk-42ks): LPC landmark and historic district fields';

export const nycLandmarks: LandmarkProvider = {
  name: 'NYC landmark status (MapPLUTO LPC fields)',

  async getLandmarkStatus(addr: ResolvedAddress): Promise<ProviderResult<LandmarkStatus>> {
    const fetched_at = new Date().toISOString();
    if (!addr.bbl) return outOfMarketMunicipal<LandmarkStatus>({ layer: 'landmark status', dataset: LABEL, fetched_at });
    const url = `${PLUTO}?$select=landmark,histdist&$where=${encodeURIComponent(`bbl=${Number(addr.bbl)}`)}&$limit=1`;
    try {
      const rows = await fetchJson<{ landmark?: string; histdist?: string }[]>(url);
      const r = rows[0] ?? {};
      const individual = r.landmark?.trim() || null;
      const district = r.histdist?.trim() || null;
      return {
        ok: true,
        data: { individual_landmark: individual, historic_district: district, designated: !!(individual || district) },
        provenance: 'live',
        source: LABEL,
        endpoint: url,
        fetched_at,
      };
    } catch (e) {
      return { ok: true, data: null, provenance: 'fetch_failed', source: `${LABEL} [live call failed]`, endpoint: url, fetched_at, error: `Live call failed: ${errMsg(e)}` };
    }
  },
};
