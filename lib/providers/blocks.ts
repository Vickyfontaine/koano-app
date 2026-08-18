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
  CostarDealsSummary,
  CrimeStats,
  EntitlementSummary,
  FloodInfo,
  LandlordPortfolioSummary,
  FootTrafficInfo,
  HpiTrend,
  MlsCompsSummary,
  OpportunityZoneInfo,
  PermitsSummary,
  PremiumHazardInfo,
  ProformaBenchmark,
  ProviderResult,
  Provenance,
  ResolvedAddress,
  SearchTrendsInfo,
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
  };
  zoning?: SiteDetailBlock<ZoningInfo>;
  permits?: SiteDetailBlock<PermitsSummary>;
  opportunity_zone?: SiteDetailBlock<OpportunityZoneInfo>;
  proforma?: SiteDetailBlock<ProformaBenchmark>;
  flood?: SiteDetailBlock<FloodInfo>;
  demographics?: SiteDetailBlock<AcsDemographics>;
  hpi?: SiteDetailBlock<HpiTrend>;
  mls_comps?: SiteDetailBlock<MlsCompsSummary>;
  crime?: SiteDetailBlock<CrimeStats>;
  building_violations?: SiteDetailBlock<BuildingViolationsSummary>;
  landlord_portfolio?: SiteDetailBlock<LandlordPortfolioSummary>;
  search_trends?: SiteDetailBlock<SearchTrendsInfo>;
  foot_traffic?: SiteDetailBlock<FootTrafficInfo>;
  premium_hazard?: SiteDetailBlock<PremiumHazardInfo>;
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
  demographics: (a) => registry.demographics.getDemographics(a),
  hpi: (a) => registry.hpi.getHpi(a),
  mls_comps: (a) => registry.mlsComps.getComps(a),
  crime: (a) => registry.crime.getCrimeStats(a),
  building_violations: (a) => registry.buildingViolations.getViolations(a),
  landlord_portfolio: (a) => registry.landlordPortfolio.getPortfolio(a),
  search_trends: (a) => registry.searchTrends.getSearchTrends(a),
  foot_traffic: (a) => registry.footTraffic.getFootTraffic(a),
  premium_hazard: (a) => registry.premiumHazard.getHazards(a),
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
