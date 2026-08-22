// FEMA National Flood Hazard Layer — point-in-polygon query against the public
// NFHL ArcGIS service (layer 28: S_FLD_HAZ_AR). provenance: "live".

import type {
  FloodGeometry,
  FloodInfo,
  FloodProvider,
  FloodZoneFeature,
  FloodZonesInfo,
  ProviderResult,
  ResolvedAddress,
} from '../types';
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

interface NfhlGeoResponse {
  features?: Array<{
    properties?: { FLD_ZONE?: string; ZONE_SUBTY?: string | null };
    geometry?: FloodGeometry | null;
  }>;
  error?: { message?: string };
}

const SFHA_ZONES = new Set(['A', 'AE', 'AH', 'AO', 'AR', 'A99', 'V', 'VE']);

// Half-width of the map query box, in degrees (~1 mi at NYC latitude).
const ZONE_BOX_DEG = 0.013;

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
      // retries: an all-live memo must not degrade to a representative flood
      // figure on a transient NFHL blip (matches the entitlement/assemblage
      // providers). fetchJson backs off between attempts.
      const res = await fetchJson<NfhlResponse>(url, { timeoutMs: 30000, retries: 3 });
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

  // Flood-hazard polygons in a ~1-mile box around the point, for map rendering.
  // Only actual flood-hazard zones are returned (SFHA + 0.2%-annual-chance);
  // "area of minimal flood hazard" is the null case and is dropped, so the map
  // draws risk boundaries, not a fill over the whole view.
  async getFloodZones(addr: ResolvedAddress): Promise<ProviderResult<FloodZonesInfo>> {
    const fetched_at = new Date().toISOString();
    const envelope = {
      xmin: addr.longitude - ZONE_BOX_DEG,
      ymin: addr.latitude - ZONE_BOX_DEG,
      xmax: addr.longitude + ZONE_BOX_DEG,
      ymax: addr.latitude + ZONE_BOX_DEG,
      spatialReference: { wkid: 4326 },
    };
    const url =
      `${NFHL_URL}?geometry=${encodeURIComponent(JSON.stringify(envelope))}` +
      `&geometryType=esriGeometryEnvelope&inSR=4326&spatialRel=esriSpatialRelIntersects` +
      `&outFields=FLD_ZONE,ZONE_SUBTY&returnGeometry=true&maxAllowableOffset=0.00003` +
      `&outSR=4326&resultRecordCount=80&f=geojson`;

    try {
      const res = await fetchJson<NfhlGeoResponse>(url, { timeoutMs: 30000, retries: 2 });
      if (res.error) throw new Error(res.error.message ?? 'NFHL geometry service error');
      const feats = Array.isArray(res.features) ? res.features : [];

      const zones: FloodZoneFeature[] = [];
      for (const f of feats) {
        const zone = f.properties?.FLD_ZONE ?? null;
        const subtype = f.properties?.ZONE_SUBTY ?? null;
        const geom = f.geometry;
        if (!zone || !geom) continue;
        if (geom.type !== 'Polygon' && geom.type !== 'MultiPolygon') continue;
        const sfha = SFHA_ZONES.has(zone);
        const shaded = (subtype ?? '').toUpperCase().includes('0.2 PCT');
        // Drop minimal-hazard, open water, undetermined (D) — not flood risk.
        if (!sfha && !shaded) continue;
        zones.push({ zone, subtype, sfha, geometry: geom });
      }

      return {
        ok: true,
        data: {
          zones,
          scope_note:
            'FEMA NFHL flood-hazard polygons within ~1 mi of the point — Special Flood Hazard Areas ' +
            '(1%-annual-chance) and 0.2%-annual-chance shaded zones. Areas of minimal flood hazard are omitted.',
        },
        provenance: 'live',
        source: 'FEMA National Flood Hazard Layer (S_FLD_HAZ_AR)',
        endpoint: url,
        fetched_at,
      };
    } catch (e) {
      // A failed geometry fetch must not read as "no flood zones here": return
      // an empty, representative-labeled result the map surfaces as unavailable.
      return {
        ok: true,
        data: {
          zones: [],
          scope_note: 'REPRESENTATIVE — FEMA NFHL geometry call failed; flood-zone boundaries unavailable.',
        },
        provenance: 'representative',
        source: 'FEMA National Flood Hazard Layer [FALLBACK]',
        endpoint: url,
        fetched_at,
        error: `Live call failed: ${errMsg(e)}`,
      };
    }
  },
};
