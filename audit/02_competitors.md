# 02. Competitive Landscape

KOANO audit, Phase 2. Prepared 2026-10-19 from live web research plus the KOANO repo and production screenshots.

How to read this file:
- Every market claim cites a URL in the Sources list. "(snippet)" means the fact came from a search result whose page I could not open (usually a 403). "Unverified" means I could not confirm it at all.
- KOANO claims cite code paths or screenshots under `demo-kit/design-upload-2/dashboards/`.
- Labels: `EXISTS`, `PARTIAL`, `MISSING`, `VISION`. Ranked lists carry Effort (S/M/L/XL) and Impact (1 to 10).
- Diald AI was torn down from its public site, FAQ (the answers are embedded in the page payload), pricing page, the /score explainer, its press releases, its LinkedIn page and, most usefully, its 2:15 product video at `https://www.diald.ai/videos/how-it-works.mp4`. I pulled 34 frames from that video (one every 4 seconds) and read each one. The in-app teardown in section 8 comes from those frames. Diald's `/sample` analysis needs an account, and I did not sign up.

---

> **Managing partner reconciliation (added after the panel reported).** Section 11 below scores KOANO's "computed, not generated" property as EXISTS. The AI systems panel traced the code and found this is only PARTIAL: the aggregation is deterministic, but each specialist agent's vote, risk band and signal window are set by the LLM (`panel/ai_expert.md` §1.2), and the flagship verdict was decided by an unguarded structural rule on stale data (`panel/real_estate_tycoon.md` §0). The white space is still correct, but KOANO occupies it only after the engine inversion in `05_product_roadmap.md` 90-1. Read every "EXISTS" in section 11 items 1 and 3 as "architected, not yet true end to end."

## 0. The answer in one page

**What Diald AI actually is.** Diald is a Los Angeles seed-stage startup, founded November 2023, with 2 to 10 people on LinkedIn and $4.75M raised (a $3.75M round in December 2025 that included Feedback Ventures, then a $1M follow-on led by Feedback in August 2026). It sells a **conversational CRE underwriting copilot** to family offices, high-net-worth individuals, independent operators and, more and more, university real estate programs. You type an address and a plan in plain English. Diald asks setup questions, takes an OM or rent roll upload, pulls Moody's market data and comps, scans news and media for "qualitative signals", builds a pro forma and outputs two headline numbers: a letter-grade **Neighborhood Investment Rating** (A/B/C) and a **Diald Confidence Score**, which it describes as "the probability that the deal's projected exit cap rate will be achieved." It ends in a downloadable PDF investment memo and an Excel model. Data comes under license from Moody's Analytics, Green Street and LightBox. Pricing runs from $0 to $200 per month, with "deals" as the unit: Plus is $20 for 1 deal, Pro is $100 for 6 or $200 for 12. Product polish is high, financial depth is real (levered and unlevered returns, sources and uses, lender loan sizing, dual exits), and the AI chat is wired into the model. Visible weaknesses: numbers disagree between screens, the "probability" has no published calibration, and the qualitative layer runs on media sentiment.

**Where KOANO stands against it.** On the dashboard comparison the founder cares about, KOANO **loses today on financial depth, interactivity and workflow**. KOANO has no pro forma (its IC memo's Financial Analysis, Business Plan, Exit Strategy and Key Terms sections are placeholders, `lib/documents/registry.ts` IC memo sections), no document upload, no chat, no comp selection, no share link and no Excel export. KOANO **wins clearly on integrity and municipal depth**: a deterministic, replayable verdict; five-state provenance on every figure; a per-verdict coverage map; an append-only audit trail; parcel-level NYC zoning and FAR headroom, permits, violations and HPD ownership; multi-site ranking; and 15 live document types, including a white-labeled CMA and a tax appeal packet. Diald shows no per-figure provenance, and its own screens contradict themselves (evidence in section 8).

**The structural market fact that changes the plan.** In 2026 the data owners began exposing their data directly to general AI assistants through MCP servers: ATTOM (January), Cotality (March, plus a Claude directory connector in October), Green Street (August), CompStak (September), Placer.ai, Regrid and TestFit, and MSCI says it delivers through MCP connectors to Anthropic and OpenAI. Raw data access is commoditizing toward Claude and ChatGPT. Two things remain unowned: **a reasoning layer whose conclusions are deterministic, reproducible, provenance-labeled and calibrated against outcomes**, and **turning that reasoning into the specific signed document each audience hands over**. Cherre's sale to RealPage (July 2026) and Fitch's roughly $1B Trepp deal (April 2026) show acquirers paying for trusted, resolved data infrastructure that AI can use.

**The white space (section 7).** Nobody sells a *verifiable decision record for real estate*: a verdict whose math replays byte for byte, whose every input names its provenance and its gap, and whose track record is published against real outcomes. Diald claims a "probability" and publishes no calibration. Henry, Dealpath and ARGUS Assist produce outputs, not auditable decisions. Horizontal assistants cannot reproduce their own answers. KOANO already has the hard parts (deterministic synthesis, the record/replay fixture, five-state provenance, the archive that started in August 2026). It lacks the financial layer and the interaction layer, both of which can be built. If KOANO adds those, plus BYO-credential MCP connectors mapped to its existing `partner` provenance state, it becomes the **neutral, auditable reasoning layer that licensed data plugs into**. That is exactly the exit thesis.

---

## 1. Market map and status check (verified 2026-10-19)

| Company | Status today | Evidence |
|---|---|---|
| Diald AI | Independent, seed. $4.75M total. Platform relaunch Aug 10, 2026 | Commercial Observer Dec 2025; BusinessWire/Yahoo Aug 2026; SaaSRise |
| Henry AI | Independent. $16.5M Series A (FirstMark, Jul 2026) | Mann Report |
| CarbonAI | Independent. $12M (Cowboy, Oct 2026) | The Next Web |
| Fifth Dimension | Independent. $26M Series A (HV Capital, May 2026) | PropTech Connect |
| Cadastral | Independent. $9.5M (Navitas, JLL Spark, AvalonBay, EQR, Feb 2026) | PropTech Connect |
| Rely | Independent. $4.5M seed (May 2026) | Commercial Observer |
| Cherre | **Acquired by RealPage**, Jul 14, 2026 (undisclosed, cash) | Multifamily Dive |
| Trepp | **Fitch agreed to acquire**, Apr 30, 2026, about $1B. Close unconfirmed | City AM |
| Reonomy | Still operating as "An Altus Group Business" (acquired 2021, about $201.5M) | reonomy.com; Connect CRE |
| Altus Group (ARGUS) | Strategic review ended Nov 2025 with no sale. CEO change. Selling non-core units to Newmark. Bought Valos (Aug 2026) | Bisnow; Altus releases |
| CoreLogic | **Renamed Cotality**, Mar 24, 2025 | Cotality press release |
| UrbanFootprint | **Acquired by LightBox**, Jun 24, 2025 | LightBox release |
| First Street | **MSCI agreed to acquire**, announced Jun 24, 2026, $120M cash plus earnout. firststreet.org now shows an MSCI terms screen | MSCI IR; Reinsurance News; firststreet.org |
| Redfin | **Acquired by Rocket Companies**, closed Jul 1, 2025 ($1.75B, all stock) | Scotsman Guide |
| Cloud CMA | Owned by Lone Wolf since Dec 2020 (W+R Studios) | PrivSource; cloudcma.com |
| MSCI RCA | Part of MSCI since 2021 ($950M) | BusinessWire (snippet) |
| Matterport | Acquired by CoStar, closed Feb 28, 2025 | Wikipedia |
| Zonda | Acquired by CoStar, $800M, completed Aug 2026 | SEC 8-K (snippet) |
| Enodo | Acquired by Walker and Dunlop 2019, off market since 2020 | HelloData help article |
| HelloData | Acquired by Grace Hill, May 2025 | Multifamily Executive |
| Skyline AI | Acquired by JLL, 2021 | JLL |
| Envelope (NYC 3D zoning) | Now marketed on a First American domain (footer ©2026 First American). Ownership unverified | ncsmarketing.firstam.com |

**What the status sweep shows.** Incumbents are buying AI capability and trusted data (CoStar: Matterport, Domain, Zonda. Altus: Valos. RealPage: Cherre. MSCI: First Street. Fitch: Trepp. Moody's: CAPE Analytics). The buyers in KOANO's exit thesis (data providers) are active and paying for capability, not just data.

---

## 2. Direct competitors: AI underwriting, IC memo and deal analysis (2024 to 2026)

### 2.1 Diald AI (full profile here; the screen teardown is in section 8)

- **What it does.** An address- or OM-first AI underwriting platform. "19 specialized AI agents, modeled after real-world consultants" read "1.7M+ media and institutional sources", output a Neighborhood Investment Rating plus a Confidence Score, build a pro forma conversationally and generate a memo (diald.ai; diald.ai/score; Yahoo/BusinessWire Aug 2026). FAQ: property types are "Multifamily, hospitality, retail, office, industrial ... for any address in the US". Uploads accepted: "PDFs, Excel spreadsheets, images (PNG/JPG), Word documents". Monitoring: "monthly alerts and change reports" over news, zoning changes, crime data, leasing activity, macro trends (diald.ai/faq, embedded answers).
- **Who pays.** The stated target is "family offices, high-net-worth individuals, and independent operators", positioned as segments with "no major software incumbent" (Yahoo/BusinessWire; LinkedIn). Named early customers: The Max Collaborative, Way Capital, NYC family offices (Commercial Observer). Education is a growing channel: Notre Dame Fitzgerald Institute, USC Dollinger MRED and UW-Madison Graaskamp students use it (LinkedIn posts, self-reported). There is a "For Educators" pooled-capacity plan (diald.ai/for-educators).
- **Pricing (public).** Pilot $0 (review shared analyses only). Plus $20/mo: 1 deal/month, unlimited revisions, monitor 1 property, PDF memo. Pro $100/mo: 6 deals, or $200 for 12, monitor 6. Teams/Enterprise and Academic tabs exist without prices. Running "Step One" counts as half a deal (diald.ai/pricing).
- **Funding.** $3.75M early-stage, Dec 9, 2025: Feedback Ventures plus strategic angels and sector funds, for US and Japan expansion, a Japanese trading-company proof of concept and a Korean branch (Commercial Observer). $1M follow-on led by Feedback, Aug 2026, bringing the total to $4.75M (SaaSRise; Yahoo/BusinessWire). Company claims: "$210 billion" CRE volume analyzed, "nine patent applications across five jurisdictions", 300+ accounts, 10+ countries (Yahoo/BusinessWire; LinkedIn). It reports a Commercial Observer Breakthrough Award, "Tech Advance of the Year" (Commercial Observer article; I did not find the award listing itself).
- **Data.** Licensed from Moody's Analytics, Green Street and LightBox (Yahoo/BusinessWire). The in-app market tab is labeled "MOODY'S ANALYTICS" and the chart footer reads "Source: Moody's Market Trend Data" (video frames 46, 50).
- **UX strengths.** A strong, coherent visual identity (pen-and-ink skyline illustration, serif display type, calm palette). A persistent two-card score header on every tab. A chat sidebar that sees the model ("Grade A · 460 sales · 3 rent · 147 findings", 18 slash commands). Comps on a map with lock/unlock and per-comp select. A lender-sizing warning banner. An OM-versus-your-case returns table. One-click share to a free viewer account, which works as a viral loop. Next-step nudges in the location list ("Finish setup", "Unlock NIR", "Select comps").
- **KOANO better.** Determinism and replay (`lib/agents/synthesis.ts`, `lib/agents/confidence.ts`, the record/replay fixture `scripts/fixtures/nyc-175-3rd-st.json`); per-figure provenance and the coverage map (`CoverageMap.tsx`, `ProvenanceLedger`); municipal parcel facts in NYC (PLUTO FAR headroom, DOB permits, HPD and ECB violations, HPD registrations); multi-site ranking (`cluster4/SiteComparison.tsx`); breadth of audience documents (15 implemented types, `lib/documents/implemented.ts`), including a white-labeled CMA and a tax appeal packet that Diald does not make.
- **KOANO worse.** Pro forma and returns (Diald `EXISTS`, KOANO `MISSING`: the pro forma document is `blocked` and the IC memo financial sections are placeholders); document upload and extraction (`MISSING`, with no upload path outside profile assets in `ProfileSettingsForm.tsx`); grounded chat (`MISSING`); comp selection (`MISSING`); sharing (`MISSING`); Excel export (`MISSING`); national coverage (Diald licenses national data; KOANO rolls up `coverage_absent` outside NYC, per CLAUDE.md section 07 "Geographic scope"); price (Diald Pro at $100 underprices KOANO Development at $499).
- **KOANO does not do at all.** Lender loan sizing, return metrics, rent comps, education channel, qualitative news signal feed.

### 2.2 Other AI-native underwriting, IC memo and deal analysis startups

| Company | What it does | Who pays | Public pricing | Funding / exit | UX strength | KOANO vs |
|---|---|---|---|---|---|---|
| **Henry AI** | "AI analyst" for CRE: custom Excel underwriting, sourced research, decks, buyer ranking. Henry Deal builds a full deal package from a prompt plus a rent roll. Claims SOC 2 Type II | Brokerages (Newmark, JLL, Berkadia, Colliers, Marcus and Millichap logos) | Not public | $4.3M seed (Feb 2025). $16.5M Series A, FirstMark, Thomson Reuters Ventures strategic (Jul 2026). Claims 150+ firms, 20,000+ deliverables | Output looks like what a broker already sends | Henry wins on deliverable polish and Excel. KOANO wins on deterministic verdict, provenance and municipal facts. Henry is the broker-side threat to KOANO's Transaction cluster |
| **CarbonAI** | AI agents for CRE loan underwriting, diligence, post-close monitoring | Lenders (Greystone named) | Not public | $12M led by Cowboy Ventures (Oct 2026) | Not observable | Lender-side. KOANO does not serve lenders yet |
| **Fifth Dimension** (London) | Agent "Ellie" screens deals, drafts IC memos, monitors portfolios. Integrates Yardi, Dealpath, SharePoint | Institutional owners | Not public | $26M Series A, HV Capital (May 2026) | Lives in the firm's existing systems | Direct threat to KOANO's Portfolio cluster. It owns the integration story KOANO lacks |
| **Cadastral** | "AI analyst in a box": T-12, lease abstraction, loan compliance, underwriting | JLL use cases, multifamily REITs | Not public | $9.5M (Navitas, JLL Spark, AvalonBay, Equity Residential, Feb 2026) | Strategic investors who are also customers | Extraction-first. KOANO does no extraction |
| **Rely** | Turns multifamily data rooms into source-linked structured data | Operators (Cardinal, Preiss, Olympus) | Not public | $4.5M seed (May 2026) | Every figure links to its source document | Shows source-linking is now table stakes in diligence |
| **Archer** (archer.re) | Multifamily: parses rent rolls and T-12s in seconds into the customer's own Excel model, plus pipeline, comps, BOVs | Brokers, investors | "From $500/Month" | Undisclosed round, Portland Seed Fund plus Marcus and Millichap strategic (Jun 2024) | Respects the customer's own model | KOANO has no extraction and no model handoff |
| **Clik.ai** | AI spreading of T-12s and rent rolls, agency workbooks, investment memos | Lenders and brokers (Newmark, Lument, Colliers, ACORE, Northmarq, Heitman) | Not public | About $2M (2019) | Agency-ready outputs | Lender workflow. KOANO absent |
| **Keyway** | "Agentic Operating System": KeyDocs extraction and IC memos with source citations and audit trails, KeyComps, KeyBrain | Hines, Starwood, Two Sigma logos | Not public, free trial | $15M seed (2021), $25M Series A (2022) | Claims audit trails on memos, the closest rhetoric to KOANO | Keyway's audit trail is source citation. KOANO's is deterministic replay. That difference is the wedge |
| **Smart Capital Center** | Agents extract rent roll, T-12, OM and loan docs. Each figure linked to source with a confidence score, a second agent verifies | JLL, KeyBank, RMR | Starter free. Professional $350 per property per month ($299 annual). Enterprise custom | Not stated | Second-agent verification shown to the user | Comparable integrity rhetoric. No public-record reasoning |
| **Leni** | Agentic underwriting, memos, reporting. Routes across Claude, GPT and Gemini. Integrates Entrata, RealPage, AppFolio | Greystar, CBRE, Colliers logos | Not public | Unverified | Model routing | Operator analytics, not site or entitlement reasoning |
| **V7 Go**, **Build.inc** | IC memo agents that write into the firm's own Word or PowerPoint template (V7 claims 2 to 3 days down to about 2 hours) | Investment teams | Not public | Not stated | Template fidelity | KOANO's IC memo is a fixed KOANO template with placeholders |
| **Blooma** | Lender "insights engine", origination and portfolio intelligence | CRE lenders | Pro and Enterprise, unpriced | $15M Series A (2021) | Lender-native | Absent from KOANO |
| **Cactus**, **PRODA**, **Lev** | Underwriting analyst service; rent roll standardization ($8M Series A 2022); financing marketplace ($30M Series A 2021) | Investors, lenders | Not public | As stated | n/a | Peripheral |
| **Smart Bricks** (Dubai) | Agentic underwriting and execution | Investors | n/a | Unverified (snippet: $5M pre-seed, a16z Speedrun, Feb 2026) | n/a | Unverified |

**Pattern across this cohort.** Almost every 2024 to 2026 entrant starts from **the deal's own documents** (OM, rent roll, T-12, data room), extracts with source links and produces a memo or model. None of them starts from **the public record of the parcel and its block** and reasons to a verdict deterministically. KOANO starts there. That is a real, defensible difference, but it is incomplete without the document layer, because institutional underwriting begins with the OM.

### 2.3 Incumbent AI layers on deal and portfolio systems

| Company | AI in market | Pricing | Corporate | KOANO vs |
|---|---|---|---|---|
| **Dealpath** | AI Deal Screening (tear sheet from OM, rent roll, T-12), AI Comps incl. MSCI RCA, AI Extract, AI Excel Assistant (works with Claude and ChatGPT Excel add-ins), **Dealpath MCP** to Claude and Copilot. Planned: underwriting scenarios, document generation, bring-your-own agents. SOC 2 Type 2. AI Studio announced Oct 14, 2025 | Not public. "300+ firms, $10T+ in transactions" | $43M Series C (2022) | Dealpath is the institutional pipeline system of record. KOANO should be a reasoning feed *into* Dealpath, not a rival pipeline |
| **ARGUS (Altus Group)** | ARGUS Intelligence (Sep 2024). ARGUS Assist (Apr 14, 2026): agentic natural-language layer inside ARGUS. Bought Valos (UK AI valuation workflow), Aug 2026 | Not public | Review ended Nov 2025, no sale. CEO change. Selling appraisals and development advisory to Newmark, which licensed ARGUS Intelligence and Assist. Possible US listing 2027 (snippet) | ARGUS is the cash-flow standard. KOANO should export to ARGUS-compatible inputs rather than build a rival DCF engine. Altus is an active AI acquirer |
| **Juniper Square** | JunieAI. "Headless GPX" (Jun 2026) opens its fund operating system to Claude, Copilot, ChatGPT via MCP | Not public | $130M Series D at $1.1B (Jun 2025) | Fund admin and LP reporting. Not a competitor. A possible distribution partner for portfolio risk reports |
| **Cherre (RealPage)** | Agent.STUDIO (Jul 2025): custom agents on a semantic model and knowledge graph, model-agnostic | Not public | $30M Series C (Sep 2024, snippet). Acquired by RealPage Jul 2026 | The closest precedent for KOANO's exit: a data-integration and agent layer bought by a data and software owner |
| **Northspyre**, **Agora** | Development cost management (limited AI). Investor portal, AI "Cortex" waitlist | Not public | Northspyre $25M Series B (2022) | Adjacent |

---

## 3. CRE data and analytics

| Company | What / who pays | Pricing (public) | Funding / scale | AI and API 2024-2026 | UX strength | KOANO better / worse / absent |
|---|---|---|---|---|---|---|
| **CoStar** (incl. LoopNet, Homes.com, Matterport) | The CRE data monopoly. Brokers, owners, lenders, investors subscribe. LoopNet sells listing ads | Not public | FY2025 revenue $3.247B (CoStar product $1,259M, LoopNet $312M). 2026 guidance $3.78B to $3.82B | Homes AI (Feb 2026), Apartments.com Ai (Jun 2026), CoStar Rent Benchmark from 4M AI-abstracted leases. **No AI assistant found for CoStar Suite or LoopNet.** No public API or MCP found. Florance: "AI cannot create data from nothing" | Depth and breadth of verified comps | KOANO cannot match the data. KOANO's representative pro forma provider stands in for exactly this feed. CoStar's closed posture makes BYO-credential access legally fraught (my inference, check the terms) |
| **CompStak** | Crowdsourced lease and sale comps. Brokers and appraisers contribute for free access. Lenders, investors, owners pay ("CompStak One") | Quote-based, value-based | Last confirmed round $12M (2019) | CompStak AI (Dec 2025): CompScout, Rent Predictor, AI Market Summary. **Agent Connect MCP server** (Sep 29, 2026) for Claude, ChatGPT, Copilot, Gemini, sold in the "CompStak One Connect" tier (snippet, page 403) | Lease-level detail | The cleanest early BYO-credential target for KOANO's `partner` state |
| **Cherre** | See 2.3. Now RealPage | n/a | Acquired | Agent.STUDIO | Entity resolution | Precedent, not rival |
| **Reonomy** (Altus) | Owner, transaction, debt data on 53M+ commercial properties, "likelihood to sell" | From $400/mo billed annually. API via sales | Acquired 2021, about $201.5M | ML matching, propensity scores | Owner unmasking | KOANO has HPD owner registrations in NYC only |
| **Placer.ai** | Foot-traffic analytics from a device panel. Retail, CRE, hospitality, econ dev | Not public | $100M ARR (Feb 2024). $75M at about $1.45B (Aug 2024) | "Pi" AI analyst. **MCP server** for Claude, ChatGPT, Copilot, Cursor (enterprise entitlement, credits) | Visual trade-area analytics | KOANO has no mobility data. Demand-Sentiment uses ACS, HMDA, QCEW, IRS migration instead |
| **Crexi** | CRE marketplace plus Crexi Intelligence | Intelligence Select $299/mo or $269 annual (snippet from crexi.com/ai). Quote-based per MotionCRE | $30M Series B (2020) | **Crexi AI** (May 13, 2026): Crexi Create drafts OMs, Crexi Vault extracts 24+ data points from OMs, market analytics, bulk enrichment | Listing-native workflow | Crexi now generates and parses OMs. KOANO does neither |
| **LoopNet** | Listings marketplace (CoStar) | Ad-based | $312M FY2025 revenue | No AI assistant found | Traffic | Not a reasoning competitor |
| **Cotality** (formerly CoreLogic, renamed Mar 24, 2025) | Property, mortgage, insurance, climate data for lenders, insurers, servicers | Not public | Ownership unverified on pages I read | **MCP server** plus "AI-ready" Property 360 datasets with semantic YAML (Mar 31, 2026). **Claude directory connector** (Oct 14, 2026). "Aly" Q&A beta | Field-level semantics | A natural `partner` feed and a plausible acquirer. Its Claude connector means a Claude user can already query Cotality data without KOANO |
| **ATTOM** | National property, deed, AVM, parcel data | $499/yr Property Navigator seat. API quote-based (snippet) | Private | **MCP server** (Jan 27, 2026, "first large-scale real estate data licensing company" to do so, per WAV Group). Three MCP-based agents (Aug 2026), about 160M records | Breadth | The fastest path to national comps for KOANO non-NYC addresses |
| **Regrid** | National parcels (160M+ US) | Self-serve API plans (prices not shown). MCP billed per record, schema queries free | Private | **MCP server** for ChatGPT, Claude, Perplexity, Cursor | Clean parcel geometry | Fills KOANO's national lot-polygon gap |
| **PropertyShark** (Yardi) | NYC-centric owner, comps, foreclosure data | Pro, Elite, Platinum, unpriced on homepage | Yardi brand | No AI or API found | NYC owner unmasking | KOANO already reads the same NYC public sources live, adds reasoning and provenance, and is the more modern product. PropertyShark is the incumbent KOANO's Community cluster displaces |
| **MSCI Real Capital Analytics** | Global CRE transaction data and indices | Not public | $950M acquisition (2021, snippet) | MSCI says it delivers data "through MCP connectors" to Anthropic and OpenAI and is building agents. It also said generative AI weakens moats built on operational data collection | Transaction history depth | A buyer that just paid for climate (First Street). It knows its moat is under AI pressure |
| **Trepp** | CMBS and CRE loan data | Not public | Fitch about $1B (Apr 2026) | "TreppAI" (snippet) | Loan-level detail | Lender data. Not a KOANO feed today |
| **Green Street** | REIT and CRE research, sales comps, AVM | MCP reportedly a paid add-on (snippet) | Private | **GreenStreetAI MCP server** GA Aug 11, 2026, for Claude, ChatGPT, Gemini | Research authority | Diald licenses Green Street. KOANO could reach it through BYO credentials |
| **Yardi Matrix** | Multifamily, office, industrial, land data | Not public | Yardi | "AI connectors" link exists, details 404 (unverified) | Property-level rents | Possible partner |

**Takeaway for KOANO.** Within twelve months the data layer moved to MCP. KOANO's architecture already has the seam for it: the provider registry plus the `partner` provenance state, "a provider sets `provenance:'partner'` + `source:'<Partner Name>'`; no provider emits it yet" (CLAUDE.md section 06). An MCP client provider that maps a user's own CompStak, ATTOM, Regrid, Cotality or Green Street credentials into `partner`-labeled datapoints would be the shortest route from "NYC demo" to "national product", and it is the best demo for an acquirer. Status: `MISSING`, achievable now. One caveat from CLAUDE.md: several render gates check `=== 'live'` and will silently drop partner data until switched to `isTrustedProvenance`.

---

## 4. Zoning, feasibility and site selection

| Company | What / who pays | Pricing | Funding / status | AI | KOANO vs |
|---|---|---|---|---|---|
| **Zoneomics** | National zoning data: 10,000+ cities, 100M+ parcels. Brokers, architects, appraisers, lenders, developers, law firms | Essentials $92/mo (25 searches). Advanced $279/mo (150 searches). Enterprise custom, white-label | Unverified | "Bassett" AI assistant with cited municipal sources, in every plan, metered | Zoneomics wins on national breadth. KOANO wins on NYC depth (FAR headroom math, City of Yes fields, permits and violations joined to the lot, entitlement risk scoring in `lib/agents/entitlement.ts`) and on the verdict |
| **Gridics** | Government zoning platforms (MuniMap, CodeHUB, ZoneCheck), plus PropZone and a Zoning Data API | Demo only | $1.6M seed (2017, snippet). 2018 NYC DCP pilot (snippet) | None mentioned | Government-side. Low threat |
| **TestFit** | Generative site planning (Site Solver), Parking Solver. Add-ons: Site Intelligence, Pro Forma, MCP | Site Solver from $15,000/yr. Portfolio $20,000/yr. Parking $195/mo. Site Intelligence +$150/mo, Pro Forma +$170/mo, **MCP +$100/mo** | $2M seed (2020, snippet). $20M Series A unverified. 6,200+ users (UDR, Brookfield, Prologis, Related) | AI-generated editable site plans. Prompting plans through an assistant via MCP | TestFit owns "what can I build and how does it lay out". KOANO owns "should I, and what's the risk". A natural integration: KOANO envelope into TestFit, TestFit yield back into KOANO |
| **Deepblocks** | Feasibility: zoning, 3D massing, financial model (DEV). AIM conversational parcel search "Coming October 2026" | DEV and AIM $99.99 to $499.99/mo by city count | $4.25M notes (aggregator, unverified) | "Agentic harness", ordinance-linked figures | Deepblocks pairs zoning with a financial model, which KOANO lacks. KOANO has the better provenance and public-record depth in NYC |
| **Archistar** | AI plan review (AI PreCheck, formerly eCheck) for governments. Generative design | Demo only | A$2.7M federal grant (2024). LA wildfire rebuild eCheck (Jul 2025) | Code compliance AI | Government permitting. Not a KOANO rival |
| **UrbanFootprint** | Location, climate and infrastructure intelligence on about 160M parcels | Demo only | **Acquired by LightBox**, Jun 24, 2025 | None mentioned | LightBox (Diald's licensor) is consolidating location intelligence |
| **NYC ZoLa** (DCP) | Free official zoning map by address, BBL, BIN | Free | City product | None | KOANO reads the same PLUTO and zoning data and adds reasoning. ZoLa is the free baseline every NYC developer already has, so KOANO's zoning panel must clearly exceed it |
| **Envelope** | NYC 3D massing for any parcel, site search by available FAR, assemblage, stacking, City of Yes | Demo only | Marketed under First American (ownership unverified) | None | **The most direct NYC Development competitor.** Envelope shows the building. KOANO shows the risk and the verdict. KOANO's "Assemblage & Air Rights" section in the screening memo overlaps |
| **Tectmind**, **NYC ZoningAI** (nyczoning.ai), **Plotzy** ($180 or $300/mo), **ALPA** (a Claude skill computing envelopes from PLUTO, snippet) | NYC AI zoning answers | As stated | Unverified | LLM zoning Q&A | Cheap LLM zoning answers are now commodity. The ALPA Claude skill means a Claude user can get a PLUTO envelope for $20/mo. KOANO has to sell reasoning plus provenance plus documents, not "zoning answers" |
| **PermitFlow** | AI agents for permitting, inspections, licensing | Not public | $54M Series B, Accel (Dec 2025) | Agents on 12M+ municipal data points | Post-decision execution. A possible partner for "what happens after BUY" |
| **Symbium**, **Acres** (AI zoning search, Pro $124.99/mo), **Land id**, **LandTech** | Permitting, land search | As stated | Various | Varied | Peripheral |

---

## 5. Residential valuation and agent tools (KOANO Transaction and Community clusters)

| Company | What / who pays | Pricing | Corporate | AI | KOANO vs |
|---|---|---|---|---|---|
| **HouseCanary** | AVMs, data, ComeHome. Investors, agents, lenders, capital markets | Basic $19/mo, Pro $79, Teams $199, Enterprise custom. API $0.30 to $6 per call | Funding unverified | CanaryAI: photo-condition valuation, market summaries, refi propensity | National AVM coverage KOANO lacks. KOANO's NYC comps are DOF recorded sales, live, distance-ranked |
| **Local Logic** | Location scores on 250M addresses. Brokerages, MLSs, lenders | Not listed | C$17.5M Series B (2023, snippet) | **MCP server** (Sep 18, 2026) | Neighborhood narrative data. A feed for KOANO's client neighborhood report |
| **Zillow Pro** | Bundles Follow Up Boss, My Agent, Premium Agent Profiles. AI flags ready-to-move contacts. Nationwide by mid-2026 | FUB $69/user/mo to $1,000/mo | Public | Lead prioritization, drafting | Agent CRM and lead gen. KOANO's CMA is a deliverable, not a CRM. Low overlap, high distribution power |
| **Redfin** | Now "Redfin Powered by Rocket" (Rocket closed Jul 1, 2025). ChatGPT app around Feb 2026 | n/a | Rocket | Consumer AI | No dedicated pro agent tool found |
| **Cloud CMA** (Lone Wolf) | CMA builder, often bundled through MLS | "May already be included with your MLS" | Lone Wolf since 2020 | None mentioned | **The incumbent KOANO's white-label CMA replaces.** It is free to many agents through the MLS. KOANO's $149/mo must justify itself with reasoning and provenance, because Cloud CMA has MLS comps and KOANO does not |
| **RPR** (NAR) | Free to NAR members. **AI CMA in RPR Mobile** (Nov 2025, beta): comps scored 0 to 100, three pricing strategies, recalculates on comp edits | Free to members | NAR | AI CMA, ScriptWriter | **The most dangerous Transaction-cluster substitute: free, MLS-backed, with interactive comp scoring.** KOANO is behind on comp interactivity and data |
| **Restb.ai**, **Fello**, **Rechat** (MCP to ChatGPT and Claude, 2026), **Revaluate**, **Lofty** | Photo condition scoring, database AI, agent OS, mover prediction, CRM | Mostly unpriced | Various | Agentic CRM | Adjacent |

**Read.** The agent tool market is saturated, cheap or free, and MLS-native. KOANO's Transaction cluster is the weakest strategic position of the four because the core input (MLS comps) is paid and legally gated (CLAUDE.md section 08). It should be run as a distribution channel for the white-label CMA, not as a primary bet.

---

## 6. Risk and climate

| Company | What / who pays | Status | AI | KOANO vs |
|---|---|---|---|---|
| **First Street** | Property-level climate risk (flood, fire, wind, heat), public Risk Factor | **MSCI agreed to acquire** (announced Jun 24, 2026, $120M cash plus earnout, expected close Q3 2026). The site now shows an MSCI terms screen | Enterprise suite, global models (2025) | KOANO uses FEMA NFHL, FEMA NRI, OpenFEMA, NOAA normals, USGS, EPA (all live). That is regulatory-grade and free, but not forward-looking climate modeling. First Street is a natural `partner` feed |
| **Jupiter Intelligence** | Climate analytics for banks, energy, real estate (Fannie Mae, JLL, bp) | Active. "Almost $100 million" raised | ClimateScore Global, RiskSignal | Enterprise-only |
| **Moody's RMS / climate** | Catastrophe and physical-risk analytics. Bought CAPE Analytics (Jan 2025) | Active | Claims agentic AI | Possible acquirer of reasoning layers |
| **XDI** (Climate Risk Group), **ClimateCheck**, **ZestyAI** (500+ regulatory approvals, insurers), **Climate X** (Spectra, $13.5tn AUM claim), **Cotality climate**, **Riskthinking.ai** | Various | Active (Riskthinking status unclear) | Varied | KOANO should not build climate models. It should ingest one as `partner` and keep its own FEMA layer as the live baseline |

---

## 7. Horizontal AI assistants as substitutes

| Tool | Relevant capability | Price (verified where cited) | Why a pro uses it instead of KOANO | Why it is not KOANO |
|---|---|---|---|---|
| **Claude** | Research on all paid plans, projects, connectors. Claude for Excel, PowerPoint, Word GA. Directory connectors now include **Cotality** (Oct 2026). MCP lets a user wire in ATTOM, Regrid, CompStak, Green Street, Placer, TestFit | Pro $20/mo ($17 annual). Max from $100. Team $25 or $125 per seat | It reads their OM, builds the Excel model, queries the licensed data they already pay for, and costs $20 | Not deterministic. The same question can yield different numbers. No provenance state per figure. No coverage map. No immutable record. No calibration (my analysis) |
| **ChatGPT** | Deep research (Feb 2025), agent mode (Jul 2025), file analysis | Tier prices unverified (OpenAI pages returned 403) | Same as above, plus it is the default tool | Same limits. Hallucinated citations are documented |
| **Gemini** | Deep Research (free tier), Workspace integration | AI Pro $19.99/mo. Workspace Standard $14/user | Bundled with Workspace | Same |
| **Perplexity** | Pro deep research with premium sources (PitchBook, Statista). Comet browser | Pro $17/mo annual, Max $167/mo annual | Fast cited web research | Cites web pages, not parcel records. Same limits |

**The substitute threat is concrete.** A developer with Claude Pro, the ALPA PLUTO skill, a Regrid MCP key and Claude for Excel can assemble 60 to 70 percent of a KOANO site screen for about $20 plus metered data (my estimate from the capabilities cited above). KOANO's answer cannot be "we have the data." It has to be: **the answer is the same tomorrow, every number says where it came from and what is missing, the verdict math is shown and replayable, the document is ready to sign, and the record is kept**. That answer is defensible only if KOANO makes it visible and makes it the thing users pay for.

---

## 8. Diald AI vs KOANO: screen-by-screen teardown

Diald evidence: frames from `diald.ai/videos/how-it-works.mp4` (frame times in seconds), plus diald.ai, /score, /pricing and /faq. KOANO evidence: production screenshots `demo-kit/design-upload-2/dashboards/{community,transaction,development,portfolio}.png` (above the fold, captured 2026-09-30) and component code.

### 8.1 Diald's screens, as shown

**D1. Dashboard / new location (frames 6, 10, 14, 122).** Full-bleed pen-and-ink skyline (Chicago, labeled) with a single centered address bar under the serif headline "Every site has a story. Start with an address." Google Places autocomplete. Left rail: Ask Diald (primary CTA), Dashboard, Portfolios, Support, Getting Started, New Location, search, an "UNGROUPED 153" location list where each item carries a four-dot progress indicator and a next-step link ("Finish setup", "Unlock NIR", "Select comps"). A plan badge (PRO) and a usage meter ("8 deals"). A persistent "Report a bug" pill.

**D2. Conversational setup plus Overview (frames 18, 114, 118).** Chat on the left asks "What type of property is it?" and then "Do you have an Offering Memorandum (OM)?". On the right, Overview fills in progressively: a street map plus a Google Street View carousel, a Property Summary narrative, a Property Plan / Role / Created card and an **Analysis Progress** checklist (Property Research, Market Analysis, Comparable Sales, Findings and Insights, Financial Analysis, Investment Memo; 0/5 moving to 5/6 with View and Ready states). A Property Information grid (year built, area, tenancy, type, stories, parking).

**D3. Upload interstitial (frame 22).** "Upload whatever you've got." Accepted: PDF, Excel, PNG/JPG, Word (FAQ).

**D4. Persistent score header (frames 26, 30, 46, 50, 102, 114).** On every tab: an address pill with a kebab menu, a **Share** button, a skyline band, then two cards on the right: **Neighborhood Investment Rating** (giant green "A" with an A/B/C segmented scale and "What does this mean?") and **Diald Confidence Score** ("94%", "on 4.85% exit cap from today's 4.90% market rate (Moody's)", a "3-yr hold" chip, "What does this mean?"). Tabs: Overview, Investment Analysis, Documents, plus a Management on/off toggle.

**D5. Investment Analysis: Underwriting (frames 30, 38, 42, 34).** Sub-tabs Market Data, Comps, Qualitative | Underwriting, Executive Summary, Memo. "Screen: Quick Check" versus "Underwrite: Assumptions, Proforma". A version dropdown ("Aug 3, 2026, 1:36 PM", 2 versions). An orange "Update Executive Summary". **Estimated Value (comps) $1,790,057, range $1.25M to $2.33M, Diald's independent value from sales comps**, on a bar comparing "Diald value · comps | Broker asking · OM | Your price" ("your price $4.96M"). Deal Summary tiles: Confidence Score with exit cap, Purchase Price ($/SF), Levered IRR, Levered Avg Cash-on-Cash, Levered Equity Multiple. Operating strip: NOI CAGR, Going-in Cap, Yr 1 Cap, Stabilized Cap. Unlevered returns. **Lender warning banner**: "A lender would likely cap this loan near $3,539,286 ... The model is running on the sized loan" with "Use my loan amount anyway". Sources and Uses. "Dual Exit Scenarios: standardized 5-yr and 10-yr". **Download Excel**. Marketing frame 34: a Returns table "OM as presented | Your case (OM adjusted) | delta vs OM".

**D6. Market Data (frames 46, 50).** Market/Submarket toggle, 3Y/5Y/All, attribution "MOODY'S ANALYTICS". Snapshot tiles: Cap Rate (with "Moody's · Latest Available: 2025"), Asking Rent/SF, Effective Rent/SF (YoY and 3-yr CAGR), Vacancy, Completions, Net Absorption. A dual-axis chart, "Central/NE Phoenix Vacancy & Rent Trend" (Q1 2021 to Q1 2026), footer "Source: Moody's Market Trend Data".

**D7. Qualitative (frames 54, 58).** Numbered opportunity and risk cards ("Regional HQ Expansion Boosts Local Employment ...") and an empty risk column ("No material findings identified"). **"How the submarket has moved"**: a lollipop timeline of signals, opportunities up and risks down, sized by impact, with a "Momentum is net positive · 111 opportunities · 35 risks" chip and a net-momentum line. A **146-factor list** grouped by theme ("Income levels, affordability & economic mobility"), each row with distance from the asset, date and an impact meter, expanding into "Why it matters", "What we found" (bullet facts), Opportunity/Risk tag, Impact, Proximity, Reported date, a **source card** (for example "AZ Central") and an Ask Diald button.

**D8. Rating explainer (frame 62).** Popover: "Diald analyzed 5,563 source documents specific to this submarket and surfaced the 146 factors that matter most here: 111 in the asset's favor and 35 against it," with counters (5.6k source docs, 146 factors, 111 opportunities, 35 risks, 3 highlighted) and an Opportunity 76% / Risk 24% bar.

**D9. Confidence explainer (frame 66).** A modal with tabs (Diald Intelligence, Investment Rating, Confidence Score). Bands: 85%+ very high; 70 to 85 strong; 50 to 70 moderate; below 50 elevated risk. "The score moves when you change the exit cap rate or hold period in the pro forma; no other input moves it."

**D10. Comps (frames 74, 78, 102).** Sales Comps / Rent Comps toggle. A Mapbox map (3D, Satellite) next to a table (address, neighborhood, distance, sale date, value, size). "Locked · 4 of 38 comps selected · Unlock to edit". Hovering a row highlights it on the map. A pin popover with Selected checkbox, built year and class.

**D11. Ask Diald (frames 26, 30, 38, 86, 102).** A persistent left chat panel that explains derived figures ("How it's calculated: Equity invested ... Cash-flow return ... Exit proceeds ... exit cap-rate assumption of 4.95%"), with context footer "Grade A · 460 sales · 3 rent · 147 findings", 18 slash commands, Copy / Regenerate / Report, and "How this works". Marketing frame 82: "AI should explain itself."

**D12. Share (frames 90, 94).** "Share Location ... They can view it with a free Diald account," entered by email, with a Shared With list.

**D13. Memo (frames 98, 106, 110).** A navy cover with a figure-ground map, the address, asset type, "Neighborhood Quality Score A", "Diald Confidence Score 94/100", date and **engine version stamp "Engine vretail-3.47.0"**. Contents: 01 Overview, 02 Market Data, 03 Qualitative Findings (grade "94th percentile", Top 10 Signals, Neighborhood Summary, Opportunities Map), 04 Comparables (4 sales, 3 rent), 05 Pro Forma (Returns Summary, Sources and Uses, Operating Spreadsheet 11 yrs, Cash Flow and Returns, Financing and Amortization, Exit and Reversion, Underwriting Inputs, Returns Detail, Loan Sizing, Equity Waterfall). An in-app Executive Summary narrative with a Return Snapshot.

### 8.2 Defects visible in Diald's own demo (useful for competitive selling)

These are all from Diald's official marketing video. Each one is a case where a deterministic, single-source-of-truth system would not fail.

1. **Exit cap disagrees within one screen.** The header card reads "94% on 4.85% exit cap" while the Deal Summary card and the chat both say 4.95% (frames 30, 38, 102).
2. **Equity multiple disagrees between chat and tiles.** The tile shows 1.81x. The chat says "The equity multiple shown in the snapshot (1.92x)" and later admits "If you'd like to reconcile the two figures, let me know" (frames 38, 102).
3. **Stale state after an input change.** Purchase price shows $7.00M and Levered IRR 3.4%, while Sources and Uses in the same frame still shows a $4,995,996 purchase price and the same loan (frame 42).
4. **The "confidence" ignores price.** The Confidence Score stays a green "94%" when the purchase price moves from $5.00M to $7.00M and levered IRR collapses from 13.4% to 3.4% (frames 38 vs 42). By Diald's own definition only exit cap and hold move it (frame 66), so a big green 94% sits next to a 3.4% IRR.
5. **Score bands differ between the website and the app.** /score: 85%+, 75 to 85, 60 to 75, below 60. In-app modal: 85%+, 70 to 85, 50 to 70, below 50 (diald.ai/score vs frame 66).
6. **Naming and unit drift.** "Neighborhood Investment Rating" in the app becomes "Neighborhood Quality Score" on the memo cover. "94%" becomes "94/100". The /score page promises the rating has "No percentages, probabilities, or numeric scoring", yet the memo prints the grade as "94th percentile" (frames 106, /score).
7. **An unsourced "probability".** /score never discloses the calibration method, weights or validation results. The page says the score is "calibrated against comparable markets" without evidence.
8. **The qualitative layer is media-derived.** Factors come from "large-scale media analysis" (/score). One rendered factor claims a "median household income of $500,000" for Arcadia (frame 54). I could not verify that figure, and it looks implausible for a neighborhood median. An unverified news claim feeding an "A" grade is exactly the failure KOANO's provenance system exists to prevent.

### 8.3 Side by side: Diald screen vs KOANO equivalent

| # | Diald screen | KOANO today | State | Verdict |
|---|---|---|---|---|
| 1 | D1 Home: one address bar, skyline art, location list with progress and next step, usage meter | Each cluster dashboard has its own address bar and Run button (`community.png`, `transaction.png`). Sidebar shows a cluster switcher with confusing labels: "C4 · Property intelligence" over a page numbered "01", "C1 · Development" over "04", "C3 · Portfolio" over "05", plus "Your home cluster is C2" (`Sidebar.tsx:96,114`, `clusters.ts:5-10,34-66`). No saved-location list with next-step nudges. No usage meter in the screenshots | PARTIAL | **Diald wins.** KOANO's badge-vs-number mismatch is a self-inflicted confusion on the first screen |
| 2 | D2 Conversational intake plus progressive Overview and Analysis Progress checklist | `VerdictWorkbench.tsx` streams agent-by-agent progress (`useVerdictStream.ts`). No intake of plan, role or hold. No Street View | PARTIAL | Diald wins on onboarding warmth. KOANO's agent progress is a real asset that is under-shown |
| 3 | D3 Upload OM, Excel, images, Word | None | MISSING | **Diald wins outright** |
| 4 | D4 Persistent two-card score header on every tab | Community shows a strong verdict card (HOLD, confidence 80/100, window 12 mo, risk 50/100, LIVE, a deterministic narrative citing "confidence-weighted score of -0.19", `community.png`) but **below the map**, not persistent. Transaction shows no verdict above the fold, only six market tiles (`transaction.png`). Development shows verdict in a ranking table. Portfolio shows "BUY · 68" in a row | PARTIAL | KOANO's content is *more honest* (it states the math). Diald's *placement* is better. KOANO must make the verdict the persistent header |
| 5 | D5 Underwriting: value-from-comps vs ask vs your price, returns tiles, lender sizing, sources and uses, dual exit, Excel | Development "Pro forma" sidebar item points to `c4-proforma`, which shows representative benchmarks only (land cost/BSF, construction cost/SF, exit cap, absorption) badged non-live (`cluster4/SitePanels.tsx:153-175`). The IC memo financial sections are placeholders (`registry.ts`) | MISSING | **Diald wins decisively. This is the single biggest gap** |
| 6 | D6 Market data from Moody's with time-range toggle and trend chart | Transaction "Market velocity": FHFA HPI 5.7% yoy, 154 recorded sales, $1,231 median $/SF, 12.8 sales/mo, HMDA +2.1%, QCEW -5% jobs, each LIVE with its source named (`transaction.png`, `MarketVelocityPanel.tsx`). `PermitTrend.tsx` and `ArchiveTrend.tsx` exist | PARTIAL | KOANO wins on provenance and public-record breadth. Diald wins on CRE-specific market data (rents, vacancy, absorption, cap rates) and charting |
| 7 | D7 Qualitative signal timeline and 146-factor list with sources | Monitoring feed (`cluster5/MonitoringFeed.tsx`) diffs archived public data weekly. Permits, violations and HPD panels list records. No unified "how the block moved" timeline | PARTIAL | Diald wins on presentation. KOANO has *better raw material* (structured, dated, parcel-joined public records rather than news sentiment) and does not show it as a timeline |
| 8 | D8/D9 "What does this mean" explainers | `VerdictMathPanel` shows reproducible verdict math. `ProvenanceLedger` shows value, provenance and source for each figure. `CoverageMap` shows per-layer states and the feed that would fill each gap | EXISTS | **KOANO wins on substance.** Diald explains a black box with prose and contradicts itself. KOANO shows the arithmetic. It must surface this from the header in one click |
| 9 | D10 Comps map plus table, lock/unlock, select 4 of 38, rent comps | Comps map with $/SF gradient legend (`transaction.png`, `community.png`), `CompsScatter.tsx`, `CmaBuilder.tsx`. Comps are live NYC DOF recorded sales, distance-ranked (CLAUDE.md section 07). No include/exclude interaction seen. No rent comps | PARTIAL | Diald wins on interaction. KOANO wins on provenance (recorded deeds vs licensed aggregates) |
| 10 | D11 Ask Diald chat grounded in the model | None | MISSING | Diald wins, but its chat contradicts its own tiles. A KOANO chat that only cites verdict facts and re-runs deterministic functions would beat it |
| 11 | D12 Share via free viewer account | Documents download through `DocumentButton.tsx`. No share link | MISSING | Diald wins. Its share is a growth loop |
| 12 | D13 Memo PDF with engine version stamp, 5 chapters, full pro forma | IC memo PDF and DOCX with title and recommendation, exec summary, property, market, risk, comps, then **four placeholder sections**, exhibits, provenance appendix (`registry.ts`). Plus 14 other document types. Disclaimer on every page, enforced by regression (`implemented.ts` header) | PARTIAL | Diald wins the IC memo. KOANO wins on breadth of audience documents and on the provenance appendix |
| 13 | Multi-site comparison | Development: up to three sites, risk-adjusted ranking table (rank, verdict, confidence, risk, entitlement risk, window, provenance), map with OZ tract and lot polygons, "Verdict math, side by side" (`development.png`, `cluster4/SiteComparison.tsx`, `SiteMathStrip.tsx`) | EXISTS | **KOANO wins outright.** Diald has portfolios but no comparison screen in any public material |
| 14 | Portfolio and monitoring | Diald: monitor 1 to 6 properties, monthly alerts (pricing, FAQ). KOANO Portfolio: map colored by risk band, holdings table with BBL, latest verdict, risk, provenance, as-of date, Re-run, a note that the audit trail is append-only, a Monday briefing generator (`portfolio.png`), weekly deterministic diff and Monday email (CLAUDE.md 07B) | EXISTS | **KOANO wins** on cadence and auditability. Visible weakness: the only holding renders as "Location unverified" (dashed pin) next to a LIVE badge (`portfolio.png`), which reads as a contradiction even if technically correct |
| 15 | Zoning and entitlement | Diald: "zoning changes" appear as tracked qualitative signals only (Aug 2026 release) | KOANO: PLUTO FAR headroom, special districts, City of Yes fields, deterministic entitlement risk blend (`lib/agents/entitlement.ts`), entitlement risk memo, as-of-right envelope, assemblage and air rights section | EXISTS | **KOANO wins outright in NYC** |
| 16 | Coverage | Diald: any US address, five asset types | KOANO: NYC fully live. Elsewhere partial, rolling up `coverage_absent` | PARTIAL | Diald wins nationally. KOANO's honesty about it is a feature only if the gap closes for paying users (BYO MCP) |

**Scorecard.** Of 16 rows, Diald wins 9 (1, 2, 3, 5, 9, 10, 11, 12, 16), KOANO wins 5 (8, 13, 14, 15, plus the substance of 6), and 2 are split (4, 7). The rows Diald wins are mostly **buildable in months**. The rows KOANO wins are **architectural and slow to copy** (determinism, replay, provenance taxonomy, parcel joins, archive). That asymmetry is the strategic opportunity.

One visual judgment from the screenshots: KOANO's dashboards are clean and legible but feel generic next to Diald's. They are a monospace-eyebrow SaaS layout with large blank right gutters at 1440 to 2000px (all four screenshots leave about 25% of the width empty), and a map is the hero on three of four dashboards. Diald's illustrated skyline band, serif display and persistent score cards give it a recognizable product face. KOANO's locked font is not the problem. The issue is composition: the verdict is not the hero and the canvas is under-used.

### 8.4 Exactly what KOANO must ship to win the Diald comparison decisively

Ranked by impact on enterprise value. Effort and impact estimates are mine.

| Rank | Ship | Why it beats Diald | State | Effort | Impact |
|---|---|---|---|---|---|
| 1 | **Deterministic underwriting engine (KOANO Returns).** User-entered or OM-extracted assumptions (price, rent roll, opex, debt, hold, exit cap) produce NOI, going-in and stabilized cap, levered and unlevered IRR, equity multiple, cash-on-cash, DSCR, DSCR- and LTV-based loan sizing, sources and uses, 5- and 10-yr exits. Every assumption carries provenance: `live` (for example Freddie PMMS for the rate), `partner` (BYO CompStak, Green Street), `representative` (labeled), or user-supplied attribution. Fills the four IC memo placeholders | Diald's model visibly desyncs (8.2 items 1 to 3). Pure functions replayed by the existing fixture cannot desync. Unlocks the IC memo and the blocked pro forma document | MISSING | L | 10 |
| 2 | **BYO-credential MCP partner providers** (ATTOM, Regrid, CompStak, Cotality, Green Street first), mapped to the `partner` provenance state, with the `=== 'live'` render gates switched to `isTrustedProvenance` (CLAUDE.md section 06 warning) | Removes Diald's national-coverage advantage without KOANO paying for licenses. Proves the "reasoning layer data plugs into" exit thesis on screen | MISSING | L | 10 |
| 3 | **Verdict-first persistent header** on all four dashboards: verdict word, confidence, risk, window, overall provenance, coverage-gap count, and one click to `VerdictMathPanel` / `CoverageMap`. Move maps below it | Matches Diald's strongest UI pattern and swaps its black-box score for shown arithmetic | PARTIAL | S | 9 |
| 4 | **OM, rent roll and T-12 ingestion** with field-level extraction, each extracted value attributed to "user document, page N", shown alongside live public-record checks (for example the OM's lot area vs PLUTO lot area, OM units vs DOB certificate of occupancy, OM taxes vs DOF assessment). LLM extracts, deterministic code reconciles | Diald accepts uploads but shows no reconciliation. "The OM says X, the public record says Y" is the most valuable sentence in acquisitions diligence, and KOANO is the only product with the NYC public record already joined to the lot | MISSING | M | 9 |
| 5 | **Ask KOANO, a constrained chat.** Answers only from the verdict record, provenance ledger and engine functions. What-ifs re-run the deterministic engine and create a new, separately labeled scenario row in the append-only table. The verdict never changes silently. Every answer cites ledger rows | Diald's chat contradicts its tiles (8.2 item 2). KOANO's would be the first chat whose numbers are provably the same as the dashboard's | MISSING | M | 8 |
| 6 | **Visible consistency guarantee.** A "Numbers reconciled · engine vX · replay hash" stamp on dashboard and documents, backed by the existing record/replay fixture and the immutable verdicts table | Diald stamps an engine version but still contradicts itself. KOANO can make reproducibility a visible, sellable feature | PARTIAL (exists in the backend, invisible in the UI) | S | 8 |
| 7 | **Interactive comps.** Include/exclude, lock, a hover-row-to-pin sync, deterministic re-pricing, and an audit row recording which comps the user removed and why | Matches RPR's free AI CMA and Diald's comp selection while keeping the audit trail neither has | PARTIAL | M | 7 |
| 8 | **"How the block moved" timeline.** Permits, violations, sales, zoning and HPD events from the archive on one dated lollipop timeline, opportunities up and risks down, each event a provenance-tagged public record | Beats Diald's media-sentiment timeline with structured records. Showcases the archive moat | PARTIAL (data exists) | M | 7 |
| 9 | **Share and reviewer seats.** A link to a read-only verdict and document view with the provenance ledger intact. Free viewer accounts | Copies Diald's growth loop. For institutions, reviewer seats are how IC members touch the product | MISSING | M | 7 |
| 10 | **Excel export** of verdict math, comps, ledger and (after item 1) the returns model, with provenance columns | Analysts live in Excel. Diald and Henry both export | MISSING | S | 6 |
| 11 | **Fix the cluster labeling** (badge vs number vs cluster_id) and the empty right gutter. Use the canvas for the persistent header plus an evidence rail | Removes a first-screen confusion Diald does not have | PARTIAL | S | 5 |
| 12 | **Published calibration page.** Past verdicts vs observed outcomes from the archive's outcome scanner, with honest sample sizes and "insufficient data" where true | Diald calls its score a "probability" with no published calibration. KOANO publishing even an early, honest calibration record is a category move | VISION (needs outcome history; the archive started Aug 2026) | M now, compounding | 9 |

Items 1, 2 and 3 together close Diald's advantage on depth and coverage. Items 4, 5 and 6 then make KOANO the product that does the same things *without contradicting itself*. That is the decisive win, and it is the claim a Diald user can check in five minutes.

---

## 9. Feature matrix: KOANO vs the top 12

Legend: Y = shipping per a retrieved source; P = partial or announced/planned; N = not offered per available sources; ? = could not verify. KOANO cells cite repo state.

| Capability | **KOANO** | Diald | Henry AI | Dealpath | ARGUS (Altus) | Cherre (RealPage) | CoStar | Crexi | TestFit | Zoneomics | Deepblocks | HouseCanary | Claude / ChatGPT |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Address-to-verdict (single go/no-go call) | Y | P (grade plus score, no verdict) | N | P (screening tear sheet) | N | N | N | N | N | N | N | N | P (unstructured) |
| Deterministic, replayable decision math | **Y** (synthesis, fixture) | ? (undisclosed) | ? | ? | Y (DCF engine) | ? | n/a | ? | Y (geometry) | ? | ? | ? | N |
| Per-figure provenance state | **Y** (5 states) | P (source labels on charts and findings) | P ("each figure sourced") | ? | ? | ? | ? | ? | ? | P (cited sources) | P (ordinance links) | ? | P (citations) |
| Coverage-gap map naming the missing feed | **Y** | N | N | N | N | N | N | N | N | N | N | N | N |
| Immutable append-only decision record | **Y** | P (versions, engine stamp) | ? | Y (pipeline history) | ? | ? | n/a | ? | ? | ? | ? | ? | N |
| Published outcome calibration | P (archive and scanner, nothing published) | N (claimed, not published) | N | N | N | N | N | N | N | N | N | ? | N |
| Parcel zoning / FAR headroom / entitlement risk | Y (NYC) | P (signals only) | N | N | N | ? | N | N | Y (Site Intelligence) | Y (national) | Y | N | P (via skills/MCP) |
| Municipal record (permits, violations, ownership) joined to lot | Y (NYC) | P (monitoring mentions zoning, crime) | N | N | N | P (data integration) | P | N | N | N | N | N | P (via MCP) |
| Multi-site comparison | **Y** | N (not shown) | ? | P (pipeline compare) | ? | ? | N | N | P | N | ? | N | P |
| Pro forma / returns | **N** (blocked, placeholders) | Y | Y | P (planned scenarios) | Y | N | N | N | Y (add-on) | N | Y | N | P (via Excel) |
| OM / rent roll / T-12 extraction | **N** | Y | Y | Y | ? | N | Y (lease abstraction internally) | Y (Vault) | N | N | N | N | Y |
| Grounded conversational assistant | **N** | Y | Y | Y (MCP, Excel assistant) | Y (Assist) | Y (Agent.STUDIO) | N (CRE suite) | Y | Y (via MCP) | Y (Bassett) | P (AIM Oct 2026) | Y (CanaryAI) | Y |
| IC memo generation | P (4 placeholder sections) | Y | Y (deal package) | P (planned) | ? | ? | N | P (OM generation) | N | N | N | N | Y (unstructured) |
| White-label CMA | **Y** | N | N | N | N | N | N | N | N | N | N | P (reports) | P |
| Weekly monitoring / alerts | Y (weekly, deterministic diff) | Y (monthly) | ? | Y | ? | ? | ? | ? | N | ? | ? | ? | N |
| MCP / API out | N | P (research API for educators) | ? | Y (MCP) | ? | P | N | ? | Y (MCP) | Y (API) | ? | Y (API) | n/a |
| Licensed proprietary comps | N (NYC DOF live, mocks elsewhere) | Y (Moody's, Green Street, LightBox) | ? | Y (MSCI RCA) | ? | P | **Y** | Y | N | N | ? | Y | P (via MCP) |
| National live coverage | P (federal layers national, municipal NYC only) | Y | Y | Y | Y | Y | Y | Y | Y | Y | P (city-by-city) | Y | Y |
| Excel export | N | Y | Y | Y | Y | ? | Y | ? | ? | ? | ? | ? | Y |
| Share / reviewer seats | N | Y | ? | Y | Y | ? | Y | ? | Y | P (white-label) | ? | Y (Teams) | P |
| Entry price (public) | $19 to $1,499/mo | $0 to $200/mo | Not public | Not public | Not public | Not public | Not public | $299/mo (snippet) | $195/mo to $20k/yr | $92 to $279/mo | $99.99 to $499.99/mo | $19 to $199/mo | $20/mo |

**What the matrix says.** KOANO is the only product with a Y on all four integrity rows (deterministic math, per-figure provenance, coverage map, immutable record). It is also one of very few with an N on pro forma, extraction, chat, Excel and sharing, which are now table stakes. KOANO has built the hard, rare half of the product and left the common, expected half for later.

---

## 10. Positioning map

**Axis X: auditability of the conclusion.** Left: output is narrative or a score whose derivation cannot be reproduced or inspected. Right: the conclusion is computed deterministically, every input has a labeled provenance, gaps are named and the run replays. *Why this axis:* institutional buyers, lenders and IC committees face liability for unverifiable output (CLAUDE.md section 08, Cluster 5). Horizontal AI is commoditizing everything to the left of this axis. It is the axis on which an acquirer's data becomes more valuable after acquisition.

**Axis Y: distance to the decision.** Bottom: raw data or search. Middle: analysis and tools. Top: a finished decision artifact (verdict plus the signed document). *Why this axis:* the 2024 to 2026 money is going to products that end in a deliverable (Henry's $16.5M, Diald's memo, Dealpath AI Studio). Data owners sit at the bottom and are moving up through MCP.

Placements are my judgment from the cited capabilities.

```mermaid
quadrantChart
    title Real estate decision tools, auditability vs distance to decision
    x-axis Opaque conclusion --> Auditable, replayable conclusion
    y-axis Raw data --> Finished decision artifact
    quadrant-1 Auditable decisions (white space)
    quadrant-2 Fast but unverifiable decisions
    quadrant-3 Opaque data and chat
    quadrant-4 Trusted data, no decision
    KOANO today: [0.86, 0.62]
    KOANO with returns plus BYO MCP: [0.88, 0.88]
    Diald: [0.32, 0.80]
    Henry AI: [0.38, 0.84]
    Dealpath AI: [0.50, 0.62]
    ARGUS Assist: [0.66, 0.66]
    Claude or ChatGPT: [0.18, 0.55]
    Perplexity: [0.22, 0.40]
    CoStar: [0.62, 0.14]
    MSCI RCA: [0.64, 0.18]
    CompStak MCP: [0.58, 0.22]
    Cotality MCP: [0.62, 0.20]
    TestFit: [0.70, 0.50]
    Zoneomics Bassett: [0.48, 0.42]
    Keyway: [0.52, 0.70]
```

Reading the map:
- **Quadrant 2 (fast, unverifiable decisions)** is crowded and well funded: Diald, Henry, and horizontal AI drifting upward.
- **Quadrant 4 (trusted data, no decision)** is the incumbents, now pushing their data into quadrant 3 assistants through MCP.
- **Quadrant 1 is nearly empty.** ARGUS is the closest incumbent (a deterministic DCF, but on user inputs with no public-record reasoning or provenance per figure). KOANO today sits right of everyone but only mid-height, because it stops before returns and a complete IC memo. Shipping items 1, 2 and 4 from section 8.4 moves KOANO into the top-right corner alone.

---

## 11. The white space

**What no one in this market does:** sell a **verifiable decision record for a real estate decision**. Concretely, a single object that is all of the following:

1. **Computed, not generated.** The verdict, confidence, risk and window come from deterministic code over named facts. The LLM narrates and extracts, never decides. *KOANO: EXISTS* (`synthesis.ts`, `confidence.ts`, `direction.ts`, `entitlement.ts`). Diald's score derivation is undisclosed. Henry, Keyway and Fifth Dimension generate memos.
2. **Honest about what it does not know**, at the level of each layer: live, partner, representative, failed or uncovered, each naming the feed that would fill it. *KOANO: EXISTS* (`provenance.ts`, `CoverageMap.tsx`). No competitor in this file shows a coverage map.
3. **Reproducible.** The same inputs give byte-identical decision output, proven by a replay fixture. *KOANO: EXISTS in the backend, invisible to users.*
4. **Kept.** It is appended to an immutable record that a regulator, LP or IC can audit later. *KOANO: EXISTS* (append-only `verdicts`).
5. **Scored against reality.** Past verdicts are compared with observed outcomes and the calibration is published. *KOANO: PARTIAL / VISION* (archive since Aug 2026 plus the outcome scanner. Nothing published yet). Diald calls its number a "probability" and publishes nothing. **This is the claim nobody in the market can make, and time is the only way to earn it.**
6. **Turned into the document each audience signs**: IC memo, screening memo, white-label CMA, tax appeal packet, portfolio risk report, each with a provenance appendix and disclaimers enforced by regression. *KOANO: EXISTS for 15 types. The IC memo is PARTIAL.*
7. **Neutral about whose data it reasons over.** Licensed feeds plug in under their own name (`partner`), and the reasoning stays identical. *KOANO: architected, MISSING in practice.*

**Why KOANO is uniquely placed.**
- Items 1 to 4 are architectural. They are expensive to retrofit into a product built chat-first (Diald, Henry) or data-first (CoStar, Cotality), because those products' outputs were never designed to replay.
- Item 5 compounds with time and "cannot be bought retroactively". KOANO's archive start date is a real head start over anyone who starts later.
- Item 7 is now technically cheap because the data owners shipped MCP servers in 2026 (ATTOM, Cotality, Green Street, CompStak, Regrid, Placer). It is strategically valuable because it makes KOANO the *buyer-neutral* reasoning layer. A CoStar, MSCI, Cotality or Altus can acquire it and plug in its own data on day one, which is the stated exit thesis.
- The NYC public-record depth (zoning, permits, violations, ownership joined to the BBL) gives KOANO a grounding source that media-sentiment products like Diald do not have. It is the reconciliation target for every uploaded OM.

**The one-sentence position this implies:** *KOANO is the only real estate AI whose answer you can replay, audit and score against what actually happened.*

---

## 12. Top 10 problems (competitive lens, ranked)

| # | Problem | Evidence | Effort | Impact |
|---|---|---|---|---|
| 1 | No returns or pro forma. The IC memo's financial core is placeholders, so KOANO cannot answer "does this deal pencil", the first question every Diald, Henry or ARGUS user asks | `registry.ts` IC memo sections; `pro_forma_summary` blocked; `SitePanels.tsx:153-175` | L | 10 |
| 2 | No document ingestion. Institutional underwriting starts from the OM, and every funded 2024 to 2026 entrant extracts from it | No upload path in dashboard components; Diald FAQ; Henry, Keyway, Crexi Vault, Dealpath AI Extract | M | 9 |
| 3 | National coverage gap, while data owners now sell MCP access that KOANO does not consume | CLAUDE.md section 07 "Geographic scope"; ATTOM, Cotality, CompStak, Regrid MCP sources | L | 9 |
| 4 | KOANO's best features are invisible. Replay, verdict math and coverage map sit below the fold or deep in tabs, while Diald puts its (weaker) scores in a persistent header | Four dashboard screenshots; Diald frames 26, 46 | S | 9 |
| 5 | Price-value mismatch versus Diald for small investors: Diald Pro is $100 for 6 underwritten deals, KOANO Development is $499 with no returns model | diald.ai/pricing; `src/app/pricing/page.tsx:9` | S (pricing) / L (value) | 8 |
| 6 | Substitution by Claude or ChatGPT plus MCP data plus Excel at about $20/mo for users who do not value auditability | Section 7 sources | M (positioning) | 8 |
| 7 | No chat, no comp interaction, no what-if. KOANO feels static next to Diald and RPR's free AI CMA | Absent in components; RPR AI CMA | M | 7 |
| 8 | Transaction cluster is structurally weak: free MLS-native substitutes (RPR, Cloud CMA bundled with MLS) and no MLS comps | NAR RPR article; cloudcma.com; CLAUDE.md section 08 Cluster 2 | M | 6 |
| 9 | No share or collaboration loop, so no viral or IC-reviewer surface | Absent; Diald share frames 90, 94 | M | 6 |
| 10 | First-screen confusion and visual genericness: cluster badges mismatched with page numbers, near-flat risk scores (50, 51, 50/100 across sites), a "Location unverified" pin beside a LIVE badge | `Sidebar.tsx:114`, `clusters.ts:34-66`; `development.png`, `community.png`, `portfolio.png` | S | 5 |

## 13. Top 10 opportunities (ranked)

| # | Opportunity | Why now | State | Effort | Impact |
|---|---|---|---|---|---|
| 1 | Become the BYO-credential reasoning layer over MCP data (`partner` provenance) | Data owners shipped MCP in 2026. Acquirers (RealPage/Cherre, Fitch/Trepp, MSCI/First Street, Altus/Valos) are buying AI-ready layers | MISSING | L | 10 |
| 2 | Deterministic returns engine with provenance per assumption | Closes the largest gap and makes the IC memo complete | MISSING | L | 10 |
| 3 | Publish calibration, even early and honest | Diald's unpublished "probability" invites the contrast. Nobody publishes calibration | VISION | M | 9 |
| 4 | OM-vs-public-record reconciliation ("the OM says 12 units, the C of O says 10") | Unique to KOANO's NYC parcel joins. An instant demo for brokers and IC committees | MISSING | M | 9 |
| 5 | Verdict-first persistent header plus a visible replay stamp | Cheap, and puts KOANO's moat on screen | PARTIAL | S | 9 |
| 6 | Integrate rather than compete with system-of-record tools: push verdict plus memo into Dealpath (MCP), export ARGUS-ready inputs, link to TestFit for yield | Dealpath and TestFit already expose MCP. Institutions will not leave Dealpath or ARGUS | MISSING | M | 8 |
| 7 | Constrained "Ask KOANO" that cannot contradict the dashboard | Diald's demo shows the failure mode on camera | MISSING | M | 8 |
| 8 | NYC Development wedge versus Envelope, ZoLa and LLM zoning bots: risk plus verdict plus documents, City of Yes aware | Envelope shows massing without reasoning. LLM zoning answers are commoditized | EXISTS (deepen) | M | 7 |
| 9 | Archive-powered "how the block moved" timeline and monitoring as the retention engine | Diald monitors monthly from media. KOANO monitors weekly from records | PARTIAL | M | 7 |
| 10 | Education channel (Diald is proving that MRED programs adopt AI underwriting) | Diald LinkedIn posts: Notre Dame, USC, UW-Madison | MISSING | S | 4 |

## 14. What I would rebuild first

The **Development dashboard as an underwriting workspace**: verdict header on top; site comparison; for the chosen site, a returns panel driven by user and OM assumptions, each with provenance; an OM-vs-record reconciliation panel; and a one-click IC memo with no placeholders. Development is KOANO's deepest live-data slice (CLAUDE.md section 08 calls it "the sharpest wedge"). It is where Diald, Envelope, TestFit and Deepblocks each cover only part of the job, and it is the screen an acquirer would demo.

## 15. The "I have never seen anything like this" moment

Upload an OM for a Brooklyn building. Within a minute KOANO shows three columns: **what the broker claims**, **what the public record says** (live DOB, DOF, PLUTO and HPD with provenance chips), and **what that does to the returns**, with each discrepancy recomputing a deterministic IRR. At the top sits a verdict with a replay hash and a link to "how our past BUY calls in this community district actually performed". Nobody in this landscape can show that screen, because it needs a parcel-joined public record, deterministic math, provenance on every figure and an outcome archive at the same time.

## 16. Grounded findings vs VISION (separation)

- **Grounded (repo today):** sections 8.3 states, 9 KOANO column, problems 1 to 10.
- **VISION:** published calibration (needs outcome history), national municipal-record parity (needs partner data), OM reconciliation outside NYC (needs partner parcel and permit data).

---

## Discrepancies vs the brief

1. **Cluster numbering.** The brief describes four clusters by audience. In the UI, the sidebar badge uses a separate positioning order: developers "C1", agents "C2", institutions "C3", community "C4". The page eyebrow uses the cluster_id ("01", "02", "04", "05"). A user sees "C1 · Development intelligence" above a page numbered "04" (`src/components/dashboard/clusters.ts:5-10,34-66`, `Sidebar.tsx:114`, `development.png`). CLAUDE.md section 10 documents the decoupling as intentional. It is still a user-facing inconsistency, because both indices appear on the same screen.
2. **Document counts.** The brief says "Several of the 16 planned document types are live." The code has 15 implemented (`lib/documents/implemented.ts`) and 1 blocked (`pro_forma_summary`), so 16 declared and 15 live, which is more than "several". The IC memo is "live" but four of its sections are placeholders (`lib/documents/registry.ts`, IC memo sections).
3. **Neural map on Portfolio.** CLAUDE.md section 08 still says the neural map is the "full-screen, default hero" of Cluster 5. CLAUDE.md section 03 (Phase 4) says it was retired from dashboards, and the Portfolio screenshot shows a Mapbox risk map as the hero. The code and screenshots win. Section 08 is stale.
4. **Transaction comps.** The brief and CLAUDE.md section 08 say Transaction comps are `representative` until MLS is funded. CLAUDE.md section 03 and section 07 say NYC comps are live DOF recorded sales, distance-ranked, and the Transaction screenshot badges them LIVE. Outside NYC they are uncovered rather than representative.
5. **Pricing.** Matches the brief ($19, $149, $499, $1,499 in `src/app/pricing/page.tsx:9`).

---

## Sources

### Retrieved directly (page fetched and read)

Diald AI
- https://www.diald.ai/
- https://www.diald.ai/pricing
- https://www.diald.ai/score
- https://www.diald.ai/faq (answers extracted from the page payload)
- https://www.diald.ai/for-educators
- https://www.diald.ai/demo
- https://www.diald.ai/sample (signup gate only)
- https://www.diald.ai/videos/how-it-works.mp4 (product video, 2:15, frames extracted)
- https://finance.yahoo.com/real-estate/articles/diald-launches-conversational-ai-underwriting-140000978.html
- https://commercialobserver.com/2025/12/diald-ai-early-stage-funding/
- https://www.proptechbuzz.com/news/diald-ai-unveils-ai-powered-investment-memo-tool-for-commercial-real-estate
- https://www.saasrise.com/deals/diald-raises-10m-in-follow-on-funding-led-by-feedback-ventures-19062e2c-3713-4402-89a1-35ff7d0816d7
- https://www.linkedin.com/company/diald-hq

AI underwriting and deal tools
- https://www.prnewswire.com/news-releases/henry-ai-raises-4-million-in-seed-funding-to-automate-commercial-real-estate-transactions-302380986.html
- https://www.mannpublications.com/mannreport/2026/07/29/henry-ai-raises-16-5m-series-a-and-launches-henry-deal/
- https://commercialobserver.com/2026/09/henryai-henry-deal/
- https://www.henry.ai/
- https://thenextweb.com/news/carbonai-12m-cre-lending-agents
- https://proptechconnect.com/fifth-dimension-raises-26m-series-a-for-the-platforms-agentic-ai-capabilities-for-real-assets-investment-decisions/
- https://proptechconnect.com/cadastral-raises-95-million-to-build-vertical-al-platform-for-commercial-real-estate/
- https://commercialobserver.com/2026/05/multifamily-deal-diligence-rely-fundraise/
- https://news.crunchbase.com/real-estate-property-tech/cambio-cre-ai-asset-management-saas-software-funding/
- https://www.archer.re/
- https://www.archer.re/pricing
- https://www.mannpublications.com/mannreport/2024/06/11/archer-supercharges-multifamily-analysis-platform/
- https://www.clik.ai/
- https://www.zonestartups.com/2019/05/28/clik-ai-raises-round-of-2m-to-expand-technology-and-rd/
- https://keyway.ai/
- https://www.gunder.com/news/keyway-raises-15m-series-seed-financing
- https://finledger.com/articles/keyway-raises-25m-series-a-for-smaller-cre-transactions/
- https://smartcapitalcenter.com/faq
- https://www.leni.co/
- https://tech.eu/2022/06/30/london-proptech-proda-nabs-8-million-to-scale-rent-roll-data-platform/
- https://www.blooma.ai/
- https://www.businesswire.com/news/home/20210608005700/en/Blooma-Raises-15-Million-in-Series-A-Funding-Led-by-Canapi-Ventures
- https://www.v7labs.com/agents/ai-real-estate-investment-committee-memo-agent
- https://build.inc/learn/investment-committee-memo
- https://www.bisnow.com/news/national/technology/online-cre-financing-platform-raises-30m-series-a-round-109598
- https://gowercrowd.com/podcast/underwriting-cre-at-speed-with-ai
- https://www.ewor.com/startups/cactus
- https://www.hellodata.ai/help-articles/what-is-enodo-multifamily-underwriting-software
- https://www.multifamilyexecutive.com/technology/grace-hill-acquires-hellodata-to-bolster-multifamily-market-intelligence_o
- https://www.jll.com/en-ae/newsroom/jll-announces-acquisition-of-proptech-company-skyline-ai
- https://ir.jll.com/news-releases/press-release-details/2024/JLL-Falcon-kicks-off-new-era-of-AI-powered-CRE-innovation/default.aspx
- http://blog.cherre.com/2025/07/14/cherre-launches-agent-studio/
- https://digital-release.wowktv.com/business/press-releases/cision/20260513LA58250/crexi-expands-crexi-ai-capabilities-to-help-cre-professionals-work-faster-and-close-deals-more-efficiently
- https://www.dealpath.com/?p=22739
- https://www.dealpath.com/
- https://therealdeal.com/new-york/2022/09/08/deal-management-platform-dealpath-raises-43m-series-c/
- https://www.altusgroup.com/press-releases/altus-group-introduces-argus-intelligence
- https://www.altusgroup.com/fr/press-releases/altus-group-unveils-argus-assist-the-first-ai-powered-experience-within-the-argus-intelligence-platform/
- https://markets.financialcontent.com/custercountychief/article/gnwcq-2026-4-14-altus-group-unveils-argus-assist-the-first-ai-powered-experience-within-the-argus-intelligence-platform
- https://www.bisnow.com/news/national/technology/firm-behind-argus-swaps-ceo-as-it-ends-strategic-review-hits-critical-inflection-point-131775
- https://www.credaily.com/briefs/altus-group-explores-sale-amid-strong-private-equity-interest/
- https://www.altusgroup.com/press-releases/altus-group-announces-the-sale-of-its-canadian-appraisals-business-to-newmark/
- https://www.finanznachrichten.de/nachrichten-2026-08/69211439-altus-group-limited-altus-group-announces-sale-of-its-development-advisory-business-to-newmark-399.htm
- https://www.altusgroup.com/fr/press-releases/altus-group-acquires-valos-an-ai-powered-platform-that-connects-uks-valuers-and-lenders-in-the-property-valuation-workflow/
- https://www.nasdaq.com/press-release/cushman-wakefield-adopts-argus-intelligence-enhance-data-driven-insights-2026-01-21
- https://fintech.global/2025/06/17/private-markets-platform-juniper-square-secures-130m-series-d/
- https://irei.com/news/juniper-square-announces-series-d-financing-round-at-1-1b-valuation/
- https://www.alternativeswatch.com/2026/06/02/juniper-square-launch-headless-gpx-ai-agent-friendly-service/
- https://www.northspyre.com/
- https://www.businesswire.com/news/home/20220211005112/en/Northspyre-Raises-25-Million-in-Series-B-Funding-To-Fuel-Its-AI-Powered-Solution-for-Real-Estate-Developers
- https://agorareal.com/

CRE data and analytics
- https://www.sec.gov/Archives/edgar/data/1057352/000105735226000012/q42025earningspressrelea.htm
- https://www.bisnow.com/news/national/commercial-real-estate/costar-ceo-andy-florance-touts-ai-push-as-stock-hits-7-year-low-133384
- https://www.onlinemarketplaces.com/articles/costar-group-q2-2026-revenues-up-18-as-residential-becomes-ebitda-positive-for-first-time/
- https://en.wikipedia.org/wiki/Matterport
- https://multifamilydive.com/news/realpage-acquire-cherre-real-estate-data-ai/823637/
- https://pulse2.com/realpage-acquires-cherre-to-build-ai-powered-real-estate-intelligence-platform/
- https://commercialobserver.com/?p=573974
- https://www.reonomy.com/
- https://www.reonomy.com/company/
- https://www.connectcre.com/stories/altus-group-acquires-reonomy-for-us202m/
- https://www.credaily.com/reviews/compstak-review/
- https://www.placer.ai/anchor/articles/placer-ai-reaches-100m-annual-recurring-revenue
- https://techcrunch.com/2024/08/05/placer-ai-boosts-valuation-to-1-5b-after-quietly-raising-another-75m/
- https://docs.placer.ai/page/placer-mcp
- https://motioncre.com/resources/crexi-alternatives
- https://www.cotality.com/press-releases/meet-cotality
- https://www.cotality.com/press-releases/cotality-launches-a-universal-ai-connector-mcp-server-and-ai-ready-property-intelligence
- https://targetednews.com/pr_disp.php?pr_id=9782910
- https://www.cotality.com
- https://www.cotality.com/about
- https://www.corelogic.com
- https://www.wavgroup.com/2026/01/27/attom-launches-mcp-server-a-milestone-moment-for-ai-native-real-estate-data/
- https://runtimewire.com/es/article/attom-launches-property-data-ai-agents-mcp
- https://regrid.com/mcp
- https://app.regrid.com/api/plans
- https://www.propertyshark.com/
- https://www.yardimatrix.com/
- https://www.investing.com/news/transcripts/msci-at-rbc-conference-leveraging-ai-for-private-assets-growth-93CH-4553346
- https://www.moodys.com/web/en/us/insights/announcements/moodys-to-acquire-cape-analytics.html
- https://www.cityam.com/daily-mail-owner-sells-us-data-arm-for-1bn/
- https://www.greenstreet.com/?p=17754

Zoning, feasibility, site selection
- https://www.zoneomics.com/pricing
- https://bassett.ai
- https://gridics.com
- https://www.testfit.io
- https://www.testfit.io/pricing
- https://www.deepblocks.com
- https://www.archistar.ai
- https://www.archistar.ai/blog/reflecting-on-a-landmark-year/
- https://www.aap.com.au/aapreleases/cision20250728ae39227
- https://www.lightboxre.com/news/lightbox-acquires-urbanfootprint-expanding-market-leading-location-intelligence-with-climate-infrastructure-demographic-data/
- https://urbanfootprint.com
- https://ncsmarketing.firstam.com/envelope/
- https://www.bisnow.com/news/national/technology/new-startup-helps-builders-scope-out-development-sites-in-real-time-84468
- https://tectmind.com/
- https://nyczoning.ai/
- https://www.plotzy.ai/zoning/reform/nyc-city-of-yes
- https://pulse2.com/permitflow-54-million-series-b/
- https://symbium.com/about/our-story
- https://land.tech/blog/the-evolution-of-landtech-celebrating-landtechs-10-year-anniversary
- https://id.land
- https://www.acres.com/blog/acrescom-launches-native-ai-search-zoning-intelligence
- https://www.acres.com/pricing

Residential valuation and agent tools
- https://www.housecanary.com/pricing
- https://www.housecanary.com/blog/h1-2025-housecanary-product-highlights-innovation-in-action
- https://www.housecanary.com/blog/q3-2025-housecanary-product-highlights---turning-real-estate-intelligence-into-action
- https://locallogic.co
- https://zillow.mediaroom.com/2025-10-15-Zillow-announces-Zillow-Pro-A-suite-of-products-designed-to-transform-how-agents-capture-business-and-meet-consumer-needs
- https://www.followupboss.com/pricing
- https://housingwire.com/articles/baird-warner-zillow-showcase-discount
- https://www.scotsmanguide.com/news/rocket-closes-1-75b-redfin-acquisition/
- https://www.quantisnow.com/insight/redfin-debuts-real-estate-app-in-chatgpt-6379040
- https://www.privsource.com/acquisitions/deal/krSXlD
- https://cloudcma.com
- https://www.nar.realtor/magazine/real-estate-news/sales-marketing/support-pricing-conversations-with-new-ai-cma-tool
- https://restb.ai/solutions/property-condition/
- https://fello.ai
- https://rechat.ai/
- https://revaluate.com
- https://lofty.com/pricing

Risk and climate
- https://www.reinsurancene.ws/first-street-raises-46m-to-support-advancements-in-physical-climate-risk-modeling/
- https://bebeez.eu/2025/09/19/first-street-furthers-market-leadership-with-worldwide-physical-climate-risk-models-and-new-london-office-ahead-of-climate-week-nyc/
- https://firststreet.org
- https://riskfactor.com
- https://jupiterintel.com
- https://www.jupiterintel.com/about
- https://www.moodys.com/web/en/us/capabilities/climate-risk.html
- https://xdi.systems
- https://climatecheck.com
- https://www.zesty.ai
- https://www.climate-x.com
- https://www.riskthinking.ai

Horizontal AI
- https://claude.com/pricing
- https://claude.com/claude-in-excel
- https://www.anthropic.com/news/claude-for-financial-services
- https://en.wikipedia.org/wiki/ChatGPT
- https://en.wikipedia.org/wiki/Products_and_applications_of_OpenAI
- https://gemini.google/subscriptions/
- https://workspace.google.com/pricing
- https://www.perplexity.ai/enterprise/pricing
- https://www.perplexity.ai/hub/blog/introducing-comet

### From search results only (page not opened; lower confidence)
- https://fintech.global/2026/06/26/msci-acquires-first-street-to-sharpen-climate-risk-edge/
- https://ir.msci.com/node/22796
- https://www.reinsurancene.ws/msci-acquires-climate-risk-data-and-analytics-provider-first-street/
- https://www.esgtoday.com/msci-acquires-climate-risk-data-provider-first-street/
- https://www.businesswire.com/news/home/20251209990988/en/Diald-AI-Raises-$3.75M-to-Advance-Its-AI-Powered-Real-Estate-Due-Diligence-and-Underwriting-Platform (403)
- https://www.citybiz.co/article/886639/diald-expands-ai-real-estate-underwriting-platform-with-1-million-in-follow-on-funding/
- https://www.citybiz.co/article/781936/diald-ai-raises-3-75m-as-global-investors-back-its-push-to-fix-cres-early-stage-analysis-gap/ (403)
- https://www.preqin.com/data/profile/asset/diald-ai/781600
- https://www.vcbacked.co/company/diald-ai
- https://www.sec.gov/Archives/edgar/data/0001057352/000105735226000072/costargroupcompletesacqu.htm
- https://www.nasdaq.com/articles/costar-group-q2-earnings-call-highlights
- https://compstak.com/blog/compstak-launches-agent-connect-an-mcp-server
- https://compstak.com/blog/introducing-compstak-one-connect
- https://entrepreneurship.babson.edu/magazine-archive/news/michael-mandel-3/index.html
- https://www.businesswire.com/news/home/20240918819229/en/Cherre-Announces-30M-Series-C-Round-to-Accelerate-Growth
- https://therealdeal.com/new-york/2021/11/12/software-giant-altus-acquires-real-estate-data-firm-reonomy-for-200m/
- https://www.altusgroup.com/press-releases/altus-group-announces-sale-of-its-development-advisory-business-to-newmark/
- https://simplywall.st/stocks/ca/real-estate-management-and-development/tsx-aif/altus-group-shares/news/altus-group-reshapes-business-around-argus-ai-and-us-listing
- https://www.trueup.io/co/placer-ai
- https://www.crexi.com/ai
- https://www.capterra.com/p/229507/Crexi-PRO/
- https://commercialobserver.com/2020/01/crexi-funding-seriesb-cre-proptech-platform/
- https://marketintelligencetools.com/reports/attom-data-pricing/
- https://www.businesswire.com/news/home/20210802005345/en/MSCI-Strengthens-Private-Asset-Capabilities-With-Acquisition-of-Real-Capital-Analytics
- https://plumlending.com/insights/trepp-commercial-real-estate-data-review
- https://www.greenstreet.com/wp-content/uploads/2026/08/Green-Street-MCP-Server-Guide.pdf
- https://wrenews.com/carbonai-12-million-commercial-real-estate-loan-underwriting-ai-2026/
- https://www.upstartsmedia.com/p/startup-henry-ai-real-estate-series-a
- https://businesswire.com/news/home/20251014487511/en/Dealpath-Introduces-AI-Studio-to-Power-the-Next-Generation-of-Data-Driven-Investment
- https://www.wamda.com/en/2026/02/smart-bricks-closes-5-million-pre-seed-automate-real-estate-investing
- https://news.bensbites.com/posts/46138-eliseai-which-provides-ai-tools-for-healthcare-and-housing-industries-raised-a-250m-series-e-led-by-a16z-doubling-its-valuation-to-22b-from-august-2024
- https://zoneomics.com/pricing/api
- https://www.cretech.com/other/miami-zoning-tech-startup-gridics-raises-1-6m-to-boost-platform-adoption/
- https://www.govtech.com/biz/gridics-announces-3d-zoning-map-and-text-tool-codehub.html
- https://testfit.io/news/business-insider-generative-design-innovator-testfit-gets-2m-boost
- https://www.caplight.com/company/testfit
- https://bouncewatch.com/company/deepblocks
- https://pulse2.com/urbanfootprint-closes-25-million-in-series-b-funding/
- https://www.mannpublications.com/mannreportmanagement/2019/03/06/increasing-transparency-and-public-engagement-department-of-city-planning-launches-zola-2-0/
- https://citylandnyc.org/dcp-announces-a-faster-and-enhanced-zola
- https://en.wikipedia.org/wiki/City_of_Yes
- https://buildout.nyc/
- https://alpa.llc/skills/zoning-analysis-nyc/
- https://www.cbinsights.com/company/permitflow/financials
- https://app.dealroom.co/companies/landtech
- https://acretrader.com/newsroom/acretrader-launches-acres-geospatial-analytics-platform-providing-comprehensive-insights-land-value
- https://www.valuationreview.com/vr/articlesvr/housecanary-introduces-new-lender-product-77670.aspx
- https://thelogic.co/briefing/local-logic-raises-17-5m-series-b-as-it-seeks-to-hire-ai-researchers/
- https://commercialobserver.com/?p=455564
- https://www.mikedp.com/articles/2023/10/12/zillow-flex-fee-rises-to-40-percent
- https://www.milehightitleguy.com/post/is-zillow-showcase-worth-it-for-denver-real-estate-agents-in-2026
- https://updates.followupboss.com/en/streamline-appointment-management-with-showingtime-sync
- https://www.nasdaq.com/articles/rocket-companies-completes-142b-all-stock-acquisition-mr-cooper
- https://www3.lirealtor.com/brokers-agents/member-resources/tech-tips/work-smarter-with-rpr's-new-ai-powered-tools
- https://www.globenewswire.com/news-release/2025/08/11/3131000/0/en/True-Footage-and-Restb-ai-cut-hours-from-the-appraisal-process-with-AI-powered-accuracy.html
- https://www.caplight.com/company/fello-1
- https://www.luxurypresence.com/?p=44253
- https://www.axios.com/2024/07/25/climate-risk-company-raises-46-million

### Unverified items (searched, not confirmed)
- A CoStar "Abalo" AI product; Datasite AI; Cotality's ownership; whether Fitch/Trepp and MSCI/First Street have closed; Envelope's ownership by First American; ChatGPT tier prices; any Perplexity real estate partnership; the Commercial Observer award listing for Diald (reported by Commercial Observer and Diald's release, not found as a listing); Diald's patent applications and "$210B analyzed" (self-reported); funding for Zoneomics, HouseCanary, Archistar, ZestyAI, Climate X, ClimateCheck; tools named "Zoning Lab", "Buildingful", "Landbase".
