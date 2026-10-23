// WS3 interaction captures: the evidence drawer (desktop + phone), the watch
// sheet, the phone lens sheet, with focus-trap and deep-link checks.
// node scripts/ui/ws3-interactions.mjs --state <storageState.json> --out build-log/ui-ws-3/after/interactions
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).map((a, i, arr) => a.startsWith('--') ? [a.slice(2), arr[i + 1]] : []).filter(Boolean));
const out = args.out ?? 'build-log/ui-ws-3/after/interactions';
const base = args.base ?? 'http://localhost:3000';
const state = args.state;
const address = args.address ?? '425 6th Street, Brooklyn, NY 11215';
fs.mkdirSync(out, { recursive: true });
const shot = (page, name) => page.screenshot({ path: path.join(out, `${name}.jpg`), type: 'jpeg', quality: 78 });
const errors = [];
const checks = {};
const browser = await chromium.launch();
async function ctx(width) {
  const c = await browser.newContext({ viewport: { width, height: width < 500 ? 844 : 900 }, deviceScaleFactor: 1, storageState: state });
  const p = await c.newPage();
  p.on('console', (m) => { if ((m.type() === 'error' || m.type() === 'warning') && !/GL Driver|development keys/.test(m.text())) errors.push(`[${m.type()}] ${m.text().slice(0, 200)}`); });
  p.on('pageerror', (e) => errors.push(`[pageerror] ${String(e).slice(0, 200)}`));
  return { c, p };
}
async function waitForDone(page, timeoutMs = 300000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const n = await page.locator('.verdict-band-done, .verdict-band-error').count();
    if (n) return (await page.locator('.verdict-band-done').count()) > 0;
    await page.waitForTimeout(3000);
  }
  return false;
}

// 1. Sheets that need no run (phone lens sheet, watch sheet desktop + phone)
{
  const { c, p } = await ctx(390);
  await p.goto(base + '/dashboard', { waitUntil: 'load' });
  await p.waitForTimeout(2500);
  await p.click('.shell-lens-btn');
  await p.waitForTimeout(500);
  await shot(p, 'lens-sheet-390');
  checks.lensSheetFirstFocus = await p.evaluate(() => document.activeElement?.textContent?.trim().slice(0, 30));
  await p.keyboard.press('Escape');
  await p.waitForTimeout(400);
  checks.lensSheetClosedOnEscape = (await p.locator('#shell-lens-sheet').count()) === 0;
  await p.click('[data-tab="search"]');
  await p.waitForTimeout(1200);
  await shot(p, 'search-sheet-390');
  await p.keyboard.press('Escape');
  await p.waitForTimeout(400);
  await p.click('[data-tab="watch"]');
  await p.waitForTimeout(1500);
  await shot(p, 'watch-sheet-390');
  await p.keyboard.press('Escape');
  await c.close();
}
{
  const { c, p } = await ctx(1440);
  await p.goto(base + '/dashboard', { waitUntil: 'load' });
  await p.waitForTimeout(2500);
  await p.click('.shell-side button[aria-label="Watchlist"]');
  await p.waitForTimeout(1500);
  await shot(p, 'watch-sheet-1440');
  for (let i = 0; i < 10; i++) await p.keyboard.press('Tab');
  checks.watchTabStaysInside = await p.evaluate(() => !!document.activeElement?.closest('#shell-watch-sheet'));
  await p.keyboard.press('Escape');
  await p.waitForTimeout(400);
  checks.watchFocusReturned = await p.evaluate(() => document.activeElement?.getAttribute('aria-label'));
  await c.close();
}

// 2. A real run in the Property lens, then the drawer
{
  const { c, p } = await ctx(1440);
  await p.goto(base + '/dashboard', { waitUntil: 'load' });
  await p.waitForTimeout(2500);
  await p.locator('[data-lens="cluster_1"]').first().click();
  await p.waitForTimeout(1200);
  await p.locator('.gsearch-bar input').fill(address);
  await shot(p, 'search-typed-1440');
  await p.locator('.gsearch-bar input').press('Enter');
  await p.waitForTimeout(4000);
  await shot(p, 'band-resolving-or-running-1440');
  checks.runDone = await waitForDone(p);
  await p.waitForTimeout(1500);
  await shot(p, 'band-done-1440');
  await p.click('.band-actions button:has-text("Math")');
  await p.waitForTimeout(800);
  await shot(p, 'drawer-math-1440');
  checks.drawerHash = await p.evaluate(() => location.hash);
  checks.drawerFirstFocus = await p.evaluate(() => document.activeElement?.id);
  await p.click('#drawer-tab-sources');
  await p.waitForTimeout(800);
  await shot(p, 'drawer-sources-1440');
  await p.click('#drawer-tab-reasoning');
  await p.waitForTimeout(600);
  await shot(p, 'drawer-reasoning-1440');
  await p.click('#drawer-tab-coverage');
  await p.waitForTimeout(600);
  await shot(p, 'drawer-coverage-1440');
  for (let i = 0; i < 15; i++) await p.keyboard.press('Tab');
  checks.drawerTabStaysInside = await p.evaluate(() => !!document.activeElement?.closest('#evidence-drawer'));
  await p.keyboard.press('Escape');
  await p.waitForTimeout(500);
  checks.drawerClosedOnEscape = (await p.locator('#evidence-drawer').count()) === 0;
  checks.hashClearedOnClose = await p.evaluate(() => location.hash);
  // phone: same page resized
  await p.setViewportSize({ width: 390, height: 844 });
  await p.waitForTimeout(600);
  await p.evaluate(() => window.scrollTo(0, 0));
  await shot(p, 'band-done-390');
  await p.click('.band-actions button:has-text("Sources")');
  await p.waitForTimeout(800);
  await shot(p, 'drawer-sources-390');
  await p.click('#drawer-tab-math');
  await p.waitForTimeout(600);
  await shot(p, 'drawer-math-390');
  await p.keyboard.press('Escape');
  await p.setViewportSize({ width: 768, height: 1024 });
  await p.waitForTimeout(600);
  await p.click('.band-actions button:has-text("Reasoning")');
  await p.waitForTimeout(800);
  await shot(p, 'drawer-reasoning-768');
  await c.close();
}
await browser.close();
fs.writeFileSync(path.join(out, 'checks.json'), JSON.stringify(checks, null, 2));
fs.writeFileSync(path.join(out, 'console.json'), JSON.stringify(errors, null, 2));
console.log('done', JSON.stringify(checks), 'console entries:', errors.length);
