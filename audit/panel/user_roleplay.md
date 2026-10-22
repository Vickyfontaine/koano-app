# 6.10 Target Users Role-Play Round

Four demanding users, four real NYC addresses, one honest session each.

## How this was grounded (read this first)

I could not sign in, run a live verdict, or generate a document. Every session below combines three kinds of evidence, and each claim says which one it rests on:

- **OBSERVED (artifact):** what a user literally sees in a real KOANO artifact. These are the signed-in dashboard captures (`demo-kit/design-upload-2/dashboards/{portfolio,development,transaction,community}.png`, 2026-09-30), the marketing captures in the scratchpad `shots/` folder (2026-10-19), the generated PDFs in the repo root and `demo-kit/design-upload-2/documents/`, and the recorded verdict `scripts/fixtures/nyc-175-3rd-st.json`.
- **OBSERVED (public data):** what KOANO's own providers would retrieve for the persona's address, pulled read-only on 2026-10-19 from the same NYC Open Data Socrata endpoints the providers call (PLUTO `64uk-42ks`, HPD violations `wvxf-dwi5`, HPD registrations `tesw-yqqr` and contacts `feu5-w2e2`, DOF rolling sales `usep-8jbt`, DOB filings `ic3t-wcy2`), plus public datasets KOANO does **not** read (HPD Litigations `59kj-x8nc`, Evictions `6z8x-wfk4`, 311 `erm2-nwe9`, AEP `hcir-3275`, CONH list `bzxi-2tsw`).
- **INFERRED (code):** what the dashboard and documents would show for that address, worked out by running those values through the actual code paths (file:line cited). Verdict directions are inferred from the deterministic structural nudge in `lib/agents/direction.ts`. The LLM specialist bands can't be predicted, so I give the direction the facts push toward, not a confidence figure.

Where the persona quotes a dollar figure KOANO would print, the arithmetic is mine, done with KOANO's own formulas on live data. I flag it as inferred.

---

## Persona 1: Dana, acquisitions associate, mid-size NYC multifamily fund (Portfolio tier, $1,499/mo)

**Situation.** IC is Thursday. The deal is **780 St Marks Avenue, Brooklyn 11216 (BBL 3012280007)**, a 66-unit, six-story 1921 elevator building (PLUTO class D1, 98,814 sq ft, R6). My VP wants a first-draft IC memo and a clean diligence read by tomorrow night.

### The session

**Sign-up and landing.** The homepage hero (OBSERVED, `crops/desktop__0.png`) shows a live-looking panel for 175 3rd Street: five agents, a green **BUY**, "69 confidence, 51 risk, 12mo window," "97% unused FAR → buy." *"Okay, that's slick. But it's a development site with nothing on it. I buy stabilized buildings. Where's the multifamily example?"* The pricing page sells Portfolio with "Investment Committee Memo, as PDF and editable Word" first in the list (`src/components/marketing/PricingContent.tsx:80`). That line is the reason I'm here.

**Dashboard.** OBSERVED (`portfolio.png`): the sidebar says "C3 · Portfolio intelligence," the page eyebrow says "05," and the line under the picker reads "Viewing C3. Your home cluster is C2." *"Is this C3 or 05? And what's my home cluster? I signed up for Portfolio."* (The display badge and the section number are deliberately decoupled, per `src/components/dashboard/clusters.ts:5-10`. A user has no way of knowing that.)

I paste the address into "Add a property" and hit Track, then Re-run. The loader says "typically ~60s" (`src/components/ui/LoadingState.tsx:100`). The Community empty state says "about a minute and a half." The Development page says "~1–3 min." *"Three different estimates. Fine, I'll get coffee."*

**The verdict (INFERRED).** PLUTO puts built FAR at 3.72 against a residential max of 2.43. That fires the over-max branch in `lib/agents/direction.ts:51-60`: a **−0.7 nudge**, with the driver text "no as-of-right FAR headroom (built at/over the district max): realizing value needs a variance → wait." HPD violations have also risen sharply: 92 inspections-dated violations in the last 24 months against 21 in the prior 24 (OBSERVED, `wvxf-dwi5`). So the verdict most likely lands at **WAIT or HOLD**, and the stated reason is that I can't build more on it.

*"I'm not buying it to build on it. Nearly every prewar building in Crown Heights is overbuilt against today's zoning. That's why they're worth owning. You've penalized the whole asset class for being the asset class."* (Of the ten 40 to 70 unit prewar buildings PLUTO returns for CD 308/309, nine are built over their residential FAR. OBSERVED.)

**What impressed me.** The Verdict Math panel, and the IC memo's Exhibit B, which shows each agent's verdict, weight, direction and contribution against fixed thresholds (OBSERVED, `koano-ic-memo-175-3rd.pdf` p.6). *"I've never had a vendor show me the arithmetic. My MD will actually like that."* The violations panel is real: 30 open HPD (17 class C, 12 B, 1 A), the 24-month trend flagged "rising" (`ViolationsPanel.tsx:25`, OBSERVED counts). The "coverage fact, not a clean record" language (`ViolationsPanel.tsx:84-88`) is the most honest sentence I've read from a proptech product.

**Where it fell apart: the IC memo.** Cluster 5 has two document buttons, Monday Briefing and Asset One-Pager (`src/components/dashboard/cluster5/Cluster5Dashboard.tsx:208-246`). **No IC memo button exists anywhere in the dashboard.** The API builds one (`src/app/api/documents/route.ts:375-382`) and the registry marks it available, but no UI calls it. *"The thing on the pricing page, the reason I'm paying fifteen hundred a month, doesn't have a button. Am I supposed to curl it?"*

Say support emails me one anyway, like the repo's `koano-ic-memo-175-3rd.pdf` (OBSERVED):
- The letterhead reads "Analyst Name / KOANO Capital Partners." *"Placeholder text on the cover of an IC document. If that ships to my VP, I'm done."*
- Sections 6 to 9 (Financials, Business Plan, Exit, Key Terms) each say "TO BE COMPLETED BY THE ANALYST." *"Fair. That's honest. It also means the half of the memo that IC actually debates is blank."*
- Section 5 (Comparable Sales) gives one- and two-family brownstones, honestly captioned "NOT institutional CRE transactions." For my building that's structural. `nyc-sales.ts:159-166` deliberately **excludes** DOF classes 07 and 08 (rental walk-ups and elevators), the only classes that are comps for a 66-unit rental. In the same Crown Heights ZIPs over the last five months, DOF recorded 257 Quincy St (21 units, $2.5M, about $119k/unit), 480 Lefferts Ave (48 units, $4.83M, about $105/sq ft) and 419 Vanderbilt Ave (49 units, $13.5M, about $222/sq ft) (OBSERVED, `usep-8jbt`). KOANO's ZIP 11216 home-comp median is about **$761/sq ft** (130 qualifying sales, OBSERVED with KOANO's trim rule). Run through the Property Intelligence valuation formula (median $/sq ft × PLUTO building area, `ValuationPanel.tsx:33-35`), that implies **about $75 million** for a building whose real trading range is roughly $7 to $15 million (INFERRED). *"Your comp set is off by a factor of five, and the honest caption doesn't save it. Delete the number or use the right asset class."*
- Exhibit B prints the weighted-score row as "388 … 0.89" (OBSERVED). 388 is the **sum of weights**. The contributions sum to 344. *"I spent ten minutes figuring out why 172 plus 172 is 388. It isn't."*

**Ownership: the distrust moment.** The Ownership panel (INFERRED from `nyc-landlord.ts:192-201`) exact-matches the HPD corporate owner "780.ST MARKS REALTY LLC" (note the period) and reports **1 building**, with the caveat that it's a floor. HPD contacts list a Head Officer, Tefik Capani, on **13 registrations** (OBSERVED). *"The sponsor network is the diligence. You had the head officer's name in the same API response and threw it away."*

**What KOANO never told me (OBSERVED, public, unread by KOANO):** nine HPD litigation cases, including four "False Certification" cases between 2013 and 2017 (`59kj-x8nc`), and four marshal-executed evictions (`6z8x-wfk4`). *"False certification is HPD saying the landlord lied about fixing violations. That's a red flag on the seller, and your 'risk' agent doesn't know it exists."*

**Capacity.** The global circuit breaker defaults to **50 attempts per rolling 24h across all users** (`lib/koano-guard.ts:85-88`), while my plan promises 500 (`koano-guard.ts:44`). A busy day for other customers can return "KOANO's demo capacity for the day is used up." *"The word 'demo' in an error message on a $1,499 plan."*

### Dana's verdict

- **Confused by:** C3 vs 05 vs "home cluster C2"; three different run-time estimates; Exhibit B's 388; why a "risk" verdict says "wait" because I can't add floors.
- **Impressed by:** the verdict math exhibit, the provenance appendix, and violation scoping that says what it doesn't cover.
- **Distrusted:** comps from the wrong asset class turned into a valuation; a one-building owner portfolio; a FAR-driven verdict on a hold asset; the IC memo carrying placeholder letterhead.
- **Would screenshot:** the HPD class breakdown with the "rising" flag, and Exhibit B (with the 388 fixed). *"Look, it shows its math."*
- **Would I pay?** *"Not $1,499. Today it's a $200 to $400 per-seat diligence pull. Fix multifamily comps (07/08 with $/unit), surface litigation and evictions, resolve the owner network by head officer, and give me the IC memo button with DOCX, and it's $1,500 a month without a second thought. My fund pays more than that for worse."*

---

## Persona 2: Marcus, ground-up developer comparing three Brooklyn sites (Development tier, $499/mo)

**Situation.** Three vacant lots on my desk, all PLUTO class V (OBSERVED):

| Site | BBL | Zoning | Lot | Base res FAR → base sq ft | City of Yes affordable FAR → sq ft |
|---|---|---|---|---|---|
| A. 213 Third Avenue, 11217 (Gowanus) | 3004270007 | M1-4/R7X, Special District G | 9,714 | 5.00 → 48,570 | 6.00 → 58,284 |
| B. 279 Euclid Avenue, 11208 (East New York) | 3041450013 | R7A | 14,987 | 4.00 → 59,948 | 5.01 → 75,085 |
| C. 703 Myrtle Avenue, 11205 (Bed-Stuy/Clinton Hill) | 3017350039 | R7D | 8,620 | 4.66 → 40,169 | 5.60 → 48,272 |

### The session

**The page.** OBSERVED (`development.png`): three address slots, "Run comparison," "Up to three sites · all five agents run on each · ~1–3 min," then a map and a ranked table (Rank, Verdict, Confidence, Risk, Entitlement risk, Window, Provenance). *"Clean. Fastest path to a ranked list I've seen. Three pins on a real map, provenance on every row. Good."*

**The ranking (INFERRED).** All three lots are vacant, so built FAR is 0 and unused FAR is 100%. Each gets the same **+1.0 buy nudge** (`direction.ts:62-65`) and probably a BUY. The ranking then comes down to confidence net of risk. *"So the engine likes all of them because they're empty. I knew they were empty. That's why I'm looking at them."* The Gowanus site picks up special-district entitlement weight (+22 in `lib/agents/entitlement.ts`, per CLAUDE.md §07). That's the one place the ranking says something I didn't already know.

**The screening memos: where confusion became distrust.** Each site gets a "Development Site Screening Memo." The sample (`screening-memo-175-3rd-street.pdf`, OBSERVED) opens with **ADVANCE, "Confidence 78 / 100"** in large type. The dashboard calls the same site **BUY, confidence 68** (`development.png`). The memo's verdict is a *second, separate* deterministic system: ADVANCE/HOLD/PASS from an attractiveness score (`lib/documents/builders/site-screening.ts:204-250`), printed under the label "Confidence." *"Which one goes in my deck? 68 or 78? BUY or ADVANCE? And why is a score called confidence?"*

The repo artifacts give the same site, 175 3rd Street, these readings within six weeks: ADVANCE 78 (screening memo, 8/18), HOLD 66 (IC memo, 8/19), HOLD 67 (one-pager, 8/19), BUY 69 (fixture, 8/27), BUY 68 (dashboard, 9/30) (all OBSERVED). Each reading is honest about the run it came from. Side by side they read as a product that changes its mind.

**For my three vacant lots, the memo will print a contradiction (INFERRED).** The headroom-magnitude term gives +1 per 20,000 sq ft of unused rights (`site-screening.ts:214-219`). My sites carry 48,570, 59,948 and 40,169 sq ft, which works out to 2.4, 3.0 and 2.0 points. All three are at or under the `mag <= 3` threshold, so each memo lists **"limited unused development rights"** as a negative reason, on a vacant lot with 100% of its FAR unused. The scorer is tuned for 400,000 sq ft superblocks. *"You told me a vacant R7A lot has limited development rights. I stopped reading there."*

**Entitlement: the number that means nothing.** The memo's Entitlement Risk Read features "CD approval ratio." The sample prints **"CD approval ratio 95%"** directly above **"Disapproved filings 2,732"** (OBSERVED). The three-site sample brief shows **95% for all three sites**, in three different community districts (`comparison-brief-3-sites.pdf`, OBSERVED). For my CDs I recomputed it from the same legacy BIS dataset (`ic3t-wcy2`) with KOANO's classifier (`nyc-dob-filings.ts:46-58, 163-166`): CD 303 about 93%, CD 305 about 92%, CD 306 about 95% (OBSERVED counts, my arithmetic). The ratio is every DOB job type, alterations included, over all time, in a legacy system DOB has largely replaced with DOB NOW. Then the narrative calls it "a consistently favorable **discretionary review** environment" (OBSERVED, screening memo p.2). *"DOB plan exam is ministerial. Discretionary is ULURP, BSA, Landmarks, the community board. If your entitlement read can't tell a sign-off on a bathroom from a rezoning, it's decoration, and you've put it in the headline."*

**What impressed me.** The As-of-Right Envelope block, with base and City of Yes affordable maximum side by side and the explicit "not height- or parking-complete" caveat (OBSERVED). The Assemblage section's reasoning that zoning lots and TDRs are tax-block constrained (OBSERVED). And the **Due Diligence Gap Register**, which says plainly what's verified and what needs a title company, a surveyor or a Phase I (OBSERVED). *"That register is what I'd hand a junior. It knows what it doesn't know."*

**Then the register undercut itself.** It says "Environmental assessment: Open: … contamination history not screened" (`site-screening.ts:361`). But KOANO's risk agent does read EPA Superfund and brownfield proximity (CLAUDE.md §07; `lib/providers/real/epa-superfund.ts`). Site A is a few blocks from the Gowanus Canal Superfund site. *"You checked it in the verdict and told me in the memo you didn't. On Gowanus."*

**Pro forma.** The sidebar has "Pro forma" (`clusters.ts:105`). The panel is honestly badged representative and says what it becomes live with (`SitePanels.tsx:153-161`). *"Fine. At least it doesn't pretend. But land cost per buildable foot is the number I'm actually here for."*

**Usage.** Free users get 3 lifetime verdicts (`koano-guard.ts:41`), exactly one three-site comparison, and **no documents** (`lib/documents/guard.ts`, the "documents are a paid deliverable" 402). *"So my free trial is one comparison with no memo. You're asking me to pay $499 for the memo before I've seen one for my own sites."*

### Marcus's verdict

- **Confused by:** BUY vs ADVANCE; "confidence" meaning two different things; a ranking where all three sites get the same structural boost.
- **Impressed by:** the envelope block (base vs City of Yes), the block-level assemblage logic, the Due Diligence Gap Register, and three-site setup speed.
- **Distrusted:** a 95% "approval ratio" that never varies and is called discretionary; "limited development rights" on vacant lots; "contamination not screened" next to the Gowanus Canal.
- **Would screenshot:** the ranked table with map and provenance chips, and the envelope block. *"Send to my partner: 'first cut on three sites in three minutes.'"*
- **Would I pay?** *"$499 is in range if I'm screening more than ten sites a month. To make it a must-have: height and setback envelope, MIH and 485-x eligibility, E-designations, landmark and historic district flags, and a real discretionary-action history for the CD. Today I'd pay per site, $100 to $200 a memo, and only once the vacant-lot wording is fixed."*

---

## Persona 3: Lauren, top-producing Manhattan residential broker, listing presentation tomorrow (Transaction tier, $149/mo)

**Situation.** A two-bedroom co-op at **220 East 73rd Street (BBL 1014270034)**. PLUTO: class D4 elevator co-op, 92 units, 90,700 sq ft building area, R8B, built FAR 8.88 against a max of 4.00 (OBSERVED).

### The session

**The page.** OBSERVED (`transaction.png`): a strong Market Velocity strip with FHFA HPI +5.7% YoY, recorded sales count, median $/sq ft, sales velocity, HMDA mortgage demand, and QCEW employment, each with a LIVE chip, then a comps map with a $/sq ft color ramp. *"This looks like a Bloomberg terminal for a ZIP code. My clients would love the mortgage-denial stat."*

**The CMA.** The /for/agents page and the pricing page both sell "Comparative Market Analysis, as PDF and editable Word" (`src/app/for/agents/page.tsx:14-16`; `PricingContent.tsx:62`). The dashboard shows a dashed, disabled tile instead: "Comparative Market Analysis. **Not yet available.** The CMA needs listing photos and geocoded comps, which KOANO does not source today" (`Cluster2Dashboard.tsx:243-262`). Meanwhile the API builds a CMA (`route.ts:473`) and the comps *are* geocoded now (`nyc-sales.ts`, PLUTO-centroid distance ranking). *"The website promises it, the app says it doesn't exist, and somewhere there's a working one. Pick one."*

**The comps: where the session ends (OBSERVED + INFERRED).** In ZIP 10021, DOF recorded **406 elevator co-op sales and 180 elevator condo sales** in the last 12 months. Every one has `gross_square_feet = 0` (OBSERVED, `usep-8jbt`, grouped by class). KOANO requires gross square feet over 300 (`nyc-sales.ts:168`), so all of them are dropped. The only qualifying "home" comps are **17 townhouses** (one- to three-family), from 197 E 76th at $633/sq ft to 40 E 73rd at $3,282/sq ft. KOANO's trimmed median for that set is about **$1,643/sq ft** (my arithmetic, KOANO's trim rule).

The Pricing Recommendation Sheet then multiplies $/sq ft by **the subject's PLUTO building area** (`lib/documents/builders/pricing-sheet.ts:71-90`). For a co-op that's the whole 92-unit building. Midpoint: **about $149 million** for a two-bedroom apartment (INFERRED). The Buyer/Seller Net Sheet uses the same figure as its "assumed sale price" (`net-sheet.ts:43-53`). There's no field for unit square footage anywhere in the Transaction flow (`CmaBuilder.tsx` shows only building-level PLUTO rows).

*"A hundred and forty-nine million dollars. On my letterhead. If I'd printed that before reading it, I'd have lost the listing and my reputation in the same meeting."*

The provider's scope note is honest: "Condos/co-ops without recorded square footage are excluded, so comps skew to 1-3 family homes" (`nyc-sales.ts:289`). The pricing sheet's selection rules still list "condos, co-ops" among the included classes (`pricing-sheet.ts:128`). *"In Manhattan the caveat is the whole market. You don't 'skew to' townhouses. You only have townhouses."*

**The verdict (INFERRED).** Built FAR 8.88 against 4.00 triggers the −0.7 over-max nudge: **WAIT**, "realizing value needs a variance." *"My seller's apartment gets a WAIT because the building can't add floors? I'm listing a unit, not developing a tower."*

**The documents I could open (OBSERVED, Brooklyn samples).** The CMA sample (`demo-kit/.../cma.pdf`, 425 6th St, Brooklyn) is a good-looking two-pager with distance-ranked comps and a "Dist." column. Two things a sharp broker catches:
1. **The KOANO wordmark sits under my letterhead** (cma.pdf text line 5; pricing sheet too). The CMA is supposed to be white-labeled with no KOANO branding (a locked decision). *"My clients can't see a vendor logo on my CMA."*
2. "HPI-adjusted midpoint $1,420/sq ft" against a trimmed median of $1,231 is **+15%** on an index that moved +5.7% YoY. Time adjustment over comps less than 12 months old can't add more than about 5.7%. The rest comes from computing the adjusted median over the **10 displayed comps** (`cma.ts:73-76`) while the unadjusted median is over all **154** (`nyc-sales.ts:296`). The low and high band edges likewise come from the 10 shown (`pricing-sheet.ts:63-65`), which produces lopsided bands like the sample pricing sheet's $1,075 / $1,151 / $2,237 (OBSERVED, `koano-pricing-sheet.pdf`). *"An appraiser would shred this in one email."*

The repo pricing sheet for 369 6th Street also lists **369 6th Street itself**, sold 2026-06-18 for $4,050,000, among its comps (OBSERVED, IC memo Exhibit A and pricing sheet comp table). The sheet's midpoint for that house is $2.21M, about half of what it actually sold for two months earlier. *"Your comp set contains the subject's own sale, and your price is half of it."*

**What impressed me.** The net sheet's refusal to fake closing costs ("A number here would be false precision," `net-sheet.ts:115`). The distance column. The Client Neighborhood Report's tone. *"The honesty is real. Somebody here hates bad CMAs as much as I do."*

### Lauren's verdict

- **Confused by:** CMA sold on the site but "Not yet available" in the app; a WAIT verdict on a listing.
- **Impressed by:** the market velocity strip, the comps map with distances, the net sheet's honesty.
- **Distrusted:** a $149M "pricing recommendation" for a co-op; KOANO branding on a white-label doc; a time adjustment that is mostly a sample switch; the subject's own sale used as a comp.
- **Would screenshot:** the Market Velocity strip, especially HMDA denial rate plus HPI, for a client newsletter. Nothing from the pricing output.
- **Would I pay?** *"Not today. For Manhattan I need unit-level co-op and condo comps. ACRIS has the deeds and DOF has the condo unit lots. I also need a field for the unit's square footage, and no logo. Do that and $149 is cheap. I'd pay $299 for the Brooklyn townhouse version right now if the band math were fixed."*

---

## Persona 4: Keisha, Bed-Stuy tenant worried about her landlord (Community tier, $19/mo)

**Situation.** I live at **25 MacDonough Street, Brooklyn 11216 (BBL 3018510063)**, a 19-unit 1900 walk-up (PLUTO class C1). The hot water scalds, there are rats, and new people keep showing up saying they "manage" the building. I found KOANO from /for/community.

### The session

**Marketing.** OBSERVED (`shots/mobile_for_community.png`): "The record on your building is public. Reading it is the hard part," plus "Not a tool for gentrification." *"Okay, they get it."* The tagline beneath it, though, is "Know what's happening to your property's value before your neighbors do" (`src/app/for/community/page.tsx:73`). *"I don't own anything."* On my phone the capture shows two very tall empty pale-blue blocks where the "What this reads today" cards should be (OBSERVED; possibly a scroll-animation capture artifact, unverified). The "What is not built yet" section does render. It says eviction filings and harassment records wait because "Housing court data is not public in the way permit data is."

**The dashboard.** OBSERVED (`community.png`, a different address): the page is titled "Property intelligence," eyebrow "01," picker "C4," and the first big thing after the map is a verdict, **HOLD**, with "the confidence-weighted score of -0.19 clears the hold threshold, anchored by R2 zoning with only 29% residential FAR headroom." *"Hold what? I rent. What is a confidence-weighted score?"*

For my building (INFERRED): built FAR 3.56 against 2.00 trips the over-max nudge, so the most likely result is a big **WAIT**: "realizing value needs a variance." *"Wait for what? For the rats to leave?"* Below it sit a Valuation panel (a dollar figure for the whole building) and a "Property Tax Appeal Evidence Packet" button (`Cluster1Dashboard.tsx:282-289`). *"This page is for my landlord."*

**What KOANO gets right for me (OBSERVED data, INFERRED rendering).**
- **Violations:** **364 open HPD violations: 123 class C, 187 B, 54 A**, out of about 922 total (`wvxf-dwi5`). The panel labels C as "immediately hazardous" (`ViolationsPanel.tsx:46`) and lists recent items: "scalding hot water above 130 degrees … Apt 6" (April 2026), "provide an adequate supply of gas … Apt 11" (September 2025), "evidence of rats" (March 2025). *"That's my building. That's exactly my building. I'm screenshotting this for the group chat."*
- **Registered ownership:** the HPD registration names **Neighborhood Restore, HDFC** as corporate owner, **HSC Management Corp.** as managing agent, and a head officer (OBSERVED, `feu5-w2e2`). *"Finally a name to put on the letter."*
- **Monitoring:** for $19 I can watch 3 buildings (`koano-guard.ts:57`) and get a Monday email when a new violation lands (`lib/monitor/detect.ts:115`). *"That's the feature. Tell me when HPD writes something up."*

**What confused me.**
- **Trend:** 48 violations in the last 24 months against 157 in the prior 24 (OBSERVED). The panel only flags "rising," so here it shows the numbers without comment. A tenant reads that as "getting better," while 364 stay open.
- **Owner portfolio:** the exact-match portfolio count is **1** (INFERRED, `nyc-landlord.ts:197`, matching "NEIGHBORHOOD RESTORE, HDFC" with the comma). The same entity appears in HPD contacts under five spellings across **about 27 registrations** (OBSERVED). The caveat is printed. *"It says 'a floor.' I don't know what a floor means. I read '1 building.'"*
- **Two owners:** the IC-style records use the PLUTO owner (**GILMER HOLDING CORP.**, OBSERVED) while HPD says Neighborhood Restore. *"Which one do I sue?"*

**What it never told me, all public (OBSERVED, none read by KOANO):**
- **HPD Housing Litigations:** **11 cases**, including **"Tenant Action/Harassment" (2021)**, a 2021 Comprehensive case, heat cases in 2022 and 2023, and one still **PENDING** (`59kj-x8nc`).
- **Alternative Enforcement Program:** the building was in **AEP Round 11 in 2018 with 836 B/C violations at entry**, discharged September 2018 (`hcir-3275`).
- **Certification of No Harassment pilot list:** added June 2022 (`bzxi-2tsw`).
- **311:** 6 heat/hot-water complaints, plus plumbing, unsanitary-condition and rodent complaints, in the last 24 months (`erm2-nwe9`).
- **Rent stabilization:** nothing in the product addresses it (no matches for "stabiliz" anywhere in `lib/` or `src/`).

*"Your website told me court data isn't public. HPD publishes its own lawsuits against my landlord, including a harassment case, on the same open data site you use for violations. And my building was on the city's worst-buildings program. That's the first thing a tenant lawyer would want."*

### Keisha's verdict

- **Confused by:** a BUY/HOLD/WAIT verdict and a property valuation for a renter; "-0.19 confidence-weighted score"; a portfolio "floor" of 1; two different owners.
- **Impressed by:** the class C list with apartment-level text; "a coverage fact, not a clean record"; monitoring alerts.
- **Distrusted:** the copy claiming court data isn't public; no AEP, litigation, CONH or 311 data; a tax appeal packet offered to a tenant.
- **Would screenshot:** the open-violations panel with class C items, sent to the tenant association WhatsApp with "364 open, 123 hazardous."
- **Would I pay?** *"$19 a month, no. Rent is rent. $5 once for a clean PDF I can bring to housing court, maybe. Better: sell it to our tenant association or a legal services org for the whole building, and give me the alerts free."*

---

## Cross-persona synthesis

### What the four sessions have in common

1. **One verdict, one lens.** The structural nudge in `direction.ts` reads every property as a development play. That's right for Marcus, wrong for Dana (hold asset), wrong for Lauren (a unit listing) and meaningless for Keisha (a renter). Three of the four personas got a verdict that answered someone else's question.
2. **Paid deliverables don't match the UI.** The IC memo and portfolio risk report have no button, and the CMA is shown as "Not yet available," yet all three are sold on /pricing and implemented in `route.ts`.
3. **The valuation formula breaks outside 1 to 3 family homes.** Median home $/sq ft × PLUTO building area gives about $75M for a 66-unit rental (5x too high) and about $149M for a co-op apartment.
4. **Honesty is the product's best feature and its trust is being spent elsewhere.** All four personas praised the caveats. Then each hit a number (95% approval, the 388 row, the +15% "HPI adjustment," a 1-building portfolio) that broke trust faster than the caveats built it.
5. **High-value public data sits unused, a query away.** Classes 07/08 sales, HPD litigation, evictions, AEP, CONH, 311 and head-officer owner networks are all on the same Socrata domain KOANO already calls.

### Top 10 problems (ranked by enterprise-value impact)

| # | Problem | Evidence | State | Effort | Impact |
|---|---|---|---|---|---|
| 1 | **Building-area valuation on multifamily and co-op/condo subjects** produces numbers off by 5 to 1,000x, printed on client-facing PDFs (pricing sheet, net sheet, property intelligence, CMA). | `pricing-sheet.ts:71-90`, `net-sheet.ts:53`, `ValuationPanel.tsx:33-35`; ZIP 10021: 586 co-op/condo sales with 0 GSF, all excluded | PARTIAL | M | 10 |
| 2 | **Headline paid documents unreachable in the UI**: no IC memo or portfolio risk report button; CMA tile says "Not yet available" while /pricing sells it. | `Cluster5Dashboard.tsx:208-246`, `Cluster2Dashboard.tsx:243-262`, `PricingContent.tsx:62,80`, `route.ts:375,473` | PARTIAL | S | 10 |
| 3 | **One development-lens verdict for every audience.** Over-max FAR forces WAIT on stabilized multifamily, co-op listings and tenants' homes. | `direction.ts:51-60`; 9 of 10 CD 308/309 prewar buildings over max | PARTIAL | M | 9 |
| 4 | **Multifamily comps excluded by design** (classes 07/08), so the IC memo's comps are brownstones. | `nyc-sales.ts:159-166`; nearby 07/08 trades observed | MISSING | S | 9 |
| 5 | **Two conflicting verdict systems** (BUY/HOLD/WAIT vs ADVANCE/HOLD/PASS) and a score labeled "Confidence." 175 3rd St shows 5 readings in 6 weeks across artifacts. | `site-screening.ts:204-250`; PDFs and dashboard | PARTIAL | S | 8 |
| 6 | **Entitlement "CD approval ratio" doesn't discriminate** (92 to 95% everywhere, all job types, legacy BIS) yet headlines the memo and is narrated as "discretionary review." | `nyc-dob-filings.ts:46-58,163-166`; screening memo p.2 | PARTIAL | M | 8 |
| 7 | **Owner network undercounted**: exact entity-name match ignores head officers and spelling variants (1 vs 13; 1 vs ~27). | `nyc-landlord.ts:192-201`; HPD contacts queries | PARTIAL | M | 8 |
| 8 | **Community tier built for owners while sold to renters**: verdict, valuation and tax appeal lead; litigation, AEP, CONH, 311, evictions and stabilization are absent; copy wrongly says court data isn't public. | `Cluster1Dashboard.tsx`, `for/community/page.tsx:49-54`; `59kj-x8nc`, `hcir-3275` | MISSING | M | 7 |
| 9 | **Math and branding defects in client documents**: Exhibit B "388" row; CMA band and HPI midpoint computed on 10 shown comps vs a 154-comp median; subject's own sale in its comp set; KOANO wordmark on white-label CMA and pricing sheet; "Analyst Name / KOANO Capital Partners" placeholder letterhead. | `cma.ts:73-76`, `pricing-sheet.ts:63-65`; PDFs | PARTIAL | S | 7 |
| 10 | **Capacity and onboarding friction**: global 50/day breaker under a 500/day plan with a "demo capacity" message; free tier gives no documents and one three-site run; C-badge vs eyebrow numbering; three run-time estimates. | `koano-guard.ts:85-88,130-140`, `lib/documents/guard.ts`, `clusters.ts`, `LoadingState.tsx:100` | PARTIAL | S | 6 |

### Top 10 opportunities (ranked)

| # | Opportunity | Why it wins | State | Effort | Impact |
|---|---|---|---|---|---|
| 1 | **Audience-specific decision lenses on one deterministic core**: Acquire/Hold-asset (yield, risk, compliance), Develop (envelope, entitlement), List/Price (unit-level), Tenant (habitability, landlord conduct). Same facts, different deterministic rule sets, all shown in Verdict Math. | Fixes problem 3 without touching provenance or determinism | MISSING | L | 10 |
| 2 | **Multifamily acquisition pack**: 07/08 DOF comps with $/unit and $/sq ft, HPD litigation, AEP, CONH, evictions, ECB penalties, owner network by head officer. All public, all NYC Open Data. | Makes the Portfolio tier and IC memo credible to Dana on day one | MISSING | M | 9 |
| 3 | **Ship the IC memo, CMA and portfolio risk buttons** (DOCX included) and make the CMA truly white-label. | The paid promise becomes the product | PARTIAL | S | 9 |
| 4 | **Unit-aware pricing**: a unit square footage field; condo unit lots (DOF condo BBLs) plus ACRIS deeds for unit-level co-op/condo comps; refuse to print a building-area value for D4/R-class subjects. | Unlocks Manhattan brokers, the largest Transaction market | MISSING | M | 8 |
| 5 | **Owner-network graph** from HPD contacts (head officer, officers, agent address) with portfolio-wide violations, litigation and AEP history. | The single most screenshot-able artifact for associates and tenants alike | MISSING | M | 8 |
| 6 | **Tenant Building Record**: free or org-licensed habitability dossier with violations by apartment, HPD litigation, AEP/CONH, 311, the actual owner chain, and a "what to do next" list (HPD, housing court HP action). | Mission-aligned, viral in tenant associations, cheap to build | MISSING | M | 7 |
| 7 | **Real entitlement signal**: ULURP/BSA/LPC actions in the CD and on the block, E-designations, historic districts, MIH/485-x eligibility, height envelope. | Makes the developer memo something to send, rather than file | PARTIAL | L | 7 |
| 8 | **Verdict changelog**: when a stored verdict flips (HOLD 66 → BUY 68), show which input moved it. Pairs with the archive. | Turns visible instability into visible rigor | MISSING | M | 7 |
| 9 | **Archive-powered "since you started watching" timelines** on every building panel (weekly violation, permit and registration snapshots since August 2026). | The moat becomes something a user sees | PARTIAL | M | 7 |
| 10 | **Pricing by deliverable**: per-document credits (IC memo, site memo, CMA) alongside subscriptions, and org seats for tenant groups. | Matches how each persona said they'd pay | MISSING | S | 6 |

### What to fix first (the next two weeks, in order)

1. **Stop printing wrong valuations.** Gate building-area valuation to 1 to 3 family subjects (PLUTO classes A/B/C0 to C3 with low unit counts). For D/R-class or 7+ unit subjects, print "no unit-comparable valuation available" with the reason. Same day: compute band edges and HPI-adjusted medians on the same pool as the midpoint, exclude the subject BBL from its own comps, fix the Exhibit B weight/contribution row, remove the KOANO wordmark from white-label docs, and suppress placeholder letterhead. (S, prevents the reputational kill shot for Lauren and Dana.)
2. **Wire the IC memo, CMA and portfolio risk buttons**, and delete the "Not yet available" CMA tile. (S.)
3. **Add classes 07/08 multifamily comps** to the IC memo and Portfolio surfaces, with $/unit. (S to M.)
4. **Unify vocabulary**: one verdict word set per audience, and rename the screening score from "Confidence" to "Site score." (S.)
5. **Demote "CD approval ratio"** out of headlines until it measures discretionary actions, and rewrite the "discretionary review" narration. (S.)
6. **Fix the Community copy** about court data and add HPD litigation plus the AEP/CONH flags to the Violations panel. (S to M.)

### The "I have never seen anything like this" moment, per persona

- **Dana (associate), achievable now with public data:** she types the address and gets one page: *"780.ST MARKS REALTY LLC → head officer Tefik Capani → 13 HPD-registered buildings, 4 false-certification cases, 4 evictions, violations up 4x in two years. Comparable 07/08 trades within a mile: $105 to $222/sq ft, $105k to $213k/unit. Verdict math below. Editable IC memo attached."* *"That took my analyst two days last quarter."*
- **Marcus (developer):** three sites ranked by **buildable square feet you can actually get**: as-of-right height envelope, MIH/485-x, E-designations, Superfund and brownfield proximity, plus the CD's actual ULURP and BSA record. Then KOANO emails him the Monday a neighbor files a DOB NOW new-building job on the block. *"It found my competition before my broker did."*
- **Lauren (broker), VISION (needs ACRIS unit parsing and licensed MLS for active listings):** every recorded sale in 220 East 73rd and its five closest peer co-ops over ten years, at the unit level, HPI-adjusted, on her letterhead with no vendor logo. *"I walk in with the building's own price history. Nobody else at the pitch has it."*
- **Keisha (tenant), achievable now:** *"Your building was on the city's worst-buildings list in 2018 with 836 violations. HPD has sued your landlord 11 times, including a harassment case. Here are the 123 hazardous violations open today, by apartment, and the letter to send."* *"I've lived here six years. Nobody ever told me any of this."*

### Grounded findings versus VISION

Everything in the four sessions and in problems 1 to 10 is grounded: an artifact, a code path or a live public query, each cited. Opportunities 1 to 6, 8 and 10 are achievable with data KOANO already has or that sits on NYC Open Data today (MISSING or PARTIAL). Opportunity 7 is partly VISION: discretionary-action history needs ZAP/BSA data ingestion, achievable but not trivial, and a full height envelope needs zoning-text modeling. Lauren's unit-level co-op history is VISION where it relies on MLS (active listings, unit square footage). The ACRIS deed portion is public.

---

## Sources

NYC Open Data, queried read-only on 2026-10-19:
- https://data.cityofnewyork.us/resource/64uk-42ks.json (MapPLUTO)
- https://data.cityofnewyork.us/resource/usep-8jbt.json (DOF Citywide Rolling Calendar Sales)
- https://data.cityofnewyork.us/resource/wvxf-dwi5.json (HPD Violations)
- https://data.cityofnewyork.us/resource/tesw-yqqr.json (HPD Multiple Dwelling Registrations)
- https://data.cityofnewyork.us/resource/feu5-w2e2.json (HPD Registration Contacts)
- https://data.cityofnewyork.us/resource/adax-9mit.json (Speculation Watch List)
- https://data.cityofnewyork.us/resource/ic3t-wcy2.json (DOB Job Application Filings, legacy BIS)
- https://data.cityofnewyork.us/resource/w9ak-ipjd.json (DOB NOW Job Filings)
- https://data.cityofnewyork.us/resource/59kj-x8nc.json (HPD Housing Litigations)
- https://data.cityofnewyork.us/resource/6z8x-wfk4.json (Evictions)
- https://data.cityofnewyork.us/resource/erm2-nwe9.json (311 Service Requests)
- https://data.cityofnewyork.us/resource/hcir-3275.json (Alternative Enforcement Program buildings)
- https://data.cityofnewyork.us/resource/bzxi-2tsw.json (Certification of No Harassment pilot list)
- https://api.us.socrata.com/api/catalog/v1?domains=data.cityofnewyork.us (catalog searches for rent stabilized, litigation, evictions, AEP)

No competitor or market claims are made in this report.

## Discrepancies vs the brief (section 3 of the prompt)

1. **"Transaction: white-labeled CMA, pricing memo."** The CMA is implemented in the API (`route.ts:473`) but the Transaction dashboard shows it as "Not yet available" (`Cluster2Dashboard.tsx:243-262`). The generated CMA and pricing sheet both carry a KOANO wordmark under the broker letterhead (`cma.pdf`, `koano-pricing-sheet.pdf`), contrary to the locked white-label decision.
2. **"Portfolio: IC memo, portfolio risk report."** Both are implemented server-side, but neither has a button in Cluster 5 (`Cluster5Dashboard.tsx:208-246`). Only the Monday Briefing and Asset One-Pager are reachable.
3. **"Community (homeowners, renters, neighbors): building and landlord report."** The landlord report is HPD registration plus an exact-name portfolio. There is no rent stabilization, HPD litigation, evictions, AEP, CONH or 311 data. The /for/community page says housing court data "is not public," but HPD Litigations (`59kj-x8nc`) and Evictions (`6z8x-wfk4`) are on NYC Open Data.
4. **"Approval gate" (CLAUDE.md §03, and the role prompt's "approval gate").** It's retired. `requireApproved` is an allow-all shim (`koano-guard.ts:13-16, 117-119`).
5. **"Free (about 3 verdict runs)."** Correct (3 lifetime verdicts plus 3 content), but free users can't generate any document (`lib/documents/guard.ts`, 402). The brief implies tiers differ by documents, not that free gets none.
6. **"Tiers differ by documents and monitoring caps."** Paid per-user verdict limits (Portfolio 500/24h) sit under a global breaker defaulting to 50/24h across all users (`koano-guard.ts:85-88`), and a per-user 30/24h document cap independent of plan (`lib/documents/guard.ts`).
7. **"fetch_failed ... no fabrication" (CLAUDE.md §16 says no `REPRESENTATIVE_FALLBACK` constants remain).** `nyc-sales.ts` still returns a $900/sq ft "brownstone-Brooklyn" stand-in and `nyc-zoning.ts` an "R6B" PLUTO profile as `data` under `fetch_failed`.
8. **"Verdict ... computed by pure deterministic code."** True for the engine, but the screening memo runs a second, independent deterministic verdict (ADVANCE/HOLD/PASS, `site-screening.ts:204-250`) whose score is labeled "Confidence," so one site carries two verdicts.
9. **"Comps ranked by true distance" (CLAUDE.md §07).** True in the current provider, but the repo's sample IC memo, pricing sheet and one-pager (dated August 2026) still print the old "Proximity is ZIP-keyed, this dataset has no coordinates" note. Any demo using those files contradicts the product.
