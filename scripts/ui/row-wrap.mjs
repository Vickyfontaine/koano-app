// Row primitive wrap check (founder pass). Renders the Row markup with the
// pre-fix and the fixed styles, side by side, at the 390 phone panel's inner
// width (390 - 2 x 16 gutter - 2 x 24 card padding = 310px) in the app's own
// fonts, using label and value pairs of the lengths the lenses print, and
// counts lines per value. No analysis run needed.
// node scripts/ui/row-wrap.mjs --out build-log/phone-polish
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const args = Object.fromEntries(process.argv.slice(2).map((a, i, arr) => (a.startsWith("--") ? [a.slice(2), arr[i + 1]] : [])).filter((x) => x.length));
const out = args.out ?? "build-log/phone-polish";
fs.mkdirSync(out, { recursive: true });

// [label, value, badge?]: a badge row mirrors the Valuation panel, whose value
// is an inline-flex span of text plus a ProvenanceBadge.
const PAIRS = [
  ["Recorded residential sales in the area (12mo, market median)", "87 sales · rising", true],
  ["Tract median home value (2023)", "$1,412,300", true],
  ["Price velocity: New York-Jersey City-White Plains (msa, FHFA HPI)", "5.6% yoy · 31.2% 5yr", true],
  ["Registered owner (HPD)", "425 SIXTH STREET HOUSING DEVELOPMENT FUND CORP"],
  ["Managing agent", "PROSPECT PARK MANAGEMENT LLC"],
  ["Most recent inspection", "2026-09-14"],
  ["Area median (all qualifying sales)", "$1,124/sq ft · 87 sales · rising"],
  ["Most recent permit", "A2 alteration, filed 2026-03-02"],
  ["Submarket profile", "Park Slope / Gowanus multifamily"],
  ["Lot area", "2,500 sq ft"],
];

const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
// The app's two families, from the same stylesheets layout.tsx links.
await page.setContent(
  `<!doctype html><html><head>
  <link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=neue-montreal@400,500,700&display=swap">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap">
  <style>:root{--font-sans:'Neue Montreal',sans-serif;--font-mono:'DM Mono',monospace} body{margin:0;background:#fff}</style>
  </head><body></body></html>`,
  { waitUntil: "networkidle" },
);
await page.evaluate(() => document.fonts.ready);
const result = await page.evaluate((pairs) => {
  const variants = {
    before: { row: "display:flex;justify-content:space-between;gap:12px", value: "max-width:62%" },
    after: { row: "display:flex;flex-wrap:wrap;justify-content:space-between;column-gap:12px", value: "margin-left:auto;max-width:100%" },
  };
  const report = {};
  const wrap = document.createElement("div");
  wrap.style.cssText = "display:flex;flex-direction:column;gap:16px;padding:16px;font-family:var(--font-sans, 'Neue Montreal', sans-serif)";
  document.body.appendChild(wrap);
  for (const [name, v] of Object.entries(variants)) {
    const panel = document.createElement("div");
    panel.style.cssText = "width:310px;border:1px solid #D6EBF7;border-radius:16px;padding:12px 0;display:flex;flex-direction:column;gap:8px";
    const h = document.createElement("div");
    h.textContent = name === "before" ? "Before (sprint)" : "After";
    h.style.cssText = "font-size:15px;font-weight:500;color:#0D2B3E;margin-bottom:4px";
    panel.appendChild(h);
    wrap.appendChild(panel);
    report[name] = [];
    for (const [label, value, badge] of pairs) {
      const row = document.createElement("div");
      row.style.cssText = v.row + ";font-size:14px;line-height:1.5";
      const l = document.createElement("span");
      l.textContent = label;
      l.style.color = "#527082";
      const val = document.createElement("span");
      let textHost = val;
      if (badge) {
        const inner = document.createElement("span");
        inner.style.cssText = "display:inline-flex;align-items:center;gap:8px";
        inner.append(document.createTextNode(value));
        const b = document.createElement("span");
        b.textContent = "● Live";
        b.style.cssText = "font-size:11px;color:#15803D;white-space:nowrap";
        inner.append(b);
        val.append(inner);
        textHost = inner.firstChild;
      } else {
        val.textContent = value;
      }
      val.style.cssText = "font-family:var(--font-mono, 'DM Mono', monospace);font-size:13px;color:#0D2B3E;text-align:right;overflow-wrap:break-word;" + v.value;
      row.append(l, val);
      panel.appendChild(row);
      const words = value.split(/\s+/).length;
      const range = document.createRange();
      range.selectNodeContents(textHost);
      const lines = new Set(Array.from(range.getClientRects()).map((r) => Math.round(r.top))).size;
      report[name].push({ label, words, lines, oneWordPerLine: words > 1 && lines >= words });
    }
  }
  return report;
}, PAIRS);
await page.screenshot({ path: path.join(out, "row-wrap-390.jpg"), type: "jpeg", quality: 85, fullPage: true });
await browser.close();
fs.writeFileSync(path.join(out, "row-wrap.json"), JSON.stringify(result, null, 2));
for (const [k, rows] of Object.entries(result)) console.log(k, rows.map((r) => `${r.label}: ${r.lines} lines/${r.words} words${r.oneWordPerLine ? " ONE-WORD-PER-LINE" : ""}`).join("\n   "));
