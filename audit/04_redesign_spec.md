# 04. Redesign Spec: Product UI and Dashboards

This brief reconciles the design engineer (`panel/design_engineer.md`), the product designer (`panel/product_designer.md`), the user role-play (`panel/user_roleplay.md`), and the Diald teardown (`02_competitors.md`). It respects every locked decision. The font stays as it is (Neue Montreal and DM Mono, per `globals.css` and `tailwind.config.ts`; nothing here touches typography families). The logo stays in its original blue. Provenance stays loud. The verdict math stays deterministic. The white-label CMA carries no KOANO mark.

State labels: `EXISTS`, `PARTIAL`, `MISSING`, `VISION`.

---

> **Sequencing after the red team (`08_red_team.md`).** Most of this spec is FROZEN behind the hire-or-traction gate in `05_product_roadmap.md`. Only three pieces ship in the first 90 days:
> - the early `decision` event (30-26)
> - wiring the paid documents (30-7)
> - the white-label fixes (30-10)
>
> The rest of this document is the target design for when there is a second engineer. Build in order: the verdict band, then the shell, then the Bench, then Trace.

## 0. The diagnosis in four sentences

1. The backend knows far more than the UI shows. Twenty-three provider results, five agents' data points, and the final deterministic decision all exist server-side seconds before the user sees anything, yet the run is a 60 to 180 second black box of five pulsing dots (`LoadingState.tsx`, `useVerdictStream.ts`, `synthesis.ts:182`).
2. The verdict has no fixed home. It renders eighth on Transaction (`Cluster2Dashboard.tsx:296`) and below a map on the other three lenses (`development.png`, `community.png`, `portfolio.png`).
3. The things people pay for are unreachable. The CMA, IC memo and portfolio risk report are built server-side but have no button, and the CMA tile says "Not yet available" (`Cluster2Dashboard.tsx:243-262`).
4. The dashboard does not exist below about 1000px. A fixed 240px sidebar leaves roughly 70 to 150px of content on a phone (`Sidebar.tsx:29-43`, `DashboardShell.tsx:57-63`).

Correctness sits above all of it. The redesign must not make a wrong verdict more persuasive. The engine fixes in `05_product_roadmap.md` (DOB NOW, unit-aware valuation, lens rule sets) ship before or alongside this redesign. Polishing the 175 3rd St BUY would make the product worse.

---

## 1. Design principles (govern every screen going forward)

1. **Reasoning is the interface.** Every number is a door to its derivation and its source. The app does not hide the reasoning behind a tooltip.
2. **The verdict owns the top of the viewport, always in the same place.** At most 40% of viewport height, identical position in every lens, everything else reads as evidence below it.
3. **Computed, then narrated.** The deterministic decision appears the moment it exists. Prose arrives after and is labeled as narration: "The decision above is computed and will not change."
4. **Gaps are as visible as facts.** A `coverage_absent` layer is drawn as a cut line, never as blank space. A `representative` figure is hatched. A `fetch_failed` figure offers retry. The redesign moves these badges to where the eye already is and never softens them.
5. **The deliverable is the primary action.** Next to every verdict sits the persona's document, shown as a rendered first-page thumbnail.
6. **One subject, one URL, many lenses.** A property or site has one address in the app. Switching lens never re-runs or loses state.
7. **Watch is a verb on every subject.** Monitoring is reachable from every lens, not only Portfolio.
8. **Nothing moves that did not happen.** Every animation maps to a real server event, so the motion never simulates progress (this extends the comment at `LoadingState.tsx:3-6`).
9. **AA or it does not ship.** Every text and badge color meets WCAG 2.2 AA contrast, and every interactive element has a visible focus ring.
10. **One vocabulary per lens.** Investor verbs (BUY, HOLD) for acquire and hold lenses. Site verbs (ADVANCE, HOLD, PASS) for development. Plain findings for tenants and homeowners. Never two vocabularies for the same subject in the same lens.

---

## 2. The signature interaction: Trace (with the Bench as its stage)

KOANO's visual identity should be the visible form of its only non-negotiable. Two parts, from `panel/design_engineer.md` §5.1 and §8:

### 2.1 The Bench (the run as a show) `MISSING`

It replaces `LoadingState` for the duration of a run. The address compresses into a strip at the top, five agent columns sit beneath it, a live vote rail runs under the columns, and a score-band strip sits under the rail.

- Each provider result lands in its agent's column as a fact row with its provenance state: `Flood zone  X (minimal)  ● LIVE  1.4s`. A `coverage_absent` fact lands as a struck hairline that reads "not covered: [feed]".
- When an agent completes, its bar grows on the vote rail from the zero axis to its signed contribution.
- When all five are in, the needle sweeps to the agent score. If there is a structural adjustment, a second segment extends with its driver sentence (for example "97% unused FAR"). The needle lands in a band, and the verdict word appears.
- The narrator writes afterward, under the line "The decision above is computed and will not change."
- Header counters show only counts of real events: `0:47 · 17 of 23 sources · 3 of 5 agents`.

**Timing tokens.** Easing `cubic-bezier(0.16, 1, 0.3, 1)` (the existing house easing).

| Event | Motion | Duration (ms) |
|---|---|---|
| Fact lands | Opacity 0 to 1, y 6 to 0. If more than 3 facts arrive within 150 ms, stagger 50 ms each | 220 |
| Agent seals | Band word slides in from y 4, then the rail bar grows | 240, then 400 |
| Needle sweep | From 0 to the agent score | 500 |
| Nudge segment | Extends by the structural adjustment | 400 |
| Band fill | The landing band fills | 160 |
| Bench condenses into the result | FLIP animation | 360 |
| Result sections | Fade in, staggered 60 ms | 300 |
| Choreography budget | A real event is never delayed more than 400 ms for choreography | n/a |
| Reduced motion | No transforms, 120 ms opacity only, the needle jumps | 120 |

**Server changes.** These are additive progress events; the decision surface and the fixture are unaffected.
- Add `provider_start` and `provider_result`, emitted from a registry wrapper scoped with AsyncLocalStorage, in the same way as `lib/providers/degradation.ts`.
- Add `data_points`, `direction` and `contribution` to `agent_complete`.
- Emit a new `decision` event right after `aggregate()` and before the narrator (`synthesis.ts:182`).

**Files.** `lib/agents/synthesis.ts`, new `lib/providers/progress.ts`, `src/app/api/agents/stream/route.ts`, `src/components/dashboard/useVerdictStream.ts` (move to a reducer and add `AbortController`), new `src/components/ui/Bench.tsx` replacing `LoadingState.tsx`, and reuse of `charts/DivergingBar.tsx` and `charts/ScoreBands.tsx` in live mode.

### 2.2 Trace (the gesture) `MISSING`

Any figure (verdict word, confidence, a vote, a ledger value, a map pin, a chart point, a number in a PDF via deep link) can be pulled like a thread.

- **Activation.** Hover, focus plus Enter, or long-press.
- **The thread.** A 1.5px line draws from the figure down through every intermediate it depends on: verdict, then score, then the agents that moved it, then their cited data points, then the source row in the ledger. Each intermediate is labeled with its operation, for example "× conf 82 ÷ Σ 391" or "nudge +1.00 from: 97% unused FAR". Everything off the thread dims to 35%.
- **Line style encodes provenance per segment:**
  - solid for `live`
  - dotted for `partner`, with the partner's name on the line
  - hatched for `representative`, with "becomes live with [source]"
  - dashed with a red-ink retry for `fetch_failed`
  - cut with an end cap for `coverage_absent`, reading "not covered here: [feed] fills this"
- **Reverse Trace.** Activate a source such as "NYC DOB permits" and every figure that depends on it lights up.
- **Motion.** The line draws in 320 ms, dimming takes 160 ms, release takes 200 ms.
- **Keyboard.** `T` toggles Trace mode for the whole page.

**Why this is the identity.** A competitor without per-figure provenance cannot copy it cosmetically, and it makes gaps more visible rather than less. The Diald teardown found its demo shows a 94% confidence score unchanged while IRR fell from 13.4% to 3.4% (`02_competitors.md`). Trace is the visual opposite of that.

**Data.** Everything needed already exists in the `complete` payload: `weighting_breakdown.agents[].contribution`, `structural_drivers`, `agent_summaries`, `reasoning_chain[].sources`, and `data_points[]`. For history verdicts, Trace needs the evidence bundle to be persisted (`05_product_roadmap.md` item 30-2). Today `data_points` is fresh-run only (`synthesis.ts:171-174`).

**Files.** New `src/components/ui/trace/{TraceProvider.tsx, TraceOverlay.tsx, graph.ts}`, plus a `useTraceTarget(id)` hook adopted by `VerdictCard`, `VerdictMathPanel`, `DivergingBar`, `ScoreBands`, `ProvenanceLedger`, `ReasoningChain` and `KoanoMap`.

---

## 3. Shared shell (all lenses) `MISSING`

```
+------------------------------------------------------------------------------------------------+
| [KOANO logo, original blue]  [ Search address, BBL, or paste a list...      ⌘K ]  [Free 2 of 3] |
|                                                         [Watchlist 4] [Documents] [Account]    |
+-----------+------------------------------------------------------------------------------------+
| LENS      | (A) SUBJECT HEADER  175 3rd St, Brooklyn · BBL 3-00972-0058 · M1-2/R6A               |
|  Develop  |     location: confirmed ●   [Watch] [Share link] [History]                          |
|  Acquire  |------------------------------------------------------------------------------------|
|  Price    | (B) VERDICT BAND  fixed height (max 40vh), same position in every lens               |
|  Property |     verdict word · score bands · confidence · window · provenance summary            |
|-----------|     "31 live · 2 representative · 4 not covered"   [Trace] [Math]  [Primary document]|
| Subjects  |------------------------------------------------------------------------------------|
| Compare   | (C) LENS WORKSPACE (persona-specific)                 | (D) EVIDENCE DRAWER (toggle)|
| Watchlist |                                                       |  Math · Reasoning · Sources  |
| Documents |                                                       |  · Coverage · Changelog      |
| History   |                                                       |                              |
| Settings  |                                                       |                              |
+-----------+------------------------------------------------------------------------------------+
```

Annotations:
1. **Lens switcher** replaces the `<select>` in `Sidebar.tsx:77-100`. It shows plain lens names only. Remove the C1 to C4 badges and the 01/02/04/05 eyebrows from user-facing UI (`clusters.ts`, `Sidebar.tsx:96,114`, `OnboardingClusters.tsx:160`, `UpgradeScreen.tsx:149`). The plan shows as a small tag ("Plan: Development").
2. **Global search** replaces the per-cluster `AddressInput`, with autocomplete, recents (from `/api/verdicts`), BBL entry and paste-many. Resolution and `CandidatePicker` live inside the dropdown, and the picker shows the resolved lot outline on a mini map.
3. **Usage meter** is always visible: "Free 2 of 3" becomes "Development: 38 of 40 screens this month." Requires a new `/api/usage` reading `usage_events`.
4. **Subject URL.** `/p/{bbl}?lens=develop`. The verdict permalink `/v/{verdictId}` is read-only, shareable and Trace-enabled, and shows the sealed record. Requires `src/app/p/[bbl]/page.tsx` and `src/app/v/[id]/page.tsx`.
5. **Evidence drawer** hosts `VerdictMathPanel`, `ReasoningChain`, `ProvenanceLedger`, `CoverageMap` and a new verdict Changelog. It is collapsed by default and deep-linkable (`#math`, `#sources`).
6. **Location confidence** sits in the subject header next to the address, so an unconfirmed lot can never be overlooked.
7. **Responsive.**
   - At 1024 to 1279px the sidebar becomes a 64px icon rail.
   - Below 1024px it becomes a top bar plus a bottom tab bar.
   - Below 768px the evidence drawer becomes a full-screen sheet.

Files: `DashboardShell.tsx`, `Sidebar.tsx`, `src/app/dashboard/page.tsx` (redirect to `/p/...` after first run), the new routes above, `AddressInput.tsx`, `CandidatePicker.tsx`.

---

## 4. Lens by lens

The four clusters become four lenses on one subject (and remain the four pricing tiers). Wireframes are desktop 1440px. Each lens lists the deterministic rule set it uses. Lens-specific rule sets are an engine change (`05_product_roadmap.md`). Until they ship, the lens UI must not imply a lens-specific verdict that the engine does not compute.

### 4.1 Develop lens (Cluster 4, the wedge)

```
+--------------------------------------------------------------------------------------------------+
| COMPARE  3 sites  [+ add site]  [paste list]     sort: Site score ▾      [Comparison brief ⬇]    |
+--------------------------------------------------------------------------------------------------+
| #1 <site A>, Brooklyn           | #2 <site B>, Queens            | #3 running · 3 of 5 agents     |
| ADVANCE · site score 74          | HOLD · site score 61           | [mini Bench animating]         |
| Buildable as-of-right 41,200 BSF | Buildable 18,900 BSF           | rank pending, not blocking     |
|   LIVE (PLUTO, checked vs DOB NOW: no NB/DM job)                  |                                |
| Entitlement: no discretionary    | Special district: yes  LIVE    |                                |
|   action needed  LIVE            |                                |                                |
| Land residual: enter your inputs | Land residual: enter inputs    |                                |
|   USER-PROVIDED  [inputs ▸]      |                                |                                |
| Guards: not co-op · not stabil.  | ⚠ Active A1 filing on lot      |                                |
| [Screening memo ⬇] [Watch]       | [Screening memo ⬇] [Watch]     |                                |
+--------------------------------------------------------------------------------------------------+
| WHAT DECIDED THE RANK (deterministic deltas, from SiteMathStrip)                         [Trace] |
|  Factor               Site A     Site B     Δ                                                    |
|  Buildable BSF        41,200     18,900     largest swing                                        |
|  Entitlement risk     32         58                                                              |
+-----------------------------------------------------+--------------------------------------------+
| MAP (40%): lot polygons, zoning, OZ shading,         | THIS WEEK ON YOUR SHORTLIST                |
| active filings within 500 ft; click lot = select     | new NB 400 ft from Site A (DOB NOW) LIVE   |
+-----------------------------------------------------+--------------------------------------------+
```

Changes:
- **Active-construction and occupancy guards appear on the card.** These are the visible output of the engine guards that fix the 175 3rd St class of error (`direction.ts:47-81`; `05_product_roadmap.md` 30-1).
- **"Confidence" on the screening score is renamed "Site score."** One vocabulary per lens (`site-screening.ts:204-250`).
- **Land residual is a first-class row.** It reads "enter your inputs" (USER-PROVIDED provenance) until the residual engine exists. It never shows a representative pro forma as if it were the answer.
- **Ranking is progressive.** Remove "Complete. Waiting for the other sites" (`SiteComparison.tsx:338`).
- **Map is demoted.** It moves below the decision at 40% width and frames the lots tightly, so lots are visible (`KoanoMap.tsx:390-402`).
- **Free-run warning.** On a free account: "Comparing 3 sites uses all 3 of your free runs. Run 1 site first?"

### 4.2 Acquire lens (Cluster 5, Portfolio)

```
+--------------------------------------------------------------------------------------------------+
| PORTFOLIO  84 assets  [Import CSV or paste BBLs]  [Add]          Week of Oct 19   [Briefing ⬇]   |
+--------------------------------------------------------------------------------------------------+
| THIS WEEK                                                                                        |
|  3 assets changed risk band | 7 new material events | 2 verdicts flipped | 1 data gap ⚠          |
|  [list ▸]                   | [list ▸]              | HOLD→WAIT (2) [why]| HPD fetch failed      |
+--------------------------------------------------------------------------------------------------+
| ASSETS (dense, sortable, deltas first)                                                           |
| Asset          Units  Verdict  Δwk   Risk Δ   Stabilized  Owner network  Prov   Actions          |
| 780 St Marks   66     HOLD 71  =     44  +4   est. yes    13 bldgs  ▸    LIVE   [IC memo ⬇]      |
| ...            multi-select → [Portfolio risk report ⬇]                                          |
+-----------------------------------------------+--------------------------------------------------+
| RISK CONCENTRATION MAP (pins by band)         | ARCHIVE TREND for selection (honest gaps shown) |
+-----------------------------------------------+--------------------------------------------------+
```

Changes:
- **"This week" becomes the hero.** Built from `MonitoringFeed` + `RiskMonitor`. The map moves from first position (`Cluster5Dashboard.tsx:121`) to supporting evidence.
- **Data gaps are news.** A `fetch_failed` is a first-class tile for an institution.
- **Mount the missing documents.** `DocumentButton` for `ic_memo` (PDF and DOCX) per asset, and `portfolio_risk_report` for a selection (`Cluster5Dashboard.tsx:205-246`).
- **Units, stabilized estimate and owner network become columns.** They need the multifamily pack (07/08 comps, HPD contacts by head officer, rent stabilization), see the roadmap. Until those exist, the columns render as "not covered" with the feed named.
- **CSV and BBL import.** Paste or upload a list into Portfolio.

### 4.3 Price lens (Cluster 2, Transaction)

```
+--------------------------------------------------------------------------------------------------+
| 425 6th St, Brooklyn 11215 · 2-family · 2,150 sf · 1899     [Watch] [Letterhead: set ✓]          |
+--------------------------------------------------------------------------------------------------+
| SUGGESTED LIST RANGE              | MARKET TIMING              | CLIENT DOCUMENTS                 |
| $2.48M to $2.71M                  | HOLD · conf 74 · 12 mo     | [CMA p.1 thumbnail]              |
| 10 recorded sales, same pool for  | [why]                      | CMA  PDF | DOCX   [Generate]     |
| band and midpoint · LIVE (DOF)    |                            | [Pricing sheet] [Net sheet]      |
| [Trace]                           |                            | [Neighborhood report]            |
+-----------------------------------+----------------------------+----------------------------------+
| COMPS (table left, map right, linked hover)  [include/exclude → deterministic recompute]         |
+--------------------------------------------------------------------------------------------------+
| EARLY SIGNALS · VELOCITY STRIP (one row of sparklines)                                           |
+--------------------------------------------------------------------------------------------------+
```

Guardrail: for co-op (D4, C6, C8) and condo (R-class) subjects, or buildings with 7 or more units, the range block reads "No unit-comparable valuation available: recorded co-op and condo sales carry no unit area in DOF data. Enter unit square footage or connect your MLS." It never prints a building-area value (`pricing-sheet.ts:71-90`; `panel/user_roleplay.md` problem 1).

Changes:
- **Replace the CMA tile.** Swap the "Not yet available" tile for `DocumentButton docType="cma" formats={["pdf","docx"]}` (`Cluster2Dashboard.tsx:243-262`).
- **Prompt for letterhead inline.** The first client document opens an inline letterhead sheet instead of sending the user to Settings.
- **Recompute the CMA math on one pool.** Band edges, midpoint and the HPI adjustment must come from the same comp pool, and the subject is excluded from its own comps (`cma.ts:73-79`).
- **Fix the verdict position.** The verdict moves into the band at the top; it currently renders eighth (`Cluster2Dashboard.tsx:175-330`).
- **Fix the recent-verdict check.** Repair `hasRecentVerdict` (`Cluster2Dashboard.tsx:220-226`).

### 4.4 Property lens (Cluster 1, Community)

Two personas share this lens, so it opens with a choice: "I own this home" or "I rent here." The renter example uses the real figures the role-play pulled from NYC Open Data for 25 MacDonough St (`panel/user_roleplay.md` Persona 4); the owner-network count is illustrative.

```
+--------------------------------------------------------------------------------------------------+
| 25 MacDonough St, Brooklyn · 19 units · BBL 3-01851-0063   [I rent here ▾]  [Watch this building] |
+--------------------------------------------------------------------------------------------------+
| WHAT KOANO FOUND (plain sentences, deterministic, every line Traceable)                           |
|  ! 364 open HPD violations, 123 of them class C (immediately hazardous)   LIVE (HPD)            |
|  ! HPD has brought 11 cases against this owner, including 1 harassment case LIVE (HPD litigation)|
|  ! Was in the Alternative Enforcement Program in 2018 (836 B/C at entry)   LIVE (HPD AEP)       |
|  ✓ Registration status and managing agent history                          LIVE (HPD)           |
+--------------------------------------------+-----------------------------------------------------+
| WHAT YOU CAN DO                            | OWNER NETWORK (by head officer, not name match)    |
| [Building record ⬇] [Violation history ⬇]  |  13 buildings · violations trend ▲ · AEP history   |
| How to file an HP action ▸ · Call 311 ▸    |  every edge sourced                                 |
+--------------------------------------------+-----------------------------------------------------+
```

Changes:
- **No investor verdict as the headline for renters or homeowners.** The investor verdict sits in a collapsed "Investor view" only when the owner path is chosen. `VerdictCard` gets a `lens` prop.
- **Add the renter findings.** Add HPD litigation (`59kj-x8nc`), AEP and CONH flags. Fix the copy saying court data is not public (`for/community/page.tsx:49-54`).
- **Owner path.** The tax appeal packet is the primary CTA when the deterministic over-assessment rule fires. Make it class-aware and show filing deadlines (`panel/legal_trust.md` Risk 11).
- **Owner network rules.** Merge by HPD registration contact and business address, never by an individual's name alone (`nyc-landlord.ts:192-201`).
- **Resident-composition statistics are not shown in this lens.** That covers income, education and any "gentrification" language (`panel/legal_trust.md` Risk 2).

### 4.5 Mobile (390px) `MISSING`

```
+------------------------------+
| KOANO     [🔍]        [≡]    |
| 425 6th St · confirmed ●     |
+------------------------------+
| VERDICT BAND (compact)       |
| HOLD · conf 74 · 12 mo [⤵]   |
| 31 live · 4 not covered      |
+------------------------------+
| [ Generate CMA ]  sticky     |
+------------------------------+
| Comps (swipe cards) LIVE     |
| Early signals (3)        ▸   |
| Sources & coverage       ▸   |
+------------------------------+
| [Home][Search][Watch][Docs]  |
+------------------------------+
```

The evidence sections become drill-in rows. Provenance badges remain on every figure. Trace works by long-press.

---

## 5. Component and token specs

### 5.1 Color tokens (AA fixes, palette family unchanged) `PARTIAL`

The design engineer computed every provenance badge state and the BUY and WAIT verdict words at 1.99 to 2.77:1 on white, and found `--ink-faint #8AABB8` used for text 119 times at 2.44:1 (`panel/design_engineer.md` §2.1). The fix keeps the Coastal Intelligence hues and adds AA "ink" variants for text:

| Token | Use | Rule |
|---|---|---|
| `--ink-faint` | Decorative rules and borders only, never text | Lint rule: no `color: var(--ink-faint)` |
| `--ink-muted` (#5A7A8C) | Smallest permitted secondary text | Must be ≥4.5:1 on white at ≤14px; darken one step if it measures below 4.5:1 |
| `--signal-positive-ink`, `--signal-warning-ink`, `--signal-negative-ink` | Verdict words and badge text | Darker variants of the existing signal hues tuned to ≥4.5:1. Fills and dots keep the current hues |
| Badge pattern | Every provenance state | Dot in the state hue plus label in its ink variant plus a non-color cue (solid, dotted, hatched, dashed, cut) so state is never color-only |

The logo is excluded from all token changes and stays in its original blue.

### 5.2 Spacing, type scale and motion

- **Spacing.** A 4px base scale: 4, 8, 12, 16, 24, 32, 48, 64. Replace the 1,107 inline `style={{` blocks progressively with Tailwind classes on this scale, and remove the attribute-selector mobile overrides in `globals.css:326-603` as each component is migrated.
- **Type hierarchy inside the dashboard** (families unchanged):

| Element | Size | Notes |
|---|---|---|
| Verdict word | 56px | |
| Subject address | 24px | |
| Section heading | 16px, weight 500 | |
| Body | 14px | |
| Data | 13px mono | |
| Micro labels | 11px | Floor; nothing below 11px (charts currently use 9px labels) |

- **Motion tokens.**
  - `--dur-fast`: 120ms
  - `--dur-ui`: 220ms
  - `--dur-content`: 300ms
  - `--dur-draw`: 320 to 500ms
  - Easing: `--ease-out`
  - Every animated component honors `prefers-reduced-motion`.

### 5.3 Panel state contract `PARTIAL`

Every evidence panel implements four explicit states, and none of them may masquerade as another:

| State | Visual |
|---|---|
| `loading` | Skeleton with the source name ("Reading NYC DOB…") |
| `ready` | Data with its provenance badge |
| `empty` | "No records" stated as a fact, with source and date ("0 open violations, HPD, 2026-10-19") |
| `absent` | The provenance state (`fetch_failed` with retry, `coverage_absent` with the feed named) |

Today panels show "Unavailable" while loading, which misstates provenance in the UI (`MarketVelocityPanel.tsx:68`, `CmaBuilder.tsx:23`, `Cluster1Dashboard.tsx:198`).

### 5.4 Accessibility `MISSING` to `PARTIAL`

- Add a global `:focus-visible` ring: 2px `--deep-navy` with a 2px offset. Remove `outline: none` from `AddressInput.tsx:46`.
- Use one `aria-live="polite"` region for agent completions and an `assertive` one for the decision.
- Charts get `role="img"` with a text summary plus a data-table alternative. Map pins become keyboard reachable.
- Keyboard shortcuts:
  - `/` focuses search
  - `⌘K` opens the command palette (run, compare, open history, generate document)
  - `T` toggles Trace
  - `J` and `K` move through ledger rows

### 5.5 Documents (PDF and DOCX)

- **White-label mode for client-facing types** (CMA, client neighborhood report, net sheet, pricing sheet):
  - no KOANO mark in `LetterheadBlock` (`pdf.tsx:251-262`)
  - no KOANO paragraph in `docx.ts:66,75`
  - PDF `author` set to the preparer
  - the disclaimer kept, with the preparer as the responsible party
- **Letterhead.** Suppress the letterhead entirely when the profile is empty. No "Analyst Name / KOANO Capital Partners."
- **Verification link.** Non-white-label documents carry a verification link to `/v/{id}`. White-label documents can verify on the brokerage's own domain later (`panel/gtm_pricing.md` §5.4).
- **Typography pass.** Numeric alignment, proper minus and multiplication symbols, hyphenation off in tables.

---

## 6. The first five minutes (activation redesign)

From `panel/product_designer.md` §5, adjusted for the engine fixes:

| Time | Step |
|---|---|
| 0:00 | **Homepage.** A live address box in the hero. A matching address returns a recorded, sealed sample verdict, which must be a sample that survives a DOB NOW and ACRIS check (not 175 3rd St). Any other address shows its resolved lot outlined on a map with "Create an account to run five agents on BBL x." |
| 0:30 | **Signup.** One-tap signup, with the role question folded in as four chips. No separate onboarding page. |
| 0:45 | **First run.** The dashboard opens on the typed address in the right lens, already running the Bench. |
| 2:15 | **Verdict.** The decision lands in the verdict band. The provenance summary is inline, and the Trace hint is shown once. |
| 2:30 | **Document.** The primary CTA is the persona's document as a first-page preview. On free, this is a watermarked preview or one full document, per the decision in `07_kill_list.md` #8. Secondary CTA: "Watch this property," with a sample of the alert. |
| 5:00 | **Activation.** The session ends with something saved: a watched subject or a generated document. That is the activation event to instrument; PostHog is not wired today. |

---

## 7. Files to change (index)

| Area | Files | State |
|---|---|---|
| Bench and decision event | `lib/agents/synthesis.ts`, `lib/providers/progress.ts` (new), `src/app/api/agents/stream/route.ts`, `useVerdictStream.ts`, `ui/Bench.tsx` (new), `LoadingState.tsx` (retire) | MISSING |
| Trace | `ui/trace/*` (new), `VerdictCard`, `VerdictMathPanel`, `DivergingBar`, `ScoreBands`, `ProvenanceLedger`, `ReasoningChain`, `KoanoMap` | MISSING |
| Shell, URLs, search, usage meter | `DashboardShell.tsx`, `Sidebar.tsx`, `src/app/p/[bbl]`, `src/app/v/[id]`, `AddressInput.tsx`, `CandidatePicker.tsx`, `/api/usage` (new) | MISSING |
| Missing documents | `Cluster2Dashboard.tsx:243-262`, `Cluster5Dashboard.tsx:205-246`, `DocumentButton.tsx:71-75`, `UpgradeProvider.tsx`, `UpgradeScreen.tsx` | EXISTS server-side, MISSING in UI |
| Watch everywhere | `Cluster1Dashboard.tsx`, `Cluster2Dashboard.tsx`, `SiteComparison.tsx` via `POST /api/properties` + `PATCH /api/monitoring` | MISSING |
| AA tokens and focus | `globals.css`, `tailwind.config.ts`, `ProvenanceBadge.tsx`, `ui/verdict.ts:37-68`, `AddressInput.tsx:46` | PARTIAL |
| White-label documents | `lib/documents/render/pdf.tsx`, `docx.ts` | PARTIAL |
| Lens copy and numbering | `clusters.ts`, `OnboardingClusters.tsx`, `UpgradeScreen.tsx`, `PricingContent.tsx` | PARTIAL |
| Valuation guardrails | `pricing-sheet.ts`, `net-sheet.ts`, `cma.ts`, `ValuationPanel.tsx` | PARTIAL (bug) |
| Renter findings | `Cluster1Dashboard.tsx`, new provider for HPD litigation, AEP and CONH | MISSING |

---

## 8. Beating Diald on the dashboard, specifically

From `02_competitors.md` (screen by screen, Diald 9, KOANO 5, split 2). Diald's wins are features (pro forma, upload, chat, Excel, sharing, national data). KOANO's wins are architectural (deterministic math, per-figure provenance, coverage map, multi-site ranking, NYC entitlement depth, monitoring). To win the comparison decisively, ship in this order:

1. **The verdict band plus the Bench plus Trace.** These make KOANO's architectural wins visible within the first ten seconds. Diald's demo shows a confidence score that does not move when IRR collapses; KOANO's verdict visibly moves with its inputs.
2. **A deterministic land residual and returns block** with user inputs. It closes Diald's biggest win honestly, labeled USER-PROVIDED, and later fed by partner data.
3. **OM upload reconciled against the NYC public record** ("the OM says 42 units, HPD says 38"). Diald reads OMs; KOANO checks them.
4. **Excel export of every table and the residual.**
5. **A chat that can only answer from the sealed verdict and cannot contradict it.**
6. **The shareable `/v/{id}` permalink**, the viral loop Diald runs through its free tier, with replay attached.

Diald's national coverage is not matched by fabricating anything. KOANO answers it with the coverage map and BYO-credential partner connectors under `partner` provenance (`02_competitors.md` "what KOANO must ship").
