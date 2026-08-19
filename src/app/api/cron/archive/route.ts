// KOANO weekly archive cron (Phase 0, first slice).
// Captures the irrecoverable public record before it changes/rolls off:
//   - sales_archive (incremental)   - tract permits (state snapshot).
// Scheduled by vercel.json (Mon 10:00 UTC). Guarded by CRON_SECRET: Vercel sends
// `Authorization: Bearer $CRON_SECRET` on cron requests; manual runs must too.
//
// Every run writes an archive_runs row (the failure ledger) so a job that
// "runs but writes nothing" is visible in archive_coverage rather than silent.

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabase/server';
import {
  isoWeekMonday,
  captureSales,
  captureTractPermits,
  captureCdEntitlement,
  capturePropertySnapshots,
  captureHpiIfChanged,
  loadTrackedProperties,
  priorWeekMissing,
  sendGapAlert,
} from '../../../../../lib/archive/capture';
import { scanVerdictOutcomes } from '../../../../../lib/archive/outcomes';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const RUN_VERSION = 'archive-slice2@1';
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
  const runWeek = isoWeekMonday(new Date());

  const { data: runRow, error: runErr } = await admin
    .from('archive_runs')
    .insert({ run_week: runWeek, status: 'running', capture_version: RUN_VERSION })
    .select('id')
    .single();
  if (runErr || !runRow) {
    return NextResponse.json({ error: `could not open run: ${runErr?.message}` }, { status: 500 });
  }
  const runId = runRow.id as string;

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

  // All-NYC datasets (aggregate queries — cheap).
  await run('sales', () => captureSales(admin, runWeek));
  await run('permits', () => captureTractPermits(admin, runWeek));
  await run('entitlement_cd', () => captureCdEntitlement(admin, runWeek));
  // Metro HPI — capture-if-changed (0 when the quarter hasn't moved).
  await run('hpi', () => captureHpiIfChanged(admin, runWeek));
  // Per-tracked-property (violations / landlord / filings weekly; zoning if-changed).
  try {
    const props = await loadTrackedProperties(admin);
    const c = await capturePropertySnapshots(admin, runWeek, props);
    record('violations', c.violations);
    record('landlord', c.landlord);
    record('filings', c.filings);
    record('zoning', c.zoning);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    for (const n of ['violations', 'landlord', 'filings', 'zoning']) datasets[n] = { written: 0, error: msg };
  }

  // Calibration scan (Slice 3) — DOWNSTREAM of the archive, not an archive
  // dataset: it reads what the snapshots above just captured and records verdict
  // outcomes. It has no floor and no coverage/gap entry, and a scan failure must
  // NOT mark the archive run partial (the public record was still captured). We
  // record it in the run row for observability only.
  let outcomes: { written: number; error?: string } = { written: 0 };
  try {
    outcomes = { written: await scanVerdictOutcomes(admin, runWeek) };
  } catch (e) {
    outcomes = { written: 0, error: e instanceof Error ? e.message : String(e) };
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

  // Alert on THIS run failing to fully capture, and on a MISSED prior week.
  if (status === 'partial') {
    await sendGapAlert(
      `KOANO archive run ${runWeek} was PARTIAL`,
      `Datasets: ${JSON.stringify(datasets)}. A capture failed or fell below its plausibility floor — history may be incomplete for this week.`,
    );
  }
  const missing = await priorWeekMissing(admin, runWeek);
  if (missing) {
    await sendGapAlert(
      `KOANO archive GAP: week ${missing} was never captured`,
      `No successful archive run exists for ISO week ${missing}. That week of the public record is permanently missing unless re-captured while the source still holds it.`,
    );
  }

  return NextResponse.json({ run_week: runWeek, status, datasets, outcomes, rows_written: total, prior_week_gap: missing });
}
