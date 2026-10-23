# UI sprint, workstream 2 report: marketing site, mobile-first

Branch `ui-sprint`. Commits 9897409 (slice 1), 9a9c310 (slices 3 and 5), cba1552 (slice 2), 2c086d1 (slice 4), the self-review commit, and the review-fix commit. Gate (`scripts/ui/gate.sh`: isolated production build plus the offline verdict-fixture replay) green at every commit; the fixture was not touched (the marketing site does not feed the engine).

Baseline: `build-log/ui-ws-1/after/` (the WS1 end state). After: `build-log/ui-ws-2/after/` (eleven routes at 390, 768 and 1440, full page and first viewport, `audit.json`), `build-log/ui-ws-2/after/interactions/` (phone nav sheet with `nav-sheet.json`, signed-in nav at three widths, the replay pause control with `pause.json`, every address-box state at 390 and 1440, `console.json`). Diff: `build-log/ui-ws-2-diff.patch` (pre-review) plus the review-fix commit.

## What changed

- **Render art direction (A1, A2 code side).** `HeroRender` renders a `<picture>` with a 767px `<source>` for the 4:5 mobile render when `renders.ts` says one exists, the desktop WebP otherwise, explicit intrinsic width and height (no layout shift; CLS measured 0.000 by the reviewer), `fetchpriority=high` on the first hero and lazy loading on the CTA renders. The `globals.css` block that hid every render below 900px is gone. Until the founder supplies the mobile set, every render-backed hero up to 1023px becomes an in-flow column: the copy, then the render below it at full width. The about hero's two columns stack on tablets.
- **Hero card (A4).** `HeroDashboard` is a solid white card on `--border` with the raised shadow, ink type, ink-on-tint verdict chips, a "Recorded example" eyebrow, the recorded label line, a user-operable pause control (WCAG 2.2.2), and a reduced-motion branch that renders the finished frame. The copy column sits on a navy scrim (white on the blended wash measures 6.3:1; the eyebrow at 0.85 white 5.1:1; the stat labels 5.1:1), with a white focus ring inside the hero.
- **Homepage address box.** `HeroAddressBox` posts to the new `/api/public/resolve` route (unauthenticated, resolve-only, 20 checks a minute per connection, returns normalized address, BBL, borough, coordinates and whether the lot is the recorded example; nothing verdict-like). States: a designed loading row, resolved NYC lot with BBL and "Create an account", a closest-match card when the house number differs from the input, non-NYC with the honest coverage note, the recorded example pointing at the recorded run below, ambiguity candidates, a plain no-match line. All targets 44px; `aria-live` result region; the input keeps a visible focus ring inside the pill.
- **Sections render without animation (A18).** `Reveal.tsx` exports `useReveal(ref)`, true on the server and the first client render, armed only when an IntersectionObserver exists, reduced motion is off and the element is below the fold. All eleven marketing sections use it with `initial={false}`; the homepage hero entrance is a CSS keyframe. Server HTML carries no `opacity:0` on any route except the replay card's own loop on the homepage (six nodes, by design).
- **Auth-aware nav.** Signed-in visitors see Dashboard and the account button on desktop and in the phone sheet; the slot is held at width until Clerk loads so nothing jumps. The sheet is a dialog with focus moved in, Tab cycled through links, buttons and the close control, Escape to close and focus returned to the toggle. The links collapse into the sheet below 1024px (at 768 they wrapped and pushed Sign up off the bar). Desktop links, the hamburger and footer links are 44px targets.
- **Widths and tokens.** `--content-marketing` 1200, `--content-reading` 900 and `--content-prose` 720 replace the 1280/1080/1000/960/900/800/720 widths; the new components read the WS1 spacing and type tokens.

## Items closed, with evidence

| Item | Status | Evidence |
|---|---|---|
| A1 renders hidden on phones | Closed | `after/for-developers-390-fold.jpg` (copy, then the crane render in flow), `after/for-community-390.jpg`, `after/about-390-fold.jpg`; the reviewer confirmed every render is `display:block` and in flow at 390 |
| A2 desktop compositions in a narrow column | Code side closed; final close in WS6 | `after/for-developers-768-fold.jpg` and `after/for-community-768.jpg` show the stacked layout; the 4:5 mobile set is a founder task (`blockers.md`) |
| A4 glass hero card | Closed | `after/home-1440-fold.jpg`, `after/home-390-fold.jpg`, `after/interactions/hero-paused-1440.jpg` |
| A18 blank sections in captures | Closed | `after/*-390.jpg` and `-1440.jpg` full pages with every section present; `curl` of each route shows no hidden inline styles |

## Self-review against the bar

- No horizontal overflow on any route at any width (`audit.json`, all 33 captures `scrollWidth == clientWidth`); no clipping or overlap found in the full-page captures after the tablet fixes.
- Console: Clerk's development-keys notice only, on every page and interaction.
- Touch targets: nav links, sheet links, CTAs, footer links, the address box controls and the three section-closing links are 44px or taller at 390.
- Focus: the global ring everywhere; white inside the hero; the sheet trap verified by script.
- Contrast: hero copy, eyebrow, stat labels and the ghost button border measured against the blended wash (6.3, 5.1, 5.1, 3.4:1).
- Loading states: the address box shows a designed "Checking the public record" row, never "Unavailable".
- Copy: no em dashes in user-facing WS2 copy; the ledger placeholder "n/a" replaced the last pre-existing dash.

## Independent review and resolutions

The reviewer (a fresh subagent given the sprint file, the plan, the diff and both screenshot sets, with its own Playwright checks) reported no blockers, four material findings and eight minor ones.

| # | Finding | Resolution |
|---|---|---|
| 1 | Cluster heroes effectively blank at 768 (desktop crop shows the empty center) | Fixed: the stacked layout now applies up to 1023px; `after/for-developers-768-fold.jpg`, `after/for-community-768.jpg` |
| 2 | New components carried one-off spacing and type values | Fixed: `HeroAddressBox`, `Nav`, `HeroDashboard` read `--space-*` and `--text-*`; the 44/48px touch-target sizes are sizes, not spacing, and stay |
| 3 | No pause control on the replay (WCAG 2.2.2) | Fixed: a 44px pause/play toggle in the card header; `pause.json` records `aria-pressed=true` after the click |
| 4 | Four reading widths (800/900/960/1000) remained | Fixed: one `--content-reading` token (900px) |
| 5 | `outline: none` on the address input | Fixed: the input keeps its own `:focus-visible` ring inside the pill |
| 6 | Three section-closing links under 44px | Fixed: 44px inline-flex targets |
| 7 | Dead band in the Group-A heroes at 768 | Fixed by the same stacking rule; `after/intelligence-768-fold.jpg`, `after/pricing-768-fold.jpg` |
| 8 | A fuzzy geocoder match read "Found in the city record" | Fixed: a differing house number renders the closest-match copy; `after/interactions/address-fuzzy-390.jpg` |
| 9 | Hero eyebrow changed from `--brand-blue` to white | Not changed, on purpose: `--brand-blue` on the navy wash measures 3.4:1, below AA for 11px text. The exception is recorded in CLAUDE.md §10 |
| 10 | A pre-existing em dash placeholder in the ledger | Fixed ("n/a") |
| 11 | Signed-in nav flashed the signed-out pair | Fixed: the slot is hidden at width until Clerk loads |
| 12 | The public rate limiter trusts `x-forwarded-for` and is per instance | Noted, not changed: it is a best-effort guard against bulk use of a resolve-only endpoint, and Vercel sets the header. Not a hard cap |

## Not fully satisfied

- A2 closes only when the 4:5 mobile render set arrives (founder task). The temporary layout is honest but the tablet strips show the desktop compositions' wide framing.
- The homepage replay card's six nodes start hidden in the server HTML because the loop animates them in; a no-JS visitor sees the card header only.
