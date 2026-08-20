// KOANO monitoring — the scan stage. Runs on EACH daily shard, right after that
// shard's properties are captured, so "current" is genuinely current (not a
// weekly pass that would diff late-shard properties against stale data).
//
// DIFF RULE (general, not a special case): for each (scope, dataset) compare the
// TWO MOST RECENT snapshots, whatever their dates — a property is captured only
// on its shard-day, and EPA contamination snapshots can be weeks apart, so
// "this week vs last week" by calendar is meaningless. The actual snapshot dates
// are carried into every notification as the comparison window.
//
// FRESH-THIS-WEEK GUARD: only fire when the most-recent snapshot's captured_week
// is this run's week. For always-write datasets that's automatic (captured this
// shard-day); for capture-if-changed datasets (contamination/comp/disaster) it
// means "the value actually changed this week" — which stops a weekly re-fire of
// an old change whose two-most-recent snapshots never move.
//
// Detection is deterministic (lib/monitor/detect) — no model call, no allowance.

import type { SupabaseClient } from '@supabase/supabase-js';
import type { MonitoredProperty } from '../archive/capture';
import {
  detectViolations, detectOwnership, detectFilings, detectContamination, detectDisaster, detectComp,
  renderNotification,
  type RawChange, type ViolationsData, type LandlordData, type FilingsData,
  type ContaminationData, type DisasterData, type CompData,
} from './detect';

interface Snap { captured_week: string; data: Record<string, unknown> }
const CONFLICT = 'clerk_user_id,property_id,signal_type,captured_week';

async function twoMostRecent(
  admin: SupabaseClient, dataset: string, scopeType: string, scopeKey: string,
): Promise<{ prior: Snap; current: Snap } | null> {
  const { data } = await admin
    .from('archive_snapshots')
    .select('captured_week, data')
    .eq('dataset', dataset).eq('scope_type', scopeType).eq('scope_key', scopeKey)
    .order('captured_week', { ascending: false })
    .limit(2);
  const rows = (data ?? []) as Snap[];
  return rows.length < 2 ? null : { current: rows[0], prior: rows[1] };
}

function mapRow(p: Record<string, unknown>): MonitoredProperty {
  return {
    id: p.id as string, clerk_user_id: p.clerk_user_id as string,
    bbl: (p.bbl as string) ?? null, tract_geoid: (p.tract_geoid as string) ?? null, zip: (p.zip as string) ?? null,
  };
}

async function monitoredInScope(admin: SupabaseClient, kind: 'county' | 'zip', key: string): Promise<MonitoredProperty[]> {
  let q = admin.from('properties').select('id, clerk_user_id, bbl, tract_geoid, zip').eq('monitoring_enabled', true);
  q = kind === 'zip' ? q.eq('zip', key) : q.like('tract_geoid', `${key}%`); // county = first 5 of the 11-digit tract GEOID
  const { data } = await q;
  return (data ?? []).map(mapRow);
}

async function latestVerdict(admin: SupabaseClient, bbl: string | null): Promise<string | null> {
  if (!bbl) return null;
  const { data } = await admin
    .from('verdicts').select('verdict').eq('bbl', bbl)
    .order('created_at', { ascending: false }).limit(1).maybeSingle();
  return (data?.verdict as string) ?? null;
}

export interface MonitorResult { propertiesChecked: number; changesDetected: number; notificationsCreated: number }

export async function scanMonitoring(
  admin: SupabaseClient, runWeek: string, shardRows: MonitoredProperty[],
): Promise<MonitorResult> {
  let changesDetected = 0;
  let notificationsCreated = 0;
  // Properties that saw a material/high change → candidates for verdict_data_change.
  const material = new Map<string, { prop: MonitoredProperty; signals: Set<string> }>();

  const emit = async (prop: MonitoredProperty, ch: RawChange, pair: { prior: Snap; current: Snap }) => {
    const { title, body } = renderNotification(ch);
    const rec = {
      clerk_user_id: prop.clerk_user_id,
      property_id: prop.id,
      bbl: prop.bbl,
      signal_type: ch.signal_type,
      severity: ch.severity,
      title,
      body,
      before_value: ch.before === null ? null : String(ch.before),
      after_value: ch.after === null ? null : String(ch.after),
      // window = the actual snapshot dates being compared (verbatim), so the user
      // can see the comparison window even when it isn't "last week".
      data: { ...ch.facts, window_from: pair.prior.captured_week, window_to: pair.current.captured_week },
      captured_week: runWeek,
      link_path: `/dashboard/property/${prop.id}`,
      email_status: 'pending',
    };
    const { error } = await admin.from('notifications').upsert(rec, { onConflict: CONFLICT, ignoreDuplicates: true });
    if (error) throw new Error(`notification upsert: ${error.message}`);
    changesDetected += 1;
    notificationsCreated += 1;
    if (ch.severity !== 'info') {
      const e = material.get(prop.id) ?? { prop, signals: new Set<string>() };
      e.signals.add(ch.signal_type);
      material.set(prop.id, e);
    }
  };

  // 1. Property-scoped datasets (scope = BBL) — one owner each.
  for (const p of shardRows) {
    if (!p.bbl) continue;
    const V = await twoMostRecent(admin, 'violations', 'property', p.bbl);
    if (V && V.current.captured_week === runWeek)
      for (const ch of detectViolations(V.prior.data as unknown as ViolationsData, V.current.data as unknown as ViolationsData)) await emit(p, ch, V);
    const L = await twoMostRecent(admin, 'landlord', 'property', p.bbl);
    if (L && L.current.captured_week === runWeek)
      for (const ch of detectOwnership(L.prior.data as unknown as LandlordData, L.current.data as unknown as LandlordData)) await emit(p, ch, L);
    const F = await twoMostRecent(admin, 'filings', 'property', p.bbl);
    if (F && F.current.captured_week === runWeek)
      for (const ch of detectFilings(F.prior.data as unknown as FilingsData, F.current.data as unknown as FilingsData)) await emit(p, ch, F);
    const C = await twoMostRecent(admin, 'contamination', 'property', p.bbl);
    if (C && C.current.captured_week === runWeek)
      for (const ch of detectContamination(C.prior.data as unknown as ContaminationData, C.current.data as unknown as ContaminationData)) await emit(p, ch, C);
  }

  // 2. County disaster — fan a change out to EVERY monitored property in the
  //    county (not just this shard's), so a property processed before the
  //    mid-week change still hears about it. Deduped by the notification key.
  const counties = Array.from(new Set(shardRows.map((p) => p.tract_geoid?.slice(0, 5)).filter(Boolean))) as string[];
  for (const county of counties) {
    const pair = await twoMostRecent(admin, 'disaster_history', 'county', county);
    if (!pair || pair.current.captured_week !== runWeek) continue;
    const changes = detectDisaster(pair.prior.data as unknown as DisasterData, pair.current.data as unknown as DisasterData);
    if (changes.length === 0) continue;
    for (const prop of await monitoredInScope(admin, 'county', county)) for (const ch of changes) await emit(prop, ch, pair);
  }

  // 3. Comp price — fan a ZIP change out to every monitored property in that ZIP.
  const zips = Array.from(new Set(shardRows.map((p) => p.zip).filter(Boolean))) as string[];
  for (const zip of zips) {
    const pair = await twoMostRecent(admin, 'comp_zip', 'zip', zip);
    if (!pair || pair.current.captured_week !== runWeek) continue;
    const changes = detectComp(pair.prior.data as unknown as CompData, pair.current.data as unknown as CompData);
    if (changes.length === 0) continue;
    for (const prop of await monitoredInScope(admin, 'zip', zip)) for (const ch of changes) await emit(prop, ch, pair);
  }

  // 4. verdict_data_change — deterministic flag (NOT a re-run): a material change
  //    landed on a property that has a stored verdict. Body cites only literal
  //    values (the verdict + which signals changed).
  for (const { prop, signals } of Array.from(material.values())) {
    const verdict = await latestVerdict(admin, prop.bbl);
    if (!verdict) continue;
    const signalList = Array.from(signals).join(', ');
    const rec = {
      clerk_user_id: prop.clerk_user_id,
      property_id: prop.id,
      bbl: prop.bbl,
      signal_type: 'verdict_data_change',
      severity: 'material',
      title: 'The data behind your verdict changed',
      body: `A material change (${signalList}) landed on this property, which has a stored ${verdict.toUpperCase()} verdict. Re-run the analysis to see if the verdict still holds.`,
      before_value: verdict,
      after_value: null,
      data: { verdict, changed_signals: Array.from(signals) },
      captured_week: runWeek,
      link_path: `/dashboard/reasoning/${prop.id}`,
      email_status: 'pending',
    };
    const { error } = await admin.from('notifications').upsert(rec, { onConflict: CONFLICT, ignoreDuplicates: true });
    if (!error) notificationsCreated += 1;
  }

  return { propertiesChecked: shardRows.length, changesDetected, notificationsCreated };
}
