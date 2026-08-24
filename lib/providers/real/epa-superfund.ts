// EPA contamination proximity — Superfund (SEMS) + brownfields (ACRES) within a
// radius of the point, via the EPA Facility Registry Service REST radius query.
// National, keyless, public domain. provenance: "live".
//
// This hands the Risk agent the ACTUAL nearby cleanup sites, which closes the
// hallucinated-Superfund gap: the agent no longer expands a coded field into a
// named Superfund site from general knowledge — it cites a real site the data
// gave it (or, honestly, states there are none within the radius).

import type {
  ContaminationInfo,
  ContaminationProvider,
  ContaminationSite,
  ProviderResult,
  ResolvedAddress,
} from '../types';
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
  // retries: 0 HERE (per-call) — the FRS enforces 12 req/min and a same-second
  // retry can't clear a per-minute window. The single JITTERED backoff-retry lives
  // one level up in getContamination, where it spreads concurrent multi-site
  // bursts across the window; if it still fails, contamination is OMITTED (a live
  // coverage note), never a representative stand-in.
  const res = await fetchJson<FrsResponse>(url, { timeoutMs: 20000, retries: 0 });
  return asArray(res.Results?.FRSFacility);
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export const epaContamination: ContaminationProvider = {
  name: 'EPA Superfund + Brownfields (Facility Registry Service)',

  async getContamination(addr: ResolvedAddress): Promise<ProviderResult<ContaminationInfo>> {
    const fetched_at = new Date().toISOString();

    const buildData = async (): Promise<ContaminationInfo> => {
      const [sems, acres] = await Promise.all([
        queryProgram(addr.latitude, addr.longitude, 'SEMS'),
        queryProgram(addr.latitude, addr.longitude, 'ACRES'),
      ]);

      const withDist = (facs: FrsFacility[], program: string) =>
        facs.map((f) => {
          const la = Number(f.Latitude83);
          const lo = Number(f.Longitude83);
          const ok = Number.isFinite(la) && Number.isFinite(lo);
          const dist = ok ? haversineMi(addr.latitude, addr.longitude, la, lo) : null;
          return { name: f.FacilityName ?? null, lat: ok ? la : null, lon: ok ? lo : null, dist, program };
        });

      const ranked = [...withDist(sems, 'SEMS (Superfund)'), ...withDist(acres, 'ACRES (brownfield)')]
        .filter((x) => x.dist != null)
        .sort((a, b) => (a.dist as number) - (b.dist as number));
      const nearest = ranked[0] ?? null;

      const sites: ContaminationSite[] = ranked
        .filter((x) => x.lat != null && x.lon != null)
        .map((x) => ({
          name: x.name,
          latitude: x.lat as number,
          longitude: x.lon as number,
          distance_mi: Math.round((x.dist as number) * 100) / 100,
          program: x.program,
        }));

      return {
        radius_mi: RADIUS_MI,
        superfund_sites_within_radius: sems.length,
        brownfield_within_radius: acres.length,
        total_cleanup_sites_within_radius: sems.length + acres.length,
        nearest_site_name: nearest?.name ?? null,
        nearest_site_distance_mi: nearest?.dist != null ? Math.round(nearest.dist * 100) / 100 : null,
        nearest_site_program: nearest?.program ?? null,
        sites,
        scope_note:
          `EPA Facility Registry Service — cleanup sites within ${RADIUS_MI} mi of the point. ` +
          'SEMS = Superfund program sites (NPL and non-NPL); ACRES = brownfield sites. ' +
          'Zero within the radius is a real coverage result, not "no risk".',
      };
    };

    const ok = (data: ContaminationInfo, recovered: boolean): ProviderResult<ContaminationInfo> => ({
      ok: true,
      data,
      provenance: 'live',
      source: `EPA Facility Registry Service (SEMS Superfund + ACRES brownfields)${recovered ? ' — recovered after backoff' : ''}`,
      endpoint: `${FRS}?latitude83=${addr.latitude}&longitude83=${addr.longitude}&search_radius=${RADIUS_MI}&pgm_sys_acrnm=SEMS|ACRES&output=JSON`,
      fetched_at,
    });

    try {
      return ok(await buildData(), false);
    } catch {
      // The FRS 12-req/min limit bites under concurrent multi-site runs. ONE
      // jittered backoff (not a storm) spreads the concurrent calls across the
      // per-minute window so the second attempt usually lands — keeping the live
      // contamination signal instead of losing it.
      await sleep(4000 + Math.floor(Math.random() * 8000)); // 4–12s jitter
      try {
        return ok(await buildData(), true);
      } catch (e2) {
        // Still unavailable → OMIT, never a representative stand-in. Contamination
        // proximity is ADDITIVE hazard signal; a transient EPA outage must not
        // fabricate a nearby Superfund site NOR drag the whole verdict to
        // representative (the multi-site regression). data:null tagged live → the
        // agent emits a coverage note (the omission rule), verdict stays live.
        return {
          ok: true,
          data: null,
          provenance: 'live',
          source:
            'EPA Facility Registry Service — temporarily unavailable (rate-limited or unreachable); contamination proximity omitted this run',
          fetched_at,
          error: `Live call failed after one backoff retry: ${errMsg(e2)}`,
        };
      }
    }
  },
};
