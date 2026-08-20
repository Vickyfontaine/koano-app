// USGS seismic hazard — ASCE 7-22 design values (building-codes web service) +
// a count of historical earthquakes near the point (FDSN ComCat). National +
// global, keyless, public domain. provenance: "live".
//
// Design values are MODELED hazard (mapped accelerations), not a live event
// feed. Site Class D and Risk Category II are the standard defaults when the
// specific soil/occupancy is unknown; design_reference states the assumption.
// The old ws/designmaps service is retired — this uses its replacement.

import type { ProviderResult, ResolvedAddress, SeismicInfo, SeismicProvider } from '../types';
import { errMsg, fetchJson } from './http';

const DESIGN = 'https://earthquake.usgs.gov/ws/building-codes/asce7-22/calculate';
const COMCAT = 'https://earthquake.usgs.gov/fdsnws/event/1/query';
const QUAKE_RADIUS_KM = 50;
const QUAKE_MIN_MAG = 3;
const QUAKE_SINCE = '1970-01-01';

interface DesignResponse {
  response?: { data?: { ss?: number; s1?: number; pga?: number; pgam?: number; sdc?: string } };
}
interface ComcatResponse {
  features?: Array<{ properties?: { mag?: number | null } }>;
}

const REPRESENTATIVE_FALLBACK: SeismicInfo = {
  pga_g: 0.06,
  ss_g: 0.28,
  s1_g: 0.07,
  design_reference: 'REPRESENTATIVE — live USGS call failed (typical low-seismic Northeast profile)',
  historical_quakes_50km_m3plus: null,
  largest_nearby_magnitude: null,
  scope_note: 'REPRESENTATIVE — USGS building-codes service was unreachable; a labeled low-seismic stand-in.',
};

async function fetchDesign(lat: number, lon: number): Promise<DesignResponse['response']> {
  const url = `${DESIGN}?latitude=${lat}&longitude=${lon}&riskCategory=II&siteClass=D&title=KOANO`;
  const res = await fetchJson<DesignResponse>(url, { timeoutMs: 25000 });
  if (!res.response?.data) throw new Error('USGS building-codes returned no data for point');
  return res.response;
}

async function fetchQuakes(lat: number, lon: number): Promise<{ count: number; maxMag: number | null }> {
  const url =
    `${COMCAT}?format=geojson&latitude=${lat}&longitude=${lon}` +
    `&maxradiuskm=${QUAKE_RADIUS_KM}&starttime=${QUAKE_SINCE}&minmagnitude=${QUAKE_MIN_MAG}`;
  const res = await fetchJson<ComcatResponse>(url, { timeoutMs: 25000 });
  const feats = Array.isArray(res.features) ? res.features : [];
  const mags = feats.map((f) => f.properties?.mag).filter((m): m is number => typeof m === 'number');
  return { count: feats.length, maxMag: mags.length ? Math.max(...mags) : null };
}

export const usgsSeismic: SeismicProvider = {
  name: 'USGS seismic hazard (ASCE 7-22 + ComCat)',

  async getSeismic(addr: ResolvedAddress): Promise<ProviderResult<SeismicInfo>> {
    const fetched_at = new Date().toISOString();
    try {
      // Design values are primary (if they fail, the whole result is a fallback).
      const design = await fetchDesign(addr.latitude, addr.longitude);
      const d = design?.data ?? {};

      // Historical catalog is best-effort — a ComCat blip should not downgrade a
      // real design-value result to representative.
      let historical_quakes_50km_m3plus: number | null = null;
      let largest_nearby_magnitude: number | null = null;
      try {
        const q = await fetchQuakes(addr.latitude, addr.longitude);
        historical_quakes_50km_m3plus = q.count;
        largest_nearby_magnitude = q.maxMag;
      } catch {
        // leave null — count unavailable, not fabricated
      }

      const data: SeismicInfo = {
        pga_g: typeof d.pgam === 'number' ? d.pgam : typeof d.pga === 'number' ? d.pga : null,
        ss_g: typeof d.ss === 'number' ? d.ss : null,
        s1_g: typeof d.s1 === 'number' ? d.s1 : null,
        design_reference: `ASCE 7-22, Risk Category II, Site Class D (default)${d.sdc ? ` — Seismic Design Category ${d.sdc}` : ''}`,
        historical_quakes_50km_m3plus,
        largest_nearby_magnitude,
        scope_note:
          `USGS mapped seismic design values (ASCE 7-22) at the point, plus M${QUAKE_MIN_MAG}+ earthquakes ` +
          `within ${QUAKE_RADIUS_KM} km since ${QUAKE_SINCE.slice(0, 4)} (USGS ComCat). Design values are modeled hazard, not events.`,
      };

      return {
        ok: true,
        data,
        provenance: 'live',
        source: 'USGS Earthquake Hazards (ASCE 7-22 building-codes + ComCat catalog)',
        endpoint: `${DESIGN}?latitude=${addr.latitude}&longitude=${addr.longitude}&riskCategory=II&siteClass=D`,
        fetched_at,
      };
    } catch (e) {
      return {
        ok: true,
        data: REPRESENTATIVE_FALLBACK,
        provenance: 'representative',
        source: 'USGS seismic hazard [FALLBACK]',
        fetched_at,
        error: `Live call failed: ${errMsg(e)}`,
      };
    }
  },
};
