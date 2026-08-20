# KOANO — Master Build Context
## Version 5.1 | Confidential & Proprietary | 2026

> This file is the single source of truth for every build session, human or AI.
> Read it completely before writing a single line of code.
> Where this document and any older instruction conflict, this document wins.
> Never invent copy, colors, components, pages, data, or numbers not specified here.
> Never present data as live when it is not. See Section 06.

---

## 00 — How To Use This Document

This is a build spec, not a pitch deck. It tells any engineer (or Claude Code / Fable 5) exactly what KOANO is, how it is architected, what is already built, what is not, and the rules that must never be broken.

Three things matter more than anything else in this file, and they appear early because they govern everything after them:

1. What KOANO actually is now (Section 01). The product has been repositioned away from consumer market forecasting toward professional and institutional transaction intelligence. Any older framing is dead.
2. The three architectural principles (Section 02). Provider interfaces, provenance labeling, and slice-verified builds. These are not style preferences. They are what separate a credible product from a demo that collapses under scrutiny.
3. The current build state (Section 03). An honest inventory so no one rebuilds what exists or assumes something exists when it does not.

---

## 01 — What KOANO Is

KOANO is a real estate reasoning engine that replaces the bureaucratic labor of real estate analysis and transactions for professionals and institutions.

It is not a consumer AVM. It is not a market forecasting toy. It is not a listings site. Its core value is the automation of expensive, tedious, judgment-heavy analytical work that today consumes days or weeks of professional time: comparative market analysis, entitlement and zoning research, pro forma benchmarking, due diligence, portfolio risk monitoring, and regulatory tracking.

The engine works by dispatching a query to five specialist AI agents, each owning a distinct analytical domain, each drawing on its own data providers. Their structured outputs feed a synthesis agent that produces a single unified verdict with a full, auditable reasoning chain. Every claim in that chain is traceable to its source, and every source is labeled with its provenance (see Section 06).

**The one-line description:** The intelligence engine that does the analytical work of a real estate team, and shows its work well enough for a professional to act on it.

**Who KOANO serves (in order of value and defensibility):**
- Developers, CRE brokers, and contractors (Cluster 4) evaluating sites, entitlement risk, and pro forma viability.
- Institutional investors, REITs, and C-suite (Cluster 5) monitoring portfolios and underwriting acquisitions.
- Agents, brokers, and mortgage officers (Cluster 2) producing CMAs, neighborhood narratives, and pricing recommendations.
- Homeowners, renters, and neighbors (Cluster 1 — Community) assessing a single property, its violation and ownership record, permit history, and tax appeal opportunities.

**What KOANO is NOT:**
- NOT a Zillow / Redfin clone.
- NOT a static data dashboard.
- NOT a listings platform.
- NOT a black box. Showing verifiable reasoning is the product.
- NOT a system that presents guessed or representative data as if it were live and authoritative.

### The strategic posture: premium demo that becomes production

KOANO is being built now, on a near-zero data budget, as a premium demo. The paid data sources that unlock the full professional product (MLS comps, CoStar-tier deal data, national permit aggregation, premium hazard data) are not yet funded. The strategy is deliberate and has integrity:

- Build the real pipes. Every data source sits behind an interface (Section 05).
- Flow real free data through them wherever it exists (NYC open data, Census, FHFA, FEMA, IRS Opportunity Zones, and similar).
- Flow honestly-labeled representative data where the source is paid and not yet funded.
- Architect so that funding a paid source is a one-line configuration change, never a rewrite.

This lets KOANO operate and demo as the real deal today, and become production the moment capital arrives, without re-architecting anything. The integrity line is absolute: representative data is always labeled as such. See Section 06.

---

## 02 — The Three Non-Negotiable Architectural Principles

These govern every build decision. Violating any of them turns KOANO from a credible product into a liability.

### Principle 1 — The Provider Interface Pattern

No agent ever calls a data source directly. Every external data source is accessed through a typed interface with a swappable implementation. Today an interface is backed by either a real implementation (free/open sources) or a mock implementation (paid sources not yet funded). Swapping mock to real must be a single configuration change in one registry file, never a change to agent logic, synthesis logic, or UI. See Section 05 for the full pattern.

### Principle 2 — Honest Provenance Labeling

Every data point carries a provenance tag: `live`, `representative`, or `modeled`. The UI visibly badges anything that is not `live`. A verdict's overall provenance is the weakest of its inputs. Representative data is never presented as live. This is an integrity requirement and a legal safeguard, not a design choice. See Section 06.

### Principle 3 — Slice-Verified Builds

Build one vertical path through the entire stack (data provider to agent to synthesis to API to verdict) and verify it works on real data before replicating it. When building multiple agents or clusters, build them one at a time with a test after each, never all at once untested. A flaw caught at agent two is trivial. The same flaw propagated to five agents and four clusters is a multi-day debugging disaster.

---

## 03 — Current Build State (Honest Inventory)

This inventory is kept current. As of this writing the backend spine, all four dashboards, the archive/calibration layer, and the "every verdict live" work (Phase 1) are all built and verified.

**Built and working:**
- Marketing site: homepage (all sections), and the pages /for/community, /for/agents, /for/developers, /for/institutions, /intelligence, /pricing, /about, /early-access, /data.
- Design system: Neue Montreal typography, full color palette as CSS variables, Button and SectionNumber components, Nav, Footer.
- Neural map: /public/neural-map.html. 143 nodes, D3 v7 + Three.js r128. Functionally and cosmetically complete.
- **Backend spine (Phase A):** provider registry (`/lib/providers`), all five specialist agents + synthesis (`/lib/agents`), Clerk-protected verdict routes (`/api/agents`, `/api/agents/stream`), Supabase schema with RLS, append-only immutable `verdicts` table.
- **All four cluster dashboards (Phase B):** Cluster 1 (Community), 2 (Transaction), 4 (Development), 5 (Portfolio) — each on the shared verdict engine, with `ProvenanceBadge` throughout. Shared site-detail block layer (`/lib/providers/blocks.ts`) feeds both dashboards and the document engine.
- **Document engine:** declarative registry + builders for tax-appeal, site-screening, 3-site comparison, the Community set, CMA, IC memo, Monday briefing, and more. Every page carries the mandatory disclaimer (regression-tested).
- **Auth + spend control:** Clerk login/signup/onboarding; `lib/koano-guard.ts` (approval gate + per-user rolling limits + global breaker). Stripe Checkout + webhook wired (held pending launch).
- **Archive & Calibration layer (Phase 0):** weekly Vercel-cron snapshotting of the free public record + a verdict-outcome scanner. See Section 07A.
- **Live verdicts (Phase 1):** the two agents that consumed mock data (Risk-Volatility, Demand-Sentiment) were re-based onto live federal sources. A NYC address now rolls up `overall_provenance: live`. See Sections 05 and 07.

**Not built / deferred:**
- Paid-source integrations still mocked: pro-forma benchmarks (CoStar-tier) and commercial deals — the only representative providers remaining. Comps are live for NYC (DOF recorded sales); MLS-grade comps outside NYC remain the paid gap.
- Stripe billing UI (backend wired), PostHog, SOC 2, enterprise SSO.
- HMDA tract-level (county-level is live; tract is a planned ingestion fast-follow).

**Configured and ready:** Supabase, Anthropic, Clerk keys in .env.local. `CRON_SECRET` set (archive cron). `NYC_OPEN_DATA_APP_TOKEN` set. Free optional tokens (`NOAA_CDO_TOKEN`, `HUD_USER_TOKEN`) add signal but do not gate liveness. Stripe/Mapbox keys are placeholders. See Section 18.

**Note on Community (Cluster 1) and the former Cluster 0:** the former nonprofit tier (previously "Cluster 0") remains removed from KOANO's product scope, and no Cluster 0 functionality may be built. The standalone /community page has been deleted and 308-redirects to /for/community — Cluster 1, now named Community (audience: homeowners, renters, neighbors), which states plainly what it reads today and what is not built yet. Never describe partnerships that do not exist.

---

## 04 — Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 14 (App Router) | Full-stack monolith. No separate Python service at this stage. |
| Styling | Tailwind CSS | Custom CSS variables via globals.css |
| Animation | Framer Motion | Scroll-driven entrances, hover states |
| 3D / Neural map | Three.js r128 + D3 v7 | Combined: D3 force layout, Three.js render. Standalone in /public/neural-map.html |
| Maps | Mapbox GL JS | For property/site maps in dashboards. Deferred until dashboards. |
| Auth | Clerk | Email + Google. Protects /dashboard and /api routes. |
| Database | Supabase (Postgres) | Row Level Security on all tables. |
| Payments | Stripe | Subscriptions per cluster. Deferred until after core product. |
| AI runtime | Anthropic Claude API | Agent runtime model: a cost-effective Sonnet-class model (see below). |
| Deployment | Vercel | Auto-deploy on push to main. |
| Analytics | PostHog | Deferred until launch prep. |

### Model policy: build vs run

Two different models, two different purposes. Do not confuse them.

- **Building KOANO** (writing the code, in Claude Code): use the most capable available model, currently Fable 5, for long-horizon architectural work. If Fable's safety classifiers route a request to Opus 4.8, that is acceptable; Opus handles this work well.
- **Running KOANO** (the agent calls the product makes at runtime): use a cost-effective Sonnet-class model. Running the product on a frontier model would make per-verdict economics unworkable, especially at Cluster 1 and 2 price points. Set the runtime model in one place (a config constant) so it can be tuned per-cluster later. Use prompt caching on all system prompts to cut input cost.

Runtime agent calls must always use prompt caching for the system prompt and any static schema or context, so repeated calls only pay for the unique query.

**Runtime model constant (authoritative):** `KOANO_RUNTIME_MODEL = 'claude-sonnet-4-6'` in `lib/agents/shared.ts`. This is an approved deviation: the earlier `claude-sonnet-4-20250514` reached end-of-life 2026-06-15. All five agents + synthesis + narrative/briefing generation call this constant. Specialist agents run at temperature 0 (reproducible verdicts on identical data); code turns the model's coarse bands into figures (never asks it for a precise confidence number).

---

## 05 — Provider Interface Architecture (The Spine)

This is the most important engineering decision in KOANO. Get it right once and everything else swaps in cleanly.

### Structure

Current registry (Phase 1). Every NYC provider degrades a null BBL (a non-NYC address) to a labeled representative/coverage result, never a live zero. `blocks.ts` is the shared block layer both site-detail and the document engine consume — one data path, never two.

```
/lib/providers/
  types.ts        ← all provider interfaces + the wrapped-result type
  registry.ts     ← single config mapping each interface to its active impl
  blocks.ts       ← shared "fetch these named facts" layer (dashboards + documents)
  real/
    geocode.ts            (live) — NYC GeoSearch + US Census onelineaddress fallback (national)
    nyc-permits.ts, nyc-zoning.ts, nyc-violations.ts, nyc-landlord.ts,
    nyc-dob-filings.ts, nyc-assemblage.ts, nyc-sales.ts   (live, NYC)
    irs-opportunity.ts, census-acs.ts, fhfa-hpi.ts, fema-flood.ts, fbi-ucr.ts (live)
    epa-superfund.ts, usgs-seismic.ts, openfema-disasters.ts, noaa-climate.ts   (live, national — Phase 1 hazard)
    cfpb-hmda.ts, bls-qcew.ts, irs-migration.ts   (live, national — Phase 1 demand; IRS self-hosted)
    hud-fmr.ts, freddie-pmms.ts   (live, national — Phase 1 market supplements)
  mock/
    proforma-benchmark.ts (representative → CoStar-tier)
    costar-deals.ts       (representative → CoStar/RCA)
```

RETIRED mocks (deleted, git-preserved): `mls-comps.ts` (→ live nyc-sales), `premium-hazard.ts` (→ live EPA/USGS/FEMA/NOAA), `placer-traffic.ts` (foot traffic, → live HMDA/QCEW), and `google-trends.ts` (search interest, → live HMDA/QCEW). Only pro-forma benchmarks and commercial deals remain representative.

### The wrapped result type

Every provider method returns data in this envelope. No exceptions.

```typescript
interface ProviderResult<T> {
  data: T;
  provenance: "live" | "representative" | "modeled";
  source: string;        // human-readable, e.g. "NYC DOB via NYC Open Data"
  fetched_at: string;    // ISO timestamp
  swap_note?: string;    // for mocks: which paid source replaces this, and how
}
```

### The registry

A single object maps each interface to its current implementation. Funding a paid source means changing one line here.

```typescript
// registry.ts
export const providers = {
  permits: new NYCPermitProvider(),        // live, free
  zoning: new NYCZoningProvider(),         // live, free
  opportunityZone: new IRSOZProvider(),    // live, free
  proFormaBenchmark: new MockProFormaProvider(),  // representative → swap to CoStar
  mlsComps: new MockMLSProvider(),         // representative → swap to Trestle/MLS
  // ...
};
```

### Failure discipline

If a live provider call fails at runtime, it must fall back to a clearly-labeled `representative` response, never a silent fabrication and never an unlabeled value. A failed live call that pretends to be live is a Principle 2 violation.

**The omission rule (Phase 1, load-bearing).** Distinguish a *runtime failure* from a *missing free credential / unseeded store*. A runtime failure of a call that was attempted → labeled `representative` (above). But when a provider CANNOT even attempt a live call because an optional free token is unset (NOAA_CDO_TOKEN, HUD_USER_TOKEN) or a self-hosted table is unseeded (IRS migration), it returns `data: null` tagged `live`, and the agent emits only a coverage note — it never fabricates a representative value. Omission is more honest than a plausible stand-in, and it means an unset optional token never drags a verdict to `representative`. This is what lets a NYC verdict roll up fully live on the always-available keyless sources, with optional tokens adding signal on top.

**Non-NYC / null-BBL guard.** The geocoder resolves any US address (NYC GeoSearch, else US Census onelineaddress), but NYC GeoSearch fuzzy-matches non-NYC inputs to the nearest NYC lot at full confidence — so a NYC match is accepted only when the national geocoder agrees on location within 2 km; otherwise bbl/bin/borough are set EXPLICITLY null. Every NYC-specific provider must treat a null BBL as out-of-coverage (labeled representative), never query a NYC dataset with an empty key and return a live zero that reads as "no violations / no sales". This failure class has bitten the project before; it is now closed and must stay closed.

---

## 06 — Provenance System (The Integrity Layer)

This is what makes KOANO trustworthy and legally defensible. It is also what turns the missing paid data from a weakness into a demonstration of rigor.

### The three provenance levels

- `live` — fetched in real time from a real, authoritative source. Example: an actual NYC DOB permit record pulled from NYC Open Data at request time.
- `representative` — realistic sample data standing in for a paid source not yet funded. Clearly modeled to be plausible, never presented as real. Example: a NYC cap rate benchmark before CoStar is integrated.
- `modeled` — a value computed or estimated by KOANO's own logic or the LLM, derived from other inputs rather than fetched. Example: a synthesized risk score.

### Rules

1. Every data point in every verdict carries a provenance tag.
2. The reasoning chain cites which provider each fact came from.
3. A verdict's overall provenance equals the weakest of its inputs. If any input is `representative`, the whole verdict is flagged as not fully live.
4. The UI must visibly badge anything not `live`. A small, clear label ("Representative data — becomes live with [source] integration") next to the figure.
5. Never present representative or modeled data as live. This is the one rule with no exceptions.

### Why this is a feature, not an apology

Sophisticated buyers (developers, REIT analysts, brokers) will test exactly the claims that depend on expensive data, because they know that is where products lie. A KOANO that says "this pro forma benchmark is representative; with a CoStar integration it becomes live" signals domain mastery and honesty. It converts the funding gap into a clear articulation of what capital unlocks. Hiding the gap is how the pitch dies. Labeling it is how the pitch earns trust.

---

## 07 — The Five Agents + Synthesis

Each agent is a module in /lib/agents/. Each depends only on provider interfaces from the registry, never on a data source directly. Each returns output strictly matching the Verdict schema (Section 09), with per-datapoint provenance, and a reasoning chain that cites its providers. Each runtime call uses the cost-effective runtime model with prompt caching.

### Agent data reality (post-Phase 1 — every verdict rolls up LIVE for a NYC address)

Phase 1 re-based the two mock-consuming agents onto live federal data. A NYC address now produces a verdict with `overall_provenance: live` (verified end-to-end). NONE of the five agents consumes a representative provider anymore. (The remaining mocks — pro-forma benchmarks, commercial deals — feed documents/dashboards, never the verdict pipeline.)

| Agent | File | Live sources (now) |
|---|---|---|
| Market Timing | market-timing.ts | FHFA HPI, Census ACS, NYC DOF recorded-sales comps, **Freddie Mac PMMS mortgage rate**, **HUD Fair Market Rents** (token) |
| Infrastructure Pipeline | infrastructure.ts | NYC DOB permits (NYC Open Data) |
| Demand Sentiment | demand-sentiment.ts | Census ACS, **CFPB HMDA** (mortgage lending), **BLS QCEW** (employment/wages), **IRS SOI migration** (self-hosted) |
| Risk & Volatility | risk-volatility.ts | FBI UCR / NYPD crime, FEMA NFHL flood, HPD/ECB/DOB violations, **EPA Superfund/brownfield proximity**, **USGS seismic**, **OpenFEMA disaster history**, **NOAA climate normals** (token) |
| Regulatory & Policy | regulatory-policy.ts | NYC zoning/PLUTO, IRS Opportunity Zones, HPD landlord registrations |

Notes: EPA contamination proximity replaced a coded-field guess and closed a real hallucination defect (the agent now cites actual nearby Superfund sites). OpenFEMA disaster history COMPLEMENTS the NFHL flood zone (historical multi-peril frequency vs current regulatory zone) — it must not be described as duplicating it. Mortgage rate is pulled DIRECT from Freddie Mac's PMMS CSV (attribution-only), never via FRED — FRED classifies the PMMS series as copyright-restricted for commercial redistribution (a First-Street-class trap). Foot-traffic (Placer) and search-interest (Google Trends) were retired: they are not free at any usable grain, and mortgage lending + employment + migration are strictly better housing-demand signals.

### The synthesis agent

/lib/agents/synthesis.ts receives all five structured agent outputs simultaneously and produces one unified Verdict.

Responsibilities:
- Consensus handling: multiple agents agreeing raises confidence.
- Conflict surfacing: disagreements appear in `minority_signals`, never hidden.
- Provenance rollup: overall verdict provenance equals the weakest input.
- Reasoning chain assembly: a readable trace showing each agent's conclusion, how conflicts were resolved, and the final verdict, with every fact attributed.

Agents run in parallel via Promise.all. Synthesis runs on their collected outputs.

### Geographic scope

Live data is deepest for New York City (free permits, PLUTO zoning, violations). Build and demo against real NYC addresses — Long Island City, Bushwick, Gowanus make the strongest live demos. A NYC address rolls up fully live.

The geocoder now resolves ANY US address (Census fallback), so the national agents (Risk-Volatility, Demand-Sentiment) and the national macro sources (HPI, demographics, flood, OZ, hazard, lending, employment) run genuinely live anywhere. But a non-NYC address still rolls up `representative` OVERALL, because comparable sales (NYC DOF-only; national MLS is the paid gap) and the NYC-municipal layer (permits, zoning, violations, landlord, entitlement) fall back to representative outside NYC. That is the honest, correct result — Phase 1 made non-NYC hazard + demand + macro live, not the comps/municipal layer, which have no free national equivalent.

---

## 07A — Archive & Calibration Layer (Phase 0)

The single highest-strategic-value subsystem. Premise: NYC Open Data gives current state, not history — nobody stores the time series. If KOANO snapshots the free public record weekly, it accrues a longitudinal dataset no competitor can retroactively acquire (an acquisition asset). Separately, recording verdict outcomes from now enables calibration/backtest later.

**LOCKED, irreversible decisions (never change):** weekly cadence; grain = all-NYC tracts + community districts + per-tracked-property (+ county for national datasets); generous JSONB payloads (capture fields NOW — past rows can't gain them); **live-only provenance (never archive representative/mock data)**; unique key `(dataset, scope_type, scope_key, captured_week)`; monthly RANGE partitioning on `captured_week`; tract `scope_key = 'BOROUGH:dob_census_tract'` (lossless — DOB strips GEOID tract codes irreversibly, so a GEOID crosswalk is deferred); `capture_version` on every row (like `verdicts.method`).

**Schema (`supabase/` migrations 008–013, run by the user):**
- `archive_snapshots` — partitioned monthly, state snapshots. Datasets: permits (tract), entitlement_cd (community district), violations/landlord/filings/zoning/contamination (per-property), disaster_history/mortgage_demand/employment (county), hpi (metro).
- `sales_archive` — incremental accumulation, dedup by `natural_key` (DOF Rolling Sales rolls off ~13 months, so this must accumulate).
- `archive_runs` — the failure ledger; every run writes a row so a job that "runs but writes nothing" is visible, not silent.
- `archive_coverage` — a VIEW making gaps queryable: for every ISO week × dataset, `rows_present` (counted from the real tables — NOT a run's self-report, so a double-run can't masquerade as healthy) and `is_gap`. The displayed number IS the integrity check.
- `verdict_outcomes` — the calibration table. Records only PUBLICLY-OBSERVABLE outcomes (sale, violation_resolution, ownership_change, permit_disposition) with a directional +1/0/−1 marker. Realized return/IRR/rents/occupancy are private — never recorded or modeled. Metric = directional public-signal calibration by confidence bucket, not accuracy vs unseen ground truth.
- `irs_migration` — self-hosted county migration (no IRS API; ingested once from bulk CSVs via `scripts/ingest-irs-migration.ts`).

**Mechanics:** `/api/cron/archive` (guarded by `CRON_SECRET`; Vercel sends `Authorization: Bearer $CRON_SECRET`), scheduled Mon 10:00 UTC in `vercel.json`. `/api/archive/health` reads the coverage view + last run. Capture logic in `lib/archive/capture.ts`; the weekly outcome scanner in `lib/archive/outcomes.ts`. Append-only by CONVENTION (upsert `ignoreDuplicates`; no delete trigger, unlike `verdicts`, so partition maintenance + the self-test harness can run). Non-weekly datasets (hpi, zoning, disaster/HMDA/QCEW) are **capture-if-changed** (content-hash dedupe) — a no-change week is not a gap, so they are deliberately excluded from the weekly coverage view. Socrata `$group` aggregates snapshot all NYC tracts/CDs in ~5 requests, not thousands of calls.

**Integrity harness:** `npm run test:archive` verifies a snapshot round-trips AND that `archive_coverage` reports a synthetic gap — the failure mode that destroys the thesis is a job that appears to run and writes nothing. The missed-run alert (email via Resend if configured, else loud console.error) is suppressed for weeks before the first-ever successful run (a spurious first-setup alert would teach the operator to ignore the one mechanism protecting the asset).

---

## 08 — The Four Clusters

Same engine, same five agents, four different presentations and depths. All four are in scope. Cluster 3 (due diligence) is reserved for a future roadmap and is not built. There is no Cluster 0.

### Cluster 1 — Community — Property Intelligence (Homeowners, renters, neighbors)
Price band: 19–49 / month.
Route: /for/community (nav label "For communities").
Bureaucratic work replaced: manual comp pull, violation and ownership record lookup, permit history lookup, property tax assessment appeal research.
Default view: single property. AVM with velocity, permit history, neighborhood trajectory, KOANO verdict.
Neural map: not on default view.

### Cluster 2 — Transaction Intelligence (Agents, brokers, MLOs)
Price band: 149–299 / month.
Bureaucratic work replaced: the full CMA process, neighborhood narrative writing, offer-price recommendation, absorption-rate calculation.
Default view: market velocity dashboard. CMA builder with early-signal overlay, client-ready narrative, pricing recommendation with reasoning.
Neural map: not on default view.
Data caveat: MLS comps are the core dependency and are paid and legally gated. Until funded, comps are `representative`. This must be visibly labeled. Do not imply live MLS access.

### Cluster 4 — Development Intelligence (Developers, CRE brokers, contractors)
Price band: 499–1,499 / month.
This is the sharpest wedge and the deepest free-data slice. Build this cluster to genuine production depth first.
Bureaucratic work replaced: zoning research and entitlement risk assessment, community board opposition assessment, pro forma input benchmarking, infrastructure pipeline scan, permit history pull.
Default view: multi-site comparison. Enter up to three site addresses; all five agents run on each; synthesis ranks by risk-adjusted opportunity; developer receives a structured comparison with full reasoning chain.
Neural map: available via a "System View" tab (on demand).
Data reality: zoning, permits, and Opportunity Zone status are `live` for NYC. Pro forma benchmarks are `representative` until CoStar-tier data is funded, and must be labeled.

### Cluster 5 — Portfolio Intelligence (Institutional, C-suite, REITs)
Price band: 1,499–4,999 / month plus custom.
Highest value, longest sales cycle, strictest liability. Build the demo faithfully; understand this is an enterprise motion, not a self-serve launch.
Bureaucratic work replaced: market entry studies (replacing 50–150K consultant reports), monthly portfolio risk reports (replaced by continuous monitoring), the first weeks of deal underwriting, regulatory change monitoring.
Default view: portfolio command center with a proactive Monday morning briefing.
Neural map: full-screen, as the hero of the dashboard.
Data reality and liability: institutional users will not act on unverifiable output. Every figure must be traceable and provenance-tagged. Representative figures must be labeled. This is decision-support, not decision-making; the UI language must reflect that.

### Cluster-to-neural-map summary

| Cluster | Neural map presence |
|---|---|
| 1 — Community | Not present |
| 2 — Agents | Not present |
| 4 — Developers | System View tab, on demand |
| 5 — Institutional | Full-screen, default hero of the dashboard |

---

## 09 — Verdict Schema

Every agent and the synthesis agent output this shape. No `any` types. Provenance is mandatory on every fact.

```typescript
interface DataPoint {
  label: string;
  value: string | number;
  provenance: "live" | "representative" | "modeled";
  source: string;
  fetched_at: string;
}

interface ReasoningStep {
  agent: string;
  conclusion: string;
  evidence: DataPoint[];       // each fact carries its own provenance
  confidence: number;          // 0–100
}

interface MinoritySignal {
  agent: string;
  dissent: string;
  evidence: DataPoint[];
}

interface KoanoVerdict {
  verdict: "buy" | "sell" | "hold" | "wait" | "pass";
  confidence: number;                    // 0–100
  signal_window_months: number;
  headline: string;
  reasoning_chain: ReasoningStep[];
  minority_signals: MinoritySignal[];
  overall_provenance: "live" | "representative" | "modeled";  // = weakest input
  risk_score: number;                    // 0–100
  generated_at: string;
}
```

The `overall_provenance` field is computed as the weakest provenance among all `DataPoint`s in the verdict. If any fact is `representative`, `overall_provenance` is `representative`, and the UI badges the entire verdict accordingly.

---

## 10 — Design System

Unchanged from prior versions and still authoritative. The neural map and marketing site already implement this.

### Visual reference
Study thefoundation.house before building any UI: lightness, whitespace, editorial typographic restraint. KOANO uses the same soft, precise aesthetic translated into its blue palette.

### Typography
Font: Neue Montreal (Fontshare, free, commercial use permitted).

```html
<link href="https://api.fontshare.com/v2/css?f[]=neue-montreal@400,500,700&display=swap" rel="stylesheet" />
```

```css
fontFamily: {
  sans: ['Neue Montreal', 'DM Sans', 'system-ui', 'sans-serif'],
  mono: ['DM Mono', 'monospace'],
}
```

| Role | Size | Weight |
|---|---|---|
| Hero H1 | 64–96px | 700 |
| Section H2 | 40–52px | 700 |
| Sub H3 | 24–32px | 500 |
| Body large | 18px | 400 |
| Body | 16px | 400 |
| UI / labels | 13–14px | 500 |
| Mono / data | 11–13px | 400–500 |
| Micro (section numbers, tags) | 10–11px | 500 |

Headlines: letter-spacing -0.02em. Mono/data labels: letter-spacing 0.08em.

### Color palette — Coastal Intelligence

```css
:root {
  --white: #FFFFFF;
  --pale-wash: #F0F7FC;
  --sky: #D6EBF7;

  --brand-blue: #A8C4D4;   /* KOANO signature: section numbers, synthesis node, chips */
  --mid-blue: #5A9BBE;     /* accent words, link hover */
  --deep-navy: #1A4F6E;
  --near-black: #0D2B3E;   /* primary text on light; never a section background */

  --ink-primary: #0D2B3E;
  --ink-secondary: #3D5A6E;
  --ink-muted: #5A7A8C;
  --ink-faint: #8AABB8;

  --border: #D6EBF7;
  --border-light: #E8F3FA;

  --signal-positive: #22C55E;
  --signal-warning: #F59E0B;
  --signal-negative: #EF4444;
}
```

### Neural map palette (as implemented, authoritative)

```css
--nm-synthesis: #A8C4D4;   /* KOANO blue hub */
--nm-agent:     #E91E8C;   /* magenta specialist agents */
--nm-source:    #4A90D9;   /* blue data sources */
--nm-feed:      #9DD1B8;   /* sage sub-feeds */
/* background: #FFFFFF; matte spheres; curved tube connections */
```

### Buttons
Pill shape only (border-radius 100px). Primary: `--brand-blue` fill, `--near-black` text. Ghost: transparent, `--border` outline. All primary CTAs end with the diagonal arrow.

### Section numbers
Format `01`, `02` in mono, 11px, `--brand-blue`, letter-spacing 1.5px, as an eyebrow above section headers.

### Animation (Framer Motion)
Entrance: fade-up only (y 20 to 0, opacity 0 to 1). Duration 0.5s content, 0.3s UI. Easing [0.16, 1, 0.3, 1]. No spring, no bounce, no scale on entrance. Stagger 0.08s. Scroll trigger useInView threshold 0.15. Hover: opacity shifts only, never scale on static showcase elements.

### Glass cards
Glassmorphism only renders over a textured/image/video/3D background. On flat white sections, use solid white cards with a 1px `--border` and 20px radius. Glass components come from 21st.dev; do not hand-roll glassmorphism CSS.

### Data/render assets
3D renders and hero videos are pre-made assets dropped into named slots; Claude Code places them, never generates them. Until delivered, sections run on typography and color alone. Never use grey placeholder rectangles, stock photography, or Unsplash URLs.

---

## 11 — File & Folder Structure

```
/app
  layout.tsx                    ← ClerkProvider, font, global CSS
  page.tsx                      ← Homepage
  /for/{community,agents,developers,institutions}/page.tsx
  /intelligence/page.tsx
  /pricing/page.tsx
  /about/page.tsx
  /early-access/page.tsx
  /data/page.tsx
  /login/page.tsx
  /signup/page.tsx
  /onboarding/page.tsx          ← cluster selection
  /dashboard
    page.tsx                    ← cluster-aware root
    /site/[id]/page.tsx         ← Cluster 4 site analysis
    /property/[id]/page.tsx     ← Cluster 1
    /portfolio/page.tsx         ← Cluster 5
    /reasoning/[id]/page.tsx    ← full reasoning chain view
  /api
    /agents/route.ts            ← Clerk-protected verdict endpoint (+ /agents/stream NDJSON)
    /site-detail/route.ts       ← raw provider blocks (no LLM) for dashboards + documents
    /documents/route.ts         ← document generation (gated by IMPLEMENTED_DOC_TYPES)
    /narrative, /briefing, /properties, /verdicts, /profile, /stripe/*
    /cron/archive/route.ts      ← weekly snapshot cron (CRON_SECRET); /archive/health

/components
  /ui        (Button, SectionNumber, VerdictCard, ReasoningChain, ProvenanceBadge, GlassCard)
  /marketing (Nav, Footer, HeroSection, ClustersSection, AgentsSection, ...)
  /dashboard (cluster1..5/, clusters.ts metadata, panels.tsx, DashboardShell, Sidebar)

/lib
  /providers (types.ts, registry.ts, blocks.ts, real/, mock/)
  /agents    (5 specialists + synthesis, shared.ts, grounding.ts, narrative.ts, briefing.ts)
  /archive   (capture.ts, outcomes.ts)   ← Phase 0
  /documents (registry.ts, types.ts, implemented.ts, builders/, render/, disclaimer.ts)
  /supabase  (client.ts, server.ts, verdicts.ts)
  koano-guard.ts   ← approval gate + spend limits + global breaker
  /stripe    (client.ts)        ← backend wired, UI deferred

/supabase
  schema.sql + migration-002 … migration-013 (run by the user, in order)

/styles
  globals.css

/public
  neural-map.html               ← built, authoritative
  /renders                      ← pre-made assets
```

The `ProvenanceBadge` component in /components/ui is mandatory and used anywhere a non-live figure is displayed.

---

## 12 — Site Architecture (Routes)

Marketing (koano.com): /, /for/community, /for/agents, /for/developers, /for/institutions, /intelligence, /pricing, /about, /early-access, /data. (/for/homeowners and /community 308-redirect to /for/community.)

Application (app.koano.com or /dashboard): /login, /signup, /onboarding, /dashboard (cluster-aware), /dashboard/site/[id], /dashboard/property/[id], /dashboard/portfolio, /dashboard/reasoning/[id].

---

## 13 — Approved Copy (Verbatim)

Global brand name: KOANO (always all caps). Category and tagline: The real estate reasoning engine.

Homepage hero tag: `Real estate reasoning engine`

Hero headline:
```
Real estate has always had data.
It's never had a brain.
```

Hero subhead:
```
KOANO deploys five specialist AI agents that ingest dozens of data sources,
reason autonomously, and deliver a single verdict, with every step of the
thinking visible and auditable.
```

Hero CTAs: `Get early access` (primary) and `See how it works` (ghost).

Clusters section header: `The same engine. Four different altitudes.`

Cluster cards (verbatim):
- Property intelligence — `Know what's happening to your property's value before your neighbors do, and know what to do about it.` From 19 / month.
- Transaction intelligence — `Find opportunities before they hit the MLS. Make data-backed recommendations that close deals.` From 149 / month.
- Development intelligence — `Find your best site. Model your deal. Understand your entitlement risk. Before anyone else does.` From 499 / month.
- Portfolio intelligence — `Monitor everything. Miss nothing. Make institutional decisions with intelligence infrastructure that was previously available only to the world's largest firms.` From 1,499 / month.

Agents section header: `Five agents. One verdict. Every step auditable.`

Footer copyright: `© 2026 KOANO Inc. All rights reserved.`

Copy placeholders (render as italic `--ink-faint` inside a `--pale-wash` dashed-border container; never invent copy to fill them): cluster landing H1s, /intelligence headline, /pricing framing, /about founding story, onboarding welcome copy, dashboard empty states, /early-access headline and subhead.

---

## 14 — Data Sources

### Live free sources (real, wired and verified)
NYC Open Data (DOB permits, PLUTO zoning, HPD/ECB/DOB violations, DOF recorded sales, DOB job filings, HPD landlord registrations, NYPD complaints); US Census ACS (keyless via Census Reporter — see the UA gotcha below) + Census geocoder; FHFA House Price Index; FBI UCR / Crime Data Explorer; FEMA NFHL flood + **OpenFEMA disaster declarations**; **EPA Facility Registry Service (SEMS Superfund + ACRES brownfields)**; **USGS Earthquake Hazards (ASCE 7-22 building-codes + ComCat)**; **NOAA NCEI climate normals** (free token); IRS Opportunity Zones + **IRS SOI county migration** (self-hosted); **CFPB HMDA** (mortgage lending); **BLS QCEW** (employment/wages); **HUD Fair Market Rents** (free token); **Freddie Mac PMMS** (mortgage rate, direct CSV).

Operational gotchas (durable): (1) **Census Reporter** now 403s generic user agents — the keyless ACS call MUST send a project-specific `User-Agent` header, else demographics silently falls to representative and drags every verdict. (2) **EPA FRS enforces 12 requests/minute** — a single verdict (2 calls) is fine; the archive's per-property contamination capture needs throttling if tracked-property count grows past ~6. Its provider uses `retries:0` (retrying a per-minute limit only storms). (3) **NYC GeoSearch fuzzy-matches** non-NYC addresses to NYC lots at full confidence — the 2 km cross-check against the Census geocoder is what rejects them.

### Paid sources still mocked as `representative`
Pro-forma benchmarks (CoStar-tier) and commercial deals (CoStar/RCA) — the only two representative providers left, and they feed documents/dashboards, never the verdict. National MLS comps (Trestle) remain the paid gap for non-NYC comps. Each mock carries a `swap_note` with the one-line registry change to go live. (Placer.ai foot traffic, Verisk/CoreLogic premium hazard, and Google Trends were NOT swapped — they were replaced by better free federal signals and their mocks deleted.)

### NYC-first rationale
NYC publishes permits, zoning, and violations as free open data, so the Infrastructure and Regulatory agents can run genuinely live for NYC addresses today. This is the single most credible live demo available on a zero budget: deep on one city rather than shallow everywhere.

---

## 15 — Build Sequence

Each step verified before the next (Principle 3).

**Done:** Design system, marketing site, neural map. **Phase A** (backend spine: providers, 5 agents + synthesis, verdict routes, schema/RLS). **Phase B/C** (all four cluster dashboards + document engine). **Phase D** (Clerk auth/onboarding; spend guard). **Phase 0** (archive & calibration layer — Section 07A). **Phase 1** (every verdict live — the two mock-consuming agents re-based onto federal data; national geocoder; Superfund gap closed; Census UA fix). **Phase 2 — scheduled monitoring** (the recurring-revenue layer): the deterministic weekly DIFF on the archive → notifications → in-app feed (`/api/notifications`, Cluster-1 AlertsPanel) → Resend weekly digest (Monday) → preferences + non-destructive tier caps. `lib/monitor/{detect,scan,digest}.ts`; runs on the daily-fan-out archive cron; free-tier sees it disabled-with-upgrade; migrations 014–016. Grounding discipline is structural (a notification carries only verbatim snapshot values + fixed templates — it's a factual claim leaving by email). Paywall Phases 1–3 (tier gate + Stripe backend) wired.

**Remaining / deferred:**
- **Archive cron property-scale ceiling — RESOLVED (daily fan-out, migration-015).**
  Was: the weekly capture processed every property in one 300s Vercel run
  (~14s/property + ~75s EPA window) → ceiling ~15 properties → timeout → permanent
  archive hole. Now the cron runs DAILY (`vercel.json` `0 10 * * *`); each day
  handles one shard (0=Mon..6=Sun) of properties (`propertyShard(bbl)`); all-NYC
  datasets + the outcome scan run on shard 0. All 7 daily runs write the same
  `captured_week` (ISO Monday), so weekly bucketing and the monitoring diff are
  unchanged. `archive_runs.shard` + the `archive_week_shards` view make a week
  complete only when all 7 shards ran — a missed DAY is a gap, not "6 of 7 passed"
  (`missedShards`/`computeShardGaps`, genesis-guarded). The cron degrades to a full
  unsharded run if migration-015 isn't applied yet, so deploy ordering can't cause
  a missed day. New per-shard ceiling ≈ 7× headroom (~100+ properties).
- HMDA tract-level ingestion (county is live; tract is the immediate fast-follow).
- Snapshot the national providers into the archive — DONE (Slice 5); migration-013 applied and verified (coverage view shows the new datasets).
- Stripe billing UI; PostHog; SOC 2; enterprise SSO for Cluster 5.
- Paid-source swaps (pro-forma benchmarks, commercial deals, national MLS comps) — one-line registry changes when funded.
- Marketing visual pass + 3D render drop-in; embed neural map into /intelligence.

**Migrations: all applied through 013** (verified — `archive_coverage` shows the new datasets), and IRS migration is seeded (3,120 counties). The ONLY remaining optional action: set free tokens (`NOAA_CDO_TOKEN`, `HUD_USER_TOKEN`) in `.env.local` AND Vercel for the additive climate/rent signals (env additions need a redeploy to take effect). The verdict engine is fully live for NYC without them.

---

## 16 — Non-Negotiable Rules

### Data integrity
- Never present `representative` or `modeled` data as `live`.
- Every data point carries provenance. Every non-live figure is badged in the UI.
- A verdict's overall provenance equals its weakest input.
- Agents never call data sources directly; only through provider interfaces.
- A failed live call falls back to labeled `representative`, never a silent fake. A *missing free credential / unseeded store* omits (data:null tagged live), never fabricates — the omission rule (Section 06).
- The archive stores ONLY `live` provenance data — never snapshot a representative fallback into the time series (a permanent falsification of the record).
- A non-NYC address resolves with bbl/bin/borough EXPLICITLY null; NYC providers must return coverage-absent, never a live zero, for a null key. Do not regress this.
- The keyless Census ACS call must send a project-specific `User-Agent` header (Census Reporter 403s generic UAs). Losing this silently drags every verdict representative.

### Architecture
- Swapping a mock provider to real is a one-line registry change. If a change requires touching agent or UI code, the abstraction is wrong; fix the abstraction.
- No `any` TypeScript types on verdict, agent, or provider shapes.
- All Claude API calls are server-side only. Keys never reach the client.
- Runtime agent calls always use prompt caching on the system prompt.
- Build and verify one slice before replicating.

### Release discipline
- Before ANY `git push`, run a full production build (`next build`), not just `tsc` and the harnesses. `tsc` and the doc harnesses do NOT catch ESLint errors (e.g. `no-unused-vars`), which Vercel's build fails on — that is how a broken deploy shipped once. The build is the gate.
- This is enforced, not remembered: a git pre-push hook (`.githooks/pre-push` → `npm run prepush` → `scripts/prepush.sh`) runs the full build and blocks the push on failure. The build goes to an isolated dir so it never corrupts a running `next dev` server. One-time per clone: `git config core.hooksPath .githooks`.
- Never bypass the gate (`--no-verify`) to push a red build. Fix the build first.

### Visual
- No dark section backgrounds anywhere. All sections white or pale-wash.
- `--near-black` is a text color, never a section background.
- No grey placeholder boxes, no stock photography, no Unsplash.
- Neue Montreal only. No Inter, Roboto, or system fonts as primary.
- Pill buttons only. Primary CTAs end with the diagonal arrow.
- Glass cards only over textured backgrounds; solid white cards on flat sections.

### Copy and scope
- Never invent headlines, taglines, or positioning language.
- Never fill a copy placeholder with invented text.
- Never build Cluster 0 (removed) or Cluster 3 (reserved).
- Do not describe nonprofit partnerships as live on the /community page.

### Product truth
- KOANO is decision-support that shows its work, not an oracle. UI language reflects this, especially for Clusters 4 and 5.
- Any demo data is visibly labeled as demo/representative.

---

## 17 — Security

- Row Level Security on every Supabase table, scoped to auth.uid().
- All Claude API calls server-side (Next.js API routes / server components).
- API keys in environment variables only; .env.local is gitignored.
- Clerk protects /dashboard and /api routes via middleware.ts.
- Stripe webhook signature verification (when Stripe is added).
- Verdicts table is immutable (append-only); it is the audit trail and a product promise.
- Cluster 5 data isolation and SOC 2 are deferred but must not be contradicted by architecture now: never design in a way that would make per-tenant isolation impossible later.

---

## 18 — Environment Variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Anthropic (runtime agent calls)
ANTHROPIC_API_KEY=

# Clerk (auth)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Archive cron (REQUIRED for the weekly snapshot job; Vercel sends it as a Bearer token)
CRON_SECRET=

# Free provider tokens — OPTIONAL. Their absence never drags a verdict (omission rule):
NYC_OPEN_DATA_APP_TOKEN=   # removes the Socrata per-IP throttle (recommended in prod)
NOAA_CDO_TOKEN=            # NOAA climate normals (else that signal is omitted)
HUD_USER_TOKEN=           # HUD Fair Market Rents (else omitted)
FBI_CRIME_API_KEY=        # FBI CDE state-level crime (else NYPD live for NYC, representative elsewhere)
CENSUS_API_KEY=           # NOT needed — keyless Census Reporter works with the UA header; only a higher-volume upgrade
KOANO_RUNTIME_MODEL=      # optional override of the Sonnet-class runtime constant
KOANO_DAILY_RUN_CAP=      # global spend breaker (default 50)

# Stripe (backend wired; UI deferred)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Mapbox (deferred, dashboards)
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=

# App URLs (note: NEXT_PUBLIC_APP_URL must be the real deployed origin, not localhost,
# or cron/self-POST calls break; the prod domain 308-redirects koano.co → www.koano.co,
# which drops the auth header across the cross-host hop — POST directly to www.)
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_MARKETING_URL=
```

---

*KOANO CLAUDE.md v5.1 | Confidential & Proprietary | 2026*
*v5.1 records the built reality: backend spine, all four dashboards, the archive/calibration layer (07A), and Phase 1 — every verdict now rolls up live for a NYC address, on federal data, honestly labeled.*
*The premium demo is built honestly today so that capital turns it into production tomorrow, without a rewrite and without a lie.*
