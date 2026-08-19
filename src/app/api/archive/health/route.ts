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

  const [coverageRes, lastRunRes] = await Promise.all([
    admin.from('archive_coverage').select('*').limit(52),
    admin.from('archive_runs').select('run_week, status, rows_written, finished_at, datasets').order('run_week', { ascending: false }).limit(1),
  ]);

  if (coverageRes.error) {
    return NextResponse.json({ error: coverageRes.error.message }, { status: 500 });
  }
  const coverage = coverageRes.data ?? [];
  const gaps = coverage.filter((r) => r.is_gap);

  return NextResponse.json({
    healthy: gaps.length === 0,
    gap_count: gaps.length,
    gaps, // [{ week, dataset, rows_written, is_gap }]
    coverage,
    last_run: lastRunRes.data?.[0] ?? null,
  });
}
