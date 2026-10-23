# Blockers (founder action needed)

| # | Item | Why it is blocked | What to do |
|---|---|---|---|
| 1 | Apply `supabase/migration-023-ui-sprint-integrity.sql` | This session has no SQL access to the Supabase project (no `psql`, no Supabase CLI, no management-API token; the service-role REST key cannot run DDL). The migration widens the `verdicts` and `documents` provenance CHECK constraints to all five states, adds `verdicts.weighting_breakdown`, and enables RLS on `contamination_cache` and `bps_cache`. Until applied: a non-NYC verdict still fails to persist (the pre-existing Phase 0 bug), and the stored verdict math falls back to the reconstruction from agent summaries (no nudge). | Run the file in the Supabase SQL editor, then redeploy. The code degrades gracefully either way. |
| 2 | Mobile render set (founder asset task in `KOANO_UI_SPRINT.md`) | The six 4:5 mobile renders in the diorama house style do not exist yet. | Generate per the spec table; drop into `public/renders/mobile/` with the names listed in `build-log/ui-ws-2-report.md`. The `<picture>` art direction is wired and falls back to the desktop render placed below the headline. |

## Set `KOANO_SHARE_SECRET` in Vercel (WS5)

Share links for sealed verdict records are HMAC-signed with `KOANO_SHARE_SECRET` (set locally in `.env.local`; falls back to `CRON_SECRET` when unset). Set a dedicated value in Vercel so a rotation of the share secret never touches the archive cron. Links are deterministic per verdict id: a leaked link can only be revoked by rotating the secret, which invalidates every link.
