# Overnight report (2026-10-28 to 29)

Part A is on `ui-sprint`; Part B is on `phase-0`, rebased onto `ui-sprint`. Both are pushed and neither is merged. Heroes, hero images, render slots and the mobile image code path were not touched.

**Previews:**
- `ui-sprint`: https://koano-ebnyw80y1-vickyfontaines-projects.vercel.app
- `phase-0`: https://koano-ci4wlk894-vickyfontaines-projects.vercel.app

## Part A (`ui-sprint`)

| Item | Commit | Result |
|---|---|---|
| Layout system outside the heroes | `1b9301c` | 16/48/20/12/24 spacing, 20px panels on phones, Acquire table fade and "Scroll →". |
| Text fit | `aad7c2e` | 1,659 findings fixed. 0 left across 105 runs (21 pages and lenses × 5 widths). No type shrunk, no copy changed. |
| Cleanup | `bcc877e` | Spec renamed and tracked; ignores added; foundation captures untracked (kept locally); video/ source tracked; logs reverted. |
| Final captures and report | `6105717` | `build-log/final/`: every page and lens at 390, 768 and 1440. The sprint report has a post-sprint section. |

## Part B (`phase-0`, see `build-log/phase-0-report.md`)

| Slice | Commit | Result |
|---|---|---|
| Same inputs, same decision | `3425235` | Cause: Demand Sentiment flips HOLD and WAIT at temperature 0, which moves confidence between 69 and 79. A completion memo fixes it; an offline proof is in the gate. |
| No em dashes | `59a7e03` | Prompt rule, guard and test. Fixture byte-identical. |
| DOB NOW job filings | `64ee32d` | Feed the construction guard; the subject lot is excluded from neighbourhood counts. |
| Landmark status | `d0d66cc` | A new `landmark` guard from MapPLUTO's LPC fields. |
| Supabase errors | `48d4f05` | Webhook, documents audit, monitor and archive runs, digest and scan all check their errors; tested in the gate. |
| Acceptance | `e16a219` | Co-op: PASS. Chicago: BLOCKED (below). Fixture: green on reviewed surgical re-records. |

Live analyses used: 2 of 10.

## Blocked
- **Chicago acceptance.** The Supabase project in `.env.local` does not have migration-023: there is no `weighting_breakdown` column, and the old provenance check rejects `coverage_absent`. The verdict ran but could not be saved.

## Copy to trim
None. `build-log/copy-to-trim.md`.

## Needs you
1. Apply migration-023 to the `.env.local` project (or tell me which project it went to). Then run `npx tsx scripts/acceptance-phase0.ts chicago` on `phase-0`, which is one live analysis.
2. Apply migration-024 (`agent_completion_memo`). Until then the memo only holds within one server instance.
3. Write a Develop-lens label for the new `landmark` guard. It is copy; `SiteCards` shows the raw key until then.
4. Review both previews. Merging is your call.
