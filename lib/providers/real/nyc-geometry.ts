// Map geometry for the Cluster 4 multi-site map — live GeoJSON polygons.
//   tract_polygon: US Census TIGERweb (Tracts_Blocks) by GEOID — shades an
//                  Opportunity Zone tract.
//   lot_polygon:   NYC DCP MapPLUTO FeatureServer by BBL — the subject tax lot
//                  footprint (the zoning overlay).
// Both degrade to null (never a fabricated shape): a non-NYC / null-BBL address
// has no NYC lot; a missing tract GEOID has no tract. provenance: 'live'.

import type { GeometryProvider, GeometryInfo, PolyGeom, ProviderResult, ResolvedAddress } from '../types';
import { errMsg, fetchJson } from './http';

const TIGERWEB =
  'https://tigerweb.geo.census.gov/arcgis/rest/services/TIGERweb/Tracts_Blocks/MapServer/0/query';
const MAPPLUTO =
  'https://services5.arcgis.com/GfwWNkhOj9bNBqoJ/arcgis/rest/services/MAPPLUTO/FeatureServer/0/query';

interface GeoJsonFC {
  features?: Array<{ geometry?: PolyGeom | null }>;
}

function firstPolygon(fc: GeoJsonFC): PolyGeom | null {
  const g = fc.features?.[0]?.geometry;
  if (g && (g.type === 'Polygon' || g.type === 'MultiPolygon') && Array.isArray(g.coordinates)) {
    return g;
  }
  return null;
}

async function tractPolygon(geoid: string): Promise<PolyGeom | null> {
  try {
    const url =
      `${TIGERWEB}?where=${encodeURIComponent(`GEOID='${geoid}'`)}` +
      `&outFields=GEOID&returnGeometry=true&outSR=4326&f=geojson`;
    return firstPolygon(await fetchJson<GeoJsonFC>(url, { timeoutMs: 20000 }));
  } catch {
    return null; // best-effort; the OZ shading simply won't render
  }
}

async function lotPolygon(bbl: string): Promise<PolyGeom | null> {
  try {
    const url =
      `${MAPPLUTO}?where=${encodeURIComponent(`BBL=${bbl}`)}` +
      `&outFields=BBL&returnGeometry=true&outSR=4326&f=geojson`;
    return firstPolygon(await fetchJson<GeoJsonFC>(url, { timeoutMs: 20000 }));
  } catch {
    return null;
  }
}

export const nycGeometry: GeometryProvider = {
  name: 'US Census TIGERweb (tract) + NYC DCP MapPLUTO (lot)',

  async getGeometry(addr: ResolvedAddress): Promise<ProviderResult<GeometryInfo>> {
    const fetched_at = new Date().toISOString();
    try {
      const [tract_polygon, lot_polygon] = await Promise.all([
        addr.tract_geoid ? tractPolygon(addr.tract_geoid) : Promise.resolve(null),
        addr.bbl ? lotPolygon(addr.bbl) : Promise.resolve(null),
      ]);
      const parts = [
        tract_polygon ? 'Census TIGERweb tract' : null,
        lot_polygon ? 'NYC DCP MapPLUTO lot' : null,
      ].filter(Boolean);
      return {
        ok: true,
        data: { tract_polygon, lot_polygon },
        provenance: 'live',
        source: parts.length ? parts.join(' + ') : 'US Census TIGERweb + NYC DCP MapPLUTO (no geometry for this address)',
        fetched_at,
      };
    } catch (e) {
      return {
        ok: false,
        data: null,
        provenance: 'live',
        source: 'US Census TIGERweb + NYC DCP MapPLUTO',
        fetched_at,
        error: errMsg(e),
      };
    }
  },
};
