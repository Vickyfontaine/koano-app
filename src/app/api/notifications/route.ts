// KOANO monitoring — in-app notifications feed. Clerk-protected, scoped to the
// requesting user. Notifications are produced by the deterministic weekly monitor
// (free — no spend), so this is auth-only.
//   GET  [?property_id=…&limit=N] → the user's notifications (newest first) + unread count
//   PATCH { id } | { all: true }  → mark read

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '../../../../lib/supabase/server';

export const dynamic = 'force-dynamic';

export interface NotificationRow {
  id: string;
  property_id: string | null;
  bbl: string | null;
  signal_type: string;
  severity: 'info' | 'material' | 'high';
  title: string;
  body: string;
  data: Record<string, unknown>;
  link_path: string | null;
  read_at: string | null;
  created_at: string;
}

export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const propertyId = url.searchParams.get('property_id');
  const bbl = url.searchParams.get('bbl');
  const limit = Math.min(Number(url.searchParams.get('limit') ?? 100), 200);

  const admin = supabaseAdmin();
  let q = admin
    .from('notifications')
    .select('id, property_id, bbl, signal_type, severity, title, body, data, link_path, read_at, created_at')
    .eq('clerk_user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (propertyId) q = q.eq('property_id', propertyId);
  if (bbl) q = q.eq('bbl', bbl);

  const [listRes, unreadRes] = await Promise.all([
    q,
    admin.from('notifications').select('id', { count: 'exact', head: true }).eq('clerk_user_id', userId).is('read_at', null),
  ]);
  if (listRes.error) return NextResponse.json({ error: listRes.error.message }, { status: 500 });

  return NextResponse.json({
    notifications: (listRes.data ?? []) as NotificationRow[],
    unread_count: unreadRes.count ?? 0,
  });
}

export async function PATCH(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { id?: string; all?: boolean };
  const admin = supabaseAdmin();
  const now = new Date().toISOString();

  // Always scope the update to the requesting user's own rows.
  let q = admin.from('notifications').update({ read_at: now }).eq('clerk_user_id', userId).is('read_at', null);
  if (body.id) q = q.eq('id', body.id);
  else if (!body.all) return NextResponse.json({ error: 'Provide { id } or { all: true }' }, { status: 400 });

  const { error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
