// KOANO monitoring settings API — Clerk-scoped. Preferences + the watched-property
// list with active/paused status against the plan cap. Monitoring is a paid
// feature (free cap = 0); the client renders it disabled with an upgrade prompt.
//   GET   → { plan, cap, active_count, watched_count, preferences, properties[] }
//   PUT   → update preferences
//   PATCH → { property_id, monitoring_enabled } toggle a watch

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '../../../../lib/supabase/server';
import { resolvePlan, monitoringCap } from '../../../../lib/koano-guard';

export const dynamic = 'force-dynamic';

const SEVERITIES = ['info', 'material', 'high'];
const FREQUENCIES = ['weekly', 'off'];

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = supabaseAdmin();
  const plan = await resolvePlan(userId);
  const cap = monitoringCap(plan);

  const [prefRes, propsRes] = await Promise.all([
    admin.from('monitoring_preferences').select('email_enabled, inapp_enabled, frequency, muted_signal_types, min_severity').eq('clerk_user_id', userId).maybeSingle(),
    admin.from('properties').select('id, address_normalized, address_input, bbl, monitoring_enabled, created_at').eq('clerk_user_id', userId).order('created_at', { ascending: true }),
  ]);

  const preferences = prefRes.data ?? { email_enabled: true, inapp_enabled: true, frequency: 'weekly', muted_signal_types: [], min_severity: 'material' };

  // Active = the first `cap` monitoring_enabled properties (oldest-watched).
  let enabledSeen = 0;
  const properties = (propsRes.data ?? []).map((p) => {
    const watched = !!p.monitoring_enabled;
    const active = watched && enabledSeen < cap;
    if (watched) enabledSeen += 1;
    return {
      id: p.id as string,
      address: (p.address_normalized as string) || (p.address_input as string),
      bbl: (p.bbl as string) ?? null,
      monitoring_enabled: watched,
      active, // false + watched = paused (over cap)
    };
  });

  return NextResponse.json({
    plan,
    cap,
    active_count: properties.filter((p) => p.active).length,
    watched_count: properties.filter((p) => p.monitoring_enabled).length,
    preferences,
    properties,
  });
}

export async function PUT(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (monitoringCap(await resolvePlan(userId)) <= 0) {
    return NextResponse.json({ error: 'Monitoring is a paid feature. Upgrade to a paid plan to enable it.' }, { status: 402 });
  }

  const b = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const row: Record<string, unknown> = { clerk_user_id: userId, updated_at: new Date().toISOString() };
  if (typeof b.email_enabled === 'boolean') row.email_enabled = b.email_enabled;
  if (typeof b.inapp_enabled === 'boolean') row.inapp_enabled = b.inapp_enabled;
  if (typeof b.frequency === 'string' && FREQUENCIES.includes(b.frequency)) row.frequency = b.frequency;
  if (typeof b.min_severity === 'string' && SEVERITIES.includes(b.min_severity)) row.min_severity = b.min_severity;
  if (Array.isArray(b.muted_signal_types)) row.muted_signal_types = (b.muted_signal_types as unknown[]).map(String);

  const { error } = await supabaseAdmin().from('monitoring_preferences').upsert(row, { onConflict: 'clerk_user_id' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const b = (await req.json().catch(() => ({}))) as { property_id?: string; monitoring_enabled?: boolean };
  if (!b.property_id || typeof b.monitoring_enabled !== 'boolean') {
    return NextResponse.json({ error: 'Provide { property_id, monitoring_enabled }' }, { status: 400 });
  }
  const { error } = await supabaseAdmin()
    .from('properties')
    .update({ monitoring_enabled: b.monitoring_enabled })
    .eq('id', b.property_id)
    .eq('clerk_user_id', userId); // scope to the requesting user's own property
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
