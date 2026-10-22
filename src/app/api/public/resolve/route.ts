// Public address check for the homepage hero (UI sprint WS2).
// POST { address } → { status: 'resolved', normalized, bbl, borough, lat, lon, example }
//                  | { status: 'ambiguous', candidates: [{ id, label, borough, zip }] }
//                  | { status: 'none', error }
//
// Unauthenticated by design: it ONLY resolves an address to a lot (the same
// geocoder the product uses) so a visitor sees that KOANO found their building
// and is invited to create an account to run the five agents on it. It never
// runs an agent, never returns a verdict, never fabricates anything; the one
// address it can show a result for is the recorded example (flagged `example`).
// Rate-limited per IP in memory (best effort per instance) so the geocoder
// cannot be used as a free bulk service.

import { NextResponse } from 'next/server';
import { registry } from '../../../../../lib/providers/registry';

export const dynamic = 'force-dynamic';
export const maxDuration = 20;

const EXAMPLE_BBL = '3009720058'; // 175 3rd Street, Brooklyn — the recorded example run
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 12;
const hits = new Map<string, number[]>();

function limited(ip: string): boolean {
  const now = Date.now();
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (arr.length >= MAX_PER_WINDOW) {
    hits.set(ip, arr);
    return true;
  }
  arr.push(now);
  hits.set(ip, arr);
  if (hits.size > 5000) hits.clear();
  return false;
}

export async function POST(req: Request) {
  const ip = (req.headers.get('x-forwarded-for') ?? 'local').split(',')[0].trim();
  if (limited(ip)) {
    return NextResponse.json({ status: 'none', error: 'Too many checks from this connection. Try again in a minute.' }, { status: 429 });
  }
  let body: { address?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const address = typeof body.address === 'string' ? body.address.trim().slice(0, 200) : '';
  if (address.length < 5) return NextResponse.json({ status: 'none', error: 'Enter a street address.' });

  const r = await registry.geocode.resolveDetailed(address);
  if (r.kind === 'resolved') {
    const a = r.address;
    return NextResponse.json({
      status: 'resolved',
      normalized: a.normalized,
      bbl: a.bbl,
      borough: a.borough,
      lat: a.latitude,
      lon: a.longitude,
      nyc: !!a.bbl,
      example: a.bbl === EXAMPLE_BBL,
    });
  }
  if (r.kind === 'ambiguous') {
    return NextResponse.json({
      status: 'ambiguous',
      candidates: r.candidates.slice(0, 4).map((c) => ({ id: c.id, label: c.label, borough: c.borough, zip: c.zip })),
    });
  }
  return NextResponse.json({ status: 'none', error: r.error });
}
