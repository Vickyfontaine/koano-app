// Text fit check (founder pass). Every page and lens at 360/390/430/768/1440,
// hero sections and render slots excluded (the founder is redesigning them),
// third-party map controls excluded. Rules:
//   page-overflow   document wider than the screen
//   text-out        a text line past a visible edge of its box (fill, or a border on that side)
//   text-touch      a text line closer than 4px (sides) or 2px (top/bottom) to a visible edge
//   line-height     wrapped text: body under 1.45, headings (h1-h3, or 20px+) under 1.1
//   button-pad      a text button whose text sits under 12px from its top/bottom or under 20px from its sides
//   stack-gap       two text blocks stacked in a card less than 8px apart (box to box)
//   target          an interactive element smaller than 44 x 44 (inline links in running text exempt)
//   node scripts/ui/text-fit.mjs --state s.json --stream f.ndjson --out build-log/text-fit [--widths ..] [--only ..]
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const args = Object.fromEntries(process.argv.slice(2).map((a, i, arr) => (a.startsWith("--") ? [a.slice(2), arr[i + 1]] : [])).filter((x) => x.length));
const out = args.out ?? "build-log/text-fit";
const base = args.base ?? "http://localhost:3000";
const WIDTHS = (args.widths ?? "360,390,430,768,1440").split(",").map(Number);
const ndjson = args.stream ? fs.readFileSync(args.stream, "utf8") : null;
const ONLY = args.only ? args.only.split(",") : null;
fs.mkdirSync(out, { recursive: true });

const PAGES = [
  ["home", "/"], ["intelligence", "/intelligence"], ["for-developers", "/for/developers"], ["for-professionals", "/for/agents"],
  ["for-institutions", "/for/institutions"], ["for-community", "/for/community"], ["pricing", "/pricing"], ["about", "/about"],
  ["data", "/data"], ["vision", "/vision"], ["not-found", "/no-such-page"], ["login", "/login"], ["signup", "/signup"],
];
const SIGNED = [
  ["develop-empty", "cluster_4", false], ["develop-done", "cluster_4", "develop"], ["acquire", "cluster_5", false],
  ["price-empty", "cluster_2", false], ["price-done", "cluster_2", true], ["property-empty", "cluster_1", false],
  ["property-done", "cluster_1", true], ["settings", null, false],
];

function check() {
  const vw = document.documentElement.clientWidth;
  // Excluded: the heroes and the render slots (the founder is redesigning them),
  // third-party map controls and Clerk's own card.
  const HERO = "#hero-section, .hero-with-render, .hero-plain, .render-slot, .mapboxgl-control-container, .mapboxgl-ctrl, .cl-rootBox, .cl-card";
  const visible = (el) => {
    for (let e = el; e && e !== document.documentElement; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.display === "none" || cs.visibility === "hidden" || Number(cs.opacity) < 0.05) return false;
    }
    return true;
  };
  const excluded = (el) => !!el.closest(HERO);
  const desc = (el) => {
    const parts = [];
    for (let e = el, i = 0; e && e !== document.body && i < 4; e = e.parentElement, i++) {
      let s = e.tagName.toLowerCase();
      if (e.id) s += "#" + e.id;
      const cls = typeof e.className === "string" ? e.className.trim().split(/\s+/).filter((c) => c && !c.startsWith("jsx-")).slice(0, 2) : [];
      if (cls.length) s += "." + cls.join(".");
      parts.unshift(s);
      if (e.id) break;
    }
    return parts.join(" > ");
  };
  const sides = (el) => {
    const cs = getComputedStyle(el);
    const bg = cs.backgroundColor;
    const fill = bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent" && !/, 0\)$/.test(bg);
    // a fill only counts as an edge if it differs from the parent's background
    let parentBg = "rgba(0, 0, 0, 0)";
    for (let e = el.parentElement; e; e = e.parentElement) {
      const b = getComputedStyle(e).backgroundColor;
      if (b && b !== "rgba(0, 0, 0, 0)" && b !== "transparent") { parentBg = b; break; }
    }
    const fillEdge = fill && bg !== parentBg;
    const b = (s) => parseFloat(cs[`border${s}Width`]) > 0 && cs[`border${s}Style`] !== "none" && !/, 0\)$/.test(cs[`border${s}Color`]);
    // A box is a fill or a full border. A frame with one or two borders (a
    // chart axis, a ruled row) is not a box, so labels may sit outside it.
    const boxed = fillEdge || (b("Top") && b("Right") && b("Bottom") && b("Left"));
    return { top: boxed, right: boxed, bottom: boxed, left: boxed, any: boxed };
  };
  const out = [];
  const push = (kind, el, detail, text) => out.push({ kind, sel: desc(el), text: (text ?? el.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 60), detail });
  if (document.documentElement.scrollWidth > vw + 1) push("page-overflow", document.body, `${document.documentElement.scrollWidth}px on ${vw}px`, "");

  const isInteractive = (el) => el.matches("button, a[href], input:not([type=hidden]), select, textarea, summary, [role=button], [role=tab], [role=switch], label[for]");
  // text runs
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  let n;
  while ((n = walker.nextNode())) {
    const t = n.textContent.trim();
    if (!t) continue;
    const el = n.parentElement;
    if (!el || ["SCRIPT", "STYLE", "NOSCRIPT", "OPTION"].includes(el.tagName) || excluded(el) || !visible(el)) continue;
    const range = document.createRange();
    range.selectNodeContents(n);
    const rects = Array.from(range.getClientRects()).filter((r) => r.width > 1 && r.height > 1);
    if (!rects.length) continue;
    let scroller = false;
    for (let e = el; e && e !== document.body; e = e.parentElement) {
      const ox = getComputedStyle(e).overflowX;
      if ((ox === "auto" || ox === "scroll") && e.scrollWidth > e.clientWidth + 1) { scroller = true; break; }
    }
    const L = Math.min(...rects.map((r) => r.left)), R = Math.max(...rects.map((r) => r.right));
    const T = Math.min(...rects.map((r) => r.top)), B = Math.max(...rects.map((r) => r.bottom));
    // nearest bounded box
    for (let e = el; e && e !== document.body; e = e.parentElement) {
      const sd = sides(e);
      if (!sd.any) continue;
      const br = e.getBoundingClientRect();
      if (br.width >= vw - 1 || br.height > 1600) break;
      if (scroller && e.contains(el) && getComputedStyle(e).overflowX === "visible") { /* table inside a scroller */ }
      const cs = getComputedStyle(e);
      const iL = br.left + parseFloat(cs.borderLeftWidth), iR = br.right - parseFloat(cs.borderRightWidth);
      const iT = br.top + parseFloat(cs.borderTopWidth), iB = br.bottom - parseFloat(cs.borderBottomWidth);
      const key = e;
      const gaps = { left: L - iL, right: iR - R, top: T - iT, bottom: iB - B };
      const bad = [];
      for (const s of ["left", "right"]) if (sd[s] && !scroller) { if (gaps[s] < -0.5) bad.push(["text-out", s, gaps[s]]); else if (gaps[s] < 4) bad.push(["text-touch", s, gaps[s]]); }
      for (const s of ["top", "bottom"]) if (sd[s]) { if (gaps[s] < -0.5) bad.push(["text-out", s, gaps[s]]); else if (gaps[s] < 2) bad.push(["text-touch", s, gaps[s]]); }
      for (const [k, s, g] of bad) {
        const id = k + s;
        if (seen.has(e) && seen.has(id + desc(e))) continue;
        seen.add(e); seen.add(id + desc(e));
        push(k, e, `${s} ${g.toFixed(1)}px`, t);
      }
      break;
    }
    // line height on wrapped text
    const lines = new Set(rects.map((r) => Math.round(r.top))).size;
    if (lines >= 2 && !seen.has("lh" + desc(el))) {
      const cs = getComputedStyle(el);
      const fsz = parseFloat(cs.fontSize);
      const lh = cs.lineHeight === "normal" ? 1.2 : parseFloat(cs.lineHeight) / fsz;
      const heading = /^H[1-3]$/.test(el.tagName) || !!el.closest("h1,h2,h3") || fsz >= 20;
      const min = heading ? 1.1 : 1.45;
      if (lh < min - 0.005) { seen.add("lh" + desc(el)); push("line-height", el, `${lh.toFixed(2)} at ${fsz}px (min ${min})`, t); }
    }
  }
  // buttons, targets
  for (const el of document.querySelectorAll("button, a[href], input:not([type=hidden]), select, summary, [role=button], [role=tab], [role=switch]")) {
    if (excluded(el) || !visible(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    const text = el.innerText?.trim() ?? "";
    const sd = sides(el);
    // A control inside a label is targeted through the label.
    const host = el.closest("label") ?? el;
    const hr = host.getBoundingClientRect();
    // Navigation rows (sidebar, nav links, tabs) are rows, not buttons.
    const navRow = el.matches(".shell-item, .nav-link, .shell-tab, [role=tab]");
    // inline link inside running text: exempt from target size
    const inlineLink = el.tagName === "A" && !sd.any && getComputedStyle(el).display === "inline" && el.parentElement && /^(P|LI|SPAN|TD)$/.test(el.parentElement.tagName);
    if (!inlineLink && (hr.width < 44 - 0.5 || hr.height < 44 - 0.5)) push("target", el, `${Math.round(hr.width)}x${Math.round(hr.height)}`, text || el.getAttribute("aria-label") || el.type || "");
    if (sd.any && !navRow && text.length > 1 && !["INPUT", "SELECT", "TEXTAREA"].includes(el.tagName)) {
      const range = document.createRange();
      range.selectNodeContents(el);
      const rects = Array.from(range.getClientRects()).filter((x) => x.width > 1 && x.height > 1);
      if (rects.length) {
        const L = Math.min(...rects.map((x) => x.left)), R = Math.max(...rects.map((x) => x.right)), T = Math.min(...rects.map((x) => x.top)), B = Math.max(...rects.map((x) => x.bottom));
        const v = Math.min(T - r.top, r.bottom - B), h = Math.min(L - r.left, r.right - R);
        if (v < 12 - 0.5 || h < 20 - 0.5) push("button-pad", el, `text inset ${v.toFixed(0)}px vertical, ${h.toFixed(0)}px horizontal`, text);
      }
    }
  }
  // stacked text blocks in a card
  const blocks = Array.from(document.querySelectorAll("p, h1, h2, h3, h4, li, dt, dd, span, div")).filter((el) => {
    if (excluded(el) || !visible(el)) return false;
    const own = Array.from(el.childNodes).some((c) => c.nodeType === 3 && c.textContent.trim());
    if (!own) return false;
    const d = getComputedStyle(el).display;
    return d === "block" || d === "flex" || d === "list-item" || d === "grid";
  });
  const cardOf = (el) => {
    for (let e = el.parentElement; e && e !== document.body; e = e.parentElement) {
      const sd = sides(e);
      const r = e.getBoundingClientRect();
      if (sd.any && sd.left && sd.right && r.width < vw - 1) return e;
    }
    return null;
  };
  const byCard = new Map();
  for (const el of blocks) {
    const c = cardOf(el);
    if (!c) continue;
    if (!byCard.has(c)) byCard.set(c, []);
    byCard.get(c).push(el);
  }
  for (const [c, list] of byCard) {
    const rs = list.map((el) => ({ el, r: el.getBoundingClientRect() })).filter((x) => !list.some((o) => o !== x.el && o.contains(x.el)));
    for (const a of rs) for (const b of rs) {
      if (a === b) continue;
      const gap = b.r.top - a.r.bottom;
      const overlapX = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left);
      if (gap >= -0.5 && gap < 8 - 0.5 && overlapX > 8) {
        // b is the next block directly below a (nothing in between)
        const between = rs.some((o) => o !== a && o !== b && o.r.top >= a.r.bottom - 0.5 && o.r.bottom <= b.r.top + 0.5 && Math.min(o.r.right, a.r.right) - Math.max(o.r.left, a.r.left) > 8);
        if (!between) push("stack-gap", b.el, `${gap.toFixed(1)}px below "${a.el.textContent.replace(/\s+/g, " ").trim().slice(0, 30)}"`, b.el.textContent);
      }
    }
  }
  return out;
}

const browser = await chromium.launch();
const report = [];
async function runOnce(name, url, width, opts, last) {
  const ctx = await browser.newContext({ viewport: { width, height: width < 768 ? 844 : 900 }, deviceScaleFactor: 1, isMobile: width < 768, hasTouch: width < 768, storageState: opts.state });
  const page = await ctx.newPage();
  if (ndjson) await page.route("**/api/agents/stream", (r) => r.fulfill({ status: 200, contentType: "application/x-ndjson; charset=utf-8", body: ndjson }));
  try {
    await page.goto(base + url, { waitUntil: "load", timeout: 60000 });
    await page.waitForTimeout(2500);
    if (opts.lens) {
      if (width < 768) {
        await page.click(".shell-lens-btn");
        await page.waitForTimeout(500);
        await page.locator(`#shell-lens-sheet [data-lens="${opts.lens}"]`).click();
      } else await page.locator(`[data-lens="${opts.lens}"]`).first().click();
      await page.waitForTimeout(3000);
    }
    if (opts.runFixture) {
      if (width < 768) {
        await page.click('[data-tab="search"]');
        await page.waitForTimeout(800);
        await page.locator("#shell-search-sheet input").fill("175 3rd Street, Brooklyn, NY 11215");
        await page.locator("#shell-search-sheet input").press("Enter");
      } else {
        await page.locator(".gsearch-bar input").fill("175 3rd Street, Brooklyn, NY 11215");
        await page.locator(".gsearch-bar input").press("Enter");
      }
      await page.waitForTimeout(2500);
      if (opts.runFixture === "develop") {
        const btn = page.locator('button:has-text("Run comparison")');
        if (await btn.count()) await btn.first().click();
      }
      await page.waitForSelector(".verdict-band-done", { timeout: 60000 }).catch(() => {});
      await page.waitForTimeout(7000);
    }
    await page.evaluate(async () => {
      for (let y = 0; y < document.documentElement.scrollHeight; y += 500) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 80)); }
      window.scrollTo(0, 0);
      await new Promise((r) => setTimeout(r, 400));
    });
    const found = await page.evaluate(check);
    report.push({ name, width, found });
    const counts = found.reduce((a, d) => ((a[d.kind] = (a[d.kind] ?? 0) + 1), a), {});
    console.log(`${name}@${width}: ${found.length} ${JSON.stringify(counts)}`);
  } catch (e) {
    await ctx.close();
    if (!last) return false;
    report.push({ name, width, error: String(e).split("\n")[0] });
    console.log(`${name}@${width}: FAILED ${String(e).split("\n")[0].slice(0, 140)}`);
    return true;
  }
  await ctx.close();
  return true;
}
async function run(name, url, width, opts = {}) {
  if (ONLY && !ONLY.includes(name)) return;
  for (let i = 1; i <= 3; i++) {
    if (await runOnce(name, url, width, opts, i === 3)) return;
    await new Promise((r) => setTimeout(r, 5000));
  }
}
for (const width of WIDTHS) {
  for (const [name, url] of PAGES) await run(name, url, width);
  for (const [name, lens, fx] of SIGNED) await run(name, lens ? "/dashboard" : "/dashboard/settings", width, { state: args.state, lens, runFixture: fx });
}
await browser.close();
fs.writeFileSync(path.join(out, "text-fit.json"), JSON.stringify(report, null, 2));
const total = report.reduce((a, p) => a + (p.found?.length ?? 0), 0);
console.log(`TOTAL ${total}`);
