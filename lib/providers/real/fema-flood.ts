// FEMA National Flood Hazard Layer — point-in-polygon query against the public
// NFHL ArcGIS service (layer 28: S_FLD_HAZ_AR). provenance: "live".

import type { FloodInfo, FloodProvider, ProviderResult, ResolvedAddress } from '../types';
import { errMsg, fetchJson } from './http';

const NFHL_URL = 'https://hazards.fema.gov/arcgis/rest/services/public/NFHL/MapServer/28/query';

interface NfhlResponse {
  features?: Array<{
    attributes?: {
      FLD_ZONE?: string;
      ZONE_SUBTY?: string;
      STATIC_BFE?: number;
    };
  }>;
  error?: { message?: string };
}

const SFHA_ZONES = new Set(['A', 'AE', 'AH', 'AO', 'AR', 'A99', 'V', 'VE']);

const REPRESENTATIVE_FALLBACK: FloodInfo = {
  flood_zone: 'X (REPRESENTATIVE — live FEMA NFHL call failed)',
  zone_subtype: 'AREA OF MINIMAL FLOOD HAZARD',
  in_special_flood_hazard_area: false,
  static_bfe_ft: null,
};

export const femaFlood: FloodProvider = {
  name: 'FEMA National Flood Hazard Layer',

  async getFloodZone(addr: ResolvedAddress): Promise<ProviderResult<FloodInfo>> {
    const fetched_at = new Date().toISOString();
    const url =
      `${NFHL_URL}?geometry=${addr.longitude},${addr.latitude}` +
      `&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects` +
      `&outFields=FLD_ZONE,ZONE_SUBTY,STATIC_BFE&returnGeometry=false&f=json`;

    try {
      const res = await fetchJson<NfhlResponse>(url, { timeoutMs: 30000 });
      if (res.error) throw new Error(res.error.message ?? 'NFHL service error');
      if (!Array.isArray(res.features)) throw new Error('Unexpected NFHL response shape');

      const attrs = res.features[0]?.attributes;
      const zone = attrs?.FLD_ZONE ?? null;

      const data: FloodInfo = {
        flood_zone: zone ?? 'X (no mapped hazard polygon at point)',
        zone_subtype: attrs?.ZONE_SUBTY ?? null,
        in_special_flood_hazard_area: zone !== null && SFHA_ZONES.has(zone),
        static_bfe_ft:
          typeof attrs?.STATIC_BFE === 'number' && attrs.STATIC_BFE > -9000 ? attrs.STATIC_BFE : null,
      };

      return {
        ok: true,
        data,
        provenance: 'live',
        source: 'FEMA National Flood Hazard Layer (S_FLD_HAZ_AR)',
        endpoint: url,
        fetched_at,
      };
    } catch (e) {
      return {
        ok: true,
        data: REPRESENTATIVE_FALLBACK,
        provenance: 'representative',
        source: 'FEMA National Flood Hazard Layer [FALLBACK]',
        endpoint: url,
        fetched_at,
        error: `Live call failed: ${errMsg(e)}`,
      };
    }
  },
};
