# Phase 0 report (branch `phase-0`)

Backend only, from the Phase 0 section of `KOANO_BUILD_SPEC.md`. One commit per slice, the gate green on each. Live analyses used: 2 of 10 (Chicago acceptance, one full fixture re-record), plus four single model calls in surgical fixture re-records.

| Slice | Commit | Result |
|---|---|---|
| 1. Same inputs, same decision | `724526c` | Cause: the model varies at temperature 0. On 425 6th St (41 runs on 2026-10-23), Demand Sentiment flipped HOLD and WAIT, which moved confidence between 69 and 79; conviction bands added a point either way. Fix: `completion-memo.ts` reuses the first completion for an exact request (in-process, and shared once migration-024 is applied). Proof: `scripts/test-determinism.ts`, in the gate. With the memo off, two runs differ in 21 fields; with it on, six runs are byte-identical. |
| 2. No em dashes | `58b4ddb` | A prompt rule in the narrator, narrative and briefing, plus the `withoutEmDashes` guard on all model prose. `scripts/test-em-dash.ts`, in the gate. Surgical re-record; the decision is byte-identical. |
| 3. DOB NOW job filings (w9ak-ipjd) | `db7ca78` | New Building and Full Demolition jobs. An active job on the subject feeds the construction guard; tract counts exclude the subject, as do the permits counts. 175 3rd St: New Building job B00680917 (Approved, 2026-04-10). Surgical re-record: Infrastructure confidence 82 to 85; HOLD 68 unchanged. |
| 4. Landmark status | `f5c7eaa` | MapPLUTO LPC fields feed a new `landmark` guard. Verified on 55 Wall St, a historic-district lot and 175 3rd St. Surgical re-record: risk 54 to 53, from sample variance in the re-recorded regulatory call. |
| 5. Supabase error returns | `6295745` | Webhook (throws, so Stripe retries), documents audit, monitor and archive runs, digest, scan. `scripts/test-supabase-errors.ts`, in the gate. |
| 6. Acceptance | this commit | Co-op: PASS. 78 8th Ave (D4) prints "No unit-comparable valuation available" (`build-log/phase-0/coop-78-8th-ave-pricing-sheet.pdf`). Chicago: BLOCKED. See below. Fixture: replay green on the reviewed surgical re-records. |

## Acceptance details

- **Chicago: blocked.** The pipeline ran (89 s). Saving the verdict failed with `verdicts_overall_provenance_check`. The Supabase project in `.env.local` does not have migration-023: `weighting_breakdown` is missing and the two-state constraint is still there. Evidence: `build-log/phase-0/chicago-verdict.json`. Apply 023 to that project (or tell me which project it went to), then rerun `npx tsx scripts/acceptance-phase0.ts chicago`. That is one live analysis.
- **Fixture.** A full live re-record (`build-log/phase-0/full-rerecord-diff.txt`) moved confidence 68 to 58 through the same Demand Sentiment flip, plus a month of newer permits. I kept the reviewed surgical fixture rather than commit that sample.

## Needs the founder

- Apply migration-023, then migration-024 (`agent_completion_memo`).
- A Develop-lens label for the new `landmark` guard (copy). `SiteCards` prints the key until then.
