// KOANO chart color convention — domain hues.
//
// A single-hue chart series is colored by its DATA DOMAIN, and a domain keeps
// its hue everywhere it appears, so the visual language is learnable rather than
// one-off per chart. Two families are RESERVED and are never a domain hue:
//
//   • Status (fixed meaning, small marks): live-green / representative-amber /
//     hazard-red — verdict, provenance, EPA. Never repurposed for a series.
//   • Value-vs-benchmark scales (spectral, carry magnitude+direction):
//       - comps $/sqft  → blue ↔ gray ↔ magenta  (mapColors COMP_*)
//       - flood risk    → blue (SFHA) / teal (0.2%)  (mapColors FLOOD_*)
//     These own blue→magenta and blue/teal; a domain hue must not collide.
//
// Everything else — a plain magnitude series for one data domain — draws a
// single muted domain hue from the list below, assigned in order as each domain
// gets its first chart. Muted by design: charts sit beside the map and the
// verdict panel without shouting. Validated against the reserved set with the
// dataviz palette checker (must clear the comp poles + flood + status).

// Development / construction — building permits, pipeline activity. Warm ochre:
// the one hue that breaks KOANO's blue-heavy palette and cannot be read as the
// comp price gradient, the flood blues, or a status color.
export const DOMAIN_DEVELOPMENT = "#C2A14D";

// Assigned as their first charts are built (kept here so the scheme stays in one
// place and no two domains silently pick the same hue):
//   export const DOMAIN_DEMOGRAPHICS = ...   // muted violet
//   export const DOMAIN_LENDING = ...        // muted clay/terracotta
//   export const DOMAIN_EMPLOYMENT = ...     // muted slate-green
