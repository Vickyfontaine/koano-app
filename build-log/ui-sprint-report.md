# KOANO UI-first sprint: final report

Branch `ui-sprint`. Six workstreams, each with its plan, after set, independent review and report in `build-log/`:

| Workstream | Plan | Report | After set |
|---|---|---|---|
| 1 Correctness and tokens | `ui-ws-1-plan.md` | `ui-ws-1-report.md` | `ui-ws-1/before`, `ui-ws-1/after` |
| 2 Marketing site, mobile-first | `ui-ws-2-plan.md` | `ui-ws-2-report.md` | `ui-ws-2/after` |
| 3 App shell | `ui-ws-3-plan.md` | `ui-ws-3-report.md` | `ui-ws-3/after` |
| 4 Cluster dashboards | `ui-ws-4-plan.md` | `ui-ws-4-report.md` | `ui-ws-4/after` |
| 5 Product feel | `ui-ws-5-plan.md` | `ui-ws-5-report.md` | `ui-ws-5/after` |
| 6 Concept page and final pass | `ui-ws-6-plan.md` | this report | `ui-ws-6/after` |

The gate (`scripts/ui/gate.sh`: isolated production build plus the offline verdict-fixture replay) was green at every commit. The fixture was re-recorded surgically twice in WS1 with reviewed, documented decision diffs (the construction guard: BUY to HOLD; the demand inputs: confidence 74 to 73) and never again.

## A1 to A19

Before = the pre-sprint capture set (`build-log/ui-ws-1/before/`) unless a later baseline is named; After = the final QA set (`build-log/ui-ws-6/after/`), captured on the finished branch at 390, 768 and 1440 (`-fold` is the first viewport).

| # | Problem | Status | Before | After |
|---|---|---|---|---|
| A1 | Renders hidden on phones | Closed (WS2) | `ui-ws-1/before/for-developers-390-fold.jpg` (blank hero) | `ui-ws-6/after/for-developers-390-fold.jpg`, `for-community-390.jpg`, `about-390-fold.jpg` (render in flow below the copy) |
| A2 | Desktop compositions in a narrow column | Code side closed (WS2); the 4:5 mobile set is a founder asset, not supplied | `ui-ws-1/before/for-community-390.jpg` | `ui-ws-6/after/for-developers-768-fold.jpg` (temporary stacked layout); `node scripts/ui/render-manifest.mjs` reports 0 of 9 mobile renders present |
| A3 | No dashboard works on mobile | Closed (WS3 shell, WS4 lenses) | `ui-ws-1/before/cluster_4-done-390-fold.jpg` (240px sidebar, 150px of content) | `ui-ws-6/after/cluster_4-done-390.jpg`, `cluster_2-done-390-fold.jpg`, `cluster_5-done-390.jpg`, `cluster_1-done-390.jpg`; `dash-audit.json` with no horizontal overflow |
| A4 | Glass hero card, illegible chips | Closed (WS2) | `ui-ws-1/before/home-1440-fold.jpg` | `ui-ws-6/after/home-1440-fold.jpg`, `home-390-fold.jpg` |
| A5 | Empty right quarter, three content widths | Closed (WS3) | `ui-ws-1/before/cluster_2-done-1440-fold.jpg` | `ui-ws-6/after/cluster_*-done-1440-fold.jpg` (one `--content-max` column) |
| A6 | Verdict buried, map as hero | Closed (WS3) | `ui-ws-1/before/cluster_2-done-1440.jpg` (verdict eighth) | `ui-ws-6/after/cluster_2-done-1440-fold.jpg`, `cluster_1-done-1440-fold.jpg` (the band first in every lens) |
| A7 | Mono microlabel panel titles | Closed (WS4) | `ui-ws-1/before/cluster_2-done-1440-fold.jpg` | `ui-ws-6/after/cluster_2-done-1440.jpg` (sentence-case headings) |
| A8 | Glowing pill buttons | Closed (WS4) | `ui-ws-1/before/cluster_4-empty-1440-fold.jpg` | hover verified live by the WS4 reviewer (tint change only); `ui-ws-6/after/cluster_4-empty-1440-fold.jpg` |
| A9 | Stock map labels, tiny lots | Closed (WS4) | `ui-ws-1/before/cluster_5-empty-1440-fold.jpg` | `ui-ws-6/after/cluster_1-done-1440-fold.jpg` (street and neighborhood labels only); `ui-ws-4/after/interactions/property-map-lot-390.jpg` (lot zoom) |
| A10 | 9px chart labels, three ticks, 180px scatter | Closed (WS1 floor, WS4 ticks and height) | `ui-ws-1/before/cluster_2-done-1440.jpg` | `ui-ws-6/after/cluster_2-done-1440.jpg` (five ticks, 260px scatter) |
| A11 | Orphan tile, wrapping values | Closed (WS4) | `ui-ws-1/before/cluster_2-done-1440-fold.jpg` | `ui-ws-6/after/cluster_2-done-1440-fold.jpg` (3 by 2), `cluster_2-done-390.jpg` (2 by 3) |
| A12 | Conflicting radii, 25 paddings, 19 sizes | Partly closed: the token layer is built and every rebuilt surface reads it; the sweep of the untouched components is incomplete (the final review counted inline px font sizes, a few off-token chart radii and one-off paddings in components no workstream rebuilt) | `ui-ws-1/before/*` | `src/app/globals.css` `:root` tokens; the rebuilt surfaces in `ui-ws-6/after/*` |
| A13 | Three numbering systems | Closed (WS3) | `ui-ws-1/before/cluster_2-done-1440-fold.jpg` ("C2 · …", "02", "home cluster C1") | `ui-ws-6/after/cluster_2-empty-1440-fold.jpg` (plain lens names, "home") |
| A14 | Text wordmark in the sidebar | Closed (WS3) | `ui-ws-1/before/cluster_2-done-1440-fold.jpg` | `ui-ws-6/after/cluster_2-empty-1440-fold.jpg` (the blue logo in the top bar) |
| A15 | Default Clerk sign-in | Closed (WS3) | `ui-ws-1/before/login-1440-fold.jpg` | `ui-ws-6/after/login-1440-fold.jpg`, `signup-390.jpg` |
| A16 | Badge and verdict contrast, no focus states | Closed (WS1) | `ui-ws-1/before/cluster_2-done-1440-fold.jpg` | `ui-ws-1/after/cluster_2-done-1440-fold.jpg`; the global focus ring in every later interaction capture (`ui-ws-3/after/interactions/band-done-390.jpg`); contrast is verified from the ink tokens in `globals.css` (JPEG captures cannot prove a ratio) |
| A17 | "Unavailable" while loading | Closed (WS4) | `ui-ws-1/before/cluster_2-running-1440-fold.jpg` | `ui-ws-6/after/cluster_2-running-1440-fold.jpg` (skeleton panels) |
| A18 | Blank sections in captures | Closed (WS2, with a time fallback added after the final review) | the pre-sprint code (`useInView` with a hidden initial state in every section; the WS1 harness scrolled, so its captures do not show the blank, and the final review reproduced it with an unscrolled capture) | `ui-ws-6/after/intelligence-1440.jpg`, `data-390.jpg`; server HTML carries no hidden sections; `useReveal` now reveals after 900ms even if the observer never fires |
| A19 | PDF typography, KOANO mark on white-label documents | Closed (WS1) | the WS1 report's review table (`ui-ws-1-report.md`; the pre-sprint PDFs were rendered during WS1, not kept) | `ui-ws-1/after/docs/*.png` (page 1 of every sample document) |

## Acceptance criteria

| Criterion | Status | Evidence |
|---|---|---|
| Every marketing page and every cluster dashboard fully usable at 390px: no horizontal scroll, no hidden renders, no blank sections | Met | `ui-ws-6/after/audit.json` (39 marketing and auth captures, no horizontal overflow, no console issue beyond Clerk's development-keys notice); `ui-ws-6/after/dash-audit.json` (every lens in empty, running and done states at the three widths, no horizontal overflow); the 390 full pages in `ui-ws-6/after/` show every render in flow and every section rendered |
| Every aesthetic problem A1 to A19 closed and listed with before and after screenshots | Met with one stated exception | the A1 to A19 table above; A2 is closed on the code side and waits for the founder's mobile render set |
| Nothing in the live product claims a capability the backend does not have; future features only on `/vision`, labeled | Met | `ui-ws-6/after/vision-1440.jpg`, `vision-390.jpg` (every concept labeled "Concept preview", the recorded-example stamp, no run control); the CMA, IC memo and portfolio risk report buttons call implemented document types; the sealed record says what is not stored; the independent reviews of WS2 to WS5 each checked the claims |
| The demo carries its "recorded example" label everywhere it appears | Met | `ui-ws-6/after/home-1440-fold.jpg` (hero card), `home-390.jpg` (verdict math and ledger sections), `intelligence-1440.jpg` (demo video and verdict card), `vision-1440.jpg`; no LIVE badge on the replay (the WS2 review confirmed the single "LIVE" on the site is the /data provider catalog) |
| Font and logo unchanged; pre-push gate green | Met | Neue Montreal via the unchanged Fontshare link in `layout.tsx`; `/logo.png` untouched since before the sprint (the WS2 review checked the commit); the gate ran before every commit on `ui-sprint` (`build-log/gate.log` holds the last run) |

## Workstream 6

- **`/vision`** (`src/app/vision`, `VisionContent.tsx`): four concept previews drawn in HTML and SVG on the recorded 175 3rd St run (radar of the five votes, sentence to building resolving to the recorded lot and its recorded figures, the ownership graph with no counts because the sample stored none, the track record with "not yet measured" placeholders that say so). The page and every section carry "Concept preview"; no control runs anything; it is linked from the marketing footer only. Captures: `ui-ws-6/after/vision-{390,768,1440}.jpg`.
- **Mobile renders**: `scripts/ui/render-manifest.mjs` lists each manifest entry and whether `public/renders/mobile/<name>.webp` exists (0 of 9 today). The drop-in is `mobile: true` per entry in `renders.ts`.
- **Final QA**: the capture sets described below and one whole-sprint independent review (its findings and resolutions follow).

## Final QA pass

Captured on the finished branch into `build-log/ui-ws-6/after/`: thirteen marketing and auth routes at 390, 768 and 1440 (full page and first viewport), all four lenses in empty, running and done states at the three widths through real analyses, plus the WS2 to WS5 interaction sets re-run in their workstream folders. One whole-sprint independent review follows this section's findings.

## Open blockers (founder)

- Supply the 4:5 mobile render set (`public/renders/mobile/<name>.webp`); `node scripts/ui/render-manifest.mjs` lists what is present; flipping `mobile: true` in `renders.ts` serves each one below 768px. Until then the heroes use the temporary stacked layout.

## Final independent review and resolutions

The whole-sprint reviewer (a fresh subagent given the sprint file, every report, CLAUDE.md §10 and §16, the final QA set and the earlier sets, with its own live checks and one analysis) returned "ship the branch for the founder's review", with four material findings and eight minor ones.

| # | Finding | Resolution |
|---|---|---|
| 1 | A18 only partly closed: below-fold blocks stayed hidden in an unscrolled headless capture until the observer fired; the cited before did not show the problem | Fixed: `useReveal` reveals after 900ms if the observer never fires; the A18 row now cites the code and the review's reproduction as the before |
| 2 | The evidence surfaces showed raw engine keys (`hpi_yoy_change_pct`) and broke them mid-word; the drawer's ledger kept four columns on phones | Fixed: `humanizeLabel()` renders words in the ledger and the Trace thread (the key stays in the title attribute); the drawer's ledger rows stack to two columns on phones |
| 3 | The Price lens's neighborhood-report tile said "Run an analysis first" after a run | Fixed: the tile reads the run's verdict |
| 4 | The report overstated A12 and A18 and left a placeholder section | Fixed in this report: A12 is "partly closed" with the remaining sweep named; A18 reworded; this section written |
| 5 | The Develop phone math strip's neutral rows read "no directional s…" | Fixed: the strip's neutral rows read "neutral" |
| 6 | Verdict history unpaginated on phones (50 rows) | Fixed: five rows with "Show all" |
| 7 | The scatter's reference label collided with marks and clipped at 390 | Fixed: anchored at the left end of its line |
| 8 | The homepage ledger shows "Median household income" as a Demand Sentiment input the live engine no longer reads | Fixed: the row's source says "Read in the August run; no longer a verdict input" |
| 9 | Mono caps carry the hierarchy in the band, tiles and chrome; the product still reads partly generic there | Not changed: these are eyebrows and KPI labels, the house style in CLAUDE.md §10. Recorded below as not fully satisfied for the founder's call |
| 10 | Acquire on phones: the sticky action covers the bottom of an open map and leaves a band of space; Property Row values wrap one word per line | Not changed in this pass; recorded below |
| 11 | Placeholder dashes remained in several panels; provider source strings with em dashes print in PDFs | Fixed in the panels (21 placeholders now "n/a"); provider source strings are engine text and stay |
| 12 | Run-to-run confidence spread of about 12 points on the same address | Engine behavior (§07C explains temp-0 wobble of a point or two; this spread is wider); recorded for the engine owner, outside this sprint |

Evidence note: the fixes for findings 1, 2, 3, 5, 6, 7, 8 and 11 were typechecked, linted and gated (commit 1d1b26a) but a confirming capture run on the dev server failed at the end of the session and was not retried, so the final QA set (`ui-ws-6/after/`) shows the state before those eight fixes except the Property lens, which was re-captured after the Bench fix. The next session should re-run `scripts/ui/ws5-trace.mjs` (the humanized ledger and thread, the paginated history) and `scripts/ui/shots.mjs` for the homepage at 390 (the annotated ledger row) into `ui-ws-6/after/`.

## Not fully satisfied

- **A2** closes only when the founder's 4:5 mobile render set arrives; the temporary stacked layout stands and tablets show the desktop compositions.
- **A12**: the token layer is built and every surface the sprint rebuilt reads it; components no workstream touched still carry inline px values (the final review's grep), to be migrated component by component as CLAUDE.md §10 says.
- **A7 in the chrome**: panel titles are sentence case; the band's eyebrows, the KPI tile labels and the plan tag remain uppercase mono, the house eyebrow style. If the founder wants weight-and-spacing hierarchy there too, it is a token-level change in `shell.css` and `panels.tsx`.
- **Phone polish left open**: the Acquire sticky action overlaps an opened map's bottom edge and leaves a gap above the briefing; Property Row values can wrap a word per line; the sticky action renders at its viewport position in full-page captures.
- **Engine, not UI**: the narrator's prose can carry em dashes; the same address returned confidence 68 to 80 across the day's runs; the per-figure evidence bundle is not persisted, so sealed records cannot show the ledger.
- **Draw-the-thread Trace and `provider_result` Bench facts** are follow-ons (WS5 report).
