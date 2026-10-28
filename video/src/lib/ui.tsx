// Shared type + layout constants for the film. Font stacks match koano.co
// exactly: SANS renders as system-ui today (San Francisco on macOS), MONO is
// the vendored DM Mono.
export const SANS = "'Neue Montreal', 'DM Sans', system-ui, sans-serif";
export const MONO = "'DM Mono', monospace";

// Section-number / caption eyebrow style (mono, brand blue), from globals.css.
export const eyebrowStyle: React.CSSProperties = {
  fontFamily: MONO,
  fontSize: 15,
  letterSpacing: "0.15em",
  textTransform: "uppercase",
  color: "var(--mid-blue)",
};
