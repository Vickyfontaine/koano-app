# UI sprint, workstream 1 report: correctness and tokens

Branch `ui-sprint`, commits `8dc02d5..` (see `git log --oneline main..ui-sprint`). Every slice was committed with the gate green (full isolated `next build`, which includes type-check and ESLint, plus the offline verdict-fixture replay). Document slices also ran `npm run test:docs`; the grounding slice ran `npm run test:grounding`.

Screenshots: `build-log/ui-ws-1/before/` (branch point) and `build-log/ui-ws-1/after/` (end of WS1), every marketing page and all four cluster dashboards in their empty, running and completed states at 390, 768 and 1440 (`<name>-<width>.png` full page, `<name>-<width>-fold.png` viewport). Rendered documents in `build-log/ui-ws-1/after/docs/` (every sample type as PDF; page-1 PNGs of the CMA, screening memo and portfolio risk report).

## What changed, by slice

| Slice | Commit | Change |
|---|---|---|
| 1 | `f8c8128` | Design-token layer (spacing, type scale with an 11px floor, one radius per nesting level, motion tokens, reduced motion, global focus ring, `--font-mono`), AA ink tokens, flat disabled buttons; the screenshot harness and gate script; migration-023 written. |
| 2+3 | `6b9269c` | Token sweep through every component (mono family, 9/10px to 11px, off-scale sizes, hard-coded radii, 4px spacing, `outline:none` removed, decorative section numbers); text set in `--ink-faint` moved to `--ink-muted`; `ProvenanceBadge` with ink labels and a glyph per state; `VERDICT_COLORS` (ink) split from `VERDICT_FILLS` (hue). |
| 4 | `99fabc1` | "Recorded example run, August 2026. Illustrative of how the engine reasons." on every marketing appearance of the 175 3rd St run; LIVE wording and badge out of the replay; the invented "Buy 87" card on /intelligence replaced by the recorded run; em dash removed from the recorded driver; link text to `--mid-blue-ink`. |
| 5 | `5c62286` | Construction and occupancy guard on the FAR nudge; `aggregate()` takes the subject address; `structural_guard` on the breakdown. Surgical fixture re-record, reviewed diff: BUY to HOLD, nudge 1 to 0, driver names the guard; every agent band, confidence and risk unchanged. |
| 6 | `4f32521` | Valuation guardrail (co-op, condo, 7+ units) across five document builders and two panels; one comp pool with the subject excluded for band, midpoint and HPI adjustment; Exhibit B gets a true sum row, the score as a quotient, and the nudge when stored. |
| 7 | `0066498` | Verdict math persisted with each verdict (deploy-safe fallback), read back in history and the IC memo; five-state provenance typing in the history API. |
| 8 | `996cbc0` | Education and household income removed from Demand Sentiment; no gentrification stage; banned-language gate in grounding with tests. Surgical re-record, reviewed diff: demand confidence 74 to 73 (two fewer inputs), total weight 391 to 390, rolled-up confidence 69 to 68; verdict and all other agents unchanged. |
| 9+10 | `ccc325a` | Crime classified by offense (UCR Part I split) with a like-for-like year-to-date window; the seven NYC providers return `data:null` under `fetch_failed` (the Brooklyn-flavored stand-ins are deleted). |
| 11 | `4a29adf` | White-label CMA, neighborhood report, pricing sheet and net sheet (no mark, paragraph or author); empty letterheads suppressed; hyphenation off; numeric columns right-aligned; ink-colored callouts; "Site score" in the screening memo. |
| 12 | (final WS1 commit) | CLAUDE.md v5.4; the 25 review fixes (below); third surgical fixture re-record. |

## Aesthetic problems closed in this workstream

| # | Status | Evidence |
|---|---|---|
| A12 | Closed for the token layer and the sweep. Adjacent cards share one 16px radius; dashboard and UI paddings and gaps are on the 4px scale; the dashboard type scale has an 11px floor (no 9px or 10px remains in `src/`); `'DM Mono', monospace` is no longer hand-typed. The remaining inline `style={{}}` architecture is migrated component by component in WS3 and WS4 as those surfaces are rebuilt. | `after/cluster_1-done-1440.png` (verdict card, math panel and the four evidence panels share a radius and rhythm); `grep -rn "fontSize: \"9px\|10px" src` returns nothing. |
| A16 | Closed. Badge labels and verdict words render in ink tokens (5:1 or better on white); every badge state carries a glyph; a global focus ring replaces the four `outline:none` inputs; `--ink-faint` is no longer a text color anywhere in `src/`. | `after/cluster_2-done-1440-fold.png` (Live badges), `after/cluster_1-done-1440.png` (HOLD word, ledger badges). Token contrast on white: `--ink-muted` 5.25, `--mid-blue-ink` 5.49, positive-ink 5.02, warning-ink 5.02, negative-ink 6.47. |
| A19 | Closed. No KOANO mark, DOCX paragraph or PDF author on the four client-facing types; empty letterhead suppressed; hyphenation off; numbers right-aligned; callouts in ink; "Site score". | `after/docs/cma.pdf.png`, `after/docs/pricing_recommendation_sheet.pdf.png`, `after/docs/site_screening_memo.pdf.png`, `after/docs/portfolio_risk_report.pdf.png`. |

Deferred, as planned: A1, A2, A4, A18 (WS2); A3 shell, A5, A6, A13, A14, A15 (WS3); A3 clusters, A7, A8 (enabled buttons still carry the raised shadow; disabled ones are now flat), A9, A10, A11, A17 (WS4).

## Phase 0 correctness items carried here

30-1 construction and occupancy guard (landmark status not fetched: Phase 0 data task), 30-4 valuation guardrails, 30-6 five-state constraints (migration written; apply = founder), 30-8 resident composition out plus the banned-language gate, 30-10 white-label, 30-14 crime labels and window, 30-17 Site score and persisted nudge, omission over fabrication in the seven NYC providers, RLS on the two caches (same migration). Not done: DOB NOW job filings as a new dataset (the sprint forbids new data sources; the guard reads the subject-lot permits already fetched).

## Review findings and resolution

The independent reviewer (a fresh subagent given the sprint file, the plan, the full diff and the screenshots) returned 25 findings: 8 major, 12 minor, 5 nits. Every one was fixed in the slice-12 commit except where noted; the fixture was re-recorded surgically once more (demand agent and narrator only) because finding 4 changed the demand prompt. Reviewed diff: demand risk band moderate to high (50 to 80) on the same frozen data, rolled-up risk 51 to 54; verdict HOLD, confidence 68 and every other agent unchanged.

| # | Severity | Finding | Resolution |
|---|---|---|---|
| 1 | major | `:focus-visible { border-radius: inherit }` reshaped pill buttons and inputs on keyboard focus. | Removed. |
| 2 | major | A16 sweep incomplete: `riskColor()` fill hues used as text in three panels; fill hues and `--ink-faint` as text in ternaries the first sweep missed (LoadingState, MonitoringSettings, RiskMonitor, ArchiveTrend and others). | Added `riskInk()`; a regex sweep moved every remaining `color:` ternary to the ink tokens. `grep` for fill hues or `--ink-faint` in a `color:` now returns nothing in `src/`. |
| 3 | major | The pricing sheet, CMA and net sheet used a subject-excluded trimmed pool median while the panels, property report, tax packet and one-pager used the provider's market median, so two surfaces on one property disagreed. | One shared `compPool()` (subject excluded, trimmed median, p25/p75) in `valuation-guard.ts`; every valuation figure (five builders, the Valuation and Pricing panels, the scatter reference line, the map legend) reads it. The provider median stays only on market-statistic tiles and is labeled "area median". |
| 4 | major | The demand prompt still asked the model to compare in-mover vs out-mover income as a "gentrification signal", and the banned list did not catch "higher-income households". | Prompt rewritten (migration read as purchasing power of the flow, never a description of movers); income-household regexes added to the banned list with tests; fixture re-recorded. |
| 5 | major | Co-op class list missing D0 (elevator co-op conversion) and duplicated in two files. | `COOP_CLASSES` (D0, D4, C6, C8) and `streetKey()` exported once from `direction.ts`; the guard imports them. |
| 6 | major | White-label documents still said "KOANO" in body copy (net sheet, pricing sheet) and in the provenance appendix. | Body copy of the four white-label builders and their sample models made brand-neutral; appendix rows and notes say "verdict" and "the engine". |
| 7 | major | "Recorded" badges still carried "Fetched live from the source" in `title`/`aria-label`; the recorded verdict-math dots said "Live". | `noteOverride` on the badge, `recorded` prop on `VerdictMathPanel`; the homepage uses both. |
| 8 | major | The hero chip for Demand Sentiment was "Median income $165K", the input slice 8 removed. | Chip reads "Mortgage denials 31.9%" (a real ledger row). |
| 9 | minor | Non-chosen band labels at 0.8 opacity fell below AA. | Opacity removed; weight alone differentiates. |
| 10 | minor | The hero replay loop and pulsing dot ignored `prefers-reduced-motion` (JS-driven). | `useReducedMotion()`: the finished state renders once, no pulse. |
| 11 | minor | Duplicate SVG pattern id per hatched badge; `aria-label` on a generic span. | `useId()` per mark; the pill has `role="img"`. |
| 12 | minor | Net sheet paired a pool median with the full-area sales count; trimmed-median comment did not match the code. | Prints the pool count; helper documented (10% trim from 10 sales). |
| 13 | minor | Two `streetKey` implementations. | One, see 5. |
| 14 | minor | Crime property regex matched "THEFT OF SERVICES". | Bare THEFT alternative dropped. |
| 15 | minor | Panels hardcoded "No unit-comparable valuation" for the multifamily case; tax packet still said "compare against the value above" with no value. | Headline follows `guard.kind`; the tax packet sentence is gated on a printed value. |
| 16 | minor | CLAUDE.md overclaimed that every inline value is a token. | Claim rewritten to what was done; the remaining inline sizes migrate as WS2 to WS4 rebuild each surface. |
| 17 | minor | Clerk `variables.borderRadius` set to a CSS var. | Literal `12px`; the login capture confirms rounded corners. |
| 18 | minor | Focus ring clipped inside horizontal-scroll table wrappers. | `.scroll-x` wrappers draw the ring inset. |
| 19 | minor | "01"-style class codes right-aligned as numbers; a long unbroken token could overflow with hyphenation off. | Leading-zero codes excluded from the numeric test; tokens over 24 characters may break after "/" or "-". |
| 20 | minor | /intelligence still said the demand agent reads "demographic change". | Copy updated. |
| 21 | nit | `--border-input` failed its own 3:1 comment. | `#6E8E9D` (3.49:1). |
| 22 | nit | Chip text moved to `--deep-navy` without a CLAUDE.md note. | Recorded in §10. |
| 23 | nit | Disabled primary label 4.27:1 on sky. | `--ink-secondary` (6.1:1). |
| 24 | nit | Garbled comment in `nyc-violations.ts`. | Rewritten. |
| 25 | nit | Migration not transactional. | Wrapped in `begin`/`commit`. |

Reviewer item "consumers of the seven providers must tolerate `data:null` under `fetch_failed`": checked by grep; no agent, builder or panel branches on `fetch_failed` and dereferences `data` (they all go through the same null path as `coverage_absent`).

Deferred by the reviewer as planned for later workstreams: glass hero card with illegible BUY chip (A4, WS2), glowing enabled buttons (A8, WS4), orphan Market Velocity tile (A11, WS4), mono microlabel titles (A7, WS4), mobile layouts (A1 to A3).

## Open items and blockers

- `supabase/migration-023-ui-sprint-integrity.sql` must be applied by the founder (`build-log/blockers.md`). Until then a non-NYC verdict still fails to persist and the history math is re-derived (and labeled as such).
- Landmark status is not among the guard's facts (no provider fetches it).
- The `≤` glyph cannot render in the built-in Helvetica the PDF engine uses; labels now say "within 2 mi" instead. A bundled brand font (not in the repo) would restore the symbol.
- The dev-instance Clerk banner ("Development mode") and its console warning appear in local captures only; they are not present on a production instance.
