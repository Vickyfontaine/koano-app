// KOANO shared provider-block layer.
// The single source of truth for "fetch these named facts about one property,
// straight through the provider interfaces, each keeping its provenance
// envelope." Both the site-detail API route (dashboard panels) and the
// document engine's assembler consume this — one data path, never two.

import { registry } from './registry';
import type {
  AcsDemographics,
  AssemblageSummary,
  BuildingViolationsSummary,
  ClimateInfo,
  ContaminationInfo,
  CostarDealsSummary,
  CrimeStats,
  DisasterHistoryInfo,
  EmploymentInfo,
  EntitlementSummary,
  FloodInfo,
  FloodZonesInfo,
  LandlordPortfolioSummary,
  HpiTrend,
  MigrationInfo,
  MlsCompsSummary,
  MortgageDemandInfo,
  OpportunityZoneInfo,
  PermitsSummary,
  ProformaBenchmark,
  ProviderResult,
  Provenance,
  ResolvedAddress,
  SeismicInfo,
  ZoningInfo,
} from './types';

// Client-facing envelope: ProviderResult minus internal endpoint URLs.
export interface SiteDetailBlock<T> {
  ok: boolean;
  data: T | null;
  provenance: Provenance;
  source: string;
  fetched_at: string;
  swap_note?: string;
  error?: string;
}

export interface SiteDetailResponse {
  resolved_address: {
    input: string;
    normalized: string;
    bbl: string | null;
    borough: string | null;
    tract_geoid: string | null;
    latitude: number; // live geocoded point (WGS84) — the map subject
    longitude: number;
    // Coordinate confidence, distinct from data provenance — 'unconfirmed' means
    // the point was resolved from a single geocoder with no cross-check, so live
    // data on it may describe the wrong lot. The UI flags it.
    location_confidence: 'confirmed' | 'unconfirmed';
  };
  zoning?: SiteDetailBlock<ZoningInfo>;
  permits?: SiteDetailBlock<PermitsSummary>;
  opportunity_zone?: SiteDetailBlock<OpportunityZoneInfo>;
  proforma?: SiteDetailBlock<ProformaBenchmark>;
  flood?: SiteDetailBlock<FloodInfo>;
  flood_zones?: SiteDetailBlock<FloodZonesInfo>;
  demographics?: SiteDetailBlock<AcsDemographics>;
  hpi?: SiteDetailBlock<HpiTrend>;
  mls_comps?: SiteDetailBlock<MlsCompsSummary>;
  crime?: SiteDetailBlock<CrimeStats>;
  building_violations?: SiteDetailBlock<BuildingViolationsSummary>;
  landlord_portfolio?: SiteDetailBlock<LandlordPortfolioSummary>;
  mortgage_demand?: SiteDetailBlock<MortgageDemandInfo>;
  employment?: SiteDetailBlock<EmploymentInfo>;
  migration?: SiteDetailBlock<MigrationInfo>;
  contamination?: SiteDetailBlock<ContaminationInfo>;
  seismic?: SiteDetailBlock<SeismicInfo>;
  disaster_history?: SiteDetailBlock<DisasterHistoryInfo>;
  climate?: SiteDetailBlock<ClimateInfo>;
  costar_deals?: SiteDetailBlock<CostarDealsSummary>;
  assemblage?: SiteDetailBlock<AssemblageSummary>;
  entitlement?: SiteDetailBlock<EntitlementSummary>;
}

export type BlockKey = Exclude<keyof SiteDetailResponse, 'resolved_address'>;

export const BLOCK_FETCHERS: Record<
  BlockKey,
  (addr: ResolvedAddress) => Promise<ProviderResult<unknown>>
> = {
  zoning: (a) => registry.zoning.getZoning(a),
  permits: (a) => registry.permits.getPermits(a),
  opportunity_zone: (a) => registry.opportunityZones.getOpportunityZone(a),
  proforma: (a) => registry.proformaBenchmark.getBenchmarks(a),
  flood: (a) => registry.flood.getFloodZone(a),
  flood_zones: (a) => registry.flood.getFloodZones(a),
  demographics: (a) => registry.demographics.getDemographics(a),
  hpi: (a) => registry.hpi.getHpi(a),
  mls_comps: (a) => registry.mlsComps.getComps(a),
  crime: (a) => registry.crime.getCrimeStats(a),
  building_violations: (a) => registry.buildingViolations.getViolations(a),
  landlord_portfolio: (a) => registry.landlordPortfolio.getPortfolio(a),
  mortgage_demand: (a) => registry.mortgageDemand.getMortgageDemand(a),
  employment: (a) => registry.employment.getEmployment(a),
  migration: (a) => registry.migration.getMigration(a),
  contamination: (a) => registry.contamination.getContamination(a),
  seismic: (a) => registry.seismic.getSeismic(a),
  disaster_history: (a) => registry.disasterHistory.getDisasterHistory(a),
  climate: (a) => registry.climate.getClimate(a),
  costar_deals: (a) => registry.costarDeals.getDeals(a),
  assemblage: (a) => registry.assemblage.getAssemblage(a),
  entitlement: (a) => registry.entitlement.getEntitlement(a),
};

export const VALID_BLOCKS = Object.keys(BLOCK_FETCHERS) as BlockKey[];

export function toBlock<T>(r: ProviderResult<T>): SiteDetailBlock<T> {
  return {
    ok: r.ok,
    data: r.data,
    provenance: r.provenance,
    source: r.source,
    fetched_at: r.fetched_at,
    ...(r.swap_note ? { swap_note: r.swap_note } : {}),
    ...(r.error ? { error: r.error } : {}),
  };
}

// Fetch a set of blocks for one already-resolved address, in parallel, each
// wrapped in the client-safe SiteDetailBlock envelope keyed by block name.
export async function fetchBlocks(
  addr: ResolvedAddress,
  blocks: BlockKey[],
): Promise<Record<BlockKey, SiteDetailBlock<unknown>>> {
  const results = await Promise.all(blocks.map((b) => BLOCK_FETCHERS[b](addr)));
  const out = {} as Record<BlockKey, SiteDetailBlock<unknown>>;
  blocks.forEach((b, i) => {
    out[b] = toBlock(results[i]);
  });
  return out;
}
