# UI sprint, workstream 3 report: app shell

Branch `ui-sprint`. Commits 46b3381 (slice 1, shell), a27575b (slice 2, verdict band and evidence drawer), 6c75bfa (slice 3, global search), 1c19752 (slice 4, branded sign-in), plus the review-fix commit. The numbering cleanup (slice 5) landed inside slice 1. Gate (`scripts/ui/gate.sh`) green at every commit; the fixture untouched.

Baseline: `build-log/ui-ws-1/after/cluster_*` and its login/signup captures. After: `build-log/ui-ws-3/after/` (every lens in empty, running and done states at 390, 768 and 1440 through real analyses; login and signup; `dash-audit.json`, `audit.json`) and `build-log/ui-ws-3/after/interactions/` (lens sheet, watch sheet, search sheet, the band through a run, the evidence drawer on every tab at three widths; `checks.json` records the focus-trap and deep-link results; `console.json`). Diff: `build-log/ui-ws-3-diff.patch`.

## What changed

- **One shell (A3 shell, A5, A13, A14).** `DashboardShell` is a CSS grid: a top bar with the original blue logo, the global search, a plan tag and the account button; the lens navigation as a full sidebar at 1280 and up (plain lens names Develop, Acquire, Price, Property under "Lens", the lens's section links under "In this lens", then Watchlist, Documents, History, Settings), the same markup as a 64px icon rail from 768 to 1279 (labels hidden, `aria-label` and `title` kept), and a bottom tab bar (Home, Search, Watch, Documents) with a lens sheet below 768. One content width (`--content-max`) centered in the workspace. The C1 to C4 badges and 01/02/04/05 eyebrows left the app (dashboards, onboarding, upgrade, placeholder); `number` stays in `clusters.ts` for DOM ids only.
- **Verdict band and evidence drawer (A6).** `SubjectProvider` holds the registered run; each lens registers the stream it drives (Property and Price their run, Acquire the property being analyzed, Develop the top-ranked site or the first one running). `VerdictBand` is the first block of the workspace in every lens: no subject, resolving, the five agents reporting in, the verdict with confidence, risk and window plus a provenance summary counted from its own data points, or the error. `EvidenceDrawer` hosts the math, reasoning, sources and coverage as tabs in a right panel (full screen below 768), collapsed by default, deep-linkable by hash, focus-trapped, closed by Escape; the inline evidence blocks and the duplicate loading and error banners left the lens scroll.
- **Global search.** `GlobalSearch` in the top bar (Cmd/Ctrl+K) and as the phone Search sheet resolves through `/api/resolve-address`, lists recent subjects from the verdict history, shows disambiguation candidates in the dropdown, and hands the settled subject to the active lens: Property and Price run it, Develop fills the first empty site slot, Acquire adds it to the book. A confident match is passed as the raw address and a chosen candidate as the candidate; the server re-derives the lot.
- **Branded sign-in (A15).** `AuthShell` with the logo, a KOANO panel (approved tagline and the three promises) beside the Clerk card at 1024 and up, stacked on phones; the Clerk appearance on the tokens (16px card, 44px controls, `--border-input` boundaries, navy focus, AA inks).
- **Sheets.** `Sheet` is the one modal surface (bottom sheet on phones, right panel from 768): focus moves to the first content control, Tab cycles inside, Escape and the backdrop close it, focus returns to the opener. `WatchSheet` lists the monitored properties with their latest verdicts (designed loading and empty states).

## Items closed, with evidence

| Item | Status | Evidence |
|---|---|---|
| A3 (shell) | Closed | `after/cluster_2-done-390-fold.jpg` (bottom tabs, lens button, full-width band), `after/cluster_4-done-768-fold.jpg` (icon rail), `after/cluster_1-empty-390-fold.jpg` |
| A5 one content width | Closed | `after/cluster_*-done-1440-fold.jpg`: every lens fills the same `--content-max` column |
| A6 verdict first, same place | Closed | `after/cluster_{1,2,4,5}-done-1440-fold.jpg`, `interactions/band-done-390.jpg`, `interactions/drawer-*.jpg` |
| A13 one naming system | Closed | sidebar and lens sheet show plain lens names; grep for `section-number` in the dashboard tree finds none |
| A14 blue logo in the shell | Closed | `after/cluster_2-empty-1440-fold.jpg` top bar, `after/login-1440-fold.jpg` |
| A15 branded sign-in | Closed | `after/login-1440-fold.jpg`, `after/signup-390.jpg`, `after/login-768-fold.jpg` |

## Self-review against the bar

- Horizontal overflow: none at any width on any lens or state after the review fixes (the WS1 baseline overflowed on every phone capture; the first WS3 set had 23px on Development at 768 from the math strip's labels).
- Console: Clerk's development-keys notice and headless-Chromium GL messages only; the one 409 pair in the Acquire capture was the harness re-adding tracked properties (the harness now skips them).
- Focus: `checks.json` records first focus inside each sheet and the drawer, Tab staying inside, Escape closing, focus returning to the opener, the hash set on open and cleared on close.
- Targets: 44px on the lens buttons, tabs (48px), sheet rows, drawer tabs and the band's buttons on phones.
- Loading states: the band's resolving and running states, the watch sheet's and the search dropdown's skeleton rows; no "Unavailable" in the shell (the lens panels' `BlockError` is WS4, A17).

## Independent review and resolutions

The reviewer (a fresh subagent given the sprint file, the redesign spec's shell section, the plan, the diff and both capture sets, with its own Playwright checks and one live run) reported one blocker, eight material findings and nine minor ones.

| # | Finding | Resolution |
|---|---|---|
| 1 | Blocker: a searched subject re-fired on every lens switch, starting new paid runs and an Acquire add | Fixed: the handling lens consumes the subject in the provider (`consumeSubject`), so a switch finds nothing pending. `interactions/checks.json` now records `postsAfterLensSwitches: 0` and Site A empty after switching through Price, Acquire and Develop |
| 2 | A6 not closed for Develop: per-site math, reasoning, sources and coverage still inline (18,642px at 390) | Fixed: the four blocks left the site sections; the ranking table's "Show math" and each site's "Open this site's evidence" put that site in the band and open the drawer. `after/cluster_4-done-390.jpg` is 13,152px; the per-site verdict card and panels stay (WS4 turns them into cards) |
| 3 | The 768 Develop overflow was the math strip's "no directional signal" labels, not the markers; the map change was uncommitted | Fixed: the neutral note is capped to its track with an ellipsis; the map's ResizeObserver is committed; `dash-audit.json` cluster_4-done@768 reads scrollWidth 768 |
| 4 | Headline clamped to two lines everywhere | Fixed: the band shows the full headline (`after/cluster_2-done-1440-fold.jpg`, `after/cluster_4-done-768-fold.jpg`) |
| 5 | The band scrolled internally at 768 (40vh cap) | Fixed: the band sizes to its content; the 40vh target is met by the content itself (one headline, three figures, one line of summary) |
| 6 | Ledger keys overflowed their column in the 600px drawer | Fixed: `minmax(0, …)` columns with `overflow-wrap: anywhere` inside the drawer (`interactions/drawer-sources-390.jpg`); a stacked phone ledger is a WS4 item |
| 7 | A13 leftover: "05.M" eyebrow in the Portfolio monitoring panel | Fixed |
| 8 | "Plan: Portfolio" in the top bar versus "plan" on the Develop lens (the profile cluster) | Fixed: the sidebar and lens sheet mark the profile cluster as "home" (`aria-label` "home lens") |
| 9 | `aria-live` on the whole band with a ticking timer | Fixed: a visually hidden live region announces phase changes only; the timer is `aria-hidden` |
| 10 | Settings had no shell | Fixed: `SimpleTopBar` (logo, Back to dashboard, account) and the prose width (`interactions/settings-1440.jpg`, `settings-390.jpg`) |
| 11 | Documents tab dead in the empty state | Fixed: falls back to History; the tab is not marked current when nothing scrolled |
| 12 | Copy said "above" on phones and two durations | Fixed: width-aware wording in the band and the lens copy; the band says "typically about 90 seconds" |
| 13 | Off-token values in the new CSS; watch styles in a styled-jsx block | Fixed: snapped to the 4px and type scales (the verdict word is `--text-h1` on phones); watch styles moved to `shell.css` |
| 14 | Clerk avatar 28px at 390 | Fixed: 36px avatar in a 44px box |
| 15 | Raw geocoder string in the search's no-match state; combobox role without listbox semantics | Fixed: designed copy; plain textbox with `aria-describedby` |
| 16 | Watchlist "HOLD · 79" unlabeled; copy over-claimed weekly monitoring for every row | Fixed: "conf 79"; the copy says what the book is and where changes appear. Per-property monitoring state is not in `/api/properties` and is not claimed |
| 17 | Clerk's generic subtitle on sign-in; the headline not in the approved caps | Fixed: subtitle hidden; "SMART DATA. SMARTER REAL ESTATE DECISIONS." verbatim |
| 18 | The drawer's panels kept their own "Hide" toggles; narrator em dashes | Fixed: `collapsible={false}` inside the drawer. The narrator prose is model output (open item, engine) |

Reviewer items left for WS4 (lens workspaces): VerdictHistory "Show math"/"Hide" at 27px, the map legend toggle at 17px, the Acquire "Remove" at 18px, the ScoreBands score label touching the bar, the Acquire holdings table at 390.

## Not fully satisfied

- The verdict band shows the engine's verdict in every lens, including Property; lens-specific vocabularies (plain findings for owners and renters, site verbs for Develop) are an engine change the redesign spec defers, so the band does not imply one.
- Develop keeps a per-site verdict card and panels in the workspace (the band and drawer show the selected or top-ranked site); WS4 restructures the sites as cards.
- A lens's run lives in that lens: switching lenses does not carry the finished verdict across (the redesign spec's "one subject, many lenses" needs the subject URL, a later item), and it never re-runs.
- The narrator's prose in the Reasoning tab can contain an em dash (model output, not copy); the engine's em-dash pass covered the driver strings, not the narrator.
