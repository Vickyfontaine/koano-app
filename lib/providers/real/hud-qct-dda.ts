// HUD LIHTC eligibility — Qualified Census Tracts (QCT) + Difficult Development
// Areas (DDA). Live, keyless, national (HUD Official Content ArcGIS). Public HUD
// designations; display to paying users is permitted.
//   QCT: tract-level — queried by GEOID against the current QCT layer (which holds
//        ONLY designated tracts, so a match = designated, no match = not).
//   DDA: area-level (metro SDDAs are ZCTA polygons, non-metro are counties) —
//        resolved by POINT-IN-POLYGON on the address coordinates, so it works
//        regardless of whether the designation is by ZIP area or county.
// A QCT or DDA designation gives a LIHTC project a 30% eligible-basis boost — a
// federal affordable-housing incentive, like the Opportunity Zone designation the
// regulatory-policy agent already reads. National: runs live for a NYC address and
// anywhere else in the US.

import type {
  LihtcEligibilityInfo,
  LihtcEligibilityProvider,
  ProviderResult,
  ResolvedAddress,
} from '../types';
import { errMsg, fetchJson } from './http';

const HUD = 'https://services.arcgis.com/VTyQ9soqVukalItT/arcgis/rest/services';
const QCT = `${HUD}/QUALIFIED_CENSUS_TRACTS_2026/FeatureServer/0/query`;
const DDA = `${HUD}/Difficult_Development_Areas/FeatureServer/0/query`;

interface CountResp {
  count?: number;
  error?: unknown;
}
interface DdaResp {
  features?: { attributes: { DDA_NAME?: string; DDA_TYPE?: string; ZCTA5?: string } }[];
  error?: unknown;
}

function ddaTypeLabel(code: string | null): string | null {
  if (!code) return null;
  if (code.toUpperCase() === 'SA') return 'Small Area DDA';
  return code; // non-metro / other DDA type codes pass through as given
}

export const hudQctDda: LihtcEligibilityProvider = {
  name: 'HUD Qualified Census Tracts (2026) + Difficult Development Areas via HUD Official Content ArcGIS',

  async getLihtcEligibility(addr: ResolvedAddress): Promise<ProviderResult<LihtcEligibilityInfo>> {
    const fetched_at = new Date().toISOString();
    const geoid = addr.tract_geoid;
    const hasPoint = Number.isFinite(addr.latitude) && Number.isFinite(addr.longitude);

    // QCT needs a tract GEOID; DDA needs a point. Both are normally present for any
    // geocoded US address. If NEITHER can run, omit (data:null, live) rather than
    // fabricate — the omission rule.
    if (!geoid && !hasPoint) {
      return {
        ok: true,
        data: null,
        provenance: 'live',
        source: 'HUD QCT + DDA',
        fetched_at,
        error: 'No tract GEOID or coordinates resolved. LIHTC eligibility not queried.',
      };
    }

    const qctUrl = geoid
      ? `${QCT}?where=${encodeURIComponent(`GEOID='${geoid}'`)}&returnCountOnly=true&f=json`
      : null;
    const ddaUrl = hasPoint
      ? `${DDA}?geometry=${addr.longitude}%2C${addr.latitude}&geometryType=esriGeometryPoint&inSR=4326` +
        `&spatialRel=esriSpatialRelIntersects&outFields=DDA_NAME,DDA_TYPE,ZCTA5&returnGeometry=false&f=json`
      : null;

    try {
      const [qctRes, ddaRes] = await Promise.all([
        qctUrl ? fetchJson<CountResp>(qctUrl, { timeoutMs: 25000 }) : Promise.resolve(null),
        ddaUrl ? fetchJson<DdaResp>(ddaUrl, { timeoutMs: 25000 }) : Promise.resolve(null),
      ]);

      const is_qct = qctRes ? (qctRes.count ?? 0) > 0 : null;
      const ddaFeature = ddaRes?.features?.[0]?.attributes ?? null;
      const is_dda = ddaRes ? Boolean(ddaFeature) : null;
      const dda_name = ddaFeature?.DDA_NAME ?? null;
      const dda_type = ddaTypeLabel(ddaFeature?.DDA_TYPE ?? null);

      const parts: string[] = [];
      parts.push(is_qct == null ? 'QCT status unavailable (no tract).' : is_qct ? 'In a Qualified Census Tract.' : 'Not in a Qualified Census Tract.');
      parts.push(
        is_dda == null
          ? 'DDA status unavailable (no coordinates).'
          : is_dda
            ? `In a Difficult Development Area${dda_name ? ` (${dda_name}${dda_type ? `, ${dda_type}` : ''})` : ''}.`
            : 'Not in a Difficult Development Area.',
      );
      const boost = is_qct || is_dda;
      parts.push(
        boost
          ? 'A QCT or DDA designation qualifies a Low-Income Housing Tax Credit project for a 30% eligible-basis boost (affordable-housing feasibility signal).'
          : 'No LIHTC 30% basis boost from QCT/DDA at this location.',
      );

      const data: LihtcEligibilityInfo = {
        is_qct,
        is_dda,
        dda_name,
        dda_type,
        scope_note: `HUD LIHTC eligibility (QCT 2026 by tract, DDA by area). ${parts.join(' ')}`,
      };

      return {
        ok: true,
        data,
        provenance: 'live',
        source: 'HUD Qualified Census Tracts (2026) + Difficult Development Areas (HUD Official Content ArcGIS)',
        endpoint: qctUrl ?? ddaUrl ?? undefined,
        fetched_at,
      };
    } catch (e) {
      // Live call attempted and failed → representative, with NO fabricated
      // designation (data:null). Never assert an invented QCT/DDA status.
      return {
        ok: true,
        data: null,
        provenance: 'fetch_failed',
        source: 'HUD QCT + DDA [live call failed]',
        endpoint: qctUrl ?? ddaUrl ?? undefined,
        fetched_at,
        error: `Live HUD QCT/DDA call failed: ${errMsg(e)}`,
      };
    }
  },
};
