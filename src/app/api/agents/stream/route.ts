// KOANO streaming agents API — Checkpoint 2 (Phase B).
// POST { address } → NDJSON stream (one JSON object per line):
//   { type: "start", agents: [...] }
//   { type: "geocoded", normalized, bbl }
//   { type: "agent_complete", agent, verdict, confidence, overall_provenance }   × 5
//   { type: "synthesis_start" }
//   { type: "complete", resolved_address, verdict, persisted, persist_error }
//   { type: "error", error }
// Every event reflects a REAL pipeline completion — the loading UI never
// simulates progress. Clerk-protected: unauthenticated requests get 401.

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { runKoanoPipeline, runKoanoPipelineForAddress } from '../../../../../lib/agents/synthesis';
import { persistVerdict } from '../../../../../lib/supabase/verdicts';
import { guardSpend } from '../../../../../lib/koano-guard';
import { registry } from '../../../../../lib/providers/registry';
import type { AddressCandidate, ResolvedAddress } from '../../../../../lib/providers/types';

function isCandidate(v: unknown): v is AddressCandidate {
  if (!v || typeof v !== 'object') return false;
  const c = v as Record<string, unknown>;
  return (
    typeof c.id === 'string' &&
    typeof c.label === 'string' &&
    typeof c.latitude === 'number' &&
    Number.isFinite(c.latitude) &&
    typeof c.longitude === 'number' &&
    Number.isFinite(c.longitude)
  );
}

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // full pipeline runs ~60s

const AGENTS = [
  'market-timing',
  'infrastructure',
  'demand-sentiment',
  'risk-volatility',
  'regulatory-policy',
] as const;

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { address?: unknown; candidate?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  // Either a raw address (geocoded here) OR a chosen disambiguation candidate
  // (BBL re-derived server-side, never trusted from the client).
  const candidate = isCandidate(body.candidate) ? body.candidate : null;
  const address = typeof body.address === 'string' ? body.address.trim() : '';
  if (!candidate && !address) {
    return NextResponse.json({ error: '"address" or "candidate" is required' }, { status: 400 });
  }
  const addressInput = candidate ? candidate.label : address;

  // Spend guard BEFORE the stream opens: approval + per-user rate limit +
  // global circuit breaker. A Cluster 4 comparison issues one request per
  // site, so each site consumes one verdict-run slot.
  const guard = await guardSpend({ userId, kind: 'verdict', route: '/api/agents/stream' });
  if (!guard.ok) {
    return NextResponse.json(guard.body, { status: guard.status });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: object) => {
        controller.enqueue(encoder.encode(JSON.stringify(event) + '\n'));
      };

      send({ type: 'start', agents: AGENTS });
      try {
        let resolved: ResolvedAddress | null = null;
        if (candidate) {
          // Re-derive the confirmed address (with BBL) from the user's pick,
          // server-side. If the pick can't resolve, fail loudly — never fall back
          // to a raw re-geocode that could re-ambiguate.
          const rc = await registry.geocode.resolveCandidate(candidate);
          if (!rc.ok || !rc.data) {
            throw new Error(rc.error ?? 'Could not resolve the selected address');
          }
          resolved = rc.data;
        }
        const { resolved_address, verdict } = resolved
          ? await runKoanoPipelineForAddress(resolved, send)
          : await runKoanoPipeline(address, send);
        const { persisted, persist_error } = await persistVerdict({
          clerkUserId: userId,
          addressInput,
          resolvedAddress: resolved_address,
          verdict,
        });
        send({
          type: 'complete',
          resolved_address: {
            input: resolved_address.input,
            normalized: resolved_address.normalized,
            bbl: resolved_address.bbl,
            tract_geoid: resolved_address.tract_geoid,
            location_confidence: resolved_address.location_confidence,
          },
          verdict,
          persisted,
          persist_error,
        });
      } catch (e) {
        send({ type: 'error', error: e instanceof Error ? e.message : 'pipeline failed' });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
    },
  });
}
