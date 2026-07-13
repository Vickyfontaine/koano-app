// KOANO portfolio properties API — Checkpoint 4, Cluster 5.
// GET → the user's tracked properties, each joined to its latest verdict.
// POST { address } → geocode server-side and add to the portfolio.
// DELETE ?id= → remove a tracked property (verdicts are never deleted —
// the audit trail is append-only).
// Clerk-protected; rows are scoped to the requesting user.

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { registry } from '../../../../lib/providers/registry';
import { supabaseAdmin } from '../../../../lib/supabase/server';
import { requireApproved } from '../../../../lib/koano-guard';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export interface PortfolioProperty {
  id: string;
  address_input: string;
  address_normalized: string | null;
  bbl: string | null;
  borough: string | null;
  tract_geoid: string | null;
  created_at: string;
  latest_verdict: {
    verdict: string;
    confidence: number;
    risk_score: number;
    overall_provenance: 'live' | 'representative';
    headline: string;
    created_at: string;
  } | null;
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const denied = await requireApproved(userId);
  if (denied) return NextResponse.json(denied.body, { status: denied.status });

  const [propsRes, verdictsRes] = await Promise.all([
    supabaseAdmin()
      .from('properties')
      .select('id, address_input, address_normalized, bbl, tract_geoid, created_at')
      .eq('clerk_user_id', userId)
      .order('created_at', { ascending: true }),
    supabaseAdmin()
      .from('verdicts')
      .select('bbl, address_normalized, verdict, confidence, risk_score, overall_provenance, headline, created_at')
      .eq('clerk_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(200),
  ]);

  if (propsRes.error) return NextResponse.json({ error: propsRes.error.message }, { status: 500 });
  if (verdictsRes.error) return NextResponse.json({ error: verdictsRes.error.message }, { status: 500 });

  const verdicts = verdictsRes.data ?? [];
  const properties: PortfolioProperty[] = (propsRes.data ?? []).map((p) => {
    const latest = verdicts.find(
      (v) =>
        (p.bbl && v.bbl === p.bbl) ||
        (p.address_normalized && v.address_normalized === p.address_normalized),
    );
    return {
      id: p.id,
      address_input: p.address_input,
      address_normalized: p.address_normalized,
      bbl: p.bbl,
      borough: null,
      tract_geoid: p.tract_geoid,
      created_at: p.created_at,
      latest_verdict: latest
        ? {
            verdict: latest.verdict,
            confidence: latest.confidence,
            risk_score: latest.risk_score,
            overall_provenance: latest.overall_provenance,
            headline: latest.headline,
            created_at: latest.created_at,
          }
        : null,
    };
  });

  return NextResponse.json({ properties });
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const denied = await requireApproved(userId);
  if (denied) return NextResponse.json(denied.body, { status: denied.status });

  let body: { address?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const address = typeof body.address === 'string' ? body.address.trim() : '';
  if (!address) return NextResponse.json({ error: '"address" is required' }, { status: 400 });

  const geo = await registry.geocode.resolve(address);
  if (!geo.ok || !geo.data) {
    return NextResponse.json(
      { error: `Geocoding failed for "${address}": ${geo.error ?? 'no data'}` },
      { status: 422 },
    );
  }
  const addr = geo.data;

  // No duplicates: same BBL (or, lacking a BBL, same normalized address)
  // already tracked. Plain .eq filters — .or() breaks on commas in addresses.
  let dupQuery = supabaseAdmin().from('properties').select('id').eq('clerk_user_id', userId);
  dupQuery = addr.bbl
    ? dupQuery.eq('bbl', addr.bbl)
    : dupQuery.eq('address_normalized', addr.normalized);
  const { data: existing, error: dupError } = await dupQuery.limit(1);
  if (dupError) {
    return NextResponse.json({ error: dupError.message }, { status: 500 });
  }
  if (existing && existing.length > 0) {
    return NextResponse.json({ error: 'This property is already in your portfolio' }, { status: 409 });
  }

  const { data, error } = await supabaseAdmin()
    .from('properties')
    .insert({
      clerk_user_id: userId,
      address_input: address,
      address_normalized: addr.normalized,
      bbl: addr.bbl,
      bin: addr.bin,
      tract_geoid: addr.tract_geoid,
      latitude: addr.latitude,
      longitude: addr.longitude,
    })
    .select('id, address_input, address_normalized, bbl, tract_geoid, created_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ property: data });
}

export async function DELETE(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const denied = await requireApproved(userId);
  if (denied) return NextResponse.json(denied.body, { status: denied.status });

  const id = new URL(req.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: '"id" query param is required' }, { status: 400 });

  const { error } = await supabaseAdmin()
    .from('properties')
    .delete()
    .eq('id', id)
    .eq('clerk_user_id', userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deleted: true });
}
