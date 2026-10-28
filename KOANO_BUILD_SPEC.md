# KOANO Master Build Spec

**Purpose:** build KOANO into its full product form: a living, time-aware model of New York City that watches every lot, remembers what the city overwrites, reasons in the open, brings deals to the user, carries decisions through to execution, and keeps score on its own accuracy.

**Scope:** product and infrastructure only. Legal entity, terms, compliance certifications and go-to-market are deliberately out of scope for this spec.

**Source material:** the audit in `/audit` (files 00 to 08 and `panel/`). Every phase below cites the audit items it resolves. When this spec and the audit disagree, this spec wins on scope and order. The audit wins on facts about the current code.

---

## How to use this file

1. Keep this file at the repo root, next to `/audit`.
2. Run **one phase per Claude Code session**, in order. Each phase ends with a working, deployable product and a green pre-push gate.
3. Paste the phase's prompt block (at the end of each phase) into a fresh Claude Code session.
4. Do not start a phase until the previous phase's acceptance criteria pass.

---

## Global rules for every phase

These apply to every session. Claude Code must follow them without being reminded.

**Locked decisions (never change):**
- The site font stays exactly as it is. Do not raise font changes.
- The KOANO logo always appears in its original blue. No navy or monochrome variants.
- Provenance honesty is non-negotiable. Never hide a representative, failed or uncovered input. Never inflate confidence. Never claim coverage that does not exist.
- Decision math is deterministic code. LLMs extract facts, critique with evidence-cited flags, and narrate under verification. LLMs never set a number or category that enters a decision.
- Landlords and flippers are not an audience. Ownership, debt and distress features are built for developers, brokers, institutional acquirers, lenders, tenants and civic users.
- The white-labeled CMA and every client-facing document carry no KOANO branding.
- Marketing renders keep the architectural diorama house style.

**Engineering discipline:**
- Plan before coding. Write the plan to `/build-log/phase-N-plan.md` and follow it.
- Ship in slices. One slice per commit, each with a clear message.
- The pre-push gate (full `next build` plus fixture replay) must stay green. Re-record a fixture only for a reviewed, intended change, and write the diff justification to `/build-log`.
- Every new provider returns `ProviderResult<T>` with one of the five provenance states. On failure it returns `fetch_failed` with `data: null`. No stand-in data under `fetch_failed`.
- Any provider claiming national coverage is tested against a non-NYC address before it is trusted.
- Five runs minimum to separate model wobble from a real change.
- No em dashes in user-facing copy.
- Every phase updates `CLAUDE.md` so the build bible matches the code.

**Data sourcing rule:** free public data first. Where a capability truly needs paid data (national parcels, MLS, street imagery, construction cost), build the provider interface and a `partner` adapter behind a feature flag, use the free fallback where one exists, and label the gap honestly in the coverage map. The product must be complete with the free data and better with partner data.

---

## Coverage model

KOANO expands by metro, not by state. Zoning, permits and violations are kept by cities. Deeds and assessments are kept by counties. A state is a rules layer: rent regulation, tax incentives, disclosure law, corporation records. So coverage is built in three layers and delivered in three tiers.

**Layers:**

| Layer | Covers | Source |
|---|---|---|
| National | Flood, hazards, climate, demand, mortgages, jobs, prices, contamination | Federal datasets (already live) plus partner parcel and deed feeds |
| State | Rent regulation, abatement programs, disclosure rules, corporation registries | State law encoded as configuration, state business registries |
| Municipal / county | Zoning, permits, violations, ownership registration, deeds, assessments, land-use approvals | Each city's open data portal and county recorder |

**Tiers (shown on every verdict and in the coverage map):**

| Tier | What the user gets | How it is built |
|---|---|---|
| **Deep** | Full reasoning: zoning engine, permits, violations, ownership and debt graph, entitlement odds, site radar, archive | City adapters on free municipal data. NYC first, then Northern New Jersey (Phase 4B), then further metros |
| **Standard** | Parcel, owner, deeds, mortgages, assessor values, national zoning lookup, federal layers, land residual | Partner adapters (Regrid or ATTOM, a national zoning provider, a national permit provider) |
| **Baseline** | Federal layers only, with a capped confidence | Works today with no partner connected |

The coverage map names the tier for each address and the feed that would raise it. KOANO never presents a Standard or Baseline address as Deep.

**Deep metro expansion order after NYC** (a starting hypothesis from the audit's tycoon panel, to be validated): Northern New Jersey (Jersey City, Hoboken, Newark), then Los Angeles, then Chicago, Boston, Washington DC and San Francisco. Pick metros where regulation drives value and open data is strong. Serve Sun Belt markets at the Standard tier first.

---

## Build timeline

Estimates assume one founder working full-time with Claude Code, at the pace the repo history shows (about 150 commits from April to October 2026). A second engineer cuts the total by about 40 percent.

| Phase | What it builds | Solo estimate | With one engineer |
|---|---|---|---|
| 0 | Correctness and integrity fixes | 1 to 2 weeks | 1 week |
| 1 | Truth layer: full source inventory, point-in-time capture, city adapter kit, national parcel ID, state rules, Standard tier | 7 to 9 weeks | 4 to 5 weeks |
| 2 | Reasoning layer: scorecards, zoning, underwriting, sealed verdicts | 7 to 8 weeks | 4 to 5 weeks |
| 3 | Experience layer: app shell, Bench, Trace, app and marketing-site mobile, documents | 7 to 8 weeks | 4 to 5 weeks |
| 4 | Proactive engines: radar, ownership and debt graph, signals | 6 to 7 weeks | 4 weeks |
| 4B | First new Deep metro: Northern New Jersey | 3 to 4 weeks | 2 weeks |
| 5 | Execution layer: sentence-to-building, data room, capital, IC | 8 to 9 weeks | 5 weeks |
| 6 | Accountability and platform: ledger, counterfactuals, API | 6 to 8 weeks | 4 to 5 weeks |
| **Total** | **Full product** | **45 to 55 weeks (about 10.5 to 13 months)** | **29 to 33 weeks (about 7 to 8 months)** |

**The one thing no build speed shortens:** the scored forecast record needs real time to pass. Forecasts start accumulating in Phase 2. The first 12-month outcomes resolve about a year after that. Phase 6 publishes a deterministic backtest on 20 years of reconstructable history so the accuracy story is credible on launch day, then lets the live record compound.

**Pitch-ready checkpoint:** after Phase 4B (about 7 to 8 months solo), KOANO is Deep in two metros and Standard nationally. After Phase 4 alone (about 6.5 months solo), KOANO already does something no competitor does: it finds sites across the whole city, prices them, and proves its reasoning. Phases 5 and 6 turn it from category-defining into hard to compete with.

---

## Short-term track: UI-first sprint

The UI-first sprint lives in its own file, `KOANO_UI_SPRINT.md`. Run it before Phase 0. It covers the mobile render system, mobile dashboards for every cluster, the A1 to A19 aesthetic fixes, and the correctness fixes the UI depends on. Phase 0 below then confirms anything the sprint already closed.

---

## Phase 0: Correctness and integrity (1 to 2 weeks)

**Goal:** KOANO never states anything false. Every later phase builds on this.

### What it builds
- Keep the 175 3rd St demo in the hero, fixture and demo video as a recorded illustrative example (founder decision). Label it on the site as "Recorded example run, August 2026. Illustrative of how the engine reasons." Remove the LIVE badges from the marketing replay. If the UI-first sprint already did this, confirm it and move on.
- Add DOB NOW Job Filings (`w9ak-ipjd`) to permits and filings. Classify NB and DM by job type. Stop counting the subject's own permits as neighborhood pipeline.
- Guard the FAR nudge (`lib/agents/direction.ts`): suppress it and flag the site when there is an active NB or DM job, a co-op or condo class, a likely-stabilized building (6+ units, pre-1974), or landmark status.
- Valuation guardrails: no building-area valuation for co-op, condo or 7+ unit subjects. Band, midpoint and HPI adjustment computed on one comp pool. Subject excluded from its own comps. Fix Exhibit B's weight row.
- Widen `verdicts` and `documents` provenance CHECK constraints to all five states. Check every supabase-js `{ error }` (webhook, documents audit, monitor runs).
- Remove `bachelors_or_higher_pct` and the gentrification-stage step from `demand-sentiment.ts`. Add a banned-language gate to `grounding.ts`.
- Fix crime labels and the year-over-year window (`fbi-ucr.ts`).
- Strip KOANO branding from white-label documents. Suppress empty letterheads.
- Stop the seven NYC providers returning stand-in data under `fetch_failed`.
- Persist `weighting_breakdown` with the verdict so rebuilt math includes the nudge.
- Enable RLS on `contamination_cache` and `bps_cache`.

### Issues fixed (audit IDs)
Roadmap 30-1, 30-4, 30-5, 30-6, 30-8, 30-10, 30-14, 30-17. Kill list 1 to 6, 18, 24. System map findings 1, 6, 7, 10.

### Acceptance criteria
- The new demo site, run end to end, produces no fact a professional could disprove from DOB NOW, ACRIS or HPD in ten minutes.
- A co-op unit address prints "no unit-comparable valuation available" with the reason.
- A Chicago address persists its verdict.
- Fixture replay green with a reviewed re-record.

### Prompt
```
Read KOANO_BUILD_SPEC.md (Global rules and Phase 0) and the /audit folder,
especially audit/01_executive_summary.md, audit/05_product_roadmap.md items
30-1, 30-4, 30-5, 30-6, 30-8, 30-10, 30-14, 30-17, and audit/panel/real_estate_tycoon.md section 0.
Execute Phase 0 only. Write the plan to /build-log/phase-0-plan.md first,
then implement slice by slice with one commit per slice. Keep the pre-push
gate green. Verify each fix against live data where possible, including one
non-NYC address. When done, write /build-log/phase-0-report.md listing what
changed, what was verified, and anything you could not complete.
```

---

## Phase 1: Truth layer (7 to 9 weeks)

**Goal:** KOANO knows the city better than any single public tool, remembers what the city forgets, and is built so the next city is configuration rather than a rewrite.

### What it builds

**Source inventory:** build every dataset in Appendix A, tiers 1 and 2. That takes KOANO from about 25 live sources to about 55. Where Appendix A marks a dataset ID "to confirm", look it up in the Socrata catalog (`api.us.socrata.com/api/catalog/v1?domains=data.cityofnewyork.us`) and record the confirmed ID in the provider file.

**Coverage architecture (see the Coverage model section):**
- **City adapter kit:** normalized schemas for parcels, permits, violations, zoning, ownership registration and land-use actions. A declarative source manifest per city (dataset IDs, field mappings, update cadence, scope keys). NYC becomes the first manifest, so its providers map through the kit instead of hard-coding NYC IDs.
- **National parcel ID:** county FIPS plus normalized parcel number as the universal key under every city. BBL stays as the NYC-local key, joined to the national ID.
- **State rules layer:** rent regulation, abatement programs, disclosure rules and corporation registry access as configuration per state, consumed by the scorecards in Phase 2. New York and New Jersey first.
- **Coverage tiers** (Deep, Standard, Baseline) computed per address and shown in the coverage map.
- **Standard tier partner adapters** behind flags: national parcels and deeds (Regrid or ATTOM), a national zoning lookup, and a national permit provider (verify coverage and terms first). Federal layers remain the Baseline.
- **Per-city fixtures:** each market gets its own replay fixture.

**Data:**
- **ACRIS ingestion:** deeds, mortgages, assignments, satisfactions, lis pendens, parties (`636b-3b5g` and related master, legals and parties tables). Joined to BBL.
- **ZAP ingestion:** land-use projects since 1970, actions, status, CB recommendations, outcomes (`hgx4-8ukb` and related). BSA and LPC records. E-designations. Historic districts and landmarks.
- **HPD expansion:** registration contacts with all roles and addresses, litigation (`59kj-x8nc`), AEP, CONH list, evictions, 311 housing complaints.
- **DOF expansion:** assessment rolls, tax classes, abatements and exemptions (421-a, J-51), condo unit lots, classes 07 and 08 multifamily sales with $/unit.
- **Rent stabilization estimate:** building-level indicator from DHCR building lists and tax-bill-derived unit counts.
- **Archive v2:** a `record_versions` table storing record-level changes (hash on change, first-seen timestamps, tombstones) for every dataset the city overwrites. Runs weekly citywide on a worker outside Vercel's 300-second limit (GitHub Actions or a small queue worker). Insert-only database role. Weekly off-site snapshot. External liveness check on a separate host.
- **Shared input cache** with time-to-live set by each dataset's update cadence.
- **National parcel spine:** a context-aware provider interface (`{ addr, tenant, credentials, deadline, market }`), a market router, and a Regrid or ATTOM `partner` adapter behind a flag. Free Census and federal layers remain the fallback.
- **Coverage map v2:** layers identified by stable IDs instead of regex on source strings. Omitted federal signals no longer tagged `live`.

### Issues fixed
Data strategist problems 1 to 8. Roadmap 30-3, 90-6 (data half), 90-8 (data half), 90-11, 90-12, 90-17 (cache). Engineer section 17 (partner integration path). User role-play problems 4, 7, 8.

### New capabilities added
Point-in-time history of overwritten records citywide. Multifamily comps. Real entitlement history. Debt and lien data. Rent stabilization signal. A partner data path that makes national coverage a configuration, not a rebuild.

### Acceptance criteria
- For any NYC BBL: full deed and mortgage chain, active and historic DOB NOW jobs, ZAP actions on the lot and block, HPD contacts and litigation, tax and abatement status, stabilization estimate, all with provenance.
- `record_versions` captures a full citywide weekly cycle with zero silent gaps.
- A partner adapter returns `partner`-tagged data for a non-NYC address with the flag on, and the product degrades honestly with it off.
- Every Appendix A tier 1 and tier 2 dataset is live, provenance-tagged, and listed on `/data` (generated from the registry).
- NYC runs entirely through the city adapter kit and its manifest, with the NYC fixture still green.
- Every address returns a coverage tier. A Phoenix address shows Standard with partners on and Baseline with them off, and never shows Deep.

### Prompt
```
Read KOANO_BUILD_SPEC.md (Global rules, Coverage model, Phase 1 and
Appendix A) and /audit, especially audit/panel/data_strategist.md,
audit/panel/engineer.md sections 3, 14, 15, 17 and 25, and
audit/03_vision.md section 2.3. Confirm Phase 0 acceptance criteria pass
before starting. Execute Phase 1 only. Plan first in /build-log/phase-1-plan.md.
Build every Appendix A tier 1 and tier 2 provider, the record_versions archive
and worker, the cache, the city adapter kit with NYC as the first manifest,
the national parcel ID, the state rules layer for NY and NJ, coverage tiers,
the context-aware provider interface with the Standard tier partner adapters
behind flags, and coverage map v2. Write /build-log/phase-1-report.md at the end.
```

---

## Phase 2: Reasoning layer (7 to 8 weeks)

**Goal:** every decision is computed from typed facts by versioned code, explained by a verified narrator, and sealed so it can be replayed forever.

### What it builds
- **Feature store:** every provider value becomes a typed feature with `as_of`, source, provenance and snapshot hash.
- **Deterministic lens scorecards** replacing LLM votes. Four rule sets:
  - **Develop:** buildable square feet you can actually get, entitlement path, land residual vs ask. Verdict vocabulary ADVANCE / HOLD / PASS.
  - **Acquire:** going-in and stabilized cap, DSCR at market debt, levered IRR at ask, stabilization exposure. BUY / HOLD / PASS.
  - **Price:** unit-level value range from the right comp class.
  - **Tenant:** habitability, landlord conduct, owner network. Plain findings, no investor verbs.
- **Zoning engine v1:** as-of-right FAR, height, setbacks and lot coverage for R6 to R10 and common commercial districts, City of Yes UAP bonuses, special district overrides for the most common districts. Every rule cites its Zoning Resolution section.
- **Underwriting engine:** NOI, cap rates, levered and unlevered IRR, equity multiple, cash-on-cash, DSCR and LTV loan sizing, sources and uses, 5 and 10 year exits, sensitivity grids. Every assumption carries provenance (live, partner, representative, or user-provided).
- **Land residual engine:** max supportable land $/buildable sq ft at the user's program, cost, rent, cap and rate. 485-x eligibility and wage tier.
- **LLM roles rebuilt:**
  - Extractor with structured outputs and citations.
  - Adversarial critic emitting typed flags (for example `ACTIVE_CONSTRUCTION_ON_SUBJECT`) whose effects are defined in code.
  - Claim-graph narrator, with a verifier that checks every number, entity and the stance of every sentence. Unverifiable sentences are withheld visibly.
- **Model migration** to current Claude models with zero dependence on temperature.
- **Sealed verdicts:** every production run recorded to object storage (provider results, completions, model ID, prompt hashes, code SHA). `evidence_sha256` on the verdict row. `scripts/replay-verdict.ts`.
- **Internal forecast ledger:** each verdict emits probabilities on pre-registered, decision-level events (residual vs next recorded sale on the lot; ADVANCE or PASS vs filing or trade by an unrelated party within 24 months). Information-set exclusion. Append-only outcomes resolved point-in-time. Daily hash.
- **Shadow panel:** monthly deterministic forecasts on a stratified sample of NYC lots.
- **Fixture matrix:** NYC live, non-NYC coverage_absent, degraded fetch_failed, partner, and one fixture per lens.

### Issues fixed
AI expert problems 1 to 10. Tycoon problems 3, 5, 7, 8, 9. Roadmap 30-2, 90-1, 90-2, 90-3, 90-7. Engineer problems 1, 9. Kill list 17, 24, 25, 31, 32.

### New capabilities added
Real underwriting, a real zoning engine, real land pricing, replayable verdicts, and the start of the accuracy record.

### Acceptance criteria
- Same inputs give byte-identical decisions across runs and model versions.
- Every lens produces its own verdict vocabulary and never applies development logic to a tenant or a listing.
- Any production verdict replays from its sealed evidence.
- The ledger has forecasts accumulating daily for user verdicts and the shadow panel.

### Prompt
```
Read KOANO_BUILD_SPEC.md (Global rules and Phase 2) and /audit, especially
audit/panel/ai_expert.md sections 3 and 4, audit/panel/real_estate_tycoon.md
sections 3, 4 and 10, audit/panel/engineer.md section 23, and
audit/08_red_team.md Attack 2. Confirm Phase 1 passes. Execute Phase 2 only.
Plan first. Build the feature store, the four lens scorecards, the zoning
engine, the underwriting and land residual engines, the rebuilt LLM roles
with the verifier, sealed verdicts with replay, the internal forecast ledger,
the shadow panel and the fixture matrix. Report in /build-log/phase-2-report.md.
```

---

## Phase 3: Experience layer (7 to 8 weeks)

**Goal:** the reasoning becomes the interface. The dashboard clearly beats every competitor on the first screen and works on a phone.

### What it builds
- **Design system:** AA color ink tokens, 4px spacing scale, type scale with an 11px floor, motion tokens, focus rings, primitive components (Panel, Callout, Table, Badge, Stat, Input). Inline styles and attribute-selector mobile overrides retired.
- **Responsive shell:** icon rail, top bar, bottom tabs on mobile. Plain lens names (Develop, Acquire, Price, Property). No cluster numbers anywhere.
- **One subject, one URL, many lenses:** `/p/{bbl}?lens=`, persistent subject across lens switches. Shareable sealed verdict page `/v/{id}`.
- **Global search:** autocomplete, recents, BBL entry, paste-many, candidate picker with lot outline.
- **Fixed verdict band** at the top of every lens. Evidence drawer (math, reasoning, sources, coverage, changelog).
- **The Bench:** live provider and agent events, vote rail, score needle, decision shown before narration.
- **Trace:** pull any number back to the city record, with provenance encoded in the line and gaps shown as cuts. Works on screen and from PDF deep links.
- **Lens redesigns** per `audit/04_redesign_spec.md` section 4: Develop with progressive ranking, Acquire with "This week" as the hero, Price with the range as the hero, Property split into owner and renter paths.
- **Watch from every lens,** usage meter, upgrade flow for document paywalls.
- **Documents:** every implemented type reachable, DOCX for CMA and IC memo, true white-label, verification link on non-white-label documents, typography pass, IC memo financial sections filled from the underwriting engine.
- **Branded map style,** small-multiple site frames, clickable and keyboard-accessible markers, linked selection across table, chart and map.
- **Marketing site, mobile-first rebuild** (homepage, every `/for` page, `/pricing`, `/intelligence`, `/about`, `/data`):
  - Diorama renders shown on phones through dedicated mobile crops, instead of being hidden below 900px (`globals.css:465-475`).
  - All attribute-selector overrides in `globals.css:326-603` replaced with real responsive classes from the design system.
  - Homepage hero card rebuilt as a solid white card per `CLAUDE.md` §10, with legible agent chips, a pause control, reduced-motion support, and a label marking the loop as a recorded run.
  - A live address box in the homepage hero that resolves the lot and returns the new sealed sample verdict, or a signup prompt with the lot outlined.
  - Every scroll-reveal section renders correctly without JavaScript animation firing (no blank sections for crawlers, link previews or reduced-motion users).
  - Auth-aware nav: signed-in users see "Dashboard" instead of "Sign in / Sign up".
  - Font and logo unchanged.

### Issues fixed
Design engineer problems 1 to 10. Product designer problems 1 to 10. Roadmap 30-7, 30-16, 30-18, 30-26, 90-4, 90-5, 90-9, 90-15. Kill list 9, 10, 16, 29. Competitor teardown rows 1, 2, 4, 9, 11, 12.

### New capabilities added
A signature interaction no competitor can copy without per-figure provenance. Mobile. Sharing. A complete IC memo.

### Acceptance criteria
- At 390px every lens is fully usable.
- Every text and badge passes WCAG AA. Every action is keyboard reachable.
- The verdict appears in the same place in every lens, and the decision shows before the narration.
- A user can Trace any figure to its source record in four clicks or fewer.
- Every marketing page passes the same 390px test as the app: no horizontal scroll, no hidden renders, no blank sections, every CTA reachable, verified with full-page mobile screenshots saved to `/build-log/phase-3-mobile/`.

### Prompt
```
Read KOANO_BUILD_SPEC.md (Global rules and Phase 3) and /audit, especially
audit/04_redesign_spec.md in full, audit/panel/design_engineer.md and
audit/panel/product_designer.md. Confirm Phase 2 passes. Execute Phase 3 only.
Do not change the font or the logo. Plan first. Build the design system,
responsive shell, URLs, search, verdict band, evidence drawer, the Bench,
Trace, the lens redesigns, watch everywhere, documents, map upgrades, and the
mobile-first rebuild of the marketing site. Capture full-page screenshots of
every app lens and marketing page at 390px and 1440px as proof.
Report in /build-log/phase-3-report.md.
```

---

## Phase 4: Proactive engines (6 to 7 weeks)

**Goal:** KOANO comes to the user. It finds the deal before anyone asks.

### What it builds
- **Site radar:** user-defined buy boxes (boroughs, districts, minimum buildable square feet, maximum ownership tenure, exclusions). Nightly deterministic scoring of every NYC lot. Monday ranked brief with envelope, owner chain, debt, and supportable land value. Real-time alerts for new qualifying sites.
- **Ownership and debt graph:** LLCs resolved to operators through HPD contacts, ACRIS parties and signatories, DOB NOW owner fields and state corporation records. Mortgages, assignments, satisfactions and lis pendens on the edges. Point-in-time. No name-only merges of individuals. Every edge sourced with a confidence.
- **Maturity wall radar:** inferred loan maturities from recorded mortgages, refinance gap at current rates, a citywide map of who needs equity in the next 12 months.
- **Distress pre-signals:** lien sale list, ECB balances, managing-agent churn, permit abandonment, tax arrears, lis pendens, combined into a weekly early-warning score.
- **Competing-supply radar:** block-level pipeline from DOB NOW, with alerts when a new building is filed near a watched site.
- **Entitlement module:** descriptive ULURP, BSA and LPC outcome rates and timelines by community district and action type, from ZAP history.
- **Verdict changelog:** when a stored verdict would change today, show exactly which input moved it.
- **"How the block moved" timeline** from the archive.

### Issues fixed
Tycoon opportunities 1, 2, 5, 6. Data strategist opportunities 3, 4, 6, 7. Roadmap 12-1, 12-3, 30-25. Competitor opportunity 9. Red team Attack 5 and the alternative bet in its section 4.

### New capabilities added
Zero-input value. The off-market sourcing engine. Real entitlement intelligence.

### Acceptance criteria
- A buy box returns a ranked, explainable list on the next nightly run, with every lot passing the Phase 0 guards.
- The ownership graph resolves a known multi-building operator correctly and refuses unsafe merges.
- Monday briefs deliver on schedule with gap detection.

### Prompt
```
Read KOANO_BUILD_SPEC.md (Global rules and Phase 4) and /audit, especially
audit/03_vision.md sections 2.4, 2.5 and 2.12, audit/panel/real_estate_tycoon.md
sections 6 and 11, and audit/panel/red_team_attacks.md section 4. Confirm
Phase 3 passes. Execute Phase 4 only. Plan first. Build the site radar,
ownership and debt graph, maturity wall, distress signals, competing-supply
radar, entitlement module, verdict changelog and block timeline. Respect the
locked audience rule: no landlord or flipper tooling. Report in
/build-log/phase-4-report.md.
```

---

## Phase 4B: First new Deep metro, Northern New Jersey (3 to 4 weeks)

**Goal:** prove the city adapter kit works by bringing a second market to Deep coverage, with the full product (radar, graph, scorecards, documents) running on it.

**Why Northern New Jersey first:** Jersey City, Hoboken and Newark share NYC's developers, brokers and institutional investors, so every existing NYC user is an immediate user there. It also exercises the state rules layer with a second state.

### What it builds
- A New Jersey manifest in the city adapter kit for Jersey City, Hoboken and Newark: parcels and assessments (NJ MOD-IV statewide property tax data), zoning, building permits, code enforcement, and deeds from county recorders, wherever each city or county publishes them.
- New Jersey state rules: rent control (municipal in NJ, so per-city configuration), tax abatement programs (PILOT and the Five-Year Tax Exemption program), NJ corporation registry for the ownership graph.
- Archive v2 capture for the NJ datasets the cities overwrite.
- Site radar, ownership and debt graph, lens scorecards and documents running on NJ addresses.
- An NJ fixture in the replay gate.
- Before building each source, confirm what the city actually publishes and its terms. Where a layer is not published, it stays `coverage_absent` with the gap named, and the address is shown as Deep only for the layers that exist.

### Issues fixed
Engineer section 20 ("every US metro" failure mode). Tycoon section 7 geography ranking. VC metric "second metro at parcel depth".

### Acceptance criteria
- A Jersey City address returns a Deep-tier verdict with zoning, permits, assessments and ownership live, and every missing layer named.
- A buy box spanning NYC and Jersey City returns ranked sites from both markets.
- Adding NJ required no NYC-specific code changes, only a manifest, state rules and adapters.
- The time to add NJ is recorded in `/build-log` as the benchmark for future metros.

### Prompt
```
Read KOANO_BUILD_SPEC.md (Global rules, Coverage model and Phase 4B) and
/audit, especially audit/panel/engineer.md sections 17 and 20 and
audit/panel/real_estate_tycoon.md section 7. Confirm Phase 4 passes. Execute
Phase 4B only. Plan first, starting with a source audit of what Jersey City,
Hoboken, Newark, Hudson County, Essex County and the state of New Jersey
actually publish, with terms. Build the NJ manifest, state rules, archive
capture, and run the radar, graph, scorecards and documents on NJ addresses.
Add an NJ fixture. Record how long the market took. Report in
/build-log/phase-4b-report.md.
```

---

## Phase 5: Execution layer (8 to 9 weeks)

**Goal:** KOANO carries the decision forward, from a sentence to a building, from an OM to a reconciled underwrite, from a verdict to a committee and a lender.

### What it builds
- **Sentence-to-building:** a sentence parsed into typed parameters, then the zoning engine produces a 3D envelope on the lot, unit mix, 485-x path, cost range, residual and verdict. Every rule cites its Zoning Resolution section. Construction cost from DOB NOW estimated job costs with a partner adapter for cost data.
- **Data room reconciler:** upload OM, rent roll, T-12, plans. Structured extraction with page and cell citations under a new `user_document` provenance state. Three-column view: broker claims, public record, impact on returns. Each discrepancy recomputes the underwrite.
- **Vision on documents:** floor plans to unit mix and areas, cross-checked against the certificate of occupancy and PLUTO.
- **Capital match:** comparable financings from recorded mortgages by asset type, size, district and sponsor, with lender activity profiles.
- **Action drafts:** owner outreach letter, LOI with every fact-dependent clause flagged, lender package. All grounded in the sealed verdict. Sent only on explicit user approval.
- **IC autopilot:** the IC memo as a live object. Committee questions answered only from sealed evidence with claim verification. "I cannot answer that from the evidence" when true. Every exchange appended to the sealed record. Presenter mode.
- **Ask KOANO:** chat that answers from the verdict record and engine functions. What-ifs create new labeled scenarios in the append-only table and never silently change a verdict.
- **Excel and ARGUS-ready export** of every table, model and comp set.
- **Token ledger metering** for documents, chat and extraction.

### Issues fixed
Competitor teardown rows 3, 5, 10, 12 and section 8.4 items 1, 4, 5, 7, 10. AI expert opportunities 4, 6, 8. Tycoon opportunities 3, 7, 8. Roadmap 90-14, 12-9, 12-10, 12-12.

### New capabilities added
Everything Diald does, done without contradicting itself, plus public-record reconciliation and execution steps no competitor offers.

### Acceptance criteria
- A sentence produces a compliant envelope and residual in under 15 seconds with every rule cited.
- An uploaded OM produces a reconciliation table where every extracted value links to its page.
- Chat answers never disagree with the dashboard on any number.

### Prompt
```
Read KOANO_BUILD_SPEC.md (Global rules and Phase 5) and /audit, especially
audit/02_competitors.md sections 8 and 15, audit/03_vision.md sections 2.6,
2.8 and 2.9, and audit/panel/ai_expert.md sections 6 and 7. Confirm Phase 4
passes. Execute Phase 5 only. Plan first. Build sentence-to-building, the data
room reconciler, document vision, capital match, action drafts, IC autopilot,
Ask KOANO, Excel and ARGUS export, and token metering. Report in
/build-log/phase-5-report.md.
```

---

## Phase 6: Accountability and platform (6 to 8 weeks)

**Goal:** KOANO proves it is right, models the future, and becomes the layer other products build on.

### What it builds
- **Deterministic backtest** of the guarded scorecards on reconstructable history (DOF annualized sales since 2003, archived PLUTO since 2002, DOB permits since 2016) with look-ahead controls. Published methodology.
- **Track Record page:** reliability curves, skill against base-rate and momentum baselines, resolution, exclusions with reasons, era breakdown. Aggregate only. Shows "insufficient data" honestly until counts pass the publication gate. Public daily hash of the ledger.
- **Counterfactual engine:** toggle rezonings (from live ZAP projects), rate moves, transit lines, flood map revisions. Lots, residuals, verdicts and portfolio exposure recompute deterministically, with the distribution of outcomes and the assets that flip.
- **Point-in-time twin UI:** time slider on every lot and map. "What was knowable then" toggle on every artifact.
- **Reasoning API v1:** metered, read-only sealed verdicts, coverage maps, envelopes and event probabilities. Partner SDK with a contract-test harness built on the cassette.
- **Private data enclave:** a fund's own rent rolls and deal history in its own tenant, sharpening its verdicts, never shared. Organization model, roles and enforced row-level security.
- **City Pressure Index:** weekly index of permits, filings, violations, ownership churn and distress by community district, published with methodology and downloadable history.
- **Tenant Building Record:** free habitability and landlord-conduct dossier for every multiple dwelling.
- **Site-walk mode:** mobile, location and heading resolve the lot, verdict band and headline facts by voice. Street imagery signals labeled as model-inferred and kept out of deterministic decisions unless confirmed.

### Issues fixed
VC problems 2, 3, 6. Data strategist opportunities 1, 2, 5. Engineer problems 3, 6. Roadmap 90-10, 90-18, 90-19, 12-2, 12-6, 12-8, 5Y items 1, 3, 4. Red team Attack 3.

### New capabilities added
A public accuracy record. A model of the city's future. A platform others embed.

### Acceptance criteria
- The backtest is reproducible from a single script and documented.
- The Track Record page renders from live tables and never shows a claim the data does not support.
- A counterfactual on a live ZAP project produces a lot-by-lot impact map.
- The API serves a sealed verdict that replays to the same hash.

### Prompt
```
Read KOANO_BUILD_SPEC.md (Global rules and Phase 6) and /audit, especially
audit/panel/ai_expert.md section 4, audit/03_vision.md sections 2.1, 2.7,
2.10, 2.11 and 2.12, and audit/08_red_team.md Attacks 2, 3 and 9. Confirm
Phase 5 passes. Execute Phase 6 only. Plan first. Build the backtest, Track
Record page, counterfactual engine, time slider, reasoning API with partner
SDK, private data enclave with organizations and RLS, City Pressure Index,
Tenant Building Record and site-walk mode. Report in /build-log/phase-6-report.md.
```

---

## Why each capability is rooted in real demand

Every major capability maps to money professionals already spend today. Figures are from the audit's competitor research (`audit/02_competitors.md`, `audit/panel/vc_and_ma.md`, `audit/panel/gtm_pricing.md`), each sourced there.

| Capability | The real job it does | Proof that people pay for it today |
|---|---|---|
| Site radar and ownership graph | Sourcing deals before competitors; where most deals are won or lost | Altus bought Reonomy (ownership and owner unmasking) for $201.5M; Reonomy sells from $400/month |
| Maturity wall and distress signals | Finding motivated sellers and refinance gaps in a high-rate market | Reonomy, ATTOM and RCA sell distress and debt data nationally; CarbonAI raised $12M for lender agents |
| Zoning engine and sentence-to-building | "What can I build here" in minutes, not days | TestFit sells site planning at $15,000 to $20,000 per year; Deepblocks up to $500/month; NYC architects charge for pre-purchase zoning studies |
| Underwriting and land residual | "Does this deal pencil" | Diald (raised $4.75M), Henry ($16.5M Series A), Archer from $500/month, ARGUS as the industry standard |
| Data room reconciler | Checking the broker's claims during diligence | Rely ($4.5M), Cadastral ($9.5M), Keyway ($40M raised), Smart Capital Center at $350 per property per month |
| IC autopilot and complete IC memo | The one meeting where capital moves | Fifth Dimension raised $26M for IC memo and portfolio agents; V7 and Build.inc sell IC memo agents |
| Portfolio monitoring | Knowing what changed before the committee asks | Dealpath ($43M Series C, 300+ firms); Juniper Square raised $130M for AI on fund workflows |
| Capital match | Finding the lender | Lev raised $30M for a financing marketplace |
| Track record and sealed verdicts | Model risk teams and lenders asking "how do you know it works" | MSCI paid about 13.6x ARR for RCA's irreplaceable history; Diald markets an uncalibrated "probability" with no published record |
| Reasoning API and partner data | Data companies wanting an AI layer on their data | RealPage bought Cherre to power agentic workflows; Fitch agreed to buy Trepp for about $1B; Cotality, ATTOM, CompStak and Green Street all shipped AI connectors in 2026 |

---

## Where KOANO stands on the market when complete

### Against each competitor

| Competitor | Their strength | KOANO after Phase 6 |
|---|---|---|
| Diald AI | Conversational underwriting, licensed national data | Matches the underwriting, adds public-record reconciliation, sourcing, zoning depth and a track record. Its numbers cannot contradict each other; Diald's demo shows that theirs can |
| Reonomy (Altus) | National ownership data | Deeper in NYC: point-in-time ownership plus debt plus entitlement plus verdicts. National through partner data |
| TestFit | Generative site layout | Prices the site and decides, which TestFit does not. Integration is natural rather than competitive |
| Henry AI, Keyway, Fifth Dimension | Memos and extraction from deal documents | Same document layer, plus the parcel's public record and a scored decision |
| CoStar, Cotality, ATTOM, CompStak | The data | KOANO becomes the neutral reasoning layer their data plugs into under its own name |
| Claude or ChatGPT with connectors | Cheap, flexible answers | KOANO is proactive, reproducible, sealed, scored, and carries every figure's provenance. A general assistant answers when asked; KOANO watches the city and keeps a record |
| Dealpath, ARGUS | System of record for pipelines and cash flows | KOANO feeds them verdicts and exports rather than replacing them |

### The position

On the audit's positioning map (auditability of the conclusion vs distance to a finished decision), KOANO moves alone into the top-right corner: the only product whose conclusions are auditable and that carries the decision all the way to execution.

The one-sentence position: **the only real estate intelligence that finds the deal, proves its reasoning, carries it to execution, and shows you its track record.**

### What the finished product resolves

When all six phases pass, these audit findings are closed:
- Every flagship-verdict and valuation error (tycoon, user role-play).
- The LLM deciding votes and the temperature dependency (AI expert).
- Unsaved evidence, the provenance constraint, the scale ceiling on the archive, tenancy and observability (engineer).
- Every design, accessibility, mobile and IA problem (design engineer, product designer).
- The archive pointed at reconstructable data (data strategist).
- Every competitor gap in the Diald teardown (competitors).
- The red team's core product attacks: event design, priced-in signals, the time lock, and horizontal-AI substitution.

### What the product alone cannot prove

These remain true no matter how complete the build is, and an investor will ask about them:
- **Usage.** Paying users, retention and forwarded documents are the evidence that demand is real for KOANO specifically.
- **Time.** The live forecast record compounds only with calendar time. The backtest covers launch, the live record grows after.
- **National depth.** Outside NYC, depth equals the partner data connected. The architecture makes expansion a configuration; the data itself has to be licensed.
- **Legal and trust work** (excluded from this spec by choice) gates institutional buyers, lenders and city agencies.

---

## Appendix A: Source inventory

Three tiers. Tier 1 and tier 2 are built in Phase 1. Tier 3 is created by KOANO itself across Phases 1, 2, 4 and 6. Dataset IDs marked "to confirm" must be looked up in the Socrata catalog before building. "Existing" means KOANO already reads it today.

### Tier 1: Live public sources, NYC

| Dataset | ID | Status | Used for |
|---|---|---|---|
| DOF Rolling Sales | `usep-8jbt` | Existing | Comps (add classes 07 and 08 multifamily with $/unit) |
| DOF Annualized Sales (since 2003) | to confirm | Add | Backtests, long price history |
| DOF Property Valuation and Assessment | `8y4t-faws` | Add | Tax appeal, assessment anomalies, archive roll years before roll-off |
| DOF condo unit lots | to confirm | Add | Unit-level pricing |
| DOF tax lien sale list | to confirm | Add | Distress signals |
| DOF exemptions and abatements (421-a, J-51) | to confirm | Add | Tax program status per lot |
| MapPLUTO (current) | `64uk-42ks` | Existing | Zoning, lot facts |
| MapPLUTO archive (releases since 2002) | DCP archive | Add | Point-in-time twin, backtests |
| DOB NOW Approved Permits | `rbx6-tga4` | Existing | Permit history (fix NB classification) |
| DOB NOW Job Application Filings | `w9ak-ipjd` | Add | Active NB and DM jobs, pipeline, plan-exam cycle times |
| DOB legacy BIS Job Filings | `ic3t-wcy2` | Existing | Historical filings only (rename as "DOB filing record") |
| DOB complaints | `eabe-havv` | Existing | Violations panel |
| DCP Housing Database | to confirm | Add | Supply pipeline by units |
| ACRIS Real Property Master | to confirm | Add | Deeds, mortgages, document types |
| ACRIS Real Property Parties | `636b-3b5g` | Add | Ownership and debt graph |
| ACRIS Real Property Legals | to confirm | Add | BBL join for ACRIS documents |
| ZAP project data (since 1970) | `hgx4-8ukb` | Add | Entitlement history and odds |
| ZAP project BBLs and actions | to confirm | Add | Lot-level land-use actions |
| BSA applications and decisions | to confirm | Add | Variances and special permits |
| LPC landmarks and historic districts | to confirm | Add | Landmark guard, entitlement path |
| E-designations | to confirm | Add | Environmental restrictions on lots |
| HPD Violations | `wvxf-dwi5` | Existing | Violations, status paths |
| HPD Multiple Dwelling Registrations | `tesw-yqqr` | Existing | Registered owner |
| HPD Registration Contacts (all roles) | `feu5-w2e2` | Existing (expand) | Head officers, agents, addresses for the ownership graph |
| HPD Housing Litigations | `59kj-x8nc` | Add | Tenant product, operator quality |
| HPD Alternative Enforcement Program | `hcir-3275` | Add | Worst-buildings history |
| Certification of No Harassment list | `bzxi-2tsw` | Add | Tenant product |
| Speculation Watch List | `adax-9mit` | Existing | Landlord signals |
| Evictions (marshal-executed) | `6z8x-wfk4` | Add | Tenant product, distress |
| 311 Service Requests (housing types) | `erm2-nwe9` | Add | Habitability signals |
| OATH/ECB violations and balances | `6bgk-3dad` | Existing (expand) | Penalty balances for distress |
| DHCR rent-stabilized building list | to confirm | Add | Rent stabilization estimate |
| Tax-bill stabilized unit counts (NYCDB method) | to confirm | Add | Rent stabilization estimate (check source terms) |
| NYC capital projects | to confirm | Add | Infrastructure signals |
| MTA stations and ridership | to confirm | Add | Transit access and demand |
| NYC future floodplain maps (NPCC) | to confirm | Add | Forward flood risk |

### Tier 1: Live public sources, federal (national)

| Dataset | Status | Used for |
|---|---|---|
| Census geocoder | Existing | National geocoding |
| Census ACS | Existing | Housing stock and price context only (no resident composition in decisions) |
| Census Building Permits Survey | Existing | County supply |
| Census County Business Patterns | Add | Business demand |
| LEHD LODES (jobs by block) | Add | Job access and demand |
| FEMA NFHL, NRI, OpenFEMA | Existing | Flood and hazard |
| EPA SEMS and ACRES | Existing | Contamination |
| USGS seismic | Existing | Seismic (demote outside high-risk regions) |
| NOAA climate normals | Existing | Climate |
| NOAA sea level rise projections | Add | Coastal risk |
| HUD FMR, QCT and DDA | Existing | Rents, incentive zones |
| HUD LIHTC project database | Add | Affordable supply, incentive context |
| CFPB HMDA | Existing | Mortgage demand |
| BLS QCEW | Existing | Employment |
| BLS CPI | Add | Cost escalation |
| IRS SOI migration, Opportunity Zones | Existing | Migration, incentives |
| FHFA HPI | Existing | Price trends |
| Freddie Mac PMMS | Existing | Mortgage rates |

### Tier 2: Partner-ready adapters (built behind flags, `partner` provenance)

| Partner | Provides | Access route |
|---|---|---|
| Regrid | National parcels and geometry | Self-serve API |
| ATTOM | National deeds, mortgages, assessor data, AVMs, foreclosures | MCP server or API |
| National zoning provider (for example Zoneomics) | Zoning lookup outside Deep metros | API |
| National permit provider (for example Shovels, verify first) | Permits outside Deep metros | API |
| CompStak | Lease and sale comps | MCP server, user's own subscription |
| Cotality | Property, mortgage, hazard data | MCP server |
| Green Street | Institutional CRE research and comps | MCP server |
| First Street | Forward climate risk | API |
| Placer.ai | Foot traffic | MCP server |
| MLS via Trestle or Bridge | Listings, beds and baths, days on market | User connects their own MLS access |
| Construction cost data provider | Hard cost benchmarks | API (fallback: DOB NOW estimated job costs) |

### Tier 3: KOANO-original data (cannot be bought elsewhere)

| Asset | Built in | Why it is unique |
|---|---|---|
| Point-in-time archive of overwritten records | Phase 1 | HPD owner and agent history, violation and filing status paths, ZAP status changes exist only for weeks someone captured them |
| Ownership and debt graph | Phase 4 | Resolved operators with debt and inferred maturities, point-in-time |
| Derived signals: entitlement odds, plan-exam cycle times, maturity wall, distress score, City Pressure Index | Phases 4 and 6 | Computed from tier 1 plus the archive; not published by anyone for NYC |
| User-contributed data: uploaded documents, reported outcomes, analyst overrides | Phases 5 and 6 | Private to each user, sharpens their verdicts, labels for calibration |
| Sealed verdicts and the forecast ledger | Phase 2 onward | A scored record that grows only with time |

**Presentation rule:** `/data` groups sources into these three tiers with live counts. Never pad the list with weak sources, and never add resident demographics to any decision path.
