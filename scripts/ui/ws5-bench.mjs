// WS5: capture the Bench mid-run and at the decision (one real run).
// node scripts/ui/ws5-bench.mjs --state <storageState.json> --out build-log/ui-ws-5/after/interactions
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
const args = Object.fromEntries(process.argv.slice(2).map((a, i, arr) => a.startsWith('--') ? [a.slice(2), arr[i + 1]] : []).filter(Boolean));
const out = args.out ?? 'build-log/ui-ws-5/after/interactions';
const base = args.base ?? 'http://localhost:3000';
const address = args.address ?? '425 6th Street, Brooklyn, NY 11215';
fs.mkdirSync(out, { recursive: true });
const errors = [];
const checks = {};
const browser = await chromium.launch();
const c = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, storageState: args.state });
const p = await c.newPage();
p.on('console', (m) => { if ((m.type() === 'error' || m.type() === 'warning') && !/GL Driver|development keys/.test(m.text())) errors.push(`[${m.type()}] ${m.text().slice(0, 200)}`); });
p.on('pageerror', (e) => errors.push(`[pageerror] ${String(e).slice(0, 200)}`));
const shot = (name) => p.screenshot({ path: path.join(out, `${name}.jpg`), type: 'jpeg', quality: 78 });
await p.goto(base + '/dashboard', { waitUntil: 'load' });
await p.waitForTimeout(2500);
await p.locator('[data-lens="cluster_1"]').first().click();
await p.waitForTimeout(1000);
await p.locator('.gsearch-bar input').fill(address);
await p.locator('.gsearch-bar input').press('Enter');
const t0 = Date.now();
// Stage 1: agents reading (wait for the first agent to seal, max 60s)
try { await p.waitForSelector('.bench-col-complete', { timeout: 90000 }); } catch {}
await p.waitForTimeout(600);
checks.firstSealAt = Math.round((Date.now() - t0) / 1000);
await shot('bench-reading-1440');
// Stage 2: decision before narration
try { await p.waitForSelector('.bench-decision', { timeout: 240000 }); } catch {}
checks.decisionAt = Math.round((Date.now() - t0) / 1000);
checks.decisionBeforeDone = (await p.locator('.verdict-band-done').count()) === 0;
checks.decisionText = (await p.locator('.bench-decision .band-word').textContent().catch(() => null));
await p.waitForTimeout(700);
await shot('bench-decision-1440');
await p.setViewportSize({ width: 390, height: 844 });
await p.waitForTimeout(500);
await p.evaluate(() => window.scrollTo(0, 0));
await shot('bench-decision-390');
await p.setViewportSize({ width: 1440, height: 900 });
// Stage 3: done
try { await p.waitForSelector('.verdict-band-done', { timeout: 240000 }); } catch {}
checks.doneAt = Math.round((Date.now() - t0) / 1000);
checks.doneWord = (await p.locator('.verdict-band-done .band-word').textContent().catch(() => null));
checks.decisionMatchesDone = checks.decisionText && checks.doneWord ? checks.decisionText.trim() === checks.doneWord.trim() : null;
await p.waitForTimeout(800);
await shot('bench-done-1440');
await browser.close();
fs.writeFileSync(path.join(out, 'bench-checks.json'), JSON.stringify(checks, null, 2));
fs.writeFileSync(path.join(out, 'bench-console.json'), JSON.stringify(errors, null, 2));
console.log('done', JSON.stringify(checks), 'console entries:', errors.length);
