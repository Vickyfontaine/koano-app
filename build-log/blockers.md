# Blockers (founder action needed)

| # | Item | Why it is blocked | What to do |
|---|---|---|---|
| 1 | Mobile render set (founder asset task in `KOANO_UI_SPRINT.md`) | The six 4:5 mobile renders in the diorama house style do not exist yet. | Generate per the spec table; drop into `public/renders/mobile/` with the names listed in `build-log/ui-ws-2-report.md`. The `<picture>` art direction is wired and falls back to the desktop render placed below the headline. |

## Set `KOANO_SHARE_SECRET` in Vercel (WS5)

Share links for sealed verdict records are HMAC-signed with `KOANO_SHARE_SECRET` (set locally in `.env.local`; falls back to `CRON_SECRET` when unset). Set a dedicated value in Vercel so a rotation of the share secret never touches the archive cron. Links are deterministic per verdict id: a leaked link can only be revoked by rotating the secret, which invalidates every link.
