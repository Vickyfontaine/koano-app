// KOANO map color language — data-bearing, validated against the dataviz color
// method (scatter → all-pairs CVD ≥ 12, checked with the reserved red hazard so
// the comp scale can never be confused with a Superfund diamond). Color here
// always encodes a value; the base tiles stay grey.

// Comp diverging scale — where each sale sits vs the subject's indicative $/sqft
// (the median comp psf, which is what the AVM uses). Blue (cheaper) ↔ neutral
// gray (at indicative) ↔ magenta (pricier). Warm/cool poles through a gray
// midpoint, per the diverging rule.
export const COMP_LOW = "#2a6fd6"; // well below indicative
export const COMP_MID = "#8a949c"; // at indicative — neutral, reads as "nothing"
export const COMP_HIGH = "#b02a8f"; // well above indicative

// Flood hazard fills — SFHA (1%-annual) vs 0.2%-annual differ by HUE, not just
// opacity, so a serious boundary never dissolves into the lighter one.
export const FLOOD_SFHA_FILL = "#2f6fb2"; // blue
export const FLOOD_SFHA_LINE = "#1a4f6e";
export const FLOOD_SHADED_FILL = "#2f9fbf"; // teal
export const FLOOD_SHADED_LINE = "#1f7f96";

function mixHex(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ar = (pa >> 16) & 255,
    ag = (pa >> 8) & 255,
    ab = pa & 255;
  const br = (pb >> 16) & 255,
    bg = (pb >> 8) & 255,
    bb = pb & 255;
  const k = Math.min(1, Math.max(0, t));
  const r = Math.round(ar + (br - ar) * k);
  const g = Math.round(ag + (bg - ag) * k);
  const bl = Math.round(ab + (bb - ab) * k);
  return `#${((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1)}`;
}

// Diverging color for one comp's $/sqft against the indicative value, given the
// pool's min/max for scaling each arm. Equal treatment per side of the midpoint.
export function compDivergingColor(v: number, mid: number, min: number, max: number): string {
  if (v <= mid) {
    const d = mid - min;
    return mixHex(COMP_MID, COMP_LOW, d > 0 ? (mid - v) / d : 0);
  }
  const d = max - mid;
  return mixHex(COMP_MID, COMP_HIGH, d > 0 ? (v - mid) / d : 0);
}

// The CSS gradient that decodes the comp scale in the legend.
export const COMP_GRADIENT_CSS = `linear-gradient(90deg, ${COMP_LOW}, ${COMP_MID} 50%, ${COMP_HIGH})`;

// --- Restrained base geography ------------------------------------------------
// Subordinate to every data layer (flood, comps, hazards). Water is a low-chroma
// blue-GREY, deliberately NOT the flood blue/teal — the canal is water (base),
// the flood zones are hazard (data); different meaning, different look. Parks a
// muted pastel sage. Pastel so a park can never compete with a comp dot.
export const BASE_WATER = "#C7D2D8"; // soft blue-grey (canal, bay)
export const BASE_WATERWAY = "#A9B8C0"; // slightly deeper for the canal line
export const BASE_GREEN = "#D2DEC8"; // muted sage (parks, green space)
// landuse classes that are green space (Mapbox streets v8) — everything else on
// that layer recedes to transparent, keeping the base quiet.
export const BASE_GREEN_CLASSES = [
  "park",
  "grass",
  "wood",
  "scrub",
  "cemetery",
  "pitch",
  "garden",
  "recreation_ground",
  "golf_course",
  "agriculture",
];
