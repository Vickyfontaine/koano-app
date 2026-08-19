// Archive integrity harness (addition 1). The archive is the acquisition asset,
// so its write path is load-bearing infrastructure, not a background job. The
// failure mode that destroys the thesis is a job that APPEARS to run and writes
// nothing — silently. This proves:
//   [1] a snapshot ROUND-TRIPS (insert -> read back -> identical). If the write
//       silently no-ops (RLS, wrong column, serialization), this fails loudly.
//   [2] archive_coverage reports a synthetic GAP — both a MISSING week and a
//       "ran but wrote zero rows" week.
// Requires migration-008 applied. Uses the service role. Cleans up after itself.
// Run: npm run test:archive   (or: npx tsx scripts/test-archive-integrity.ts)

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
const W_A = '2020-01-06'; // run present, but sales wrote ZERO
const W_B = '2020-01-13'; // NO run at all (missing week)
const W_C = '2020-01-20'; // run present, full
const SELFTEST_SCOPE = 'SELFTEST:0001';

async function cleanup() {
  await admin.from('archive_snapshots').delete().eq('dataset', '__selftest__');
  await admin.from('archive_runs').delete().in('run_week', [W_A, W_C]);
}

(async () => {
  await cleanup(); // in case a prior run aborted mid-way

  // [1] ROUND-TRIP
  console.log('\n[1] Snapshot round-trip (insert -> read back -> identical)');
  const payload = { n: 42, s: 'roundtrip', nested: { x: true, arr: [1, 2, 3] } };
  const row = {
    dataset: '__selftest__',
    scope_type: 'tract',
    scope_key: SELFTEST_SCOPE,
    captured_week: W_A,
    source: 'selftest',
    provenance: 'live',
    capture_version: 'selftest@1',
    data: payload,
    row_count: 42,
    content_hash: 'selftest',
  };
  const up = await admin.from('archive_snapshots').upsert(row, {
    onConflict: 'dataset,scope_type,scope_key,captured_week',
    ignoreDuplicates: false,
  });
  check('insert succeeds (write did not silently no-op)', !up.error, up.error?.message);
  const back = await admin
    .from('archive_snapshots')
    .select('data, capture_version, provenance, row_count')
    .eq('dataset', '__selftest__')
    .eq('scope_key', SELFTEST_SCOPE)
    .eq('captured_week', W_A)
    .maybeSingle();
  check('row reads back (not empty)', !!back.data, back.error?.message ?? 'no row');
  check('jsonb data round-trips exactly', JSON.stringify(back.data?.data) === JSON.stringify(payload), JSON.stringify(back.data?.data));
  check('capture_version persisted', back.data?.capture_version === 'selftest@1');
  check('provenance CHECK holds (live)', back.data?.provenance === 'live');

  // [2] COVERAGE reports gaps
  console.log('\n[2] archive_coverage flags a missing week AND a wrote-nothing week');
  await admin.from('archive_runs').insert([
    { run_week: W_A, status: 'succeeded', rows_written: 2000, capture_version: 'selftest@1', finished_at: new Date().toISOString(), datasets: { sales: { written: 0 }, permits: { written: 2000 } } },
    { run_week: W_C, status: 'succeeded', rows_written: 2500, capture_version: 'selftest@1', finished_at: new Date().toISOString(), datasets: { sales: { written: 500 }, permits: { written: 2000 } } },
  ]);
  const cov = await admin.from('archive_coverage').select('*').in('week', [W_A, W_B, W_C]);
  check('coverage view returned rows', !cov.error && (cov.data?.length ?? 0) > 0, cov.error?.message);
  const at = (week: string, ds: string) => (cov.data ?? []).find((r) => r.week === week && r.dataset === ds);
  check('W_A sales flagged is_gap (ran but wrote ZERO)', at(W_A, 'sales')?.is_gap === true, JSON.stringify(at(W_A, 'sales')));
  check('W_A permits NOT a gap (wrote 2000)', at(W_A, 'permits')?.is_gap === false, JSON.stringify(at(W_A, 'permits')));
  check('W_B sales flagged is_gap (MISSING week — no run)', at(W_B, 'sales')?.is_gap === true, JSON.stringify(at(W_B, 'sales')));
  check('W_C sales NOT a gap (wrote 500)', at(W_C, 'sales')?.is_gap === false, JSON.stringify(at(W_C, 'sales')));

  await cleanup();
  console.log(`\n${failures === 0 ? '✓ ALL ARCHIVE INTEGRITY CHECKS PASSED' : `✗ ${failures} CHECK(S) FAILED`}\n`);
  process.exit(failures === 0 ? 0 : 1);
})().catch(async (e) => {
  console.error(e);
  await cleanup();
  process.exit(1);
});
