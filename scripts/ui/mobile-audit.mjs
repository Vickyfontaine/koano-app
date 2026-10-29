// Mobile structural audit (founder pass). Every marketing page, the app pages
// and the four lenses, at 360, 390 and 430. Per page and width it records:
//   overflow    the document is wider than the screen, with the widest offenders
//   text-off    a text line runs past the screen edge
//   text-box    a text line runs past the box it sits in (its card, button or cell)
//   edge        a bounded element (fill, border or shadow) that is not full-bleed
//               but sits closer than 8px to the screen edge
//   gap         empty vertical space between the content of two sections > 120px
//   gutters     the left edges that headings and paragraphs start at
//   paddings    each section's padding
//   hero        the first image: its share of the first screen, where it sits,
//               and how much of its box is letterboxed (object-fit: contain)
// and writes an annotated capture (red outline) for every defect.
//
//   node scripts/ui/mobile-audit.mjs --state <state.json> --stream <fixture.ndjson> --out build-log/mobile-audit
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const args = Object.fromEntries(process.argv.slice(2).map((a, i, arr) => (a.startsWith("--") ? [a.slice(2), arr[i + 1]] : [])).filter((x) => x.length));
const out = args.out ?? "build-log/mobile-audit";
const base = args.base ?? "http://localhost:3000";
const WIDTHS = (args.widths ?? "360,390,430").split(",").map(Number);
const H = 844;
const ndjson = args.stream ? fs.readFileSync(args.stream, "utf8") : null;
const ONLY = args.only ? args.only.split(",") : null;
fs.mkdirSync(path.join(out, "shots"), { recursive: true });

const MARKETING = [
  ["home", "/"], ["intelligence", "/intelligence"], ["for-developers", "/for/developers"], ["for-professionals", "/for/agents"],
  ["for-institutions", "/for/institutions"], ["for-community", "/for/community"], ["pricing", "/pricing"], ["about", "/about"],
  ["data", "/data"], ["vision", "/vision"], ["not-found", "/no-such-page"],
];
const PUBLIC_APP = [["login", "/login"], ["signup", "/signup"]];
// Signed-in surfaces: [name, path, lens to open, run the fixture?]
const SIGNED = [
  ["dashboard-develop-empty", "/dashboard", "cluster_4", false],
  ["dashboard-develop-done", "/dashboard", "cluster_4", "develop"],
  ["dashboard-acquire", "/dashboard", "cluster_5", false],
  ["dashboard-price-empty", "/dashboard", "cluster_2", false],
  ["dashboard-price-done", "/dashboard", "cluster_2", true],
  ["dashboard-property-empty", "/dashboard", "cluster_1", false],
  ["dashboard-property-done", "/dashboard", "cluster_1", true],
  ["settings", "/dashboard/settings", null, false],
];

function auditPage() {
  const vw = document.documentElement.clientWidth;
  const de = document.documentElement;
  const visible = (el) => {
    for (let e = el; e && e !== document.documentElement; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.display === "none" || cs.visibility === "hidden" || Number(cs.opacity) === 0) return false;
    }
    return true;
  };
  let uid = 0;
  const tag = (el) => {
    if (!el.dataset.auditId) el.dataset.auditId = String(++uid);
    return el.dataset.auditId;
  };
  const desc = (el) => {
    const parts = [];
    for (let e = el, i = 0; e && e !== document.body && i < 4; e = e.parentElement, i++) {
      let s = e.tagName.toLowerCase();
      if (e.id) s += "#" + e.id;
      const cls = typeof e.className === "string" ? e.className.trim().split(/\s+/).filter((c) => c && !c.startsWith("jsx-")).slice(0, 3) : [];
      if (cls.length) s += "." + cls.join(".");
      parts.unshift(s);
      if (e.id) break;
    }
    return parts.join(" > ");
  };
  const box = (r) => ({ x: Math.round(r.left), y: Math.round(r.top + scrollY), w: Math.round(r.width), h: Math.round(r.height) });
  const bounded = (el) => {
    const cs = getComputedStyle(el);
    const bg = cs.backgroundColor;
    const hasBg = bg && bg !== "rgba(0, 0, 0, 0)" && bg !== "transparent";
    const hasBorder = ["Top", "Right", "Bottom", "Left"].some((s) => parseFloat(cs[`border${s}Width`]) > 0 && cs[`border${s}Style`] !== "none");
    const hasShadow = cs.boxShadow && cs.boxShadow !== "none";
    return hasBg || hasBorder || hasShadow;
  };
  const defects = [];
  // overflow
  if (de.scrollWidth > vw + 1) {
    const offenders = [];
    for (const el of document.querySelectorAll("body *")) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.right > vw + 1 && visible(el)) offenders.push(el);
    }
    // the deepest offenders are the causes
    const leaves = offenders.filter((el) => !offenders.some((o) => o !== el && el.contains(o))).slice(0, 6);
    for (const el of leaves) defects.push({ kind: "overflow", id: tag(el), sel: desc(el), box: box(el.getBoundingClientRect()), detail: `document ${de.scrollWidth}px wide on a ${vw}px screen; element right edge ${Math.round(el.getBoundingClientRect().right)}px` });
  }
  // text lines
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let n;
  const seenBox = new Set();
  const gutterCount = {};
  while ((n = walker.nextNode())) {
    const t = n.textContent.trim();
    if (!t) continue;
    const el = n.parentElement;
    if (!el || ["SCRIPT", "STYLE", "NOSCRIPT", "OPTION"].includes(el.tagName) || !visible(el)) continue;
    const range = document.createRange();
    range.selectNodeContents(n);
    const rects = Array.from(range.getClientRects()).filter((r) => r.width > 1 && r.height > 1);
    if (!rects.length) continue;
    // inside a horizontal scroller (an intended swipe list): skip edge checks
    let scroller = null;
    for (let e = el; e && e !== document.body; e = e.parentElement) {
      const ox = getComputedStyle(e).overflowX;
      if ((ox === "auto" || ox === "scroll" || ox === "hidden") && e.scrollWidth > e.clientWidth + 1) { scroller = e; break; }
    }
    const right = Math.max(...rects.map((r) => r.right)), left = Math.min(...rects.map((r) => r.left));
    if (!scroller && (right > vw + 0.5 || left < -0.5)) {
      defects.push({ kind: "text-off", id: tag(el), sel: desc(el), box: box(el.getBoundingClientRect()), detail: `"${t.slice(0, 50)}" runs from ${Math.round(left)} to ${Math.round(right)}px on a ${vw}px screen` });
    }
    // past its bounded box (nearest ancestor with a fill/border/shadow)
    for (let e = el; e && e !== document.body; e = e.parentElement) {
      if (!bounded(e)) continue;
      const br = e.getBoundingClientRect();
      if (br.width >= vw - 1) break;
      const cs = getComputedStyle(e);
      const innerR = br.right - parseFloat(cs.borderRightWidth);
      const innerL = br.left + parseFloat(cs.borderLeftWidth);
      if ((right > innerR + 1 || left < innerL - 1) && !seenBox.has(e)) {
        seenBox.add(e);
        defects.push({ kind: "text-box", id: tag(e), sel: desc(e), box: box(br), detail: `"${t.slice(0, 50)}" spans ${Math.round(left)} to ${Math.round(right)}px; its box spans ${Math.round(br.left)} to ${Math.round(br.right)}px` });
      }
      break;
    }
    if (["H1", "H2", "H3", "P", "LI"].includes(el.tagName) && !scroller) {
      const g = Math.round(el.getBoundingClientRect().left);
      gutterCount[g] = (gutterCount[g] ?? 0) + 1;
    }
  }
  // bounded elements touching the screen edge
  for (const el of document.querySelectorAll("body *")) {
    if (!bounded(el) || !visible(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 24 || r.height < 16 || r.width >= vw - 2) continue;
    let inScroller = false;
    for (let e = el.parentElement; e && e !== document.body; e = e.parentElement) {
      const ox = getComputedStyle(e).overflowX;
      if ((ox === "auto" || ox === "scroll") && e.scrollWidth > e.clientWidth + 1) { inScroller = true; break; }
    }
    if (inScroller) continue;
    const pos = getComputedStyle(el).position;
    if (pos === "fixed") continue;
    if (r.left < 8 && r.left > -1 || (r.right > vw - 8 && r.right < vw + 1)) {
      defects.push({ kind: "edge", id: tag(el), sel: desc(el), box: box(r), detail: `left ${Math.round(r.left)}px, right gap ${Math.round(vw - r.right)}px, width ${Math.round(r.width)}px` });
    }
  }
  // sections: paddings and the empty space between consecutive sections' content
  const sections = Array.from(document.querySelectorAll("section, main > div > div, footer")).filter((s) => visible(s) && s.getBoundingClientRect().height > 40 && !s.parentElement.closest("section"));
  const contentBounds = (s) => {
    let top = Infinity, bottom = -Infinity;
    for (const e of s.querySelectorAll("*")) {
      if (!visible(e)) continue;
      const r = e.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) continue;
      const isContent = e.tagName === "IMG" || e.tagName === "svg" || e.tagName === "BUTTON" || e.tagName === "INPUT" || e.tagName === "CANVAS" || bounded(e) || Array.from(e.childNodes).some((c) => c.nodeType === 3 && c.textContent.trim());
      if (!isContent) continue;
      // a section's own background is not content
      if (e === s) continue;
      top = Math.min(top, r.top + scrollY);
      bottom = Math.max(bottom, r.bottom + scrollY);
    }
    return { top, bottom };
  };
  const secInfo = sections.map((s) => {
    const cs = getComputedStyle(s);
    const r = s.getBoundingClientRect();
    return { el: s, sel: desc(s), top: r.top + scrollY, bottom: r.bottom + scrollY, pad: `${cs.paddingTop} ${cs.paddingRight} ${cs.paddingBottom} ${cs.paddingLeft}`, bg: cs.backgroundColor, ...contentBounds(s) };
  }).sort((a, b) => a.top - b.top);
  for (let i = 0; i + 1 < secInfo.length; i++) {
    const a = secInfo[i], b = secInfo[i + 1];
    if (!isFinite(a.bottom) || !isFinite(b.top)) continue;
    const gap = b.top - a.bottom;
    if (gap > 120) defects.push({ kind: "gap", id: tag(b.el), sel: `${a.sel}  →  ${b.sel}`, box: { x: 0, y: Math.round(a.bottom), w: vw, h: Math.round(gap) }, detail: `${Math.round(gap)}px of empty space between the two sections' content (paddings: ${a.pad} / ${b.pad})` });
  }
  // empty space inside a section at its top or bottom beyond its padding
  // hero image
  const firstImg = Array.from(document.querySelectorAll("main img, section img, body img")).find((im) => visible(im) && im.getBoundingClientRect().width > 100 && !im.closest("nav, header"));
  let hero = null;
  if (firstImg) {
    const r = firstImg.getBoundingClientRect();
    const cs = getComputedStyle(firstImg);
    const nat = firstImg.naturalWidth / firstImg.naturalHeight;
    const boxA = r.width / r.height;
    let letterbox = 0;
    if (cs.objectFit === "contain" && nat && boxA) letterbox = nat > boxA ? 1 - boxA / nat : 1 - nat / boxA;
    const top = r.top + scrollY;
    const shown = Math.max(0, Math.min(innerHeight, r.bottom + scrollY) - Math.max(0, top));
    hero = { src: firstImg.getAttribute("src"), box: box(r), objectFit: cs.objectFit, objectPosition: cs.objectPosition, natural: `${firstImg.naturalWidth}x${firstImg.naturalHeight}`, letterboxPct: Math.round(letterbox * 100), firstScreenPct: Math.round((shown / innerHeight) * 100), startsAtPx: Math.round(top) };
  }
  return {
    vw,
    pageHeight: de.scrollHeight,
    defects,
    gutters: Object.entries(gutterCount).map(([g, c]) => [Number(g), c]).sort((a, b) => b[1] - a[1]),
    sections: secInfo.map(({ sel, top, bottom, pad, bg }) => ({ sel, top: Math.round(top), height: Math.round(bottom - top), pad, bg })),
    hero,
  };
}

async function annotate(page, d, file) {
  await page.evaluate(({ b }) => {
    const o = document.createElement("div");
    o.id = "audit-outline";
    o.style.cssText = `position:absolute;left:${b.x - 2}px;top:${b.y - 2}px;width:${b.w + 4}px;height:${b.h + 4}px;border:2px solid #E11D48;z-index:2147483647;pointer-events:none;box-sizing:border-box`;
    document.body.appendChild(o);
  }, { b: d.box });
  const vw = await page.evaluate(() => document.documentElement.clientWidth);
  const ph = await page.evaluate(() => document.documentElement.scrollHeight);
  const y = Math.max(0, Math.min(d.box.y - 120, ph - 600));
  const h = Math.min(600, ph - y);
  await page.screenshot({ path: file, type: "jpeg", quality: 70, fullPage: true, clip: { x: 0, y, width: Math.max(vw, d.box.x + d.box.w + 4), height: Math.max(h, Math.min(d.box.h + 240, 1400)) } });
  await page.evaluate(() => document.getElementById("audit-outline")?.remove());
}

async function settle(page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += 400) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 100));
    }
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 400));
  });
}

const browser = await chromium.launch();
const report = [];
// A page that fails to load (a dropped connection, a slow compile) is retried
// twice before it is recorded as failed.
async function run(name, url, width, opts = {}) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const ok = await runOnce(name, url, width, opts, attempt === 3);
    if (ok) return;
    await new Promise((r) => setTimeout(r, 5000));
  }
}
async function runOnce(name, url, width, opts, last) {
  if (ONLY && !ONLY.includes(name)) return true;
  const ctx = await browser.newContext({ viewport: { width, height: H }, deviceScaleFactor: 1, isMobile: true, hasTouch: true, storageState: opts.state });
  const page = await ctx.newPage();
  if (ndjson) await page.route("**/api/agents/stream", (r) => r.fulfill({ status: 200, contentType: "application/x-ndjson; charset=utf-8", body: ndjson }));
  try {
    await page.goto(base + url, { waitUntil: "load", timeout: 60000 });
    await page.waitForTimeout(2500);
    // Phones open a lens from the lens sheet; from 768 the sidebar lists them.
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
    await settle(page);
    await page.screenshot({ path: path.join(out, "shots", `${name}-${width}-full.jpg`), fullPage: true, type: "jpeg", quality: 60 });
    const res = await page.evaluate(auditPage);
    let k = 0;
    for (const d of res.defects) {
      const file = path.join("shots", `${name}-${width}-${d.kind}-${++k}.jpg`);
      try { await annotate(page, d, path.join(out, file)); d.shot = file; } catch (e) { d.shot = null; }
    }
    report.push({ name, url, width, ...res });
    const counts = res.defects.reduce((a, d) => ((a[d.kind] = (a[d.kind] ?? 0) + 1), a), {});
    console.log(`${name}@${width}: ${JSON.stringify(counts)} gutters ${res.gutters.slice(0, 4).map((g) => g[0]).join("/")}`);
  } catch (e) {
    await ctx.close();
    if (!last) return false;
    report.push({ name, url, width, error: String(e).slice(0, 300) });
    console.log(`${name}@${width}: FAILED ${String(e).split("\n")[0].slice(0, 160)}`);
    return true;
  }
  await ctx.close();
  return true;
}
for (const width of WIDTHS) {
  for (const [name, url] of [...MARKETING, ...PUBLIC_APP]) await run(name, url, width);
  for (const [name, url, lens, fx] of SIGNED) await run(name, url, width, { state: args.state, lens, runFixture: fx });
}
await browser.close();
fs.writeFileSync(path.join(out, "audit.json"), JSON.stringify(report, null, 2));
