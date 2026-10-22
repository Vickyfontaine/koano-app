# Panel 6.7: Venture Investor and M&A Strategist

Persona: Series A to C partner at a real estate tech fund, previously corporate development at a large property data incumbent. I have sat on both sides of the table for deals like the ones in the comps table below. I evaluate KOANO the way an investment committee or a corp dev team would on first contact: what exists, what can be proven, what a buyer would pay for, and what they would ignore.

Date of review: 2026-10-19. Everything here is analysis only. No code was modified.

---

## 0. What I verified about KOANO before valuing it

Assumptions are flagged. Where the code and the brief disagree, the code wins.

| Signal | Finding | State | Evidence |
|---|---|---|---|
| Revenue | Stripe is in **test mode**. Price IDs are commented as "the live test-mode prices"; local env holds `sk_test_` keys. No live charge path is proven. | PARTIAL | `lib/stripe/client.ts:2`, `.env.local` lines 7 to 8 (key prefix only inspected) |
| Users | No analytics of any kind (no PostHog, no Vercel Analytics). There is no way to state DAU, activation, or conversion. | MISSING | `package.json` (no analytics dependency); CLAUDE.md §03 "PostHog ... deferred" |
| Access control | The approval gate is **retired**. `requireApproved` is an allow-all shim returning `null`. Any signed-in user gets 3 lifetime verdicts. | EXISTS (open) | `lib/koano-guard.ts:11-13`, `lib/koano-guard.ts:102-104`, `lib/koano-guard.ts:38` |
| Scale ceiling | A global circuit breaker caps all users combined at **50 verdict attempts per rolling 24h** by default. This is a sensible spend guard for a solo founder and a hard signal to an investor that usage is near zero. | EXISTS | `lib/koano-guard.ts:8`, `lib/koano-guard.ts:71` |
| Customers | No testimonials, logos, design partners or customer names anywhere in `src/`. The marketing site makes no customer claims (to its credit). | MISSING | grep of `src/` for testimonial, design partner, trusted by: zero hits |
| Team | 150 commits, all by one author (Victor Fontaine), first commit 2026-04-12. Roughly six months of build. | Solo founder | `git log` author summary |
| Auth | Clerk keys locally are test keys. Production keys live in Vercel and were not inspected. | Unknown | `.env.local` line 6 prefix |
| External API | No customer-facing API, no API keys, no org/tenant model, no SSO. | MISSING | no `x-api-key` or org model in `src/app/api`, `lib/` |
| Archive | Daily-fan-out cron since August 2026 (about 10 weeks of weekly buckets), with a documented outage (the cron-verb incident) that left a permanent hole. NYC tracts, CDs, tracked properties, plus county/metro national series. | EXISTS, shallow | CLAUDE.md §07A; `vercel.json` cron `0 10 * * *` |
| Calibration | `verdict_outcomes` scanner exists, but outcomes only mature at `created_at + signal_window_months` (12 months on the recorded verdicts). **No verdict can be scored before roughly mid 2027.** No UI surfaces calibration. | PARTIAL | `lib/archive/outcomes.ts:12`, `:49`; dashboard screenshot `development.png` shows window "12 mo" |
| Product depth | 5 specialist agents plus deterministic synthesis, 29 real providers, 2 mocks (pro forma, commercial deals), 15 implemented documents, four dashboards, weekly monitoring, offline reproducibility fixture in the pre-push gate. | EXISTS | `lib/providers/real/` (29 files), `lib/providers/mock/` (2), `scripts/fixtures/nyc-175-3rd-st.json`, CLAUDE.md §03 |
| Runtime model | `claude-sonnet-4-6`. Per-verdict cost is not measured or stored anywhere I could find. | PARTIAL | `lib/agents/shared.ts:16` |

**Working assumptions:** pre-revenue, zero paying customers, solo founder, no institutional capital raised, no signed data partnership. If any of these is wrong, the valuation section moves (I say how).

What I saw in the dashboards (`demo-kit/design-upload-2/dashboards/portfolio.png`, `development.png`): a clean, credible institutional aesthetic, a two-site comparison ranked BUY 79 vs BUY 68 with entitlement risk and a LIVE badge per row, and a Portfolio view that holds **exactly one property** ("1 holding mapped"). The portfolio screen is the tell: the product is built for a 500-property institution and has been exercised on one Gowanus address. The sidebar also labels the same cluster "C3 · Portfolio intelligence" while the page eyebrow reads "05", and Development reads "C1" against "04". A diligence analyst notices that in the first minute.

---

## 1. Honest current valuation

### The range

| Lens | Range | Basis |
|---|---|---|
| **Strategic acquisition today (asset or acqui-hire)** | **$0.5M to $2.0M** | A buyer pays for one engineer-founder plus a codebase it could rebuild in 2 to 4 quarters. Nothing proprietary that cannot be re-scraped exists yet except ~10 weeks of NYC archive. |
| **Priced pre-seed, as is (no design partners)** | **$4M to $7M post-money** on a $0.75M to $1.5M SAFE | Carta reports median post-money SAFE caps of about $10M for $250K to $1M rounds and about $15M for $1M to $2.5M rounds in 2025 ([Carta Q2 2025](https://carta.com/data/state-of-pre-seed-q2-2025/)). A solo, pre-revenue, single-city proptech founder prices below median. Proptech is a cautious category for generalist funds. |
| **Priced pre-seed with 3 to 5 signed design partners (LOIs from NYC developers or a fund)** | **$8M to $12M post** | Moves into the median band. Henry AI's $4.3M seed (YC, broker copilot, claimed usage at 5 of the top 10 US brokerages, 8 employees) is the shape of what earns a real seed ([Commercial Observer](https://commercialobserver.com/?p=511994), [Pulse 2.0](https://pulse2.com/henry-ai-4-3-million-seed-secured-for-automating-commercial-real-estate-deals)). |

My number: **$5M post-money as a fair pre-seed price today, $1M as the honest M&A value today.** The gap between those two numbers is the whole story: investors pay for an option on the future, acquirers pay for what exists.

### Why it is not higher (ranked by how much each one costs)

1. **No revenue, no users, no instrumentation.** Stripe test mode, no analytics, a global 50-run daily cap. There is no metric to put on slide 7. Every valuation in the comps table below is anchored on revenue or ARR; KOANO has none.
2. **The data is free and public, and every acquirer already has it.** NYC Open Data, PLUTO, Census, FEMA, HMDA, QCEW are exactly what Cotality, ATTOM, CoStar and Regrid already ingest. A buyer does not pay for re-ingesting their own inputs. Regrid sells nationwide parcel data from about $80K per year ([Esri partner listing](https://www.esri.com/partners/regrid-a2T5x000008Dqf7EAC/regrid-nationwide-pa-a2d5x000005kKgdAAE)); that is the price ceiling on "we pull public parcel data."
3. **The moat is a promise that has not matured.** The archive is about 10 weeks deep with a known hole. The calibration record cannot produce a single scored verdict until the first 12-month windows close in mid 2027. CLAUDE.md §07A correctly calls this the highest-value subsystem; today it is worth almost nothing because time has not yet passed.
4. **NYC only at parcel depth.** A non-NYC address rolls up `coverage_absent` (CLAUDE.md §07). Institutional buyers underwrite in Sun Belt and industrial markets; KOANO cannot produce a live verdict there.
5. **Crowded seed field with better distribution.** Diald AI raised $3.75M, has a commercial partnership with Moody's, and in August 2026 launched conversational underwriting with a claimed $210B of volume analyzed (company claim, unverified) ([Pulse 2.0](https://pulse2.com/diald-ai-3-75-million-funding/), [Rutland Herald/BusinessWire](https://www.rutlandherald.com/news/business/diald-launches-conversational-ai-underwriting-platform-opening-institutional-grade-real-estate-analysis-to-everyone/article_9338e2f1-5791-527b-9fce-7bf2772fb240.html)). Built AI ($6M seed, Work-Bench) and Henry AI ($4.3M seed) are funded and selling. KOANO is technically more rigorous than what their press describes, but rigor without logos loses the seed race.
6. **Key-person risk.** One author, six months. A buyer prices the probability that the founder leaves at 100% of the asset.
7. **Four audiences at once.** $19 homeowners to $1,499 institutions. Investors read that as no focus. The comps that commanded premiums (RCA, STR, Zonda, Reonomy) each owned one buyer persona.
8. **The verdict vocabulary (BUY/HOLD/WAIT) invites liability scrutiny** for institutional and lender buyers, and no SOC 2, SSO, or tenant isolation exists (CLAUDE.md §03 "Not built").
9. **Unit economics unmeasured.** Six model calls per verdict on a Sonnet-class model and no per-verdict cost record. At $19/month for Community with 20 verdicts per day permitted (`lib/koano-guard.ts:39`), gross margin could be negative for a heavy user. Unverified because it is unmeasured.
10. **Billing and cluster labeling inconsistencies** (C3 vs 05) signal "demo" rather than "product" in diligence.

What moves the number up fastest: a signed paying design partner at $1,499 or more per month moves the pre-seed to the top of the range. A signed data partner (partner provenance live) moves it more than ten Community subscribers.

---

## 2. Comparable companies, fundraises and acquisitions

Every row was verified against at least one retrieved URL. Implied multiples are my arithmetic on the cited figures. "Unverified" means I could not confirm the figure from a source I retrieved.

### 2a. Acquisitions (what incumbents actually pay for)

| # | Target | Acquirer | Date | Price | Implied multiple | What was bought | Source |
|---|---|---|---|---|---|---|---|
| 1 | Real Capital Analytics | MSCI | Announced Aug 2, 2021 | $950M cash | ~13.6x ARR (RCA ~$70M ARR, double-digit growth) | 20+ years of CRE transaction history, $20T+ deals | [Bisnow](https://www.bisnow.com/news/national/technology/msci-acquires-real-capital-analytics-950m-cre-data-109744), [The Real Deal](https://therealdeal.com/2021/08/02/msci-to-acquire-real-capital-analytics-for-950m) |
| 2 | Reonomy | Altus Group | Closed Nov 12, 2021 | $201.5M cash-free, debt-free | Revenue not disclosed (unverified) | AI-linked CRE property graph: 52M parcels, 38M commercial properties; ~115 staff | [Altus press release](https://www.altusgroup.com/press-releases/altus-group-acquires-reonomy/), [MPA](https://www.mpamag.com/us/specialty/commercial/reonomy-sells-cre-data-platform-in-202-million-deal/316514) |
| 3 | CoreLogic (now Cotality) | Stone Point Capital and Insight Partners | Announced Feb 2021, closed June 2021 | ~$6B ($80/share) | CoStar bid higher (reported $6.7B to $7B, sources differ) | National property, mortgage and hazard data | [Inman](https://inman.com/2021/02/04/corelogic-acquired-by-stone-point-capital-insight-partners-for-6b), [Inman close](https://inman.com/2021/06/07/insight-partners-stone-point-finalize-corelogic-acquisition), [Cotality rebrand](https://www.cotality.com/press-releases/meet-cotality) |
| 4 | Matterport | CoStar | Closed Feb 28, 2025 | $1.6B | ~9.4x revenue (FY2024 revenue $169.7M) | Digital twin capture of 14M+ spaces | [Inman](https://www.inman.com/2025/02/28/costar-closes-1-6b-matterport-acquisition-ahead-of-schedule/), [HousingWire](https://housingwire.com/articles/costar-closes-purchase-of-matterport) |
| 5 | Zonda | CoStar | Announced May 29, 2026; closed Aug 2026 | $800M cash | ~4.7x revenue, ~20x EBITDA (2025 revenue ~$170M, 23% adj. EBITDA margin) | Lot-level new-home database, builder software, NewHomeSource | [Inman](https://www.inman.com/2026/05/29/costar-acquire-zonda-800m/), [Online Marketplaces](https://www.onlinemarketplaces.com/articles/costar-group-closes-800m-zonda-acquisition/) |
| 6 | STR (hotel benchmarking) | CoStar | Closed Oct 22, 2019 | $450M cash | ~7.0x revenue, ~28x profit (2019E revenue $64M, ~$16M profit) | Proprietary benchmark panel, 35 years | [CoStar 8-K (SEC)](https://www.sec.gov/Archives/edgar/data/1057352/000105735219000086/costargrouptostr.htm), [Skift](https://skift.com/?p=361788) |
| 7 | Homes.com | CoStar | Closed May 24, 2021 | $156M headline ($152M settled) | n/a | Consumer portal, 500K agents | [Commercial Observer](https://commercialobserver.com/2021/04/costar-group-to-acquire-homes-com-for-156m/), [CoStar 10-K](https://www.sec.gov/Archives/edgar/data/1057352/000105735222000027/csgp-20211231.htm) |
| 8 | Ten-X (commercial) | CoStar | Closed June 2020 | $190M cash | n/a | Online CRE auction marketplace | [Commercial Observer](https://commercialobserver.com/2020/05/costar-buys-ten-x-for-190m/) |
| 9 | LoopNet | CoStar | Completed April 2012 | ~$860M equity value ($762M EV) | n/a | CRE listing marketplace | [Wikipedia](https://en.wikipedia.org/wiki/LoopNet), [NBC News](https://www.nbcnews.com/news/amp/wbna42786909) |
| 10 | Reis | Moody's | Announced Aug 30, 2018 | ~$278M ($23/share) | Revenue not verified | CRE market data and forecasts, 275 metros, 7,700 submarkets | [Reis 8-K exhibit (SEC)](https://www.sec.gov/Archives/edgar/data/1038222/000119312518262426/d616962dex991.htm), [HousingWire](https://www.housingwire.com/articles/46656-moodys-buying-commercial-real-estate-data-provider-reis-for-278-million) |
| 11 | CAPE Analytics | Moody's | Announced Jan 13, 2025 | Undisclosed ("not material") | n/a | Geospatial AI property risk for insurers | [Moody's IR](https://ir.moodys.com/press-releases/news-details/2025/Moodys-to-Acquire-CAPE-Analytics-Adding-AI-Powered-Geospatial-Property-Risk-Intelligence-to-Its-Industry-Leading-Insurance-Risk-Models/default.aspx) |
| 12 | Black Knight | ICE | Closed Sept 5, 2023 | ~$11.9B (revised terms $11.7B) | n/a | Mortgage servicing software and property data | [HousingWire](https://www.housingwire.com/articles/ice-completes-11-7b-acquisition-of-black-knight/) |
| 13 | Cherre | RealPage (Thoma Bravo-backed) | Announced July 14, 2026 | Undisclosed | n/a | Institutional data unification layer; RealPage wants "a uniform source of truth ... to power their agentic solutions" | [Commercial Observer](https://commercialobserver.com/2026/07/realpage-cherre-acquisition/), [Corum Group](https://www.corumgroup.com/insights/proptech-ma-2026) |
| 14 | ResiShares (analytics assets) | ATTOM | Announced Jan 20, 2026 | Undisclosed | n/a | Forecasting and predictive modeling folded into a 158M-property database | [ATTOM press release](https://www.attomdata.com/news/company-news/attom-acquires-resishares/), [HousingWire](https://www.housingwire.com/articles/attom-acquires-resishares-to-expand-data-and-analytics/) |
| 15 | ATTOM | Lovell Minnick Partners | Jan 2019 | Undisclosed | n/a | National property database (RealtyTrac lineage) | [HousingWire](https://housingwire.com/articles/47862-attom-data-solutions-acquired-by-private-equity-firm-lovell-minnick-partners) |
| 16 | Altus Canadian Appraisals; Altus Property Tax | Newmark; Ryan LLC | Feb 2026; July 2024 | Undisclosed; C$700M | n/a | Altus divesting services to focus on core analytics (ARGUS) | [Newmark](https://www.nmrk.com/insights/press-releases/altus-group-announces-the-sale-of-its-canadian-appraisals-business-to-newmark), [RENX](https://renx.ca/altus-to-sell-property-tax-services-to-ryan-llc-for-700m) |

Market context: Corum Group reports $6.8B of disclosed proptech M&A in the first seven months of 2026 versus $7.1B for all of 2025, with only about 15% of deals disclosing price ([Corum Group](https://www.corumgroup.com/insights/proptech-ma-2026)). The buyers are active. The deals with disclosed prices are all for companies with tens or hundreds of millions in revenue, or for proprietary data panels.

### 2b. Fundraises (what investors pay for at each stage)

| # | Company | Round | Date | Amount / valuation | Relevance to KOANO | Source |
|---|---|---|---|---|---|---|
| 17 | Placer.ai | Series D (per CB Insights) | July/Aug 2024 | $75M at ~$1.5B; >$100M run rate reported | Proprietary location panel; ~15x run rate | [TechCrunch](https://techcrunch.com/2024/08/05/placer-ai-boosts-valuation-to-1-5b-after-quietly-raising-another-75m), [SiliconANGLE](https://siliconangle.com/2024/08/05/placer-labs-raises-75m-enhance-market-research-initiatives-foot-traffic-data-ai/) |
| 18 | Juniper Square | Series D | June 2025 | $130M at $1.1B, led by Ribbit | Proceeds aimed at JunieAI for GPs: incumbents of the IC workflow are building the AI layer themselves | [FinTech Global](https://fintech.global/2025/06/17/private-markets-platform-juniper-square-secures-130m-series-d/) |
| 19 | EliseAI | Series E | Aug 2025 | $250M at ~$2.2B; >$100M ARR reported | Vertical AI in housing commands top multiples once ARR exists | [Golden Seeds](https://goldenseeds.com/company-news/8-20-25/), [Techleap](https://finder.techleap.nl/news/feed/eliseai-raises-250m-in-funding-round) |
| 20 | Cherre | Series C | Sept 2024 | $30M, led by HighSage; Nuveen, RXR participated | Then acquired by RealPage in 2026: the data-layer-to-strategic path is real | [Commercial Observer](https://commercialobserver.com/2024/09/cherre-series-c-funding-proptech/) |
| 21 | Dealpath | Series C | Sept 2022 | $43M, led by Morgan Stanley Expansion Capital; Blackstone, JLL participated | Owns the institutional deal pipeline; natural home for KOANO verdicts | [The Real Deal](https://therealdeal.com/2022/09/08/deal-management-platform-dealpath-raises-43m-series-c) |
| 22 | CompStak | Series C | Nov 2021 | $50M, led by Morgan Stanley Expansion Capital | Crowdsourced lease comps: a proprietary data flywheel. No later round found | [Global Fintech Series](https://globalfintechseries.com/investment-services/compstak-raises-50-million-series-c-funding-led-by-morgan-stanley-expansion-capital/) |
| 23 | HouseCanary | Growth (Series C per one outlet) | Feb 2020 | $65M; $130M total raised | AVM and analytics for lenders | [Crowdfund Insider](https://www.crowdfundinsider.com/2020/02/157270-san-franciscos-fintech-housecanary-a-real-estate-analytics-solution-provider-secures-65-million-in-round-led-by-morpheus-ventures/) |
| 24 | First Street | Series A-1 | July 2024 | $21M; $46M total | Climate risk; KOANO explicitly avoids First-Street-class licensing traps (CLAUDE.md §07) | [Axios](https://www.axios.com/2024/07/25/climate-risk-company-raises-46-million) |
| 25 | Local Logic | Series B | Aug 2023 | ~$13M (C$17.5M) | Location intelligence API, ~300M properties | [Inman](https://www.inman.com/2023/08/02/location-location-funding-local-logic-lands-13m-in-series-b-round/) |
| 26 | TestFit | Series A | July 2022 | $20M, Parkway VC | Site feasibility for developers: the Cluster 4 adjacent tool | [SiliconANGLE](https://siliconangle.com/2022/07/26/testfit-lands-20m-expand-real-estate-feasibility-analytics-software/) |
| 27 | Archistar | Growth | April 2021 | A$6M (AirTree, Skip Capital); later NAB Ventures-led round (date unverified) | AI development feasibility and compliance | [iTWire](https://itwire.com/it-industry-news/development/archistar-raises-$6m-in-latest-funding-round) |
| 28 | Jupiter Intelligence | Series C | Date not confirmed in retrieved sources | $54M | Climate risk analytics | [Coverager](https://coverager.com/climate-science-company-jupiter-raises-54-million/) |
| 29 | Gridics | Seed extension | Nov 2022 | $1.5M | Zoning data layer; struggled to raise beyond seed | [Gridics](https://gridics.com/?p=8540) |
| 30 | Diald AI | Early stage | Dec 2025 | $3.75M; Moody's commercial partnership | The named competitor | [Pulse 2.0](https://pulse2.com/diald-ai-3-75-million-funding/) |
| 31 | Built AI | Seed | Dec 2025 | $6M, led by Work-Bench | AI CRE financial modeling and underwriting | [PropTech Connect](https://proptechconnect.com/builtai-raises-6-million-to-scale-platform-for-global-real-estate-investors/) |
| 32 | Henry AI | Seed | Feb 2025 | $4.3M, Susa and 1Sharpe | AI analyst for CRE brokers | [Commercial Observer](https://commercialobserver.com/?p=511994) |

Unverified and excluded from conclusions: Crexi's recent rounds (only 2018 Series A $11M and 2020 Series B $30M confirmed, [Commercial Observer](https://commercialobserver.com/2020/01/crexi-funding-seriesb-cre-proptech-platform/)); Zoneomics $3M seed (aggregator only, undated); UrbanFootprint (no acquisition or round found); Deepblocks (aggregators list ~$2M to $4.25M, no primary source); Regrid (no disclosed funding found); CarbonAI $12M (source returned 404 on fetch).

### 2c. What the comps teach

1. **Incumbents pay premium multiples for time, not code.** RCA (13.6x ARR) and STR (7x revenue, 28x profit) were bought for decades of proprietary history that cannot be recreated. Zonda went for 4.7x revenue because its data is lot-level and builder-reported. KOANO's archive is the right thesis; it is 10 weeks old.
2. **The AI layer is being built in-house by the workflow owners.** Juniper Square raised $130M specifically for JunieAI; RealPage bought Cherre to "power their agentic solutions." A reasoning layer without proprietary data or distribution is something incumbents feel they can build.
3. **The seed field converged on "AI underwriting memo" in 2025 to 2026** (Diald, Built AI, Henry, CarbonAI). Feature parity there is not a moat.
4. **The defensible gap nobody claims publicly is auditability plus measured accuracy.** None of the funded AI underwriting companies I found publishes a calibration record. That is KOANO's opening, and it is time-locked: whoever starts recording first wins, and KOANO has started.

---

## 3. Likely acquirers

Ranked by probability times price. "Must-have" is the condition under which the buyer competes rather than waits.

| Rank | Acquirer | Why they would buy | What they would pay for | Nice-to-have (low price, or wait and build) | Must-have (competitive process) | Realistic band at maturity |
|---|---|---|---|---|---|---|
| 1 | **RealPage / Cherre** | Just bought Cherre to be the institutional "source of truth" for agentic workflows. KOANO is a provenance-native reasoning layer that consumes such a source. | The deterministic verdict engine, provenance taxonomy, document engine | A NYC demo on public data | KOANO verdicts running on Cherre-connected client data for 5+ named institutions, with a calibration record | $15M to $60M at $2M to $6M ARR |
| 2 | **Moody's (CRE + Analytics)** | Owns Reis, CompStak stake history, CAPE Analytics; already partners with Diald. Moody's sells "trusted" credit opinions; calibrated, auditable verdicts are culturally native. | Calibration methodology, audit trail, immutable verdict log | Being a second Diald | Published 24-month calibration ledger plus lender or CMBS users | $25M to $150M |
| 3 | **MSCI (Real Assets / RCA)** | Owns transaction history (RCA). Lacks a forward-looking, explainable decision layer for private real assets clients. | Reasoning layer that reads RCA comps with partner provenance | Single-city coverage | Running on RCA data as a partner feed in 10+ metros with institutional seats | $30M to $200M |
| 4 | **CoStar Group** | Serial acquirer (LoopNet, STR, Ten-X, Homes.com, Matterport, Zonda). Buys scale assets with revenue. | Rarely pays for pre-revenue AI; would buy the archive plus users | Anything under $10M ARR | A product CoStar clients are asking for, at $10M+ ARR | $100M+ only at scale |
| 5 | **Altus Group (ARGUS)** | Shedding services to focus on core analytics before a planned US listing (third-party summary, unverified). ARGUS is the valuation workflow standard; an IC-memo reasoning layer above ARGUS is coherent. | Document engine (IC memo, entitlement memo), verdict math | Generic memo generation | ARGUS-native integration used by appraisers and funds | $10M to $80M |
| 6 | **Cotality (CoreLogic)** | Largest US property and hazard data owner; needs AI products on top. | Archive methodology, monitoring diff engine | Public-data reasoning they already have | National coverage on Cotality data with insurer or lender buyers | $20M to $100M |
| 7 | **ATTOM** | Just bought ResiShares for predictive analytics; PE-owned roll-up behavior. | Agents and verdict layer to sell on top of its 158M-property database | Most likely early, cheap buyer | Verdict API consumed by ATTOM's enterprise clients | $3M to $25M |
| 8 | **Dealpath / Juniper Square** | Own the IC pipeline (Dealpath) and GP workflow (Juniper). | IC memo generation with provenance | They are building AI in-house (JunieAI) | Proof that KOANO memos shorten screening time at shared customers | $10M to $50M |
| 9 | **ICE (Black Knight)** | Mortgage and servicing data. Monitoring diff engine fits servicing risk. | Monitoring plus calibration on collateral | Investment verdicts are off-thesis | Collateral risk monitoring adopted by servicers | $10M to $60M |
| 10 | **S&P Global / Verisk** | Verisk: property risk for insurers; S&P: real assets data. | Hazard synthesis, provenance | Not core | Insurer adoption | Low probability |
| 11 | **CBRE / JLL / Newmark** | Brokerage research teams produce exactly these memos. Newmark just bought Altus Canadian Appraisals and licensed ARGUS Intelligence. | Internal tool, acqui-hire | Likeliest acqui-hire outcome | Firm-wide deployment pre-acquisition | $2M to $15M |
| 12 | **Zillow, First American, Fidelity National Financial** | Consumer and title. Community cluster and tax-appeal packets fit; institutional story does not. | Community documents | Off-thesis for KOANO's chosen buyers | n/a | Low probability |

**The founder's exit thesis ("reasoning layer a data provider plugs into") is right in direction, but today the buyers would treat it as a nice-to-have.** Data incumbents buy data, revenue, or distribution. A reasoning layer becomes a must-have only when (a) it is running on the acquirer's own data for the acquirer's own customers, and (b) it has a measured accuracy record the acquirer cannot replicate without waiting years. KOANO has the architecture for both (the `partner` provenance seam in `lib/providers/provenance.ts`; `verdict_outcomes`), and neither has happened.

---

## 4. Metrics required for each outcome

Multiples are anchored on the comps: strategic data assets at 5x to 14x revenue (Zonda, STR, Matterport, RCA), hot vertical AI at 15x to 22x (Placer, EliseAI).

| Metric | $10M outcome | $50M outcome | $250M+ outcome |
|---|---|---|---|
| Form | Early strategic acquisition or seed-stage valuation | Series A/B or strategic sale | Strategic sale to Moody's/MSCI/CoStar class, or Series C |
| ARR | $0.5M to $1.5M | $5M to $8M | $20M to $35M |
| Paying logos | 15 to 30, including 3+ institutional at $18K+ ACV | 60 to 120; 10+ institutional at $50K+ ACV | 300+; 25+ top-100 managers or lenders |
| Net revenue retention | Measured at all (>100%) | 115%+ | 125%+ |
| Gross margin | Measured per verdict | 70%+ | 75%+ |
| Verdict volume | 2,000+ per month (requires lifting the 50/day breaker) | 25,000+ per month, 30%+ via API | 250,000+ per month, mostly API or embedded |
| Calibration | Methodology published; first matured outcomes (needs ≥12 months) | 1,000+ matured verdicts; directional hit rate monotonic in confidence buckets; third-party reviewed | 20,000+ matured verdicts across 3+ cycles; calibration is cited by clients in IC minutes or lender credit files |
| Archive depth | 12 months gapless, NYC | 24 months gapless, 5+ metros at parcel level | 36+ months, 25+ metros; licensable as a dataset on its own |
| Coverage | NYC deep plus 1 metro | 5 to 10 metros parcel-level (via Regrid/partner feeds) | National parcel-level with partner provenance |
| Data partnerships | 1 LOI | 1 to 2 live `partner` feeds | 3+ partners, one exclusive |
| Enterprise readiness | SSO on roadmap | SOC 2 Type I, SSO, org tenancy | SOC 2 Type II, data residency, API SLAs |
| Team | Founder plus 1 to 2 | 10 to 20, with a CRE domain executive | 50+ |

The single metric that most changes the multiple is calibration. ARR gets you to the comps band; a verified, published calibration record is the only asset that makes a Moody's or MSCI pay a premium above it, because it is the one thing they cannot build by spending money, only by waiting.

---

## 5. Top 10 problems (ranked by impact on enterprise value)

| # | Problem | State | Evidence | Effort | Impact |
|---|---|---|---|---|---|
| 1 | Zero commercial evidence: no paying customer, no design partner, no usage data | MISSING | `lib/stripe/client.ts:2` (test mode); no analytics dependency; no customer references in `src/` | M (sales, not code) | 10 |
| 2 | Calibration record cannot produce a number until mid 2027, and nothing in the product shows it is accumulating | PARTIAL | `lib/archive/outcomes.ts:49` (window end = created_at + 12 months); no calibration UI in `src/components` | M | 9 |
| 3 | Inputs are public data the acquirers already own; no proprietary data flywheel yet | PARTIAL | `lib/providers/real/` (all free public sources); only mocks for paid data `lib/providers/mock/` | L | 9 |
| 4 | NYC-only parcel depth; national verdicts roll up `coverage_absent` | EXISTS as limitation | CLAUDE.md §07 Geographic scope | L | 8 |
| 5 | Four audiences from $19 to $1,499 dilutes the story and the roadmap | EXISTS | `lib/koano-guard.ts:37-43`; pricing page `src/app/pricing/page.tsx:9` | S (decision) | 8 |
| 6 | No API, no org tenancy, no SSO: cannot be embedded by a data partner or bought by an institution | MISSING | no API key or org model in `src/app/api`; CLAUDE.md §03 Not built | L | 8 |
| 7 | Solo founder, six months, single committer | EXISTS | `git log` (150 commits, one author) | M (hiring) | 7 |
| 8 | Unit economics unmeasured; Community tier permits 20 verdicts per 24h at $19 | PARTIAL | `lib/koano-guard.ts:39`; no cost logging | S | 6 |
| 9 | Archive is shallow (~10 weeks) with a permanent hole from the cron-verb incident | PARTIAL | CLAUDE.md §07A incident section | S (time) | 6 |
| 10 | Diligence-visible polish gaps: cluster labels C3 vs 05, a portfolio with one holding, founder account "home cluster C2" | EXISTS | `dashboards/portfolio.png`, `dashboards/development.png` sidebars | S | 4 |

## 6. Top 10 opportunities (ranked by impact on enterprise value)

| # | Opportunity | State | Effort | Impact |
|---|---|---|---|---|
| 1 | **Public calibration ledger.** Hash every verdict at issue (the `verdicts` table is already append-only), publish a weekly count of verdicts pending, and the first scored cohort the day it matures. Pre-register the method now so the 2027 result is credible. | PARTIAL (data layer exists) | M | 10 |
| 2 | **Five paid NYC design partners in Development (Cluster 4)** at $499 to $1,499/month, with a written screening-memo-time-saved study. NYC developers are the one audience where KOANO is fully live today. | MISSING | M | 10 |
| 3 | **Partner provenance pilot with one data owner** (Regrid for parcels, CompStak or Cherre-connected data). The `partner` seam already exists in `lib/providers/provenance.ts`. A logo on the coverage map is a fundraise slide and an acquirer relationship. | PARTIAL | M | 9 |
| 4 | **Verdict API** with per-call metering. Turns KOANO from an app into the "reasoning layer" the exit thesis requires. | MISSING | M | 9 |
| 5 | **Instrument everything**: PostHog, per-verdict cost, activation funnel. Without it the next raise has no slide 7. | MISSING | S | 8 |
| 6 | **Narrow the story to Development plus Portfolio** for the raise; keep Community and Transaction live but off the deck. | EXISTS (product), positioning change | S | 8 |
| 7 | **Second metro at parcel depth** (a city with strong open data, e.g. Chicago, LA, or SF; choose by open-data quality). Proves the provider pattern scales beyond NYC. | MISSING | L | 7 |
| 8 | **Expand archive scope to all NYC lots at low frequency** (not just tracked properties) to make the archive a dataset in its own right. | PARTIAL | M | 7 |
| 9 | **Enterprise basics**: Clerk organizations, SSO, SOC 2 readiness via a compliance platform. | MISSING | M | 6 |
| 10 | **Head-to-head teardown vs Diald** published as a reproducibility test: same address run twice, show KOANO's decision surface byte-identical under replay (`scripts/test-fixture.ts`), show whether competitors disclose provenance. | MISSING | S | 6 |

## 7. What I would rebuild first

Not code. The **commercial evidence layer**, in this order, in the next 90 days:

1. Turn on analytics and per-verdict cost logging (one week).
2. Flip Stripe to live and sign five NYC developer design partners at a discounted annual price, paid. Paid matters: free pilots do not count in diligence.
3. Ship a `/calibration` page that shows, from the real tables, verdicts issued, verdicts pending maturity, archive weeks captured, and gaps (the `archive_coverage` view already computes the gaps honestly). It must say plainly that no outcome has matured yet. That honesty is the pitch.
4. Raise $1M to $1.5M pre-seed on those numbers.

The one piece of code I would rebuild first is a metered **verdict API with org tenancy**, because every acquirer conversation ends in "can we run this on our data for our clients."

## 8. The one thing that would make me say "I have never seen anything like this"

A real estate AI that publishes its own report card. Every verdict ever issued is hashed and timestamped at the moment of issue, visible in a public ledger, and later scored against the publicly observable outcome, with a calibration curve by confidence bucket that anyone can audit and nobody can retroactively edit. If KOANO walks into a Moody's or MSCI meeting in 2028 with 24 months of pre-registered, unedited, calibrated verdicts, that is an asset no incumbent can buy any other way, because the only way to get it is to have started in 2026. The infrastructure for this is already half built (`verdicts` append-only, `verdict_outcomes`, the reproducibility fixture). What is missing is the public surface and the volume of verdicts to score. (VISION: the third-party audit and the hash anchoring are not built.)

---

## 9. The 12-slide pitch narrative

Grounded claims only. Where a number does not yet exist, the slide says what will be shown and by when.

1. **Title.** KOANO: the real estate reasoning engine. One line: "Decisions you can audit, accuracy you can measure."
2. **Problem.** Development and acquisitions teams spend days per site assembling zoning, permits, violations, hazard and market data into a memo nobody can reproduce. AI tools now generate memos faster, but none of them show which numbers are real, and none of them measure whether they were right.
3. **Insight.** In institutional real estate, trust is the bottleneck, not generation. An answer is only usable if every figure has provenance and the decision is reproducible.
4. **Product.** Five specialist agents over 29 live public data providers; a deterministic synthesis that computes verdict, confidence, risk and window in code; the LLM only narrates. Show the Development dashboard (`development.png`) and the screening memo.
5. **Why it is different (the integrity stack).** Five-state provenance with weakest-wins rollup; per-verdict coverage map naming the feed that fills each gap; immutable verdict log; a record/replay fixture that asserts the decision byte-identical on every code push. Demo: the same verdict replayed.
6. **The moat that compounds.** A weekly longitudinal archive of the public record (started August 2026) and a calibration record of every verdict against publicly observable outcomes. Neither can be bought retroactively. Show the archive coverage grid with its honest gaps.
7. **Traction.** (To be earned before raising.) Paid design partners, verdicts per week, archive weeks, documents generated, time saved per screening memo.
8. **Market and wedge.** Start with NYC development and acquisitions teams, where coverage is fully live; expand metro by metro through partner data. Avoid a TAM slide built from top-down proptech numbers.
9. **Business model.** Seats for Development ($499+) and Portfolio ($1,499+), plus a metered verdict API for data partners. Show measured gross margin per verdict.
10. **Competition.** Data incumbents (CoStar, Cotality, ATTOM, MSCI) own data; workflow owners (Dealpath, Juniper Square, ARGUS) own pipelines; AI memo startups (Diald, Built AI, Henry) own speed. KOANO owns auditability and measured accuracy. Present as a 2x2: provenance disclosure vs measured accuracy.
11. **Path to exit.** The reasoning layer data owners plug into. Cite RealPage buying Cherre to power agentic workflows, and Moody's partnering with an AI underwriting startup, as proof buyers want this layer. Say what makes it a must-have: running on their data, with a calibration record they cannot replicate.
12. **The ask.** $1M to $1.5M to reach: 20 paying logos, a second metro, a live data partnership, an API, and the first matured calibration cohort in 2027.

---

## 10. Grounded vs vision summary

- **Grounded (EXISTS/PARTIAL today):** deterministic verdict engine, provenance taxonomy, reproducibility fixture, 15 documents, monitoring, a young archive, a calibration table that has nothing to score yet, test-mode billing, no analytics, no customers, no API.
- **VISION (needs capital, partners, or time):** public calibration ledger with third-party audit, partner data feeds, national parcel coverage, a verdict API embedded in an acquirer's product, multi-year archive as a licensable dataset.

---

## Sources

- https://carta.com/data/state-of-pre-seed-q2-2025/
- https://commercialobserver.com/?p=511994
- https://pulse2.com/henry-ai-4-3-million-seed-secured-for-automating-commercial-real-estate-deals
- https://www.esri.com/partners/regrid-a2T5x000008Dqf7EAC/regrid-nationwide-pa-a2d5x000005kKgdAAE
- https://pulse2.com/diald-ai-3-75-million-funding/
- https://www.rutlandherald.com/news/business/diald-launches-conversational-ai-underwriting-platform-opening-institutional-grade-real-estate-analysis-to-everyone/article_9338e2f1-5791-527b-9fce-7bf2772fb240.html
- https://www.bisnow.com/news/national/technology/msci-acquires-real-capital-analytics-950m-cre-data-109744
- https://therealdeal.com/2021/08/02/msci-to-acquire-real-capital-analytics-for-950m
- https://www.altusgroup.com/press-releases/altus-group-acquires-reonomy/
- https://www.mpamag.com/us/specialty/commercial/reonomy-sells-cre-data-platform-in-202-million-deal/316514
- https://inman.com/2021/02/04/corelogic-acquired-by-stone-point-capital-insight-partners-for-6b
- https://inman.com/2021/06/07/insight-partners-stone-point-finalize-corelogic-acquisition
- https://www.cotality.com/press-releases/meet-cotality
- https://www.inman.com/2025/02/28/costar-closes-1-6b-matterport-acquisition-ahead-of-schedule/
- https://housingwire.com/articles/costar-closes-purchase-of-matterport
- https://www.inman.com/2026/05/29/costar-acquire-zonda-800m/
- https://www.onlinemarketplaces.com/articles/costar-group-closes-800m-zonda-acquisition/
- https://www.sec.gov/Archives/edgar/data/1057352/000105735219000086/costargrouptostr.htm
- https://skift.com/?p=361788
- https://commercialobserver.com/2021/04/costar-group-to-acquire-homes-com-for-156m/
- https://www.sec.gov/Archives/edgar/data/1057352/000105735222000027/csgp-20211231.htm
- https://commercialobserver.com/2020/05/costar-buys-ten-x-for-190m/
- https://en.wikipedia.org/wiki/LoopNet
- https://www.nbcnews.com/news/amp/wbna42786909
- https://www.sec.gov/Archives/edgar/data/1038222/000119312518262426/d616962dex991.htm
- https://www.housingwire.com/articles/46656-moodys-buying-commercial-real-estate-data-provider-reis-for-278-million
- https://ir.moodys.com/press-releases/news-details/2025/Moodys-to-Acquire-CAPE-Analytics-Adding-AI-Powered-Geospatial-Property-Risk-Intelligence-to-Its-Industry-Leading-Insurance-Risk-Models/default.aspx
- https://www.housingwire.com/articles/ice-completes-11-7b-acquisition-of-black-knight/
- https://commercialobserver.com/2026/07/realpage-cherre-acquisition/
- https://www.corumgroup.com/insights/proptech-ma-2026
- https://www.attomdata.com/news/company-news/attom-acquires-resishares/
- https://www.housingwire.com/articles/attom-acquires-resishares-to-expand-data-and-analytics/
- https://housingwire.com/articles/47862-attom-data-solutions-acquired-by-private-equity-firm-lovell-minnick-partners
- https://www.nmrk.com/insights/press-releases/altus-group-announces-the-sale-of-its-canadian-appraisals-business-to-newmark
- https://renx.ca/altus-to-sell-property-tax-services-to-ryan-llc-for-700m
- https://techcrunch.com/2024/08/05/placer-ai-boosts-valuation-to-1-5b-after-quietly-raising-another-75m
- https://siliconangle.com/2024/08/05/placer-labs-raises-75m-enhance-market-research-initiatives-foot-traffic-data-ai/
- https://fintech.global/2025/06/17/private-markets-platform-juniper-square-secures-130m-series-d/
- https://goldenseeds.com/company-news/8-20-25/
- https://finder.techleap.nl/news/feed/eliseai-raises-250m-in-funding-round
- https://commercialobserver.com/2024/09/cherre-series-c-funding-proptech/
- https://therealdeal.com/2022/09/08/deal-management-platform-dealpath-raises-43m-series-c
- https://globalfintechseries.com/investment-services/compstak-raises-50-million-series-c-funding-led-by-morgan-stanley-expansion-capital/
- https://www.crowdfundinsider.com/2020/02/157270-san-franciscos-fintech-housecanary-a-real-estate-analytics-solution-provider-secures-65-million-in-round-led-by-morpheus-ventures/
- https://www.axios.com/2024/07/25/climate-risk-company-raises-46-million
- https://www.inman.com/2023/08/02/location-location-funding-local-logic-lands-13m-in-series-b-round/
- https://siliconangle.com/2022/07/26/testfit-lands-20m-expand-real-estate-feasibility-analytics-software/
- https://itwire.com/it-industry-news/development/archistar-raises-$6m-in-latest-funding-round
- https://coverager.com/climate-science-company-jupiter-raises-54-million/
- https://gridics.com/?p=8540
- https://proptechconnect.com/builtai-raises-6-million-to-scale-platform-for-global-real-estate-investors/
- https://commercialobserver.com/2020/01/crexi-funding-seriesb-cre-proptech-platform/

## Discrepancies vs the brief

1. **Approval gate.** Brief and CLAUDE.md §03/§11 describe `koano-guard.ts` as an "approval gate." The code retired it: `requireApproved` returns `null` for everyone (`lib/koano-guard.ts:11-13`, `:102-104`).
2. **Pricing differs by more than documents and monitoring caps.** The brief says tiers differ by documents and monitoring caps, not feature locks. The code also meters verdicts and content per rolling 24h by tier (free 3 lifetime, community 20, transaction 50, development 150, portfolio 500) (`lib/koano-guard.ts:37-43`), under a global 50-per-day breaker (`:71`).
3. **Google Trends.** The brief lists Google Trends among live providers. CLAUDE.md §05/§07 says it was retired and its mock deleted; there is no Google Trends provider in `lib/providers/real/`.
4. **Mapbox.** CLAUDE.md §03 says Stripe and Mapbox keys are placeholders; the production dashboard screenshots render Mapbox tiles (`portfolio.png`, `development.png`), so Mapbox is live in production. Stripe remains test mode (`lib/stripe/client.ts:2`).
5. **Cluster numbering.** The brief describes four clusters (Community, Transaction, Development, Portfolio). In the shipped UI the sidebar labels Portfolio "C3" and Development "C1" while page eyebrows read "05" and "04" (`portfolio.png`, `development.png`). CLAUDE.md §10 documents this as intentional decoupling, but a user sees two numbering systems on one screen.
6. **Calibration record.** The brief says "planned verdict calibration record." The scanner and table exist (`lib/archive/outcomes.ts`), so it is PARTIAL rather than planned, but no outcome can mature until 12-month windows close.
