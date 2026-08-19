// KOANO archive — capture logic (Phase 0, first slice: sales + tract permits).
// Pure-ish functions the weekly cron and the integrity harness both call.
//
// CAPTURE VERSIONING (addition 2): every row records `capture_version`. When the
// capture logic changes in a year, bump the version so we always know which rows
// came from which logic — the same discipline as `verdicts.method`. Never reuse
// a version string after changing what/how a capture reads.
//
// APPEND-ONLY: every write is an upsert with ignoreDuplicates (INSERT ... ON
// CONFLICT DO NOTHING). The cron never updates or deletes a snapshot.

import { createHash } from 'crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { fetchJson } from '../providers/real/http';

export const CAPTURE_VERSION = {
  sales: 'sales-incremental@1',
  permitsTract: 'permits-tract@1',
} as const;

const ROLLING_SALES = 'https://data.cityofnewyork.us/resource/usep-8jbt.json';
const DOB_PERMITS = 'https://data.cityofnewyork.us/resource/rbx6-tga4.json';

// ISO-week Monday (UTC) for a date — the canonical captured_week / run_week.
export function isoWeekMonday(d: Date): string {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = date.getUTCDay(); // 0=Sun … 6=Sat
  date.setUTCDate(date.getUTCDate() + (day === 0 ? -6 : 1 - day));
  return date.toISOString().slice(0, 10);
}

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return `${d.toISOString().slice(0, 10)}T00:00:00.000`;
}

function hash(obj: unknown): string {
  return createHash('sha1').update(JSON.stringify(obj)).digest('hex');
}

async function chunkedUpsert(
  admin: SupabaseClient,
  table: string,
  rows: Record<string, unknown>[],
  onConflict: string,
): Promise<number> {
  let written = 0;
  for (let i = 0; i < rows.length; i += 1000) {
    const batch = rows.slice(i, i + 1000);
    const { error } = await admin.from(table).upsert(batch, { onConflict, ignoreDuplicates: true });
    if (error) throw new Error(`${table} upsert failed: ${error.message}`);
    written += batch.length;
  }
  return written;
}

// ---------------------------------------------------------------------------
// SALES — incremental accumulation. Re-query a wide rolling window (13 months,
// for overlap margin against late recordings) and upsert-ignore by natural key,
// so nothing is missed and duplicates are free. The first run seeds the whole
// current window; later runs only insert genuinely new sales.
// ---------------------------------------------------------------------------
interface SaleRow {
  borough?: string;
  block?: string;
  lot?: string;
  address?: string;
  zip_code?: string;
  neighborhood?: string;
  building_class_category?: string;
  residential_units?: string;
  gross_square_feet?: string;
  sale_price?: string;
  sale_date?: string;
}

export async function captureSales(admin: SupabaseClient, runWeek: string): Promise<number> {
  const cutoff = isoDaysAgo(400); // ~13 months
  const where = encodeURIComponent(`sale_price > 0 AND sale_date > '${cutoff}'`);
  const select = encodeURIComponent(
    'borough,block,lot,address,zip_code,neighborhood,building_class_category,residential_units,gross_square_feet,sale_price,sale_date',
  );
  const PAGE = 50000;
  const toInsert: Record<string, unknown>[] = [];
  for (let offset = 0; ; offset += PAGE) {
    const url = `${ROLLING_SALES}?$where=${where}&$select=${select}&$order=sale_date DESC&$limit=${PAGE}&$offset=${offset}`;
    const rows = await fetchJson<SaleRow[]>(url, { timeoutMs: 60000 });
    for (const r of rows) {
      const sale_date = (r.sale_date ?? '').slice(0, 10);
      if (!sale_date) continue;
      const borough = r.borough ?? '';
      const block = r.block ?? '';
      const lot = r.lot ?? '';
      const price = r.sale_price ?? '';
      const gsf = r.gross_square_feet ?? '';
      const cls = r.building_class_category ?? '';
      const bbl =
        borough && block && lot ? `${borough}${block.padStart(5, '0')}${lot.padStart(4, '0')}` : null;
      toInsert.push({
        natural_key: `${borough}|${block}|${lot}|${sale_date}|${price}|${gsf}|${cls}`,
        bbl,
        borough,
        block,
        lot,
        address: r.address ?? null,
        zip: r.zip_code ?? null,
        neighborhood: r.neighborhood ?? null,
        building_class: cls || null,
        residential_units: r.residential_units ? Number(r.residential_units) : null,
        gross_square_feet: gsf ? Number(gsf) : null,
        sale_price: price ? Number(price) : null,
        sale_date,
        captured_week: runWeek,
        source: 'NYC Open Data — DOF Rolling Calendar Sales (usep-8jbt)',
        capture_version: CAPTURE_VERSION.sales,
      });
    }
    if (rows.length < PAGE) break;
  }
  // ignoreDuplicates → only new natural_keys land; the count returned is rows
  // ATTEMPTED (not net-new). The run's plausibility floor is what guards "wrote
  // nothing": an empty attempt means the source query broke.
  return chunkedUpsert(admin, 'sales_archive', toInsert, 'natural_key');
}

// ---------------------------------------------------------------------------
// TRACT PERMITS — state snapshot, all NYC tracts in a handful of GROUP queries
// (Socrata aggregates server-side, so this is ~5 queries, not ~2,325 calls).
// scope_key = 'BOROUGH:census_tract' — lossless. Note: DOB strips the tract code
// (137.00 -> "137", 119.01 -> "11901") irreversibly, so this is NOT a Census
// GEOID; joining tract-permits to ACS/other tract data later needs a crosswalk.
// ---------------------------------------------------------------------------
interface TractCount {
  census_tract?: string;
  borough?: string;
  cnt?: string;
}

async function tractGroup(where: string): Promise<Map<string, number>> {
  const url =
    `${DOB_PERMITS}?$select=census_tract,borough,count(1) as cnt` +
    `&$where=${encodeURIComponent(`${where} AND census_tract IS NOT NULL AND borough IS NOT NULL`)}` +
    `&$group=census_tract,borough&$limit=50000`;
  const rows = await fetchJson<TractCount[]>(url, { timeoutMs: 60000 });
  const m = new Map<string, number>();
  for (const r of rows) {
    if (!r.census_tract || !r.borough) continue;
    m.set(`${r.borough.toUpperCase()}:${r.census_tract}`, Number(r.cnt ?? 0));
  }
  return m;
}

export async function captureTractPermits(admin: SupabaseClient, runWeek: string): Promise<number> {
  const c24 = `issued_date > '${isoDaysAgo(730)}'`;
  const c7 = `issued_date > '${isoDaysAgo(7)}'`;
  // Generous payload captured NOW (past rows can never gain fields).
  const [total, newB, demo, alt, last7] = await Promise.all([
    tractGroup(c24),
    tractGroup(`${c24} AND upper(work_type) like '%NEW BUILDING%'`),
    tractGroup(`${c24} AND upper(work_type) like '%DEMOLITION%'`),
    tractGroup(
      `${c24} AND (upper(work_type) like '%ALTERATION%' OR upper(work_type) like '%GENERAL CONSTRUCTION%' OR upper(work_type) like '%PLUMBING%')`,
    ),
    tractGroup(c7),
  ]);

  const keys = new Set<string>(Array.from(total.keys()).concat(Array.from(last7.keys())));
  const rows: Record<string, unknown>[] = [];
  for (const key of Array.from(keys)) {
    const [borough, census_tract] = key.split(':');
    const data = {
      borough,
      census_tract, // agency-native (DOB-stripped); GEOID needs a crosswalk
      total_24mo: total.get(key) ?? 0,
      new_building_24mo: newB.get(key) ?? 0,
      demolition_24mo: demo.get(key) ?? 0,
      alteration_24mo: alt.get(key) ?? 0,
      issued_last_7d: last7.get(key) ?? 0,
    };
    rows.push({
      dataset: 'permits',
      scope_type: 'tract',
      scope_key: key,
      captured_week: runWeek,
      source: 'NYC Open Data — DOB NOW: Build Approved Permits (rbx6-tga4)',
      provenance: 'live',
      capture_version: CAPTURE_VERSION.permitsTract,
      data,
      row_count: data.total_24mo,
      content_hash: hash(data),
    });
  }
  return chunkedUpsert(admin, 'archive_snapshots', rows, 'dataset,scope_type,scope_key,captured_week');
}

// ---------------------------------------------------------------------------
// Missed-run detection — a silently broken job is the failure that destroys the
// thesis, so each run checks that the PRIOR week captured successfully.
// ---------------------------------------------------------------------------
export async function priorWeekMissing(admin: SupabaseClient, runWeek: string): Promise<string | null> {
  const prior = isoWeekMonday(new Date(new Date(runWeek).getTime() - 7 * 86_400_000));
  const { data } = await admin
    .from('archive_runs')
    .select('id')
    .eq('run_week', prior)
    .eq('status', 'succeeded')
    .limit(1);
  return data && data.length > 0 ? null : prior;
}

// Best-effort email on a missed run. Uses Resend's HTTP API (no SDK) when
// configured; otherwise logs LOUDLY so the gap is at least in the logs. Requires
// RESEND_API_KEY + ARCHIVE_ALERT_FROM + ARCHIVE_ALERT_TO.
export async function sendGapAlert(subject: string, body: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.ARCHIVE_ALERT_FROM;
  const to = process.env.ARCHIVE_ALERT_TO;
  if (!key || !from || !to) {
    console.error(`[archive] GAP ALERT (email not configured): ${subject} — ${body}`);
    return;
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to, subject, text: body }),
    });
    if (!res.ok) console.error(`[archive] gap-alert email failed (${res.status}): ${await res.text()}`);
  } catch (e) {
    console.error(`[archive] gap-alert email threw: ${e instanceof Error ? e.message : String(e)}`);
  }
}
