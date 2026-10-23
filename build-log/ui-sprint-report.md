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
| A12 | Conflicting radii, 25 paddings, 19 sizes | Closed (WS1 tokens; later workstreams on tokens) | `ui-ws-1/before/*` | `src/app/globals.css` `:root` tokens; `ui-ws-6/after/*` |
| A13 | Three numbering systems | Closed (WS3) | `ui-ws-1/before/cluster_2-done-1440-fold.jpg` ("C2 · …", "02", "home cluster C1") | `ui-ws-6/after/cluster_2-empty-1440-fold.jpg` (plain lens names, "home") |
| A14 | Text wordmark in the sidebar | Closed (WS3) | `ui-ws-1/before/cluster_2-done-1440-fold.jpg` | `ui-ws-6/after/cluster_2-empty-1440-fold.jpg` (the blue logo in the top bar) |
| A15 | Default Clerk sign-in | Closed (WS3) | `ui-ws-1/before/login-1440-fold.jpg` | `ui-ws-6/after/login-1440-fold.jpg`, `signup-390.jpg` |
| A16 | Badge and verdict contrast, no focus states | Closed (WS1) | `ui-ws-1/before/cluster_2-done-1440-fold.jpg` | `ui-ws-1/after/cluster_2-done-1440-fold.jpg`; the global focus ring in every later interaction capture (`ui-ws-3/after/interactions/band-done-390.jpg`) |
| A17 | "Unavailable" while loading | Closed (WS4) | `ui-ws-1/before/cluster_2-running-1440-fold.jpg` | `ui-ws-6/after/cluster_2-running-1440-fold.jpg` (skeleton panels) |
| A18 | Blank sections in captures | Closed (WS2) | `ui-ws-1/before/intelligence-1440.jpg` | `ui-ws-6/after/intelligence-1440.jpg`, `data-390.jpg` (every section rendered; server HTML carries no hidden sections) |
| A19 | PDF typography, KOANO mark on white-label documents | Closed (WS1) | the WS1 report's review table (`ui-ws-1-report.md`; the pre-sprint PDFs were rendered during WS1, not kept) | `ui-ws-1/after/docs/*.png` (page 1 of every sample document) |

## Acceptance criteria

(filled after the final QA pass)

## Open blockers (founder)

- Apply `supabase/migration-023-ui-sprint-integrity.sql` (five-state provenance constraints, `verdicts.weighting_breakdown`, RLS on two cache tables). Until then a non-NYC verdict fails to persist and history verdicts rebuild their math from the stored votes.
- Supply the 4:5 mobile render set (`public/renders/mobile/<name>.webp`); `node scripts/ui/render-manifest.mjs` lists what is present; flipping `mobile: true` in `renders.ts` serves each one below 768px. Until then the heroes use the temporary stacked layout.

## Not fully satisfied

(filled after the final QA pass)
