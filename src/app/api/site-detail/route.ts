// KOANO site-detail API — Checkpoints 3–4 (Phase B).
// POST { address, blocks? } → raw provider facts for one property, straight
// through the provider interfaces (no LLM). Each requested block keeps its
// full provenance envelope — the UI badges anything not live.
// blocks defaults to the Cluster 4 bundle (zoning, permits, opportunity_zone,
// proforma); other clusters request their own bundles (flood, demographics,
// hpi, mls_comps, crime, search_trends, foot_traffic, premium_hazard,
// costar_deals). Fast (~seconds); the verdict pipeline runs separately.

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { registry } from '../../../../lib/providers/registry';
import type {
  AcsDemographics,
  CostarDealsSummary,
  CrimeStats,
  FloodInfo,
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
} from '../../../../lib/providers/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

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
  search_trends?: SiteDetailBlock<SearchTrendsInfo>;
  foot_traffic?: SiteDetailBlock<FootTrafficInfo>;
  premium_hazard?: SiteDetailBlock<PremiumHazardInfo>;
  costar_deals?: SiteDetailBlock<CostarDealsSummary>;
}

type BlockKey = Exclude<keyof SiteDetailResponse, 'resolved_address'>;

const BLOCK_FETCHERS: Record<
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
  search_trends: (a) => registry.searchTrends.getSearchTrends(a),
  foot_traffic: (a) => registry.footTraffic.getFootTraffic(a),
  premium_hazard: (a) => registry.premiumHazard.getHazards(a),
  costar_deals: (a) => registry.costarDeals.getDeals(a),
};

const VALID_BLOCKS = Object.keys(BLOCK_FETCHERS) as BlockKey[];
const DEFAULT_BLOCKS: BlockKey[] = ['zoning', 'permits', 'opportunity_zone', 'proforma'];

function toBlock<T>(r: ProviderResult<T>): SiteDetailBlock<T> {
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

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { address?: unknown; blocks?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const address = typeof body.address === 'string' ? body.address.trim() : '';
  if (!address) {
    return NextResponse.json({ error: '"address" is required' }, { status: 400 });
  }

  let blocks: BlockKey[] = DEFAULT_BLOCKS;
  if (body.blocks !== undefined) {
    if (
      !Array.isArray(body.blocks) ||
      body.blocks.length === 0 ||
      !body.blocks.every((b): b is BlockKey => typeof b === 'string' && (VALID_BLOCKS as string[]).includes(b))
    ) {
      return NextResponse.json(
        { error: `"blocks" must be a non-empty array from: ${VALID_BLOCKS.join(', ')}` },
        { status: 400 },
      );
    }
    blocks = Array.from(new Set(body.blocks));
  }

  const geo = await registry.geocode.resolve(address);
  if (!geo.ok || !geo.data) {
    return NextResponse.json(
      { error: `Geocoding failed for "${address}": ${geo.error ?? 'no data'}` },
      { status: 422 },
    );
  }
  const addr = geo.data;

  const results = await Promise.all(blocks.map((b) => BLOCK_FETCHERS[b](addr)));

  const response: SiteDetailResponse = {
    resolved_address: {
      input: addr.input,
      normalized: addr.normalized,
      bbl: addr.bbl,
      borough: addr.borough,
      tract_geoid: addr.tract_geoid,
    },
  };
  blocks.forEach((b, i) => {
    // Every block shares the SiteDetailBlock envelope; assignment is safe.
    (response as Record<BlockKey, SiteDetailBlock<unknown>>)[b] = toBlock(results[i]);
  });

  return NextResponse.json(response);
}
