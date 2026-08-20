// KOANO archive cron — DAILY FAN-OUT (Phase 2).
// Runs daily (vercel.json). Each day handles ONE shard (0=Mon..6=Sun) of the
// tracked properties, so the per-property capture (~14s/property) never exceeds
// the 300s function limit as the fleet grows. All seven daily runs in a week
// write the SAME captured_week (the ISO Monday), so weekly bucketing — and the
// monitoring diff — is unaffected. The all-NYC datasets (sales/permits/CD/HPI)
// and the outcome scan run once per week, on shard 0 (Monday).
//
// A week is complete only when all 7 shards run; a missed day surfaces as a gap
// (missedShards), never "6 of 7 passed". Guarded by CRON_SECRET.

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabase/server';
import {
  isoWeekMonday,
  isoDayShard,
  propertyShard,
  captureSales,
  captureTractPermits,
  captureCdEntitlement,
  capturePropertySnapshots,
  captureHpiIfChanged,
  loadTrackedProperties,
  loadActiveMonitoredProperties,
  missedShards,
  sendGapAlert,
} from '../../../../../lib/archive/capture';
import { scanVerdictOutcomes } from '../../../../../lib/archive/outcomes';
import { scanMonitoring } from '../../../../../lib/monitor/scan';
import { sendWeeklyDigests } from '../../../../../lib/monitor/digest';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const RUN_VERSION = 'archive-daily@1';
// Plausibility floors — below these, a "successful" capture almost certainly
// means the source query silently broke (the exact failure that destroys the
// thesis). A run under floor is marked `partial` and shows as a gap. Only the
// all-NYC always-present datasets get a floor; per-property counts scale with
// tracked N, and hpi/zoning are capture-if-changed (0 is normal), so they don't.
const FLOORS: Record<string, number> = { sales: 100, permits: 1500, entitlement_cd: 40 };

export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = supabaseAdmin();
  const now = new Date();
  const runWeek = isoWeekMonday(now); // same ISO Monday for all 7 daily runs
  const shard = isoDayShard(now); // 0=Mon..6=Sun — today's property shard

  // Open the run WITH the shard (needs migration-015). If that column isn't there
  // yet, fall back to a full UNSHARDED run — so deploying the daily cron before
  // the migration is applied can never cause a silently missed day (the one
  // unrecoverable failure). Once 015 is applied, sharding takes over automatically.
  let sharded = true;
  let ins = await admin
    .from('archive_runs')
    .insert({ run_week: runWeek, shard, status: 'running', capture_version: RUN_VERSION })
    .select('id')
    .single();
  if (ins.error && /shard/i.test(ins.error.message)) {
    sharded = false;
    ins = await admin
      .from('archive_runs')
      .insert({ run_week: runWeek, status: 'running', capture_version: RUN_VERSION })
      .select('id')
      .single();
  }
  if (ins.error || !ins.data) {
    return NextResponse.json({ error: `could not open run: ${ins.error?.message}` }, { status: 500 });
  }
  const runId = ins.data.id as string;

  // Each dataset in its own try so one failure doesn't abort the others.
  const datasets: Record<string, { written: number; error?: string; below_floor?: boolean }> = {};
  let total = 0;
  const record = (name: string, written: number) => {
    const floor = FLOORS[name];
    const below_floor = floor !== undefined && written < floor;
    datasets[name] = below_floor ? { written, below_floor } : { written };
    total += written;
  };
  const run = async (name: string, fn: () => Promise<number>) => {
    try { record(name, await fn()); } catch (e) { datasets[name] = { written: 0, error: e instanceof Error ? e.message : String(e) }; }
  };

  // All-NYC datasets (aggregate queries — cheap) run ONCE per week, on shard 0
  // (Monday). They aren't per-property, so sharding them daily would just repeat
  // work; a missed Monday shows as a shard-0 gap. In the unsharded fallback we
  // run them too (it's a full weekly run).
  if (!sharded || shard === 0) {
    await run('sales', () => captureSales(admin, runWeek));
    await run('permits', () => captureTractPermits(admin, runWeek));
    await run('entitlement_cd', () => captureCdEntitlement(admin, runWeek));
    await run('hpi', () => captureHpiIfChanged(admin, runWeek));
  }

  // Per-tracked-property. Sharded: only TODAY'S shard (all 7 daily runs write the
  // same captured_week, so a property captured on its weekday lands in this week's
  // bucket). Unsharded fallback: all properties (safe at small N). County/comp
  // datasets ride along (deduped).
  try {
    const allProps = await loadTrackedProperties(admin);
    const shardProps = sharded ? allProps.filter((p) => propertyShard(p.bbl ?? p.address) === shard) : allProps;
    const c = await capturePropertySnapshots(admin, runWeek, shardProps);
    record('violations', c.violations);
    record('landlord', c.landlord);
    record('filings', c.filings);
    record('zoning', c.zoning);
    record('contamination', c.contamination);
    record('disaster_history', c.disaster);
    record('mortgage_demand', c.hmda);
    record('employment', c.qcew);
    record('comp_zip', c.compZip);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    for (const n of ['violations', 'landlord', 'filings', 'zoning', 'contamination', 'disaster_history', 'mortgage_demand', 'employment', 'comp_zip']) datasets[n] = { written: 0, error: msg };
  }

  // Calibration scan — DOWNSTREAM of the archive, weekly (shard 0). It reads what
  // the snapshots captured and records verdict outcomes. No floor, no coverage
  // entry, and a scan failure must NOT mark the run partial. Observability only.
  let outcomes: { written: number; error?: string } = { written: 0 };
  if (!sharded || shard === 0) {
    try {
      outcomes = { written: await scanVerdictOutcomes(admin, runWeek) };
    } catch (e) {
      outcomes = { written: 0, error: e instanceof Error ? e.message : String(e) };
    }
  }

  // MONITORING (Phase 2) — deterministic diff on the snapshots THIS shard just
  // captured, so notifications are fresh. Runs every daily shard for its own
  // properties. DOWNSTREAM of the archive: isolated so a failure never marks the
  // archive run partial, and no model call / no verdict allowance is consumed.
  let monitor: { checked: number; changes: number; notifications: number; error?: string } = { checked: 0, changes: 0, notifications: 0 };
  try {
    // ACTIVE set only — enforces per-plan monitoring caps (free = 0; over-cap
    // properties are paused, oldest-watched stay active). Non-destructive. The
    // active id set also gates the county/ZIP fan-out so paused properties never
    // get notified.
    const monitored = await loadActiveMonitoredProperties(admin);
    const activeIds = new Set(monitored.map((p) => p.id));
    const shardMonitored = sharded ? monitored.filter((p) => p.bbl && propertyShard(p.bbl) === shard) : monitored;
    const { data: mr } = await admin.from('monitor_runs').insert({ run_week: runWeek, status: 'running' }).select('id').single();
    const res = await scanMonitoring(admin, runWeek, shardMonitored, activeIds);
    monitor = { checked: res.propertiesChecked, changes: res.changesDetected, notifications: res.notificationsCreated };
    if (mr) {
      await admin.from('monitor_runs').update({
        finished_at: new Date().toISOString(), properties_checked: res.propertiesChecked,
        changes_detected: res.changesDetected, notifications_created: res.notificationsCreated, status: 'succeeded',
      }).eq('id', mr.id);
    }
  } catch (e) {
    monitor = { checked: 0, changes: 0, notifications: 0, error: e instanceof Error ? e.message : String(e) };
  }

  // WEEKLY DIGEST — Monday (shard 0), after this day's monitoring, covering all
  // still-pending notifications from the week. One email per user; the in-app
  // feed already carries same-day immediacy. Isolated: a send failure never
  // affects the archive.
  let digest: { usersEmailed: number; notificationsSent: number; error?: string } = { usersEmailed: 0, notificationsSent: 0 };
  if (!sharded || shard === 0) {
    try {
      digest = { ...(await sendWeeklyDigests(admin)) };
    } catch (e) {
      digest = { usersEmailed: 0, notificationsSent: 0, error: e instanceof Error ? e.message : String(e) };
    }
  }

  const anyError = Object.values(datasets).some((d) => d.error);
  const anyBelowFloor = Object.values(datasets).some((d) => d.below_floor);
  const status = anyError || anyBelowFloor ? 'partial' : 'succeeded';

  // Persist outcomes alongside the datasets for observability (does not affect
  // status — it was computed above from archive datasets only).
  const datasetsWithOutcomes = { ...datasets, outcomes };

  await admin
    .from('archive_runs')
    .update({ finished_at: new Date().toISOString(), status, datasets: datasetsWithOutcomes, rows_written: total })
    .eq('id', runId);

  // Alert on THIS run failing to fully capture, and on MISSED shard-days. Shard
  // gap detection only runs once the daily model is established (migration-015).
  if (status === 'partial') {
    await sendGapAlert(
      `KOANO archive run ${runWeek}${sharded ? ` shard ${shard}` : ''} was PARTIAL`,
      `Datasets: ${JSON.stringify(datasets)}. A capture failed or fell below its plausibility floor — history may be incomplete.`,
    );
  }
  const gaps = sharded ? await missedShards(admin, runWeek, shard) : [];
  for (const gap of gaps) {
    await sendGapAlert(
      `KOANO archive GAP: ${gap.slice(0, 80)}`,
      `${gap}. That slice of the public record is permanently missing unless re-captured while the source still holds it — re-trigger the cron for the missing shard.`,
    );
  }

  return NextResponse.json({ run_week: runWeek, shard, sharded, status, datasets, outcomes, monitor, digest, rows_written: total, shard_gaps: gaps });
}
