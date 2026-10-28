# KOANO UI-First Sprint

**Purpose:** make KOANO look and feel like its high-end version using data that already exists, so the product and website are ready to show during PM internship applications.

**Relationship to the build spec:** this is the short-term track. Run it first. The full backend build in `KOANO_BUILD_SPEC.md` (Phases 0 to 6) follows and catches up to the features designed here. Keep both files at the repo root next to `/audit`.

---

## Rules for every sprint session

- **STANDING RULE (founder, 2026-10-28): no unrequested visual or copy decisions.** Do not make any visual or copy decision the founder did not explicitly ask for: colour, imagery, glass and blur, copy, layout, hiding sections. If a fix seems to need one, stop and propose options with screenshots. Contrast, spacing and overflow bugs may be fixed without asking only if the fix does not change how the design looks. When a requested change fails a check (for example WCAG AA), report it with the measurement and do not change the design to fix it.
- **Locked decisions:** the site font stays exactly as it is. The KOANO logo always appears in its original blue. Provenance honesty is non-negotiable. Decision math stays deterministic. Landlords and flippers are not an audience. White-label documents carry no KOANO branding. Marketing renders keep the architectural diorama house style.
- **Plan first** in `/build-log/`, then ship one slice per commit with the pre-push gate green.
- **No em dashes** in user-facing copy.
- **Update `CLAUDE.md`** after each workstream so the build bible matches the code.

---

**Run this before the full Phase 0 to 6 build.** The backend phases then catch up to the features designed here.

**Model:** Claude Fable 5.1 in Claude Code. One slice per commit. Move to the next workstream as soon as the current one meets its checks.

**Scope:** mostly interface, plus the correctness fixes and light backend wiring the new interface depends on (listed in workstream 1 and workstream 5). No new data sources, no new engines.

**The sprint rule:** the interface may lead the backend in polish, never in claims. Anything not yet backed by real data lives on a separate, clearly labeled concept page, not inside the live product.

**The 175 3rd St demo stays** in the hero, the fixture and the demo video. It is labeled on the site as "Recorded example run, August 2026. Illustrative of how the engine reasons." Live runs on real addresses still get the construction and valuation guards, so the live product never repeats the demo's error.

### Aesthetic problems this sprint must fix (all of them)

From the audit (`panel/design_engineer.md`, `panel/product_designer.md`, `02_competitors.md` §8) plus the founder's own review:

| # | Problem | Where |
|---|---|---|
| A1 | Renders are hidden on phones below 900px, so mobile visitors see no diorama imagery | `globals.css:465-475`, every hero |
| A2 | Renders are composed for wide desktop slots (empty center, buildings on the left and right edges), which does not work in a narrow column | All render slots |
| A3 | No cluster dashboard works on mobile: fixed 240px sidebar, about 70px of content at 390px | `Sidebar.tsx:29-43`, `DashboardShell.tsx:57-63`, all four cluster views |
| A4 | Homepage hero card is glass over the render, agent chips illegible, lower half empty for most of the loop | `HeroDashboard.tsx:41-75` |
| A5 | About 25 percent of the screen is empty on the right at 1440 to 2000px; three different content widths across clusters | All four dashboards |
| A6 | A map is the hero on three of four dashboards; the verdict is buried (eighth on Transaction) | Cluster dashboards |
| A7 | Uppercase mono microlabels used as every panel title; reads as a default AI-dashboard template | `panels.tsx`, all panels |
| A8 | Glowing pill buttons, including disabled ones | All CTAs |
| A9 | Stock Mapbox style with irrelevant labels (Newark, LGA on a Brooklyn map); lots too small to see in multi-site views | `KoanoMap.tsx` |
| A10 | 9px chart labels, three y ticks, 180px-tall scatter | `charts/*` |
| A11 | Orphan KPI tile and wrapping values in Market Velocity | `MarketVelocityPanel.tsx` |
| A12 | Conflicting corner radii (16px vs 20px) on adjacent cards; 25 padding values, 19 font sizes | `globals.css`, `tailwind.config.ts`, components |
| A13 | Three numbering systems on one screen ("C1", "04", "home cluster C2"); native select as the cluster switcher | `clusters.ts`, `Sidebar.tsx` |
| A14 | Sidebar shows a plain text wordmark instead of the blue logo | `Sidebar.tsx:46-59` |
| A15 | Default Clerk sign-in card is the first authenticated screen | `/login`, `/signup` |
| A16 | Provenance badges and verdict words fail contrast; no focus states | `ProvenanceBadge.tsx`, `verdict.ts` |
| A17 | Panels say "Unavailable" while loading | `MarketVelocityPanel.tsx:68` and siblings |
| A18 | Blank sections in full-page captures (scroll animations that never fire) | Marketing pages |
| A19 | PDF typography: hyphenated labels, left-aligned numbers, KOANO mark on white-label documents | `lib/documents/render/*` |

Font and logo stay exactly as they are. Every fix happens inside the existing type families and the original blue logo.

### The mobile render system (fixes A1 and A2)

The desktop renders were composed for centered text across a wide slot. On a phone, the text stacks in a narrow column, so the same image either crops the buildings away or sits behind the headline. Cropping alone will not fix it.

**Founder task (asset generation):** generate a mobile set in the same house style, one per existing render.

| Spec | Value |
|---|---|
| Style | Identical to the desktop set: architectural diorama, miniature buildings on a base plinth, realistic materials and shadows, straight-on front elevation |
| Aspect | 4:5 for page heroes, 9:16 only if a full-screen mobile hero is wanted |
| Composition | Buildings and plinth fill the lower 45 to 50 percent; the upper area is clean background matching the page, reserved for the headline |
| Background | Solid, exactly matching its placement on the site |
| Resolution | At least 2160px on the long edge |
| Subjects | Brownstone row (`/for/community`), detached houses (`/for/agents`), construction site with crane (`/for/developers`), commercial mid-rise (`/for/institutions`), NYC skyline (how it works), park with trees and people (to place) |
| Excluded | The homepage hero, which stays outside the render family (left-aligned, full-bleed, near-black) |

**Build task (Claude Code):** serve the right render per breakpoint with `<picture>` art direction (`<source media>` plus `srcset`), WebP or AVIF, explicit dimensions to prevent layout shift, lazy loading below the fold, and a text block positioned over the reserved upper area on mobile. Until the mobile set exists, use a temporary layout that places the desktop render below the headline at full width rather than hiding it.

### Mobile dashboards, cluster by cluster (fixes A3)

Breakpoints: phone at 390px, tablet at 768px, desktop at 1280px and up. On phones the sidebar becomes a bottom tab bar (Home, Search, Watch, Documents). On tablets it becomes a 64px icon rail. Every cluster puts the verdict band first.

| Cluster | Mobile layout |
|---|---|
| **Development** (`cluster_4`) | Site inputs stacked with "Add site". Sites as swipeable cards showing rank, verdict, site score, buildable area and guards. Ranking table becomes a card list. "Verdict math, side by side" scrolls horizontally. Map collapses behind a "Show map" toggle. Document buttons sticky at the bottom |
| **Transaction** (`cluster_2`) | Price range as the hero, verdict band beside it compressed to one line. Sticky "Generate CMA" button. Comps as swipe cards with distance and provenance. Market velocity as a 2 by 3 grid with no orphan tile and no wrapping values. Map behind a toggle |
| **Portfolio** (`cluster_5`) | "This week" as four tiles in a 2 by 2 grid. Holdings as a card list with deltas first. Map behind a tab. "Generate briefing" sticky |
| **Community** (`cluster_1`) | Address and owner/renter switch at the top. Plain-language findings as a list, each with its provenance badge. Documents as full-width buttons. Map below the findings |

Shared on every cluster: evidence drawer as a full-screen sheet, tap-to-expand evidence rows, long-press for Trace, no horizontal page scroll, 44px minimum touch targets.

### Workstreams, in order

Each workstream depends on the one before it. Done means every listed fix is closed and screenshotted, not that time has passed.

| # | Workstream | Fixes |
|---|---|---|
| 1 | **Correctness and tokens.** Construction guard for live runs, valuation guardrails, provenance constraint widened to all five states, white-label documents stripped of KOANO branding, demand-sentiment cleanup, crime labels. Demo labeled as a recorded example and LIVE badges removed from the replay. Design tokens (color ink, spacing, type, radius, motion, focus) | A12, A16, A19, Phase 0 items except the demo swap |
| 2 | **Marketing site, mobile-first.** Render art direction with the temporary layout, solid hero card, scroll sections that render without animation, auth-aware nav, contained content widths, homepage address box | A1, A2 (code side), A4, A18 |
| 3 | **App shell.** Bottom tabs, icon rail, plain lens names, blue logo in the sidebar, fixed verdict band, evidence drawer, global search, branded sign-in | A3 (shell), A5, A6, A13, A14, A15 |
| 4 | **Cluster dashboards.** All four rebuilt for phone, tablet and desktop per the table above. Panel primitives replace the mono-microlabel titles. Loading, empty and absent states. Charts at 11px minimum with five ticks. Branded map style with lot-zoom frames | A3 (clusters), A7, A8, A9, A10, A11, A17 |
| 5 | **Product feel.** The Bench (three small stream events from the existing run, decision before narration). Trace on the verdict and ledger. CMA, IC memo and portfolio risk report buttons wired to the existing document engine. Shareable verdict page | Product feel |
| 6 | **Concept page and final pass.** `/vision` for radar, sentence-to-building, ownership graph and track record, labeled "Concept preview" on recorded sample data. Mobile render set dropped in when supplied. Full QA with screenshots of every page and cluster at 390, 768 and 1440 | A2 (final), everything re-verified |

### Sprint acceptance criteria
- Every marketing page and every cluster dashboard is fully usable at 390px with no horizontal scroll, no hidden renders and no blank sections.
- Every aesthetic problem A1 to A19 is closed and listed as closed in `/build-log/ui-sprint-report.md`, with before and after screenshots.
- Nothing in the live product claims a capability the backend does not have. Future features appear only on `/vision`, labeled.
- The demo carries its "recorded example" label everywhere it appears on the site.
- Font and logo unchanged. Pre-push gate green.

### Sprint prompt
```
Read KOANO_UI_SPRINT.md in full, plus audit/04_redesign_spec.md, audit/panel/design_engineer.md
and audit/panel/product_designer.md. Execute the UI-first sprint, starting at
workstream N and continuing through the workstreams in order until all six are
done or you hit a blocker that needs the founder. Do not change the font or the
logo. Do not replace the 175 3rd St demo; label it as a recorded example where
the sprint says to. Before each workstream, write /build-log/ui-ws-N-plan.md, then
implement slice by slice with one commit per slice and the pre-push gate green.
For every page or dashboard you touch, save before and after screenshots at
390px, 768px and 1440px to /build-log/ui-ws-N/. After each workstream, write
/build-log/ui-ws-N-report.md listing which aesthetic problems (A1 to A19) are now
closed and anything left open, then go straight to the next workstream.
```
