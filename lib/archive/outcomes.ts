// KOANO calibration — the weekly verdict-outcome scanner (Slice 3).
// Walks verdicts whose window is still relevant and records what actually
// happened from PUBLIC record: a recorded sale, a change in open violations, an
// ownership change, a change in subject-lot filings. Reuses the archive (that is
// the synergy) plus the permanent sales_archive. Outcomes it cannot observe
// (realized return/IRR/rents/occupancy — private) are neither recorded nor
// approximated. One row per (verdict_id, outcome_type), upserted as the window
// plays out. Runs from the weekly archive cron.

import type { SupabaseClient } from '@supabase/supabase-js';

export const OUTCOME_VERSION = 'outcomes@1';

function addMonths(iso: string, months: number): string {
  const d = new Date(iso);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d.toISOString().slice(0, 10);
}

interface VerdictRow {
  id: string; bbl: string | null; verdict: string; confidence: number;
  signal_window_months: number; created_at: string;
}

// earliest + latest property snapshot for a dataset/bbl (the trajectory ends).
async function bounds(admin: SupabaseClient, dataset: string, bbl: string) {
  const [lo, hi] = await Promise.all([
    admin.from('archive_snapshots').select('captured_week, data').eq('dataset', dataset).eq('scope_type', 'property').eq('scope_key', bbl).order('captured_week', { ascending: true }).limit(1).maybeSingle(),
    admin.from('archive_snapshots').select('captured_week, data').eq('dataset', dataset).eq('scope_type', 'property').eq('scope_key', bbl).order('captured_week', { ascending: false }).limit(1).maybeSingle(),
  ]);
  return { earliest: lo.data as { captured_week: string; data: Record<string, unknown> } | null, latest: hi.data as { captured_week: string; data: Record<string, unknown> } | null };
}

// runWeek is accepted for call-site symmetry with the capture functions; the
// scan itself is time-agnostic (observations are stamped by observed_at).
export async function scanVerdictOutcomes(admin: SupabaseClient, _runWeek: string): Promise<number> {
  // Verdicts from the last ~26 months (so a 24-month window can still be open),
  // with a BBL to match against public record.
  const cutoff = addMonths(new Date().toISOString(), -26);
  const { data: verdicts } = await admin
    .from('verdicts')
    .select('id, bbl, verdict, confidence, signal_window_months, created_at')
    .not('bbl', 'is', null)
    .gte('created_at', cutoff);

  const rows: Record<string, unknown>[] = [];
  for (const v of (verdicts ?? []) as VerdictRow[]) {
    if (!v.bbl) continue;
    const windowEnd = addMonths(v.created_at, v.signal_window_months);
    const verdictDate = v.created_at.slice(0, 10);
    const base = { verdict_id: v.id, bbl: v.bbl, verdict_created_at: v.created_at, verdict_value: v.verdict, confidence: v.confidence, signal_window_months: v.signal_window_months, window_end: windowEnd, capture_version: OUTCOME_VERSION, provenance: 'live' as const };

    try {
      // --- SALE: a recorded sale after the verdict (sales_archive has ~13mo). ---
      const sale = await admin.from('sales_archive').select('sale_date, sale_price').eq('bbl', v.bbl).gt('sale_date', verdictDate).order('sale_date', { ascending: true }).limit(1).maybeSingle();
      if (sale.data) {
        rows.push({ ...base, outcome_type: 'sale', within_window: sale.data.sale_date <= windowEnd, direction: 0, source: 'NYC DOF Rolling Sales (sales_archive)', data: { sale_date: sale.data.sale_date, sale_price: sale.data.sale_price } });
      }

      // --- VIOLATION RESOLUTION: change in open HPD violations across the window. ---
      const vio = await bounds(admin, 'violations', v.bbl);
      if (vio.earliest && vio.latest && vio.earliest.captured_week !== vio.latest.captured_week) {
        const start = Number(vio.earliest.data.hpd_open ?? 0), end = Number(vio.latest.data.hpd_open ?? 0);
        const delta = end - start;
        rows.push({ ...base, outcome_type: 'violation_resolution', within_window: vio.latest.captured_week <= windowEnd, direction: delta < 0 ? 1 : delta > 0 ? -1 : 0, source: 'archive_snapshots (violations)', data: { open_start: start, open_end: end, delta } });
      }

      // --- OWNERSHIP CHANGE: registered owner differs end vs start. ---
      const own = await bounds(admin, 'landlord', v.bbl);
      if (own.earliest && own.latest) {
        const from = (own.earliest.data.registered_owner as string) ?? null;
        const to = (own.latest.data.registered_owner as string) ?? null;
        if (from && to && from !== to) {
          rows.push({ ...base, outcome_type: 'ownership_change', within_window: own.latest.captured_week <= windowEnd, direction: 0, source: 'archive_snapshots (landlord)', data: { from, to } });
        }
      }

      // --- PERMIT DISPOSITION: change in subject-lot filing count. ---
      const fil = await bounds(admin, 'filings', v.bbl);
      if (fil.earliest && fil.latest && fil.earliest.captured_week !== fil.latest.captured_week) {
        const start = Number(fil.earliest.data.subject_filing_count ?? 0), end = Number(fil.latest.data.subject_filing_count ?? 0);
        const delta = end - start;
        if (delta !== 0) {
          rows.push({ ...base, outcome_type: 'permit_disposition', within_window: fil.latest.captured_week <= windowEnd, direction: delta > 0 ? 1 : 0, source: 'archive_snapshots (filings)', data: { count_start: start, count_end: end, delta } });
        }
      }
    } catch {
      // one bad verdict must not abort the scan
      continue;
    }
  }

  if (rows.length === 0) return 0;
  let written = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const batch = rows.slice(i, i + 500);
    const { error } = await admin.from('verdict_outcomes').upsert(batch, { onConflict: 'verdict_id,outcome_type', ignoreDuplicates: false });
    if (error) throw new Error(`verdict_outcomes upsert failed: ${error.message}`);
    written += batch.length;
  }
  return written;
}
