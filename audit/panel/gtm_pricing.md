# Panel 6.8: Go-to-Market and Pricing Strategist

Persona: built vertical SaaS sales motions into commercial real estate (data, underwriting and broker tooling). Judged against Reonomy, TestFit, Zoneomics, Crexi Intelligence, Cloud CMA, RPR and Diald, not against other early-stage startups.

Scope read: `src/components/marketing/PricingContent.tsx`, `lib/koano-guard.ts`, `lib/stripe/client.ts`, `src/app/api/stripe/{checkout,webhook}/route.ts`, `src/components/dashboard/{UpgradeScreen,UpgradeProvider,clusters}.tsx|ts`, `lib/documents/{registry,guard,implemented}.ts`, `lib/documents/render/{pdf.tsx,docx.ts}`, `lib/documents/builders/pricing-sheet.ts`, `src/components/marketing/ClusterLanding.tsx`, `src/app/for/*/page.tsx`, `KOANO_COPY.md`, `CLAUDE.md`, the recorded fixture `scripts/fixtures/nyc-175-3rd-st.json`, screenshots `shots/desktop_pricing.png` and `shots/mobile_pricing.png`, `demo-kit/design-upload-2/documents/pages/cma-p1.png`, and `/Users/victor/Downloads/koano-pricing-recommendation-sheet-3020497501.pdf` (it is a KOANO-generated Pricing Recommendation Sheet, not a pricing strategy document; it turned out to be evidence for a trust problem, below).

---

## 0. The verdict in one paragraph

The ladder is priced like four products and built like one product with a document lock. Today KOANO cannot actually take money at scale: a global circuit breaker caps the entire company at 50 metered model calls per day (`lib/koano-guard.ts:70-73`), the pricing page promises free documents that the document guard refuses (`PricingContent.tsx:208-209` vs `lib/documents/guard.ts:71-83`), the "Contact sales" buttons go to `/signup` (`PricingContent.tsx:422-428, 595-600`), the Portfolio tier is simultaneously "not a product you can buy today" (`PricingContent.tsx:505`) and a $1,499 self-serve Stripe checkout (`UpgradeScreen.tsx:21-26`, `lib/stripe/client.ts:24`), and the white-labeled CMA prints "KOANO" in its letterhead (`lib/documents/render/pdf.tsx:262`, `docx.ts:66,75`, visible in `cma-p1.png`), which violates a locked decision. Fix those first. Then: make Development the wedge, sell it per seat with pooled monthly screen credits plus a pay-per-memo entry point, take Portfolio off self-serve and sell it as an annual per-asset contract with a platform minimum, cut Transaction to a price that survives contact with free RPR and $49 Cloud CMA, and build the share loop around a verifiable Site Screening Memo and the Monday digest.

---

## 1. Is the ladder right?

### 1.1 What is actually implemented (grounded)

| Layer | Implemented | State |
|---|---|---|
| Stripe prices | One monthly price per tier: community $19, transaction $149, development $499, portfolio $1,499 (`lib/stripe/client.ts:20-25`). No annual, no seat quantity (`quantity: 1`, `checkout/route.ts:73`), no promo codes, no tax, no billing portal (grep for `billingPortal`, `allow_promotion_codes`, `automatic_tax`, `seat` returns nothing). | PARTIAL |
| Marketing price ranges | $19 to $49, $149 to $299, $499 to $1,499, $1,499 to $4,999 + custom (`PricingContent.tsx:41,59,77,97`; `/for/*` pages). None of the upper ends exist in Stripe. The $49 Community investment tier does not exist anywhere in code. | Copy only |
| Free tier | 3 verdict runs + 3 "content" generations, lifetime (`koano-guard.ts:38`). "Content" is the narrative and briefing routes (`api/narrative/route.ts:48`, `api/briefing/route.ts:69`), not documents. Free users generate zero documents (`lib/documents/guard.ts:71-83`). | EXISTS, but mis-described |
| Paid limits | Rolling 24h: 20 / 50 / 150 / 500 verdicts and the same for content (`koano-guard.ts:39-42`). | EXISTS |
| Global breaker | 50 metered attempts per rolling 24h across all users and kinds, default (`koano-guard.ts:70-73, 134-156`). Error text: "KOANO's demo capacity for the day is used up." | EXISTS, and it is the binding constraint on revenue |
| Document cap | 30 documents per user per rolling 24h, every tier including Portfolio (`lib/documents/guard.ts:35-38`). | EXISTS |
| Monitoring caps | 0 / 3 / 20 / 50 / 500 (`koano-guard.ts:49-55`), non-destructive on downgrade. | EXISTS |
| Doc tiering | Monotonic `homeTier` lock: a document is available to its home tier and richer (`registry.ts:5-8`, `guard.ts:31-33`). IC memo and Portfolio Risk Report are Portfolio-only; Site Screening Memo is Development and up. | EXISTS |
| Approval gate | Retired; `requireApproved` is an allow-all shim (`koano-guard.ts:11-13, 99-104`). | EXISTS (retired) |
| Teams, orgs, seats | No org or seat model in `supabase/*.sql` (grep for `seats`, `organization`, `org_id` returns nothing). Every account is one person. | MISSING |

### 1.2 Problems with the ladder as designed

1. **It is a persona ladder pretending to be a value ladder.** Four audiences with different budgets, buying processes and competitors are stacked on one monotonic axis. A developer has no use for the Community packet; an agent has no use for the IC memo. The `homeTier` monotonic lock (`registry.ts:5-8`) means a $1,499 Portfolio buyer is "upgraded" into tax-appeal packets they will never open, while a two-person development shop that needs one IC memo for a lender must pay 3x. Ladders work when each rung is the same buyer needing more; here each rung is a different buyer.
2. **Usage limits are daily, generous, and uneconomic at the ceiling.** Rolling-24h limits (`koano-guard.ts:39-42`) let a Development subscriber run 150 verdicts a day, roughly 4,500 a month. At my estimated ~$0.20 per verdict (section 6), that is ~$900 of model cost against $499 of revenue. A Portfolio user at the cap costs ~$3,000 a month against $1,499. Nobody will hit it, but a buyer does not perceive daily caps as value either. Professionals think in deals per month.
3. **Portfolio cannot be both "Contact sales" and a $1,499 checkout.** The pricing card says "Contact sales" and "Custom billing" (`PricingContent.tsx:87, 427`), the FAQ says the enterprise tier "is a description of what we would build with you, not a product you can buy today" (`PricingContent.tsx:505`), and then the upgrade modal sells it self-serve at $1,499 (`UpgradeScreen.tsx:21-26`). Selling institutional software by credit card at a price that anchors the enterprise contract low is the single most expensive pricing mistake in the file: every future $40k annual quote gets compared to "$1,499 on your website."
4. **Transaction at $149 is priced above the market it is weakest in.** Agents get RPR free with NAR dues ([RISMedia](https://ace.rismedia.com/2019/06/26/rpr-your-no-cost-priceless-member-benefit/)), Cloud CMA is $49 a month or $499 a year ([Capterra](https://www.capterra.com/p/173777/Cloud-CMA/pricing/)), both with MLS beds, baths and days on market. KOANO's CMA explicitly lacks beds, baths, condition, days on market and active listings (`src/app/for/agents/page.tsx:44`). At 3x Cloud CMA with less data, Transaction will not convert outside of a novelty cohort.
5. **The Community $19/$49 split is fictional.** Only $19 exists in Stripe; the FAQ says "Both tiers are free right now, so the difference is theoretical" (`PricingContent.tsx:500`) on a page whose H1 is "Start free. Upgrade when you hit the limit." That contradiction is on the live page.
6. **No annual plans, no seats, no team.** Every comparable CRE tool sells annual with a discount: Reonomy's official page advertises monthly or annual "saving you 30%" and seat-based team pricing ([reonomy.com/pricing](https://reonomy.com/pricing)); Zoneomics shows annual at 20% off ([zoneomics.com/pricing](https://www.zoneomics.com/pricing)); Crexi Intelligence lists $249 monthly or $2,388 annual ([TrustRadius](https://www.trustradius.com/products/crexi/pricing)). Without annual you have no cash up front, no churn floor, and no reason for a firm to put KOANO in a budget line.

### 1.3 Should Portfolio be enterprise, annual, seat, usage, per-property or per-document?

Answer, by mechanism:

- **Enterprise and annual: yes, both, mandatory.** Institutions buy through procurement, need an MSA, security review and an invoice. Self-serve card checkout is wrong for this buyer.
- **Per-property (per monitored asset): yes, as the primary meter.** The value Portfolio sells is "watch the book, tell me Monday what moved." That scales with assets, not with people. It also maps to the real cost driver (archive capture and diffing per BBL, `CLAUDE.md` §07A/07B) and gives the buyer a number their asset manager already uses. The cap of 500 (`koano-guard.ts:54`) becomes a priced band rather than a ceiling.
- **Seat-based: secondary, as a floor.** Charge for named analyst seats only to stop one login being shared across a 40-person shop, and to gate SSO later. Do not make seats the main meter; institutional buyers resent paying per head for a monitoring product.
- **Usage (verdicts): pooled annual credits, with overage.** IC memos and fresh verdicts are bursty around deal flow. Pool them annually.
- **Per-document: only as overage and as the entry SKU below the subscription.** Diald's public anchor is $250 per memo on a pay-as-you-go basis ([Pulse 2.0 interview](https://pulse2.com/diald-ai-profile-samantha-um-interview/)). That tells you the market will pay per artifact. It also tells you the IC memo with four placeholder sections (`registry.ts:315-318`: financials, business plan, exit, key terms are placeholders) is not yet worth $250; the screening memo, which is complete and all-live, is the better per-document product.

---

## 2. Recommended price architecture (numbers)

Principle: price the job, not the persona. Three paid products, one self-serve entry point, one enterprise contract, one data line. All monthly meters become monthly or annual pooled credits; the rolling-24h caps stay only as abuse guards set well above plan entitlements.

### 2.1 The architecture

| SKU | Who | Price | Includes | Meter and overage |
|---|---|---|---|---|
| **Free** | Anyone | $0, no card | 3 verdicts lifetime, **1 full Site Screening Memo or 1 Property Intelligence Report** (KOANO-attributed, with a public verification link), 1 watched property for 30 days | Converts on second document |
| **Single Memo** | Developer or broker evaluating one site, no subscription | **$79 per Site Screening Memo**, $199 per Three-Site Comparison Brief | All-live NYC memo, PDF, provenance appendix | Credited 100% toward the first month of Development Pro if they subscribe within 30 days |
| **Community** | Homeowners, renters, neighbors | **$12/month or $99/year**; **Tax Appeal Packet $39 one-off**, seasonal | 3 watched buildings, Violation & Ownership Record, Permit History, Property Intelligence Report | Packet sold Jan to mid-March around the NYC Tax Commission deadlines (2026/27 deadlines were March 2 for classes 2 to 4 and March 16 for class 1, [NYC Tax Commission forms page](https://www.nyc.gov/site/taxcommission/forms/forms.page)) |
| **Agent** (was Transaction) | Residential agents, mortgage officers | **$49/month or $468/year per seat**; brokerage office plan **$29/seat/month, 10-seat minimum, annual** | 25 verdicts/month, unlimited CMA, Pricing Sheet, Neighborhood Report, Net Sheet, 20 watched properties. White-label CMA with zero KOANO branding | Additional verdicts $3 each. Raise to $99 when an MLS feed is live (BYO credentials) |
| **Development Pro** (the wedge) | Developers, land and investment-sales brokers, land-use attorneys, architects | **$399/month or $3,990/year per seat** | 40 site screens/month pooled, Entitlement Risk Memo, Three-Site Comparison, 50 watched sites, Monday digest | **$15 per extra screen**; credits roll over one month |
| **Development Team** | Shops with 3 to 10 people | **$1,250/month (annual only), includes 5 seats**; extra seat $200 | 200 screens/month pooled, 250 watched sites, shared workspace, firm letterhead | $12 per extra screen |
| **Portfolio** (enterprise) | REITs, PE, lenders, family offices | **Annual contract. Platform fee $24,000/year** includes 250 monitored assets, 5 named seats, 100 IC memos/year, Monday briefing, Portfolio Risk Report | Assets beyond 250: **$60/asset/year** (tiering to $40 above 1,000). IC memos beyond 100: $120 each. Extra seats $2,400/year | **Paid 90-day pilot $7,500**, credited to year one. SSO, SOC 2 report, dedicated isolation as an enterprise add-on (+25%) once they exist (today they do not: `/for/institutions` NOT_BUILT_YET) |
| **Data and API** | Data providers, proptech platforms, lenders' systems | **Verdict API $4 per verdict at list**, volume to $1.50; coverage map and provenance included. Archive licensing (longitudinal NYC public-record time series) **from $50,000/year** | Per call | This is the line an acquirer will look at first |

### 2.2 Why these numbers

- **Development Pro at $399 per seat.** Anchors: Reonomy from $400/month annual or $500 monthly, seat-based ([reonomy.com/pricing](https://reonomy.com/pricing) via search summary; the fetched page lists plans without dollar figures, so treat the dollar amounts as reported, not directly verified); Zoneomics $61 to $279 a month for zoning search ([zoneomics.com/pricing](https://www.zoneomics.com/pricing), two page versions disagree); TestFit Site Solver reported at $15,000/year ([PricingSaaS](https://pricingsaas.com/companies/testfit/diffs/2026W33), third-party, unverified on vendor site); Crexi Intelligence $249/month ([TrustRadius](https://www.trustradius.com/products/crexi/pricing)). KOANO is a screening and entitlement reasoning layer, not a test-fit or a full data platform; $399 sits just under Reonomy and well under TestFit, and above a pure zoning lookup because it ships a verdict and a document. Dropping from $499 to $399 matters less than the annual option and pooled credits.
- **Single Memo at $79.** Diald's $250 per memo is the public pay-per-artifact anchor ([Pulse 2.0](https://pulse2.com/diald-ai-profile-samantha-um-interview/)). KOANO's screening memo is a screen, not an underwriting memo, so it should land at roughly a third of that. $79 is an impulse spend for a broker preparing a pitch, and five of them equal one month of Pro, which is the conversion argument.
- **Agent at $49.** Matches Cloud CMA's $49 monthly ([Capterra](https://www.capterra.com/p/173777/Cloud-CMA/pricing/)) while KOANO lacks MLS fields; the differentiation is reasoning, provenance and the HPI-adjusted band, not data breadth. Anything higher fights a free incumbent (RPR) with less data.
- **Community at $12.** PropertyShark's entry plans are reported at $49.95 to $59.95 a month for a professional audience ([Capterra](https://www.capterra.com/p/10048620/PropertyShark/), [support.propertyshark.com](https://support.propertyshark.com/hc/en-us/articles/360022470312-Understand-Your-Subscription-Benefits) for quotas). Regrid's Pro is $10/month or $100/year ([support.regrid.com](https://support.regrid.com/docs/plan-types-property-app)). A homeowner tool should sit near Regrid, and the money is in the seasonal $39 packet, not the subscription.
- **Portfolio at $24k platform + $60/asset.** Third-party estimates put Dealpath at $12k to $50k+ a year ([Spendbase](https://www.spendbase.co/?p=37238), estimate) and ARGUS Enterprise near $18k per seat per year ([apers.app](https://apers.app/compare/best-argus-alternatives), competitor-sourced estimate). A $24k entry sits inside a VP's discretionary approval at most funds; per-asset pricing lets a 1,000-asset book reach ~$69k without a renegotiation. Unverified anchors are labeled as such in Sources.

### 2.3 What to delete from the current pricing page

- The four price ranges (`PricingContent.tsx:41,59,77,97`) that no checkout honors.
- The $19/$49 FAQ (`PricingContent.tsx:497-501`), and the "Both tiers are free right now" sentence, which contradicts the H1.
- The internal cluster numbers in customer copy: the FAQ says "Cluster 1" and "Cluster 5" (`PricingContent.tsx:498, 503, 584, 607`) while the cards show C4 and C3 (`PricingContent.tsx:36-92`), and the upgrade modal shows a third numbering, 01/02/04/05 (`UpgradeScreen.tsx:149` reads `c.number`, `clusters.ts:34-70`). Three numbering systems on the path to payment.
- "Secure checkout by Stripe · test mode" (`UpgradeScreen.tsx:194`) and the missing dollar sign in "From 19 / month" (`clusters.ts:40,50,60,70`).

---

## 3. The wedge: one audience, one use case

### 3.1 Recommendation

**NYC small and mid-size infill developers, reached through the land and investment-sales brokers, land-use attorneys and architects who feed them sites. Use case: "Is this lot worth a second look?" A three-minute as-of-right and entitlement screen on a Brooklyn, Queens or Bronx lot, delivered as a Site Screening Memo the user can forward.**

### 3.2 The argument

1. **It is where the product is genuinely complete.** The Site Screening Memo is all-live for NYC with no representative block (`registry.ts:222-257`, "all-live, PDF only, no financial modelling"); the entitlement score is computed deterministically from PLUTO facts (`CLAUDE.md` §07, `lib/agents/entitlement.ts`); the verdict engine rolls up `live` for NYC. `CLAUDE.md` §08 itself calls Cluster 4 "the sharpest wedge and the deepest free-data slice." Every other cluster has a disclosed hole at its core (Agent: no MLS; Portfolio: placeholders in the IC memo and no private financials; Community: low willingness to pay).
2. **Frequency.** A developer or land broker looks at dozens of sites for every one they pursue. Screening is a weekly, even daily, job; IC memos are monthly at best. Frequency drives habit, sharing and expansion.
3. **The buyer is reachable and identifiable from KOANO's own data.** DOB job filings and DOF recorded sales (already wired: `nyc-dob-filings.ts`, `nyc-sales.ts`) name who is filing new buildings and who is buying development sites. KOANO can build its target list from the public record it already reads.
4. **Short sales cycle, owner-operator buyer.** A 3 to 20 person development shop buys on a principal's credit card after one good memo. No SOC 2, no procurement.
5. **It creates pull upward.** Developers need lenders; lenders become Portfolio buyers. Developers hire land-use attorneys and architects; those become Team seats. Brokers who send memos expose every recipient.

### 3.3 Why not the alternatives

| Alternative | Why not first |
|---|---|
| Institutions (Portfolio) | Brief names them primary, and they are the exit buyer's customer, but the product cannot pass their diligence yet: no SSO, SOC 2 or isolation (`/for/institutions` NOT_BUILT_YET), four placeholder sections in the IC memo (`registry.ts:315-318`), no NAV/NOI. Sales cycles of 6 to 12 months burn the runway that the archive moat needs to compound. Run 3 to 5 paid pilots in parallel, do not lead with them. |
| Agents (Transaction) | Free RPR and $49 Cloud CMA, both with MLS data KOANO lacks. The white-label rule also kills the agent share loop by design. Revisit when BYO MLS credentials ship. |
| Community | Lowest ARPU, seasonal, highest support load per dollar. Good for brand, civic credibility and SEO; wrong for the first 100 paying customers. |
| Lenders | Excellent second wedge (collateral monitoring is the Portfolio product at smaller scale), but credit committees want a track record; the calibration record (`verdict_outcomes`) is only months old. |
| Landlords and flippers | Excluded by locked decision; also the obvious misuse of the violation and ownership records. Make sure the Development wedge copy never drifts into "find distressed owners." |

---

## 4. Distribution channels, ranked

Ranked by impact on enterprise value (revenue plus what an acquirer pays for).

| Rank | Channel | Fit | Motion | Effort | Impact |
|---|---|---|---|---|---|
| 1 | **Land and investment-sales brokers, land-use attorneys, zoning consultants, architects (NYC)** | They screen sites for developers weekly and forward the output | Direct sales plus Team plans; each one exposes 10 to 50 developers | M | 9 |
| 2 | **Data marketplaces and data providers (Cotality, ATTOM, Regrid, Reonomy/Altus, CompStak)** | The exit thesis. Precedent: Gridics put its zoning data inside Cotality's distribution ([Mann Report](https://www.mannpublications.com/mannreport/2025/10/07/gridics-collaborates-with-cotality-to-deliver-property-level-zoning-data/)) | Partner: KOANO as the reasoning and provenance layer over their data; revenue share per verdict | L | 9 |
| 3 | **Lenders (construction, bridge, CDFI, community banks)** | Site screens at origination, monitoring of collateral | Paid pilots, per-asset Portfolio pricing | L | 8 |
| 4 | **API resale and embedding (deal management, proptech platforms)** | Verdict plus coverage map as a callable service | Self-serve API key, $4/verdict list | M | 7 |
| 5 | **Universities (NYU Schack, Columbia MSRED, Baruch, Pratt)** | Students become the analysts who request tools; faculty need case material | Classroom licenses at near cost; a published case on a real Brooklyn site | S | 5 |
| 6 | **Community boards and tenant organizations (Community tier)** | Land-use committees review the same filings KOANO reads | Free public CD-level weekly filing digest (KOANO-branded); org-sponsored $12 seats for members. Do not build a separate nonprofit tier: `CLAUDE.md` §03 forbids rebuilding Cluster 0 | S | 5 |
| 7 | **Residential brokerages** | Office-wide Agent licenses | Wait for MLS credentials; then brokerage-wide at $29/seat | M | 4 |
| 8 | **Municipal agencies** | Gridics sells to cities at roughly $20k to $100k+ per year ([Bisnow](https://www.bisnow.com/news/south-florida/commercial-real-estate/gridics-software-mapping-zoning-108770)) | Procurement cycles of a year or more; NYC agencies own the source data | XL | 3 |
| 9 | **Appraisers** | Regulated work under USPAP; KOANO's disclaimer is "not an appraisal" on every page | Avoid: liability exposure exceeds revenue | n/a | 2 |
| 10 | **Title companies** | HPD registration is not chain of title; little overlap with what KOANO reads | Avoid | n/a | 1 |

### 4.1 First 100 customers in NYC (target mix: 55 Development, 20 Agent, 20 Community, 5 Portfolio pilots)

**Weeks 0 to 2: make it sellable.** Raise or remove the global 50-call breaker for paid plans (`koano-guard.ts:70-73`); give the free tier one real document; strip KOANO from the CMA; fix the pricing sheet band bug; wire "Contact sales" to a real form; take Portfolio out of the self-serve modal; add annual prices and the Stripe billing portal. Without these, every channel below leaks.

**Weeks 2 to 6: build the list from the public record.** Pull every NB and major A1 filing in Brooklyn, Queens and the Bronx from DOB job filings for the last 24 months; extract applicant and owner entities (expect several hundred distinct developers and architects). Pull DOF recorded sales of vacant land and development sites; the buyer entities and their brokers are the second list. Target about 600 named firms.

**Weeks 3 to 10: reverse demo.** For each target, generate a Site Screening Memo on a lot adjacent to one they just filed or bought, and send it unsolicited with one line: "Here is what the public record says about the lot next to yours." Cost per memo is under $0.25 in model spend (section 6). Expect, conservatively, 20% reply, 8% call, 5 to 7% paid: about 35 to 40 Development seats from 600 memos.

**Weeks 4 to 12: broker multipliers.** Sign 10 land and investment-sales brokers on Development Team at a founding price (first year 40% off, annual prepaid). Each sends memos to developers weekly; every non-CMA memo carries the verification footer (section 5). Target 15 to 20 additional Development seats via forwarded memos.

**Weeks 6 to 12: Agent cohort.** Recruit 20 Brooklyn brownstone agents through one boutique brokerage with an office plan; sell on the HPI-adjusted price band and permit history, not on comps breadth.

**Season (January to March): Community.** Publish a free weekly community district filing digest to land-use committee members and tenant associations; sell the $39 tax appeal packet in the filing window; convert 20 to the $99/year plan.

**In parallel: 5 Portfolio pilots.** Two construction lenders, two NYC-focused multifamily owners who are institutions rather than landlords-as-a-business (e.g., a pension-backed operator's acquisitions team), one data provider. $7,500 paid, 90 days, success criteria written down in advance (for example, "Monday briefing flagged N material events before the asset manager learned of them").

Founder-led sales throughout. No paid ads until conversion from reverse demo is measured.

---

## 5. Viral and sharing loops

### 5.1 What is shared today

Nothing is shareable by link. There is no share token, public verdict page or verification route (`src/app` has no share or verify route; grep finds none). Every output leaves as a PDF attachment with no way back to KOANO except the word "KOANO" in the header.

### 5.2 What should be shared weekly, by audience

| Output | Who forwards it | To whom | Cadence | KOANO attribution allowed? |
|---|---|---|---|---|
| **Site Screening Memo** | Land broker, developer | Developer, partner, lender, architect | Several per week | Yes |
| **Monday watched-sites digest** (`lib/monitor/digest.ts`) | Developer | Partners, construction manager | Weekly | Yes |
| **Monday Portfolio Briefing** (`monday_briefing_pdf`) | Asset manager | IC, CIO, lender | Weekly | Yes |
| **Entitlement Risk Memo** | Land-use attorney | Client developer | Per matter | Yes, or firm-branded on Team |
| **Community district filing digest** | Land-use committee member | Committee, tenant association | Weekly | Yes, it is KOANO's public product |
| **CMA** | Agent | Seller or buyer client | Per listing | **No. Locked decision.** |

### 5.3 The mechanism: verifiable documents

Every non-CMA document gets a short footer line and QR: "Verify this analysis: koano.co/v/{id}". The page shows the immutable verdict record (the `verdicts` table is append-only), the provenance ledger, the coverage map and the generation timestamp, and offers "Run this on another address" with 1 free verdict for the viewer. This turns KOANO's actual differentiator, auditable provenance, into the growth loop: the recipient's first action is to check whether the memo is real, and checking it is the acquisition event. Nobody else in the category can offer verification because nobody else stores an immutable record.

### 5.4 Respecting the white-label CMA rule

The CMA must carry no KOANO branding, and today it does: `LetterheadBlock` renders `<Text style={s.brandMark}>KOANO</Text>` unconditionally (`lib/documents/render/pdf.tsx:262`), the DOCX letterhead opens with a bold "KOANO" run and falls back to "Prepared with KOANO" (`lib/documents/render/docx.ts:66, 75`), and the PDF metadata author is "KOANO" (`pdf.tsx:533, 551`; `docx.ts:334, 361`). The rendered sample `demo-kit/design-upload-2/documents/pages/cma-p1.png` shows "KOANO" top right on agent Elena Rowe's CMA. Fix: a `whiteLabel` flag on the render model set for `cma` (and offered for the Pricing Sheet, Net Sheet and Neighborhood Report, which agents also hand to clients), suppressing the brand mark, the fallback line and the metadata author.

The CMA loop then runs through the agent rather than the client:
- **Brokerage-domain verification.** On office plans, the verify link resolves on the brokerage's own domain (`verify.lindenhallrealty.com/{id}` via CNAME). The client can still verify; nothing says KOANO. This is the one verification loop compatible with the locked rule.
- **Agent-to-agent referral credits.** 25 free verdicts to both sides when an agent invites another.
- **Office expansion.** Usage dashboards for the managing broker showing which agents produced CMAs, which drives office-wide licenses.

### 5.5 A trust risk that kills the loop

The Pricing Recommendation Sheet in Downloads (176 Johnson Street, generated 2026-08-27) shows a midpoint of $99,612,920 above its own high of $95,844,572, and applies one-to-three-family $/sq ft comps to a 58,424 sq ft building. The cause is still in code: the band edges are percentiles of the `comps.comps` array while the midpoint is the provider's `median_price_per_sqft` computed over a different set (`lib/documents/builders/pricing-sheet.ts:63-71`), with no guard that low <= mid <= high and no building-class compatibility check. A shared document with an internally impossible number destroys referral faster than no referral at all. Add an assertion that refuses to render an inverted band, and refuse (or label) a residential comp set applied to a large multifamily or commercial subject.

---

## 6. Unit economics sanity check

### 6.1 Cost per verdict (estimate, offline, from the recorded fixture)

- The fixture records 8 LLM calls for one NYC verdict (`scripts/fixtures/nyc-175-3rd-st.json`, `record_counts.llm = 8`): five specialists, the synthesis narrator, and what appear to be grounding retries.
- Recorded completions total about 29,800 characters, roughly 7,400 output tokens.
- Input per call: system prompt (roughly 400 to 1,000 tokens per specialist, measured from the template literals in `lib/agents/*.ts`) plus the response-format block plus the data-point payload. I estimate 3,000 to 4,000 input tokens per call, about 24,000 to 32,000 per verdict.
- Runtime model is `claude-sonnet-4-6` (`lib/agents/shared.ts:16`), listed at $3 per million input and $15 per million output tokens, cache hits $0.30 ([Anthropic pricing](https://platform.claude.com/docs/en/docs/about-claude/pricing)).
- **Estimate: about $0.08 input + $0.11 output = ~$0.20 per verdict**, range $0.15 to $0.35 depending on retries. Prompt caching helps little at current volume: the ephemeral cache lives five minutes, so with a handful of verdicts a day most calls pay the cache-write premium rather than the hit discount.
- Documents built from a stored verdict cost zero model calls (`lib/documents/guard.ts:8-10`); fresh-build documents add one short narrative call (max_tokens 380 to 700 in the builders), about $0.01 to $0.02.
- Monitoring and the weekly diff use no LLM (`CLAUDE.md` §07B), so the recurring-revenue layer has near-zero marginal model cost. This is the best economic fact in the business.

### 6.2 Free tier

A fully used free account (3 verdicts, 3 narratives, proposed 1 document) costs about $0.65 to $1.10 in model spend. At a 3% free-to-paid conversion into a $399 seat, model-driven acquisition cost is about $25 to $35 per paying customer. That is trivially affordable. **Free is not the cost problem; the global breaker is the revenue problem.** At the default of 50 metered attempts per day across all users (`koano-guard.ts:70-73`), and with a Three-Site Comparison consuming three verdict runs (the guard comment notes "Cluster 4 firing three parallel pipeline requests", `koano-guard.ts:18-19`), the whole company can serve about 16 three-site comparisons per day. One newsletter mention would lock out every paying customer behind the message "KOANO's demo capacity for the day is used up." Replace it with a per-plan budget plus a dollar-denominated daily spend alarm.

Note also that a single Three-Site Comparison uses all three lifetime free verdicts, so a developer on the free tier gets exactly one comparison and then hits a modal, without ever receiving the document that is the actual product.

### 6.3 Paid tiers at realistic and at maximum usage

| Plan (proposed) | Price/month | Included verdicts | Model cost at included use | Gross margin on model cost |
|---|---|---|---|---|
| Community | $12 | ~10 | ~$2 | ~83% |
| Agent | $49 | 25 | ~$5 | ~90% |
| Development Pro | $399 | 40 | ~$8 to $14 | ~96% |
| Development Team | $1,250 | 200 | ~$40 to $70 | ~94% |
| Portfolio | $2,000 (from $24k/yr) | ~100 IC memos + weekly briefings | ~$30 to $50 | ~97% |

Under the current daily caps, the theoretical monthly ceilings are 20, 50, 150 and 500 verdicts per day (`koano-guard.ts:39-42`), worth roughly $120, $300, $900 and $3,000 of model spend against $19, $149, $499 and $1,499. Monthly pooled credits remove that tail without making any honest user feel limited.

Margins will compress when paid data arrives (MLS, CoStar-class benchmarks). That is the argument for bring-your-own-credentials and metered pass-through (brief §3), and for pricing Agent higher only once MLS is live.

---

## 7. Top 10 problems (ranked by impact on enterprise value)

| # | Problem | Evidence | State | Effort | Impact |
|---|---|---|---|---|---|
| 1 | Global breaker of 50 metered calls per day across all users caps total company throughput, with "demo capacity" messaging shown to paying users | `lib/koano-guard.ts:70-73, 134-156` | EXISTS | S | 10 |
| 2 | White-labeled CMA prints KOANO (locked decision violated) | `lib/documents/render/pdf.tsx:262`; `docx.ts:66,75`; `cma-p1.png` | EXISTS (bug) | S | 9 |
| 3 | Free tier promises 3 documents, delivers 0; the aha artifact is never seen before the paywall | `PricingContent.tsx:208-209, 484` vs `lib/documents/guard.ts:71-83` | PARTIAL | S | 9 |
| 4 | Portfolio sold self-serve at $1,499 while the page says it cannot be bought; anchors every enterprise quote low | `UpgradeScreen.tsx:21-26`; `lib/stripe/client.ts:24`; `PricingContent.tsx:505` | EXISTS | S | 8 |
| 5 | No path to sales: "Contact sales" goes to `/signup`; no lead capture, no calendar, no form | `PricingContent.tsx:422-428, 595-600` | MISSING | S | 8 |
| 6 | Pricing sheet can render a midpoint above its high and apply small-home comps to large buildings; shared output is the growth loop and this poisons it | `koano-pricing-recommendation-sheet-3020497501.pdf`; `pricing-sheet.ts:63-71` | EXISTS (bug) | S | 8 |
| 7 | No annual plans, seats, org model, billing portal, promo codes or tax | `checkout/route.ts:70-79`; schema grep | MISSING | M | 7 |
| 8 | Price ranges and a $49 tier advertised that do not exist; three different cluster numbering systems on the path to purchase | `PricingContent.tsx:41-97, 497-506`; `UpgradeScreen.tsx:149`; `clusters.ts` | PARTIAL | S | 6 |
| 9 | Transaction priced at 3x Cloud CMA with less data, against free RPR | `for/agents/page.tsx:44,63-64`; sources | EXISTS | S | 6 |
| 10 | No share or verify link; every output is a dead-end attachment | no share route in `src/app` | MISSING | M | 6 |

Also noted (lower): the pricing tier grid, FAQ and CTA render at opacity 0 until scrolled (`PricingContent.tsx:266-271` with `useInView`), so the full-page capture `shots/desktop_pricing.png` shows a blank pale band where the prices should be. Real scrolling users see them, but link unfurlers, crawlers and any non-scrolling renderer receive invisible pricing (PARTIAL, S, 4). `KOANO_COPY.md` §3 to §4 still describes "free during demo, by request" pricing and three agents on representative data, which the shipped page and code contradict (S, 3). The document daily cap is 30 for every tier including a 500-asset Portfolio (`lib/documents/guard.ts:35-38`) (S, 3).

## 8. Top 10 opportunities (ranked)

| # | Opportunity | State | Effort | Impact |
|---|---|---|---|---|
| 1 | Development wedge with reverse-demo outbound built from DOB filings and DOF sales KOANO already reads | MISSING (data EXISTS) | M | 9 |
| 2 | Verifiable documents (`/v/{id}` backed by the immutable verdict record) as the share loop | MISSING | M | 9 |
| 3 | Portfolio as annual per-asset enterprise contract with paid pilots | MISSING | M | 8 |
| 4 | Verdict API at $4 per call and archive licensing, the acquirer-facing revenue line | MISSING | L | 8 |
| 5 | Pay-per-memo entry SKU ($79 screen, $199 comparison), credited to subscription | MISSING | S | 8 |
| 6 | Data-provider partnership: KOANO as the reasoning and provenance layer inside a provider's distribution (Gridics and Cotality precedent) | VISION | L | 8 |
| 7 | Monday digest as a forwardable, attributed weekly artifact for developers and asset managers | PARTIAL (digest EXISTS) | S | 7 |
| 8 | Brokerage-domain CMA verification and agent referral credits, loop without KOANO branding | MISSING | M | 6 |
| 9 | Seasonal Community tax appeal packet at $39 in the Tax Commission window, plus a free community district filing digest | PARTIAL (packet EXISTS) | S | 5 |
| 10 | University classroom licenses and a published Brooklyn site case | MISSING | S | 4 |

## 9. What I would rebuild first

The commercial spine, in this order, all in two weeks:
1. Replace the global 50-call breaker with per-plan monthly budgets and a dollar spend alarm.
2. Add `whiteLabel` to the render model and turn it on for the CMA.
3. Give free users one complete document and fix the pricing page copy to match the code.
4. Remove Portfolio from `UpgradeScreen`; wire "Contact sales" to a lead form that books a call.
5. Add annual prices, the Stripe billing portal and promo codes (founding-customer pricing needs them).
6. Add the band-ordering guard to the pricing sheet.

Then the verify page, then pooled credits and seats.

## 10. The "I have never seen anything like this" moment

A developer receives a Site Screening Memo from a broker on a Tuesday, scans the QR code, and lands on a page that shows the immutable record of that exact verdict: every figure, its source, its provenance state, what was not covered and which feed would cover it, plus, once the calibration record matures, "Of KOANO's 412 BUY screens in Brooklyn since August 2026, here is what happened to those lots." No CRE data product lets the recipient of a document audit the sender's tool. That is a sales motion, a trust moat and an acquisition pitch in one screen. VISION for the calibration line (it needs time to accrue); the rest is buildable now.

---

## Sources

- Cloud CMA pricing (Capterra): https://www.capterra.com/p/173777/Cloud-CMA/pricing/
- RPR as a no-cost NAR member benefit (RISMedia): https://ace.rismedia.com/2019/06/26/rpr-your-no-cost-priceless-member-benefit/
- PropertyShark (Capterra listing; support page for report quotas): https://www.capterra.com/p/10048620/PropertyShark/ , https://support.propertyshark.com/hc/en-us/articles/360022470312-Understand-Your-Subscription-Benefits
- Reonomy official pricing page (fetched; plans listed, dollar figures came from the search summary, so treat as reported): https://reonomy.com/pricing
- Regrid plan types: https://support.regrid.com/docs/plan-types-property-app
- TestFit pricing change log (third-party, unverified on vendor site): https://pricingsaas.com/companies/testfit/diffs/2026W33
- Zoneomics pricing (two page versions disagree): https://www.zoneomics.com/pricing
- Gridics municipal pricing (Bisnow, undated in results): https://www.bisnow.com/news/south-florida/commercial-real-estate/gridics-software-mapping-zoning-108770
- Gridics and Cotality collaboration: https://www.mannpublications.com/mannreport/2025/10/07/gridics-collaborates-with-cotality-to-deliver-property-level-zoning-data/
- Deepblocks: only "Deep Block" found, figures unverified: https://web-v2.prod.trustradius.com/products/deep-block/pricing
- Placer.ai: paid pricing not disclosed (unverified): https://pricingsaas.com/companies/placer , https://www.g2.com/products/placer-ai/pricing
- CompStak: Exchange free to brokers and appraisers, Enterprise price undisclosed: https://www.g2.com/products/compstak-enterprise/pricing
- Dealpath estimates (third-party estimate, unverified): https://www.spendbase.co/?p=37238
- ARGUS Enterprise estimate (competitor-sourced, unverified): https://apers.app/compare/best-argus-alternatives
- Crexi Intelligence: https://www.trustradius.com/products/crexi/pricing
- ATTOM API billing model (vendor help example) and sales-only pricing: https://cloud-help.attomdata.com/article/684-api-report , https://support.attomdata.com/articles/9704145040-api-pricing-trial-extensions-and-paid-plans
- First Street: API pricing not published (unverified); MSCI acquisition report: https://coverager.com/msci-to-acquire-first-street-for-120-million/
- Diald $250 per memo (February 2026 interview): https://pulse2.com/diald-ai-profile-samantha-um-interview/
- Anthropic model pricing: https://platform.claude.com/docs/en/docs/about-claude/pricing
- NYC Tax Commission filing deadlines: https://www.nyc.gov/site/taxcommission/forms/forms.page
- REBNY membership (dated figures only, not used for sizing): https://en.wikipedia.org/wiki/Real_Estate_Board_of_New_York

## Discrepancies vs the brief (section 3 of the prompt)

1. **Free tier.** Brief: "free (about 3 verdict runs)." Code: 3 verdict runs plus 3 narrative/briefing generations, lifetime (`koano-guard.ts:38`), and zero documents (`lib/documents/guard.ts:71-83`). The pricing page claims "three generated documents" (`PricingContent.tsx:208-209, 484`), which is false.
2. **"Tiers differ by documents and monitoring caps, not feature locks."** Documents are a hard tier lock (`registry.ts` `homeTier` plus `allowedPlansFor`, `guard.ts:31-33, 84-97`); a document lock is a feature lock. Tiers also differ in rolling-24h verdict and content limits (`koano-guard.ts:39-42`).
3. **Price points.** Brief lists single prices. The site advertises ranges ($19 to $49, $149 to $299, $499 to $1,499, $1,499 to $4,999 + custom) that Stripe does not implement (`lib/stripe/client.ts:20-25`).
4. **Portfolio.** Brief lists $1,499/month. Code sells it self-serve at $1,499 (`UpgradeScreen.tsx:21-26`) while the page calls it "Contact sales" and "not a product you can buy today" (`PricingContent.tsx:427, 505`).
5. **Unmentioned global throttle.** A 50-attempt-per-day company-wide breaker (`koano-guard.ts:70-73`) is not in the brief and bounds all revenue.
6. **Approval gate.** `CLAUDE.md` §03 and §11 still describe an approval gate; code has retired it (`koano-guard.ts:11-13, 99-104`).
7. **White-labeled CMA.** Brief and locked decisions say the CMA carries no KOANO branding; the renderer stamps KOANO on it (`pdf.tsx:262`, `docx.ts:66, 75`).
8. **Comps.** `CLAUDE.md` §08 (Cluster 2) says comps are representative until MLS is funded; code serves live NYC DOF recorded sales (`CLAUDE.md` §07 notes the change; §08 is stale).
9. **Copy source of truth.** `KOANO_COPY.md` §3 to §4 (demo free, by request, three agents on representative data) contradicts the shipped pricing page and the code.
