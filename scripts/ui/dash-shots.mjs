// KOANO dashboard screenshot scenarios. Drives the real dashboard (authenticated
// via a saved storage state), runs REAL analyses, and captures each cluster in
// its empty, running and completed states at 1440 / 768 / 390 by resizing the
// same page (so state is preserved across widths).
//
//   node scripts/ui/dash-shots.mjs --state scratch/state.json --out build-log/ui-ws-1/before \
//     --clusters cluster_1,cluster_2,cluster_4,cluster_5 [--no-run] [--switch select|nav]
//
// Addresses are real NYC lots (not the recorded-example address) so the
// captures show live data, never the demo.
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { scrollThrough, audit } from "./shots.mjs";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => {
    if (a.startsWith("--")) acc.push([a.slice(2), arr[i + 1] && !arr[i + 1].startsWith("--") ? arr[i + 1] : "true"]);
    return acc;
  }, []),
);
const BASE = args.base ?? "http://localhost:3000";
const OUT = args.out ?? "build-log/dash";
const STATE = args.state;
const CLUSTERS = (args.clusters ?? "cluster_1,cluster_2,cluster_4,cluster_5").split(",");
const RUN = args["no-run"] !== "true";
const WIDTHS = [1440, 768, 390];
const HEIGHT = { 390: 844, 768: 1024, 1440: 900 };
const ADDR = {
  cluster_1: ["425 6th Street, Brooklyn, NY 11215"],
  cluster_2: ["425 6th Street, Brooklyn, NY 11215"],
  cluster_4: ["74 Grand Avenue, Brooklyn, NY", "176 Johnson Street, Brooklyn, NY"],
  cluster_5: ["425 6th Street, Brooklyn, NY 11215", "74 Grand Avenue, Brooklyn, NY"],
};
mkdirSync(OUT, { recursive: true });
const report = [];

async function snap(page, name) {
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: HEIGHT[width] });
    await page.waitForTimeout(500);
    await scrollThrough(page);
    await page.waitForTimeout(300);
    await page.screenshot({ path: join(OUT, `${name}-${width}.jpg`), fullPage: true, type: "jpeg", quality: 78 });
    await page.screenshot({ path: join(OUT, `${name}-${width}-fold.jpg`), fullPage: false, type: "jpeg", quality: 78 });
    const a = await audit(page);
    report.push({ name, width, ...a, console: page._koanoConsole.splice(0) });
    console.log(`${name}@${width}${a.horizontalOverflow ? " OVERFLOW" : ""}`);
  }
  await page.setViewportSize({ width: 1440, height: 900 });
}

// Switch cluster. Supports the legacy <select> switcher and the new lens nav.
async function switchCluster(page, cluster) {
  const sel = page.locator("#cluster-switcher");
  if (await sel.count()) {
    await sel.selectOption(cluster);
  } else {
    const btn = page.locator(`[data-lens="${cluster}"]`).first();
    await btn.click();
  }
  await page.waitForTimeout(1200);
}

async function waitForDone(page, timeoutMs = 300000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const txt = await page.innerText("body");
    if (/Decision support, not\s+financial advice|Recorded to your verdict history|Not recorded:/.test(txt)) return true;
    if (/Verdict pipeline failed|Analysis failed:/.test(txt)) return false;
    await page.waitForTimeout(3000);
  }
  return false;
}

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, storageState: STATE });
const page = await ctx.newPage();
page._koanoConsole = [];
page.on("console", (m) => { if (m.type() === "error" || m.type() === "warning") page._koanoConsole.push(`${m.type()}: ${m.text().slice(0, 300)}`); });
page.on("pageerror", (e) => page._koanoConsole.push(`pageerror: ${String(e).slice(0, 300)}`));
await page.goto(BASE + "/dashboard", { waitUntil: "load", timeout: 60000 });
await page.waitForTimeout(2500);

for (const cluster of CLUSTERS) {
  await page.goto(BASE + "/dashboard", { waitUntil: "load", timeout: 60000 });
  await page.waitForTimeout(2000);
  await switchCluster(page, cluster);
  await snap(page, `${cluster}-empty`);
  if (!RUN) continue;
  const addrs = ADDR[cluster];
  if (cluster === "cluster_4") {
    await page.fill("#site-0", addrs[0]);
    await page.fill("#site-1", addrs[1]);
    await page.locator('button:has-text("Run comparison")').click();
    await page.waitForTimeout(15000);
    await snap(page, `${cluster}-running`);
    await waitForDone(page, 360000);
    await page.waitForTimeout(3000);
    await snap(page, `${cluster}-done`);
  } else if (cluster === "cluster_5") {
    // Track only what the book does not already hold (a re-add returns 409).
    const bodyText = await page.innerText("body");
    for (const a of addrs) {
      const streetKey = a.split(",")[0].replace(/(\d+)(st|nd|rd|th)\b/i, "$1").toUpperCase();
      if (bodyText.toUpperCase().includes(streetKey)) continue;
      await page.locator('input[aria-label="Property address to track"]').fill(a);
      await page.locator('button:has-text("Track property")').click();
      await page.waitForTimeout(9000);
    }
    await snap(page, `${cluster}-tracked`);
    await page.locator('button:has-text("Analyze"), button:has-text("Re-run")').first().click();
    await page.waitForTimeout(15000);
    await snap(page, `${cluster}-running`);
    await waitForDone(page);
    await page.waitForTimeout(3000);
    await snap(page, `${cluster}-done`);
  } else {
    const bar = page.locator('.gsearch-bar input');
    if (await bar.count()) {
      await bar.fill(addrs[0]);
      await bar.press('Enter');
    } else {
      await page.locator('input[aria-label="Property address"]').fill(addrs[0]);
      await page.locator('button:has-text("Run analysis")').click();
    }
    await page.waitForTimeout(15000);
    await snap(page, `${cluster}-running`);
    await waitForDone(page);
    await page.waitForTimeout(3000);
    await snap(page, `${cluster}-done`);
  }
}
await browser.close();
writeFileSync(join(OUT, "dash-audit.json"), JSON.stringify(report, null, 2));
