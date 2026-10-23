# UI sprint, workstream 4: cluster dashboards

Closes A3 (clusters), A7, A8, A9, A10, A11, A17. Depends on the WS3 shell (verdict band, evidence drawer, global search, bottom tabs).

Baseline: `build-log/ui-ws-3/after/` (the shell in place, the lens workspaces untouched). After: `build-log/ui-ws-4/after/`.

## What the baseline shows

- Every panel title is an uppercase mono microlabel (`panels.tsx` `panelTitle`), the default AI-dashboard look (A7).
- `BlockError` prints "Unavailable" whenever `detail` is null, including while the fast fetch is still in flight (A17).
- Charts: labels at the 11px floor since WS1, but three y ticks and a 180px scatter (A10); Market velocity renders six tiles in an auto-fit grid that leaves an orphan and wraps "12.9 sales/mo" (A11).
- Primary buttons lift and glow on hover (A8).
- The map is Mapbox `light-v11` with its stock labels (Newark, LGA on a Brooklyn map); multi-site frames show lots as dots (A9).
- On phones the lens workspaces are desktop layouts squeezed to 358px: tables scroll sideways, the three site inputs stack but the ranking is a table, the portfolio book is a 640px table, the map leads the Property lens (A3 clusters).

## Slices

| # | Slice | Files | Closes |
|---|---|---|---|
| 1 | **Panel primitives.** `Panel`, `PanelTitle` (sentence case, `--text-ui` 500, optional provenance badge, optional sub-line), `PanelLoading` (skeleton rows, `aria-busy`), `PanelEmpty` (a designed "nothing here yet" with the reason), `PanelAbsent` (fetch_failed / coverage_absent with the layer and the next step). Every panel in the four lenses uses them; `BlockError` is retired. Panels receive `loading` separately from `error`, so "Unavailable" never shows while the fetch runs. | `panels.tsx`, every `*Panel.tsx`, `PermitHistoryPanel`, `CmaBuilder`, `PortfolioOverview`, `RiskMonitor`, `MonitoringFeed`, `ArchiveTrend`, `SitePanels` | A7, A17 |
| 2 | **Charts and tiles.** Scatter 260px (220 on phones), five y ticks from the domain helper, x ticks at five values, 11px floor kept, no overlapping labels; BarChart 200px with five ticks; Market velocity as a fixed 3 by 2 grid (2 by 3 on phones) with six tiles and `--text-data-l` values that never wrap. Primary buttons lose the lift and glow: hover is a tint change and the hairline, active is the pressed tint. | `charts/Scatter.tsx`, `charts/BarChart.tsx`, `charts/domains.ts`, `CompsScatter.tsx`, `PermitTrend.tsx`, `MarketVelocityPanel.tsx`, `globals.css` | A8, A10, A11 |
| 3 | **Map.** A branded style on `light-v11`: POI, transit, airport and place labels off, street names in the ink-muted color at a smaller size, water and parks in the KOANO tints; lot-zoom frames (single-subject maps fit the lot polygon at zoom 17 with the subject centered; multi-site maps frame all sites and a tap on a site card zooms to its lot); a "Show map" toggle on phones (collapsed by default, the legend counts shown in the toggle label). | `map/KoanoMap.tsx`, `map/mapColors.ts`, `PropertyMap.tsx`, `MultiSiteMap.tsx`, `PortfolioMap.tsx` | A9 |
| 4 | **Development lens, phone to desktop.** Site inputs stacked with "Add site" (slots appear one at a time); sites as swipeable cards (rank, verdict, site score, buildable area, guards) in a horizontal snap list on phones and a row on desktop; the ranking table becomes a card list below 768; "Verdict math, side by side" scrolls horizontally; map behind the toggle; document buttons sticky at the bottom on phones. | `SiteComparison.tsx`, `SiteMathStrip.tsx`, `SitePanels.tsx`, `MultiSiteMap.tsx`, new `cluster4/SiteCards.tsx` | A3 |
| 5 | **Transaction lens.** Price range as the lens hero (from the pricing panel), the shell band compressed to one line beside it on phones; sticky "Generate CMA" on phones; comps as swipe cards with distance and provenance (the CMA table stays on desktop); velocity grid from slice 2; map behind the toggle. | `Cluster2Dashboard.tsx`, `PricingPanel.tsx`, `CmaBuilder.tsx`, new `cluster2/CompCards.tsx` | A3 |
| 6 | **Portfolio lens.** "This week" as four tiles in a 2 by 2 grid (from the monitoring feed and the book: changes, holdings, verdicts due, risk flags); holdings as a card list with deltas first on phones (the table stays on desktop); map behind a tab; sticky "Generate briefing" on phones. | `Cluster5Dashboard.tsx`, `PortfolioOverview.tsx`, `RiskMonitor.tsx`, `MonitoringFeed.tsx`, new `cluster5/ThisWeek.tsx`, `cluster5/HoldingCards.tsx` | A3 |
| 7 | **Property lens.** Address and the owner / renter switch at the top (a view switch that reorders findings; the investor verdict stays in the band because the engine computes one verdict); plain-language findings as a list, each with its provenance badge; documents as full-width buttons; map below the findings. | `Cluster1Dashboard.tsx`, `AlertsPanel.tsx`, `ValuationPanel.tsx`, `ViolationsPanel.tsx`, `OwnershipPanel.tsx`, new `cluster1/Findings.tsx` | A3 |
| 8 | Capture (every lens in empty, running and done at 390/768/1440, the map toggle open, the swipe lists), self-review, independent review, fixes, report, CLAUDE.md. | `build-log/ui-ws-4*` | |

## Rules held

- Every number in a card or tile is the same number the panel showed, with the same provenance badge; nothing is estimated for the summary tiles.
- Lens vocabulary is the engine's; the Property lens's owner / renter switch changes order and wording of findings, not the verdict.
- No horizontal page scroll at 390 (swipe lists are their own scroll containers with visible focus and keyboard access); 44px targets.
- Loading, empty and absent states are designed; "Unavailable" does not appear anywhere.
