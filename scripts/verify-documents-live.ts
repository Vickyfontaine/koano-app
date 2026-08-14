// Live end-to-end verification of /api/documents (the DocumentButton's route).
// Mints a real Clerk session token for the portfolio test user, then drives the
// exact requests the DocumentButton sends. Usage:
//   npx tsx scripts/verify-documents-live.ts
import { writeFileSync, mkdirSync } from 'fs';
import { loadEnv } from './_loadenv';
loadEnv();

const SECRET = process.env.CLERK_SECRET_KEY;
const USER_ID = process.env.TEST_USER_ID ?? 'user_3GQMahdep0Ul9kYkITIGo5bk8fQ'; // portfolio plan
const BASE = process.env.BASE ?? 'http://localhost:3002';
const ADDRESS = '175 3rd Street, Brooklyn, NY';
const OUT = process.env.SCRATCH ?? '/tmp';
mkdirSync(OUT, { recursive: true });

let failures = 0;
function check(name: string, cond: boolean, detail?: string) {
  console.log(`  ${cond ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`);
  if (!cond) failures++;
}

async function mintToken(): Promise<string> {
  const s = await fetch('https://api.clerk.com/v1/sessions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${SECRET}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: USER_ID }),
  });
  const sj = await s.json();
  if (!s.ok) throw new Error(`session create ${s.status}: ${JSON.stringify(sj)}`);
  const t = await fetch(`https://api.clerk.com/v1/sessions/${sj.id}/tokens`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${SECRET}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ expires_in_seconds: 600 }),
  });
  const tj = await t.json();
  if (!t.ok) throw new Error(`token mint ${t.status}: ${JSON.stringify(tj)}`);
  return tj.jwt as string;
}

interface DocResult {
  status: number;
  ct: string;
  buf?: Buffer;
  json?: Record<string, unknown>;
  cd?: string | null;
  prov?: string | null;
}
async function callDoc(jwt: string | null, body: unknown): Promise<DocResult> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (jwt) headers.Authorization = `Bearer ${jwt}`;
  const res = await fetch(`${BASE}/api/documents`, { method: 'POST', headers, body: JSON.stringify(body) });
  const ct = res.headers.get('content-type') ?? '';
  if (ct.includes('application/pdf')) {
    const ab = await res.arrayBuffer();
    return { status: res.status, ct, buf: Buffer.from(ab), cd: res.headers.get('content-disposition'), prov: res.headers.get('x-koano-provenance') };
  }
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { status: res.status, ct, json };
}

async function docCount(jwt: string): Promise<number> {
  // Count via the API is not exposed; count through the DB service role instead.
  const { supabaseAdmin } = await import('../lib/supabase/server');
  const r = await supabaseAdmin()
    .from('documents')
    .select('id', { count: 'exact', head: true })
    .eq('clerk_user_id', USER_ID);
  return r.count ?? 0;
}

(async () => {
  if (!SECRET) throw new Error('CLERK_SECRET_KEY missing');
  console.log(`\nBASE=${BASE}  user=${USER_ID}`);

  console.log('\n[0] Auth');
  const noAuth = await callDoc(null, { docType: 'tax_appeal_packet', address: ADDRESS, format: 'pdf', buildSource: 'verdict' });
  check('unauthenticated → 401', noAuth.status === 401, `${noAuth.status}`);
  const jwt = await mintToken();
  check('minted Clerk session token', !!jwt);

  const before = await docCount(jwt);

  console.log('\n[1] tax_appeal_packet — buildSource=verdict (no new generation)');
  const v = await callDoc(jwt, { docType: 'tax_appeal_packet', address: ADDRESS, format: 'pdf', buildSource: 'verdict' });
  check('200 OK', v.status === 200, `${v.status}${v.json ? ' ' + JSON.stringify(v.json) : ''}`);
  check('Content-Type application/pdf', v.ct.includes('application/pdf'), v.ct);
  check('valid PDF buffer', !!v.buf && v.buf.subarray(0, 5).toString('latin1') === '%PDF-', v.buf ? `${v.buf.length}b` : 'no buf');
  check('Content-Disposition attachment', !!v.cd && v.cd.includes('attachment'), v.cd ?? '');
  check('X-KOANO-Provenance live', v.prov === 'live', v.prov ?? '');
  if (v.buf) { const p = `${OUT}/live-tax-appeal-verdict.pdf`; writeFileSync(p, v.buf); console.log(`  wrote ${p}`); }

  console.log('\n[2] tax_appeal_packet — buildSource=fresh (1 content generation)');
  const f = await callDoc(jwt, { docType: 'tax_appeal_packet', address: ADDRESS, format: 'pdf', buildSource: 'fresh' });
  check('200 OK', f.status === 200, `${f.status}${f.json ? ' ' + JSON.stringify(f.json) : ''}`);
  check('valid PDF buffer', !!f.buf && f.buf.subarray(0, 5).toString('latin1') === '%PDF-', f.buf ? `${f.buf.length}b` : 'no buf');
  if (f.buf) { const p = `${OUT}/live-tax-appeal-fresh.pdf`; writeFileSync(p, f.buf); console.log(`  wrote ${p}`); }

  console.log('\n[3] Guard / validation paths');
  const blocked = await callDoc(jwt, { docType: 'pro_forma_summary', address: ADDRESS, format: 'pdf', buildSource: 'verdict' });
  check('blocked type → 409', blocked.status === 409, `${blocked.status} ${JSON.stringify(blocked.json)}`);
  const unimpl = await callDoc(jwt, { docType: 'property_intelligence_report', address: ADDRESS, format: 'pdf', buildSource: 'verdict' });
  check('declared-but-unimplemented → 501', unimpl.status === 501, `${unimpl.status}`);
  const badFmt = await callDoc(jwt, { docType: 'tax_appeal_packet', address: ADDRESS, format: 'docx', buildSource: 'verdict' });
  check('unsupported format (docx on pdf-only) → 400', badFmt.status === 400, `${badFmt.status}`);
  const unknown = await callDoc(jwt, { docType: 'nope', address: ADDRESS });
  check('unknown docType → 404', unknown.status === 404, `${unknown.status}`);

  console.log('\n[4] Append-only audit rows');
  const after = await docCount(jwt);
  check('documents rows increased by 2 (verdict + fresh)', after - before === 2, `before=${before} after=${after}`);

  console.log(`\n${failures === 0 ? '✓ ALL LIVE CHECKS PASSED' : `✗ ${failures} CHECK(S) FAILED`}\n`);
  process.exit(failures === 0 ? 0 : 1);
})();
