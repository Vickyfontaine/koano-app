// WS5: the shareable sealed record. Takes the latest verdict from the history,
// asks for its share link (owner), opens it signed OUT at 1440/768/390, and
// checks that a bad token and a missing token both 404.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
const args = Object.fromEntries(process.argv.slice(2).map((a, i, arr) => a.startsWith('--') ? [a.slice(2), arr[i + 1]] : []).filter(Boolean));
const out = args.out ?? 'build-log/ui-ws-5/after/interactions';
const base = args.base ?? 'http://localhost:3000';
fs.mkdirSync(out, { recursive: true });
const errors = []; const checks = {};
const browser = await chromium.launch();
const owner = await browser.newContext({ viewport: { width: 1440, height: 900 }, storageState: args.state });
const op = await owner.newPage();
op.on('console', (m) => { if ((m.type() === 'error' || m.type() === 'warning') && !/GL Driver|development keys/.test(m.text())) errors.push(`[${m.type()}] ${m.text().slice(0, 200)}`); });
await op.goto(base + '/dashboard', { waitUntil: 'load' }); await op.waitForTimeout(1500);
const latest = await op.evaluate(async () => { const r = await fetch('/api/verdicts?limit=1'); const j = await r.json(); return j.verdicts?.[0]?.id ?? null; });
checks.latestId = latest;
const share = await op.evaluate(async (id) => { const r = await fetch(`/api/verdicts/${id}/share`); return { status: r.status, body: await r.json() }; }, latest);
checks.shareStatus = share.status; const url = share.body.url; checks.shareUrlHasToken = /\?t=[0-9a-f]{32}$/.test(url ?? '');
await op.goto(url, { waitUntil: 'load' }); await op.waitForTimeout(1500);
await op.screenshot({ path: path.join(out, 'share-owner-1440.jpg'), type: 'jpeg', quality: 78, fullPage: true });
await owner.close();
for (const w of [1440, 768, 390]) {
  const c = await browser.newContext({ viewport: { width: w, height: w < 500 ? 844 : 900 } });
  const p = await c.newPage();
  p.on('console', (m) => { if ((m.type() === 'error' || m.type() === 'warning') && !/GL Driver|development keys/.test(m.text())) errors.push(`[${m.type()}] ${m.text().slice(0, 200)}`); });
  const r = await p.goto(url, { waitUntil: 'load' }); await p.waitForTimeout(1500);
  checks[`anon${w}`] = r.status();
  checks[`overflow${w}`] = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  await p.screenshot({ path: path.join(out, `share-anon-${w}.jpg`), type: 'jpeg', quality: 78, fullPage: w !== 1440 });
  if (w === 1440) {
    const bad = await p.goto(url.replace(/t=.*/, 't=' + '0'.repeat(32)), { waitUntil: 'load' }); checks.badToken = bad.status();
    const none = await p.goto(url.replace(/\?t=.*/, ''), { waitUntil: 'load' }); checks.noToken = none.status();
  }
  await c.close();
}
await browser.close();
fs.writeFileSync(path.join(out, 'share-checks.json'), JSON.stringify(checks, null, 2));
fs.writeFileSync(path.join(out, 'share-console.json'), JSON.stringify(errors, null, 2));
console.log('done', JSON.stringify(checks), 'console entries:', errors.length);
