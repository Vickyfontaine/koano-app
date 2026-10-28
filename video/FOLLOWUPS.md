# Follow-ups (after the film — do not action during the video build)

## 1. Live site renders a fallback font, not Neue Montreal (separate issue)

**Finding (2026-09-23).** koano.co's `<head>` links `https://api.fontshare.com/v2/css?f[]=neue-montreal@400,500,700`, but that URL returns an **empty body** — Fontshare does not host "Neue Montreal" (it is a paid Pangram Pangram typeface). The compiled site CSS has **zero `@font-face`** rules, and DM Sans (next in the stack) is not linked either. So every visitor without Neue Montreal or DM Sans installed locally sees headlines and body in their **OS default (`system-ui`)**. DM Mono (Google, OFL) does load and renders for real.

**Impact.** The brand headline face is not actually being delivered to visitors. CLAUDE.md's note "Neue Montreal (Fontshare, free, commercial use permitted)" is factually wrong on all three counts.

**Options (for after the film, founder decision — DO NOT change the site now):**
- License Pangram Pangram's PP Neue Montreal (desktop + web) and self-host the files, or
- Switch the brand face to a genuinely free Fontshare face (e.g. General Sans or Satoshi; ITF Free Font License permits commercial use and embedding), and correct the CLAUDE.md claim.

**Film handling.** The film deliberately matches the site as it renders today: `system-ui` for headline/body (rendered on macOS = San Francisco), DM Mono vendored. No dependency on resolving this issue.
