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
      borderRadius: {
        card: "20px",
        pill: "100px",
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
