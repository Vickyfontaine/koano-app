# Panel 6.6: Data Strategist and Moat Architect

Persona: I built the data asset behind a proptech data company that sold for nine figures. That asset was not the data. Anyone could get the data. What we had was a record-level history of things the source overwrote, a resolved entity graph nobody else had paid to clean, and labels (outcomes) attached to our own predictions. Acquirers paid for those three things and nothing else. I am judging KOANO's archive and data strategy against that bar.

Date of review: 2026-10-19. Code read: `lib/archive/capture.ts`, `lib/archive/outcomes.ts`, `src/app/api/cron/archive/route.ts`, `lib/monitor/{detect,scan,digest}.ts`, `lib/providers/catalog.ts`, `lib/providers/real/nyc-*.ts`, `supabase/schema.sql`, migrations 006, 008 to 022, `.github/workflows/archive-liveness.yml`, `vercel.json`, `src/components/marketing/{ArchiveSection,DataContent}.tsx`. NYC dataset facts below were verified today by querying the Socrata metadata and SODA APIs directly (queries reproduced in the text), plus web sources listed at the end. I could not query production Supabase (no credentials, and the brief forbids touching it), so archive row counts and the number of tracked properties in production are **unverified**.

---

## 1. Bottom line

1. **The archive as built is mostly redundant with public history.** Roughly 90%+ of what it stores by volume (DOF sales, tract permit counts, CD filing mixes, FHFA HPI, HMDA, QCEW, FEMA declarations, PLUTO zoning fields) can be rebuilt today, retroactively, from datasets the city and federal government already publish with full history. The marketing claim "Nobody stores the week-over-week history, so nobody can reconstruct it after the fact" (`src/components/marketing/ArchiveSection.tsx`) and the migration header "NYC Open Data is current-state only; nobody stores the time series" (`supabase/migration-008-archive.sql:2-4`) are overclaims for most of these datasets.
2. **The genuinely non-reconstructable part is real but tiny**, because it is scoped to user-tracked properties only (`loadTrackedProperties`, `capture.ts:457-469`). HPD registration owner and managing agent, and the open/closed status mix of HPD, ECB and DOB complaint records, are overwritten in place by the city. KOANO captures them, but only for the handful of BBLs its users have added, and only as summary counts, not records.
3. **One capture is pointed at a dead dataset.** The CD "entitlement" snapshot and the per-property filings snapshot read `ic3t-wcy2` (legacy BIS DOB Job Application Filings). I counted filings by pre-filing year today: 104,768 in 2019, 3,349 in 2025, 2,662 in 2026. New filings moved to DOB NOW (`w9ak-ipjd`, 971,571 rows, updated today), which KOANO does not read. The weekly CD snapshot is archiving a frozen population, and the developer-facing entitlement read in `nyc-dob-filings.ts:128-147` misses every modern filing on the subject lot.
4. **The calibration record is not yet a calibration record.** `verdict_outcomes` is upserted over itself (`outcomes.ts:97`, `ignoreDuplicates: false`), its trajectory window is not anchored to the verdict date or the window end (`outcomes.ts:26-32, 61-66`), and no outcome is ever compared to the verdict's direction. Nothing in the repo computes accuracy.
5. **The fix is cheap and the window is open.** A citywide, record-level change-data-capture of the 8 to 10 NYC datasets that overwrite state would cost low single-digit dollars a month in storage and turn the archive from a talking point into something an acquirer would actually diligence. Every week without it is lost permanently. That is the one urgent data action in this company.

---

## 2. What is archived today, precisely

Source: `lib/archive/capture.ts` (`CAPTURE_VERSION` at lines 68-87), cron orchestration in `src/app/api/cron/archive/route.ts:100-127`, schedule `0 10 * * *` in `vercel.json`. Capture started August 2026 (first partition `archive_snapshots_2026_08`, `migration-008-archive.sql:58`). There was a multi-day hole in August from the POST-only cron bug (CLAUDE.md §07A "cron-verb incident"). The homepage strip shows "two captures, one gap" (`ArchiveSection.tsx` WEEKS constant), which is honest.

| Dataset key | Source | Grain / scope | Fields stored | Cadence | Reconstructable from public history? |
|---|---|---|---|---|---|
| `sales_archive` | DOF Rolling Sales `usep-8jbt` | every NYC sale, row-level | borough, block, lot, BBL, address, zip, neighborhood, class category, units, GSF, price, sale date (`capture.ts:147-194`) | weekly, 400-day lookback | **Yes, fully.** DOF publishes annualized sales files back to 2003; Open Data has the citywide annualized dataset updated each May; ACRIS has the underlying deeds since 1966. Today's rolling window: 82,576 rows, 2025-10-01 to 2026-09-30 (queried). The liveness workflow's error string "sales data is rolling off unrecoverably" (`archive-liveness.yml`) is false. |
| `permits` (tract) | DOB NOW Approved Permits `rbx6-tga4` | all NYC tracts, aggregate | total/new building/demolition/alteration counts over 24 months, issued last 7 days (`capture.ts:223-264`) | weekly | **Yes, fully.** The source is row-level with `issued_date` back to 2016-06 (1,016,499 rows, queried). Any tract count on any past date can be recomputed. |
| `entitlement_cd` | Legacy BIS filings `ic3t-wcy2` | 59 community districts, aggregate | status bucket counts, approval ratio (`capture.ts:486-516`) | weekly | **Mostly yes, and mostly frozen.** No date filter: it aggregates every BIS filing ever. The population barely changes because new filings go to DOB NOW. Only the weekly drift of legacy job statuses is non-reconstructable, and it has near-zero value. |
| `violations` (property) | HPD `wvxf-dwi5`, ECB `6bgk-3dad`, DOB complaints `eabe-havv`, HPD registrations | **tracked BBLs only** | open/total HPD (by class), ECB active/total, DOB complaints active/total, registered flag (`capture.ts:574-583`) | weekly | **Partly.** HPD violations carry issue dates and a current status with status date (11.3M rows, 8.4M closed), so open counts on a past date are approximately rebuildable. Intermediate status transitions are overwritten and are not. Same for ECB and DOB complaint statuses. |
| `landlord` (property) | HPD registrations `tesw-yqqr` + contacts `feu5-w2e2` + Speculation Watch List `adax-9mit` | **tracked BBLs only** | registered owner, owner type, management company, portfolio counts, watch list flag (`capture.ts:584-593`) | weekly | **Owner and agent: no.** `tesw-yqqr` has 203,887 rows for 203,811 buildings (queried): one current registration per building. Contacts (810,494 rows / 189,762 registrations) are current registrations only. Prior owners and agents are overwritten. This is the most valuable non-reconstructable field KOANO touches. The watch list itself accumulates (797 rows, 31 quarters since 2018), so that flag is reconstructable. |
| `filings` (property) | `ic3t-wcy2` | tracked BBLs | CD, subject filing count, recent items (`capture.ts:594-601`) | weekly | Yes (and wrong dataset, see §1.3). |
| `zoning` (property) | PLUTO `64uk-42ks` | tracked BBLs, capture-if-changed | district, overlays, FARs, built FAR, class, units, assessed total (`capture.ts:603-615`) | on change | **Yes.** DCP keeps every prior PLUTO release in the BYTES of the BIG APPLE archive, historical back to 2002. Socrata holds only the current version (26v2, queried). |
| `contamination` (property) | EPA FRS (SEMS, ACRES) | tracked BBLs, rotating window of 6/run | site counts within radius, nearest site (`capture.ts:626-645`) | ~monthly per property | Largely yes (EPA programs carry listing dates). Low value. |
| `disaster_history`, `mortgage_demand`, `employment` | OpenFEMA, CFPB HMDA, BLS QCEW | county, capture-if-changed | summary metrics (`capture.ts:654-684`) | on change | **Yes, fully.** All three are published historical series. Zero moat. |
| `comp_zip` | derived from DOF rolling sales via `mlsComps` provider | ZIP, capture-if-changed | median $/sqft, count, trend | on change | **Yes**, derivable from annualized sales. |
| `hpi` | FHFA | NY metro, capture-if-changed | index, yoy, 5-yr | quarterly | **Yes, fully.** Serves mostly as a cache (`fhfa-hpi.ts` reads it). |
| `verdict_outcomes` | internal | per verdict x outcome type | sale, violation delta, owner change, filing delta (`outcomes.ts`) | weekly | N/A, proprietary. Flawed, see §4. |

**Key structural observation.** The archive stores *summaries computed at capture time*, not the records. For the landlord dataset it keeps `registered_owner` and `management_company` strings but discards the HPD `registrationid`, the individual contact persons (head officer, officer, agent names) and their business addresses (`capture.ts:586-590`), which are exactly the fields needed to build an ownership graph later. "Generous payload, past rows can never gain fields" is stated as a principle in the code comments (`capture.ts:226`, CLAUDE.md §07A), and then not applied to the one dataset where it matters most.

---

## 3. Uniqueness: what is truly non-reconstructable

Being precise, as an acquirer's diligence team would be:

**Truly non-reconstructable (the city overwrites it, nobody public archives it to my knowledge):**
- HPD Multiple Dwelling Registration owner, head officer, officer, managing agent and site manager for a building over time. Verified: one row per building in `tesw-yqqr`. I found no public historical archive of `feu5-w2e2` (web search returned none; **unverified** whether NYCDB users or JustFix retain snapshots privately).
- Status transitions of HPD violations, ECB violations and DOB complaints between their open and final dates (only current status and status date survive).
- DOB NOW job filing status path (`filing_status`, `current_status_date` overwrite; `filing_date`, `approved_date`, `first_permit_date`, `signoff_date` survive, so durations are reconstructable but objection and re-filing cycles are not). KOANO does not capture this today.
- ZAP project status path (`project_status`, `public_status` are current only; `certified_referred` and `completed_date` survive; 32,964 projects back to 1970, queried). Not captured today.
- DOF assessment roll: the Open Data valuation dataset `8y4t-faws` currently holds years 2023 to 2027 only (queried), so older roll years have rolled off the API. Tentative-versus-final changes and pre-roll-off years are worth archiving. Not captured today.
- The *publication timing* of public facts (when a sale, violation or permit first appeared). This matters for backtesting: a verdict can only be fairly scored against what was knowable that day. KOANO's `captured_week` gives this for free, and it is the most underrated property of the design.

**Reconstructable (do not market these as a moat):** DOF sales (annualized since 2003, ACRIS since 1966), DOB permits (row-level since 2016 in DOB NOW, BIS legacy before), PLUTO (DCP archive since 2002), HPD violation issuance, Speculation Watch List, FHFA, HMDA, QCEW, FEMA, EPA.

**Already done by others for free:** JustFix's Who Owns What resolves HPD-registered LLC portfolios through shared registration contacts over 200,000+ buildings; ANHD's DAP Portal shows building-level displacement indicators over time, updated daily; NYCDB (Housing Data Coalition) packages the city's housing datasets including rent-stabilized unit counts scraped from tax bills; PropertyShark (Yardi) advertises LLC owner identification with 100% NYC coverage. KOANO's current exact-match landlord logic (`nyc-landlord.ts:1-13`, "v1 is EXACT entity matching only") is behind a free nonprofit tool on the same data.

Net: today KOANO has a well-engineered capture *harness* (gap ledger, shard completeness, never-captured view, external liveness) and a thin, mostly redundant *asset*. The harness is the hard part and it is genuinely good. Point it at the right tables.

---

## 4. Grounded defects in the archive and calibration layer

Ranked by impact on enterprise value.

1. **Archive scope is coupled to user acquisition.** `capturePropertySnapshots` only iterates `loadTrackedProperties` (`capture.ts:457-469, 525-616`). The only irreplaceable data is captured only where users have already clicked. With a small user base, the asset grows with headcount, not with time. A competitor that starts citywide capture next year will have more irreplaceable NYC history within a month than KOANO will have after five years at current scope. **PARTIAL.** Effort M, Impact 10.
2. **Landlord snapshot discards the graph fields.** Contact persons, roles, business addresses and registrationid are fetched by the provider (`nyc-landlord.ts:46-58`) but not archived (`capture.ts:586-590`). **PARTIAL.** Effort S, Impact 9.
3. **Entitlement reads a frozen legacy dataset.** `ic3t-wcy2` (`capture.ts:91, 487`; `nyc-dob-filings.ts:17, 128-147`): 2,662 filings in 2026 versus 104,768 in 2019. The CD "approval ratio" has no date filter, so it is a multi-decade average of ministerial DOB job statuses, which is not entitlement in the land-use sense at all (that is ZAP/ULURP and BSA). This flows into the developer cluster's core claim ("the community district's filing track record", `src/app/for/developers/page.tsx:21`). **PARTIAL, misleading.** Effort M, Impact 9.
4. **`verdict_outcomes` is mutable and mis-windowed.** Upsert with `ignoreDuplicates: false` (`outcomes.ts:97`) overwrites the last observation, so the record of what was observed when is lost, contradicting the append-only discipline everywhere else. `bounds()` takes the earliest and latest snapshot ever for the BBL (`outcomes.ts:26-32`), not the snapshot nearest the verdict date and the one nearest `window_end`. `within_window` is computed as `latest.captured_week <= windowEnd` (`outcomes.ts:65, 74, 84`), which flips to false the first week after the window closes and then reports a delta through today. **PARTIAL, flawed.** Effort S, Impact 8.
5. **No calibration metric exists.** `sale` outcomes always get `direction: 0` (`outcomes.ts:57`); nothing compares verdict (`buy|sell|hold|wait|drop`) to any outcome; no job or view computes hit rates by confidence bucket. The "public, audited track record" that the exit thesis needs is **MISSING**. Effort M, Impact 9.
6. **The archive claims are overstated on the marketing site.** `ArchiveSection.tsx` ("does not keep yesterday... nobody can reconstruct it") and `DataContent.tsx:98` ("a weekly time series the source datasets themselves do not keep"). True for HPD registrations and statuses; false for sales, permits, zoning, HPI, and most of what is archived. Under the locked provenance-honesty rule this is a credibility risk the first time a sophisticated buyer reads it. Effort S, Impact 7.
7. **No raw record retention, so new signals cannot be derived retroactively from the archive.** Every dataset is reduced to counts at capture time. When the team later wants "class C violations open more than 90 days" or "agent changed within 6 months of a deed", the archive cannot answer. Effort M, Impact 8.
8. **Sales dedup key creates double counting on DOF corrections.** `natural_key` includes price, GSF and class (`capture.ts:170`), so a corrected record lands as a second sale. Useful as a revision log if labeled, harmful for medians and the outcome scanner if not. Effort S, Impact 4.
9. **Tract key is DOB-stripped and not joinable.** Acknowledged in `capture.ts:199-201`; a GEOID crosswalk is deferred. Every tract-level derived signal needs it. Effort S, Impact 4.
10. **Liveness only checks that the cron ran.** `archive-liveness.yml` checks `stale` only; the citywide weekly datasets run on shard 0 only, so a broken Monday capture is caught only by the in-cron alert (the exact single point of failure the incident taught them to avoid). GitHub also disables scheduled workflows after 60 days of repo inactivity (noted in the workflow header). Effort S, Impact 5.

---

## 5. What KOANO will have at 1, 3 and 5 years

### As built (no changes)
| Horizon | What exists | Value to an acquirer |
|---|---|---|
| 1 year (Aug 2027) | ~52 weekly cuts of tract permit counts (~2,100 tracts), 59 CD rows/week from a frozen dataset, ~80k accumulated sales, FHFA/HMDA/QCEW/FEMA change rows, and weekly owner/violation summaries for N tracked BBLs (N **unverified**, likely tens to low hundreds). A few hundred `verdict_outcomes` rows, overwritten. | Near zero as data. A diligence analyst rebuilds 95% of it in a week from public history. |
| 3 years | Same, x3. Owner/agent history for perhaps a few thousand BBLs if user growth is good. | Small. Interesting for those BBLs only. |
| 5 years | ~260 weekly cuts; the summary-only format still blocks new signals. | Still small. The moat compounds only as fast as signups. |

### If the archive is re-scoped now (recommended, see §9)
| Horizon | What exists | Value |
|---|---|---|
| 1 year | Record-level weekly (daily where cheap) CDC of HPD registrations and all contacts (~1M rows), HPD/ECB/DOB complaint status transitions citywide, DOB NOW filing status paths for ~1M jobs, ZAP project status paths, DOF roll years before roll-off. Plus first-seen timestamps for every public fact. | The only point-in-time NYC regulatory record outside the city itself (to my knowledge). Enables honest backtests ("what was knowable on date X"). Ownership and management changes for ~200k residential buildings. |
| 3 years | ~150 weekly cuts. Enough agent and owner churn to score operators; enough DOB NOW cycles to publish plan-exam duration and objection-cycle distributions by job type, CB and applicant firm; enough verdicts with closed windows to publish a first calibration curve. | A defensible, licensable dataset. Credible "KOANO index" material for press. |
| 5 years | A full NYC cycle of point-in-time state, plus 3+ years of scored verdicts. | This is what a CoStar, MSCI, Cotality or Altus buyer pays for: history they cannot buy elsewhere attached to a model with a measured track record. |

Storage is not the constraint: even at full-table weekly snapshots of 1M contact rows, a year is ~50M narrow rows; with diff-only storage it is a small fraction of that. Supabase Pro handles it, or push raw diffs to object storage as Parquet.

---

## 6. Proprietary derived signals: what exists, who already computes it, what KOANO should build

Labels: EXISTS / PARTIAL / MISSING / VISION. "Others" lists who already does it, verified where cited.

| # | Signal | State in KOANO | Others already computing | Inputs (all public) | Moat potential | Effort | Impact |
|---|---|---|---|---|---|---|---|
| 1 | **Point-in-time ownership and operator graph** (resolve LLCs via shared HPD contacts, ACRIS parties and addresses, DOB NOW owner fields, NY DOS corporation records) across residential AND commercial AND 1-2 family | PARTIAL (exact name match only, `nyc-landlord.ts:5-9`; no ACRIS at all, grep finds ACRIS only as a caveat in `lib/documents/builders/ic-memo.ts:376`) | Who Owns What (HPD-registered residential only); PropertyShark (claims LLC owner identification); Reonomy (national ownership, 5.2M+ companies per Altus) | HPD contacts, ACRIS Parties `636b-3b5g` (46.7M rows, queried), ACRIS Master/Legals, DOB NOW owner fields | High once combined with the archived contact history (time dimension nobody else has publicly) | L | 10 |
| 2 | **Entitlement odds by community district and project type** from ZAP/ULURP (certified, CB recommendation, CPC vote, Council action, withdrawal) | MISSING (current "entitlement" is DOB ministerial statuses) | No verified vendor publishes NYC ULURP success odds; Zoneomics/Gridics do zoning, not approval odds (**unverified** that none do) | ZAP project data `hgx4-8ukb` back to 1970, ZAP BBL, CB votes, Council land use actions | High, and the status path going forward is non-reconstructable | M | 9 |
| 3 | **Plan-exam and permit cycle time** by job type, CB, and applicant/expediter firm (objection cycles, re-filings) | MISSING | None verified | DOB NOW filings `w9ak-ipjd` (durations reconstructable; cycles need CDC) | High (cycles only exist in the archive) | M | 8 |
| 4 | **Verdict calibration / repeat-sale outcome scoring** | PARTIAL (`verdict_outcomes` scaffolding, no metric) | No AI underwriting tool publicly reports calibrated accuracy (to my knowledge, **unverified**) | sales_archive + annualized sales + ACRIS deeds for repeat-sale returns vs borough index | Very high: labels on your own predictions are the one asset nobody can copy | M | 9 |
| 5 | **Operator quality score** (violation trajectory per portfolio: new, cured, aged class C, AEP, litigation) | PARTIAL (counts and portfolio totals, no trajectory) | ANHD DAP shows indicators over time; WoW shows portfolio violations | HPD violations, HPD litigation, AEP list, ECB | Medium; time series of status transitions is the edge | M | 7 |
| 6 | **Distress pre-signals** (lis pendens and satisfaction filings in ACRIS, ECB penalty balances, tax lien sale list, HPD AEP, ownership agent churn) | MISSING | Reonomy and ATTOM sell foreclosure/distress nationally; NYC-specific combination unverified | ACRIS doc types, DOF lien sale list, ECB, HPD | Medium-high for Portfolio and Development buyers | M | 8 |
| 7 | **Permit velocity and supply pipeline** by tract/CB (filed, approved, permitted, signed off, units) | PARTIAL (tract counts archived; permit trend chart in dashboards) | Common in vendor products in some form | DOB NOW, BIS, DCP Housing Database | Low as a moat (fully reconstructable), useful product | S | 6 |
| 8 | **Assessment anomaly / tax appeal signal** (market value vs comparable sales, tentative-to-final changes, class 2 inequity) | MISSING (tax appeal packet exists as a document type per brief; no anomaly model) | Tax appeal firms do this privately | DOF roll `8y4t-faws` (2023 to 2027 only), sales | Medium; archive old roll years before they roll off | M | 6 |
| 9 | **Rent stabilization loss** (unit counts over time, 421-a/J expirations) | MISSING | NYCDB taxbills data (2007 to 2016 per BetaNYC), DHCR building lists | taxbills, DHCR, DOF exemptions | Medium for institutional multifamily | M | 6 |
| 10 | **Displacement pressure** | MISSING (stated honestly as not built, `src/app/for/community/page.tsx:41-44`) | ANHD DAP Portal, free | Same inputs | Low (nonprofit already owns it, low willingness to pay in Community tier) | M | 3 |
| 11 | **Ownership churn and hold period** by CB | MISSING | Common in RCA/Reonomy style analytics | ACRIS deeds | Low moat, good product context | S | 5 |

The honest read: signals 1 to 4 are where KOANO can be first and stay first, because each combines public history with something only KOANO's archive or KOANO's verdicts produce. Signals 7, 10, 11 are table stakes that competitors or nonprofits already provide; build them for product completeness, never pitch them as the moat.

---

## 7. How user interactions become a moat

What is captured today (from `supabase/schema.sql`, migrations 006, 014, 019):
- `verdicts`: user, address, BBL, tract, verdict, confidence, risk, window, reasoning chain, agent summaries, method and inputs era (migration-021). Immutable. **EXISTS.**
- `properties`: watched addresses, monitoring flag. **EXISTS.**
- `documents`: doc type, tier, format, verdict linkage; metadata only, no bytes (`migration-006-documents.sql:15-35`). **EXISTS.**
- `notifications`: with `read_at`. **EXISTS.**
- `usage_events`, `verdict_hidden`. **EXISTS.**

What is missing, ranked:
1. **Decision intent at verdict time** (acquire, dispose, refinance, develop, appeal; hold horizon; deal size; role). The verdict row has no `cluster`, purpose, or user-supplied assumptions. Without intent, an outcome cannot be scored ("sale after a buy verdict" means opposite things for buyer and seller). **MISSING.** Effort S, Impact 9.
2. **Outcome reporting.** A one-tap "what happened" prompt at window end (bought / passed / lost to another bidder / price paid / closing date / financing terms). This is the private ground truth that public record can never give (realized price, terms, why passed). `migration-011` correctly says IRR and rents are not observable publicly; users can report them. **MISSING.** Effort M, Impact 9.
3. **Analyst overrides as labels.** Let a user disagree with a specialist band or the verdict, with a reason code. Do not change the verdict (determinism stays locked); store the override as a label. Overrides by institutional analysts are the highest-value training and calibration signal in this market. **MISSING.** Effort M, Impact 8.
4. **Document edit deltas.** Which sections of an IC memo or CMA were edited before sending shows where the reasoning is weak. Requires storing bytes or structured content (v2 per migration-006 comment). **MISSING.** Effort M, Impact 6.
5. **Demand map ("where professionals are looking").** Aggregated, anonymized verdict and watch density by tract and CD, week by week. It is a leading indicator of capital interest that no public dataset contains. Requires explicit consent language in ToS and k-anonymity thresholds. **MISSING.** Effort S, Impact 7.
6. **Notification engagement as relevance labels.** `read_at` exists; clicks and mutes per signal type would tell which public changes professionals care about. **PARTIAL.** Effort S, Impact 4.

The compounding loop to design for: verdict with intent, then public outcome (automatic), then private outcome (reported), then calibration curve published, then trust, then more verdicts. Today only the first link exists.

---

## 8. Partnership and licensing map

Status verified by web search on 2026-10-19 (citations in Sources). Ordering is by value per dollar and per month of founder time, consistent with the locked BYOC / pass-through / license-later strategy. Every partner feed must render as `partner` provenance attributed by name (CLAUDE.md notes several `isLive` gates would silently drop partner data; fix those first).

| Order | Provider | Current status (verified) | What KOANO needs from it | Model | Pitch |
|---|---|---|---|---|---|
| 0 | **Open-data community: NYCDB / Housing Data Coalition, JustFix (Who Owns What), ANHD (DAP), NYU Furman Center** | Active nonprofits/projects; NYCDB loads city housing datasets into Postgres, including tax-bill stabilization counts | Ingestion code, entity-resolution methods, credibility | Free / open source; give back archive slices | "We archive what the city overwrites. We will publish non-commercial slices of the HPD registration history for researchers." This buys credibility and a public citation trail cheaply. |
| 1 | **Regrid** | Active; self-serve metered API with Standard/Premium schema, monthly parcel updates through 2025 | National parcel spine (APN, owner, land use, geometry) for non-NYC verdicts | Metered pass-through | "Your parcels become the substrate of auditable verdicts, attributed to you by name on every document." Fast, self-serve, no committee. |
| 2 | **ATTOM** | Active; PE-owned by Lovell Minnick since 2019; acquired Estated (2022) | National deeds, mortgages, assessor, foreclosure for national coverage of signals 4 and 6 | API license, usage-based | "We are a distribution channel into developers and IC memos that you do not reach; every memo cites ATTOM." |
| 3 | **MLS via Trestle (Cotality) and Bridge (Zillow)** | Trestle: Cotality's RESO API covering ~100 MLSs; Bridge: Zillow Group. Access is approved per MLS. CoreLogic rebranded to Cotality on 2025-03-24 | Listings, DOM, list-to-sale for the Transaction cluster CMA | BYOC through each broker's MLS vendor agreement | To MLSs: "a white-label CMA product for your members that keeps data inside your license." In NYC the relevant listing services are REBNY RLS and OneKey MLS (**unverified** which are on Trestle or Bridge). |
| 4 | **First Street** | MSCI announced acquisition for $120M cash plus earnouts; reports conflict on whether it has closed (Q3 2026 target) | Property-level flood, fire, heat, with forward projections | API license (regional first) | "Climate adjusted verdicts with your model attributed, sold to institutional IC memos." Timing: ask before MSCI integration changes terms. |
| 5 | **CompStak** | Active; last verified round $50M Series C (2021); partners with Cherre to integrate lease and sales comps | Lease comps for Development and Portfolio pro forma (currently blocked, `proformaBenchmark` is `representative` in `catalog.ts:266-275`) | BYOC first; data exchange later | "Our users are developers and allocators who need lease comps inside a memo; we route them to you." |
| 6 | **Cherre** | Active; $30M Series C Sept 2024 (HighSage, Nuveen, RXR, Intel Capital) | Not data per se: distribution to institutional data teams | Integration partner / app on their platform | "KOANO is the reasoning layer on your connected data; your clients get auditable verdicts and IC memos on their own data." Also a plausible acquirer. |
| 7 | **Reonomy (Altus Group)** | Reonomy still sold by Altus (API and bulk feed add-ons). Altus ended its strategic review and stayed independent, replaced CEO, and is divesting non-core units in 2026 | National commercial ownership and contacts | License | Altus owns ARGUS. Pitch as "verdict plus memo layer over ARGUS and Reonomy". Strong acquirer fit. |
| 8 | **MSCI Real Capital Analytics** | Active within MSCI (acquired 2021 for $950M); delivered via integrations such as Dealpath (Nov 2024); no public API | Institutional transaction comps, buyer/lender identities | Enterprise license, late | Only once Portfolio tier has paying institutions. MSCI is also an acquirer (RCA, First Street). |
| 9 | **Placer.ai** | Active; $75M raise Aug 2024 at ~$1.5B valuation | Foot traffic for retail and mixed-use sites | License, late | Niche to Development retail sites. |
| 10 | **CoStar** | Active and acquisitive: Matterport ($1.6B, closed Feb 2025), Domain (~A$2.4B for the remainder, 2025), Zonda ($800M announced 2026) | Comps and listings | BYOC only, legally reviewed | Do not build dependence. CoStar is the most acquisitive buyer in the category; position as complementary reasoning, never as a CoStar data reseller. |
| Do not partner | **PropertyShark (Yardi)** | Yardi subsidiary since 2010; NYC-deep | n/a | n/a | Direct NYC competitor on ownership and sales. |

Sequencing logic: 1 to 3 unlock national coverage and the Transaction cluster without capital; 4 to 6 unlock the institutional story; 7 to 10 are as much acquirer conversations as data deals. Every conversation should open with the archive and calibration record, which is the only thing KOANO brings that these companies do not already have. Today that card is weak; fix §9 first.

---

## 9. What I would rebuild first

**Archive v2: citywide, record-level change-data-capture of NYC datasets that overwrite state.** Concretely:
1. New table `record_versions(dataset, record_key, valid_from_week, first_seen_at, payload jsonb, payload_hash)` storing a row only when a record's hash changes, plus tombstones when a record disappears from the source. Keep the existing ledger, shard and gap views; they are good.
2. Datasets, in priority order: HPD registrations `tesw-yqqr` and contacts `feu5-w2e2` (all fields, monthly source refresh, so weekly capture is ample), DOB NOW filings `w9ak-ipjd` (status fields), ZAP project data `hgx4-8ukb` (status fields), HPD violations status fields, ECB status, DOB complaints status, DOF assessment roll years before roll-off, Speculation Watch List (cheap, reconstructable but keep first-seen time).
3. Full-table pulls via Socrata paging or bulk export, diffed server-side; run outside Vercel's 300s limit (a GitHub Action, Supabase Edge Function on a schedule, or a small worker), keep the external liveness check on a different host than the job.
4. Repoint the entitlement provider and CD capture from `ic3t-wcy2` to DOB NOW plus ZAP, with a date window, and rename "approval ratio" to what it measures.
5. Make `verdict_outcomes` append-only (`outcome_observations` with observed week), anchor to verdict date and window end, add repeat-sale return vs borough index, add `intent` to verdicts, and publish a monthly calibration view.
6. Rewrite the archive copy to say exactly which datasets are non-reconstructable.

Effort: L overall (about 3 to 4 focused weeks for one engineer). Impact: 10. This is the only item in the company where delay destroys value irreversibly.

---

## 10. Top 10 problems (ranked by enterprise-value impact)

| # | Problem | Evidence | State | Effort | Impact |
|---|---|---|---|---|---|
| 1 | Irreplaceable capture is limited to user-tracked BBLs; citywide history of overwritten fields is being lost every week | `capture.ts:457-469, 525` | PARTIAL | M | 10 |
| 2 | Most archived data is reconstructable from public history; the moat is overstated in code comments and on the marketing site | `migration-008-archive.sql:2-4`; `ArchiveSection.tsx`; `DataContent.tsx:98`; DOF annualized sales, DCP PLUTO archive, `rbx6-tga4` since 2016 | PARTIAL | S | 9 |
| 3 | Entitlement and CD snapshots read a legacy dataset that receives ~3k filings/yr versus ~105k in 2019, with no date filter, and conflate DOB ministerial status with land-use entitlement | `capture.ts:91, 487`; `nyc-dob-filings.ts:128-147` | PARTIAL | M | 9 |
| 4 | No calibration metric, no intent on verdicts, sales outcomes have no direction | `outcomes.ts:57`; `schema.sql:105-122` | MISSING | M | 9 |
| 5 | Ownership graph fields discarded at capture; landlord resolution is exact-match only, behind a free nonprofit tool | `capture.ts:586-590`; `nyc-landlord.ts:1-13` | PARTIAL | S | 9 |
| 6 | `verdict_outcomes` overwritten and mis-windowed | `outcomes.ts:26-32, 65, 97` | PARTIAL | S | 8 |
| 7 | Archive stores summaries, not records, so no retroactive signal derivation | `capture.ts:576-614` | PARTIAL | M | 8 |
| 8 | No ACRIS ingestion at all; deeds, mortgages, lis pendens, parties are the backbone of ownership churn and distress | grep: no ACRIS dataset IDs in `lib/providers` | MISSING | M | 8 |
| 9 | No user feedback, override or outcome-report capture | schema; no feedback tables | MISSING | M | 8 |
| 10 | Liveness covers "cron ran", not "Monday citywide datasets landed"; job and its watchdog share failure modes for shard 0 | `archive-liveness.yml`; `route.ts:100-105` | PARTIAL | S | 5 |

## 11. Top 10 opportunities (ranked)

| # | Opportunity | State | Effort | Impact |
|---|---|---|---|---|
| 1 | Archive v2 record-level CDC of overwritten NYC datasets (§9) | MISSING | L | 10 |
| 2 | Published calibration curve: verdicts with intent scored against repeat-sale returns and public events, by confidence bucket and inputs era | PARTIAL | M | 9 |
| 3 | Point-in-time ownership and operator graph (HPD contacts history plus ACRIS parties plus DOB NOW owners plus DOS corporations) | PARTIAL | L | 9 |
| 4 | ZAP/ULURP entitlement odds by CD and project type, replacing the DOB-status proxy | MISSING | M | 9 |
| 5 | Outcome reporting and analyst-override labels | MISSING | M | 8 |
| 6 | DOB NOW plan-exam cycle times by job type, CB and applicant firm | MISSING | M | 8 |
| 7 | Distress pre-signal feed (lis pendens, lien sale list, ECB balances, agent churn) for Portfolio and Development | MISSING | M | 8 |
| 8 | Anonymized professional demand map by tract (consented) | MISSING | S | 7 |
| 9 | National parcel/deeds via Regrid and ATTOM under `partner` provenance | MISSING | M | 7 |
| 10 | Researcher data program for archive slices (credibility, citations, press) | MISSING | S | 5 |

---

## 12. VISION (requires data, partners or capital not in hand)

Kept separate from the grounded findings above.

- **NYC point-in-time twin.** Every BBL's regulatory, ownership and market state reconstructable for any week since August 2026 (and approximated before it from public history), with a "what was knowable then" toggle on every verdict. Dependency: Archive v2 plus 2 to 3 years of time. VISION.
- **Operator credit score.** A FICO-style score for landlords and sponsors from portfolio violation trajectories, agent churn, ECB balances, litigation and lis pendens, sold to lenders and LPs. Dependency: ownership graph, legal review (FCRA-adjacent risk must be assessed). VISION.
- **Entitlement forecasting market.** Probability and timeline for every pending ULURP, with KOANO's past forecasts scored publicly. Dependency: ZAP history plus 2+ years of status-path archive. VISION.
- **KOANO Regulatory Pressure Index.** A weekly citywide index of permits, violations, filings and ownership churn, published free as a press-cited index (the Case-Shiller playbook). Dependency: Archive v2. VISION.
- **Data-exchange consortium.** Institutional users contribute private outcomes (prices, terms, rents) under NDA in exchange for calibrated benchmarks, the CompStak exchange model applied to underwriting outcomes. Dependency: 20+ institutional customers. VISION.

## 13. The one thing that would make me say "I have never seen anything like this"

A public, append-only scoreboard where every KOANO verdict since launch is listed with its date, intent, confidence and the data that was knowable that week (from the archive's first-seen timestamps), next to what actually happened, with a calibration curve updated weekly and the losses shown as prominently as the wins. Nobody in real estate data or AI underwriting publishes this, to my knowledge (**unverified** across all vendors). It is only possible with a point-in-time archive plus an immutable verdict table, and KOANO has already built the second half and the harness for the first.

---

## Sources

- NYC Open Data Socrata metadata and SODA endpoints queried 2026-10-19: https://data.cityofnewyork.us/api/views/{usep-8jbt, rbx6-tga4, ic3t-wcy2, w9ak-ipjd, wvxf-dwi5, tesw-yqqr, feu5-w2e2, adax-9mit, 64uk-42ks, 6bgk-3dad, eabe-havv, bnx9-e6tj, 8h5j-fqxa, 636b-3b5g, hgx4-8ukb, 8y4t-faws}.json and https://data.cityofnewyork.us/resource/{id}.json
- DOF annualized sales: https://www.nyc.gov/site/finance/property/property-annualized-sales-update.page
- DOF rolling sales: https://www.nyc.gov:443/site/finance/property/property-rolling-sales-data.page
- Annualized sales on data.gov: https://catalog.data.gov/dataset/nyc-citywide-annualized-calendar-sales-update
- ACRIS since 1966: https://www.nyc.gov/site/finance/property/acris-faq-processing-errors.page ; https://www.nyc.gov/site/finance/property/property-recording-documents.page
- PLUTO prior releases in BYTES archive: https://data.amerigeoss.org/dataset/pluto-change-file ; https://datacatalog.med.nyu.edu/dataset/10370 ; https://www.baruch.cuny.edu/confluence/x/u4CrAQ
- Who Owns What: https://whoownswhat.justfix.org/en/about ; https://shelterforce.org/2022/03/24/how-hidden-property-owners-and-bad-landlord-patterns-are-revealed-in-nyc/
- ANHD DAP: https://civictech.guide/projects/displacement-alert-portal ; https://anhd.org/project/displacement-alert-project-dap?page=9
- NYCDB: https://github.com/antievictionmappingproject/nyc-db ; https://beta.nyc/products/tenants-map
- Registration Contacts catalog: https://catalog-beta.data.gov/dataset/registration-contacts
- Altus / Reonomy: https://www.bisnow.com/news/national/technology/firm-behind-argus-swaps-ceo-as-it-ends-strategic-review-hits-critical-inflection-point-131775 ; https://www.altusgroup.com/reonomy/ ; https://www.connectcre.com/stories/altus-group-acquires-reonomy-for-us202m/ ; https://kalkinemedia.com/ca/news/announcements/altus-group-agrees-to-sell-development-advisory-unit-to-newmark-finalizing-2026-divestiture-plan
- Cherre: https://commercialobserver.com/?p=489729 ; https://discover.cretech.com/news/cherre-and-compstak-announce-partnership-to-integrate-verified-lease-comps-and-transaction-analytics-into-cherres-platform
- Cotality rebrand: https://www.housingwire.com/articles/corelogic-rebrands-to-cotality-to-reflect-its-evolution/
- Trestle / Bridge: https://www.cotality.com/compare/cotality-trestle-vs-bridge-interactive ; https://www.cotality.com/real-estate/multiple-listing-enterprise-solutions/trestle ; https://www.rirealtors.org/idx-products
- Regrid: https://regrid.com/blog/introducing-regrids-updated-self-serve-api ; https://regrid.com/blog/2025-end-of-year-report ; https://apis.io/plans/regrid/regrid-plans-pricing/
- CompStak: https://fundediq.co/compstak-compstak-com-funding/
- ATTOM: https://www.connectcre.com/stories/lovell-minnick-partners-acquires-attom-data-solutions/ ; https://www.privsource.com/acquisitions/deal/q5SJ8l
- First Street / MSCI: https://help.firststreet.org/hc/en-us/articles/9785701225623-Licensing-First-Street-Data ; https://coverager.com/msci-to-acquire-first-street-for-120-million/ ; https://www.esgtoday.com/msci-acquires-climate-risk-data-provider-first-street/ ; https://esgpost.com/msci-bolsters-climate-arsenal-with-120m-first-street-acquisition/
- Placer.ai: https://siliconangle.com/2024/08/05/placer-labs-raises-75m-enhance-market-research-initiatives-foot-traffic-data-ai/
- CoStar: https://www.sec.gov/Archives/edgar/data/1057352/000105735225000097/csgp-20250630.htm ; https://www.sec.gov/Archives/edgar/data/0001057352/000105735226000066/csgp-20260630.htm ; https://onlinemarketplaces.com/articles/costar-completes-1-6-billion-matterport-acquisition ; https://www.autobound.ai/companies/costar/acquisitions
- MSCI RCA: https://www.msci.com/our-solutions/real-estate/real-assets-market-data ; https://www.mannpublications.com/mannreport/2024/11/13/dealpath-integrates-msci-real-capital-analytics/ ; https://www.mingtiandi.com/real-estate/finance/msci-buying-real-capital-analytics-for-950m
- PropertyShark / Yardi: https://www.multihousingnews.com/yardi-systems-acquires-propertyshark-for-real-estate-data/ ; https://www.propertyshark.com/about.html

## Discrepancies vs the brief (section 3 of the prompt)

1. **"Daily snapshot capture of the public data KOANO reads."** The cron runs daily, but data is weekly-bucketed (`captured_week` = ISO Monday), each property is captured once a week on its shard day, and all citywide datasets run only on Mondays (`route.ts:100-105`). It is a weekly archive with daily scheduling.
2. **"Snapshot of the public data KOANO reads."** Only a subset: per-property datasets are captured only for user-tracked properties; ACS, flood, NRI, crime, QCT/DDA, BPS, IRS migration, FMR and others are not archived (ACS deferred, `capture.ts:748-751`).
3. **"It compounds with time and cannot be bought retroactively."** True only for HPD registration owner/agent and record-status fields; false for sales, permits, PLUTO zoning, HPI, HMDA, QCEW, FEMA, which have public history (§3).
4. **"Planned verdict calibration record."** Scaffolding exists and runs weekly (`outcomes.ts`, migration-011), but it is mutable and computes no accuracy metric.
5. **"HPD violations and registrations ... DOB permits and job filings" as live providers.** DOB job filings are read from the legacy BIS dataset `ic3t-wcy2`, which now receives only a few thousand filings a year; DOB NOW job filings (`w9ak-ipjd`) are not read anywhere.
6. **Provider list implies ownership data.** There is no ACRIS integration; ownership comes only from HPD registrations (3+ unit residential) and PLUTO owner name.
