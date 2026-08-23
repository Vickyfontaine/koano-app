// KOANO chart color convention — domain hues (pastel register).
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
// single DOMAIN hue below. The register is deliberately PASTEL: soft, low-chroma
// tints so a chart sits beside the map and the verdict panel without dominating
// (the saturated colors are reserved for status + value, which must read as
// signal). The domains are still separated by hue so a user learns "yellow =
// development, purple = demographics, …"; only the saturation is dialed down.

// Development / construction — building permits, pipeline activity.
// Pastel butter: distinct from the comp gradient, the flood blues, and status.
export const DOMAIN_DEVELOPMENT = "#E0C874";

// Assigned as their first charts are built (kept here so the scheme stays in one
// place and no two domains silently pick the same hue). All pastel, all distinct
// in hue, none colliding with the reserved value scales:
export const DOMAIN_DEMOGRAPHICS = "#B9A5D9"; // pastel lavender
export const DOMAIN_LENDING = "#E2AEC9"; // pastel rose
