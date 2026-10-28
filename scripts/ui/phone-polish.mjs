// Phone polish checks (founder pass after the UI sprint), at 390:
//  - Acquire: the sticky action never overlaps an opened map, and its in-flow
//    slot leaves no band of space between panels (it is the last block).
//  - Row values: no multi-word value breaks one word per line (Property lens,
//    after one real run).
// node scripts/ui/phone-polish.mjs --state <storageState.json> --out build-log/phone-polish
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const args = Object.fromEntries(process.argv.slice(2).map((a, i, arr) => (a.startsWith("--") ? [a.slice(2), arr[i + 1]] : [])).filter((x) => x.length));
const out = args.out ?? "build-log/phone-polish";
const base = args.base ?? "http://localhost:3000";
const address = args.address ?? "425 6th Street, Brooklyn, NY 11215";
fs.mkdirSync(out, { recursive: true });
const shot = (page, name, full = false) => page.screenshot({ path: path.join(out, `${name}.jpg`), type: "jpeg", quality: 80, fullPage: full });
const checks = {};
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, storageState: args.state });

async function openLens(p, lens) {
  await p.goto(base + "/dashboard", { waitUntil: "load" });
  await p.waitForTimeout(2500);
  await p.click(".shell-lens-btn");
  await p.waitForTimeout(500);
  await p.locator(`#shell-lens-sheet [data-lens="${lens}"]`).click();
  await p.waitForTimeout(4000);
}

// Rows whose multi-word value broke into one line per word.
const oneWordRows = (p) =>
  p.evaluate(() => {
    const bad = [];
    let total = 0;
    for (const row of document.querySelectorAll("div")) {
      const kids = row.children;
      // The Row primitive: a flex row of two spans, the value right-aligned.
      if (kids.length !== 2 || kids[0].tagName !== "SPAN" || kids[1].tagName !== "SPAN") continue;
      if (getComputedStyle(row).display !== "flex" || getComputedStyle(kids[1]).textAlign !== "right") continue;
      const v = kids[1];
      const words = v.textContent.trim().split(/\s+/).filter(Boolean);
      if (!v.offsetParent) continue;
      total++;
      if (words.length < 2) continue;
      const range = document.createRange();
      range.selectNodeContents(v);
      const lines = new Set(Array.from(range.getClientRects()).map((r) => Math.round(r.top))).size;
      if (lines >= words.length && lines > 1) bad.push(`${kids[0].textContent} | ${v.textContent} (${lines} lines)`);
    }
    return { total, bad };
  });

// Acquire: open the map, then scroll so the map's bottom edge sits where the
// sticky action would cover it.
{
  const p = await ctx.newPage();
  await openLens(p, "cluster_5");
  checks.acquireHasHoldings = (await p.locator(".sticky-action").count()) > 0;
  const toggle = p.locator('.map-frame button:has-text("Show map")').first();
  if (await toggle.count()) {
    await toggle.click();
    await p.waitForTimeout(3500);
    await p.evaluate(() => {
      const m = document.querySelector('.map-frame:has(button[aria-expanded="true"])');
      const r = m.getBoundingClientRect();
      window.scrollBy(0, r.bottom - window.innerHeight + 60);
    });
    await p.waitForTimeout(800);
    await shot(p, "acquire-map-open-bottom-390");
    checks.stickyOverMap = await p.evaluate(() => {
      const s = document.querySelector(".sticky-action");
      const m = document.querySelector('.map-frame:has(button[aria-expanded="true"])');
      if (!s || !m) return null;
      const sr = s.getBoundingClientRect(), mr = m.getBoundingClientRect();
      const visible = getComputedStyle(s).visibility !== "hidden" && getComputedStyle(s).opacity !== "0";
      return { overlap: mr.bottom > sr.top && mr.top < sr.bottom, stickyVisible: visible };
    });
    // Past the map: the action is back.
    await p.locator("#c5-briefing").scrollIntoViewIfNeeded();
    await p.waitForTimeout(800);
    await shot(p, "acquire-past-map-390");
    checks.stickyBackPastMap = await p.evaluate(() => getComputedStyle(document.querySelector(".sticky-action")).visibility !== "hidden");
  }
  checks.stickyIsLastBlock = await p.evaluate(() => {
    const s = document.querySelector(".sticky-action");
    return !!s && s.nextElementSibling === null;
  });
  await shot(p, "acquire-full-390", true);
  checks.acquireRows = await oneWordRows(p);
  await p.close();
}

// Property: one real run, then every Row on the page.
{
  const p = await ctx.newPage();
  await openLens(p, "cluster_1");
  await p.click('[data-tab="search"]');
  await p.waitForTimeout(800);
  await p.locator("#shell-search-sheet input").fill(address);
  await p.locator("#shell-search-sheet input").press("Enter");
  const t0 = Date.now();
  while (Date.now() - t0 < 300000) {
    if (await p.locator(".verdict-band-done, .verdict-band-error").count()) break;
    await p.waitForTimeout(3000);
  }
  checks.propertyRunDone = (await p.locator(".verdict-band-done").count()) > 0;
  await p.waitForTimeout(4000);
  await shot(p, "property-band-390");
  checks.propertyRows = await oneWordRows(p);
  for (const id of ["c1-ownership", "c1-valuation", "c1-violations"]) {
    const el = p.locator(`#${id}`);
    if (await el.count()) {
      await el.scrollIntoViewIfNeeded();
      await p.waitForTimeout(300);
      await el.screenshot({ path: path.join(out, `property-${id}-390.jpg`), type: "jpeg", quality: 80 });
    }
  }
  await p.close();
}
await browser.close();
fs.writeFileSync(path.join(out, "checks.json"), JSON.stringify(checks, null, 2));
console.log(JSON.stringify(checks, null, 2));
