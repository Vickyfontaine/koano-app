// KOANO archive health — the queryable gap report the dashboard reads.
// Makes "a job that ran but wrote nothing" and "a missed week" visible facts
// rather than silence. Guarded by CRON_SECRET (fetched server-side by an admin
// surface); read-only.

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../../lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const admin = supabaseAdmin();

  const [coverageRes, shardRes, neverRes, lastRunRes] = await Promise.all([
    admin.from('archive_coverage').select('*').limit(52),
    // Shard completeness (daily fan-out): which (week, shard) days ran vs missed.
    admin.from('archive_week_shards').select('*').limit(371), // ~53 weeks × 7
    // All-time presence: a dataset that has NEVER captured a row (migration-018).
    // Deploy-safe — if the view isn't applied yet, treat as empty.
    admin.from('archive_never_captured').select('*'),
    admin.from('archive_runs').select('run_week, shard, status, rows_written, finished_at, datasets').order('run_week', { ascending: false }).order('shard', { ascending: false }).limit(1),
  ]);

  if (coverageRes.error) {
    return NextResponse.json({ error: coverageRes.error.message }, { status: 500 });
  }
  const coverage = coverageRes.data ?? [];
  const datasetGaps = coverage.filter((r) => r.is_gap);
  const shardRows = shardRes.data ?? [];
  const shardGaps = shardRows.filter((r) => r.is_gap); // missed shard-days
  // Never-captured is a first-class gap: a dataset silent since inception. If the
  // view is missing (pre-migration-018), neverRes errors — degrade to [].
  const neverCaptured = (neverRes.error ? [] : neverRes.data ?? []).filter((r) => r.never_captured);

  // STALENESS — the signal for EXTERNAL liveness detection. The gap alert fires
  // from inside the cron, so a dead cron can't report itself; an outside poller
  // reads this instead. A daily job that hasn't run in >30h has stopped.
  const lastRun = lastRunRes.data?.[0] ?? null;
  const lastAt = lastRun?.finished_at ?? lastRun?.run_week ?? null;
  const lastRunAgeHours = lastAt ? (Date.now() - new Date(lastAt).getTime()) / 3_600_000 : null;
  const STALE_HOURS = 30;
  const stale = lastRunAgeHours === null || lastRunAgeHours > STALE_HOURS;

  return NextResponse.json({
    // Healthy only when the job is running on time (not stale) AND no dataset
    // wrote nothing this week AND every elapsed shard-day ran AND nothing has
    // never captured.
    healthy: !stale && datasetGaps.length === 0 && shardGaps.length === 0 && neverCaptured.length === 0,
    stale, // <-- external liveness signal: true if the cron has not run in >30h
    last_run_age_hours: lastRunAgeHours === null ? null : Math.round(lastRunAgeHours * 10) / 10,
    stale_threshold_hours: STALE_HOURS,
    dataset_gap_count: datasetGaps.length,
    dataset_gaps: datasetGaps,
    shard_gap_count: shardGaps.length,
    shard_gaps: shardGaps, // [{ week, shard, ran, is_gap }] — a missed day, not "6 of 7"
    never_captured_count: neverCaptured.length,
    never_captured: neverCaptured, // [{ dataset, total_rows, never_captured }] — silent since inception
    coverage,
    last_run: lastRun,
  });
}
