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
  priorWeekMissing,
  sendGapAlert,
} from '../../../../../lib/archive/capture';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;

const RUN_VERSION = 'archive-first-slice@1';
// Plausibility floors — below these, a "successful" capture almost certainly
// means the source query silently broke (the exact failure that destroys the
// thesis). A run under floor is marked `partial` and shows as a gap.
const FLOORS = { sales: 100, permits: 1500 };

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

  // Each dataset in its own try so one failure doesn't abort the other.
  const datasets: Record<string, { written: number; error?: string; below_floor?: boolean }> = {};
  let total = 0;
  for (const [name, fn, floor] of [
    ['sales', captureSales, FLOORS.sales],
    ['permits', captureTractPermits, FLOORS.permits],
  ] as const) {
    try {
      const written = await fn(admin, runWeek);
      const below_floor = written < floor;
      datasets[name] = below_floor ? { written, below_floor } : { written };
      total += written;
    } catch (e) {
      datasets[name] = { written: 0, error: e instanceof Error ? e.message : String(e) };
    }
  }

  const anyError = Object.values(datasets).some((d) => d.error);
  const anyBelowFloor = Object.values(datasets).some((d) => d.below_floor);
  const status = anyError || anyBelowFloor ? 'partial' : 'succeeded';

  await admin
    .from('archive_runs')
    .update({ finished_at: new Date().toISOString(), status, datasets, rows_written: total })
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

  return NextResponse.json({ run_week: runWeek, status, datasets, rows_written: total, prior_week_gap: missing });
}
