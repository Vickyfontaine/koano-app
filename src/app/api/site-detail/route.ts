// KOANO site-detail API — Checkpoints 3–4 (Phase B).
// POST { address, blocks? } → raw provider facts for one property, straight
// through the provider interfaces (no LLM). Each requested block keeps its
// full provenance envelope — the UI badges anything not live.
// blocks defaults to the Cluster 4 bundle (zoning, permits, opportunity_zone,
// proforma); other clusters request their own bundles (flood, demographics,
// hpi, mls_comps, crime, search_trends, foot_traffic, contamination, seismic,
// disaster_history, climate, costar_deals). Fast (~seconds); the verdict
// pipeline runs separately.

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { requireApproved } from '../../../../lib/koano-guard';
import { registry } from '../../../../lib/providers/registry';
import {
  BLOCK_FETCHERS,
  VALID_BLOCKS,
  toBlock,
  type BlockKey,
  type SiteDetailBlock,
  type SiteDetailResponse,
} from '../../../../lib/providers/blocks';

// Re-exported so existing dashboard panels keep importing these from the route.
// The definitions now live in lib/providers/blocks.ts (shared with the document
// engine's assembler), so there is one data path, never two.
export type { SiteDetailBlock, SiteDetailResponse };

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const DEFAULT_BLOCKS: BlockKey[] = ['zoning', 'permits', 'opportunity_zone', 'proforma'];

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const denied = await requireApproved(userId);
  if (denied) return NextResponse.json(denied.body, { status: denied.status });

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
