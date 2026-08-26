// NYC assemblage / air-rights read — block-level (NYC Open Data MapPLUTO 64uk-42ks).
// A NYC zoning lot and any TDR (air-rights) transfer are constrained to a single
// tax block, so block-level ownership + unused FAR is the CORRECT basis for an
// assemblage read — not a spatial-adjacency approximation. This resolves the
// subject's owner, finds same-owner lots on the same tax block (assemblage
// opportunity), and sums unused development rights across the block.

import type {
  AssemblageNeighbor,
  AssemblageProvider,
  AssemblageSummary,
  ProviderResult,
  ResolvedAddress,
} from '../types';
import { errMsg, fetchJson } from './http';
import { outOfMarketMunicipal } from './coverage';

const DATASET = 'https://data.cityofnewyork.us/resource/64uk-42ks.json';
const BORO_ABBR: Record<string, string> = { '1': 'MN', '2': 'BX', '3': 'BK', '4': 'QN', '5': 'SI' };
const MAX_NEIGHBORS_SHOWN = 12;
const BLOCK_NOTE =
  'Assemblage is assessed at the tax-block level: NYC zoning lots and TDR (air-rights) transfers are ' +
  'constrained to a single tax block, so block-level ownership and unused FAR is the correct basis, not ' +
  'a spatial-adjacency approximation.';

interface PlutoLot {
  bbl?: string;
  lot?: string;
  ownername?: string;
  lotarea?: string;
  bldgarea?: string;
  residfar?: string;
}

function num(v?: string): number | null {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function normOwner(s?: string | null): string | null {
  const t = (s ?? '').trim().toUpperCase();
  return t || null;
}
// PLUTO stores bbl as a number-formatted string ("3010850001.00000000").
function bbl10(raw?: string): string | null {
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? String(Math.trunc(n)).padStart(10, '0') : null;
}
function unusedFloorArea(lot: PlutoLot): number | null {
  const far = num(lot.residfar);
  const lotArea = num(lot.lotarea);
  const bldg = num(lot.bldgarea) ?? 0;
  if (far == null || lotArea == null) return null;
  return Math.max(0, Math.round(far * lotArea - bldg));
}

const REPRESENTATIVE_FALLBACK: AssemblageSummary = {
  subject_bbl: null,
  subject_owner_name: 'REPRESENTATIVE: live PLUTO block lookup failed',
  block_lot_count: 0,
  same_owner_lot_count: 0,
  same_owner_bbls: [],
  block_unused_far_floor_area_sqft: 0,
  same_owner_unused_far_floor_area_sqft: 0,
  block_note: BLOCK_NOTE,
  neighbors: [],
};

export const nycAssemblage: AssemblageProvider = {
  name: 'NYC assemblage / air rights (MapPLUTO block-level)',

  async getAssemblage(addr: ResolvedAddress): Promise<ProviderResult<AssemblageSummary>> {
    const fetched_at = new Date().toISOString();

    // Out of market: no NYC BBL → coverage-absent, never the representative
    // fallback (that is for a live call that FAILS on a real NYC BBL).
    if (!addr.bbl || !/^\d{10}$/.test(addr.bbl)) {
      return outOfMarketMunicipal<AssemblageSummary>({
        layer: 'tax-block assemblage',
        dataset: 'NYC Open Data: MapPLUTO (64uk-42ks)',
        fetched_at,
      });
    }

    try {
      const borough = BORO_ABBR[addr.bbl[0]];
      const block = Number(addr.bbl.slice(1, 6));
      if (!borough || !Number.isFinite(block)) throw new Error(`Bad BBL ${addr.bbl}`);

      const url =
        `${DATASET}?$where=${encodeURIComponent(`borough='${borough}' AND block=${block}`)}` +
        `&$select=bbl,lot,ownername,lotarea,bldgarea,residfar&$limit=2000`;
      // Retry with backoff so a transient Socrata blip doesn't degrade an
      // all-live memo to representative (matches the entitlement provider).
      const rows = await fetchJson<PlutoLot[]>(url, { retries: 3 });

      const subject = rows.find((r) => bbl10(r.bbl) === addr.bbl);
      const subjectOwner = normOwner(subject?.ownername);

      const others = rows.filter((r) => bbl10(r.bbl) !== addr.bbl);
      let blockUnused = 0;
      let sameOwnerUnused = 0;
      const sameOwnerBbls: string[] = [];
      const neighbors: AssemblageNeighbor[] = [];

      for (const r of others) {
        const bbl = bbl10(r.bbl);
        if (!bbl) continue;
        const unused = unusedFloorArea(r);
        const sameOwner = !!subjectOwner && normOwner(r.ownername) === subjectOwner;
        if (unused != null) blockUnused += unused;
        if (sameOwner) {
          sameOwnerBbls.push(bbl);
          if (unused != null) sameOwnerUnused += unused;
        }
        neighbors.push({
          bbl,
          owner_name: normOwner(r.ownername),
          lot_area_sqft: num(r.lotarea),
          building_area_sqft: num(r.bldgarea),
          unused_far_floor_area_sqft: unused,
          same_owner_as_subject: sameOwner,
        });
      }

      // Same-owner first, then largest unused development rights.
      neighbors.sort((a, b) => {
        if (a.same_owner_as_subject !== b.same_owner_as_subject) return a.same_owner_as_subject ? -1 : 1;
        return (b.unused_far_floor_area_sqft ?? 0) - (a.unused_far_floor_area_sqft ?? 0);
      });

      const data: AssemblageSummary = {
        subject_bbl: addr.bbl,
        subject_owner_name: subjectOwner,
        block_lot_count: rows.length,
        same_owner_lot_count: sameOwnerBbls.length,
        same_owner_bbls: sameOwnerBbls,
        block_unused_far_floor_area_sqft: blockUnused,
        same_owner_unused_far_floor_area_sqft: sameOwnerUnused,
        block_note: BLOCK_NOTE,
        neighbors: neighbors.slice(0, MAX_NEIGHBORS_SHOWN),
      };

      return {
        ok: true,
        data,
        provenance: 'live',
        source: 'NYC Open Data: MapPLUTO (64uk-42ks), block-level ownership + unused FAR',
        endpoint: url,
        fetched_at,
      };
    } catch (e) {
      return {
        ok: true,
        data: REPRESENTATIVE_FALLBACK,
        provenance: 'fetch_failed',
        source: 'NYC Open Data: MapPLUTO (64uk-42ks) [FALLBACK]',
        fetched_at,
        error: `Live call failed: ${errMsg(e)}`,
      };
    }
  },
};
