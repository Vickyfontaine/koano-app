// KOANO portfolio properties API — Checkpoint 4, Cluster 5.
// GET → the user's tracked properties, each joined to its latest verdict.
// POST { address } → geocode server-side and add to the portfolio.
// DELETE ?id= → remove a tracked property (verdicts are never deleted —
// the audit trail is append-only).
// Clerk-protected; rows are scoped to the requesting user.

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { registry } from '../../../../lib/providers/registry';
import type { AddressCandidate } from '../../../../lib/providers/types';
import { supabaseAdmin } from '../../../../lib/supabase/server';
import { requireApproved } from '../../../../lib/koano-guard';

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
export const maxDuration = 60;

export interface PortfolioProperty {
  id: string;
  address_input: string;
  address_normalized: string | null;
  bbl: string | null;
  borough: string | null;
  tract_geoid: string | null;
  latitude: number | null;
  longitude: number | null;
  // 'confirmed' | 'unconfirmed' when captured; null for rows added before the
  // coordinate-confidence field existed (the map treats null as "unverified").
  location_confidence: "confirmed" | "unconfirmed" | null;
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

  // location_confidence (migration-017) may not exist yet — degrade gracefully so
  // a build/migration ordering can never break the portfolio load. latitude and
  // longitude are base columns (schema.sql) and are always safe to select.
  const SELECT_FULL =
    'id, address_input, address_normalized, bbl, tract_geoid, latitude, longitude, location_confidence, created_at';
  const SELECT_BASE =
    'id, address_input, address_normalized, bbl, tract_geoid, latitude, longitude, created_at';
  const propsQuery = (cols: string) =>
    supabaseAdmin()
      .from('properties')
      .select(cols)
      .eq('clerk_user_id', userId)
      .order('created_at', { ascending: true });

  const [propsInit, verdictsRes] = await Promise.all([
    propsQuery(SELECT_FULL),
    supabaseAdmin()
      .from('verdicts')
      .select('bbl, address_normalized, verdict, confidence, risk_score, overall_provenance, headline, created_at')
      .eq('clerk_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(200),
  ]);
  let propsRes = propsInit;
  if (propsRes.error && /location_confidence/.test(propsRes.error.message)) {
    propsRes = await propsQuery(SELECT_BASE); // pre-migration-017
  }

  if (propsRes.error) return NextResponse.json({ error: propsRes.error.message }, { status: 500 });
  if (verdictsRes.error) return NextResponse.json({ error: verdictsRes.error.message }, { status: 500 });

  const verdicts = verdictsRes.data ?? [];
  const properties: PortfolioProperty[] = ((propsRes.data ?? []) as unknown as Record<string, unknown>[]).map((p) => {
    const bbl = (p.bbl as string | null) ?? null;
    const address_normalized = (p.address_normalized as string | null) ?? null;
    const latest = verdicts.find(
      (v) =>
        (bbl && v.bbl === bbl) ||
        (address_normalized && v.address_normalized === address_normalized),
    );
    const lc = p.location_confidence as string | null | undefined;
    return {
      id: p.id as string,
      address_input: p.address_input as string,
      address_normalized,
      bbl,
      borough: null,
      tract_geoid: (p.tract_geoid as string | null) ?? null,
      latitude: typeof p.latitude === "number" ? p.latitude : null,
      longitude: typeof p.longitude === "number" ? p.longitude : null,
      location_confidence: lc === "confirmed" || lc === "unconfirmed" ? lc : null,
      created_at: p.created_at as string,
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

  let body: { address?: unknown; candidate?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  // A chosen disambiguation candidate re-derives its BBL server-side; a raw
  // address is geocoded normally.
  const candidate = isCandidate(body.candidate) ? body.candidate : null;
  const address = typeof body.address === 'string' ? body.address.trim() : '';
  if (!candidate && !address) {
    return NextResponse.json({ error: '"address" or "candidate" is required' }, { status: 400 });
  }
  const addressInput = candidate ? candidate.label : address;

  const geo = candidate
    ? await registry.geocode.resolveCandidate(candidate)
    : await registry.geocode.resolve(address);
  if (!geo.ok || !geo.data) {
    return NextResponse.json(
      { error: `Geocoding failed for "${addressInput}": ${geo.error ?? 'no data'}` },
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

  const baseInsert = {
    clerk_user_id: userId,
    address_input: addressInput,
    address_normalized: addr.normalized,
    bbl: addr.bbl,
    bin: addr.bin,
    tract_geoid: addr.tract_geoid,
    zip: addr.zip,
    latitude: addr.latitude,
    longitude: addr.longitude,
  };
  const doInsert = (obj: Record<string, unknown>) =>
    supabaseAdmin()
      .from('properties')
      .insert(obj)
      .select('id, address_input, address_normalized, bbl, tract_geoid, created_at')
      .single();

  // Store the coordinate confidence; degrade if migration-017 isn't applied yet.
  let { data, error } = await doInsert({ ...baseInsert, location_confidence: addr.location_confidence });
  if (error && /location_confidence/.test(error.message)) {
    ({ data, error } = await doInsert(baseInsert));
  }

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
