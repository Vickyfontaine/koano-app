// IRS/Treasury Qualified Opportunity Zones — checked by census tract GEOID
// against public ArcGIS feature services (HUD / Esri mirrors of the official
// CDFI Fund designation list). Falls back to a labeled representative response.

import type { OpportunityZoneInfo, OpportunityZoneProvider, ProviderResult, ResolvedAddress } from '../types';
import { errMsg, fetchJson } from './http';

// HUD's public mirror of the official Treasury/CDFI QOZ designation list.
// Layer 13 = QOZ tracts; key field GEOID10 (verified 2026-07).
const CANDIDATE_SERVICES = [
  (geoid: string) =>
    `https://services.arcgis.com/VTyQ9soqVukalItT/arcgis/rest/services/Opportunity_Zones/FeatureServer/13/query` +
    `?where=${encodeURIComponent(`GEOID10='${geoid}'`)}&outFields=GEOID10,STATE_NAME,Rural&returnGeometry=false&f=json`,
  (geoid: string) =>
    `https://services.arcgis.com/VTyQ9soqVukalItT/arcgis/rest/services/Opportunity_Zones_2/FeatureServer/0/query` +
    `?where=${encodeURIComponent(`GEOID10='${geoid}'`)}&outFields=*&returnGeometry=false&f=json`,
];

interface ArcGisQueryResponse {
  features?: Array<{ attributes?: Record<string, unknown> }>;
  error?: { message?: string };
}

export const irsOpportunity: OpportunityZoneProvider = {
  name: 'IRS/Treasury Qualified Opportunity Zones',

  async getOpportunityZone(addr: ResolvedAddress): Promise<ProviderResult<OpportunityZoneInfo>> {
    const fetched_at = new Date().toISOString();
    const geoid = addr.tract_geoid;

    if (!geoid) {
      return {
        ok: true,
        data: {
          tract_geoid: 'unknown',
          is_opportunity_zone: false,
          designation_note:
            'REPRESENTATIVE — census tract could not be resolved; defaulting to non-OZ (most NYC tracts are not designated).',
        },
        provenance: 'representative',
        source: 'IRS/Treasury QOZ list [FALLBACK]',
        fetched_at,
        error: 'No tract GEOID resolved for address',
      };
    }

    let lastError = '';
    for (const buildUrl of CANDIDATE_SERVICES) {
      const url = buildUrl(geoid);
      try {
        const res = await fetchJson<ArcGisQueryResponse>(url);
        if (res.error) throw new Error(res.error.message ?? 'ArcGIS service error');
        if (!Array.isArray(res.features)) throw new Error('Unexpected ArcGIS response shape');

        const isOz = res.features.length > 0;
        return {
          ok: true,
          data: {
            tract_geoid: geoid,
            is_opportunity_zone: isOz,
            designation_note: isOz
              ? 'Tract appears on the Treasury/CDFI Qualified Opportunity Zone designation list.'
              : 'Tract not found on the QOZ designation list.',
          },
          provenance: 'live',
          source: 'IRS/Treasury QOZ designations (public ArcGIS mirror)',
          endpoint: url,
          fetched_at,
        };
      } catch (e) {
        lastError = errMsg(e);
      }
    }

    return {
      ok: true,
      data: {
        tract_geoid: geoid,
        is_opportunity_zone: false,
        designation_note:
          'REPRESENTATIVE — live QOZ lookup failed; defaulting to non-OZ (most NYC tracts are not designated). Verify against the CDFI Fund list.',
      },
      provenance: 'representative',
      source: 'IRS/Treasury QOZ list [FALLBACK]',
      fetched_at,
      error: `Live calls failed: ${lastError}`,
    };
  },
};
