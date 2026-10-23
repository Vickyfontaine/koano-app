# UI sprint, workstream 3: app shell

Closes A3 (shell side), A5, A6, A13, A14, A15. Depends on the WS1 tokens and the WS2 nav/auth patterns. The cluster-specific mobile layouts (A3 clusters, A7 to A11, A17) are WS4; this workstream gives every cluster one shell, one verdict position, one evidence drawer and one search, and makes that shell work at 390, 768 and 1440.

Baseline: `build-log/ui-ws-1/after/cluster_*` (the WS2 captures did not touch the app). After: `build-log/ui-ws-3/after/`.

## What the baseline shows

- A fixed 240px sidebar at every width; at 390 the content column is about 150px wide (`Sidebar.tsx`, `DashboardShell.tsx`), A3.
- Each cluster caps its own content width (980 / 1080 / 1160 / 1160) inside a `calc(100vw - 240px)` main, so at 1440 and above a quarter of the screen is empty on the right, A5.
- The verdict renders after the market panels on Transaction (eighth) and below a map on the other lenses; the reasoning, math, ledger and coverage map follow it inline, so a result is a 9,000px scroll, A6.
- Three numbering systems on one screen: the sidebar `<select>` reads "C2 · Transaction intelligence (home)", the page eyebrow reads "02", the home note reads "Your home cluster is C1", A13.
- The sidebar shows a letter-spaced "KOANO" text wordmark; the logo is absent from the app, A14.
- `/login` and `/signup` are the default Clerk card on a pale page with the same text wordmark, A15.

## Slices

| # | Slice | Files | Closes |
|---|---|---|---|
| 1 | **Responsive shell.** `DashboardShell` becomes a CSS-grid shell with a `TopBar` (blue logo, global-search slot, plan tag, account) and three navigation forms chosen by width: the full sidebar at 1280 and up (plain lens names under a "Lens" heading, the lens's section links, Watchlist, Documents, History, Settings), a 64px icon rail from 768 to 1279 (icons with `aria-label` and a tooltip title), and a bottom tab bar below 768 (Home, Search, Watch, Documents, 44px targets, safe-area padding). One content width (`--content-max`, 1200px) centered in the workspace; the sidebar no longer eats the page at any width. `data-lens` attributes on the lens switch for the capture harness. | `DashboardShell.tsx`, `Sidebar.tsx` (rewritten), new `shell/TopBar.tsx`, `shell/BottomTabs.tsx`, `shell/shell.css` (or `globals.css` rules), `clusters.ts` (lens names) | A3 shell, A5, A13, A14 |
| 2 | **Verdict band and evidence drawer.** A `SubjectProvider` in the shell holds the active subject and the registered verdict run; each lens registers its stream (Cluster 4 registers the top-ranked site). `VerdictBand` renders at the top of the workspace in every lens, same position, at most 40vh: empty ("Enter an address"), resolving, running (compact agent progress), done (verdict word in its ink, score bands, confidence, window, risk, the provenance summary "n live · n representative · n not covered", Math / Sources / Reasoning buttons) and error. `EvidenceDrawer` hosts `VerdictMathPanel`, `ReasoningChain`, `ProvenanceLedger` and `CoverageMap` as tabs, collapsed by default, a 440px right panel at 1280 and up, a full-screen sheet below 768, deep-linkable by hash (`#math`, `#reasoning`, `#sources`, `#coverage`), focus-trapped with Escape. The four inline evidence blocks leave each lens's scroll. | new `shell/SubjectProvider.tsx`, `shell/VerdictBand.tsx`, `shell/EvidenceDrawer.tsx`, `charts/ScoreBands.tsx` (reuse), the four cluster dashboards, `SiteComparison.tsx` | A6 |
| 3 | **Global search.** The top-bar search resolves an address through `/api/resolve-address` (the same disambiguation path), lists recents from `/api/verdicts`, and hands the settled subject to the active lens: Property and Transaction run it, Development fills the first empty site slot, Portfolio adds it to the book. The per-lens `AddressInput` stays as the in-workspace control on Development and Portfolio (three slots; add to book) and is removed from Property and Transaction, which take their subject from the shell. `⌘K` / `Ctrl+K` focuses it; the phone Search tab opens it as a sheet. | new `shell/GlobalSearch.tsx`, `useAddressResolver.ts` (shared), `Cluster1Dashboard.tsx`, `Cluster2Dashboard.tsx`, `SiteComparison.tsx`, `Cluster5Dashboard.tsx` | shell |
| 4 | **Branded sign-in.** `AuthShell` gets the blue logo, a two-column layout at 1024 and up (a KOANO panel with the approved tagline and the three "Every figure / Every verdict / Every step" lines, the form on the right) that stacks on phones, and the Clerk card restyled with the tokens (card radius, input borders, pill button, hidden internal header where the shell already says it). The Clerk "Development mode" strip is a development-instance notice and goes away with the production keys. | `AuthShell.tsx`, `clerkAppearance.ts`, `login/[[...rest]]/page.tsx`, `signup/[[...rest]]/page.tsx` | A15 |
| 5 | **Numbering cleanup.** The C1 to C4 badges and the 01/02/04/05 eyebrows leave the user-facing app (dashboards, `OnboardingClusters.tsx`, `UpgradeScreen.tsx`); the plan shows as a tag ("Plan: Development"). `number` stays in `clusters.ts` for DOM ids. | `clusters.ts`, the four dashboards, `OnboardingClusters.tsx`, `UpgradeScreen.tsx`, `Sidebar.tsx` | A13 |
| 6 | Capture (`dash-shots.mjs` on every cluster in empty, running and done states at 390/768/1440; login and signup; the drawer and the search open), self-review, independent review, fixes, report, CLAUDE.md. | `build-log/ui-ws-3*` | |

## Rules held

- No new one-off spacing, radius, type or color values; everything reads the WS1 tokens.
- The verdict band shows the engine's actual verdict vocabulary; lens-specific vocabularies (site verbs, plain findings for the Property lens) are an engine change and are not implied here.
- The band's provenance summary counts the verdict's own data points by state; nothing is estimated.
- Every interactive element is 44px on phones; every control has a visible focus ring; the drawer and the search sheet trap focus and close on Escape.
- No "Unavailable" while loading: the band and the drawer have designed loading and empty states.
