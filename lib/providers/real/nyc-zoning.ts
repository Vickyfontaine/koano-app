// NYC PLUTO (MapPLUTO) zoning data — NYC Open Data SODA API (dataset 64uk-42ks).
// Live query by BBL. Falls back to a labeled representative response on failure.

import type { ProviderResult, ResolvedAddress, ZoningInfo, ZoningProvider } from '../types';
import { errMsg, fetchJson } from './http';

const DATASET = 'https://data.cityofnewyork.us/resource/64uk-42ks.json';

interface PlutoRow {
  bbl?: string;
  zonedist1?: string;
  overlay1?: string;
  spdist1?: string;
  landuse?: string;
  bldgclass?: string;
  lotarea?: string;
  bldgarea?: string;
  builtfar?: string;
  residfar?: string;
  commfar?: string;
  yearbuilt?: string;
  unitsres?: string;
}

function num(v: string | undefined): number | null {
  if (v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

const REPRESENTATIVE_FALLBACK: ZoningInfo = {
  bbl: 'unknown',
  zoning_district: 'R6B (REPRESENTATIVE — live PLUTO call failed)',
  commercial_overlay: null,
  special_district: null,
  land_use_code: '02',
  building_class: 'C0',
  lot_area_sqft: 2000,
  building_area_sqft: 3600,
  built_far: 1.8,
  max_residential_far: 2.0,
  max_commercial_far: null,
  unused_far_pct: 10,
  year_built: 1931,
  residential_units: 3,
};

export const nycZoning: ZoningProvider = {
  name: 'NYC MapPLUTO (NYC Open Data)',

  async getZoning(addr: ResolvedAddress): Promise<ProviderResult<ZoningInfo>> {
    const fetched_at = new Date().toISOString();
    const bbl = addr.bbl;
    const url = `${DATASET}?$where=${encodeURIComponent(`bbl='${bbl}'`)}&$limit=1`;

    if (!bbl) {
      return {
        ok: true,
        data: REPRESENTATIVE_FALLBACK,
        provenance: 'representative',
        source: 'NYC Open Data — MapPLUTO (64uk-42ks) [FALLBACK]',
        fetched_at,
        error: 'No BBL resolved for address — cannot query PLUTO',
      };
    }

    try {
      let rows = await fetchJson<PlutoRow[]>(url);
      if (rows.length === 0) {
        // PLUTO sometimes stores bbl as a number-formatted string (e.g. "3004310001.00000000")
        const altUrl = `${DATASET}?$where=${encodeURIComponent(`bbl='${Number(bbl).toFixed(8)}'`)}&$limit=1`;
        rows = await fetchJson<PlutoRow[]>(altUrl);
      }
      const row = rows[0];
      if (!row) throw new Error(`No PLUTO record for BBL ${bbl}`);

      const builtFar = num(row.builtfar);
      const residFar = num(row.residfar);
      const unused =
        builtFar !== null && residFar !== null && residFar > 0
          ? Math.max(0, Math.round(((residFar - builtFar) / residFar) * 100))
          : null;

      const data: ZoningInfo = {
        bbl,
        zoning_district: row.zonedist1 ?? null,
        commercial_overlay: row.overlay1 ?? null,
        special_district: row.spdist1 ?? null,
        land_use_code: row.landuse ?? null,
        building_class: row.bldgclass ?? null,
        lot_area_sqft: num(row.lotarea),
        building_area_sqft: num(row.bldgarea),
        built_far: builtFar,
        max_residential_far: residFar,
        max_commercial_far: num(row.commfar),
        unused_far_pct: unused,
        year_built: num(row.yearbuilt),
        residential_units: num(row.unitsres),
      };

      return {
        ok: true,
        data,
        provenance: 'live',
        source: 'NYC Open Data — MapPLUTO (64uk-42ks)',
        endpoint: url,
        fetched_at,
      };
    } catch (e) {
      return {
        ok: true,
        data: { ...REPRESENTATIVE_FALLBACK, bbl },
        provenance: 'representative',
        source: 'NYC Open Data — MapPLUTO (64uk-42ks) [FALLBACK]',
        endpoint: url,
        fetched_at,
        error: `Live call failed: ${errMsg(e)}`,
      };
    }
  },
};
