// KOANO agents API — Step 6.
// POST { address } → runs the full 5-agent + synthesis pipeline server-side,
// persists the verdict to Supabase, returns the unified KoanoVerdict.
// Clerk-protected: unauthenticated requests get 401.

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { runKoanoPipeline } from '../../../../lib/agents/synthesis';
import { persistVerdict } from '../../../../lib/supabase/verdicts';
import { guardSpend } from '../../../../lib/koano-guard';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // full pipeline runs ~60s

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { address?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const address = typeof body.address === 'string' ? body.address.trim() : '';
  if (!address) {
    return NextResponse.json({ error: '"address" is required' }, { status: 400 });
  }

  // Spend guard: approval + per-user rate limit + global circuit breaker.
  const guard = await guardSpend({ userId, kind: 'verdict', route: '/api/agents' });
  if (!guard.ok) {
    return NextResponse.json(guard.body, { status: guard.status });
  }

  let result;
  try {
    result = await runKoanoPipeline(address);
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'pipeline failed';
    return NextResponse.json({ error: msg }, { status: 422 });
  }
  const { resolved_address, verdict } = result;

  // Persist (append-only verdicts table — Step 7 schema). If the insert fails,
  // still return the verdict but flag that persistence failed.
  const { persisted, persist_error } = await persistVerdict({
    clerkUserId: userId,
    addressInput: address,
    resolvedAddress: resolved_address,
    verdict,
  });

  return NextResponse.json({
    resolved_address: {
      input: resolved_address.input,
      normalized: resolved_address.normalized,
      bbl: resolved_address.bbl,
      tract_geoid: resolved_address.tract_geoid,
    },
    verdict,
    persisted,
    persist_error,
  });
}
