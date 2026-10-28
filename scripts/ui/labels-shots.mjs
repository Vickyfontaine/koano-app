// Band and KPI-tile label captures (founder pass): the verdict band in its
// done state and the KPI tiles (Price market velocity, Acquire This week) at
// 390, 768 and 1440. The run is the recorded 175 3rd St fixture replayed
// offline (scripts/ui/fixture-stream.ts) and served in place of the live
// stream, so no API credit is spent; site detail is the live public record.
// node scripts/ui/labels-shots.mjs --state <state.json> --stream <fixture.ndjson> --out build-log/labels/after
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const args = Object.fromEntries(process.argv.slice(2).map((a, i, arr) => (a.startsWith("--") ? [a.slice(2), arr[i + 1]] : [])).filter((x) => x.length));
const out = args.out ?? "build-log/labels/after";
const base = args.base ?? "http://localhost:3000";
const ndjson = fs.readFileSync(args.stream, "utf8");
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch();
const H = { 390: 844, 768: 1024, 1440: 900 };

async function lensPage(width, lens) {
  const c = await browser.newContext({ viewport: { width, height: H[width] }, deviceScaleFactor: 1, isMobile: width < 768, hasTouch: width < 768, storageState: args.state });
  const p = await c.newPage();
  await p.route("**/api/agents/stream", (r) => r.fulfill({ status: 200, contentType: "application/x-ndjson; charset=utf-8", body: ndjson }));
  await p.goto(base + "/dashboard", { waitUntil: "load" });
  await p.waitForTimeout(2500);
  if (width < 768) {
    await p.click(".shell-lens-btn");
    await p.waitForTimeout(500);
    await p.locator(`#shell-lens-sheet [data-lens="${lens}"]`).click();
  } else {
    await p.locator(`[data-lens="${lens}"]`).first().click();
  }
  await p.waitForTimeout(2500);
  return { c, p };
}
async function search(p, width) {
  if (width < 768) {
    await p.click('[data-tab="search"]');
    await p.waitForTimeout(800);
    await p.locator("#shell-search-sheet input").fill("175 3rd Street, Brooklyn, NY 11215");
    await p.locator("#shell-search-sheet input").press("Enter");
  } else {
    await p.locator(".gsearch-bar input").fill("175 3rd Street, Brooklyn, NY 11215");
    await p.locator(".gsearch-bar input").press("Enter");
  }
  await p.waitForSelector(".verdict-band-done", { timeout: 60000 }).catch(() => {});
  await p.waitForTimeout(6000); // site detail (live public record) fills the panels
}

const checks = {};
for (const width of [390, 768, 1440]) {
  // The band: Property at 390 (the full band; Price compacts it on phones), Price above.
  {
    const { c, p } = await lensPage(width, width < 768 ? "cluster_1" : "cluster_2");
    await search(p, width);
    checks[`bandDone${width}`] = (await p.locator(".verdict-band-done").count()) > 0;
    await p.locator(".verdict-band").first().screenshot({ path: path.join(out, `band-${width}.jpg`), type: "jpeg", quality: 82 });
    if (width >= 768) {
      const v = p.locator("#c2-velocity");
      await v.scrollIntoViewIfNeeded();
      await p.waitForTimeout(400);
      await v.screenshot({ path: path.join(out, `velocity-${width}.jpg`), type: "jpeg", quality: 82 });
    }
    await c.close();
  }
  if (width < 768) {
    const { c, p } = await lensPage(width, "cluster_2");
    await search(p, width);
    const v = p.locator("#c2-velocity");
    await v.scrollIntoViewIfNeeded();
    await p.waitForTimeout(400);
    await v.screenshot({ path: path.join(out, `velocity-${width}.jpg`), type: "jpeg", quality: 82 });
    await c.close();
  }
  // Acquire's This week tiles (no run needed).
  {
    const { c, p } = await lensPage(width, "cluster_5");
    const w = p.locator("#c5-week");
    await w.scrollIntoViewIfNeeded();
    await p.waitForTimeout(400);
    await w.screenshot({ path: path.join(out, `this-week-${width}.jpg`), type: "jpeg", quality: 82 });
    await c.close();
  }
}
await browser.close();
fs.writeFileSync(path.join(out, "checks.json"), JSON.stringify(checks, null, 2));
console.log(JSON.stringify(checks));
