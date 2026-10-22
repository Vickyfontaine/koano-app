# Panel 6.1: Principal Software Engineer / Staff Architect

Reviewer persona: built data-intensive platforms at Stripe, Palantir and Bloomberg. I read the code, not the build bible. Where `CLAUDE.md` and the code disagree, the code wins and the gap is listed at the end.

Method: read `src/app/api/**`, `lib/agents/*`, `lib/providers/**`, `lib/koano-guard.ts`, `lib/documents/guard.ts`, `lib/archive/capture.ts`, `lib/supabase/*`, `lib/stripe/client.ts`, `lib/testing/cassette.ts`, every `supabase/*.sql`, `src/middleware.ts`, `vercel.json`, `next.config.mjs`, `.githooks/`, `.github/workflows/`, `scripts/prepush.sh`, and the test scripts. Ran offline only: `npx tsc --noEmit` (clean), `npx tsx scripts/test-fixture.ts` (green), five pure test scripts (one RED, see P9), and a scratch instrumentation of the replay (which made no network or model calls) to measure the real prompt sizes of all 8 recorded LLM calls. No live verdict runs, no writes to production.

---

## 0. Verdict in one paragraph

The decision core is unusually disciplined for a solo-built product: a pure aggregator (`lib/agents/synthesis.ts:92-156`), a five-state provenance type, a record/replay cassette that separates code regressions from model drift, and zero `any` across `src/` and `lib/`. Everything around that core is prototype-grade. There is no observability, no CI that runs tests, no migration ledger, no tenant model, and RLS that the app never actually uses. Three defects are live in the repo as written. (1) The `verdicts` and `documents` tables only accept two of the five provenance states, so every non-NYC verdict should fail to persist, and every non-NYC document should silently skip its audit row. (2) The global circuit breaker is 50 runs per day across all users (`.env.local` sets `KOANO_DAILY_RUN_CAP=50`; default in `lib/koano-guard.ts:71`). (3) The Stripe webhook ignores Supabase write errors and returns 200, so a paid customer can stay on `free` and Stripe will never retry. Today the architecture works for a few dozen NYC users. It is nowhere near 10,000 users, 100 institutions, or national coverage, and the "one-line swap" for data partners is a myth: a real partner integration touches 9 to 12 files plus SQL plus a re-recorded fixture.

---

## 1. Verdict-run latency budget (EXISTS, fragile)

### 1.1 The call graph of one verdict

`POST /api/agents/stream` (`src/app/api/agents/stream/route.ts`, `maxDuration = 300` at line 34):

1. `auth()` (Clerk) then `guardSpend` (line 68): 3 to 4 sequential Supabase round trips: plan lookup, usage insert, global count, per-user select (`lib/koano-guard.ts:116-168`). Sequential.
2. Geocode (`registry.geocode.resolve` or `resolveCandidate`): NYC GeoSearch plus Census cross-check, with reverse lookup and tract lookup in `lib/providers/real/geocode.ts:198-346`. Mostly sequential, 2 to 4 HTTP calls.
3. Five specialists in `Promise.all` (`lib/agents/synthesis.ts:387-393`). Each fans out its own providers in `Promise.all`:
   - market-timing: 6 providers (`market-timing.ts:29-36`)
   - infrastructure: 1 (`infrastructure.ts:23`)
   - demand-sentiment: 4 (`demand-sentiment.ts:27-32`)
   - risk-volatility: 8 (`risk-volatility.ts:36-44`)
   - regulatory-policy: 4 (`regulatory-policy.ts:29-34`)
   That is 23 provider method calls (the fixture records 23: geocode plus 22). `demographics.getDemographics` is called by both market-timing and demand-sentiment with no request-scoped memo, so Census ACS is hit twice per verdict.
4. Inside providers, more HTTP: `nyc-landlord.ts` chains up to 4 sequential Socrata calls (lines 135, 171, 200, 217, then a `Promise.all` at 244); `nyc-violations.ts:141` fires 5 in parallel; `nyc-permits.ts:189` fires 4. My count from the provider files: roughly 40 to 60 outbound HTTP requests per verdict, of which roughly 15 to 20 hit `data.cityofnewyork.us`.
5. Each specialist then makes 1 LLM call, plus a second if the grounding gate fires (`lib/agents/shared.ts:224` and `:279`). Sequential within the agent.
6. Synthesis narrator: 1 LLM call (`synthesis.ts:227`), strictly after all five agents.
7. `persistVerdict` (one insert).

LLM calls per verdict: 6 minimum, 11 maximum. The recorded fixture has 8 (5 specialists, 2 grounding retries for market-timing and demand-sentiment, 1 narrator), and the offline replay still prints both grounding retries, so 8 is the realistic NYC case.

Critical path: guard (4 DB RTT) + geocode (2 to 4 HTTP, sequential) + slowest agent's slowest provider chain (landlord: up to 5 sequential Socrata calls) + that agent's LLM call + possible retry + narrator LLM call + insert. That is three sequential LLM generations of 900 to 1,400 output tokens each. At typical Sonnet output speeds this alone is 30 to 60 seconds, which matches the "~60s" comment at `route.ts:34`.

### 1.2 Worst case exceeds the function limit

`fetchRaw` (`lib/providers/real/http.ts:41`) defaults to `retries = 3` and `timeoutMs = 20000`, and providers override up to 45s (`nyc-permits.ts`, `epa-superfund.ts`, `census-bps.ts`, `fbi-ucr.ts`) and 90s (`fhfa-hpi.ts`). One 45s-timeout fetch that hangs costs 4 x 45s + 3.6s of backoff, about 184 seconds. The landlord chain (30s timeouts, 4 sequential calls, 4 attempts each) has a theoretical ceiling near 8 minutes. The Anthropic client has no explicit timeout (`shared.ts:89`, SDK default). So a bad Socrata minute pushes the run past `maxDuration = 300`. Vercel then kills the stream mid-flight: the client gets a truncated NDJSON stream, nothing is persisted, and the usage slot already reserved by `guardSpend` is consumed ("Attempts count even if a run fails", `koano-guard.ts:201`). There is no overall deadline or budget propagation (no `AbortSignal` threaded from the route into the pipeline) and no circuit breaker per host.

Vercel's documented ceiling is 300s on Hobby and 800s on Pro (vercel.com/docs/functions/limitations). Raising `maxDuration` treats the symptom. The fix is a per-run deadline (for example 90s) that cancels outstanding fetches and degrades them to `fetch_failed`, which the provenance model already supports.

### 1.3 Cluster 4 three-site comparison

`src/components/dashboard/cluster4/SiteComparison.tsx:72-74` mounts three `useVerdictStream` hooks and `startSlot` (line ~112) fires `streams[slot].run` and a parallel `/api/site-detail` per slot. One comparison is therefore 3 verdict functions + 3 site-detail functions + 3 resolve-address calls: about 24 LLM calls and 150 to 200 outbound HTTP requests, about 60 of them Socrata, inside a few seconds. site-detail re-fetches zoning, permits and OZ that the verdict run is fetching at the same moment, because no request-level or cross-request cache exists for Socrata responses. Each comparison consumes 3 of the 50 global daily slots.

---

## 2. Socrata throttling and the shared HTTP layer (PARTIAL)

`lib/providers/real/http.ts` is the only shared layer: timeout, retry, 429 backoff, and a `recordDegradation` hook into an `AsyncLocalStorage` tracker (`lib/providers/degradation.ts:25-41`). The degradation tracker is a good idea and well implemented.

Defects:
- The 429 branch (`http.ts:49-53`) ignores `Retry-After`, uses linear 1.5s steps, and the comment says "retry once" while the code retries 3 times. Retrying a throttle with three parallel agents is how you turn a throttle into a storm.
- No concurrency limiter per host. Five agents plus their nested calls all hit Socrata at once by design.
- No user agent or contact header except where providers add one (CLAUDE.md line 661 records that Census Reporter 403s generic agents, a lesson learned the hard way).
- One shared `NYC_OPEN_DATA_APP_TOKEN` for every user and the cron. Socrata's docs say app-token requests are not throttled "except when requests are judged abusive or malicious" (dev.socrata.com/docs/app-tokens.html). At national scale on many city portals that is a single point of failure: one abusive free account can get the token flagged for everyone, because `/api/site-detail` and `/api/resolve-address` have no spend guard or rate limit (see Section 12).
- EPA FRS enforces about 12 requests per minute (CLAUDE.md:661). It is shared across the verdict path, site-detail, the portfolio risk report and the cron. Only the cron paces it (`capture.ts:60`).

---

## 3. Caching strategy (PARTIAL, ad hoc)

What exists:
- `bps_cache` Supabase table, 120-day TTL, stale-while-error with a labeled STALE note (`census-bps.ts:29`, `:171-206`). Good pattern.
- `contamination_cache` per BBL, 90-day TTL (`epa-superfund.ts:23-48`, `:150-153`).
- FHFA HPI reads the cron's archived snapshot from Supabase on the hot path, with `/tmp` and an in-memory `Map` as fallbacks (`fhfa-hpi.ts:1-30`, `:78`, `:269`).
- IRS migration served from a seeded Supabase table.
- Anthropic prompt caching on the system prompt (`shared.ts:212`).

What is missing:
- No response cache for Socrata, Census, FEMA, NOAA, USGS, HUD, BLS or CFPB. Those responses change daily at most (NYC) or annually (ACS, NRI, QCEW). Every verdict re-fetches all of them.
- No verdict-level reuse. Running the same BBL twice in a minute costs two full pipelines and two quota slots.
- No request-scoped memo (the duplicate ACS call above).
- The prompt cache likely costs money at current traffic. Anthropic's cache has a 5-minute TTL and writes cost 1.25x base input ($3.75 vs $3.00 per MTok for Sonnet 4.6 per claude.com/pricing). With a 50-run daily cap, most calls land outside the TTL of the previous call for the same agent, so most cached prefixes are written and never read. The cached block (agent prompt plus the 2,817-character format block) is also near the 1,024-token minimum for infrastructure and demand-sentiment.

Recommendation: a two-tier cache keyed by `(provider, normalized-key, source-version)` with TTL by dataset cadence, stored in Postgres or Upstash, plus a 24-hour verdict reuse window keyed by `(bbl, inputs_era, method, provider-input-hash)`. That also creates the content-addressed input store that auditability needs (Section 7).

---

## 4. Cost per verdict (measured, with assumptions)

I instrumented the offline replay (scratchpad script hooking the cassette key hash, which never calls the model or the network) to capture the exact system prompt and message sizes of the 8 recorded calls. Characters include the 2,817-character `RESPONSE_FORMAT_INSTRUCTIONS` (`shared.ts:105-132`) appended to every system prompt.

| Call | System chars | Message chars | Total in chars | Output chars |
|---|---|---|---|---|
| infrastructure | 4,426 | 3,629 | 8,055 | about 3,000 to 5,000 |
| market-timing | 6,040 | 5,133 | 11,173 | |
| demand-sentiment | 4,890 | 2,786 | 7,676 | |
| risk-volatility | 6,730 | 11,296 | 18,026 | |
| regulatory-policy | 5,522 | 6,319 | 11,841 | |
| market-timing retry (3 turns) | 6,040 | 9,027 | 15,067 | |
| demand-sentiment retry (3 turns) | 4,890 | 6,803 | 11,693 | |
| synthesis narrator | 5,149 | 15,313 | 20,462 | |
| Total | | | 103,993 | 29,797 |

Assumptions: pretty-printed JSON (`shared.ts:182-194` uses `JSON.stringify(..., null, 2)`) tokenizes at about 3.0 to 3.5 characters per token; output JSON at about 3.5. That gives 30,000 to 35,000 input tokens and about 8,500 output tokens per verdict. At Sonnet 4.6 list price ($3 input, $15 output per MTok, claude.com/pricing):

- Input: about $0.09 to $0.10
- Output: about $0.13
- Model cost per verdict: about $0.22 to $0.25. A three-site comparison: about $0.70.
- Add `narrative` (max 700 tokens) and `briefing` (max 1,200) content calls when used, plus Vercel active CPU (small, the run is I/O-bound).

Two observations a CFO will care about:
1. The pretty-printed payload wastes roughly 20 to 30 percent of input tokens on whitespace. Compact JSON or a terse `label=value` line format is a free 20 percent cut.
2. The plan limits are not tied to unit economics. Community at $19/month allows 20 verdicts per rolling 24h (`koano-guard.ts:39`), which is up to 600 per month, about $150 of model cost. Portfolio at $1,499 allows 500 per day, up to about $3,750 per month in model spend. Today the global cap of 50 per day hides this; remove the cap and the limits become a margin leak.

The runtime model is pinned to `claude-sonnet-4-6` (`shared.ts:16`), which Anthropic now lists as a legacy model; the current Sonnet is listed at $2/$10 per MTok (claude.com/pricing). Moving models requires a full fixture re-record (Section 9), so model migration has a real engineering cost. Budget for it.

---

## 5. Error handling and observability (MISSING)

- No Sentry, OpenTelemetry, Datadog, Axiom or any logger. `grep` of `package.json`, `src`, `lib` finds none. There are 23 `console.*` calls in total.
- No request ID or run ID. A verdict cannot be correlated across the stream route, providers, the LLM calls and the persisted row.
- LLM `usage` (tokens, cache hits) from `messages.create` is discarded (`shared.ts:204-219`). There is no record of spend per user, per verdict or per agent.
- The contradiction guard, the product's headline safety claim, only does `console.warn` (`synthesis.ts:238-242`). Nobody is alerted and nothing is counted.
- Run degradation is streamed to the client but never persisted with the verdict.
- Supabase errors are frequently swallowed because supabase-js returns `{ error }` instead of throwing:
  - `src/app/api/documents/route.ts:579-596`: the audit insert is wrapped in `try/catch`, but the returned `error` is never checked. A rejected insert is invisible, which matters because of Section 7.1.
  - `src/app/api/stripe/webhook/route.ts:75-135`: none of the five `update` calls check `error` (Section 13).
  - `src/app/api/cron/archive/route.ts:154-161`: the `monitor_runs` insert and update ignore errors.
- 38 places return raw `error.message` to the client from API routes (DB and provider internals leak to the browser).
- The one real observability asset is the archive: `archive_runs` as a failure ledger, plausibility floors (`cron/archive/route.ts:43`), missed-shard detection, never-captured detection, Resend gap alerts, and an external GitHub Actions liveness probe (`.github/workflows/archive-liveness.yml`). That is better than most seed-stage companies, and it is the only part of the system watched from outside.

---

## 6. Type safety (EXISTS at compile time, PARTIAL at the boundaries)

- `strict: true` (`tsconfig.json`). `npx tsc --noEmit` is clean.
- Zero uses of `any` as a type in `src/` or `lib/` (the seven `grep` hits are all English prose in comments). Zero `@ts-ignore`.
- 9 `as unknown as` (6 in `lib/monitor/scan.ts:114-143` casting archived JSONB snapshots to detector types, plus `api/properties/route.ts:92` and two in `KoanoMap.tsx`), about 244 `as` casts, and about 40 non-null assertions.
- The real gap is runtime validation at trust boundaries. No generated Supabase types (`supabase gen types` is unused), so every row is cast. No schema validation (no zod) on LLM output: `shared.ts:221` does `JSON.parse(extractJson(text)) as Record<string, unknown>` with hand-written field checks. The hand checks are careful (`oneOf`, band maps), but archived JSONB in `monitor/scan.ts` is cast blind. A capture-version change in an old snapshot will throw or misdetect at runtime, not at compile time.

---

## 7. Data integrity and the audit trail

### 7.1 The provenance CHECK constraint bug (likely P0, repo-verified, prod unverified)

`supabase/schema.sql:118`: `overall_provenance text not null check (overall_provenance in ('live', 'representative'))`.
`supabase/migration-006-documents.sql:30`: identical constraint on `documents`.
No later migration widens either (grep of all 22 files). Meanwhile the code writes all five states: `lib/supabase/verdicts.ts:34` writes `verdict.overall_provenance`, and CLAUDE.md:235 and :287 state that every non-NYC verdict rolls up `coverage_absent`, and any NYC run with one timed-out call rolls up `fetch_failed`.

If production matches the repo, then:
- Every out-of-market verdict and every degraded NYC verdict fails to persist. The stream reports `persisted: false` and the user sees a result that is not in history, cannot feed documents built from stored verdicts (`ic_memo` requires `loadLatestVerdict`, `documents/route.ts:357-369`), never enters the calibration record, and is never monitored.
- Every document built on such data fails its audit insert silently (Section 5). Because the document cap is a `COUNT` over that table (`lib/documents/guard.ts:99-111`), those documents also never count toward the 30-per-day cap.
- Any future `partner` feed fails the same way, which defeats the exit thesis at the moment of integration.

CLAUDE.md section 07 says a Chicago verdict was "verified live" rolling up `coverage_absent`. That verification checked the rollup, not persistence: the stream route still returns the verdict to the browser when the insert fails (`route.ts:96-115`), so a rejected insert looks like success unless someone reads `persist_error`. I could not query production. Migrations are applied by hand in the SQL editor (every file header says "Run in the Supabase SQL editor"), so there is no ledger proving what production contains. Either production was hand-altered outside the repo (a due-diligence finding by itself) or this bug is live. Check it today: `select pg_get_constraintdef(oid) from pg_constraint where conname like 'verdicts_overall_provenance%';`.

### 7.2 Immutability is a trigger, not a guarantee (PARTIAL)

`schema.sql:143-155` blocks row-level UPDATE and DELETE for all roles, including service_role. Good, and the `verdict_hidden` side table (`migration-019`) is the right way to let users curate history without touching the record. However:
- A `BEFORE UPDATE OR DELETE ... FOR EACH ROW` trigger does not fire on `TRUNCATE`. Any service-role holder can `TRUNCATE verdicts`, `ALTER TABLE ... DISABLE TRIGGER`, or drop the trigger. There is no hash chain, no external anchoring, no WORM export. An auditor will call this "tamper-resistant by convention".
- The record cannot reproduce or explain its own verdict. `synthesis.ts:171-174` says data points are not persisted. The row stores verdict, bands, reasoning prose and agent summaries, but not the provider inputs, the provider responses' fetch timestamps and endpoints, the model ID, prompt versions or hashes, the raw completions, or the degradation summary. Only `method` and `inputs_era` (migration-021) are kept. For an IC committee or a regulator, "what exactly did the system see when it said BUY on 2026-09-14?" has no answer. The cassette format already proves the team knows how to freeze both boundaries. Persisting a content-addressed cassette per verdict (inputs plus raw completions, maybe 80 KB each, the fixture is 78 KB) would make every production verdict replayable. That is the single highest-leverage engineering move in this repo (Section 18).
- GDPR and CCPA deletion is impossible by design for verdicts (addresses plus a user ID), and there is no Clerk `user.deleted` webhook, so deleted Clerk users leave profiles, emails, properties and verdicts behind. Decide a retention and pseudonymization policy now (for example, crypto-shred the `clerk_user_id` mapping while keeping the verdict row).

### 7.3 Determinism claims, precisely

The fixture asserts the "decision surface" (`scripts/lib/decision-surface.ts:1-14`): verdict, confidence, risk, window, provenance, per-agent bands, and breakdown. It excludes narrator prose. Under frozen completions this proves the decision code is deterministic. It does not prove that two live runs of the same address give the same verdict, because each specialist's verdict and conviction band is still an LLM output (temperature 0 is not a determinism guarantee), and provider inputs move daily. That is acceptable if the marketing says "deterministic aggregation of model-judged bands", and a liability if it says "deterministic verdict".

---

## 8. Test coverage (PARTIAL, not a framework)

`scripts/test-*.ts` are 21 standalone `tsx` scripts with hand-rolled `ok()` helpers and `process.exit(1)`. No Jest or Vitest, no coverage measurement, no fixtures beyond one, no CI running them. Roughly half (`test-providers`, `test-sales`, `test-violations`, `test-out-of-market`, `test-agent`, `test-pipeline`, `test-verdict-determinism`, `test-geocode-guard`, `test-permits-sanity`, `test-archive-integrity`) call live APIs, Supabase, or Anthropic, so they cannot run in CI without secrets and they cost money.

I ran the pure offline ones: `test-grounding`, `test-monitor-detect`, `test-document-engine` and `test-disclaimer-regression` pass. **`test-shard-logic` FAILS today**: the assertion at `scripts/test-shard-logic.ts:54` matches `/shard\(s\) 5/` while `lib/archive/capture.ts:312` now emits `Shard(s) 5` (capitalized). The logic is probably fine; the test is brittle string matching, and nobody noticed because it is not in any gate. That is the clearest evidence that tests not wired into a gate rot.

Not tested at all: `koano-guard.ts` race and limits, the Stripe webhook, RLS, `/api/documents` auth and tier paths, `persistVerdict` against the real schema (which would have caught 7.1), the stream route, and any UI.

---

## 9. The record/replay fixture (EXISTS, strong idea, thin coverage)

`lib/testing/cassette.ts` is the best piece of engineering in the repo. It proxies every registry provider (`installProviderCassette`, line 96) and freezes only raw completion text (`viaCassette` in `shared.ts:203`), so parsing, grounding, band mapping, blending and aggregation all run live on replay. A changed prompt input produces a REPLAY MISS, which is a correct red. The surgical `replay-or-record` mode (line 69) is thoughtful. Replay passes today: "BUY conf 69 risk 51 prov live | score 0.23 + nudge 1 = 1.23".

Limits:
- One address, one verdict class (NYC, `live`, BUY with a structural nudge). No `coverage_absent`, `fetch_failed`, `partner`, sell, wait or drop fixture. The persistence bug in 7.1 sits exactly on the uncovered path.
- Recorded 2026-08-27 at commit `b4018d0`. Any prompt edit forces a live re-record (Anthropic spend plus live data that has drifted), so prompts become expensive to touch and the fixture will be re-recorded often enough to stop being a meaningful baseline.
- The model ID is not part of the cassette key (`shared.ts:203` keys on agent, temperature, systemPrompt and messages), so a model change replays green while production behavior changes completely. Add `KOANO_RUNTIME_MODEL` to the key.

---

## 10. The pre-push gate (PARTIAL)

`.githooks/pre-push` runs `scripts/prepush.sh`: a full isolated `next build` plus the fixture replay. Good content. Weak enforcement: it is a client-side hook (requires `git config core.hooksPath .githooks`, which is set on this clone), bypassable with `--no-verify`, and absent for any second engineer or for a GitHub web edit. The only CI workflow is archive liveness. Vercel builds from the pushed branch whatever the hook said. Move the identical steps into a GitHub Actions workflow required on `main`. Cost: under an hour.

---

## 11. Middleware, auth, RLS, identity

### 11.1 Middleware (EXISTS)

`src/middleware.ts:7-11` protects only `/dashboard(.*)` and `/onboarding(.*)`. API routes are not protected by middleware; each route calls `auth()` itself. My route-by-route check: every user-facing route calls `auth()`; the webhook verifies the Stripe signature; cron and archive health check `CRON_SECRET`. Correct today, but deny-by-default should live in middleware (protect `/api/(.*)` except an explicit public allowlist) so a new route cannot ship open.

### 11.2 RLS: present, and bypassed (PARTIAL, mostly theater)

`lib/supabase/server.ts:7-15` creates a single service-role client. All 25 files that touch the database import `supabaseAdmin`. `NEXT_PUBLIC_SUPABASE_ANON_KEY` is never used in `src/` or `lib/`. Therefore every policy in `schema.sql`, `migration-006`, `-014` and `-019` is dead code for the application. Tenant isolation rests entirely on each handler remembering `.eq('clerk_user_id', userId)`. I checked: `verdicts`, `properties`, `notifications`, `monitoring`, `documents` and `profile` routes do scope by user. There is no structural guarantee, no test, and no `import 'server-only'` guard on `lib/supabase/server.ts`, so an accidental client import of the service key is caught only by Next's env-var rule (the key is not `NEXT_PUBLIC_`, so it would be `undefined` client-side, which is the saving grace).

The RLS helper `koano_requesting_user_id()` (`schema.sql:19-28`) reads `request.jwt.claims ->> 'sub'`, designed for Clerk as a Supabase third-party auth provider. Nothing in the code passes a Clerk session token to Supabase, so I see no evidence the integration is configured.

RLS is enabled with no policies on `archive_*`, `sales_archive`, `irs_migration`, `verdict_outcomes`, `monitor_runs`: anon and authenticated are denied, which is correct.

The `profile-assets` bucket is public-read by design (`migration-007`). Fine for logos; note that the object path is `{clerk_user_id}/{kind}`, which publishes Clerk user IDs in every white-labeled PDF URL.

### 11.3 Clerk to Supabase identity mapping (PARTIAL)

- Identity key is the Clerk `user_...` string, stored as free text on every table. No FK from `verdicts`, `properties`, `documents` or `usage_events` to `profiles`.
- A `profiles` row is created only when the user posts a cluster at onboarding or saves settings (`api/profile/route.ts:112`, `:151`). There is no Clerk `user.created` webhook. If someone pays before a profile row exists, the webhook's `update ... eq('clerk_user_id')` touches zero rows and succeeds silently (Section 13).
- `email` is copied at upsert time and never re-synced. The Monday digest reads `profiles.email` (`lib/monitor/digest.ts:194`), so a user who changes email in Clerk keeps getting mail at the old address.

### 11.4 Multi-tenancy (MISSING)

No organizations, seats, roles, teams, shared portfolios, or admin. `grep` for `orgId` or `organization` across `src` and `lib` finds nothing. Plans live on a single user's profile. Approvals and plan overrides are SQL-editor comments (`migration-002:41-53`, `migration-003:16-32`). An institutional client with 12 analysts needs 12 separate subscriptions, cannot share verdicts or the monitored portfolio, and cannot have an admin revoke a departed analyst. Clerk Organizations supports this, but the data model has to move from `clerk_user_id` to `(org_id, user_id)` on every table, which is the most expensive retrofit in this codebase. Do it before the first institutional contract, not after.

---

## 12. Rate limiting and abuse (PARTIAL)

`lib/koano-guard.ts` reserves a `usage_events` row, counts globally, counts per user, and rolls back its own row on denial. Fail-closed on DB error. The reserve-then-recount pattern correctly bounds the three parallel Cluster 4 requests. Good design for its scope.

Problems:
- The global breaker is 50 per day (`.env.local`; default `koano-guard.ts:71-72`) and counts all kinds and all users. One Portfolio user (limit 500 per day) or 17 three-site comparisons exhaust the whole product for everyone. One scripted Clerk sign-up loop (3 free runs per account, `koano-guard.ts:38`) does the same. This is a demo-era safety valve now acting as a denial-of-service lever.
- Free limits count lifetime by `clerk_user_id`. New Clerk accounts reset it; there is no device, email-domain or IP signal.
- Unmetered routes that still cost real quota: `/api/site-detail` (multi-provider fan-out, `maxDuration 60`), `/api/resolve-address`, `/api/properties`. Any signed-in free user can call site-detail in a loop and burn the shared Socrata token and EPA's 12-per-minute budget for every paying customer.
- No edge rate limit (Vercel WAF, Upstash) in front of anything.
- The document cap pre-check has a documented race (`documents/guard.ts:93-98`) and, combined with 7.1, does not count non-NYC documents.

---

## 13. Stripe (PARTIAL, test mode)

`STRIPE_SECRET_KEY` in `.env.local` is a test key; price IDs are hard-coded test-mode IDs in `lib/stripe/client.ts:20-25`, so going live requires a code change and a deploy rather than configuration.

Webhook (`src/app/api/stripe/webhook/route.ts`):
- Signature verification on the raw body is correct (lines 45-60).
- Every Supabase `update` ignores `{ error }` (lines 75-85, 99-118, 127-135). On a DB failure the handler returns `{ received: true }` with 200 and Stripe never retries. The comment at line 154 ("500 means Stripe retries, which is correct") is only reached if the client throws, which supabase-js does not do for query errors.
- Zero-row updates are not detected (no profile row, or `stripe_customer_id` not yet stored). The customer pays and stays `free`.
- No event-ID idempotency table and no ordering protection. Stripe does not guarantee event order; a delayed `customer.subscription.updated (active)` arriving after `customer.subscription.deleted` re-grants the paid plan. Compare `event.created` against a stored `last_event_at`, or re-fetch the subscription from Stripe inside the handler.
- No customer portal, invoices, or tax handling routes. No annual or invoiced enterprise billing path, which is how institutions buy.

---

## 14. Cron security and the archive pipeline (PARTIAL)

`src/app/api/cron/archive/route.ts:50-53` checks `Authorization: Bearer ${CRON_SECRET}`. Correct for Vercel cron. Minor: non-constant-time comparison, and the same secret is sent by the GitHub liveness workflow to `/api/archive/health`, so a leak from GitHub Actions also grants cron trigger rights. Use separate secrets.

Structural problems:
- One 300s function does everything on Monday: all-NYC sales (paged 50k rows), tract permits, CD entitlement, HPI, that day's property shard, the calibration scan, monitoring for the shard, and the weekly digest emails (lines 100-178). A slow Socrata Monday starves the digest and the per-property captures.
- Per-property capture is a sequential loop (`lib/archive/capture.ts:540`) that re-geocodes every tracked property every week and then fetches 4 providers. The route comment says about 14s per property. With roughly 250s of usable budget on non-Monday shards, the ceiling is about 15 to 20 properties per shard, about 100 to 140 tracked properties in total, and lower on Mondays. `loadTrackedProperties` (`capture.ts:457-471`) loads every row in `properties`, not just monitored ones. So the archive breaks at roughly a hundred-odd distinct addresses across all users. The code comment at `capture.ts:519-523` admits chunking is "designed-for but NOT built".
- Contamination is capped at 6 properties per run (`capture.ts:60`) to respect EPA, so per-property contamination refreshes once every N/6 weeks.
- Note for the brief: the cadence is weekly snapshots (`captured_week` is the ISO Monday, `migration-008` header) executed as daily shards. It is not a daily snapshot of the public record.

---

## 15. Archive partitioning, growth, and Supabase Pro limits

`archive_snapshots` is range-partitioned monthly with partitions pre-created through `2027_12` plus a DEFAULT partition (`migration-008-archive.sql:50-75`). There is no partition-maintenance job. From 2028-01 every row lands in DEFAULT. Postgres then refuses to create `archive_snapshots_2028_01` while DEFAULT holds rows in that range, so the fix becomes a locking data migration on the moat table. Add pg_partman or a monthly cron step now. Effort S.

Growth (my estimates from the code's grain):
- NYC today: tract permits about 2,200 tract rows per week (floor 1,500 at `cron/archive/route.ts:43`), about 115k rows per year; CD entitlement about 3k per year; sales about 50k to 90k per year (`migration-008` comment); per-property 6 to 9 rows per tracked property per week. With JSONB rows of 0.5 to 2 KB, NYC stays well under 1 GB per year. Fine on Supabase Pro.
- Every US metro at tract grain: about 85,000 tracts nationally times 4 to 6 tract-level datasets times 52 weeks is roughly 18M to 27M rows per year, about 15 to 50 GB per year with indexes. Supabase Pro includes 8 GB of disk and a Micro instance with 1 GB RAM (supabase.com/pricing). Disk overage is cheap ($0.125 per GB); the real constraints are compute size for index maintenance and time-series scans, 7-day backups with PITR as a paid add-on, and SOC 2 reports being a Team-plan feature, not Pro (same source).
- The binding constraint is not storage. It is that the capture code is NYC-specific (hard-coded Socrata dataset IDs such as `64uk-42ks`, `ic3t-wcy2`; BBL keys; `BOROUGH:dob_census_tract` scope keys that the migration header calls lossless versus GEOID only with a crosswalk), and that capture runs inside one Vercel function. National capture needs a queue-based worker fleet (Inngest, Trigger.dev, QStash or plain SQS), per-source rate limiting, and an object-store landing zone (Parquet on S3 or R2) with Postgres holding only the indexes and aggregates.
- The archive is append-only "by convention" (`migration-008` header). For an asset whose whole value is that it cannot be recreated, that should be enforced (an insert-only role for the cron, a nightly immutable export to object storage with object lock). Today a single bad `DELETE` from the SQL editor destroys the moat, and Supabase Pro's 7-day backup window bounds recovery.

---

## 16. Secrets handling (PARTIAL)

Good: `.env*.local` is gitignored; I searched all 150 commits for Stripe, Anthropic and JWT key patterns and found only a prefix-printing diagnostic route that was later removed (`6b08d31`, removed in `20fb688`). No secrets in the repo.

Weak: one god-mode service-role key is used by every route, the cron, and scripts; there is no least-privilege role for the cron or the read paths; no rotation procedure; no secret manager. `ELEVENLABS_API_KEY` (used by the video tooling) sits in the app's env file alongside production keys. Production keys almost certainly sit on a laptop next to `scripts/emergency-capture.ts`, which writes to production.

---

## 17. Provider integration story: what a data partner's engineer actually does

Scenario: ATTOM (or a CoStar-class vendor) wants KOANO to use its national comps feed so non-NYC verdicts stop reading `coverage_absent`. The registry header (`lib/providers/registry.ts:1-3`) and every mock `swap_note` promise "a one-line change". Here is the real path.

1. **Day 1: read the contract.** `lib/providers/types.ts` (803 lines, 28 provider interfaces). `MlsCompsProvider` is `getComps(addr: ResolvedAddress)` returning `ProviderResult<MlsCompsSummary>` (`types.ts:781-784`). The interface is clean and small. The data shape (`MlsCompsSummary`) was designed around NYC DOF recorded sales (`price_trend`, `sales_count`, `building_class`, `gross_square_feet`). The partner maps their schema into ours, and fields they have (DOM, list price, concessions) have nowhere to go without editing `types.ts`, which ripples through the agent, the blocks, documents, and the monitor detectors.
2. **The method signature has no credentials or tenant context.** `getComps(addr)` cannot know which customer is asking. The stated data strategy (bring-your-own MLS or CoStar credentials) cannot be implemented without changing every provider interface to accept a context object (`{ addr, tenant, credentials, deadline }`). Effort L, touching all 28 interfaces.
3. **Implement** `lib/providers/real/attom-comps.ts`, using `fetchJson` from `real/http.ts`. Return `provenance: 'partner'`. Handle out-of-coverage with `outOfMarketMunicipal` from `real/coverage.ts`.
4. **Register: this is where "one line" fails.** The registry maps exactly one implementation per slot, globally (`registry.ts:103-136`). Setting `mlsComps: attomComps` replaces NYC DOF comps for NYC too. Keeping both requires writing a market router (a composite provider that dispatches on `addr.state_fips` or `borough`). No such abstraction exists. Write it.
5. **Catalog: compile-forced, but the type cannot express a partner.** `lib/providers/catalog.ts:43` allows `coverage: 'national' | 'nyc'` and line 50 allows `provenance: 'live' | 'representative'`. A partner feed that covers, say, 40 metros cannot be described. Edit the type.
6. **Coverage map: regex over display strings.** `src/components/ui/coverage.ts` `LAYER_RULES` maps human-readable `source` strings to layers with regexes such as `/DOF Rolling|Rolling Calendar Sales|recorded sales/i`. The partner's source string must be chosen to match, or the coverage map falls back to splitting the string. Layer identity should be a stable ID on `ProviderResult`, not text.
7. **Agent wiring.** `lib/agents/market-timing.ts:64-82` hand-builds data points from the comps result and the system prompt (lines 12-26) talks about NYC recorded sales and explicitly says DOM is unavailable. Edit the agent and its prompt. Every agent hand-codes its data-point labels, so new fields require code in the agent, not configuration.
8. **Blocks and documents.** `lib/providers/blocks.ts` `BLOCK_FETCHERS` for dashboard panels; the CMA and pricing-memo builders in `lib/documents/builders/` read comps fields directly.
9. **Persistence.** With `provenance: 'partner'`, any verdict or document that rolls up `partner` violates the CHECK constraints in `schema.sql:118` and `migration-006:30` (Section 7.1). SQL migration required, applied by hand.
10. **Archive capture.** To accumulate the partner's history, add a capture function in `lib/archive/capture.ts`, a `CAPTURE_VERSION`, the dataset name in the `archive_coverage` view (hard-coded `ds(dataset) as (values ('sales'), ('permits'))` in `migration-008:151`, later replaced in 009/010/013), a plausibility floor in the cron route, and a monitor detector in `lib/monitor/detect.ts` if changes should notify. Also confirm the license allows storing their data, since the archive CHECK only allows `provenance = 'live'` (`migration-008`, `archive_snapshots`).
11. **Fixture.** Changing market-timing's inputs or prompt causes a REPLAY MISS. Re-record with live data and Anthropic spend, then justify the diff (CLAUDE.md section 07C).
12. **Ship.** There is no sandbox, no partner API key management, no usage metering per partner, no SLA monitoring per source, and no contract test harness the partner can run themselves.

Honest estimate: 2 to 4 weeks for a strong engineer who already knows the codebase, and 9 to 12 files plus SQL plus a fixture re-record. "One-line swap" is true only for replacing a mock with a live implementation of the same shape, for every user, in every market. That claim should come off the marketing and the registry comment until a context-aware, market-routed provider interface exists. The good news: the hard part is already right. `ProviderResult` with first-class provenance, attribution in `source`, and the coverage map are exactly what a data partner wants to see. What is missing is plumbing, not philosophy.

---

## 18. The institutional security review (SOC 2 / vendor questionnaire)

How a large lender's or REIT's vendor-risk team would score it today:

| Control area | Questionnaire item | Status | Result |
|---|---|---|---|
| Compliance | SOC 2 Type II report | MISSING | Fail. Also Supabase's SOC 2 report needs Team plan. |
| Compliance | Pen test in last 12 months | MISSING | Fail |
| Identity | SSO (SAML/OIDC) for customer users | MISSING (Clerk supports it, not configured or tiered) | Fail |
| Identity | Role-based access, org admin, user deprovisioning | MISSING (no orgs, no roles) | Fail |
| Identity | MFA enforcement | Clerk-dependent, not enforced in code | Partial |
| Data isolation | Logical tenant isolation enforced by the database | RLS present but bypassed by the service role everywhere | Fail |
| Data isolation | Customer data segregation per tenant | Single shared schema keyed by user string | Partial |
| Audit | Immutable audit log of user and admin actions | Verdict and document rows only; no access log, no admin-action log, approvals done in the SQL editor | Fail |
| Audit | Ability to reproduce an output | Inputs not persisted (`synthesis.ts:171-174`) | Fail |
| Logging/monitoring | Centralized logging, alerting, incident response | None besides archive email alerts | Fail |
| Change management | Code review, CI, protected branches, deploy approvals | Local pre-push hook only; single committer | Fail |
| Secrets | Secret manager, rotation, least privilege | Single service-role key everywhere | Fail |
| Data retention | Retention schedule, deletion on request | Verdicts undeletable by design; no deletion workflow | Fail |
| BC/DR | RPO/RTO, tested restore | Supabase Pro daily backups, 7 days, PITR not purchased (unverified) | Fail |
| AI governance | Model inventory, versioning, eval, human-review policy | Model pinned in code; no eval suite beyond one fixture; no model ID on verdict rows | Partial |
| Subprocessors | List with DPAs (Anthropic, Clerk, Supabase, Vercel, Stripe, Resend, Mapbox) | Not documented in repo | Fail |
| App security | Security headers, CSP | None (`next.config.mjs` has no `headers()`) | Fail |
| App security | Rate limiting, abuse protection | Per-user DB counters; no edge limit | Partial |
| Vulnerability mgmt | Dependency scanning | No Dependabot or equivalent workflow | Fail |

What fails first in practice: SOC 2, SSO, tenant isolation, and audit reproducibility. Of those, reproducibility is the one a competitor cannot fake and the one KOANO is closest to (the cassette).

---

## 19. Technical due diligence list (acquirer's engineering team)

Severity: Price-cut (reduces valuation or forces escrow/holdback), Condition (must fix before close), Note (integration cost).

| # | Finding | Evidence | Severity | Effort | Impact |
|---|---|---|---|---|---|
| 1 | Verdict and document audit rows reject 3 of 5 provenance states; non-NYC and degraded verdicts not persisted; doc audit silently lost | `schema.sql:118`, `migration-006:30`, `verdicts.ts:34`, `documents/route.ts:579-596` | Condition | S | 9 |
| 2 | No migration ledger; prod schema state unknowable from repo; "degrade if migration not applied" code paths throughout | headers of all `supabase/*.sql`; `cron/archive/route.ts:60-77`; `verdicts.ts:35-37` | Price-cut | M | 8 |
| 3 | Verdicts not reproducible: inputs, model ID, prompt hashes not stored | `synthesis.ts:171-174`; `verdicts.ts:23-44` | Price-cut (the product sells auditability) | M | 9 |
| 4 | No multi-tenancy; retrofit touches every table and query | `grep orgId` empty; all tables keyed by `clerk_user_id` | Price-cut | L | 9 |
| 5 | RLS bypassed; isolation is per-handler discipline | `lib/supabase/server.ts`; 25 importers | Condition | M | 7 |
| 6 | Zero observability, no cost telemetry | Section 5 | Note (integration cost) | M | 7 |
| 7 | Archive capture capped near 100 to 140 properties and NYC-only; partition cliff 2028-01 | `capture.ts:540`, `migration-008:74-75` | Price-cut (the moat claim is over-stated for scale) | L | 9 |
| 8 | Archive integrity by convention; one DELETE or TRUNCATE destroys the asset | `migration-008` header; Supabase 7-day backups | Condition | S | 9 |
| 9 | Provider abstraction lacks tenant, credential and market routing | `types.ts:781-784`; `registry.ts:103` | Note | L | 8 |
| 10 | Billing correctness: webhook ignores DB errors, no idempotency or ordering, test price IDs in code | `webhook/route.ts:75-135`; `stripe/client.ts:20-25` | Condition | S | 6 |
| 11 | Unit economics not enforced by limits; global cap of 50 per day masks it | `koano-guard.ts:37-43`, `:71` | Price-cut (gross margin) | M | 7 |
| 12 | Bus factor 1: 150 commits, single author, 88 KB build bible as the only architecture doc | `git log` | Price-cut (key-person risk, retention package) | n/a | 8 |
| 13 | Tests are scripts, one already red, no CI | Section 8 | Note | M | 6 |
| 14 | Hard dependency on a now-legacy model with expensive re-baselining | `shared.ts:16` | Note | M | 5 |
| 15 | Data licensing review: archive stores derived public data; some sources have attribution terms (HUD FMR non-endorsement handled at `market-timing.ts:105-107`); no license register | repo | Note | S | 5 |
| 16 | No security headers or CSP; raw DB errors returned to clients (38 sites) | `next.config.mjs`; API routes | Note | S | 4 |

---

## 20. Where it breaks first

**At 10,000 users (in order):**
1. Day 1: the global breaker (50 runs per day) turns the product off for everyone by mid-morning. Raising it exposes items 2 to 4.
2. Socrata and EPA shared quotas: 10,000 users x a few verdicts x 15 to 20 Socrata calls is hundreds of thousands of calls per day from Vercel egress on a single token, with no cache. EPA's 12 per minute is exhausted almost continuously; risk-volatility verdicts start reading `fetch_failed`, which then fail to persist (7.1).
3. The archive cron: `properties` grows with every verdict, and the sequential capture loop blows the 300s budget within the first few hundred distinct addresses. Weekly history develops permanent gaps (the one failure the system was built to prevent), and the Monday digest gets starved.
4. Anthropic rate limits: 8 calls per verdict at peak concurrency with no queue and no backpressure (only SDK default retries).
5. Model spend and margin, once limits are real.

**At 100 institutional clients:** procurement fails before load does: SSO, orgs and seats, SOC 2, audit reproducibility, DPA list, invoiced billing. Technically, the Portfolio risk report builds sequentially for at most 15 properties inside a 120s function (`documents/route.ts:396-410`, `maxDuration = 120` at line 196) while the Portfolio tier sells 500 monitored properties (`koano-guard.ts:54`). An institution's first real portfolio report times out or silently covers 15 of 400 assets.

**At every US metro:** the municipal layer and the archive are NYC-specific by construction (BBL keys, borough scope keys, hard-coded dataset IDs, NYC GeoSearch). Each new city is a new set of providers, capture functions, scope keys and crosswalks, because no city-agnostic parcel abstraction (APN, FIPS plus parcel, normalized permit and violation schemas) exists. The coverage map honestly shows `coverage_absent`, which is correct, and it also means national users get a materially thinner product with a confidence cap of 74 (`synthesis.ts:125`).

---

## 21. Top 10 problems (ranked by enterprise-value impact)

| # | Problem | State | Effort | Impact |
|---|---|---|---|---|
| 1 | Production verdicts are not reproducible or auditable (no inputs, model or prompt version persisted), undercutting the core "auditable verdict" claim | PARTIAL | M | 10 |
| 2 | Provenance CHECK constraints accept 2 of 5 states: non-NYC, degraded and partner verdicts and documents likely fail to persist, with silent document audit loss | PARTIAL (bug) | S | 9 |
| 3 | No tenant model (orgs, seats, roles, SSO); institutional sale impossible without a schema-wide retrofit | MISSING | L | 9 |
| 4 | Archive (the moat) does not scale past roughly 100 to 140 tracked properties, is NYC-only, is append-only by convention, and hits a partition cliff in 2028 | PARTIAL | L | 9 |
| 5 | Global run cap of 50 per day plus unmetered site-detail: the product can be turned off by one user or a sign-up script | PARTIAL | S | 8 |
| 6 | No observability: no error tracking, tracing, cost or token telemetry; contradiction guard only logs to console | MISSING | M | 8 |
| 7 | Provider interface is not partner-ready (no context, credentials, market routing; catalog and coverage types cannot express partners); "one-line swap" claim is false | PARTIAL | L | 8 |
| 8 | Latency has no deadline: retries times timeouts can exceed 300s; failures consume quota and persist nothing | PARTIAL | M | 7 |
| 9 | No CI, tests are ad hoc scripts, one already red; single-fixture gate covers only the happy NYC path; migrations hand-applied with no ledger | PARTIAL | M | 7 |
| 10 | Stripe webhook can drop paid entitlements silently; test price IDs hard-coded; no enterprise billing path | PARTIAL | S | 6 |

## 22. Top 10 opportunities (ranked)

| # | Opportunity | State | Effort | Impact |
|---|---|---|---|---|
| 1 | Persist a per-verdict "evidence cassette" (all provider results, raw completions, model ID, prompt hashes, code SHA), content-addressed in object storage with a hash on the verdict row. Every production verdict becomes replayable offline, byte for byte. Institutions get "show me exactly what you saw". | MISSING | M | 10 |
| 2 | Context-aware provider interface (`{addr, tenant, credentials, deadline, market}`) plus a market router and a partner SDK with a contract-test harness built on the cassette. Turns "pluggable" into a sales asset for the exit thesis. | MISSING | L | 9 |
| 3 | Move capture to a queue-based worker (per-source rate limits, chunked shards, object-store landing zone, enforced immutability with object lock). Makes the moat real and scalable. | MISSING | L | 9 |
| 4 | Shared input cache with dataset-cadence TTLs plus a verdict reuse window: cuts latency, quota use, and model spend. | MISSING | M | 8 |
| 5 | Orgs, seats, roles and SSO via Clerk Organizations, with Supabase RLS actually enforced through Clerk JWTs on read paths. | MISSING | L | 8 |
| 6 | Observability stack (Sentry plus OpenTelemetry plus a `runs` table with tokens, cost, latency per agent, degradation, contradiction-guard hits). Gives per-customer gross margin and a reliability story for procurement. | MISSING | M | 7 |
| 7 | Compact the prompt payload (drop pretty-printing) and reconsider prompt caching at current traffic: roughly 20 percent model-cost cut for an afternoon's work, landed with one fixture re-record. | MISSING | S | 5 |
| 8 | CI on GitHub Actions: build, fixture replay, pure tests; plus a fixture matrix (`coverage_absent`, `fetch_failed`, sell, wait) and a schema-contract test that inserts each provenance state. | MISSING | S | 7 |
| 9 | Run-level deadline with cancellation and graceful degradation into `fetch_failed`; streamed partial verdicts. | MISSING | M | 6 |
| 10 | Migration tooling (Supabase CLI migrations with a ledger) and generated DB types, removing about 244 casts at the boundaries. | MISSING | M | 6 |

## 23. What I would rebuild first

In order, over roughly six weeks for one senior engineer:

1. **Week 1 (stop the bleeding):** widen both CHECK constraints to the five states; check every supabase-js `{ error }` in the webhook, the documents audit, and monitor runs; replace the global cap with per-plan budgets plus an edge rate limit; meter site-detail; move the pre-push steps into required CI; fix the red test; add partitions through 2030 plus a maintenance job; add Sentry.
2. **Weeks 2 to 3: the evidence store.** Wrap production runs in a recording cassette (the code exists; `mode` just has to become "record to object storage" per run). Store `evidence_uri`, `evidence_sha256`, `model`, `prompt_set_hash`, `code_sha`, and `degradation` on `verdicts`. Ship `scripts/replay-verdict.ts <id>`. This is the institutional differentiator and it is mostly already written.
3. **Weeks 3 to 6: tenancy and the provider context.** `org_id` on every table, Clerk Organizations, RLS enforced on read paths via Clerk-issued Supabase JWTs, and the provider context object with a market router, migrating the 28 interfaces mechanically.

The archive worker comes next, before any national expansion.

## 24. The one thing that would make me say "I have never seen anything like this"

A **replayable verdict ledger**: every verdict KOANO has ever issued, re-executable offline byte for byte from its sealed evidence bundle, with a public verification endpoint. Paste a verdict ID and KOANO re-runs the deterministic aggregation on the frozen inputs and completions, shows the hash match, and diffs it against a fresh run on today's data ("on 14 Sept we said BUY at 69; here is exactly what moved since"). Bloomberg can show you a price history. Nobody in real estate can show you the frozen reasoning state behind a past recommendation, prove it was not edited afterwards, and replay it. KOANO already has the cassette, the deterministic aggregator, and the append-only table. It is about 70 percent built and is described nowhere as a product.

---

## 25. VISION (requires capital, partners or scale not in hand)

Kept separate from the grounded findings above.

- **Evidence ledger anchored externally** (VISION, needs a trust partner or public timestamping): Merkle-root each day's verdict hashes and anchor them with an RFC 3161 timestamp authority, so a lender's auditor can verify a verdict existed unaltered on a date without trusting KOANO.
- **National parcel graph** (VISION, needs Regrid or ATTOM-class licensing): a city-agnostic parcel ID (FIPS plus normalized APN) under every municipal layer, with per-city adapters generated from a declarative source manifest instead of hand-written providers. New metro onboarding measured in days.
- **Partner data plane** (VISION, needs two signed partners): partners publish feeds into KOANO's provider contract, KOANO meters every datum used per verdict and pays per use, and the coverage map becomes a live marketplace ("this layer lights up if your org connects X").
- **Calibration as a service** (VISION, needs 2 to 3 years of archive history): every verdict's evidence bundle scored against realized outcomes from the archive, with per-agent and per-market calibration curves published, so the confidence number becomes empirically calibrated.
- **Dedicated ingestion infrastructure** (VISION, needs funding): object-store lakehouse (Parquet plus Iceberg) for the archive, Postgres only for serving, a scheduler fleet with per-source quotas, and a contractual data-retention posture suitable for regulated lenders.

---

## Sources

- https://dev.socrata.com/docs/app-tokens.html (Socrata throttling with and without app tokens)
- https://vercel.com/docs/functions/limitations (Vercel function max duration: Hobby 300s, Pro 800s)
- https://claude.com/pricing (Sonnet 4.6 at $3/$15 per MTok, cache write $3.75, read $0.30, 5-minute TTL; Sonnet 4.6 listed as legacy; current Sonnet $2/$10). Redirected from https://www.anthropic.com/pricing
- https://supabase.com/pricing (Pro: 8 GB disk included, Micro compute 1 GB RAM, 7-day daily backups, PITR add-on, SOC 2 on Team not Pro)

## Discrepancies vs the brief (section 3 of the prompt)

1. **"Verdicts are stored in an immutable, append-only table"**: true for UPDATE and DELETE (`schema.sql:143-155`) but not for TRUNCATE or trigger disabling, and the table's CHECK constraint only accepts `live` and `representative` (`schema.sql:118`), so verdicts in three of the five provenance states cannot be stored as the repo defines the schema.
2. **"A record/replay fixture asserts byte-identical decision output and gates every push"**: it asserts the decision surface only, excluding narrator prose (`scripts/lib/decision-surface.ts:1-14`), for one NYC address, through a client-side git hook that can be bypassed. There is no CI gate.
3. **"Five specialist agents ... run at temperature 0"**: true for specialists (`shared.ts:180`); the synthesis narrator runs at 0.4 (`synthesis.ts:232`). The narrator decides nothing, so this is consistent with the locked decision, but it is not "temperature 0" end to end.
4. **"Daily snapshot capture"**: snapshots are weekly-grained (`captured_week` = ISO Monday, `migration-008`), executed as seven daily shards (`cron/archive/route.ts:1-10`). All-NYC datasets are captured once per week on Mondays.
5. **"Tiers differ by the documents they produce and monitoring caps, not feature locks"**: tiers also differ by verdict and content rate limits (20 / 50 / 150 / 500 per rolling 24h, `koano-guard.ts:37-43`), and all are subject to a global cap of 50 per day.
6. **"Sonnet" runtime**: pinned to `claude-sonnet-4-6` (`shared.ts:16`), which Anthropic's pricing page now lists as a legacy model.
7. **Provider swap is "a one-line change"** (registry comment, mock `swap_note`s): true only for a same-shape, all-markets, all-users replacement. See Section 17.
8. **RLS "on every table"** (`schema.sql:6`): enabled, but the application never uses a client that RLS applies to (`lib/supabase/server.ts`), so RLS provides no isolation for app traffic.
9. **CLAUDE.md (not the brief) section 17** says "Clerk protects /dashboard and /api routes via middleware.ts". The middleware protects only `/dashboard` and `/onboarding` (`src/middleware.ts:7`); API protection is per-route `auth()` calls.
10. **"Supabase (Postgres, Pro tier)"** and **"Stripe (test mode)"**: Stripe test mode confirmed (test secret key prefix, test price IDs in `lib/stripe/client.ts:20-25`). Supabase tier is unverifiable from the repo.
