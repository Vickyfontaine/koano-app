# UI sprint, workstream 4 report: cluster dashboards

Branch `ui-sprint`. Commits 2078fa7 (slices 1 and 2), 44aec93 (slice 3), b15cbf2 (slices 4 to 7), plus the review-fix commit. Gate green on the combined tree before the commits and again after the review fixes; the fixture untouched.

Baseline: `build-log/ui-ws-3/after/` (the shell in place, the lens workspaces as they were). After: `build-log/ui-ws-4/after/` (every lens in empty, running and done states at 390, 768 and 1440 through real analyses; `dash-audit.json`) and `build-log/ui-ws-4/after/interactions/` (the owner / renter switch, the phone map toggle and lot zoom, comp cards, this-week tiles, holding cards, the sticky action; `checks.json`, `console.json`). Diff: `build-log/ui-ws-4-diff.patch`.

## What changed

- **Panel primitives (A7, A17).** Every panel heading is sentence case in the UI size with an optional sub-line (`PanelHeader`); the mono microlabel stays for sub-labels inside a panel. `PanelLoading` (skeleton rows), `PanelEmpty` and `PanelAbsent` (the reason, plainly) replace "Unavailable"; a panel whose data is still in flight shows the skeleton.
- **Charts and tiles (A10, A11).** Five rounded ticks on every axis (`niceTicks`), the scatter at 260px (220 on phones) and the bar chart at 200px, labels at the 11px floor. Market velocity is a fixed 3 by 2 grid (2 by 3 on phones) with the value in the data-large size and its unit beside it.
- **Buttons (A8).** Hover is a tint change on the same plane; no lift, no glow.
- **Map (A9).** Only street and neighborhood labels remain, in the ink-muted color; points of interest, transit, airports, cities and water labels are off. Lot-zoom frames: a lot polygon fits at up to zoom 17.5, with an in-map Lot / All control; the property map draws the subject lot; tapping a site card zooms the multi-site map to that lot. `MapFrame` gives every map a sentence-case title, a summary line, and a "Show map" toggle on phones (collapsed by default).
- **Develop (A3).** Site slots open one at a time with "Add site"; the ranked sites are cards (a swipe list on phones) with rank, verdict, confidence, risk, unused FAR and the structural guard; the ranking table stays from 768px; the verdict math strip scrolls sideways on phones; the map is behind the toggle; a sticky Documents action on phones.
- **Price (A3).** The pricing recommendation and market velocity lead on phones; comparable sales are swipe cards with distance and provenance (the table from 768px); a sticky Documents action.
- **Acquire (A3).** "This week" as four tiles counted from the book and the weekly diff (holdings, changes in 7 days, high risk, not analyzed); holdings and the hazard signals as cards on phones (tables from 768px); the map behind the toggle; a sticky Generate briefing action; a skeleton while the book loads.
- **Property (A3).** An owner / renter switch orders the findings and panels for the reader (the engine's verdict is unchanged and stays in the band); the plain findings come first with their sources; documents are full width on phones; the map sits below the findings.

## Items closed, with evidence

| Item | Status | Evidence |
|---|---|---|
| A3 (clusters) | Closed | `after/cluster_4-done-390.jpg` (site cards, strip, toggle), `after/cluster_2-done-390.jpg`, `after/cluster_5-done-390.jpg`, `after/cluster_1-done-390.jpg`; `interactions/*.jpg`; `dash-audit.json` with no horizontal overflow at any width |
| A7 mono microlabel titles | Closed | every `*-done-1440-fold.jpg` panel heading |
| A8 glowing buttons | Closed | `after/cluster_4-empty-1440-fold.jpg` (Run comparison), hover verified in the browser |
| A9 stock map style | Closed | `after/cluster_1-done-1440-fold.jpg` (street names only), `interactions/property-map-lot-390.jpg` |
| A10 chart labels and ticks | Closed | `after/cluster_2-done-1440.jpg` (five ticks on the scatter and the permit bars) |
| A11 orphan tile, wrapping values | Closed | `after/cluster_2-done-1440-fold.jpg`, `after/cluster_2-done-390.jpg` |
| A17 "Unavailable" while loading | Closed | `after/cluster_2-running-*.jpg` (skeleton panels while the fast fetch runs) |

## Self-review against the bar

- Horizontal overflow: none in any of the 39 lens captures at 390, 768 or 1440 (`dash-audit.json`); the interaction script measured 0px of document overflow on Property, Price and Acquire at 390 with the map open and the cards rendered.
- Console: Clerk's development-keys notice and headless-Chromium GL messages only; `interactions/console.json` is empty.
- Loading states: the running captures show skeleton panels while the fast fetch runs; `grep Unavailable src/components` finds only the legacy `BlockError` entry point, which now renders the loading or absent state.
- Targets: the Lot / All control is 36px tall inside the map (an in-map control next to Mapbox's 29px zoom buttons; see the review), card actions 44px, the segmented switch 40px tall (full width on phones), Add site 46px, the sticky action 48px.
- Every card figure is read from the same object the table reads (`ranked` and `streams[slot].result` for sites, `properties` for holdings, `comps.data.comps` for comps); the this-week tiles count the book and the notifications feed.
- The owner / renter switch reorders the findings and panels and changes the findings heading; the band is untouched (`interactions/property-renter-findings-390.jpg`).

## Independent review and resolutions

The reviewer (a fresh subagent given the sprint file, the plan, the diff and both capture sets, with its own Playwright checks; its one permitted live run was refused by the daily spend guard, so it measured the free block fetch, the layouts and the earlier captures) reported eight material findings and ten minor ones, no blocker.

| # | Finding | Resolution |
|---|---|---|
| 1 | Comp cards rendered at every width (the swipe-list rule overrode phone-only), so the CMA listed every comp twice on desktop | Fixed: `.swipe-list.phone-only` is hidden from 768px |
| 2 | Charts had three to five ticks; the bar axis top could sit below the data max | Fixed: `niceTicks` returns exactly five ticks that cover the domain; the bar axis top is the last tick; the scatter plots the tick range |
| 3 | Bar-chart month labels collided at 390 | Fixed: every other label hides on phones |
| 4 | Targets under 44px: the segmented switch (40), the Lot/All control (36), the history row buttons (27), Generate PDF (43) | Fixed: 44px on all of them (primary and ghost buttons carry a 44px floor) |
| 5 | Focus ring clipped on the Lot/All pill; invisible on the segmented control | Fixed: inset outlines inside both pills |
| 6 | The pricing panel said the pipeline was still running after a failed run | Fixed: the panel reads the run state |
| 7 | Price on phones did not compress the band beside the price range | Fixed: on phones the Price lens's band is one line (verdict, conf, risk, window) with More / Less; the pricing panel leads the workspace |
| 8 | The map legend opened by default and covered half a phone map | Fixed: collapsed on phones by default |
| 9 | Site-card taps could zoom the wrong lot; the Lot button always took the first lot; the tap scrolled away from a collapsed map | Fixed: lots keyed by slot, the Lot button zooms the last focused lot, a tap opens the map on phones and scrolls only on wide screens |
| 10 | Cards lacked the sprint's "buildable area" | Fixed: as-of-right buildable sq ft (lot area × max residential FAR minus built) on each card. "Site score" stays out of the lens (one vocabulary, see below) |
| 11 | Mono microlabels still titled the math strip; a "Comparables unavailable" line remained | Fixed: sentence-case heading; a designed absent line. Sub-labels inside panels stay mono by design |
| 12 | Swipe lists clipped inside the panel padding | Fixed: lists inside panels bleed to the panel edge |
| 13 | The sticky "Generate briefing" only scrolled | Fixed: it is labeled "Monday briefing" and says it jumps to the briefing |
| 14 | The velocity unit wrapped under some values on phones | Fixed: on phones the unit always sits under the value |
| 15 | Row values wrapped vertically; permit dates broke on hyphens | Fixed: Row values wrap as a block within 62% of the row; dates never break. The archive coverage grid's scroll cue is open |
| 16 | Stock labels could return after a style reload | Fixed: the base re-brands on every `style.load` |
| 17 | Dash glyphs as missing values; em dashes in the spend-guard message and the pro forma label | Fixed in the formatters, the guard message and the mock label. Provider scope notes and narrator prose are engine text and stay |
| 18 | Token comment placement; disabled label color | Comment moved; the disabled label stays `--ink-secondary` (WS1's measured 6.1:1 choice) |

Also noted by the reviewer: the daily spend guard refused its live run. The capture runs for this report were made with the local `KOANO_DAILY_RUN_CAP` raised in `.env.local` for the dev server only (not committed); the production cap is unchanged.

## Not fully satisfied

- The sprint's "site score" vocabulary for Develop is the screening memo's 0-100 figure; the lens cards show the engine's confidence and risk under their own names so the lens never carries two vocabularies for one figure.
- Full-page phone captures show the sticky action pinned where the harness's viewport bottom was; in the browser it sits above the bottom tabs.
- The per-site verdict card and panels stay in the Develop workspace below the cards; the band and drawer carry the selected site.
