// KOANO archive data API — the longitudinal-record panel reads this. Returns the
// weekly capture coverage (from the archive_coverage view: per ISO week × dataset,
// rows_present and is_gap, counted from the real tables) plus the honest
// observation window. The panel plots ONLY what was captured and shows every gap
// as a gap — never interpolated, never backfilled.
// Clerk-protected; read-only.

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { requireApproved } from '../../../../lib/koano-guard';
import { supabaseAdmin } from '../../../../lib/supabase/server';

export const dynamic = 'force-dynamic';

// Human labels for the weekly datasets the coverage view tracks.
const DATASET_LABELS: Record<string, string> = {
  sales: 'Recorded sales (DOF)',
  permits: 'Building permits (tract)',
  entitlement_cd: 'Entitlement (community districts)',
  violations: 'Violations (per property)',
  landlord: 'Ownership / landlord (per property)',
  filings: 'DOB job filings (per property)',
  contamination: 'Contamination (per property)',
};

interface CoverageRow {
  week: string;
  dataset: string;
  rows_present: number;
  is_gap: boolean;
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const denied = await requireApproved(userId);
  if (denied) return NextResponse.json(denied.body, { status: denied.status });

  const covRes = await supabaseAdmin().from('archive_coverage').select('week, dataset, rows_present, is_gap');
  if (covRes.error) {
    // Pre-migration or view unavailable — report an empty, honest archive.
    return NextResponse.json({
      observation: { first_week: null, last_week: null, week_count: 0, weeks: [] },
      datasets: [],
      gap_count: 0,
      note: 'Archive coverage view unavailable.',
    });
  }
  const rows = (covRes.data ?? []) as CoverageRow[];

  const weeks = Array.from(new Set(rows.map((r) => r.week))).sort();
  const datasetKeys = Array.from(new Set(rows.map((r) => r.dataset)));

  const datasets = datasetKeys
    .map((dataset) => {
      const cells = weeks.map((week) => {
        const r = rows.find((x) => x.dataset === dataset && x.week === week);
        return { week, rows_present: r?.rows_present ?? 0, is_gap: r?.is_gap ?? true };
      });
      return {
        dataset,
        label: DATASET_LABELS[dataset] ?? dataset,
        cells,
        total: cells.reduce((s, c) => s + c.rows_present, 0),
      };
    })
    // Datasets with the most captured history first; the fully-empty ones last.
    .sort((a, b) => b.total - a.total);

  return NextResponse.json({
    observation: {
      first_week: weeks[0] ?? null,
      last_week: weeks[weeks.length - 1] ?? null,
      week_count: weeks.length,
      weeks,
    },
    datasets,
    gap_count: rows.filter((r) => r.is_gap).length,
  });
}
