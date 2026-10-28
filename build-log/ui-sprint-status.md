# UI sprint status

All six workstreams are built, reviewed and committed on `ui-sprint` (never pushed; never merged to main). The authoritative summary is `build-log/ui-sprint-report.md` (A1 to A19 with before and after screenshots, the acceptance criteria, the final independent review's findings and resolutions, the open items). Per-workstream plans, reports, diffs and capture sets are in `build-log/ui-ws-N*`.

## Open from the last session
- The confirming capture after the final-review fixes (commit 1d1b26a) crashed on the dev server (both `scripts/ui/ws5-trace.mjs` and the homepage `shots.mjs` run exited with a Node error before writing files; the server itself answered 200 afterwards). Re-run both into `build-log/ui-ws-6/after/` and attach the paths to the sprint report's final review table. Until then the report says those fixes are gated but not re-captured.
- `build-log/ui-ws-*/wip/` folders are working captures and are intentionally not committed.

## Founder items (blockers.md)
- Supply the 4:5 mobile render set (`public/renders/mobile/<name>.webp`); `node scripts/ui/render-manifest.mjs` lists what is present; flip `mobile: true` per entry in `src/components/marketing/renders.ts`.
- Set `KOANO_SHARE_SECRET` in Vercel (sealed-record share links).

## Local environment
- `.env.local` `KOANO_DAILY_RUN_CAP` was raised to 120 for the capture runs (dev server only, gitignored); `KOANO_SHARE_SECRET` was generated locally. The dev server runs on port 3000 (`build-log/dev-server.log`).
- Test user, storage state and harnesses: `scripts/ui/*.mjs` (`shots.mjs`, `dash-shots.mjs`, `ws2-interactions.mjs`, `ws3-interactions.mjs`, `ws4-interactions.mjs`, `ws5-bench.mjs`, `ws5-trace.mjs`, `ws5-share.mjs`, `render-manifest.mjs`); `scripts/ui/gate.sh` is the pre-push gate.
