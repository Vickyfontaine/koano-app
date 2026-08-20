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

  const [coverageRes, shardRes, lastRunRes] = await Promise.all([
    admin.from('archive_coverage').select('*').limit(52),
    // Shard completeness (daily fan-out): which (week, shard) days ran vs missed.
    admin.from('archive_week_shards').select('*').limit(371), // ~53 weeks × 7
    admin.from('archive_runs').select('run_week, shard, status, rows_written, finished_at, datasets').order('run_week', { ascending: false }).order('shard', { ascending: false }).limit(1),
  ]);

  if (coverageRes.error) {
    return NextResponse.json({ error: coverageRes.error.message }, { status: 500 });
  }
  const coverage = coverageRes.data ?? [];
  const datasetGaps = coverage.filter((r) => r.is_gap);
  const shardRows = shardRes.data ?? [];
  const shardGaps = shardRows.filter((r) => r.is_gap); // missed shard-days

  return NextResponse.json({
    // Healthy only when NO dataset wrote nothing AND every elapsed shard-day ran.
    healthy: datasetGaps.length === 0 && shardGaps.length === 0,
    dataset_gap_count: datasetGaps.length,
    dataset_gaps: datasetGaps,
    shard_gap_count: shardGaps.length,
    shard_gaps: shardGaps, // [{ week, shard, ran, is_gap }] — a missed day, not "6 of 7"
    coverage,
    last_run: lastRunRes.data?.[0] ?? null,
  });
}
