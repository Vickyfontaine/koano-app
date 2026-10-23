// WS5: Trace on a finished run (one real run), the thread for the verdict, an
// agent vote in the drawer, and a ledger row; the T key; dimming.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
const args = Object.fromEntries(process.argv.slice(2).map((a, i, arr) => a.startsWith('--') ? [a.slice(2), arr[i + 1]] : []).filter(Boolean));
const out = args.out ?? 'build-log/ui-ws-5/after/interactions';
const base = args.base ?? 'http://localhost:3000';
const address = args.address ?? '425 6th Street, Brooklyn, NY 11215';
fs.mkdirSync(out, { recursive: true });
const errors = []; const checks = {};
const browser = await chromium.launch();
const c = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, storageState: args.state });
const p = await c.newPage();
p.on('console', (m) => { if ((m.type() === 'error' || m.type() === 'warning') && !/GL Driver|development keys/.test(m.text())) errors.push(`[${m.type()}] ${m.text().slice(0, 200)}`); });
p.on('pageerror', (e) => errors.push(`[pageerror] ${String(e).slice(0, 200)}`));
const shot = (name) => p.screenshot({ path: path.join(out, `${name}.jpg`), type: 'jpeg', quality: 78 });
await p.goto(base + '/dashboard', { waitUntil: 'load' }); await p.waitForTimeout(2500);
await p.locator('[data-lens="cluster_2"]').first().click(); await p.waitForTimeout(1000);
await p.locator('.gsearch-bar input').fill(address); await p.locator('.gsearch-bar input').press('Enter');
try { await p.waitForSelector('.verdict-band-done', { timeout: 300000 }); } catch {}
await p.waitForTimeout(1500);
checks.done = (await p.locator('.verdict-band-done').count()) > 0;
// Trace via the button
await p.locator('.band-actions button:has-text("Trace")').click(); await p.waitForTimeout(400);
checks.traceOnBody = await p.evaluate(() => document.body.classList.contains('trace-on'));
await p.hover('[data-trace="verdict"]'); await p.waitForTimeout(500);
checks.verdictThreadSegments = await p.locator('.trace-seg').count();
checks.dimmedCount = await p.evaluate(() => Array.from(document.querySelectorAll('[data-trace]')).filter((el) => getComputedStyle(el).opacity !== '1').length);
await shot('trace-verdict-1440');
// an agent vote in the drawer's math tab
await p.locator('.band-actions button:has-text("Math")').click(); await p.waitForTimeout(800);
const row = p.locator('#evidence-drawer [data-trace^="agent:"]').first();
await row.hover(); await p.waitForTimeout(500);
checks.agentThreadSegments = await p.locator('.trace-seg').count();
checks.agentFocus = await p.evaluate(() => document.querySelector('.trace-list')?.getAttribute('aria-label'));
await shot('trace-agent-drawer-1440');
// a ledger row (reverse trace)
await p.locator('#drawer-tab-sources').click(); await p.waitForTimeout(800);
const lrow = p.locator('#evidence-drawer [data-trace^="point:"]').first();
await lrow.hover(); await p.waitForTimeout(500);
checks.pointThreadSegments = await p.locator('.trace-seg').count();
checks.ledgerRowFocusable = await lrow.getAttribute('tabindex');
await shot('trace-ledger-drawer-1440');
await p.keyboard.press('Escape'); await p.waitForTimeout(400);
// T toggles off (not while typing)
await p.keyboard.press('t'); await p.waitForTimeout(300);
checks.traceOffAfterT = !(await p.evaluate(() => document.body.classList.contains('trace-on')));
await p.locator('.gsearch-bar input').focus(); await p.keyboard.press('t');
checks.typingTDoesNotToggle = !(await p.evaluate(() => document.body.classList.contains('trace-on')));
await p.locator('.gsearch-bar input').fill(''); await p.keyboard.press('Escape');
// phone
await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(500);
await p.evaluate(() => window.scrollTo(0, 0));
await p.locator('.band-compact-row button').click().catch(() => {}); await p.waitForTimeout(300);
await p.locator('.band-actions button:has-text("Trace")').click(); await p.waitForTimeout(300);
await p.locator('[data-trace="verdict"]').focus(); await p.waitForTimeout(500);
await shot('trace-verdict-390');
checks.phoneOverflow = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
await browser.close();
fs.writeFileSync(path.join(out, 'trace-checks.json'), JSON.stringify(checks, null, 2));
fs.writeFileSync(path.join(out, 'trace-console.json'), JSON.stringify(errors, null, 2));
console.log('done', JSON.stringify(checks), 'console entries:', errors.length);
