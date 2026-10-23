# UI sprint, workstream 5 report: product feel

Branch `ui-sprint`. Commit 69fd34a (slices 1 to 5) plus the review-fix commit. Gate green; the verdict fixture replays byte-identical (the new stream events are additive and emitted around calls the cassette already records).

Baseline: `build-log/ui-ws-4/after/`. After: `build-log/ui-ws-5/after/interactions/` (the Bench while the agents read, at the decision before any prose, and done, at 1440 and 390; Trace on the verdict, on a vote row in the drawer and on a ledger row, at 1440 and 390; the wired documents section; the sealed record page signed out at 1440, 768 and 390 and signed in; `bench-checks.json`, `trace-checks.json`, `share-checks.json`, the three console files).

## What changed

- **Three stream events.** `agent_complete` carries the agent's signed contribution (confidence × direction, the breakdown's own arithmetic) and its figure counts; `decision` is emitted the moment `aggregate()` returns, before the narrator is called, with the verdict, confidence, risk, window and the full breakdown; `narration_start` follows. `useVerdictStream` keeps the decision; the shell's run carries it.
- **The Bench.** The band's running state: five agent columns that seal when their real verdict lands (verdict, confidence, figures read, how many live), a live vote rail of the raw signed votes on a fixed scale, and on the decision event the needle sweeps on the score bands, the verdict word appears with "The decision above is computed and will not change" while the narrator writes. Counters show the elapsed time, agents in, figures read and live. Motion is the house easing on the marks (needle 500ms, vote bar 400ms, seal 240ms); reduced motion clamps globally; no event is delayed for choreography.
- **Trace.** The band's Trace button or the T key (never while typing) turns Trace on; hovering or focusing the verdict word, the figures, a vote row in the Math tab or a ledger row in the Sources tab shows the thread: verdict, final score (with the nudge and its drivers), the agents that moved it (direction × conf ÷ Σ), their cited figures with sources; a ledger row traces in reverse up to the verdict. Nodes on the thread highlight through shared `data-trace` ids; everything else dims to 35%. The thread is built only from the complete payload; a run without a stored breakdown says so.
- **Documents wired.** The CMA (PDF and DOCX) replaces the "Not yet available" tile in Price; the Investment Committee Memo (PDF and DOCX) for the analyzed property and the Portfolio Risk Report for the book in Acquire, all through the existing document engine.
- **Shareable sealed record.** `/v/[id]` renders the stored verdict as stored (verdict, figures, headline, the five votes and headlines, the reasoning chain and minority signals, the persisted math when migration-023 is applied, else the math rebuilt from the stored votes and labeled so) and says what is not stored (the per-figure ledger and the coverage map). A share link is the id plus an HMAC under `KOANO_SHARE_SECRET` (falling back to `CRON_SECRET`); the owner's band offers "Share link"; a bad or missing token is a 404.

## Evidence

| Claim | Evidence |
|---|---|
| Decision lands before the narration and matches the final verdict | `interactions/bench-checks.json`: decision at 29s, done at 56s, decision word equals the done word; `interactions/bench-decision-1440.jpg`, `bench-decision-390.jpg` |
| Columns seal on real events, counters are real counts | `interactions/bench-reading-1440.jpg` (1 of 5 in, 10 figures read) |
| Trace thread, highlight and dimming | `interactions/trace-verdict-1440.jpg`, `trace-agent-drawer-1440.jpg`, `trace-ledger-drawer-1440.jpg`, `trace-verdict-390.jpg`; `trace-checks.json` (10, 11 and 4 segments; T toggles; typing T does not) |
| Documents wired | `interactions/documents-price-1440.jpg`, `documents-price-390.jpg` |
| Sealed record with and without an account; bad token 404 | `interactions/share-anon-1440.jpg`, `share-anon-768.jpg`, `share-anon-390.jpg`, `share-owner-1440.jpg`; `share-checks.json` |

## Self-review against the bar

(filled after the after set)

## Independent review and resolutions

(filled after the review)

## Not fully satisfied

- The thread is a labeled list with provenance-styled segments, not a line drawn across the page between the figure and its sources; the spec's drawn thread needs every component to expose anchor geometry and is a follow-on.
- `provider_result` events (each fact landing in its column) are not emitted; the columns show the agent's figure counts when it seals, not each fact as it arrives.
- The sealed record cannot show the per-figure ledger or the coverage map because the evidence bundle is not persisted (roadmap item 30-2).
