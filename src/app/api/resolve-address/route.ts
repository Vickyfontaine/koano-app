// KOANO address-resolution API — the single interactive resolve step.
// POST { address }   → { status: 'resolved', address }        (one confident match)
//                     | { status: 'ambiguous', candidates }    (>2 km NYC disagreement)
//                     | { status: 'none', error }              (no match)
// POST { candidate } → { status: 'resolved', address }         (user's pick, BBL
//                       re-derived SERVER-SIDE from the selected point)
//
// This is where a raw address becomes a confident building (or a choice). The
// verdict/site-detail/narrative endpoints do NOT trust a client-supplied resolved
// address — when the user disambiguates, each RE-DERIVES from the candidate. The
// defensible audit story is "the server derived this BBL," never the browser's.

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { requireApproved } from '../../../../lib/koano-guard';
import { registry } from '../../../../lib/providers/registry';
import type { AddressCandidate } from '../../../../lib/providers/types';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

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

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const denied = await requireApproved(userId);
  if (denied) return NextResponse.json(denied.body, { status: denied.status });

  let body: { address?: unknown; candidate?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  // Candidate selection → re-derive the confirmed address (server owns the BBL).
  if (body.candidate !== undefined) {
    if (!isCandidate(body.candidate)) {
      return NextResponse.json({ error: 'Invalid "candidate"' }, { status: 400 });
    }
    const rc = await registry.geocode.resolveCandidate(body.candidate);
    if (!rc.ok || !rc.data) {
      return NextResponse.json(
        { status: 'none', error: rc.error ?? 'Could not resolve the selected candidate' },
        { status: 200 },
      );
    }
    return NextResponse.json({ status: 'resolved', address: rc.data });
  }

  const address = typeof body.address === 'string' ? body.address.trim() : '';
  if (!address) {
    return NextResponse.json({ error: '"address" or "candidate" is required' }, { status: 400 });
  }

  const r = await registry.geocode.resolveDetailed(address);
  if (r.kind === 'resolved') return NextResponse.json({ status: 'resolved', address: r.address });
  if (r.kind === 'ambiguous') return NextResponse.json({ status: 'ambiguous', candidates: r.candidates });
  return NextResponse.json({ status: 'none', error: r.error });
}
