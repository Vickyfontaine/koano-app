# KOANO — Master Build Context
## Version 5.0 | Confidential & Proprietary | 2026

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

**Built and working:**
- Marketing site: homepage (all sections), and the pages /for/community, /for/agents, /for/developers, /for/institutions, /intelligence, /pricing, /about, /early-access, /data.
- Design system: Neue Montreal typography, full color palette as CSS variables, Button and SectionNumber components, Nav, Footer.
- Neural map: /public/neural-map.html. 143 nodes, D3 v7 force layout combined with Three.js r128 rendering. White background, KOANO blue synthesis hub, magenta agents, blue data sources, sage sub-feeds, curved tube connections, auto-rotate, hover and click interaction. Functionally and cosmetically complete.

**Not built (this is the work ahead):**
- The entire backend. No agents, no synthesis, no provider layer, no API routes exist yet.
- The Supabase schema (tables not yet created).
- All four cluster dashboards. None exist.
- Auth flows (login, signup, onboarding).
- Stripe billing.
- Live wiring between frontend and any verdict engine.

**Configured and ready:**
- Supabase project created; URL and keys in .env.local.
- Anthropic API key in .env.local.
- Clerk publishable and secret keys in .env.local.
- Stripe and Mapbox keys are placeholders, to be added when those features are built.

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

---

## 05 — Provider Interface Architecture (The Spine)

This is the most important engineering decision in KOANO. Get it right once and everything else swaps in cleanly.

### Structure

```
/lib/providers/
  types.ts        ← all provider interfaces + the wrapped-result type
  registry.ts     ← single config mapping each interface to its active impl
  real/
    nyc-permits.ts        (live)
    nyc-zoning.ts         (live)
    irs-opportunity.ts    (live)
    census-acs.ts         (live)
    fhfa-hpi.ts           (live)
    fema-flood.ts         (live)
    fbi-ucr.ts            (live)
    google-trends.ts      (live)
    first-street-free.ts  (live, free tier)
  mock/
    proforma-benchmark.ts (representative)
    mls-comps.ts          (representative)
    placer-traffic.ts     (representative)
    premium-hazard.ts     (representative)
    costar-deals.ts       (representative)
```

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

### Agent data reality (what is live vs representative today)

| Agent | File | Live free sources (today) | Representative until funded |
|---|---|---|---|
| Market Timing | market-timing.ts | FHFA House Price Index, Redfin Data Center, Census ACS | MLS comps, paid AVM |
| Infrastructure Pipeline | infrastructure.ts | NYC DOB permits (NYC Open Data), DOT project data | National permit aggregation (Shovels.ai) |
| Demand Sentiment | demand-sentiment.ts | Google Trends, Census demographics | Foot traffic (Placer.ai), SafeGraph |
| Risk & Volatility | risk-volatility.ts | FBI UCR crime, FEMA flood, First Street free tier | Premium hazard (Verisk, CoreLogic) |
| Regulatory & Policy | regulatory-policy.ts | NYC zoning/PLUTO, IRS Opportunity Zones, SEC EDGAR | Community board sentiment (paid/manual) |

### The synthesis agent

/lib/agents/synthesis.ts receives all five structured agent outputs simultaneously and produces one unified Verdict.

Responsibilities:
- Consensus handling: multiple agents agreeing raises confidence.
- Conflict surfacing: disagreements appear in `minority_signals`, never hidden.
- Provenance rollup: overall verdict provenance equals the weakest input.
- Reasoning chain assembly: a readable trace showing each agent's conclusion, how conflicts were resolved, and the final verdict, with every fact attributed.

Agents run in parallel via Promise.all. Synthesis runs on their collected outputs.

### Geographic scope at this stage

Live data is deepest for New York City, because NYC publishes permits, zoning (PLUTO), and violations as free open data. Build and demo against real NYC addresses. Addresses outside NYC fall back to representative data for the NYC-specific sources, clearly labeled. Long Island City, Bushwick, and similar actively-developing areas make the strongest live demos.

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
  irr_estimate?: number;                 // Clusters 4 & 5 only
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
    /agents/route.ts            ← Clerk-protected verdict endpoint

/components
  /ui        (Button, SectionNumber, VerdictCard, ReasoningChain, ProvenanceBadge, GlassCard)
  /marketing (Nav, Footer, HeroSection, ClustersSection, AgentsSection, ...)
  /dashboard (Sidebar, ClusterBadge, SiteComparison, PortfolioView, ...)

/lib
  /providers (types.ts, registry.ts, real/, mock/)
  /agents    (market-timing, infrastructure, demand-sentiment, risk-volatility, regulatory-policy, synthesis)
  /supabase  (client.ts, server.ts)
  /stripe    (checkout.ts)      ← deferred

/supabase
  schema.sql

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

### Live free sources (real, in use today)
Census ACS, BLS, FHFA House Price Index, Redfin Data Center, Freddie Mac, FBI UCR, FEMA / OpenFEMA, NOAA, EPA, IRS Opportunity Zones, HUD USER, SEC EDGAR, First Street (free tier), Google Trends, OpenStreetMap, NYC Open Data (DOB permits, PLUTO zoning, violations, 311), LA GeoHub, Chicago Data Portal, Municipode.

### Paid sources (mocked as `representative` until funded)
ATTOM, Shovels.ai (national permit aggregation), Placer.ai, SafeGraph, CoStar / LoopNet, Reonomy, HouseCanary, CoreLogic, MLS via Trestle, MSCI Real Capital Analytics, Verisk, premium hazard feeds, Walk Score (paid tier), AirDNA.

Each paid source has a corresponding mock provider with a `swap_note` documenting the exact one-line change that turns it live once funded.

### NYC-first rationale
NYC publishes permits, zoning, and violations as free open data, so the Infrastructure and Regulatory agents can run genuinely live for NYC addresses today. This is the single most credible live demo available on a zero budget: deep on one city rather than shallow everywhere.

---

## 15 — Build Sequence

Reflects what is done and the order for what remains. Each step is verified before the next (Principle 3).

**Done:** Design system, marketing site, neural map.

**Phase A — Backend spine (current focus).** Provider architecture (types, registry). Real NYC providers (permits, zoning, Opportunity Zones) plus Census/FHFA/FEMA/FBI/Trends. Mock providers for paid sources with swap notes. Build all five agents one at a time, testing each: Regulatory & Policy (live), Infrastructure (live), then Demand, Risk, Market Timing (mixed live/representative). Synthesis across all five. Clerk-protected /api/agents route. Supabase schema with RLS. Verify: a real NYC address returns a valid, provenance-tagged verdict, with live agents genuinely live.

**Phase B — Cluster 4 dashboard (deepest slice).** Site comparison UI consuming real verdicts. ProvenanceBadge everywhere. System View tab embedding the neural map. This is the pitch centerpiece.

**Phase C — Remaining dashboards.** Cluster 1, 2, 5 dashboards on the proven verdict engine. Cluster 5 gets the full-screen neural map and Monday briefing. Cluster 2 clearly labels representative MLS comps.

**Phase D — Auth and onboarding polish.** Login, signup, cluster selection wired to Supabase profile.

**Phase E — Marketing polish and deploy.** Visual pass, 3D render drop-in, embed neural map into /intelligence, deploy to Vercel. (Marketing deploy can happen anytime in parallel; it blocks nothing.)

**Deferred until capital:** Stripe billing, paid source integrations (swap mocks to real), PostHog, SOC 2, enterprise SSO for Cluster 5.

---

## 16 — Non-Negotiable Rules

### Data integrity
- Never present `representative` or `modeled` data as `live`.
- Every data point carries provenance. Every non-live figure is badged in the UI.
- A verdict's overall provenance equals its weakest input.
- Agents never call data sources directly; only through provider interfaces.
- A failed live call falls back to labeled `representative`, never a silent fake.

### Architecture
- Swapping a mock provider to real is a one-line registry change. If a change requires touching agent or UI code, the abstraction is wrong; fix the abstraction.
- No `any` TypeScript types on verdict, agent, or provider shapes.
- All Claude API calls are server-side only. Keys never reach the client.
- Runtime agent calls always use prompt caching on the system prompt.
- Build and verify one slice before replicating.

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

# Stripe (deferred)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Mapbox (deferred, dashboards)
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=

# App URLs
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_MARKETING_URL=
```

---

*KOANO CLAUDE.md v5.0 | Confidential & Proprietary | 2026*
*The premium demo is built honestly today so that capital turns it into production tomorrow, without a rewrite and without a lie.*
