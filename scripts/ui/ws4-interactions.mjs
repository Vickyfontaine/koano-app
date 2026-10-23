// WS4 interaction captures: phone map toggle, swipe lists, the owner/renter
// switch, the lot-zoom control, and the sticky action, around one real run.
// node scripts/ui/ws4-interactions.mjs --state <storageState.json> --out build-log/ui-ws-4/after/interactions
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).map((a, i, arr) => a.startsWith('--') ? [a.slice(2), arr[i + 1]] : []).filter(Boolean));
const out = args.out ?? 'build-log/ui-ws-4/after/interactions';
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
    if (await page.locator('.verdict-band-done, .verdict-band-error').count()) return (await page.locator('.verdict-band-done').count()) > 0;
    await page.waitForTimeout(3000);
  }
  return false;
}
const overflow = (page) => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

// Property lens at 390: run, persona switch, map toggle, findings order, sticky
{
  const { c, p } = await ctx(390);
  await p.goto(base + '/dashboard', { waitUntil: 'load' });
  await p.waitForTimeout(2500);
  await p.click('.shell-lens-btn');
  await p.waitForTimeout(500);
  await p.locator('#shell-lens-sheet [data-lens="cluster_1"]').click();
  await p.waitForTimeout(1000);
  await p.click('[data-tab="search"]');
  await p.waitForTimeout(800);
  await p.locator('#shell-search-sheet input').fill(address);
  await p.locator('#shell-search-sheet input').press('Enter');
  checks.runDone = await waitForDone(p);
  await p.waitForTimeout(2500);
  await shot(p, 'property-done-390-top');
  checks.propertyOverflow390 = await overflow(p);
  await p.locator('.segmented button:has-text("I rent here")').click();
  await p.waitForTimeout(600);
  checks.renterHeading = await p.locator('#c1-alerts h3').first().textContent();
  await p.locator('#c1-alerts').scrollIntoViewIfNeeded();
  await p.waitForTimeout(300);
  await shot(p, 'property-renter-findings-390');
  await p.locator('#c1-map').scrollIntoViewIfNeeded();
  await p.waitForTimeout(300);
  await shot(p, 'property-map-collapsed-390');
  const toggle = p.locator('#c1-map button:has-text("Show map")');
  checks.mapToggleVisible = (await toggle.count()) > 0;
  if (checks.mapToggleVisible) {
    await toggle.click();
    await p.waitForTimeout(3500);
    await shot(p, 'property-map-open-390');
    const lotBtn = p.locator('.map-frame-controls button:has-text("Lot")');
    checks.lotControl = (await lotBtn.count()) > 0;
    if (checks.lotControl) { await lotBtn.click(); await p.waitForTimeout(2500); await shot(p, 'property-map-lot-390'); }
  }
  checks.propertyOverflowAfterMap = await overflow(p);
  await c.close();
}

// Price lens at 390: comp cards, sticky documents, tiles
{
  const { c, p } = await ctx(390);
  await p.goto(base + '/dashboard', { waitUntil: 'load' });
  await p.waitForTimeout(2500);
  await p.click('.shell-lens-btn'); await p.waitForTimeout(500);
  await p.locator('#shell-lens-sheet [data-lens="cluster_2"]').click(); await p.waitForTimeout(1000);
  await p.click('[data-tab="search"]'); await p.waitForTimeout(800);
  await p.locator('#shell-search-sheet input').fill(address);
  await p.locator('#shell-search-sheet input').press('Enter');
  checks.priceRunDone = await waitForDone(p);
  await p.waitForTimeout(2500);
  await p.locator('#c2-pricing').scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
  await shot(p, 'price-pricing-first-390');
  await p.locator('#c2-cma').scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
  await shot(p, 'price-comp-cards-390');
  checks.compCardsVisible = await p.locator('#c2-cma .comp-card').first().isVisible();
  checks.compTableHidden = !(await p.locator('#c2-cma table').first().isVisible().catch(() => false));
  checks.stickyVisible = await p.locator('.sticky-action').first().isVisible();
  checks.priceOverflow390 = await overflow(p);
  await c.close();
}

// Acquire lens: this-week tiles and holding cards at 390, table at 1440
{
  const { c, p } = await ctx(390);
  await p.goto(base + '/dashboard', { waitUntil: 'load' });
  await p.waitForTimeout(2500);
  await p.click('.shell-lens-btn'); await p.waitForTimeout(500);
  await p.locator('#shell-lens-sheet [data-lens="cluster_5"]').click(); await p.waitForTimeout(4000);
  await p.locator('#c5-week').scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
  await shot(p, 'acquire-this-week-390');
  await p.locator('#c5-portfolio').scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
  await shot(p, 'acquire-holding-cards-390');
  checks.holdingCardsVisible = await p.locator('.holding-card').first().isVisible().catch(() => false);
  checks.acquireOverflow390 = await overflow(p);
  await c.close();
}
await browser.close();
fs.writeFileSync(path.join(out, 'checks.json'), JSON.stringify(checks, null, 2));
fs.writeFileSync(path.join(out, 'console.json'), JSON.stringify(errors, null, 2));
console.log('done', JSON.stringify(checks), 'console entries:', errors.length);
