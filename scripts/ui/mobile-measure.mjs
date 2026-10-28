// Mobile layout measurement at 390 x 844 (founder pass, mobile proposal).
//
// For each page: a full-page capture, then one capture per screen (scrolled
// by one viewport height), and per screen: how much of the screen is imagery
// (img, picture, video, canvas, large svg, CSS background images; a 10px grid
// so overlaps count once; media in the nav, header or a fixed bar is chrome,
// not imagery), how many words are visible, the type sizes those
// words are set in (largest = the screen's headline size, the size carrying
// the most words = its body size), and where the text sits relative to the
// imagery (over it, above it, below it, or on a screen with none). The page
// summary counts screens and words per screen.
//
//   node scripts/ui/mobile-measure.mjs --out build-log/mobile-ref/koano \
//     --pages "home=http://localhost:3000/,about=http://localhost:3000/about"
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const args = Object.fromEntries(process.argv.slice(2).map((a, i, arr) => (a.startsWith("--") ? [a.slice(2), arr[i + 1]] : [])).filter((x) => x.length));
const out = args.out;
const PAGES = args.pages.split(",").map((p) => {
  const i = p.indexOf("=");
  return { name: p.slice(0, i), url: p.slice(i + 1) };
});
const W = 390, H = 844, CELL = 10;
fs.mkdirSync(out, { recursive: true });

function measureScreen({ CELL }) {
  const vw = innerWidth, vh = innerHeight;
  const cols = Math.ceil(vw / CELL), rows = Math.ceil(vh / CELL);
  const grid = new Uint8Array(cols * rows);
  const visible = (el) => {
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none" || Number(cs.opacity) < 0.05) return false;
    return true;
  };
  const mark = (r) => {
    const x0 = Math.max(0, Math.floor(r.left / CELL)), x1 = Math.min(cols, Math.ceil(r.right / CELL));
    const y0 = Math.max(0, Math.floor(r.top / CELL)), y1 = Math.min(rows, Math.ceil(r.bottom / CELL));
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) grid[y * cols + x] = 1;
  };
  const imgRects = [];
  for (const el of document.querySelectorAll("img, video, canvas, svg, picture, [style*='background-image'], *")) {
    const tag = el.tagName.toLowerCase();
    let isImg = ["img", "video", "canvas"].includes(tag);
    if (tag === "svg") {
      const r = el.getBoundingClientRect();
      isImg = r.width * r.height > vw * vh * 0.02;
    }
    if (!isImg && tag !== "svg") {
      const bg = getComputedStyle(el).backgroundImage;
      isImg = !!bg && bg !== "none" && bg.includes("url(");
    }
    if (!isImg || !visible(el)) continue;
    // Chrome is not imagery: skip media inside the nav / header or any fixed bar.
    let chrome = false;
    for (let e = el; e && e !== document.body; e = e.parentElement) {
      if (["NAV", "HEADER"].includes(e.tagName) || getComputedStyle(e).position === "fixed") { chrome = true; break; }
    }
    if (chrome) continue;
    const r = el.getBoundingClientRect();
    if (r.bottom <= 0 || r.top >= vh || r.right <= 0 || r.left >= vw || r.width * r.height < 400) continue;
    // object-fit: contain leaves letterbox space inside the box; use the box anyway (it is the image slot).
    imgRects.push({ top: Math.max(0, r.top), bottom: Math.min(vh, r.bottom), left: Math.max(0, r.left), right: Math.min(vw, r.right) });
    mark(r);
  }
  let covered = 0;
  for (const c of grid) covered += c;
  const imageryPct = Math.round((covered / grid.length) * 100);
  const imgTop = imgRects.length ? Math.min(...imgRects.map((r) => r.top)) : null;
  const imgBottom = imgRects.length ? Math.max(...imgRects.map((r) => r.bottom)) : null;

  // Words on screen, by size and by position relative to the imagery.
  const sizes = {};
  const place = { over: 0, above: 0, below: 0, none: 0 };
  let words = 0;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n;
  while ((n = walker.nextNode())) {
    const t = n.textContent.trim();
    if (!t) continue;
    const el = n.parentElement;
    if (!el || ["SCRIPT", "STYLE", "NOSCRIPT"].includes(el.tagName)) continue;
    let ok = true;
    for (let e = el; e && e !== document.body; e = e.parentElement) if (!visible(e)) { ok = false; break; }
    if (!ok) continue;
    const range = document.createRange();
    range.selectNodeContents(n);
    const rects = Array.from(range.getClientRects()).filter((r) => r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < vh && r.right > 0 && r.left < vw);
    if (!rects.length) continue;
    const total = t.split(/\s+/).length;
    // Share the node's words across its on-screen line boxes.
    const allRects = Array.from(range.getClientRects()).filter((r) => r.width > 0 && r.height > 0);
    const w = Math.max(1, Math.round((total * rects.length) / Math.max(1, allRects.length)));
    words += w;
    const fs = Math.round(parseFloat(getComputedStyle(el).fontSize));
    sizes[fs] = (sizes[fs] ?? 0) + w;
    const r = rects[0];
    const cx = Math.min(cols - 1, Math.max(0, Math.floor((r.left + r.width / 2) / CELL)));
    const cy = Math.min(rows - 1, Math.max(0, Math.floor((r.top + r.height / 2) / CELL)));
    if (!imgRects.length) place.none += w;
    else if (grid[cy * cols + cx]) place.over += w;
    else if (r.bottom <= imgTop) place.above += w;
    else place.below += w;
  }
  const sizeList = Object.entries(sizes).map(([s, c]) => [Number(s), c]).sort((a, b) => b[0] - a[0]);
  const headline = sizeList.length ? sizeList[0][0] : null;
  const body = sizeList.length ? sizeList.slice().sort((a, b) => b[1] - a[1])[0][0] : null;
  return { imageryPct, imgTop: imgTop && Math.round(imgTop), imgBottom: imgBottom && Math.round(imgBottom), words, headline, body, sizes: Object.fromEntries(sizeList), place };
}

const browser = await chromium.launch();
const report = [];
for (const pg of PAGES) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1" });
  const page = await ctx.newPage();
  try {
    await page.goto(pg.url, { waitUntil: "networkidle", timeout: 60000 }).catch(() => page.goto(pg.url, { waitUntil: "load", timeout: 60000 }));
    await page.waitForTimeout(2500);
    // One pass down and back so lazy media and scroll entrances have fired.
    const total = await page.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += 400) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 150));
      }
      window.scrollTo(0, 0);
      await new Promise((r) => setTimeout(r, 600));
      return document.documentElement.scrollHeight;
    });
    await page.screenshot({ path: path.join(out, `${pg.name}-full.jpg`), fullPage: true, type: "jpeg", quality: 70 });
    const screens = [];
    const count = Math.ceil(total / H);
    for (let i = 0; i < count; i++) {
      await page.evaluate((y) => window.scrollTo(0, y), i * H);
      await page.waitForTimeout(700);
      await page.screenshot({ path: path.join(out, `${pg.name}-s${String(i + 1).padStart(2, "0")}.jpg`), type: "jpeg", quality: 72 });
      screens.push({ screen: i + 1, ...(await page.evaluate(measureScreen, { CELL })) });
    }
    const avg = (k) => Math.round(screens.reduce((a, s) => a + (s[k] ?? 0), 0) / screens.length);
    const wordsTotal = screens.reduce((a, s) => a + s.words, 0);
    report.push({
      name: pg.name,
      url: pg.url,
      pageHeight: total,
      screens: count,
      wordsTotal,
      wordsPerScreen: Math.round(wordsTotal / count),
      imageryPctMean: avg("imageryPct"),
      screensWithImagery: screens.filter((s) => s.imageryPct >= 10).length,
      perScreen: screens,
    });
    console.log(`${pg.name}: ${count} screens, ${Math.round(wordsTotal / count)} words/screen, imagery ${avg("imageryPct")}% mean`);
  } catch (e) {
    report.push({ name: pg.name, url: pg.url, error: String(e).slice(0, 300) });
    console.log(`${pg.name}: FAILED ${String(e).slice(0, 200)}`);
  }
  await ctx.close();
}
await browser.close();
fs.writeFileSync(path.join(out, "measure.json"), JSON.stringify(report, null, 2));
