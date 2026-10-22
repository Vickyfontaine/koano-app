# Panel 6.3: Real Estate Tycoon

Persona: built a multi-billion NYC development and investment platform, sits on REIT boards, has closed hundreds of deals across asset classes, and has sat through every proptech pitch since 2010.

Method: I read the recorded verdict (`scripts/fixtures/nyc-175-3rd-st.json`), every PDF in the repo root and `demo-kit/design-upload-2/documents`, the four dashboard screenshots, and the code that produces the numbers (`lib/agents/{synthesis,direction,entitlement,confidence,breakdown,shared}.ts`, the five specialists, `lib/documents/builders/{ic-memo,site-screening,cma}.ts`, `lib/providers/real/{nyc-zoning,nyc-sales,nyc-assemblage,nyc-dob-filings,nyc-permits}.ts`, `lib/providers/mock/proforma-benchmark.ts`). I then checked KOANO's three demo development sites against the same public NYC Open Data KOANO itself uses (read-only GET requests to MapPLUTO `64uk-42ks` and DOB NOW Job Filings `w9ak-ipjd`). That last step is where the product fell over.

---

## 0. The verdict on the verdict (read this if nothing else)

**KOANO's flagship demo tells me to BUY a site on which a 27-story, 1,071-unit tower is already permitted and under construction.**

- The homepage hero, the fixture, and the Development and Portfolio dashboards all present 175 3rd Street, Brooklyn (BBL 3009720058) as BUY. Fixture: `verdict: buy, confidence 69`, with `structural_drivers: ["97% unused FAR: large as-of-right development upside → buy"]` (`scripts/fixtures/nyc-175-3rd-st.json`, `expected.breakdown`). Dashboards: `development.png` shows "#2 175 3 STREET ... BUY 68"; `portfolio.png` shows "BUY · 68 ... LIVE".
- Public DOB NOW Job Filings (`w9ak-ipjd`, block 972 lot 58) show job **B00680917, New Building, 27 stories, 1,071 proposed dwelling units, status "Permit Entire"**, with Little E (environmental E-designation) = Yes. KOANO's own permit record in the fixture shows a Foundation permit (2026-03-04), Construction Fence and Protection permits on the subject lot. The owner is "GOWANUS 3RD STREET OWNER LLC".
- The "97% unused FAR" is a stale MapPLUTO snapshot of the 1973 G9 garage that was demolished to build the tower. The "402,010 sq ft of unused development rights" in the screening memo is being consumed by the building in the ground right now.
- The Infrastructure agent then counts the subject's own construction permits as a neighborhood "pipeline" signal and votes BUY at 82 confidence (fixture LLM record `2a7a556...`: "Ground-up construction already underway ... makes this a development-driven buy"). So the engine reads the developer's own foundation pour as evidence that someone else should buy the land. That is circular and it is the single heaviest vote in the panel (+164 of a +89 net).

The second demo site in the Development dashboard, 1800 Park Avenue (BUY 79, ranked #1), is a V1 vacant lot owned by "1800 PARK PROPERTY OWNER LLC" with a 23-story New Building job (M01338604) in plan review. The third comparison site in `comparison-brief-3-sites.pdf`, 70-33 260th Street (ADVANCE 72, "167,793 sf unused development rights"), is **Glen Oaks Village Owners Inc, a C6 walk-up cooperative with 128 apartments** (MapPLUTO). KOANO rated a garden co-op full of shareholder households as a development site to advance.

All three demo "development opportunities" are either already under development by their owners or are occupied co-ops. An acquisitions analyst who brought any of these to my IC as a BUY or ADVANCE would not be fired for being wrong. They would be fired for not having looked at the DOB filing and the owner name, which takes four minutes.

Root causes, all in code:
1. `nyc-dob-filings.ts` reads only legacy BIS (`ic3t-wcy2`). DOB NOW job filings (`w9ak-ipjd`), where every new building since roughly 2020 lives, are never queried. So "Subject-Lot Filing History" in `koano-entitlement-memo.pdf` lists 2010 and 2012 A2 alterations and misses the 1,071-unit NB.
2. `nyc-permits.ts:221` counts `new_building_permits` by `work_type.includes('new building')`. DOB NOW approved permits carry work types like "Foundation", "General Construction", "Standpipe" (see fixture), so a tract in the middle of the Gowanus build-out reports **0 new-building permits in 24 months**. The IC memo then writes "the absence of new building permits ... indicates no ground-up supply pressure on the immediate site" (`koano-ic-memo-175-3rd.pdf` p.3). That sentence is false about the immediate site.
3. `direction.ts:62-65` adds +1.0 to the score whenever `unusedFarPct >= 80`, with no check for an active NB job, a co-op/condo class, rent-regulated occupancy, landmark status, or whether the parcel is even for sale.

Fix these three before showing KOANO to anyone who has ever underwritten land.

---

## 1. Would I pay? $1,499 / $15,000 / $150,000

**$1,499 a month (the Portfolio tier, `lib/stripe/client.ts:24`): not today.** What I get for it is a public-record dossier plus a scored opinion that is wrong on the demo sites, an IC memo with four of nine sections blank, and a "portfolio risk report" with no dollars in it. My first-year analyst produces the dossier part in a morning with ZoLa, DOB NOW, ACRIS and HPD Online. What would make $1,499 an easy yes for a 5 to 20 person shop:
- A correct, instant **site and building fact pack** for any NYC BBL: true zoning (including special district rules decoded, City of Yes UAP and transit-oriented bonuses, E-designations, landmarks/historic district, MIH area), the live DOB NOW pipeline on the lot and block, ACRIS chain of title and mortgages, rent-regulated unit status, tax class and abatement status, open liens. Correct means it catches the 1,071-unit NB.
- **Monitoring that pays for itself**: the weekly diff (`lib/monitor/*`) pointed at my watchlist of 200 target parcels, alerting on new ACRIS mortgages, lis pendens, deed transfers, NB/DM filings, tax lien sale list inclusion, HPD AEP enrollment. This is the off-market sourcing engine. KOANO already has the archive and the diff pipeline; it is pointed at the wrong signals.
- Drop the buy/sell/hold verdict on development sites entirely at this tier (see section 3).

**$15,000 a month: only if KOANO underwrites.** That buys a seat in the deal workflow of a mid-size developer or a debt fund. It must:
- Take my inputs (price, program, capital stack) and produce a **land residual and development pro forma** with hard/soft cost, construction loan sizing, 485-x wage-tier implications, MIH/UAP affordability set-asides, lease-up, stabilized NOI, exit cap, levered/unlevered IRR, and a sensitivity grid on rent, cost, cap rate and timeline.
- Produce an **air-rights and assemblage map** with priced TDR comps from ACRIS (zoning lot development agreements and development-rights conveyances), contiguity, and owner contact chains through LLC piercing.
- Produce a lender-grade **existing-asset underwrite** for multifamily: rent-stabilized unit count from DOF/DHCR-derived lists, legal regulated rent estimate, J-51 status, 421-a expiry dates, HPD/DOB violation burden, DSCR at current SOFR plus spread, debt yield, maturity wall.
- Plug into Argus/Excel and my data room, so the output is my model, not a PDF I re-key.

**$150,000 a year: only as a system of record with a calibration track record.** At that price I am buying either (a) a proprietary dataset I cannot rebuild (the longitudinal archive of NYC public record, plus a verdict-versus-outcome history showing KOANO's calls beat a naive baseline), or (b) an integrated workflow that my IC, lenders and LPs all read from. That requires: SSO, SOC 2, tenant isolation, audit trail per user, portfolio import from Yardi/MRI, rent roll ingestion, scenario libraries, and a published hit rate. KOANO's immutable verdict table and archive (`CLAUDE.md` §07A) are the right seeds. Today the calibration record has no outcomes long enough to mean anything (archive began August 2026).

---

## 2. What the decision-makers actually agonize over, and what KOANO covers

| Who | The real agonizing decision | KOANO today | State |
|---|---|---|---|
| Developer, land | What can I build, what will it cost, what will it sell or rent for, so what can I pay for the land (residual)? | FAR envelope from PLUTO only; no program, no cost, no residual, no price input anywhere (`/api/agents` takes `{ address }` only, `src/app/api/agents/route.ts:21-27`) | PARTIAL / MISSING |
| Developer, land | Is the seller real and motivated; who controls adjacent lots; who holds the debt? | Exact-name owner match on one block, no ACRIS, no debt, no contiguity (`nyc-assemblage.ts`) | PARTIAL |
| Developer, entitlement | As-of-right or discretionary? Which actions (ULURP, BSA, CPC special permit, City of Yes bonuses), how long, what affordability mandate? | "Entitlement" is DOB alteration filing approval ratios (see section 4.3). No ULURP, no ZAP, no BSA, no CEQR, no E-designation | MISSING (mislabeled) |
| Developer, capital | Which tax program (485-x tier and wage requirement, 421-a legacy vesting deadline, ICAP for commercial, J-51 for rehab), and does the deal pencil with it? | Zero references to 485-x, 421-a, ICAP or J-51 anywhere in `lib/` or `src/` (grep) | MISSING |
| Acquisitions, multifamily | How many units are rent stabilized, what are legal rents, what can I do post-HSTPA 2019? | Zero references to rent stabilization or DHCR anywhere in code (grep) | MISSING |
| Lender | Debt yield, DSCR, LTV/LTC, sponsor track record, collateral liens, maturity | Nothing. "DSCR" grep hits are false positives on `job_status_descrp` | MISSING |
| Broker | Who will sell in the next 12 months? | Monitoring exists but watches violations/permits, not loan maturities, estate filings, lis pendens, tax arrears | PARTIAL |
| Asset manager | NOI trend, lease rollover, capex, insurance, tax assessment exposure | Hazard flags; tax appeal packet for homeowners. No NOI, no assessment-vs-income test for income property | PARTIAL |
| Distressed buyer | Who is in trouble: lis pendens, tax liens, ECB judgments, mortgage maturities in a high-rate world | Not modeled | MISSING |

KOANO addresses the easiest 15% of the work (what does the public record say about this lot) and labels it with the vocabulary of the hardest 85% (buy, advance, IC memo, entitlement risk).

---

## 3. Does buy / sell / hold / wait / pass with a "signal window" mean anything to an IC?

For a development site: **no**, and it actively damages credibility.

- An IC decides whether to commit capital **at a price, on a program, with a capital stack**. "BUY" with no price is not a recommendation; at $50M the Gowanus site might be a steal and at $150M a career-ender. KOANO has no price input anywhere in the pipeline.
- "Hold" and "sell" presuppose ownership. A developer screening a site does not own it. The regulatory agent prompt redefines them per agent (`regulatory-policy.ts:25`: "buy = regulatory tailwinds", "wait = entitlement uncertainty"; `infrastructure.ts:18`: "buy = strong committed pipeline lifting the area"). So the five votes being averaged do not even share a meaning. Averaging "regulatory tailwind" with "pipeline lifting the area" with "demand stable" produces a number with no unit.
- "Signal window 12 months" is the median of three hard-coded buckets (`shared.ts` `WINDOW_BAND_TO_MONTHS = {short: 3, medium: 12, long: 24}`, `synthesis.ts:134-135`). It is the LLM's coarse feel, not a forecast horizon tied to any event (rezoning hearing, rate reset, lease expiry, 421-a vesting deadline). An IC member will ask "what happens at month 13?" and there is no answer.
- **The confidence number describes a different verdict than the one displayed.** `synthesis.ts:117-126` computes confidence from agreement with the *modal* agent verdict (here HOLD, three of five agents), then shows it next to the *nudged* verdict (BUY, which one agent voted). "BUY, confidence 69" really means "69% confident the agents mostly said HOLD". The code comment admits this is deliberate. To an IC it reads as 69% confidence in BUY. That is misleading on its face.
- **The same site got three different calls in nine days** from three different scoring systems: Screening Memo ADVANCE 78 (2026-08-18, `screening-memo-175-3rd-street.pdf`), IC Memo HOLD 66 (2026-08-19, `koano-ic-memo-175-3rd.pdf`), fixture BUY 69 (2026-08-27). The screening memo uses its own ADVANCE/HOLD/PASS score (`site-screening.ts:205-262`); the verdict engine uses buy/hold/wait/sell/drop; the IC memo maps "drop" to "PASS" (`ic-memo.ts:65`). `CLAUDE.md` §09 says the enum includes "pass"; the code type is `'buy' | 'sell' | 'hold' | 'wait' | 'drop'` (`shared.ts:26`). Pick one vocabulary.
- **Exhibit B can contradict the title page.** The IC memo rebuilds the math from stored summaries via `breakdownFromSummaries` (`breakdown.ts:89-116`), which has no structural nudge. For the current BUY verdict, Exhibit B would print "Weighted score 0.23 vs thresholds: buy ≥ 1 ... → BUY" (`ic-memo.ts:452-453`). The table proves the opposite of the conclusion. An IC member reads Exhibit B first.

What an IC wants instead, for a development site: **"Max supportable land price $X to $Y per buildable sq ft under program A (as-of-right) and program B (City of Yes UAP / MIH), at today's costs and exit cap, with these five risks priced."** For an existing asset: **"At ask $X: going-in cap, stabilized cap, DSCR at market debt, levered IRR, and the three assumptions that flip it."** A verdict word can sit on top of that as a summary. It cannot replace it.

---

## 4. Underwriting logic, item by item

### 4.1 "FAR headroom +1.0 nudge toward BUY" is unsound
`direction.ts:62-65`: `unusedFarPct >= 80 → nudge += 1.0`. The buy threshold is 1.0 (`breakdown.ts:30`), so FAR headroom alone is worth an entire verdict band. Unused FAR is worth roughly nothing in each of these common NYC cases, none of which the code checks:
- **Active NB job on the lot** (175 3rd St, 1800 Park Ave). PLUTO lags demolition and construction by a year or more.
- **Rent-stabilized occupied building.** You cannot demolish without vacating; post-HSTPA, demolition of stabilized units requires DHCR approval and tenant relocation, and buyouts can run to six figures per unit. Unused FAR over a 40-unit stabilized walk-up is a liability, not a buy signal.
- **Co-op or condo** (70-33 260th St, Glen Oaks Village co-op). Redevelopment requires a shareholder or unit-owner vote that will never happen.
- **Landmark or historic district.** LPC approval governs massing; the FAR exists on paper.
- **Use group and bulk limits**: PLUTO `residfar` is the district maximum. Height limits, lot coverage, yard rules, sliver law, and special district envelopes often cap realizable floor area below FAR. `screening-memo` says so in small print ("not height- or parking-complete") while the headline says "402,010 sq ft of unused development rights".
- **Special district FAR not modeled.** The subject's special district code is "G" (Gowanus). The prompt forbids the agent from naming it (`regulatory-policy.ts:20`: "Do NOT describe the district's specific rules, name..."). PLUTO's 3.44 is the base. A 1,071-unit, 27-story program on a 120,793 sq ft lot implies realized floor area far above the 415,528 sq ft "base max" KOANO reports (my inference from the unit count; exact gross floor area not checked). KOANO is wrong in both directions on the same site: it says the FAR is unused when it is being used, and it undercounts how much FAR exists.
- **Air rights already sold.** A zoning lot development agreement recorded in ACRIS may have transferred the "unused" FAR to a neighbor years ago. PLUTO does not know.

Correct logic: unused FAR is a **feature to be priced**, conditional on (no NB/DM job, not stabilized, not co-op/condo, not landmarked, no ZLDA recorded), and its value is (realizable sq ft) × (land value per buildable sq ft from land comps) minus (cost to vacate). That is a number, not a nudge.

### 4.2 Comps are the wrong asset class
`nyc-sales.ts:159-166` filters to DOF classes 01/02/03/09/10/12/13 (one-to-three family, condos, co-ops). The market-timing agent and the IC memo then compare a 120,793 sq ft industrial development site to two-family brownstones at $1,154/sq ft (fixture `mlsComps` record). The LLM even calculates "an 80% LTV mortgage on a $1.7M purchase implies ~$9,100/month" (fixture record `94742af...`) for a site that will be financed with a construction loan. The correct comps for a development site are **land and development-site sales per buildable sq ft** (DOF classes V and commercial/industrial with ZR buildable area), and for a stabilized multifamily asset, **multifamily sales per unit and per sq ft with cap rates**. The IC memo's disclaimer "NOT institutional CRE transactions" (`ic-memo.ts:399-401`) is honest, but then the section should not be in an IC memo.

### 4.3 "Entitlement risk" is DOB alteration paperwork
`nyc-dob-filings.ts` aggregates all legacy BIS job filings for the community district, all job types, and calls approved/(approved+disapproved) the "entitlement approval ratio" (lines 137, 164-165). CD 306: 52,392 filings, 95% approved, median 573 days (`koano-entitlement-memo.pdf`). These are overwhelmingly A2/A3 alterations (kitchens, plumbing, facade work). Entitlement in NYC means **discretionary land use actions**: ULURP rezonings, CPC special permits and authorizations, BSA variances and special permits, LPC certificates, CEQR. Their timelines are tracked in DCP's ZAP (Zoning Application Portal) data and BSA calendars, both public. The screening memo uses this 95% as one of two "primary ADVANCE conditions" (`site-screening.ts:228-232`, narrative in the PDF). The "567-day entitlement timeline" headline in the screening memo is the median time from pre-filing to sign-off of DOB jobs. Any land-use attorney reading this memo stops reading.

### 4.4 Assemblage and air rights
`nyc-assemblage.ts` sums PLUTO unused FAR across every other lot on the tax block and finds exact-name same-owner lots. Problems:
- Zoning lot mergers require **contiguous** lots within a block. Summing unused FAR across non-contiguous lots on a large block overstates what is mergeable.
- The note "NYC zoning lots and TDR (air-rights) transfers are constrained to a single tax block" (line 20-23) is wrong for TDR: landmark transfers can cross a street (ZR 74-79), and several special districts run district-wide transfer programs (East Midtown, West Chelsea/High Line corridor, Theater Subdistrict). Practitioner knowledge; not web-verified in this audit.
- No **price**. The entire value of an air-rights read is $/buildable sq ft of TDR comps, which are visible in ACRIS as development-rights deeds and zoning lot description/ZLDA filings.
- No **ownership resolution**. LLC-per-building ownership defeats exact-name match. ACRIS signatories, HPD contact names, and DOS filings let you pierce it.
- "Unused rights on OTHER block lots: 0" for a lot alone on its block is correct but meaningless; the real assemblage question for a 120k sq ft waterfront site is across-street and mapped-street issues.

### 4.5 Pro forma benchmarks
`mock/proforma-benchmark.ts` returns the same constants for every address in NYC: land $210/buildable sq ft, construction $465/sq ft, exit cap 5.25%, absorption 11 units/month. Labeled representative, which is honest. But a single constant for Manhattan high-rise and a Staten Island garden building is not a benchmark, it is a placeholder; even labeled, it should not render as a figure. Hard costs for a 27-story NYC high-rise subject to 485-x prevailing-wage-style requirements (for 100+ unit projects in the designated zones) run well above a flat $465 (practitioner knowledge, unverified in this audit).

### 4.6 CMA math mixes populations
`cma.ts:77-79` computes the "HPI-adjusted midpoint" as the trimmed median of only the displayed nearest comps (`pricing.facts.comps`), while the unadjusted midpoint is the median of all 154. In `cma.pdf` the per-comp HPI adjustments are 1% to 5% ($560 → $580, $1,362 → $1,429), yet the headline moves from $1,231 to $1,420 (+15%) and is described as moving "each comparable's price to today using ... +5.7% YoY". The +15% is a sample switch dressed as a time adjustment. A listing agent who quotes $5.2M to a seller off this sheet has a problem.

### 4.7 Pricing sheet prices the subject below its own sale
`koano-pricing-sheet.pdf` (369 6th Street, generated 2026-08-19): midpoint $2,209,920. Exhibit row: "369 6TH STREET 2026-06-18 $4,050,000". The subject sold for $4.05M two months earlier and appears in its own comp set; the sheet recommends 45% less. The subject's own recent arm's-length sale must be excluded from comps and surfaced as the primary evidence. (This sheet is also an older ZIP-keyed version; the scope note says so. It is still in the repo root as a sample.)

### 4.8 Portfolio risk report has no money in it
`portfolio-risk-report.pdf`: flood zone, Superfund count within 2 miles, PGA, disaster declarations, crime trend. No asset value, no NOI, no debt, no maturity, no insurance cost, no assessed value trend, no rent-regulated share, no lease rollover. "2 of 3 within 2 miles of a Superfund site" is true of most of brownstone Brooklyn and Queens; it is not a risk ranking. The 47-07 Vernon Blvd row shows a bare dash glyph for Superfund, a few blocks from Newtown Creek (a Superfund site); a dash reads as "none" to a busy reader. Seismic PGA for three NYC properties is noise in a portfolio report. A REIT board risk report is about **concentration, leverage, rollover, and exposure in dollars**.

### 4.9 The IC memo is a template with a cover page
`koano-ic-memo-175-3rd.pdf` has 9 sections; 6 through 9 (Financial Analysis, Business Plan, Exit, Key Terms) say "TO BE COMPLETED BY THE ANALYST" (`ic-memo.ts:410-418`). Honest, but those are the sections the IC actually reads. Missing entirely, even as placeholders: sources and uses, capital structure, sponsor/JV terms, debt terms, rent roll summary, operating history, tax/abatement status, environmental (Phase I), legal/title, construction budget and schedule, market rent comps, sale comps of the asset type, sensitivity tables, downside case, and the "why now / why us" thesis. What is filled in is a PLUTO table, a house-price index, brownstone comps, and a weighted vote of LLM opinions. Also: the letterhead on the generated sample reads "Analyst Name / KOANO Capital Partners" (p.1), a placeholder firm name that should never appear in a sample handed to a prospect.

### 4.10 Checklist of what serious professionals expect

| Item | State | Evidence |
|---|---|---|
| Rent rolls | MISSING | Only mentioned as unavailable (`src/app/for/institutions/page.tsx:47-49`) |
| Cap rates | MISSING (constant mock 5.25% only) | `mock/proforma-benchmark.ts` |
| Debt sizing, DSCR, debt yield, LTV/LTC | MISSING | no references in `lib/` |
| Sensitivity tables | MISSING (placeholder text) | `ic-memo.ts:411` |
| Exit scenarios | MISSING (placeholder) | `ic-memo.ts:413` |
| Entitlement timelines | PARTIAL, mislabeled (DOB filings) | `nyc-dob-filings.ts` |
| Construction cost | MISSING (constant mock) | `mock/proforma-benchmark.ts` |
| 485-x | MISSING | grep: no hits |
| 421-a legacy (vesting, completion deadline, expiring benefits on existing assets) | MISSING | grep: no hits |
| ICAP | MISSING | grep: no hits |
| J-51 | MISSING | grep: no hits |
| Air rights pricing | MISSING | `nyc-assemblage.ts` sums sq ft, no $ |
| Assemblage | PARTIAL (block-level, no contiguity, exact-name owner) | `nyc-assemblage.ts` |
| Lender appetite | MISSING | none |
| Distressed signals: lis pendens, tax liens, ACRIS mortgages/maturities | MISSING | grep: ACRIS appears only in IC memo advice text (`ic-memo.ts:383`) |
| Off-market sourcing | MISSING (monitoring infrastructure exists, wrong signals) | `lib/monitor/detect.ts` |
| Rent stabilization status / DHCR unit counts | MISSING | grep: no hits for stabiliz/DHCR in code |
| City of Yes | PARTIAL: PLUTO `affresfar` shown as "City of Yes affordable max" | `ic-memo.ts:322`, screening memo |
| E-designations / OER | MISSING (the 175 3rd St NB carries Little E = Yes) | DOB NOW `w9ak-ipjd` |
| Landmarks / historic districts | MISSING | none |
| DOB NOW job filings (NB/DM/A1 pipeline) | MISSING | only legacy BIS `ic3t-wcy2` and approved permits |

Rent stabilization deserves its own paragraph. In NYC multifamily it is **the** variable. Roughly half the city's rental stock is stabilized (widely reported; not re-verified here). A pre-1974 building with six or more units is presumptively stabilized unless deregulated, and since HSTPA 2019 deregulation is essentially closed, so value is capped by legal regulated rents, IAI/MCI recovery limits, and the stabilized-unit share. KOANO's 47-07 Vernon Blvd (S5, 6 residential units, built 1923 per MapPLUTO) is exactly the profile where stabilization status decides whether the deal exists. KOANO's HPD registration provider already knows the building is a registered multiple dwelling; it never asks the stabilization question. Public proxies exist: DOF property tax bills historically list stabilized unit counts, and DHCR publishes an annual list of buildings containing stabilized units (public, building-level, no unit counts). Neither is wired.

---

## 5. Which outputs I would trust, ignore, or fire someone for

**Trust (as a starting fact pack, verified by a human):**
- MapPLUTO fields as displayed (zoning district, lot area, owner of record, assessed values), with a PLUTO version stamp. EXISTS.
- FEMA flood zone, HPD/ECB violation counts, HPD registration and Speculation Watch List flags. EXISTS. The "zeros are a coverage fact" notes (`ic-memo.ts:367`) are exactly right.
- The provenance appendix and the due-diligence gap register in the screening memo (title, survey, Phase I, utilities, easements listed as open). This is the most professional page KOANO produces.
- Recorded sales list itself, as a list (not the conclusion drawn from it).

**Ignore:**
- Demand-Sentiment and Market-Timing agents for anything above a 1-4 family house. HMDA denial rates, county QCEW, IRS migration, 30-year fixed rates and FHFA HPI are homebuyer signals. They say nothing about a 1,071-unit rental tower's lease-up or a construction lender's terms.
- "Gentrification stage 6-7 of 7" (fixture LLM record): an unfalsifiable label generated by prompt instruction (`demand-sentiment.ts`, "estimate the gentrification stage on a 1-7 scale").
- Risk score 51. It is 0.5 × risk agent + 0.5 × panel mean of LLM bands {25, 50, 80} (`synthesis.ts:129-131`). Every agent except regulatory returned exactly 50.
- Superfund-within-2-miles counts in NYC.

**Would get an analyst fired if presented to my IC:**
1. BUY / ADVANCE on 175 3rd St and 1800 Park Ave with active NB jobs on the lot, and ADVANCE on the Glen Oaks co-op. Not checking DOB NOW and the owner is the first thing anyone is taught.
2. "Entitlement approval ratio 95%" derived from DOB alteration filings.
3. "No ground-up supply pressure on the immediate site" written beside a foundation permit on the immediate site.
4. A pricing sheet midpoint 45% below the subject's own sale two months earlier.
5. A CMA headline that attributes a 15% sample switch to a 5.7% HPI adjustment.
6. Exhibit B showing a score below the buy threshold under a BUY title (for any memo built from a nudged verdict).
7. "Confidence 69" shown next to a verdict only one of five agents voted for.
8. Brownstone comps in the comparable-sales section of a development-site IC memo.

---

## 6. How deals actually get done, and where KOANO must live

The real NYC development and acquisitions workflow:
1. **Sourcing**: brokers' off-market calls, owner outreach lists, distress (maturing debt, estates, tax arrears, lis pendens), relationship flow. 90% of deals die here or never surface.
2. **Screening** (minutes per site): zoning and as-of-right yield, quick land residual, red flags (stabilized tenants, landmarks, E-designation, title).
3. **Underwriting** (days): massing study, program, cost estimate, tax program, pro forma, financing quotes, sensitivity.
4. **LOI and negotiation**.
5. **Due diligence** (30 to 90 days): title, survey, Phase I/II, zoning opinion, structural, rent roll audit, estoppels, DHCR rent history.
6. **IC approval**, then **financing** (lender package), **closing**.
7. **Asset management**: monitoring, refinancing, tax certiorari, lease-up, disposition.

KOANO today sits at step 2 and pretends to be step 6. The defensible place is **steps 1 and 2 combined, run continuously across the whole city**, feeding step 3:

- **"Every buildable site in NYC, re-scored every week, against my criteria."** Not "type an address and get an opinion". A developer defines a buy box (boroughs, min buildable sq ft, as-of-right only, max land price per BSF, no stabilized occupancy). KOANO runs the whole PLUTO universe nightly, corrects PLUTO with DOB NOW filings and ACRIS, prices it with a residual model, and pushes the 10 new sites a week that clear the bar, with owner, lender and maturity date. That becomes the morning screen of every acquisitions team. You cannot remove a tool that generated last quarter's best deal.
- **Owner-and-debt graph.** Linking ACRIS mortgages and assignments, HPD contacts, DOS entity filings, and LLC signatories turns "GOWANUS 3RD STREET OWNER LLC" into a sponsor with a portfolio, a lender and a maturity schedule. This is the lender-maturity off-market play, and it is all public in NYC.
- **Export into the model.** Every screen exports a populated Excel/Argus input tab (site facts, program, zoning envelope, abatement eligibility) so the analyst's existing model starts pre-filled. The IC memo then pulls its financial sections from the analyst's model, instead of leaving them blank.
- **The lender package.** Lenders need the same zoning, title, tax and environmental facts with sources. A provenance-stamped "collateral fact sheet" that a debt fund can rely on is a second buyer for the same data.

The archive (`CLAUDE.md` §07A) and monitoring diff are the right infrastructure for this. They are currently pointed at violations and permits on properties a user typed in. Point them at the entire city and at transaction-predictive signals.

---

## 7. Next asset classes and geographies after NYC

**Asset classes (ranked by value unlocked per engineering effort):**
1. **NYC rent-regulated and mixed multifamily (existing assets).** Highest value, largest distressed-sale wave (post-HSTPA, high rates, maturing 2019-2021 vintage debt), and the data is public: HPD registrations, DOF tax bills, DHCR building list, ACRIS debt, violation history. Deliver stabilized-unit estimate, legal-rent proxy, DSCR at today's rates, refi gap. Effort M-L, Impact 9.
2. **NYC development land under City of Yes / 485-x.** The current focus, done correctly: DOB NOW pipeline, ZAP, E-designations, landmarks, residual pricing. Effort L, Impact 9.
3. **Office-to-residential conversion screening (NYC first).** Floor plate depth, light and air, 467-m tax incentive eligibility, conversion-allowed districts after City of Yes. Huge policy tailwind, scarce tooling. Effort L, Impact 7. (467-m is from the 2024 state budget; practitioner knowledge, not web-verified here.)
4. **Industrial / last-mile and data-center land** (power availability is the binding constraint). Effort XL, needs utility data. Impact 7.
5. Skip retail and hospitality until there is paid tenant and STR data.

**Geographies (ranked):**
1. **Northern New Jersey Gold Coast (Jersey City, Hoboken, Newark)**: same buyer universe as NYC, municipal data uneven but parcel and tax data exist via NJ MOD-IV. Immediate cross-sell to every NYC client. Impact 8.
2. **Los Angeles**: ZIMAS zoning, LADBS permits, rent stabilization (RSO) and Measure ULA transfer tax distress, TOC incentives; an NYC-like regulatory density that rewards KOANO's style. Impact 8.
3. **Boston/Cambridge and Washington DC**: open data, strong institutional capital, rent control debates (DC rent control is real), lab/office conversion. Impact 6.
4. **Sun Belt (Dallas, Austin, Phoenix, Miami)**: largest transaction volume, but little zoning friction means less for KOANO's zoning engine to add; the value there is supply pipeline and distress. Impact 6, later.

Pick markets where **regulation is the alpha** (NYC, NJ, LA, DC). That is where a public-record reasoning engine beats a CoStar subscription.

---

## 8. Top 10 problems (ranked by impact on enterprise value)

| # | Problem | Evidence | State | Effort | Impact |
|---|---|---|---|---|---|
| 1 | Flagship demo recommends BUY/ADVANCE on sites already under construction by their owners (175 3rd St: 27-story, 1,071-unit NB; 1800 Park Ave: 23-story NB) and on an occupied co-op (Glen Oaks Village) | fixture `expected`; `development.png`; `comparison-brief-3-sites.pdf`; DOB NOW `w9ak-ipjd`; MapPLUTO | PARTIAL (wrong) | S to fix the demo, M to fix the class | 10 |
| 2 | No DOB NOW job filings; NB permits misclassified to zero | `nyc-dob-filings.ts` uses only `ic3t-wcy2`; `nyc-permits.ts:221` | PARTIAL | S | 9 |
| 3 | FAR headroom is a +1.0 verdict nudge with no NB/co-op/condo/stabilized/landmark/ZLDA exclusions and no price | `direction.ts:62-65` | PARTIAL | S (guards) to M (pricing) | 9 |
| 4 | "Entitlement risk" is DOB alteration filing approval ratio | `nyc-dob-filings.ts:137,164`; `koano-entitlement-memo.pdf`; `site-screening.ts:228-240` | PARTIAL (mislabeled) | M (ZAP + BSA) | 8 |
| 5 | No price, no pro forma, no debt: verdicts float free of the only variable an IC cares about | `api/agents/route.ts:21-27`; `ic-memo.ts:410-418` | MISSING | L | 9 |
| 6 | Rent stabilization, 485-x, 421-a, J-51, ICAP absent | grep across `lib/`, `src/` | MISSING | M | 8 |
| 7 | Confidence describes the modal agent verdict, displayed beside the nudged verdict; Exhibit B rebuild omits the nudge | `synthesis.ts:117-126`; `breakdown.ts:89-116`; `ic-memo.ts:442-454` | PARTIAL | S | 7 |
| 8 | Three incompatible verdict systems for one site (ADVANCE 78, HOLD 66, BUY 69 within 9 days); "drop" vs "pass" | `site-screening.ts:249`; `shared.ts:26`; `ic-memo.ts:65`; PDFs | PARTIAL | S | 7 |
| 9 | Homebuyer signals (HMDA, 30-yr fixed, 1-3 family comps, FHFA) drive development and institutional verdicts | `market-timing.ts`, `demand-sentiment.ts`, `nyc-sales.ts:159-166` | PARTIAL | M | 7 |
| 10 | Document math errors that a client will catch: CMA sample switch presented as HPI adjustment; pricing sheet ignores subject's own sale; air-rights rule misstated; placeholder "KOANO Capital Partners" letterhead | `cma.ts:77-79`; `koano-pricing-sheet.pdf`; `nyc-assemblage.ts:20-23`; IC memo p.1 | PARTIAL | S | 6 |

## 9. Top 10 opportunities (ranked)

| # | Opportunity | State | Effort | Impact |
|---|---|---|---|---|
| 1 | **City-wide site radar**: nightly scoring of every NYC lot against a user's buy box, PLUTO corrected by DOB NOW and ACRIS, weekly push of new qualifying sites | MISSING (archive + diff infra EXISTS) | L | 10 |
| 2 | **Owner-debt graph from ACRIS**: mortgages, assignments, satisfactions, lis pendens, LLC signatories, inferred maturities; the off-market and distress engine | MISSING | L | 10 |
| 3 | **Land residual engine** with user inputs (price, program, cost, rent, cap, rate), showing max land $/BSF as-of-right vs City of Yes UAP/MIH, 485-x eligibility and wage tier | MISSING | L | 9 |
| 4 | **Rent-regulated multifamily underwrite**: stabilized-unit estimate, legal rent proxy, DSCR at market debt, refi gap, HSTPA constraints | MISSING | M-L | 9 |
| 5 | **True entitlement module**: ZAP ULURP/CPC history by district and action type, BSA outcomes, LPC, E-designations, with real timelines | MISSING | M | 8 |
| 6 | **Air-rights market**: TDR/ZLDA comps priced from ACRIS, contiguity-aware mergeable FAR, owner contact chain | MISSING | M | 8 |
| 7 | **Model export**: every screen exports a populated Excel/Argus input tab; IC memo financial sections pull from the user's model | MISSING | M | 8 |
| 8 | **Lender collateral fact sheet**: provenance-stamped zoning/title/tax/environmental pack for debt funds (second buyer, same data) | PARTIAL (doc engine EXISTS) | M | 7 |
| 9 | **Calibration record that matters**: score past verdicts against observed land sales $/BSF and NB filings, publish hit rate vs naive baseline | PARTIAL (`verdict_outcomes` EXISTS) | M, needs time | 8 |
| 10 | **Gold Coast NJ, then LA** as the next markets, chosen because regulation is the alpha | VISION | XL | 7 |

## 10. What I would rebuild first

1. **This week (S):** pull 175 3rd St, 1800 Park Ave and 70-33 260th St from every demo surface, the homepage hero, and the fixture. Replace them with a site that is genuinely vacant, unencumbered and unfiled, and check DOB NOW and ACRIS by hand before using it. Delete the root-level stale sample PDFs (`koano-ic-memo-175-3rd-STALE.pdf`, the ZIP-keyed pricing sheet).
2. **Next two weeks (S-M):** add DOB NOW Job Filings (`w9ak-ipjd`) to permits and filings; classify NB/DM by job type; add hard exclusions to `direction.ts` and `site-screening.ts` (active NB/DM job on lot, C6/C8/D4 co-op classes, R-class condos, HPD-registered with 6+ units pre-1974, landmark/historic district) that suppress the FAR nudge and flag the site. Rename "Entitlement track record" to "DOB filing record" until ZAP is wired. Fix the confidence-to-verdict mismatch and include the nudge in `breakdownFromSummaries` (persist it).
3. **Next quarter (L):** the land residual engine with user-entered price and program, and the ACRIS owner-debt graph. Then re-express the verdict as **"supportable land value vs ask"** for sites and **"DSCR and IRR at ask"** for existing assets. Keep the deterministic aggregator; change what it aggregates from LLM mood bands to priced facts.

## 11. The one thing that would make me say "I have never seen anything like this"

**Type nothing. Open KOANO on Monday and it says: "Seven NYC sites cleared your buy box this week. #1: 41,000 sq ft M1-4/R7X lot in Long Island City, as-of-right 236,000 BSF under City of Yes UAP, no NB or DM filing, no stabilized tenants, owner is a 2019-vintage LLC whose $28M ACRIS mortgage from a regional bank matures in 7 months at a rate 300 bp below today's. Supportable land value at your assumptions: $165 to $190 per BSF, about $39M to $45M. The owner's last refinance would need $9M of new equity to clear. Here is the deed chain, the lender, the signatory, and your pre-filled model."** Every number sourced, every inference labeled, the verdict math reproducible. Nobody does that across a whole city today with provenance on every line. The public data to do most of it in NYC exists; KOANO already has the archive, the diff engine and the provenance discipline to build it.

---

## Grounded vs VISION separation

- Grounded findings: sections 0, 3, 4, 5, and problems table (all cite files, PDFs, screenshots, or the public NYC datasets KOANO already uses).
- VISION: opportunity #10, the section 11 scenario (the specific LIC site, figures and lender in it are illustrative, not real), section 7 geography rankings, and the $15k / $150k feature lists in section 1.
- Statements labeled "practitioner knowledge, not web-verified" (TDR exceptions under ZR 74-79 and special districts, 485-x wage requirements, 467-m, share of stabilized stock) are my professional knowledge and were not re-verified by retrieval in this audit.

## Sources

Public NYC Open Data queries executed read-only during this audit (Socrata SODA API):
- https://data.cityofnewyork.us/resource/w9ak-ipjd.json?$where=borough='Brooklyn' AND block='972' (DOB NOW Job Application Filings; 175 3rd St job B00680917, New Building, 27 stories, 1,071 units, Little E = Yes)
- https://data.cityofnewyork.us/resource/w9ak-ipjd.json?$where=house_no='1800' AND street_name like 'PARK AVE%' AND job_type='New Building' (1800 Park Ave job M01338604, 23 stories)
- https://data.cityofnewyork.us/resource/64uk-42ks.json?bbl=3009720058 (MapPLUTO 26v2: builtfar 0.11, bldgclass G9, still stale)
- https://data.cityofnewyork.us/resource/64uk-42ks.json?$where=address like '%260 STREET%' AND borough='QN' AND lotarea>50000 (70-33 260 St: Glen Oaks Village Owners Inc, class C6, 128 units)
- https://data.cityofnewyork.us/resource/64uk-42ks.json?$where=address='1800 PARK AVENUE' (V1 vacant, 1800 PARK PROPERTY OWNER LLC, C4-7, special district 125th)
- https://data.cityofnewyork.us/resource/64uk-42ks.json?$where=address like '47-07 VERNON%' (S5, 6 units, built 1923, built FAR 3.2 over 3.0)

No other web sources were used. No competitor or market-size claims are made.

## Discrepancies vs the brief

1. Brief (section 3) and `CLAUDE.md` §09 list the verdict vocabulary as buy/sell/hold/wait/**pass**. Code is `'buy' | 'sell' | 'hold' | 'wait' | 'drop'` (`lib/agents/shared.ts:26`); "PASS" exists only as the IC memo's display word for `drop` (`ic-memo.ts:65`), and the screening memo uses a separate ADVANCE/HOLD/PASS system (`site-screening.ts:194`).
2. Brief: "Verdict, confidence, risk and window are computed by pure deterministic code." True of the arithmetic, but every input is an LLM coarse band (`shared.ts` CONVICTION/RISK/WINDOW maps), the window is the median of three fixed buckets, and the displayed confidence measures agreement with the modal agent verdict rather than the displayed verdict (`synthesis.ts:114-126`).
3. Brief: zoning "with City of Yes fields". KOANO shows PLUTO `affresfar` as "City of Yes affordable max"; UAP rules, transit-oriented bonuses, special district FAR (e.g. Gowanus "G") and E-designations are not modeled, and the regulatory agent is forbidden from naming the special district (`regulatory-policy.ts:20`).
4. Brief: DOB "permits and job filings" are live providers. Job filings are legacy BIS only (`ic3t-wcy2`); DOB NOW job filings, which contain every recent new building, are not read.
5. `CLAUDE.md` §16 states "No `REPRESENTATIVE_FALLBACK` constants remain in the real providers." `nyc-zoning.ts` (R6B fallback) and `nyc-assemblage.ts` still define `REPRESENTATIVE_FALLBACK` constants, emitted under `fetch_failed`.
6. Brief: entitlement data is described as entitlement. It is a DOB filing disposition record across all job types (`nyc-dob-filings.ts`), not land-use entitlement.
7. `CLAUDE.md` §07 says "Verified: 175 3rd St → BUY" as a success case. Public DOB NOW data shows the site is under construction with a 1,071-unit permitted NB, so the "verified" case is the clearest failure in the system.
