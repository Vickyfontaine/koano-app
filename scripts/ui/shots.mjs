// KOANO UI-sprint screenshot harness.
//
// Captures a set of URLs at the three sprint breakpoints (390 / 768 / 1440),
// full page, after scrolling the page once so in-view animations have fired,
// and writes a JSON audit next to the images: console errors + warnings,
// horizontal overflow (document wider than the viewport, plus the offending
// elements), and the page title. Used for every "before" and "after" set in
// /build-log/ui-ws-N/ and for the final QA pass.
//
//   node scripts/ui/shots.mjs --out build-log/ui-ws-2/after --base http://localhost:3000 \
//     --pages "home=/,intelligence=/intelligence" [--state scratch/state.json] [--widths 390,768,1440]
//
// Playwright (devDependency) drives a headless Chromium.
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => {
    if (a.startsWith("--")) acc.push([a.slice(2), arr[i + 1] && !arr[i + 1].startsWith("--") ? arr[i + 1] : "true"]);
    return acc;
  }, []),
);
const BASE = args.base ?? "http://localhost:3000";
const OUT = args.out ?? "build-log/shots";
const WIDTHS = (args.widths ?? "390,768,1440").split(",").map(Number);
const PAGES = (args.pages ?? "home=/").split(",").map((p) => {
  const [name, path] = p.split("=");
  return { name, path };
});
const STATE = args.state;
const HEIGHT = { 390: 844, 768: 1024, 1440: 900 };

mkdirSync(OUT, { recursive: true });

export async function scrollThrough(page) {
  // Scroll the page in viewport-sized steps so IntersectionObserver / framer
  // whileInView triggers fire, then return to the top for a full-page capture.
  await page.evaluate(async () => {
    const step = Math.max(300, window.innerHeight * 0.8);
    const total = () => document.documentElement.scrollHeight;
    for (let y = 0; y < total(); y += step) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, total());
    await new Promise((r) => setTimeout(r, 300));
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 250));
  });
}

export async function audit(page) {
  return page.evaluate(() => {
    const de = document.documentElement;
    const overflow = de.scrollWidth > de.clientWidth + 1;
    const offenders = [];
    if (overflow) {
      const vw = de.clientWidth;
      for (const el of document.querySelectorAll("body *")) {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && (r.right > vw + 1 || r.left < -1)) {
          const tag = el.tagName.toLowerCase();
          const id = el.id ? `#${el.id}` : "";
          const cls = typeof el.className === "string" && el.className ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".") : "";
          offenders.push(`${tag}${id}${cls} right=${Math.round(r.right)} w=${Math.round(r.width)}`);
          if (offenders.length >= 12) break;
        }
      }
    }
    return {
      title: document.title,
      scrollWidth: de.scrollWidth,
      clientWidth: de.clientWidth,
      scrollHeight: de.scrollHeight,
      horizontalOverflow: overflow,
      offenders,
    };
  });
}

export async function capture(browser, { name, path, width, state, out, base }) {
  const context = await browser.newContext({
    viewport: { width, height: HEIGHT[width] ?? 900 },
    deviceScaleFactor: 1,
    isMobile: width < 768,
    hasTouch: width < 768,
    storageState: state,
  });
  const page = await context.newPage();
  const console_ = [];
  page.on("console", (m) => {
    if (m.type() === "error" || m.type() === "warning") console_.push(`${m.type()}: ${m.text().slice(0, 300)}`);
  });
  page.on("pageerror", (e) => console_.push(`pageerror: ${String(e).slice(0, 300)}`));
  const url = base + path;
  await page.goto(url, { waitUntil: "networkidle", timeout: 60000 }).catch(async () => {
    await page.goto(url, { waitUntil: "load", timeout: 60000 });
  });
  await page.waitForTimeout(600);
  await scrollThrough(page);
  await page.waitForTimeout(400);
  const file = join(out, `${name}-${width}.png`);
  await page.screenshot({ path: file, fullPage: true });
  // A viewport-only "fold" capture too: the full-page image downsamples a long
  // page to the point where type is unreadable; the fold is what a visitor sees.
  await page.screenshot({ path: join(out, `${name}-${width}-fold.png`), fullPage: false });
  const a = await audit(page);
  await context.close();
  return { name, width, url, file, console: console_, ...a };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const browser = await chromium.launch();
  const report = [];
  for (const pg of PAGES) {
    for (const width of WIDTHS) {
      try {
        const r = await capture(browser, { ...pg, width, state: STATE, out: OUT, base: BASE });
        report.push(r);
        const flag = r.horizontalOverflow ? " OVERFLOW" : "";
        const errs = r.console.length ? ` console:${r.console.length}` : "";
        console.log(`${pg.name}@${width}${flag}${errs}`);
      } catch (e) {
        report.push({ name: pg.name, width, error: String(e) });
        console.log(`${pg.name}@${width} FAILED ${String(e).slice(0, 200)}`);
      }
    }
  }
  await browser.close();
  writeFileSync(join(OUT, "audit.json"), JSON.stringify(report, null, 2));
}
