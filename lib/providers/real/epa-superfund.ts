// EPA contamination proximity — Superfund (SEMS) + brownfields (ACRES) within a
// radius of the point, via the EPA Facility Registry Service REST radius query.
// National, keyless, public domain. provenance: "live".
//
// This hands the Risk agent the ACTUAL nearby cleanup sites, which closes the
// hallucinated-Superfund gap: the agent no longer expands a coded field into a
// named Superfund site from general knowledge — it cites a real site the data
// gave it (or, honestly, states there are none within the radius).

import type { ContaminationInfo, ContaminationProvider, ProviderResult, ResolvedAddress } from '../types';
import { errMsg, fetchJson } from './http';

const FRS = 'https://ofmpub.epa.gov/frs_public2/frs_rest_services.get_facilities';
const RADIUS_MI = 2;

interface FrsFacility {
  FacilityName?: string;
  Latitude83?: string;
  Longitude83?: string;
}
interface FrsResponse {
  Results?: { FRSFacility?: FrsFacility | FrsFacility[] };
}

// The FRS sometimes returns a bare object instead of a 1-element array.
function asArray<T>(v: T | T[] | undefined): T[] {
  return v == null ? [] : Array.isArray(v) ? v : [v];
}

function haversineMi(aLat: number, aLon: number, bLat: number, bLon: number): number {
  const R = 3958.8; // miles
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(bLat - aLat);
  const dLon = toRad(bLon - aLon);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

async function queryProgram(lat: number, lon: number, pgm: string): Promise<FrsFacility[]> {
  const url =
    `${FRS}?latitude83=${lat}&longitude83=${lon}&search_radius=${RADIUS_MI}` +
    `&pgm_sys_acrnm=${pgm}&output=JSON`;
  // retries: 0 — the FRS enforces a 12-requests/minute limit. Retrying a 429
  // within seconds cannot clear a per-minute window; it only burns more of the
  // budget and turns a single call into a storm. A single verdict makes just two
  // FRS calls (SEMS + ACRES), well under the limit; on a 429 we fall straight to
  // a labeled representative result rather than hammering.
  const res = await fetchJson<FrsResponse>(url, { timeoutMs: 20000, retries: 0 });
  return asArray(res.Results?.FRSFacility);
}

// Labeled stand-in for a runtime FRS failure (never a silent fake).
const REPRESENTATIVE_FALLBACK: ContaminationInfo = {
  radius_mi: RADIUS_MI,
  superfund_sites_within_radius: 1,
  brownfield_within_radius: 3,
  total_cleanup_sites_within_radius: 4,
  nearest_site_name: 'REPRESENTATIVE — live EPA FRS call failed',
  nearest_site_distance_mi: 0.6,
  nearest_site_program: 'SEMS (Superfund)',
  scope_note: 'REPRESENTATIVE — EPA Facility Registry Service was unreachable; typical inner-Brooklyn cleanup-site density shown as a labeled stand-in.',
};

export const epaContamination: ContaminationProvider = {
  name: 'EPA Superfund + Brownfields (Facility Registry Service)',

  async getContamination(addr: ResolvedAddress): Promise<ProviderResult<ContaminationInfo>> {
    const fetched_at = new Date().toISOString();
    try {
      const [sems, acres] = await Promise.all([
        queryProgram(addr.latitude, addr.longitude, 'SEMS'),
        queryProgram(addr.latitude, addr.longitude, 'ACRES'),
      ]);

      const withDist = (facs: FrsFacility[], program: string) =>
        facs.map((f) => {
          const la = Number(f.Latitude83);
          const lo = Number(f.Longitude83);
          const dist = Number.isFinite(la) && Number.isFinite(lo) ? haversineMi(addr.latitude, addr.longitude, la, lo) : null;
          return { name: f.FacilityName ?? null, dist, program };
        });

      const ranked = [...withDist(sems, 'SEMS (Superfund)'), ...withDist(acres, 'ACRES (brownfield)')]
        .filter((x) => x.dist != null)
        .sort((a, b) => (a.dist as number) - (b.dist as number));
      const nearest = ranked[0] ?? null;

      const data: ContaminationInfo = {
        radius_mi: RADIUS_MI,
        superfund_sites_within_radius: sems.length,
        brownfield_within_radius: acres.length,
        total_cleanup_sites_within_radius: sems.length + acres.length,
        nearest_site_name: nearest?.name ?? null,
        nearest_site_distance_mi: nearest?.dist != null ? Math.round(nearest.dist * 100) / 100 : null,
        nearest_site_program: nearest?.program ?? null,
        scope_note:
          `EPA Facility Registry Service — cleanup sites within ${RADIUS_MI} mi of the point. ` +
          'SEMS = Superfund program sites (NPL and non-NPL); ACRES = brownfield sites. ' +
          'Zero within the radius is a real coverage result, not "no risk".',
      };

      return {
        ok: true,
        data,
        provenance: 'live',
        source: 'EPA Facility Registry Service (SEMS Superfund + ACRES brownfields)',
        endpoint: `${FRS}?latitude83=${addr.latitude}&longitude83=${addr.longitude}&search_radius=${RADIUS_MI}&pgm_sys_acrnm=SEMS|ACRES&output=JSON`,
        fetched_at,
      };
    } catch (e) {
      return {
        ok: true,
        data: REPRESENTATIVE_FALLBACK,
        provenance: 'representative',
        source: 'EPA Facility Registry Service [FALLBACK]',
        fetched_at,
        error: `Live call failed: ${errMsg(e)}`,
      };
    }
  },
};
