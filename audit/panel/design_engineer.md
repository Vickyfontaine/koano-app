# 6.2 Design Engineer: KOANO interface audit

Persona: design engineer who has shipped product surfaces where craft is the product. Standard applied: every pixel either carries meaning or earns trust, motion explains causality, and an institutional user can operate the whole thing from a keyboard on a 13 inch laptop or a phone in a site meeting.

Evidence base: the four production dashboard captures (`demo-kit/design-upload-2/dashboards/*.png`, 3840x2160, above the fold), the generated document pages (`demo-kit/design-upload-2/documents/pages/*.png`), the 2026-10-19 full-page captures of www.koano.co at 1440px and 390px, plus a second capture I took the same day with scroll-through (so in-view animations fire) and a five-frame time strip of the homepage hero loop. Code read in full: `src/components/ui/**` (VerdictCard, ReasoningChain, LoadingState, ProvenanceBadge, ProvenanceLedger, VerdictMathPanel, CoverageMap, charts/*, map/KoanoMap.tsx), `src/components/dashboard/**` (all four clusters, Sidebar, DashboardShell, useVerdictStream.ts, panels.tsx, DocumentButton, UpgradeScreen, CandidatePicker), `src/app/globals.css`, `tailwind.config.ts`, `src/app/layout.tsx`, `src/app/api/agents/stream/route.ts`, `lib/agents/synthesis.ts` (pipeline orchestration), `src/components/marketing/HeroDashboard.tsx`, `lib/documents/render/{pdf.tsx,docx.ts}`, and the recorded fixture `scripts/fixtures/nyc-175-3rd-st.json`.

---

## 0. The short version

KOANO has one genuinely excellent component and a dashboard that hides it. `VerdictMathPanel.tsx` ("Decided by 2 of 5 agents", the score needle against thresholds, the signed diverging contributions, the literal arithmetic line) is better than anything I have seen in a real estate product and is the seed of the brand. Everything around it is a competent internal tool: 1,107 inline `style={{}}` objects against 143 `className` uses, a fixed 240px sidebar with no responsive behavior (the dashboard has a 70px content column at 390px), no focus styles anywhere in the app, a provenance badge system whose every non-live state fails WCAG AA contrast, a loading screen that shows five dots and the word "analyzing…" for 60 to 180 seconds while 23 real data fetches complete invisibly, and panels that render "Unavailable" while they are merely loading.

The product's thesis is "watch the reasoning." The UI currently says "wait, then read." The fix is mostly frontend plus three small server events, and none of it touches the font, the logo, or the deterministic math.

---

## 1. Component system and tokens

### 1.1 What exists

- Color tokens are real and mostly respected. `globals.css:9-58` defines the Coastal palette, a radius scale, and navy-tinted elevation. Hex literals in `src/` total 91, and almost all live where they should: `clerkAppearance.ts` (23), `map/mapColors.ts` (17), `KoanoMap.tsx` (15), `charts/domains.ts` (6). Dashboard components themselves use `var(--*)`. EXISTS.
- Shared panel primitives exist (`dashboard/panels.tsx`: `panelStyle`, `PanelHeader`, `Row`, `BlockError`, `Meter`). PARTIAL: they are style objects, not components with variants, and they are bypassed often.

### 1.2 What is broken

- **Inline styles are the system.** `grep "style={{"` returns 1,107 hits in `src/components` and `src/app`; `className=` returns 143. Tailwind is configured (`tailwind.config.ts`) and almost unused. Consequences: no hover/focus/active states are possible without JS, no media queries are possible, and mobile is "fixed" in `globals.css:326-603` by **matching inline style strings with attribute selectors**, e.g. `[style*="padding:28px"][style*="gap:24px"]` and `[style*="grid-template-columns:176px 1fr"]`. Any harmless refactor of a padding value silently breaks the mobile layout. This is the single most fragile thing in the frontend. PARTIAL.
- **Token drift.** `--radius-card: 16px` in `globals.css:39` versus `borderRadius.card: "20px"` in `tailwind.config.ts`. In components, `borderRadius: "20px"` appears 14 times and `var(--radius-card)` twice. `panelStyle` uses 20px (`panels.tsx`), `VerdictMathPanel` uses the 16px token, so two adjacent cards on the same page have different corner radii.
- **No spacing scale.** Padding values in dashboard/ui: 25 distinct strings (`10px 12px`, `12px 14px`, `16px 20px`, `22px`, `24px`, `28px`, `28px 40px`, `7px 16px`, `9px 20px` ...). Gaps: 18 distinct values including 2, 3, 5, 6, 7, 9, 10, 14, 18, 28. There is no rhythm, which is why the dashboards read as "assembled" rather than designed.
- **Type scale is ad hoc.** 19 distinct `fontSize` values in components, including 9px (8 uses), 10px (42 uses), 12.5px and 13.5px. `'DM Mono', monospace` is hand-typed 142 times instead of a class or token.
- **Duplicated primitives.** `Meter` exists in both `VerdictCard.tsx:21` and `panels.tsx`. The left-border error callout (`borderLeft: 3px solid var(--signal-negative)`, `borderRadius: 0 12px 12px 0`) is copy-pasted 14 times across clusters with slightly different paddings and max widths.
- **Three numbering systems on one screen.** Sidebar shows `C4 · Property intelligence`, the page eyebrow shows `01`, the internal id is `cluster_1` (`clusters.ts`, screenshot `community.png`). Portfolio shows `C3` in the switcher and `05` above the title (`portfolio.png`). A user cannot tell which number is "theirs." The comment in `clusters.ts` admits the decoupling; the UI should not expose both.
- **Page grid differs per cluster.** Content max width is 980px (C1), 1080px (C2), 1160px (C4, C5) (`Cluster*Dashboard.tsx`), left-aligned. On a 1920px display, the screenshots show 25 to 35 percent of the viewport as dead white on the right (`transaction.png`, `community.png`).

---

## 2. Accessibility (WCAG 2.2 AA)

### 2.1 Contrast (computed, WCAG relative luminance)

| Pair | Ratio | AA small text (4.5) | Where |
|---|---|---|---|
| `--ink-faint` #8AABB8 on white | 2.44 | Fail | 119 inline uses as text color; every panel title (`panels.tsx` `panelTitle`), axis labels, timestamps, "Generated ... Decision support" |
| `--ink-faint` on `--pale-wash` | 2.26 | Fail | Sidebar labels "Cluster view", "Viewing C4..." (`Sidebar.tsx:63-116`) |
| `--brand-blue` #A8C4D4 on white | 1.82 | Fail | Section numbers, ReasoningChain agent group labels (`ReasoningChain.tsx:169`) |
| `--ink-muted` #5A7A8C on white | 4.57 | Pass (barely) | |
| `--ink-muted` on `--pale-wash` | 4.22 | Fail | Sidebar nav items, the main navigation of the app (`Sidebar.tsx:137`) |
| `--mid-blue` #5A9BBE on white | 3.06 | Fail | The HOLD verdict word (`verdict.ts:99`), links |
| `--signal-positive` #22C55E on white | 2.28 | Fail | BUY verdict word, "Complete. Waiting for the other sites" (`SiteComparison.tsx`) |
| `--signal-warning` #F59E0B on white | 2.15 | Fail | WAIT verdict word |
| LIVE badge (#22C55E on 8% green tint) | 2.12 | Fail | Every `ProvenanceBadge` live pill, 10px uppercase |
| Representative / Fetch failed badge (#F59E0B on 10% tint) | 1.99 | Fail | |
| Not covered badge (#8AABB8 on 12% tint) | 2.23 | Fail | |
| Partner badge (#5A9BBE on 10% tint) | 2.77 | Fail | |
| Primary button text #0D2B3E on `--brand-blue` | 8.04 | Pass | `.btn-primary` |
| Disabled primary (opacity .55) | 2.61 | n/a (disabled exempt) but reads broken | `AddressInput.tsx:53` |
| `--border` #D6EBF7 on white (input boundary) | 1.23 | Fail 1.4.11 non-text 3:1 | Every address input; the input is nearly invisible on white |

The sharpest finding in this section: **the provenance badge, the component the whole company's integrity thesis rests on, fails contrast in every one of its five states, at 10px.** The signal-of-trust is the least legible text in the product. The verdict words BUY and WAIT also fail.

Fix (does not touch logo colors or font): split each signal into a fill token and an ink token.

```css
--signal-positive-ink: #15803D;  /* 5.02 on white */
--signal-warning-ink:  #B45309;  /* 5.02 */
--signal-negative-ink: #B91C1C;  /* 6.47 */
--mid-blue-ink:        #2F6F94;  /* 5.49; HOLD word and links */
--ink-muted:           #527082;  /* 5.25 white, 4.86 pale-wash */
--ink-faint:           #6E8E9D;  /* 3.49: decorative and >=18px only, lint-banned for body */
--border-input:        #A8C4D4;  /* input boundary; 1.82 still fails 3:1, so pair with a 1px inset #8AABB8 bottom edge or use --ink-faint at 3.49 */
```

Badges use the `-ink` token for text and dot, and keep the 8 to 12 percent tint as background. Section numbers stay `--brand-blue` (CLAUDE.md §10) but get `aria-hidden="true"` because they are decorative eyebrows.

### 2.2 Focus and keyboard

- `grep outline|focus-visible|:focus` over `src/`: zero focus styles. Four inputs explicitly set `outline: "none"` with no replacement: `AddressInput.tsx:46`, `VerdictHistory.tsx:95`, `SiteComparison.tsx:233`, `PortfolioOverview.tsx:112`. WCAG 2.4.7 fail on the primary input of every dashboard. MISSING.
- Sidebar nav items are buttons (good) but active state is click-only local state (`Sidebar.tsx:26`), no `aria-current`, no scroll-spy. Clicking "Valuation" before a run completes does nothing, because `#c1-valuation` only mounts when `status === "done"` (`Cluster1Dashboard.tsx:198`). Silent no-op navigation.
- Map markers are DOM divs with `mouseenter` popups only (`KoanoMap.tsx:390-402`): not focusable, no click/tap, no keyboard path. On touch devices, comp details are unreachable.
- Chart points (`Scatter.tsx:113`) and bars use the native `title` attribute: no keyboard access, no touch access, 1.5s browser delay.
- `UpgradeScreen.tsx:61` has `role="dialog" aria-modal="true"` but no focus trap, no initial focus, no Escape handler.
- `ReasoningChain` expand toggle has `aria-expanded` (good) but no `aria-controls`.

### 2.3 Semantics and screen readers

- No `aria-live` region anywhere. A screen reader user who submits an address hears nothing for 60 to 180 seconds and nothing when the verdict lands. MISSING.
- Panel titles are `<span>` in `PanelHeader` (`panels.tsx`), so heading navigation skips every data panel. Empty states use `<h3>` directly under `<h1>`.
- Charts: `BarChart` has `role="img"` plus `aria-label`; `Scatter`, `ScoreBands`, `DivergingBar` have none and are built from absolutely positioned spans (no SVG), so assistive tech reads a soup of tick labels. No data-table fallback.
- `HeroDashboard.tsx` loops forever every 6,800ms (`CYCLE_MS`) with no pause control and no `prefers-reduced-motion` handling (WCAG 2.2.2). `grep reduced-motion` over `src/`: zero.

### 2.4 Dark mode

MISSING, and I would not build it yet. CLAUDE.md §16 bans dark section backgrounds on marketing; that rule does not bind an app theme, but the higher-value move is to finish tokenization first so a theme is a one-file change. VISION: a "terminal" theme for C5 desks that run screens all day, built only after the token layer below exists.

---

## 3. Responsiveness

- **The dashboard does not work at 390px.** `Sidebar.tsx:29-43` is `position: fixed; width: 240px` with no breakpoint, and `DashboardShell.tsx:57-63` sets `marginLeft: 240px; padding: 32px 40px; maxWidth: calc(100vw - 240px)`. At 390px the main column is 150px wide with 70px of content width. `AddressInput` has `minWidth: 280px` (`AddressInput.tsx:38`) so the first control overflows. The 900px mobile block in `globals.css` contains no dashboard rules at all. MISSING.
- Marketing mobile works only through the attribute-selector overrides described in 1.2, and `globals.css:333-340` hides every hero render on mobile. The architectural diorama house style (a locked decision) is therefore absent on the device most first impressions happen on.
- `SiteComparison` uses `repeat(auto-fit, minmax(300px, 1fr))` for three simultaneous LoadingState cards; at 1280px with the sidebar, that is three cramped 300px cards each listing 6 rows.
- Tables (`SiteComparison` summary, `PortfolioOverview`) use `overflowX: auto` with `minWidth: 560px`, acceptable, but numbers are left aligned (`development.png`: CONFIDENCE 79, RISK 50 sit left in their columns), which makes columns hard to scan.

---

## 4. Loading, empty, error states and perceived performance

### 4.1 Loading rendered as failure (provenance honesty bug in the UI)

`MarketVelocityPanel.tsx:68`, `CmaBuilder.tsx:23`, `PricingPanel.tsx:23`, `ValuationPanel.tsx:29`: `if (!detail) return <BlockError ... />`. `detail` is `null` both while `/api/site-detail` is in flight and on failure, so on C2 every panel flashes **"Unavailable"** the moment the user clicks Run, and stays that way until the fetch lands. A product whose identity is "never present a state that is not true" is presenting "unavailable" for data that is on its way. Needs a three-state contract: `loading | ready | error`. PARTIAL (error path exists, loading path is wrong).

### 4.2 Facts arrive early and are hidden

C1 fires `/api/site-detail` (no LLM, fast) in parallel with the verdict stream (`Cluster1Dashboard.tsx:73-77`), but Valuation, Permits, Violations, Ownership, Alerts all live inside `status === "done"` (`Cluster1Dashboard.tsx:198-310`). The user stares at five dots for ~90 seconds while the live permit history and violation record have already been in memory for most of that time. Only the map renders early. Same pattern for the ledger: `data_points` exist per agent at each `agent_complete` but are not streamed.

### 4.3 The verdict is below the fold on C2

`Cluster2Dashboard.tsx:175-330`: Market velocity, Map, CMA builder, Scatter, Pricing, Permit trend, Narrative, and the Documents grid render first; `LoadingState` and then `VerdictCard` render **after all of them**. The product's output is the eighth thing on the page and the progress UI is off-screen. A broker who clicks "Run analysis" sees no progress at all unless they scroll ~2,500px.

### 4.4 Inconsistent promises about time

"typically ~60s" (`LoadingState.tsx:100`), "about a minute and a half" (C1 empty state, `Cluster1Dashboard.tsx:154`), "Three sites take about two minutes" and "~1 to 3 min" (`SiteComparison.tsx`, rendered with an en dash), "full pipeline runs ~60s" (`stream/route.ts:34`). Meanwhile the homepage hero (`HeroDashboard.tsx:41-44`) shows all five agents finishing in 1.9 seconds and a verdict at 2.65 seconds. The marketing sets a 2 second expectation for a 60 to 180 second product.

### 4.5 No cancellation, no persistence of the in-flight view

No `AbortController` anywhere in `src/components/dashboard`. Switching cluster in the Sidebar mid-run unmounts the dashboard; the server keeps running and persists the verdict, but the user loses the view and will likely re-run (spending another quota slot). No URL state: the CLAUDE.md §11 routes `/dashboard/site/[id]` and `/dashboard/reasoning/[id]` do not exist (`src/app/dashboard/` has only `page.tsx`, `layout.tsx`, `settings/`), so a verdict cannot be linked, refreshed, or shared.

### 4.6 Other perceived-performance notes

- Fonts load through render-blocking `<link rel="stylesheet">` to Fontshare and Google (`layout.tsx`). Same fonts, self-hosted through `next/font/local` with `display: swap` and preload, would remove two third-party round trips. (This is a loading strategy change only; the font itself stays.)
- When the run completes, roughly 2,000px of content mounts in one frame with no transition and no scroll anchoring. The user is left wherever LoadingState was, now looking at the middle of a VerdictCard.
- Empty states are decent and use approved copy (`VerdictWorkbench.tsx:23-34`). EXISTS.
- Error states are one generic string plus "Try a New York City street address" even when the failure is an Anthropic timeout or a 300s Vercel limit. `RunDegradationNote` is the right idea for degraded runs; hard failures need the same specificity.

---

## 5. The verdict stream: what the user actually sees today

Trace, from code (`useVerdictStream.ts`, `LoadingState.tsx`, `api/agents/stream/route.ts`, `lib/agents/synthesis.ts:350-400`):

| t | Server event | What the user sees |
|---|---|---|
| 0 | `start` | Button text "Running analysis…", input disabled. LoadingState card: "Resolving address…", five grey dots, five "waiting", elapsed `0s · typically ~60s` |
| ~1 to 3s | `geocoded` | Normalized address appears in mono ("175 3 STREET, Brooklyn, NY, USA", uppercase DOF style, different from what they typed). All five dots turn mid-blue and pulse at 1.6s. All five say "analyzing…" |
| ~3 to ~60+s | nothing | Nothing changes except the seconds counter. Behind the scenes 23 provider fetches resolve (`record_counts.providers: 23` in the fixture) and five LLM calls start. None of this is emitted |
| variable | `agent_complete` x5 | A row flips: green dot, `HOLD · 80`, LIVE badge. No motion beyond the dot color swap |
| after last agent | `synthesis_start` | Synthesis row pulses "arbitrating…" |
| ~5 to 15s later | `complete` | LoadingState unmounts, the full result mounts at once |

Does it feel like watching five experts think? No. It feels like watching five progress spinners that each resolve to a two-word answer. There is no evidence on screen, no sense of what each expert is reading, no visible disagreement forming, and the one moment of drama (the deterministic score crossing a threshold) happens off-screen inside `aggregate()` and is shown afterwards as a static chart.

Two facts from the code make a far better experience possible without any fakery:

1. Every agent's `data_points` (label, value, provenance, source) exist at the moment its `agent_complete` fires, and every provider call resolves individually inside `runWithDegradationTracking` (AsyncLocalStorage already propagates through `Promise.all`).
2. `runSynthesis` computes `aggregate(agents)` (`synthesis.ts` line ~182) **before** the narrator LLM call. The verdict, confidence, score, nudge and thresholds are final several seconds before the headline prose exists. Today the UI waits for the prose.

### 5.1 Redesign: "The Bench"

A full-width stage that replaces `LoadingState` for the duration of the run, then condenses into the result. All motion maps to a real server event; nothing is simulated (consistent with the comment at `LoadingState.tsx:3-6`).

**New stream events** (server, small): emitted from a registry wrapper at the same seam `installProviderCassette` already uses, scoped with AsyncLocalStorage like `lib/providers/degradation.ts`.

```ts
| { type: 'provider_start'; provider: string; agent: AgentName }
| { type: 'provider_result'; provider: string; agent: AgentName;
    label: string; display: string | null; provenance: Provenance;
    source: string; ms: number }
| { type: 'agent_reasoning'; agent: AgentName; facts: number }      // LLM call begins
| { type: 'agent_complete'; ...existing, data_points: DataPoint[];
    direction: -1|0|1; contribution: number }
| { type: 'decision'; verdict; confidence; risk_score; signal_window_months;
    weighting_breakdown }                                             // after aggregate(), before narrator
| { type: 'complete'; ...existing }
```

**Layout** (≥1200px content width): address strip on top (normalized address + BBL + location confidence), five agent columns below it, a horizontal "vote rail" under the columns (the existing `DivergingBar` rendered live), and the `ScoreBands` strip under the rail. Below 900px: columns become a single list; the rail and bands stay full width.

**Timing spec (ms)**. Easing token `--ease-out: cubic-bezier(0.16, 1, 0.3, 1)` (already the house easing).

| Trigger | Motion | Duration |
|---|---|---|
| Submit | Input row compresses to a 44px address strip; Bench mounts fade-up y 8 to 0 | 180 strip, 300 Bench, columns stagger 40 |
| `geocoded` | BBL and "location confirmed / unconfirmed" chip fade in; lot outline draws on the mini map with stroke-dashoffset | 200 fade, 600 draw |
| `provider_start` | Ghost row in the consuming agent's column: source name in `--ink-muted`, a 2px hairline under it at 40% opacity (static, no fake progress) | 120 fade |
| `provider_result` | Ghost row resolves to a fact: `Flood zone  X (minimal)  ● LIVE  1.4s`. Opacity 0 to 1, y 6 to 0. Non-live facts land identically (same prominence) with their state badge; `coverage_absent` lands as a struck hairline plus "not covered: [feed]" | 220; if more than 3 events arrive within 150ms, stagger 50 each. Hard rule: display latency budget 400ms, a real event is never delayed more than 400ms for choreography |
| `agent_reasoning` | Column header changes to "weighing 6 facts"; header dot uses existing `koano-pulse` (opacity only) | pulse 1,600 loop |
| `agent_complete` | Column seals: band word (`HOLD 80`) slides in from y 4; on the vote rail that agent's bar grows from the zero axis to its contribution, or a neutral node appears with "no directional signal" | 240 word, 400 bar |
| all 5 complete | Rail settles; the ScoreBands needle sweeps from 0 to `aggregate_score` | 500 |
| `decision` | If a structural nudge exists, a second needle segment extends by the nudge, with the driver sentence fading under it; then the band the needle lands in fills, and the verdict word appears in the band's ink color at 56px | 400 nudge, 160 band fill, verdict 0ms delay after needle settles |
| narrator pending | Under the verdict: "Narrator writing. The decision above is computed and will not change." | 200 fade |
| `complete` | Headline fades in; Bench condenses (FLIP) into the Agent conclusions row of the result; result sections fade-up with 60ms stagger; scroll to verdict only if the user has not scrolled since submit | 300 headline, 360 FLIP, 300 sections |
| Stall | If a `provider_start` has no `provider_result` after 20,000ms, its ghost row reads "waiting on NYC DOB, 34s" | 200 |
| `prefers-reduced-motion` | All transforms 0ms, opacity 120ms, no pulse, no needle sweep (needle jumps) | |

**Header counters** replace "typically ~60s": `0:47 · 17 of 23 sources · 3 of 5 agents`. All three numbers are counts of real events.

**Screen reader**: one `aria-live="polite"` region announcing agent completions ("Market Timing finished: hold, confidence 80, all inputs live") and one `aria-live="assertive"` announcement for the decision. Provider events are not announced (noise).

**Three-site variant (C4)**: one Bench per site stacked as rows, each row a compact 5-cell strip, and the ranking table builds incrementally as each site's `decision` lands (ranks reflow with a 240ms FLIP), instead of today's "Complete. Waiting for the other sites" in failing-contrast green.

Files: `lib/agents/synthesis.ts` (emit `decision` after `aggregate`, include `data_points` in `agent_complete`), `lib/providers/registry.ts` or a new `lib/providers/progress.ts` (AsyncLocalStorage emitter, sibling of `degradation.ts`), `src/app/api/agents/stream/route.ts` (pass through), `src/components/dashboard/useVerdictStream.ts` (reducer instead of seven `useState`s; add `AbortController`), new `src/components/ui/Bench.tsx` replacing `LoadingState.tsx`, reuse `charts/DivergingBar.tsx` and `charts/ScoreBands.tsx` in live mode. The decision surface and the fixture are unaffected: these are additional progress events around unchanged computation.

---

## 6. Charts and maps against best-in-class data products

Benchmarks I hold this to: a terminal-grade table (dense, aligned, keyboard-first), a notebook-grade chart (every mark inspectable, linked), a modern map product (selection, layers, linked panels). Claims below are about KOANO's code only; I make no feature claims about other products.

### 6.1 Charts (`src/components/ui/charts/*`)

- Implementation: HTML spans absolutely positioned by percentage, with `@visx/scale` for scales only. `@visx/shape` is a dependency and unused. No SVG at all (`grep "<svg|<rect|<circle"` in charts: 0). PARTIAL.
- Provenance-aware: yes, and this is genuinely good. Representative bars render hatched (`DivergingBar.tsx:10,25`), non-trusted scatter points render hollow (`Scatter.tsx:124`), the map dashes and hollows uncertain markers. EXISTS. This is ahead of most products I know.
- Legibility: axis labels at 9px `--ink-faint` (2.44:1) in `Scatter.tsx:39`, `BarChart.tsx:35`, `ScoreBands.tsx:121,159`. Three y ticks only. The scatter is 180px tall. On a 4K display (`transaction.png`) these labels are unreadable.
- Interaction: native `title` tooltips only. No crosshair, no hover state, no click, no linked highlight between scatter point, comp table row and map pin, even though all three show the same 10 comps in C2. No zoom, no brush, no export. MISSING.
- Annotation: `refLine` "indicative $X/sf" is the only annotation. Good restraint, but sale dates, distance and HPI-adjusted value (all in the data, see `cma-p1.png`) are not encoded.

### 6.2 Map (`KoanoMap.tsx`)

- Strong intent: monochrome base, one marker shape per meaning, provenance on the canvas, live "in view" counts in the legend, `cooperativeGestures: true` (correct for an in-page map). EXISTS.
- Weaknesses: stock `mapbox://styles/mapbox/light-v11` with default labels (East Orange, Newark, LGA in `development.png`), so it reads as "a Mapbox map" rather than a KOANO instrument. Hover-only popups, no selection, no keyboard, no linked panels. In C4 the two sites (Manhattan and Brooklyn) are framed at metro zoom so each subject lot is a 12px icon and the lot outlines and OZ shading the legend promises are invisible (`development.png`). C5 shows one holding as a tiny dashed amber ring in a 1,200px map (`portfolio.png`): a map of one point is decoration. The comp gradient legend (`$560/sf $1,231 indic. $2,280/sf`) runs labels together at 9px (`transaction.png`).
- Specific fixes: a custom KOANO style (same palette tokens, road hierarchy reduced, POI and transit labels off, borough and neighborhood labels only), per-site inset frames for multi-site (small multiples at lot zoom, one per site, plus a locator), click-to-select with a pinned card, and hide the map entirely for portfolios under 3 holdings.

---

## 7. Generic, template, or "AI startup default" inventory

1. Clerk default sign-in card: "Sign in to KOANO / Welcome back! Please sign in to continue / Secured by Clerk" (`mobile_dashboard.png`). The first authenticated surface is a vendor widget.
2. Sidebar wordmark: plain text "KOANO" in `--near-black`, 15px, letter-spaced (`Sidebar.tsx:46-59`), while the marketing site uses the blue building mark. Not the logo, so arguably not a locked-decision violation, but the app has no brand presence; use the original blue mark.
3. Native `<select>` cluster switcher with "C1 · Development intelligenc" truncated (`development.png`, `transaction.png`).
4. The KPI tile grid in C2 Market velocity: five tiles plus an orphan sixth on its own row, "12.8 sales/mo" wrapping onto two lines (`transaction.png`). A default card grid.
5. Pill button with a soft blue glow shadow on every CTA ("Run analysis", "Track property", "Generate briefing"), including when disabled (`portfolio.png` "Track property" at 55% opacity).
6. Uppercase letter-spaced mono microlabels over everything (`MARKET VELOCITY`, `PROPERTY MAP`, `CONFIDENCE`, `SIGNAL WINDOW`): the 2024 AI-dashboard default. Fine as an eyebrow, wrong as the only panel title.
7. Pulsing dot loading state (`LoadingState.tsx:34-53`).
8. Glassmorphic hero card over the render (`HeroDashboard.tsx:74-75`, `backdropFilter: blur(20px) saturate(1.3)`, `rgba(255,255,255,0.08)`). CLAUDE.md §10 says the hero dashboard is "a solid white card (NOT glass)". In the capture the agent chips (BUY, HOLD) sit on a red-green blur of the building and are illegible, and the lower half of the card is empty for most of the loop (`hero_t*.png`).
9. The hero driver string renders an em dash: "97% unused FAR [em dash] large as-of-right development upside → buy" (`exampleVerdict.ts:27`), visible on the homepage hero and verdict section, after the engine's own em-dash pass.
10. Verdict card layout: big colored word, address, paragraph, three metrics with thin progress bars. This is the generic "score card." The progress bars under Confidence and Risk (`VerdictCard.tsx:135,146`) imply a 0 to 100 scale with meaning at 100 that does not exist.
11. "View full reasoning chain (N steps)" collapsed by default (`ReasoningChain.tsx:44`). The product's thesis behind a disclosure button.
12. Documents: react-pdf default hyphenation splitting labels ("PROPERTIES AS-SESSED", "1800 PARK AV-ENUE", "47-07 VER-NON BOULE-VARD" in `portfolio-risk-report-p1.png`), source text colliding with the provenance column ("ComCatlive"), ASCII `<=2mi` instead of a proper symbol, green text on a green callout, numbers left-aligned in tables (`cma-p1.png`).

---

## 8. The signature interaction: Trace

**Every number in KOANO can be pulled like a thread back to the public record, and the thread shows exactly where it is live, where it is a stand-in, and where it is cut.**

Mechanics:
- Any figure in the product (verdict word, confidence, risk, a contribution on the vote rail, a ledger value, a map pin, a chart point, a number in a generated PDF via a QR or deep link) is a Trace target. Hover (pointer), focus plus `Enter` (keyboard), or long-press (touch) activates it. `T` toggles Trace mode for the whole page.
- Activating draws a 1.5px line (SVG overlay, `--deep-navy` at 60%) from the figure down through every intermediate it depends on: verdict to score needle to the agents that moved it to the data points each agent cited to the source row in the ledger. Everything not on the thread dims to 35% opacity. Intermediates get a small label of the operation ("× conf 82 ÷ Σ 391", "nudge +1.00 from: 97% unused FAR").
- The line's style encodes provenance per segment: solid for live, dotted for partner (with the partner name on the line), hatched for representative (with "becomes live with CoStar"), dashed and red-ink for fetch_failed ("retry"), and **cut** with an end cap for coverage_absent ("not covered here: [feed] fills this"). A verdict whose thread is cut shows the cut at the top level, not three clicks deep.
- Reverse direction: activate a source (e.g. "NYC DOB permits") and every figure on the page that depends on it lights up. This is the honest answer to "what changes if this feed is wrong?"
- Motion: line draws top to bottom with stroke-dashoffset in 320ms on `--ease-out`; dimming 160ms; releasing reverses in 200ms. Reduced motion: line appears instantly.
- Data: everything needed already exists in the result: `weighting_breakdown.agents[].contribution`, `structural_drivers`, `agent_summaries`, `reasoning_chain[].sources`, `data_points[].{agent,label,source,provenance}` (`ProvenanceLedger` and `CoverageMap` already consume them). Trace is a client-side dependency graph built from the `complete` payload, plus the `decision` event above.

Why it is the identity: it is the visual form of the company's only non-negotiable. It cannot be copied cosmetically by a competitor that does not actually carry per-figure provenance, it makes gaps more visible rather than less, and it works identically in the dashboard, the marketing hero (replace the glass loop with a static recorded verdict the visitor can Trace themselves), and the PDFs (each appendix row gets an anchor ID; the web viewer opens with that thread drawn).

Files: new `src/components/ui/trace/{TraceProvider.tsx,TraceOverlay.tsx,graph.ts}`; `VerdictCard.tsx`, `VerdictMathPanel.tsx`, `charts/DivergingBar.tsx`, `charts/ScoreBands.tsx`, `ProvenanceLedger.tsx`, `ReasoningChain.tsx`, `KoanoMap.tsx` register targets via a `useTraceTarget(id)` hook that returns props (`data-trace-id`, `tabIndex=0`, `aria-describedby`).

---

## 9. Concrete specs

### 9.1 Spacing scale (4px base)

```css
--space-0: 0;    --space-1: 4px;  --space-2: 8px;   --space-3: 12px;
--space-4: 16px; --space-5: 24px; --space-6: 32px;  --space-7: 48px;
--space-8: 64px; --space-9: 96px;
```

Mapping of current values: 2, 3 to 4; 5, 6, 7, 9, 10 to 8; 14 to 12 or 16; 18, 20, 22 to 24; 28 to 24 (inside cards) or 32 (page). Card padding: 24px. Card to card gap: 16px. Section to section: 48px. Page gutter: 32px desktop, 16px mobile. Add `--content-max: 1200px` and use it for every cluster (replacing 980/1080/1160), centered in the area right of the sidebar from 1600px up.

### 9.2 Type hierarchy inside the dashboard (Neue Montreal and DM Mono, unchanged)

| Role | Font | Size/line | Weight | Color | Notes |
|---|---|---|---|---|---|
| Page title (h1) | Neue Montreal | 32/38 | 700 | ink-primary | -0.02em, exists |
| Verdict word | Neue Montreal | 56/56 | 700 | verdict ink token | up from 40px; the page's anchor |
| Section title (h2) | Neue Montreal | 20/28 | 700 | ink-primary | |
| Panel title (h3) | Neue Montreal | 15/20 | 500 | ink-primary | sentence case; replaces 10px mono as the title |
| Eyebrow | DM Mono | 11/16 | 500 | ink-muted (new) | 0.08em uppercase; optional above h3 |
| Body | Neue Montreal | 14/22 | 400 | ink-secondary | |
| Caption | Neue Montreal | 12/18 | 400 | ink-muted | minimum for any explanatory text |
| Data L | DM Mono | 28/32 | 500 | ink-primary | KPI values; never wrap (`white-space: nowrap`, unit at 60% size) |
| Data M | DM Mono | 20/26 | 500 | ink-primary | |
| Data table | DM Mono | 13/20 | 400 | ink-primary | right-aligned numerics |
| Axis / legend | DM Mono | 11/14 | 400 | ink-muted | ban 9px and 10px repo-wide |

Implement as classes in `globals.css` (`.t-h3`, `.t-data-l`, etc.) or Tailwind `fontSize` entries, and add an ESLint rule (`no-restricted-syntax` on `fontSize: "9px"|"10px"` and on `color: "var(--ink-faint)"` in text contexts).

### 9.3 Motion tokens

```css
--dur-1: 120ms;  /* opacity micro, reduced-motion floor */
--dur-2: 200ms;  /* hover, focus ring, badge */
--dur-3: 300ms;  /* content entrance (house rule 0.3s UI) */
--dur-4: 500ms;  /* content entrance (house rule 0.5s), needle sweep */
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);
--stagger: 40ms; /* dashboard; marketing keeps 80ms */
```

Wrap every animation in `@media (prefers-reduced-motion: no-preference)`; add a global reduced block that zeroes transforms. Focus ring: `:focus-visible { outline: 2px solid var(--deep-navy); outline-offset: 2px; border-radius: inherit; }`, transition `--dur-2`.

### 9.4 Component redesigns

1. **Primitives layer** (`src/components/ui/primitives/`): `Card`, `Panel` (header slot with `h3` plus provenance), `Callout` (variants: error, warning, info, degraded; replaces the 14 copy-pasted left-border blocks), `Stat`, `Badge`, `Input` (with focus ring, 3:1 boundary), `Table` (sticky header, right-aligned numerics, row hover, keyboard row focus). All styled with classes; inline `style` reserved for computed geometry (chart positions). Migrate cluster by cluster; delete the attribute-selector block in `globals.css:326-603` as each component gains real responsive classes.
2. **`ProvenanceBadge.tsx`**: text and dot in `-ink` tokens; distinct glyph per state so it never depends on color alone (live ●, partner ◆, representative ▨, fetch_failed ↻, coverage_absent ⊘); 11px minimum; `aria-label` with the full note. `representative` and `fetch_failed` currently share identical amber styling (`verdict.ts:50-61`); differentiate them by glyph and by fetch_failed carrying a retry affordance.
3. **`VerdictCard.tsx`**: verdict word 56px in an `h2`; headline beside it, not under it, at ≥1100px; replace the meters with the inline ScoreBands strip (the score in context is the honest visualization; a 0 to 100 bar is not); confidence and risk as Data M with their derivation one Trace away. Fix the non-live note (`VerdictCard.tsx:172-175`), which says "Some inputs to this verdict are representative stand-ins" for every non-live state including `coverage_absent` and `fetch_failed`. Use `PROVENANCE_META[state].note`.
4. **Cluster page order** (all four `Cluster*Dashboard.tsx`): header, input, Bench while running, then Verdict plus Math (one combined block), then evidence panels, then reasoning chain (expanded first group by default), then coverage and ledger, then documents, then history. On C2 this moves the verdict from eighth position to second.
5. **Panels**: three-state contract `{ status: 'loading' | 'ready' | 'error' }`; loading renders a skeleton with the panel's real title and real row count where known (e.g. 6 tiles), never "Unavailable". Render C1 evidence panels as soon as `detail` lands, independent of the verdict stream.
6. **Sidebar** (`Sidebar.tsx`, `DashboardShell.tsx`): below 1024px collapse to a 56px icon rail; below 768px become a top bar with a sheet menu (glass is allowed here per CLAUDE.md §10: chrome over content). Replace the native select with a segmented list showing only the user's tier clusters plus "Switch view" in a menu; show one identifier (the display badge or the name, not both plus a section number). `aria-current="page"` and IntersectionObserver scroll-spy. Disable nav items whose sections are not mounted, with a tooltip "Available after the run."
7. **`KoanoMap.tsx`**: focusable markers (`button` elements with `aria-label` from `title`), click-to-pin card, a custom style, small-multiples mode for C4, `role="region" aria-label`, plus a visually hidden list of markers for screen readers.
8. **Charts**: move marks to SVG (keep visx scales; use `@visx/shape` or plain SVG) so they can carry `<title>`, focus, and Trace lines; add a shared hover/selection store so scatter, comp table and map pins highlight together in C2; 11px axis labels; 5 ticks; `role="img"` plus a "View as table" toggle.
9. **`HeroDashboard.tsx`**: solid white card per CLAUDE.md §10; pause on hover and focus, a visible pause button, honor reduced motion; label the loop "Recorded run, replayed at about 30x" so the 2 second animation does not set a 2 second expectation; replace the em dash in the recorded driver at the display layer.
10. **Documents** (`lib/documents/render/pdf.tsx`): register a no-op hyphenation callback (`Font.registerHyphenationCallback(w => [w])`), fixed column widths with right-aligned numerics, ≤ symbol, callouts in ink not signal green. And the locked-decision breach below.

---

## 10. Top 10 problems (ranked by impact on enterprise value)

| # | Problem | State | Evidence | Effort | Impact |
|---|---|---|---|---|---|
| 1 | The verdict run is a 60 to 180s black box: five pulsing dots, no evidence, no disagreement, no decision moment; the core "watch it reason" promise is not delivered | PARTIAL | `LoadingState.tsx`, `useVerdictStream.ts`, `synthesis.ts:350-400` | M | 10 |
| 2 | White-labeled CMA carries KOANO branding (locked decision violated): `LetterheadBlock` always renders the "KOANO" mark, DOCX always prepends "KOANO", PDF metadata `author="KOANO"` | PARTIAL | `pdf.tsx:251-262,533,551`, `docx.ts:66`, `cma-p1.png` | S | 9 |
| 3 | Dashboard unusable below ~1000px; 70px content column at 390px | MISSING | `Sidebar.tsx:29-43`, `DashboardShell.tsx:57-63` | M | 8 |
| 4 | Provenance badges and verdict words fail WCAG AA in every state (1.99 to 2.77:1); 119 text uses of a 2.44:1 color; no focus styles; inputs remove outline | PARTIAL | §2.1, `ProvenanceBadge.tsx`, `verdict.ts:37-68`, `AddressInput.tsx:46` | S | 8 |
| 5 | Panels show "Unavailable" while loading; fast live facts hidden until the slow verdict finishes | PARTIAL | `MarketVelocityPanel.tsx:68`, `CmaBuilder.tsx:23`, `Cluster1Dashboard.tsx:198` | S | 8 |
| 6 | Verdict buried below 7 panels on C2; progress UI off-screen | PARTIAL | `Cluster2Dashboard.tsx:175-330` | S | 7 |
| 7 | No URL-addressable verdicts, no cancellation, view lost on cluster switch | MISSING | `src/app/dashboard/` contents, no `AbortController` | M | 7 |
| 8 | Inline-style architecture with attribute-selector mobile overrides; no spacing or type scale; radius tokens conflict | PARTIAL | 1,107 `style={{`, `globals.css:326-603`, `tailwind.config.ts` vs `globals.css:39` | L | 6 |
| 9 | Charts and maps are not interactive or linked; 9px labels; hover-only; maps framed so lots are invisible | PARTIAL | `Scatter.tsx`, `KoanoMap.tsx:390-402`, `development.png`, `portfolio.png` | M | 6 |
| 10 | Marketing hero contradicts the spec (glass, illegible chips, em dash, 2s fake timeline vs 60 to 180s reality, no pause) | PARTIAL | `HeroDashboard.tsx:41-75`, `exampleVerdict.ts:27`, `hero_t*.png` | S | 5 |

---

## 11. Top 10 opportunities (ranked)

| # | Opportunity | State | Effort | Impact |
|---|---|---|---|---|
| 1 | The Bench: stream provider results, agent votes and the deterministic `decision` live, with the timing spec in §5.1 | MISSING | M | 10 |
| 2 | Trace as the signature interaction across dashboard, marketing and PDFs (§8) | MISSING | L | 9 |
| 3 | Shareable verdict permalink `/v/[id]`: read-only, Trace-enabled, provenance-complete page that a developer sends to a partner or IC; the verdicts table is already append-only and immutable, so the link is an audit artifact | MISSING | M | 9 |
| 4 | Emit `decision` before the narrator: verdict visible 5 to 15s earlier and visibly "computed, then narrated," which dramatizes the deterministic-math thesis | MISSING | S | 8 |
| 5 | Token and primitives layer (spacing, type, motion, AA color tokens, Panel/Callout/Table/Badge) with lint rules; unlocks responsive, dark theme later, and halves future UI effort | PARTIAL | L | 7 |
| 6 | Promote `VerdictMathPanel` to the hero of every cluster, merged with the VerdictCard | EXISTS (buried) | S | 7 |
| 7 | Linked selection across comp table, scatter and map in C2 (one hover store) | MISSING | M | 6 |
| 8 | Keyboard-first operation: `/` focuses address, `⌘K` command palette for "run", "compare", "open history", `T` for Trace, `J/K` through ledger rows | MISSING | M | 6 |
| 9 | Branded map style and small-multiples site frames for C4 (lot-zoom per site with zoning envelope drawn) | PARTIAL | M | 6 |
| 10 | Document typography pass: hyphenation off, numeric alignment, proper symbols, ink-colored callouts | PARTIAL | S | 5 |

---

## 12. What I would rebuild first

Week 1, in this order, because each is small and each removes a credibility leak a sophisticated buyer will notice in the first five minutes:

1. Remove KOANO branding from the CMA when white-label applies (`pdf.tsx` `LetterheadBlock`, `docx.ts` `letterheadParagraphs`, document `author`). S.
2. AA color tokens plus `:focus-visible` ring plus the badge redesign. S.
3. Panel three-state contract; render C1/C2 evidence panels as soon as `detail` lands; reorder C2 so the verdict sits under the input. S.
4. Emit `decision` before the narrator and show it. S.

Weeks 2 to 4: the Bench (server events plus `Bench.tsx` plus `useVerdictStream` reducer with abort), the responsive shell (icon rail, top bar), and the `/v/[id]` permalink. Then Trace, built on the permalink page first because it is read-only and static, then ported into the live dashboard.

---

## 13. "I have never seen anything like this"

Watching a verdict assemble itself from 23 named public sources in real time, each fact landing with its provenance, five specialists voting on a shared rail, the deterministic needle crossing a threshold before any prose exists, and then being able to grab that verdict word and pull a single line back through the arithmetic to the exact NYC DOB record, with the line visibly cut where KOANO does not have coverage. No product I know shows its own blind spots as part of its signature gesture. That is what Trace on top of the Bench would be.

---

## 14. VISION (kept separate from grounded findings)

- **Replay**: every immutable verdict can be replayed at 1x or 10x from the stored event log, so an IC member can watch how the decision formed. Requires persisting the progress events with the verdict row (new column or table). VISION only because nothing stores the event stream today.
- **Diff Trace**: on a monitoring change (`lib/monitor`), open the property with the thread for the changed figure pre-drawn, before/after values on the line, so "what moved" is a gesture, not a report.
- **Terminal theme** for C5 desks, built purely from the token layer.
- **Calibration overlay** on the ScoreBands strip: historical outcome rates per band from `verdict_outcomes`, shown only when sample sizes clear a stated threshold, otherwise visibly "insufficient history." Requires the calibration record to mature.
- **Partner threads**: when a `partner` provider ships, Trace segments carry the partner's name and their own trust note, which is the visual pitch to a data-provider acquirer: "your data, visibly load-bearing in every decision."

---

## Sources

- https://www.koano.co/ (captured 2026-10-19, desktop 1440px and mobile 390px, with and without scroll-through; hero loop sampled at 0, 2, 4, 7, 10 seconds)
- https://www.koano.co/intelligence (captured 2026-10-19, desktop and mobile)
- https://www.koano.co/dashboard (captured 2026-10-19, redirects to Clerk sign-in)
- No third-party URLs were used. No competitor feature claims are made in this report.

## Discrepancies vs the brief (section 3 of the prompt) and CLAUDE.md

1. Brief: "visx plus custom SVG for charts." Code: charts are HTML spans positioned by percentage; visx is used only for `scaleLinear`; `@visx/shape` is installed and unused; zero SVG elements in `src/components/ui/charts/`.
2. Brief locked decision: "The white-labeled CMA carries no KOANO branding." Code: `pdf.tsx:262` always renders the KOANO mark in the letterhead, `docx.ts:66` always prepends a KOANO run, PDF `author="KOANO"`; visible in `cma-p1.png`.
3. CLAUDE.md §03 says the CMA was built in Phase 3, and `lib/documents/implemented.ts:25` lists `cma`, but `Cluster2Dashboard.tsx` renders a disabled tile "Comparative Market Analysis: Not yet available. The CMA needs listing photos and geocoded comps." The CMA document cannot be generated from the Transaction dashboard UI as far as I can find in `src/components/dashboard` (no `docType="cma"`).
4. CLAUDE.md §10: homepage hero dashboard "on a solid white card (NOT glass)" and hero "stays dark". Code: `HeroDashboard.tsx:74-75` uses `rgba(255,255,255,0.08)` with `backdropFilter: blur(20px)`, over a light render (`desktop_.png`).
5. CLAUDE.md §11 lists `/dashboard/site/[id]`, `/dashboard/property/[id]`, `/dashboard/portfolio`, `/dashboard/reasoning/[id]`. None exist; `src/app/dashboard/` contains only `page.tsx`, `layout.tsx`, `settings/`.
6. Verdict run duration: route comment and LoadingState say ~60s; dashboard copy says 90s, two minutes, and 1 to 3 minutes; marketing hero animates it in under 3 seconds.
7. CLAUDE.md §10 radius guidance (20px cards) vs `globals.css` `--radius-card: 16px`; both are used side by side.
8. CLAUDE.md §08 says Cluster 5's default hero is a full-screen neural map; §03 says it was retired from dashboards in Phase 4. Code matches §03 (Mapbox map). The §08 table is stale.
