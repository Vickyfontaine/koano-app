# KOANO — Claude Code Master Context
## Version 4.0 | Confidential & Proprietary | 2026

> This file is the single source of truth for every build session.
> Read it completely before writing a single line of code.
> Never invent copy, colors, components, or pages not specified here.
> Never add sections, features, or pages beyond what is defined.

---

## 01 — What KOANO Is

KOANO is not a real estate data platform. It is a **real estate reasoning engine**.

A coordinated system of five specialist AI agents — each owning a distinct domain of real estate intelligence — that ingests raw data from 50+ sources, reasons autonomously, cross-checks conclusions, and delivers a single unified verdict to the user. Every verdict is accompanied by a full, auditable reasoning chain. Every output is a decision, not a dashboard.

**The one-sentence brand promise:**
> "The same intelligence that helps a REIT make a $50M acquisition also tells a renter in Crown Heights if their building is safe."

**Category:** Real estate reasoning engine (a new category — not analytics, not listings, not data).

**What KOANO is NOT:**
- ❌ NOT a Zillow / Redfin clone
- ❌ NOT a data dashboard
- ❌ NOT a listing platform
- ❌ NOT another PropTech SaaS with charts
- ❌ NOT a black box — showing its reasoning is the product

---

## 02 — Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 14 (App Router) | Full-stack, one codebase |
| Styling | Tailwind CSS | Custom CSS variables via globals.css |
| Animation | Framer Motion | Scroll-driven, hover states, page transitions |
| 3D / Hero | Spline + Three.js (@react-three/fiber) | Spline for embeds, Three.js for agent viz |
| Maps | Mapbox GL JS | Interactive signal map, intelligence page |
| Auth | Clerk | SSO for enterprise (Cluster 5), OAuth for others |
| Database | Supabase (Postgres) | Row Level Security enforced on all tables |
| Payments | Stripe | Subscriptions + webhooks |
| AI / Agents | Anthropic Claude API | Model: claude-sonnet-4-20250514 |
| Deployment | Vercel | Auto-deploy on push to main |
| Analytics | PostHog | Product analytics |
| Marketing analytics | Plausible | Privacy-friendly, no cookie banner needed |

**Claude API usage pattern:**
```
Each KOANO verdict = 5 parallel specialist agent calls + 1 synthesis call
All agent calls use structured JSON output (never raw prose)
Synthesis agent receives all 5 structured outputs simultaneously
System prompts live in /lib/agents/[agent-name].ts
```

---

## 03 — Design System

### Visual Reference

**Primary reference:** thefoundation.house
Study this site before building anything. Pay attention to:
- The lightness and whitespace — almost no dark sections
- Typography weight and breathing room between elements
- The soft, coastal, editorial quality of the layout
- How cards sit on light backgrounds without feeling heavy

KOANO uses this same soft coastal intelligence aesthetic, translated into our baby blue palette instead of their warm tones.

**KOANO's signature:** Baby blue (`--brand-blue: #A8C4D4`) is KOANO's identity. It appears on section numbers, agent dots, verdict labels, data chips, the center line in the agent flow diagram, and dot connectors. It is the thread that runs through every page.

### Typography

**Font:** Neue Montreal (Fontshare — free, commercial use permitted)

```html
<!-- Add to <head> in layout.tsx -->
<link href="https://api.fontshare.com/v2/css?f[]=neue-montreal@400,500,700&display=swap" rel="stylesheet" />
```

```css
fontFamily: {
  sans: ['Neue Montreal', 'DM Sans', 'system-ui', 'sans-serif'],
  mono: ['DM Mono', 'monospace'],
}
```

| Role | Size | Weight | Use |
|---|---|---|---|
| Display / Hero H1 | 64–96px | 700 | Hero headlines only |
| Section H2 | 40–52px | 700 | Section headers |
| Sub H3 | 24–32px | 500 | Card titles, sub-sections |
| Body large | 18px | 400 | Hero subhead, intro paragraphs |
| Body | 16px | 400 | Standard body copy |
| UI / labels | 13–14px | 500 | Nav links, card labels, meta |
| Mono / data | 11–13px | 400–500 | Agent labels, prices, stats, scores |
| Micro | 10–11px | 500 | Section numbers (01, 02...), tags, chips |

**Letter spacing:** Headlines use `letter-spacing: -0.02em`. Mono/data labels use `letter-spacing: 0.08em`.

### Color Palette — Coastal Intelligence

```css
:root {
  /* Backgrounds */
  --white: #FFFFFF;
  --pale-wash: #F0F7FC;      /* light section backgrounds, card hover states */
  --sky: #D6EBF7;            /* tinted cards, tag backgrounds, borders */

  /* Brand Blue — KOANO's signature color */
  --brand-blue: #A8C4D4;     /* section numbers, agent dots, verdict labels, data chips, center line, dot connectors */
  --mid-blue: #5A9BBE;       /* headline accent words, link hover, inline highlights */
  --deep-navy: #1A4F6E;      /* strong labels, dark text on sky backgrounds */
  --near-black: #0D2B3E;     /* primary text color on light sections, footer text */

  /* Ink (text) */
  --ink-primary: #0D2B3E;    /* all body text on light backgrounds */
  --ink-secondary: #3D5A6E;  /* subheads, secondary body */
  --ink-muted: #5A7A8C;      /* meta text, body on light */
  --ink-faint: #8AABB8;      /* section numbers on light, placeholder text */

  /* Borders */
  --border: #D6EBF7;         /* card borders, dividers */
  --border-light: #E8F3FA;   /* subtle separators */

  /* Functional signals */
  --signal-positive: #22C55E;   /* buy signals, positive verdicts */
  --signal-warning: #F59E0B;    /* hold signals, watch signals */
  --signal-negative: #EF4444;   /* risk flags, sell signals */

  /* Glass cards on light */
  --glass-light-bg: rgba(255, 255, 255, 0.45);
  --glass-light-border: rgba(255, 255, 255, 0.65);
  --glass-light-blur: blur(24px) saturate(180%);
}
```

### Color Application Rules

| Section type | Background | Primary text | Cards | Accent |
|---|---|---|---|---|
| Hero (cinematic) | 3D render video, full bleed | White | Glass light — ONLY valid here, over the render | `--brand-blue` labels |
| All content sections | `--white` or `--pale-wash` | `--ink-primary` | White, `--sky` border | `--brand-blue` numbers, dots, chips |
| Footer | `--white` with border-top `--border` | `--ink-primary` | — | `--brand-blue` links |
| Verdict card | `--white` | `--ink-primary` | Bordered, `--pale-wash` bg | `--brand-blue` label |
| Signal positive | — | `--signal-positive` | `rgba(34,197,94,0.08)` bg | — |
| Signal warning | — | `--signal-warning` | `rgba(245,158,11,0.08)` bg | — |
| Signal negative | — | `--signal-negative` | `rgba(239,68,68,0.08)` bg | — |

**Light-only rule: There are NO dark sections anywhere on the site.**
- The Promise quote section is light (`--white` background, `--ink-primary` text, quote in `--near-black`)
- The footer is white with a `--border` top border
- `--near-black` (`#0D2B3E`) is used for text only — never as a section background
- 100% of sections use white or pale-wash backgrounds

### Glassmorphic Cards — Usage Rules

```css
/* Card on light background — ONLY valid when placed over a 3D render or video */
.glass-card-light {
  background: rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.65);
  border-radius: 20px;
  box-shadow:
    0 0 0 0.5px rgba(255, 255, 255, 0.3) inset,
    0 8px 32px rgba(168, 196, 212, 0.15);
}
```

**Critical rule:** Glass cards ONLY render their blur effect when placed over a textured background, a 3D render, or a video. On flat `--white` sections, use solid white cards with `border: 1px solid var(--border)` and `border-radius: 20px`. Glass cards are valid ONLY in the hero section (over the 3D render video). Everywhere else: solid white cards.

**Critical rule for 3D renders:** Renders are always positioned as background layers (`position: absolute`, `z-index: 0`). Glass cards sit above them (`z-index: 1`). Never place a render inside a card container.

**21st.dev components:** Glass card components are imported from 21st.dev. Do not generate custom glassmorphism CSS — use the imported component directly.

### Buttons

```css
/* Primary */
.btn-primary {
  background: var(--brand-blue);
  color: var(--near-black);
  border: 1px solid var(--brand-blue);
  border-radius: 100px; /* PILL — non-negotiable */
  padding: 13px 28px;
  font-weight: 500;
  font-size: 14px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
/* Hover: background lightens to --sky */

/* Ghost */
.btn-ghost {
  background: transparent;
  color: var(--ink-muted);
  border: 1px solid var(--border);
  border-radius: 100px;
  padding: 13px 28px;
  font-weight: 400;
  font-size: 14px;
}
/* Hover: background becomes --pale-wash */
```

**All primary CTAs use the diagonal arrow: `↗`**

### Section Numbers

Every content section uses a two-digit number as an eyebrow label:
- Format: `font-family: mono`, `font-size: 11px`, `font-weight: 500`, `color: --brand-blue`, `letter-spacing: 1.5px`
- Displayed above section headlines
- Example: `01 — Who it's for`, `02 — How it works`, `03 — Get early access`

### Animation Rules (Framer Motion)

- **Entrance:** fade-up only — `y: 20 → 0`, `opacity: 0 → 1`
- **Duration:** 0.5s for content blocks, 0.3s for UI elements
- **Easing:** `[0.16, 1, 0.3, 1]` — expo out, fast in, soft landing. No bounce, no spring, no scale
- **Stagger:** 0.08s between sibling elements
- **Scroll trigger:** `useInView`, threshold 0.15
- **Hover:** opacity shifts only (`0.7 → 1.0`). Never scale or lift on static showcase elements
- **Reasoning chain expand/collapse:** height animation, 0.35s, ease-out
- **Agent flow diagram:** cards fade-up in sequence, staggered 0.1s top to bottom
- **Data ticker:** CSS `animation: scroll linear infinite` — not Framer Motion

### 3D Render / Video Integration

All hero and section visuals are pre-made assets dropped into named slots. Claude Code places them — never generates them.

| File name | Aspect ratio | Placement |
|---|---|---|
| `hero-render.mp4` | 16:9 or 16:10 | Hero — full bleed background, `object-fit: cover`, `z-index: 0` |
| `hero-render-mobile.mp4` | 1:1 | Mobile hero only |
| `cluster-1-render.webp` | 4:3 | Cluster 1 landing page |
| `cluster-2-render.webp` | 4:3 | Cluster 2 landing page |
| `cluster-4-render.webp` | 4:3 | Cluster 4 landing page |
| `cluster-5-render.webp` | 4:3 | Cluster 5 landing page |
| `footer-render.webp` | 16:5 | Footer background (optional) |

**Until a render is delivered:** section runs on typography and color alone. Never insert a grey placeholder rectangle. Never use stock photography. Never use Unsplash URLs.

---

## 04 — File & Folder Structure

Claude Code must use this exact structure. Never invent alternative locations.

```
/app
  layout.tsx                  ← root layout: font import, Clerk provider, global CSS
  page.tsx                    ← Homepage
  /for
    /homeowners/page.tsx      ← Cluster 1 landing
    /agents/page.tsx          ← Cluster 2 landing
    /developers/page.tsx      ← Cluster 4 landing
    /institutions/page.tsx    ← Cluster 5 landing
  /intelligence/page.tsx
  /pricing/page.tsx
  /community/page.tsx
  /early-access/page.tsx
  /contact/page.tsx
  /about/page.tsx
  /blog/page.tsx
  /api
    /agents/route.ts          ← all Claude API calls — server-side only
    /data/[source]/route.ts   ← paid data source calls, cached

/app (app subdomain — app.koano.com)
  /login/page.tsx
  /signup/page.tsx
  /onboarding/page.tsx
  /dashboard
    page.tsx                  ← cluster-aware dashboard root
    /property/[id]/page.tsx
    /portfolio/page.tsx
    /site/[id]/page.tsx
    /briefing/page.tsx
    /settings/page.tsx
    /reasoning/[id]/page.tsx

/components
  /ui                         ← design system primitives
    Button.tsx                ← pill buttons, primary + ghost variants
    GlassCard.tsx             ← imported from 21st.dev
    SectionNumber.tsx         ← "01 —" eyebrow label component
    VerdictCard.tsx           ← buy/sell/hold/wait output card
    ReasoningChain.tsx        ← expandable full reasoning chain
    AgentFlowDiagram.tsx      ← the vertical timeline agent map
    DataTicker.tsx            ← scrolling source name ticker
  /marketing
    Nav.tsx
    Footer.tsx
    HeroSection.tsx
    ClustersSection.tsx
    PromiseSection.tsx
    AgentsSection.tsx
    EarlyAccessSection.tsx
  /dashboard
    Sidebar.tsx
    ClusterBadge.tsx
    PropertyView.tsx
    PortfolioView.tsx

/lib
  /agents
    market-timing.ts
    infrastructure.ts
    demand-sentiment.ts
    risk-volatility.ts
    regulatory-policy.ts
    synthesis.ts
  /supabase
    client.ts
    server.ts
  /stripe
    checkout.ts

/styles
  globals.css                 ← all CSS variables (full color palette above)

/public
  /renders                    ← hero-render.mp4, cluster renders, etc.
```

---

## 05 — Site Architecture

### Marketing Site (koano.com)

```
/                           Homepage
/for/homeowners             Cluster 1 landing page
/for/agents                 Cluster 2 landing page
/for/developers             Cluster 4 landing page
/for/institutions           Cluster 5 landing page
/intelligence               How it works — Russian doll architecture
/pricing                    All four tiers
/community                  Cluster 0 partnership program
/data                       Data pipeline transparency
/about                      Founding story, mission, team
/blog                       KOANO Index, thought leadership
/early-access               Waitlist / email capture
/contact                    Enterprise inquiry form
```

### Application (app.koano.com)

```
/login
/signup
/onboarding                 Cluster selection
/dashboard                  Context-aware per cluster
/dashboard/property/[id]
/dashboard/portfolio
/dashboard/site/[id]
/dashboard/briefing
/dashboard/settings
/dashboard/reasoning/[id]   Full reasoning chain for a verdict
```

---

## 06 — Homepage Wireframe (locked section order)

Build the homepage in this exact section order. Do not reorder, add, or remove sections.

### Section 1 — NAV
- Background: `--white`, `border-bottom: 1px solid var(--border-light)`
- On scroll past hero: `backdrop-filter: blur(12px)`, `background: rgba(255,255,255,0.85)`
- Left: KOANO logo (all caps, 15px, font-weight 500, `--near-black`, letter-spacing 2px)
- Center: `How it works` · `For homeowners` · `For professionals` · `For institutions` · `Pricing` (13px, `--ink-muted`, no underline, hover: `--ink-primary`)
- Right: `[Sign in]` (ghost pill) · `[Get early access ↗]` (primary pill)
- Mobile: hamburger right, full-screen overlay menu

### Section 2 — HERO
- Full viewport height (100vh)
- `hero-render.mp4` as full-bleed background: `position: absolute`, `inset: 0`, `z-index: 0`, `object-fit: cover`
- All text and CTAs sit above the render at `z-index: 1`
- Layout: left-aligned text block, vertically centered in the viewport
- Content top to bottom:
  1. Eyebrow tag: `Real estate reasoning engine` — 11px mono, `--brand-blue`, letter-spacing 1.5px
  2. Headline (2 lines): `Real estate has always had data. / It's never had a brain.` — 64–80px, weight 700, white
  3. Subhead: `KOANO deploys five specialist AI agents...` — 18px, weight 400, white, opacity 0.85
  4. CTA row: `[Get early access ↗]` (primary) · `[See how it works]` (ghost, white border variant)
  5. Stats row: `50+` Data sources · `5` Specialist agents · `6–18mo` Signal advantage — 13px mono, white, separated by `·`
- Until hero-render.mp4 is delivered: background is `--near-black`, text remains white

### Section 3 — CLUSTERS
- Background: `--white`
- Section number: `01` in `--brand-blue`
- Headline: `The same engine. Four different altitudes.`
- Four cards in a row (desktop), 2×2 on tablet, 1 column on mobile
- Card style: white background, `border: 1px solid var(--border)`, `border-radius: 20px`, padding 28px
- Each card contains: cluster name (H3, `--ink-primary`) · promise copy (body, `--ink-secondary`) · price chip (pill, `--sky` bg, `--brand-blue` text, 11px mono)
- Card hover: background shifts to `--pale-wash`, no lift, no shadow

### Section 4 — PROMISE
- Background: `--white`
- Full-width, centered layout
- Quote text: `"The same intelligence that helps a REIT make a $50M acquisition also tells a renter in Crown Heights if their building is safe."` — 32–40px, weight 500, `--ink-primary`, centered, max-width 800px, line-height 1.4
- No background color change. No dark treatment. Typography carries it.

### Section 5 — AGENTS (the Russian doll flow)
- Background: `--white` with a subtle grid overlay (thin `--border-light` lines, like the screenshot reference)
- Section number: `02` in `--brand-blue`
- Headline: `Five agents. One verdict. Every step auditable.`
- Layout: vertical center line + alternating cards, exactly matching the screenshot structure
  - Center vertical line: 1px, `--brand-blue`, runs full height of section
  - Each agent is a dot on the line (outlined circle, `--brand-blue` stroke, white fill, 10px diameter) connected to a card
  - Cards alternate: odd agents left of line, even agents right of line
  - Card style: white background, `border: 1px solid var(--border)`, `border-radius: 20px`, padding 24px, max-width 380px
  - Each card contains:
    - Section number in `--brand-blue` (01 through 05)
    - Agent name as H3 (`--ink-primary`)
    - One-line description of what the agent does (`--ink-secondary`, 15px)
    - Pill chip at bottom: what this agent outputs — `--sky` background, `--brand-blue` text, 11px mono, uppercase, letter-spacing 0.08em
  - Five agents in order: Market timing · Infrastructure pipeline · Demand sentiment · Risk & volatility · Regulatory & policy
  - After agent 05: line continues to a synthesis node (larger dot, filled `--brand-blue`, 14px diameter) labeled `Synthesis agent`
  - Below synthesis: VERDICT card — centered, not alternating — white card with `border: 1px solid var(--brand-blue)`, contains verdict label, confidence score, signal window, and `View full reasoning chain →` link in `--mid-blue`
- Entrance animation: cards fade-up in sequence, staggered 0.1s top to bottom

### Section 6 — DATA TICKER
- Background: `--pale-wash`
- Label: `50+ data sources powering every verdict` — centered, 13px, `--ink-muted`
- Scrolling horizontal ticker of data source names: Census · Shovels.ai · Placer.ai · First Street · FBI UCR · ATTOM · AirDNA · Zoneomics · Redfin · FHFA · FEMA · Walk Score · CoStar · Regrid · HouseCanary...
- Source names: 12px mono, `--ink-faint`, separated by `·`
- CSS scroll animation, infinite loop, no pause on hover

### Section 7 — EARLY ACCESS CTA
- Background: `--white`
- Section number: `03` in `--brand-blue`
- Headline: [COPY TBD — early access section headline]
- Subhead: [COPY TBD — one line on what early access means]
- Email input field + `[Join waitlist ↗]` primary button
- Input style: `border: 1px solid var(--border)`, `border-radius: 100px`, padding 13px 20px, 16px, `--ink-primary`

### Section 8 — FOOTER
- Background: `--white`
- `border-top: 1px solid var(--border)`
- Left: KOANO logo + `© 2026 KOANO Inc. All rights reserved.` in `--ink-faint`
- Right: two columns of links in `--ink-muted`, hover: `--brand-blue`
  - Column 1: How it works · Pricing · Community · Data
  - Column 2: For homeowners · For agents · For developers · For institutions

---

## 07 — Navigation (App)

Left sidebar (240px wide, `--pale-wash` background, `border-right: 1px solid var(--border)`):
- KOANO logo top
- Cluster badge showing current cluster with switch option
- Navigation items contextual to cluster (see Section 08)
- User avatar + account at bottom

---

## 08 — Cluster Architecture

### The four product clusters

KOANO serves four clusters. The same codebase, the same intelligence engine. Context-aware rendering means the platform looks and behaves differently per cluster. Every component that renders cluster-specific content must check `user.cluster` before rendering.

| Cluster | Users | Price | Cluster ID |
|---|---|---|---|
| 1 — Property intelligence | Homeowners, landlords, house flippers | $19–49/mo | `cluster_1` |
| 2 — Transaction intelligence | Agents, brokers, mortgage officers | $149–299/mo | `cluster_2` |
| 4 — Development intelligence | CRE brokers, developers, contractors | $499–1,499/mo | `cluster_4` |
| 5 — Portfolio intelligence | CEOs, CFOs, CIOs, REITs, PE firms | $1,499–4,999/mo | `cluster_5` |

*(Cluster 3 — Due diligence — is reserved for future roadmap. Do not build it.)*

### Cluster selection (onboarding)

After signup, user reaches `/onboarding`. Four large cards — user picks one. Stored in `user.cluster` in Supabase.

```
Headline: [COPY TBD — welcome / who are you screen headline]
Subhead: [COPY TBD — one line explaining they can change later]

Card 1: "Property intelligence" — For homeowners, landlords, and investors.
Card 2: "Transaction intelligence" — For agents, brokers, and mortgage officers.
Card 3: "Development intelligence" — For developers, CRE brokers, and contractors.
Card 4: "Portfolio intelligence" — For institutional investors, REITs, and C-suite executives.
```

### Cluster 1 — Property Intelligence dashboard
**Sidebar nav:** My property · Neighborhood signals · Forecasts · Alerts · Ask KOANO

**Primary view:** Single property dashboard
- AVM with velocity indicator (accelerating / decelerating)
- Equity position and 12-month projection with confidence interval
- Neighborhood signal feed — permits, zoning, infrastructure within 2 miles
- KOANO verdict: Hold / prepare to sell / sell now with timing window
- Scenario modeling: "What if [infrastructure project] completes?"
- Alert feed: push notifications for significant nearby signals

**Landlord / flipper additions ($49/mo):**
- Cap rate and NOI calculations
- ARV modeling with rehab cost benchmarks by zip
- Vacancy rate trends and rent momentum
- Cash-on-cash return projections

### Cluster 2 — Transaction Intelligence dashboard
**Sidebar nav:** Market dashboard · Client tools · Lead generation · Reports · Ask KOANO

**Primary view:** Multi-market velocity dashboard
- Velocity heatmap — fastest-changing neighborhoods
- Absorption rate by micro-market
- DOM trends — where days-on-market is compressing
- Price reduction pattern detection

**Client tools:**
- CMA builder with KOANO early-signal overlay
- Pricing recommendation engine
- Client-ready PDF report generator
- Neighborhood narrative generator (AI-written)

### Cluster 4 — Development Intelligence dashboard
**Sidebar nav:** Site comparison · Pro forma · Entitlement risk · Pipeline intelligence · Ask KOANO

**Primary view:** Multi-site comparison engine
- KOANO composite score ranked by risk-adjusted opportunity
- Zoning and entitlement risk breakdown per site
- BSA approval rate history by submarket
- Community board sentiment — predicted opposition level
- Permitting timeline benchmark by jurisdiction

**Pro forma intelligence:**
- Land cost benchmarks by micro-market and zoning class
- Construction cost per SF benchmarks
- Absorption projection
- Exit cap rate estimate
- IRR projection with sensitivity table

### Cluster 5 — Portfolio Intelligence dashboard
**Sidebar nav:** Portfolio overview · Morning briefing · Deal pipeline · Risk monitor · API · Ask KOANO

**Primary view:** Portfolio command center
- Real-time NAV tracking across entire portfolio
- FFO and NOI monitoring by asset, market, asset class
- Portfolio risk score
- Hold / sell / reposition analysis per asset

**Monday morning briefing:**
- What changed overnight in the portfolio
- What is at risk and why
- What opportunities are emerging
- Regulatory changes affecting held assets

**Enterprise security (Cluster 5 only):**
- Fully isolated data environment
- SOC 2 Type II compliant
- Role-based access controls with SSO
- Complete audit log
- Air-gapped portfolio data — cannot train KOANO's models

---

## 09 — Intelligence Architecture

### The five specialist agents

| Agent | File | Key inputs | Key outputs |
|---|---|---|---|
| Market timing | `market-timing.ts` | Pricing velocity, DOM trends, absorption rates | timing verdict, confidence score, signal window |
| Infrastructure pipeline | `infrastructure.ts` | DOT data, permits (Shovels.ai), zoning variances, municipal bonds | infrastructure impact score, price effect, timeline |
| Demand sentiment | `demand-sentiment.ts` | Foot traffic (Placer.ai), search trends, review velocity | demand momentum score, gentrification stage (1–7) |
| Risk & volatility | `risk-volatility.ts` | Climate risk (First Street), crime (FBI UCR), STR saturation | risk score (1–100), risk breakdown, risk-adjusted return |
| Regulatory & policy | `regulatory-policy.ts` | Zoning (Zoneomics), city council decisions, FEMA, opportunity zones | regulatory risk score, entitlement timeline |

### The synthesis agent

```typescript
// /lib/agents/synthesis.ts
// Receives all 5 structured outputs simultaneously
// Returns: unified verdict + confidence + reasoning chain + minority signals
```

**Arbitration logic:**
1. Consensus amplification — 4+ agents agreeing raises confidence exponentially
2. Conflict surfacing — disagreements appear in `minority_signals`, never hidden
3. Domain weighting — query type adjusts agent weights
4. Recency bias — more recent signals weighted higher

### Verdict output schema

```typescript
interface KoanoVerdict {
  verdict: 'buy' | 'sell' | 'hold' | 'wait' | 'drop';
  confidence: number;           // 0–100
  signal_window_months: number;
  headline: string;
  reasoning_chain: ReasoningStep[];
  minority_signals: MinoritySignal[];
  top_data_sources: string[];
  irr_estimate?: number;        // Clusters 4 & 5 only
  risk_score: number;           // 0–100
  generated_at: string;
}
```

### Rendering the reasoning chain

Every verdict card:
1. Headline verdict — always visible
2. Confidence score + signal window — always visible
3. `View full reasoning chain →` — collapsed by default, expands on click
4. Inside: each agent's conclusion → synthesis arbitration → final verdict
5. Minority signals: `What KOANO's agents disagreed on` — shown when present

**This transparency is not optional. It is KOANO's primary trust-building mechanism.**

---

## 10 — Approved Copy (verbatim — do not alter)

### Global
- **Brand name:** KOANO (always all caps)
- **Category:** The real estate reasoning engine
- **Tagline:** The real estate reasoning engine

### Homepage
**Hero tag:** `Real estate reasoning engine`

**Hero headline:**
```
Real estate has always had data.
It's never had a brain.
```

**Hero subhead:**
```
KOANO deploys five specialist AI agents that ingest 50+ data sources,
reason autonomously, and deliver a single verdict — with every step
of the thinking visible and auditable.
```

**Hero CTAs:** `Get early access ↗` (primary) · `See how it works` (ghost)

**Hero stats:** `50+` Data sources · `5` Specialist agents · `6–18mo` Signal advantage

**Clusters section header:** `The same engine. Four different altitudes.`

**Cluster 1 card:** Property intelligence · `Know what's happening to your property's value before your neighbors do — and know what to do about it.` · From $19 / month

**Cluster 2 card:** Transaction intelligence · `Find opportunities before they hit the MLS. Make data-backed recommendations that close deals.` · From $149 / month

**Cluster 4 card:** Development intelligence · `Find your best site. Model your deal. Understand your entitlement risk. Before anyone else does.` · From $499 / month

**Cluster 5 card:** Portfolio intelligence · `Monitor everything. Miss nothing. Make billion-dollar decisions with the intelligence infrastructure that was previously only available to the world's largest financial institutions.` · From $1,499 / month

**Promise section quote:**
```
"The same intelligence that helps a REIT make a $50M acquisition
also tells a renter in Crown Heights if their building is safe."
```

**Agent section header:** `Five agents. One verdict. Every step auditable.`

**Data ticker label:** `50+ data sources powering every verdict`

**Footer copyright:** `© 2026 KOANO Inc. All rights reserved.`

### Pricing (locked)

| Cluster | Monthly range |
|---|---|
| Property intelligence | $19–$49 /month |
| Transaction intelligence | $149–$299 /month |
| Development intelligence | $499–$1,499 /month |
| Portfolio intelligence | $1,499–$4,999 /month + custom |

### Community page (locked)

```
KOANO is not positioned as a tool for gentrification. The same engine
that serves institutional investors is made available — free of charge,
through nonprofit partnerships — to tenant advocacy organizations and
community groups. This is not charity. It is the founding principle
that separates KOANO from every other proptech company in existence.

KOANO partners with organizations like IMPACCT Brooklyn (serving
Central Brooklyn since 1964) to provide community data feeds: building
violation histories, landlord harassment records, displacement risk
indicators, and affordable housing lottery availability. These partners
receive a curated read-only intelligence feed at no cost.

Cluster 0 is KOANO's conscience. It earns its weight in trust, press,
nonprofit partnerships, and moral authority — not in revenue.
```

---

## 11 — Copy Placeholders

Render these visibly as italic `--ink-faint` text inside a `--pale-wash` dashed-border container. Never invent copy to fill them.

```
[COPY TBD — cluster landing page H1: Cluster 1]
[COPY TBD — cluster landing page H1: Cluster 2]
[COPY TBD — cluster landing page H1: Cluster 4]
[COPY TBD — cluster landing page H1: Cluster 5]
[COPY TBD — /intelligence page headline]
[COPY TBD — /pricing page headline and framing]
[COPY TBD — /about page: founding story and team]
[COPY TBD — /community page: partner CTA]
[COPY TBD — onboarding cluster selection: welcome headline]
[COPY TBD — onboarding cluster selection: subhead]
[COPY TBD — dashboard empty state: Cluster 1 first use]
[COPY TBD — dashboard empty state: Cluster 2 first use]
[COPY TBD — dashboard empty state: Cluster 4 first use]
[COPY TBD — dashboard empty state: Cluster 5 first use]
[COPY TBD — pricing FAQ answers]
[COPY TBD — testimonials / social proof]
[COPY TBD — early access section headline]
[COPY TBD — early access section subhead]
[COPY TBD — blog / KOANO Index content]
```

---

## 12 — Non-Negotiable Rules

### Visual
- ❌ NO dark section backgrounds. Ever. All sections are white or pale-wash.
- ❌ NO grey placeholder boxes. Typography carries sections until renders arrive.
- ❌ NO stock photography. No Unsplash URLs.
- ❌ NO boxed images. Renders are full-bleed backgrounds or floating elements.
- ❌ NO purple. Blues, navies, whites only.
- ❌ NO Inter or Roboto. Neue Montreal only.
- ❌ NO generic SaaS dashboard aesthetic.
- ❌ NO gradients except subtle pale-wash → white section transitions (max 5% opacity shift).
- ❌ NO drop shadows except those defined in the glass card spec.
- ❌ NO glass cards on flat white backgrounds — glass is hero-only.

### Copy
- ❌ NEVER invent headlines, taglines, or positioning language.
- ❌ NEVER fill a [COPY TBD] placeholder with invented text.
- ❌ NEVER add sections not in this document.
- ❌ NEVER alter approved copy in Section 10. Use it verbatim.

### Interactive
- ❌ If an element has hover effects or cursor:pointer, it MUST link somewhere real.
- ❌ Static showcase elements: no hover lift, no pointer cursor.
- ❌ Any demo data must be labeled "Demo" visibly in the UI.

### Architecture
- ❌ NEVER render Cluster 5 portfolio data in Cluster 1–4 contexts.
- ❌ NEVER build Cluster 3 — future roadmap only.
- ❌ NEVER use `any` TypeScript type for verdict or agent output schemas.
- ❌ NEVER store Claude API keys client-side. All AI calls via Next.js API routes.

---

## 13 — Build Sequence

### Phase 1 — Foundation (Week 1–2)
1. Initialize Next.js 14 with Tailwind, Framer Motion, Clerk
2. Set up Supabase schema: `users`, `properties`, `verdicts`, `clusters`, `alerts`
3. Add Neue Montreal font via Fontshare
4. Build global design system: CSS variables, Button, GlassCard (from 21st.dev), SectionNumber, Nav, Footer
5. Deploy to Vercel, connect domain, confirm SSL
6. Set up Stripe products for all four clusters

### Phase 2 — Marketing site (Week 3–4)
1. Homepage — all 8 sections in the exact order specified in Section 06
2. `/pricing` with Stripe checkout
3. `/early-access` waitlist with Supabase email capture
4. `/community` page

### Phase 3 — Cluster landing pages (Week 5)
1. `/for/homeowners`
2. `/for/agents`
3. `/for/developers`
4. `/for/institutions`

### Phase 4 — Intelligence + 3D (Week 6)
1. `/intelligence` page with scroll-driven agent architecture animation
2. Spline 3D city map hero embed
3. Three.js agent network visualization
4. Mapbox interactive signal map (style: `mapbox://styles/mapbox/light-v11`, signal dots in `--signal-positive/warning/negative`, default center NYC `-74.006, 40.7128`, zoom 12)

### Phase 5 — App MVP: Cluster 1 (Week 7–8)
1. Clerk auth (login, signup)
2. Onboarding cluster selection screen
3. Cluster 1 dashboard
4. First KOANO verdict (Market Timing + Infrastructure agents)
5. ReasoningChain UI component
6. Push alerts via Supabase Realtime

### Phase 6 — App expansion + launch prep (Week 9–10)
1. Cluster 2 dashboard
2. Cluster 4 site comparison interface
3. Cluster 5 portfolio command center (stub)
4. PostHog analytics
5. Lighthouse target: 90+
6. Beta user onboarding

---

## 14 — Data Pipeline

### Free sources (GitHub Actions cron → Supabase)
US Census ACS · BLS · Redfin Data Center · Freddie Mac · FHFA · FBI UCR · EPA/FEMA · NOAA · IRS Opportunity Zones · HUD USER · SEC EDGAR · World Bank · OECD · OpenStreetMap · USGS · NYC Open Data · LA GeoHub · Chicago Data Portal · OpenFEMA · Google Trends · Reddit API · Municipode · HUD Fair Housing · CDC PLACES · MSRB EMMA

### Paid sources (on-demand, cached 24h)
ATTOM · Shovels.ai · Zoneomics · First Street Foundation · Placer.ai · SafeGraph · Walk Score · Yelp Fusion · Google Places · AirDNA · BatchData · SpotCrime · GreatSchools · Regrid · Mapbox · HouseCanary · CoreLogic/Trestle · Reonomy · CoStar/LoopNet · MSCI Real Capital Analytics (Cluster 5, Phase 4)

### MVP minimum (Phase 5)
ATTOM · Shovels.ai · First Street Foundation (free tier) · US Census API · Redfin Data Center · OpenStreetMap · City Open Data portals · Claude API · Mapbox (free tier)

---

## 15 — Security

### All clusters
- Row Level Security on all Supabase tables
- All Claude API calls server-side only (Next.js API routes)
- API keys in environment variables only
- Stripe webhook signature verification

### Cluster 5 only
- Isolated Supabase schema per enterprise client
- Cluster 5 data never appears in Cluster 1–4 query contexts
- Air-gapped data — cannot train KOANO's models
- SOC 2 Type II (Phase 3 of business roadmap)
- Role-based access with SSO (Clerk Enterprise)
- Full audit log: every query, verdict, API call
- Multi-year contract billing via Stripe custom pricing

---

## 16 — Environment Variables

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=
ATTOM_API_KEY=
SHOVELS_API_KEY=
FIRST_STREET_API_KEY=
PLACER_API_KEY=
WALKSCORE_API_KEY=
YELP_API_KEY=
GOOGLE_PLACES_API_KEY=
AIRDNA_API_KEY=
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=
NEXT_PUBLIC_APP_URL=https://app.koano.com
NEXT_PUBLIC_MARKETING_URL=https://koano.com
```

---

*KOANO CLAUDE.md v4.0 | Confidential & Proprietary | 2026*
*All rights reserved. Do not share outside the KOANO development team.*
