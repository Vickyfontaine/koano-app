// KOANO chart color convention — domain hues (true-pastel register).
//
// A single-hue chart series is colored by its DATA DOMAIN, and a domain keeps
// its hue everywhere it appears, so the visual language is learnable rather than
// one-off per chart. Two families are RESERVED and are never a domain hue:
//
//   • Status (fixed meaning, small marks): live-green / representative-amber /
//     hazard-red — verdict, provenance, EPA. Saturated on purpose; never a series.
//   • Value-vs-benchmark scales (spectral, carry magnitude+direction):
//       - comps $/sqft  → blue ↔ gray ↔ magenta  (mapColors COMP_*)
//       - flood risk    → blue (SFHA) / teal (0.2%)  (mapColors FLOOD_*)
//     These own blue→magenta and blue/teal; a domain hue must not collide.
//
// Everything else — a plain magnitude series for one data domain — draws a
// single DOMAIN hue below. The register is TRUE PASTEL: high lightness, low
// chroma, so a chart sits quietly beside the map and the verdict panel (the
// saturated colors stay reserved for status + value, which must read as signal).
// Because a true-pastel fill nearly vanishes on white, each domain also has an
// `_EDGE` — a slightly deeper tint of the SAME hue — for outlining pale marks
// (bar borders, dot rings) so they still read. Fill = pastel, edge = definition.

// Development / construction — building permits, pipeline activity. Pastel butter.
export const DOMAIN_DEVELOPMENT = "#F4E6B5";
export const DOMAIN_DEVELOPMENT_EDGE = "#DDC66F";

// Assigned as their first charts are built (kept here so the scheme stays in one
// place and no two domains silently pick the same hue). All true pastels:
export const DOMAIN_DEMOGRAPHICS = "#E7DCF4"; // pastel lavender
export const DOMAIN_DEMOGRAPHICS_EDGE = "#B49ED8";
export const DOMAIN_LENDING = "#F6DEEB"; // pastel rose
export const DOMAIN_LENDING_EDGE = "#E0A6C4";
