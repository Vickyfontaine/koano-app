// Supabase error returns are handled (Phase 0). supabase-js reports a failed
// query in { error } instead of throwing, so an unchecked call fails silently.
// A fake client returns errors on chosen tables and operations, and the
// monitoring paths are checked for reporting them. No network: the email send
// goes to a stubbed fetch.   npx tsx scripts/test-supabase-errors.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import { sendWeeklyDigests } from '../lib/monitor/digest';
import { scanMonitoring } from '../lib/monitor/scan';

type Op = 'select' | 'insert' | 'update' | 'upsert';
type Responder = (table: string, op: Op) => { data: unknown; error: { message: string } | null };

function fakeClient(respond: Responder): SupabaseClient {
  const builder = (table: string) => {
    let op: Op = 'select';
    const b: Record<string, unknown> = {};
    const chain = () => b;
    for (const m of ['eq', 'in', 'order', 'limit', 'gte', 'gt', 'is', 'neq']) b[m] = chain;
    b.select = () => b;
    b.insert = () => ((op = 'insert'), b);
    b.update = () => ((op = 'update'), b);
    b.upsert = () => ((op = 'upsert'), b);
    b.single = () => Promise.resolve(respond(table, op));
    b.maybeSingle = () => Promise.resolve(respond(table, op));
    b.then = (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) => Promise.resolve(respond(table, op)).then(res, rej);
    return b;
  };
  return { from: builder } as unknown as SupabaseClient;
}

let fail = 0;
const ok = (name: string, cond: boolean) => {
  if (!cond) fail++;
  console.log(`${cond ? '✓' : '✗'} ${name}`);
};
const quiet = console.error;

(async () => {
  process.env.MONITORING_EMAIL_FROM = 'monitoring@koano.co';
  process.env.RESEND_API_KEY = 'test-key';
  process.env.NEXT_PUBLIC_APP_URL = 'https://www.koano.co';
  const sent: string[] = [];
  globalThis.fetch = (async (url: string) => {
    sent.push(String(url));
    return { ok: true, status: 200, json: async () => ({ id: 'x' }), text: async () => '' };
  }) as unknown as typeof fetch;
  const logs: string[] = [];
  console.error = (...a: unknown[]) => logs.push(a.map(String).join(' '));

  const pending = [{ id: 'n1', clerk_user_id: 'u1', property_id: 'p1', signal_type: 'violations', severity: 'material', title: 'Open HPD violations: 7 to 3', body: 'b', link_path: null, data: {} }];

  // 1. The pending read fails: the digest throws (the cron records it), nothing is sent.
  let threw = false;
  try {
    await sendWeeklyDigests(fakeClient((t, op) => (t === 'notifications' && op === 'select' ? { data: null, error: { message: 'down' } } : { data: null, error: null })));
  } catch {
    threw = true;
  }
  ok('a failed pending read throws instead of reporting "nothing to send"', threw && sent.length === 0);

  // 2. The preferences read fails: that user is left pending, nothing is sent.
  const r2 = await sendWeeklyDigests(
    fakeClient((t, op) =>
      t === 'notifications' && op === 'select' ? { data: pending, error: null } : t === 'monitoring_preferences' ? { data: null, error: { message: 'timeout' } } : { data: null, error: null },
    ),
  );
  ok('a failed preferences read leaves the user pending and sends nothing', r2.usersEmailed === 0 && sent.length === 0 && logs.some((l) => /preferences read failed/.test(l)));

  // 3. The email goes out but the "sent" mark fails: logged loudly.
  logs.length = 0;
  const r3 = await sendWeeklyDigests(
    fakeClient((t, op) => {
      if (t === 'notifications' && op === 'select') return { data: pending, error: null };
      if (t === 'notifications' && op === 'update') return { data: null, error: { message: 'write refused' } };
      if (t === 'monitoring_preferences') return { data: null, error: null };
      if (t === 'profiles') return { data: { email: 'owner@example.com' }, error: null };
      if (t === 'properties') return { data: [{ id: 'p1', address_normalized: '425 6 STREET, Brooklyn, NY, USA' }], error: null };
      return { data: null, error: null };
    }),
  );
  ok('a failed "sent" mark after a send is logged as a re-send risk', r3.usersEmailed === 1 && logs.some((l) => /could not mark 1 notifications sent/.test(l)));

  // 4. A snapshot read fails during the scan: that dataset is skipped and counted; the scan finishes.
  const res4 = await scanMonitoring(
    fakeClient((t) => (t === 'archive_snapshots' ? { data: null, error: { message: 'relation busy' } } : { data: [], error: null })),
    '2026-10-26',
    [{ id: 'p1', clerk_user_id: 'u1', bbl: '3010240074', tract_geoid: '36047015100', zip: '11215', created_at: '' }],
    new Set(['p1']),
  );
  ok('a failed snapshot read is counted and the scan continues', res4.propertiesChecked === 1 && res4.readErrors >= 4);

  console.error = quiet;
  if (fail) process.exit(1);
  console.log('✓ Supabase error returns are reported');
})();
