// FEMA National Risk Index — Census-tract composite natural-hazard risk.
// Live, keyless, national (FEMA ArcGIS FeatureServer). Public domain; display to
// paying users is permitted. Keyed by tract GEOID (TRACTFIPS = addr.tract_geoid),
// so it runs live for a NYC address AND anywhere else in the US.
//
// COMPLEMENTS, does not duplicate: NFHL gives the current regulatory flood zone;
// OpenFEMA gives the county's disaster-declaration history; NRI gives a forward-
// looking, expected-annual-loss composite across 18 hazards plus social
// vulnerability and community resilience. Read honestly (see NationalRiskInfo):
// the composite is loss-weighted, so a low-population tract can read "Very Low"
// overall while a single peril (coastal flood) is moderate — notable_hazards
// surfaces those so the composite never buries a real single-peril signal.

import type {
  NationalRiskHazard,
  NationalRiskInfo,
  NationalRiskProvider,
  ProviderResult,
  ResolvedAddress,
} from '../types';
import { errMsg, fetchJson } from './http';

const FS =
  'https://services.arcgis.com/XG15cJAlne2vxtgt/arcgis/rest/services/National_Risk_Index_Census_Tracts/FeatureServer/0/query';

// The 18 NRI hazard code prefixes → human names. Each has a `<CODE>_RISKR` rating.
const HAZARDS: Record<string, string> = {
  AVLN: 'Avalanche',
  CFLD: 'Coastal Flooding',
  CWAV: 'Cold Wave',
  DRGT: 'Drought',
  ERQK: 'Earthquake',
  HAIL: 'Hail',
  HWAV: 'Heat Wave',
  HRCN: 'Hurricane',
  ISTM: 'Ice Storm',
  LNDS: 'Landslide',
  LTNG: 'Lightning',
  IFLD: 'Riverine Flooding',
  SWND: 'Strong Wind',
  TRND: 'Tornado',
  TSUN: 'Tsunami',
  VLCN: 'Volcanic Activity',
  WFIR: 'Wildfire',
  WNTW: 'Winter Weather',
};

// Rating severity order — for ranking notable hazards and filtering the trivial.
const SEVERITY: Record<string, number> = {
  'Very High': 5,
  'Relatively High': 4,
  'Relatively Moderate': 3,
  'Relatively Low': 2,
  'Very Low': 1,
};
// A hazard is "notable" enough to surface to the agent at or above moderate.
const NOTABLE_MIN = SEVERITY['Relatively Moderate'];

type NriAttrs = Record<string, string | number | null>;

function num(v: string | number | null | undefined): number | null {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}
function str(v: string | number | null | undefined): string | null {
  const s = typeof v === 'string' ? v.trim() : v == null ? '' : String(v);
  return s || null;
}

function notableHazards(a: NriAttrs): NationalRiskHazard[] {
  const out: NationalRiskHazard[] = [];
  for (const [code, name] of Object.entries(HAZARDS)) {
    const rating = str(a[`${code}_RISKR`]);
    if (rating && (SEVERITY[rating] ?? 0) >= NOTABLE_MIN) out.push({ hazard: name, rating });
  }
  return out.sort((x, y) => (SEVERITY[y.rating] ?? 0) - (SEVERITY[x.rating] ?? 0));
}

export const femaNri: NationalRiskProvider = {
  name: 'FEMA National Risk Index (Census tract) via FEMA ArcGIS',

  async getNationalRisk(addr: ResolvedAddress): Promise<ProviderResult<NationalRiskInfo>> {
    const fetched_at = new Date().toISOString();
    const geoid = addr.tract_geoid;

    // Missing tract key — cannot query. OMIT (data:null tagged live), never a
    // fabricated risk score: the omission rule. NRI is national, so this is a
    // rare "no tract resolved", not an out-of-coverage market.
    if (!geoid) {
      return {
        ok: true,
        data: null,
        provenance: 'live',
        source: 'FEMA National Risk Index (Census tract)',
        fetched_at,
        error: 'No census tract resolved for this address — National Risk Index not queried.',
      };
    }

    const fields = [
      'TRACTFIPS',
      'RISK_SCORE',
      'RISK_RATNG',
      'EAL_VALT',
      'EAL_RATNG',
      'SOVI_RATNG',
      'RESL_RATNG',
      ...Object.keys(HAZARDS).map((c) => `${c}_RISKR`),
    ].join(',');
    const url =
      `${FS}?where=${encodeURIComponent(`TRACTFIPS='${geoid}'`)}` +
      `&outFields=${encodeURIComponent(fields)}&returnGeometry=false&f=json`;

    try {
      const res = await fetchJson<{ features?: { attributes: NriAttrs }[]; error?: unknown }>(url, {
        timeoutMs: 30000,
      });
      const a = res.features?.[0]?.attributes;
      if (!a) {
        // Live call succeeded but no tract row (e.g. a territory NRI doesn't cover).
        return {
          ok: true,
          data: null,
          provenance: 'live',
          source: 'FEMA National Risk Index (Census tract)',
          endpoint: url,
          fetched_at,
          error: `National Risk Index has no record for tract ${geoid}.`,
        };
      }

      const notable = notableHazards(a);
      const data: NationalRiskInfo = {
        tract_fips: geoid,
        risk_score: num(a.RISK_SCORE) == null ? null : Math.round(num(a.RISK_SCORE) as number),
        risk_rating: str(a.RISK_RATNG),
        expected_annual_loss_usd: num(a.EAL_VALT) == null ? null : Math.round(num(a.EAL_VALT) as number),
        eal_rating: str(a.EAL_RATNG),
        social_vulnerability_rating: str(a.SOVI_RATNG),
        community_resilience_rating: str(a.RESL_RATNG),
        notable_hazards: notable,
        scope_note:
          `FEMA National Risk Index, census tract ${geoid}. Composite risk is a national percentile ` +
          `weighted by expected annual loss, combined with social vulnerability and community resilience; ` +
          `a low composite can still carry a moderate single-hazard rating (see notable hazards). ` +
          `${notable.length ? `Notable hazards (≥ moderate): ${notable.map((h) => `${h.hazard} (${h.rating})`).join(', ')}.` : 'No individual hazard rated moderate or higher.'}`,
      };

      return {
        ok: true,
        data,
        provenance: 'live',
        source: 'FEMA National Risk Index (Census tract) via FEMA ArcGIS',
        endpoint: url,
        fetched_at,
      };
    } catch (e) {
      // Live call attempted and failed → representative, but with NO fabricated
      // score (data:null). Never present an invented risk number as real.
      return {
        ok: true,
        data: null,
        provenance: 'fetch_failed',
        source: 'FEMA National Risk Index (Census tract) [live call failed]',
        endpoint: url,
        fetched_at,
        error: `Live NRI call failed: ${errMsg(e)}`,
      };
    }
  },
};
