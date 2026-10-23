// WS2 interaction captures: phone nav sheet, signed-in nav, hero address box states.
// node scripts/ui/ws2-interactions.mjs --out build-log/ui-ws-2/after/interactions
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).map((a, i, arr) => a.startsWith('--') ? [a.slice(2), arr[i + 1]] : []).filter(Boolean));
const out = args.out ?? 'build-log/ui-ws-2/after/interactions';
const base = args.base ?? 'http://localhost:3000';
const state = args.state ?? '/private/tmp/claude-501/-Users-victor/5925fa8b-5f90-4f71-b53e-01ddc67bbac9/scratchpad/state.json';
fs.mkdirSync(out, { recursive: true });
const shot = (page, name) => page.screenshot({ path: path.join(out, `${name}.jpg`), type: 'jpeg', quality: 78 });
const errors = [];

const browser = await chromium.launch();
async function ctx(width, opts = {}) {
  const c = await browser.newContext({ viewport: { width, height: width < 500 ? 844 : 900 }, deviceScaleFactor: 1, ...opts });
  const p = await c.newPage();
  p.on('console', async (m) => {
    if (m.type() !== 'error' && m.type() !== 'warning') return;
    let vals = [];
    try { vals = await Promise.all(m.args().slice(0, 4).map((a) => a.jsonValue().catch(() => '?'))); } catch {}
    errors.push(`[${m.type()}] ${m.text().slice(0, 160)} | args: ${JSON.stringify(vals).slice(0, 2500)}`);
  });
  p.on('pageerror', (e) => errors.push(`[pageerror] ${String(e).slice(0, 160)}`));
  return { c, p };
}

// 1. Phone nav sheet: open, focus trap, Escape
{
  const { c, p } = await ctx(390);
  await p.goto(base + '/', { waitUntil: 'networkidle' });
  await p.click('#nav-mobile-toggle');
  await p.waitForSelector('#nav-mobile-menu');
  await p.waitForTimeout(600);
  await shot(p, 'nav-sheet-390');
  const focused1 = await p.evaluate(() => document.activeElement?.textContent?.trim());
  for (let i = 0; i < 12; i++) await p.keyboard.press('Tab');
  const stillInside = await p.evaluate(() => !!document.activeElement?.closest('#nav-mobile-menu, #nav-mobile-toggle'));
  await p.keyboard.press('Escape');
  await p.waitForTimeout(400);
  const closed = (await p.$('#nav-mobile-menu')) === null;
  const focusBack = await p.evaluate(() => document.activeElement?.id);
  fs.writeFileSync(path.join(out, 'nav-sheet.json'), JSON.stringify({ firstFocus: focused1, tabStaysInside: stillInside, closedOnEscape: closed, focusReturnedTo: focusBack }, null, 2));
  await c.close();
}

// 2. Signed-in nav (desktop + phone)
if (fs.existsSync(state)) {
  for (const w of [1440, 768, 390]) {
    const { c, p } = await ctx(w, { storageState: state });
    await p.goto(base + '/', { waitUntil: 'networkidle' });
    await p.waitForTimeout(2500);
    if (w !== 1440) { await p.click('#nav-mobile-toggle'); await p.waitForTimeout(600); }
    await shot(p, `nav-signed-in-${w}`);
    await c.close();
  }
}

// 3. Address box states
const cases = [
  ['example', '175 3rd Street, Brooklyn'],
  ['nyc', '74 Grand Avenue, Brooklyn'],
  ['non-nyc', '233 S Wacker Dr, Chicago, IL'],
  ['none', 'asdfgh qwerty'],
];
for (const w of [1440, 390]) {
  const { c, p } = await ctx(w);
  await p.goto(base + '/', { waitUntil: 'networkidle' });
  for (const [name, addr] of cases) {
    await p.fill('.hero-address-input', addr);
    await p.click('.hero-address-btn');
    await p.waitForSelector('.hero-address-card:not(.hero-address-card-quiet), .hero-address-card[role="status"]', { timeout: 30000 });
    await p.waitForTimeout(300);
    if (w === 390) await p.locator('.hero-address').scrollIntoViewIfNeeded();
    await shot(p, `address-${name}-${w}`);
  }
  // loading state
  await p.fill('.hero-address-input', '100 Main St, Flushing');
  await p.click('.hero-address-btn');
  await p.waitForTimeout(120);
  await shot(p, `address-loading-${w}`);
  await c.close();
}
await browser.close();
fs.writeFileSync(path.join(out, 'console.json'), JSON.stringify(errors, null, 2));
console.log('done; console entries:', errors.length);
