// Homepage hero contrast check (founder pass after the UI sprint).
//
// The hero copy now sits straight on the render (no scrim) and the replay card
// is frosted, so a contrast ratio depends on the pixels behind each glyph. For
// every width and for frames across one full replay loop, this hides the text
// (color: transparent, so the layout and every fill stay put), screenshots the
// page, and for each text run compares its ink against the backdrop pixels
// under it. A run's score is the ratio at its 2nd-percentile pixel (the
// darkest or brightest 2 percent, whichever is worse), so a stray edge pixel
// does not decide it but a real dark patch does. AA: 4.5 for normal text,
// 3 for large (24px+, or 18.66px+ bold).
//
//   node scripts/ui/hero-contrast.mjs [--base http://localhost:3000] [--out build-log/...]
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
const OUT = args.out ?? "build-log/hero-pass";
const WIDTHS = (args.widths ?? "390,768,1440").split(",").map(Number);
const HEIGHT = { 390: 844, 768: 1024, 1440: 900 };
// One replay cycle is 6800ms; sample it every 425ms (16 frames), each frozen.
const FRAMES = Array.from({ length: 16 }, (_, i) => i * 425);

mkdirSync(OUT, { recursive: true });

// In the page: list every text run in the hero with its ink, size and rects.
function collectRuns() {
  const hero = document.getElementById("hero-section");
  const card = hero.querySelector(".hero-dashboard-col > div");
  const runs = [];
  const walker = document.createTreeWalker(hero, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = walker.nextNode())) {
    const text = n.textContent.replace(/\s+/g, " ").trim();
    if (!text) continue;
    const el = n.parentElement;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none") continue;
    // Effective opacity up the tree (a row not yet streamed in is opacity 0).
    let op = 1;
    for (let e = el; e && e !== document.body; e = e.parentElement) op *= Number(getComputedStyle(e).opacity);
    if (op < 0.98) continue;
    const range = document.createRange();
    range.selectNodeContents(n);
    const rects = Array.from(range.getClientRects())
      .filter((r) => r.width > 1 && r.height > 1)
      .map((r) => ({ x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height }));
    if (!rects.length) continue;
    runs.push({
      text: text.slice(0, 48),
      inCard: card ? card.contains(el) : false,
      color: el.dataset.ink ?? cs.color,
      size: parseFloat(cs.fontSize),
      weight: Number(cs.fontWeight),
      rects,
    });
  }
  return runs;
}

// In the page: decode the screenshot and score each run.
async function scoreRuns({ png, runs }) {
  const img = new Image();
  img.src = "data:image/png;base64," + png;
  await img.decode();
  const c = document.createElement("canvas");
  c.width = img.width;
  c.height = img.height;
  const ctx = c.getContext("2d");
  ctx.drawImage(img, 0, 0);
  const lin = (v) => {
    v /= 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  const lum = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  const parse = (s) => {
    const m = s.match(/rgba?\(([^)]+)\)/);
    const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  return runs.map((run) => {
    const ink = parse(run.color);
    const ratios = [];
    for (const r of run.rects) {
      const x0 = Math.max(0, Math.floor(r.x)), y0 = Math.max(0, Math.floor(r.y));
      const w = Math.min(c.width - x0, Math.ceil(r.w)), h = Math.min(c.height - y0, Math.ceil(r.h));
      if (w <= 0 || h <= 0) continue;
      const d = ctx.getImageData(x0, y0, w, h).data;
      for (let i = 0; i < d.length; i += 4) {
        // The ink composited over this backdrop pixel (alpha inks blend).
        const fr = ink.r * ink.a + d[i] * (1 - ink.a);
        const fg = ink.g * ink.a + d[i + 1] * (1 - ink.a);
        const fb = ink.b * ink.a + d[i + 2] * (1 - ink.a);
        const L1 = lum(fr, fg, fb), L2 = lum(d[i], d[i + 1], d[i + 2]);
        ratios.push((Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05));
      }
    }
    ratios.sort((a, b) => a - b);
    const p2 = ratios[Math.floor(ratios.length * 0.02)] ?? 0;
    const large = run.size >= 24 || (run.size >= 18.66 && run.weight >= 700);
    const need = large ? 3 : 4.5;
    return { text: run.text, inCard: run.inCard, ink: run.color, size: run.size, ratio: Math.round(p2 * 100) / 100, need, pass: p2 >= need };
  });
}

const browser = await chromium.launch();
const report = [];
for (const width of WIDTHS) {
  const context = await browser.newContext({ viewport: { width, height: HEIGHT[width] ?? 900 }, deviceScaleFactor: 1 });
  const page = await context.newPage();
  await page.goto(BASE + "/", { waitUntil: "networkidle", timeout: 60000 }).catch(() => page.goto(BASE + "/", { waitUntil: "load" }));
  // --css injects a candidate rule set (used to tune the frost before editing).
  if (args.css) await page.addStyleTag({ content: args.css });
  // CSS transitions off in the hero (framer's row motion is JS and settles in
  // the frozen frame), so no ink is read halfway through a hover fade.
  await page.addStyleTag({ content: "#hero-section, #hero-section * { transition: none !important; }" });
  await page.waitForTimeout(1500); // the CSS entrance has finished
  // Fold captures for the record, with the text visible.
  await page.screenshot({ path: join(OUT, `home-${width}-fold.jpg`), type: "jpeg", quality: 82 });
  const worst = new Map();
  const pauseBtn = page.locator('#hero-section button[aria-label="Pause the replay"]');
  const playBtn = page.locator('#hero-section button[aria-label="Play the replay"]');
  for (const at of FRAMES) {
    // Freeze each frame with the card's own pause control: Play restarts the
    // loop from the top, Pause holds the frame, and the wait lets the row
    // transitions settle so nothing moves between reading the text runs and
    // the screenshot.
    if ((await pauseBtn.count()) || (await playBtn.count())) {
      if (await pauseBtn.count()) await pauseBtn.click();
      await playBtn.click();
      await page.waitForTimeout(at);
      await pauseBtn.click();
      await page.mouse.move(0, 0); // no hover state left on a hero control
      await page.waitForTimeout(700);
    }
    const runs = await page.evaluate(collectRuns);
    // Hide the glyphs only; record each run's ink first (above).
    await page.addStyleTag({ content: "#hero-section, #hero-section * { color: transparent !important; text-shadow: none !important; caret-color: transparent !important; transition: none !important; } #hero-section input::placeholder { color: transparent !important; }" }).then((h) => h.evaluate((el) => (el.id = "hide-ink")));
    const png = (await page.screenshot({ fullPage: true, type: "png" })).toString("base64");
    await page.evaluate(() => document.getElementById("hide-ink")?.remove());
    const scored = await page.evaluate(scoreRuns, { png, runs });
    for (const s of scored) {
      const key = s.text + "|" + s.inCard;
      const prev = worst.get(key);
      if (!prev || s.ratio < prev.ratio) worst.set(key, { ...s, frameMs: at });
    }
  }
  const rows = Array.from(worst.values()).sort((a, b) => a.ratio / a.need - b.ratio / b.need);
  report.push({ width, rows });
  const fails = rows.filter((r) => !r.pass);
  console.log(`width ${width}: ${rows.length} text runs, ${fails.length} below AA; worst ${rows[0]?.ratio}:1 "${rows[0]?.text}" (needs ${rows[0]?.need})`);
  for (const f of fails) console.log(`   FAIL ${f.ratio}:1 < ${f.need}  ${f.inCard ? "card" : "copy"}  "${f.text}"  ${f.ink} @${f.frameMs}ms`);
  await context.close();
}
await browser.close();
writeFileSync(join(OUT, "hero-contrast.json"), JSON.stringify(report, null, 2));
