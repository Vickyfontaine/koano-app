# UI sprint, workstream 5: product feel

Scope (sprint row 5): the Bench (three small stream events from the existing run, decision before narration), Trace on the verdict and the ledger, the CMA, IC memo and portfolio risk report buttons wired to the existing document engine, a shareable verdict page. Depends on WS3's band and drawer and WS4's primitives.

Baseline: `build-log/ui-ws-4/after/`. After: `build-log/ui-ws-5/after/`.

## Rules held

- The decision surface and the fixture do not move: the new stream events are additive progress events emitted around calls the cassette already records, never a change to an agent's inputs or to the narrator's prompt. `scripts/test-fixture.ts` replays byte-identical.
- Nothing is simulated: every Bench event is a real pipeline completion; the needle sweeps only when the `decision` event arrives.
- Trace draws only from the `complete` payload (`weighting_breakdown`, `agent_summaries`, `data_points`); a history verdict without a stored evidence bundle says so instead of inventing one.
- The shareable page shows the sealed record as stored; it never re-runs and never shows figures that were not persisted.

## Slices

| # | Slice | Files | Closes |
|---|---|---|---|
| 1 | **Three stream events.** `agent_complete` carries the agent's signed `contribution`, its `data_point_count` and provenance counts (computed from the agent output the route already holds); a new `decision` event is emitted right after `aggregate()` and before the narrator (verdict, agent score, nudge and drivers, final score, per-agent contributions) through an `onDecision` callback on the pipeline; `narration_start` follows it. `useVerdictStream` keeps them in state. | `lib/agents/synthesis.ts` (callback only), `src/app/api/agents/stream/route.ts`, `useVerdictStream.ts`, `SubjectProvider.tsx` | product feel |
| 2 | **The Bench.** The band's running state becomes the Bench: five agent columns, each sealing with its verdict and a vote bar growing on the live rail (`DivergingBar`) as `agent_complete` lands; on `decision` the needle sweeps on `ScoreBands`, the nudge segment extends with its driver, the verdict word appears with "The decision above is computed and will not change"; the headline fills in on `complete`. Counters show real counts only. House easing, the timing tokens from the spec, reduced motion as opacity only. | `shell/VerdictBand.tsx`, new `shell/Bench.tsx`, `shell.css` | product feel |
| 3 | **Trace.** A `TraceProvider` in the shell; the band's Trace button and the `T` key toggle Trace mode. In Trace mode, hovering or focusing the verdict word, a figure, a vote row in the math tab or a ledger row shows the thread: verdict ← final score ← agent score and nudge (with the driver) ← the agents that moved it (× conf ÷ Σ) ← their cited data points ← source rows, rendered as a labeled thread panel; matching nodes highlight through shared `data-trace` ids while everything else dims to 35%. Line style per provenance in the thread (solid, dotted, hatched, dashed, cut). | new `ui/trace/{TraceProvider,TraceThread,graph}.tsx`, `VerdictBand.tsx`, `VerdictMathPanel.tsx`, `ProvenanceLedger.tsx`, `EvidenceDrawer.tsx` | product feel |
| 4 | **Documents wired.** The CMA button in Price (PDF and DOCX) replaces the "Not yet available" tile; the IC memo for the analyzed property and the portfolio risk report for the book in Acquire; each through `DocumentButton` and the existing `/api/documents` route. | `Cluster2Dashboard.tsx`, `Cluster5Dashboard.tsx` | product feel |
| 5 | **Shareable verdict page.** `/v/[id]`: the sealed record for one verdict (verdict word, headline, figures, agent summaries, the stored math when migration-023 is applied) with a link token (an HMAC of the verdict id with a server secret) so a share link works without an account and without a schema change; the owner's band gets "Share link". The page says what is not stored (the evidence bundle) instead of implying it. | new `src/app/v/[id]/page.tsx`, `src/app/api/verdicts/[id]/share/route.ts`, `lib/share.ts`, `VerdictBand.tsx` | product feel |
| 6 | Capture (the Bench mid-run and at the decision, Trace on and off, the documents, the share page at three widths), self-review, independent review, fixes, report, CLAUDE.md. | `build-log/ui-ws-5*` | |
