# UI sprint, workstream 6: concept page and final pass

Scope (sprint row 6): `/vision` for radar, sentence-to-building, ownership graph and track record, labeled "Concept preview" on recorded sample data; the mobile render set dropped in when supplied; full QA with screenshots of every page and cluster at 390, 768 and 1440; A2 (final) and everything re-verified.

## Rules held

- `/vision` is the only place a future feature appears, and every section carries the "Concept preview" label and the recorded-sample note; the page claims nothing as live and offers no run. Sample data is the recorded 175 3rd St run (labeled) and the book's recorded verdicts; nothing is invented beyond what the labels say is illustrative.
- `/vision` is reachable from the marketing footer only (not the product nav), so the live product never implies the concepts exist.
- The mobile render set is a founder asset; the drop-in is a one-line change per render in `renders.ts` (`mobile: true`) once the files exist in `public/renders/mobile/`. Until then the temporary layout stands and the report says so.

## Slices

| # | Slice | Files | Closes |
|---|---|---|---|
| 1 | **`/vision`.** A marketing-styled page (Nav, Footer, the same tokens) with a "Concept preview" banner and four sections, each a static concept render in HTML/CSS on the recorded sample: Radar (the five agents' signals for the recorded run as a radial chart of real figures), Sentence-to-building (a typed sentence resolving to the recorded lot and its stored figures), Ownership graph (the recorded run's registered-owner portfolio as a node graph, counts only), Track record (the calibration idea on the real append-only history: the verdict count and directional outcomes the archive will record, with "not yet measured" where nothing exists). Every section: "Concept preview. Not in the product." | new `src/app/vision/page.tsx`, `src/components/marketing/VisionContent.tsx`, `Footer.tsx` (one link) | sprint |
| 2 | **Mobile renders.** `renders.ts` flips `mobile: true` for any render present in `public/renders/mobile/` (checked at build via a manifest script); none are present today, so this slice documents the drop-in and leaves the temporary layout. | `renders.ts`, `scripts/ui/render-manifest.mjs` | A2 (final, blocked on the asset) |
| 3 | **Full QA.** Every marketing page (including `/vision`), login and signup, and all four lenses in empty, running and done states at 390, 768 and 1440; the WS2 to WS5 interaction scripts re-run; one final independent review of the whole sprint; fixes; `build-log/ui-sprint-report.md` with A1 to A19 and every acceptance criterion checked against screenshots. | `build-log/ui-ws-6/`, `build-log/ui-sprint-report.md` | everything |
