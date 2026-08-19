// Archive integrity harness (addition 1). The archive is the acquisition asset,
// so its write path is load-bearing infrastructure, not a background job. The
// failure mode that destroys the thesis is a job that APPEARS to run and writes
// nothing — silently. This proves:
//   [1] a snapshot ROUND-TRIPS (insert -> read back -> identical). If the write
//       silently no-ops (RLS, wrong column, serialization), this fails loudly.
//   [2] archive_coverage reports a GAP whenever the archive TABLES hold no rows
//       for a week — a MISSING week (no run) AND a "ran but nothing landed" week.
//       Coverage counts the real tables (migration-009), so this inserts actual
//       snapshot/sales rows, not just runs.
// Requires migration-008 + 009 applied. Uses the service role. Cleans up.
// Run: npm run test:archive

import { loadEnv } from './_loadenv';
loadEnv();
import { supabaseAdmin } from '../lib/supabase/server';

let failures = 0;
function check(name: string, cond: boolean, detail?: string) {
  console.log(`  ${cond ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`);
  if (!cond) failures++;
}

const admin = supabaseAdmin();
// Fixed far-past test weeks so they never collide with real capture weeks.
const W_A = '2020-01-06'; // run present, permits landed, sales did NOT
const W_B = '2020-01-13'; // run present but NOTHING landed (missing data)
const W_C = '2020-01-20'; // run present, both landed
const RT_SCOPE = 'SELFTEST:0001'; // round-trip row (dataset __selftest__, not counted by coverage)

async function cleanup() {
  await admin.from('archive_snapshots').delete().eq('dataset', '__selftest__');
  await admin.from('archive_snapshots').delete().eq('dataset', 'permits').like('scope_key', 'COVTEST:%');
  await admin.from('sales_archive').delete().like('natural_key', 'covtest|%');
  await admin.from('archive_runs').delete().in('run_week', [W_A, W_B, W_C]);
}

(async () => {
  await cleanup(); // in case a prior run aborted mid-way

  // [1] ROUND-TRIP
  console.log('\n[1] Snapshot round-trip (insert -> read back -> identical)');
  const payload = { n: 42, s: 'roundtrip', nested: { x: true, arr: [1, 2, 3] } };
  const up = await admin.from('archive_snapshots').upsert(
    {
      dataset: '__selftest__', scope_type: 'tract', scope_key: RT_SCOPE, captured_week: W_A,
      source: 'selftest', provenance: 'live', capture_version: 'selftest@1',
      data: payload, row_count: 42, content_hash: 'selftest',
    },
    { onConflict: 'dataset,scope_type,scope_key,captured_week', ignoreDuplicates: false },
  );
  check('insert succeeds (write did not silently no-op)', !up.error, up.error?.message);
  const back = await admin
    .from('archive_snapshots')
    .select('data, capture_version, provenance')
    .eq('dataset', '__selftest__').eq('scope_key', RT_SCOPE).eq('captured_week', W_A)
    .maybeSingle();
  check('row reads back (not empty)', !!back.data, back.error?.message);
  check('jsonb data round-trips exactly', JSON.stringify(back.data?.data) === JSON.stringify(payload), JSON.stringify(back.data?.data));
  check('capture_version persisted', back.data?.capture_version === 'selftest@1');
  check('provenance CHECK holds (live)', back.data?.provenance === 'live');

  // [2] COVERAGE counts the tables and flags gaps
  console.log('\n[2] archive_coverage flags gaps by counting the archive tables');
  // Runs define the coverage week range (bounds = min(run_week)..now).
  await admin.from('archive_runs').insert([
    { run_week: W_A, status: 'succeeded', rows_written: 1, capture_version: 'selftest@1', finished_at: new Date().toISOString(), datasets: { permits: { written: 1 } } },
    { run_week: W_B, status: 'succeeded', rows_written: 0, capture_version: 'selftest@1', finished_at: new Date().toISOString(), datasets: {} },
    { run_week: W_C, status: 'succeeded', rows_written: 2, capture_version: 'selftest@1', finished_at: new Date().toISOString(), datasets: { permits: { written: 1 }, sales: { written: 1 } } },
  ]);
  // Actual landed rows: W_A permits only; W_C permits + sales; W_B nothing.
  await admin.from('archive_snapshots').insert([
    { dataset: 'permits', scope_type: 'tract', scope_key: 'COVTEST:1', captured_week: W_A, source: 'selftest', provenance: 'live', capture_version: 'selftest@1', data: { total_24mo: 5 } },
    { dataset: 'permits', scope_type: 'tract', scope_key: 'COVTEST:2', captured_week: W_C, source: 'selftest', provenance: 'live', capture_version: 'selftest@1', data: { total_24mo: 7 } },
  ]);
  await admin.from('sales_archive').insert([
    { natural_key: 'covtest|c', sale_date: W_C, captured_week: W_C, source: 'selftest', capture_version: 'selftest@1' },
  ]);

  const cov = await admin.from('archive_coverage').select('*').in('week', [W_A, W_B, W_C]);
  check('coverage view returned rows', !cov.error && (cov.data?.length ?? 0) > 0, cov.error?.message);
  const at = (week: string, ds: string) => (cov.data ?? []).find((r) => r.week === week && r.dataset === ds);
  check('W_A permits NOT a gap (1 snapshot landed)', at(W_A, 'permits')?.is_gap === false, JSON.stringify(at(W_A, 'permits')));
  check('W_A sales IS a gap (ran, but NO sales landed)', at(W_A, 'sales')?.is_gap === true, JSON.stringify(at(W_A, 'sales')));
  check('W_B permits IS a gap (nothing landed)', at(W_B, 'permits')?.is_gap === true, JSON.stringify(at(W_B, 'permits')));
  check('W_C sales NOT a gap (1 sale landed)', at(W_C, 'sales')?.is_gap === false, JSON.stringify(at(W_C, 'sales')));
  check('rows_present is the UNIQUE count, not a run sum (W_C permits = 1)', at(W_C, 'permits')?.rows_present === 1, JSON.stringify(at(W_C, 'permits')));

  await cleanup();
  console.log(`\n${failures === 0 ? '✓ ALL ARCHIVE INTEGRITY CHECKS PASSED' : `✗ ${failures} CHECK(S) FAILED`}\n`);
  process.exit(failures === 0 ? 0 : 1);
})().catch(async (e) => {
  console.error(e);
  await cleanup();
  process.exit(1);
});
