/** Tailwind config for the KOANO video. Mirrors the app theme tokens
 *  (src colors map to the CSS variables defined in src/app/globals.css),
 *  and scans both the video sources and the real app components we import. */
module.exports = {
  content: ["./src/**/*.{ts,tsx}", "../src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        white: "var(--white)",
        "pale-wash": "var(--pale-wash)",
        sky: "var(--sky)",
        "brand-blue": "var(--brand-blue)",
        "mid-blue": "var(--mid-blue)",
        "deep-navy": "var(--deep-navy)",
        "near-black": "var(--near-black)",
        "ink-primary": "var(--ink-primary)",
        "ink-secondary": "var(--ink-secondary)",
        "ink-muted": "var(--ink-muted)",
        "ink-faint": "var(--ink-faint)",
        border: "var(--border)",
        "border-light": "var(--border-light)",
        "signal-positive": "var(--signal-positive)",
        "signal-warning": "var(--signal-warning)",
        "signal-negative": "var(--signal-negative)",
      },
      fontFamily: {
        sans: ["Neue Montreal", "DM Sans", "system-ui", "sans-serif"],
        mono: ["DM Mono", "monospace"],
      },
      borderRadius: { chip: "8px", inner: "12px", card: "16px", deep: "20px", pill: "100px" },
      letterSpacing: { headline: "-0.02em", mono: "0.08em", section: "0.15em" },
    },
  },
  plugins: [],
};
