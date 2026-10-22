import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
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
        "mid-blue-ink": "var(--mid-blue-ink)",
        "border-input": "var(--border-input)",
        "signal-positive-ink": "var(--signal-positive-ink)",
        "signal-warning-ink": "var(--signal-warning-ink)",
        "signal-negative-ink": "var(--signal-negative-ink)",
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
      // Radius and type read the CSS tokens so a class and an inline var can
      // never disagree (the 20px-vs-16px card split was exactly that).
      borderRadius: {
        chip: "var(--radius-chip)",
        inner: "var(--radius-inner)",
        card: "var(--radius-card)",
        deep: "var(--radius-deep)",
        pill: "var(--radius-pill)",
      },
      fontSize: {
        micro: ["var(--text-micro)", { lineHeight: "16px" }],
        caption: ["var(--text-caption)", { lineHeight: "18px" }],
        data: ["var(--text-data)", { lineHeight: "20px" }],
        body: ["var(--text-body)", { lineHeight: "22px" }],
        ui: ["var(--text-ui)", { lineHeight: "20px" }],
        lead: ["var(--text-lead)", { lineHeight: "24px" }],
        h3: ["var(--text-h3)", { lineHeight: "24px" }],
        h2: ["var(--text-h2)", { lineHeight: "28px" }],
        "data-l": ["var(--text-data-l)", { lineHeight: "32px" }],
        h1: ["var(--text-h1)", { lineHeight: "38px" }],
        verdict: ["var(--text-verdict)", { lineHeight: "56px" }],
      },
      transitionDuration: {
        1: "120ms",
        2: "200ms",
        3: "300ms",
        4: "500ms",
      },
      transitionTimingFunction: {
        out: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      letterSpacing: {
        headline: "-0.02em",
        mono: "0.08em",
        section: "0.15em",
      },
      animation: {
        "ticker-scroll": "ticker-scroll 40s linear infinite",
      },
      keyframes: {
        "ticker-scroll": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
