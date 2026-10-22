# Red Team: Attacks on the KOANO Audit

*Role: skeptical short-seller and proptech investor. Date: 2026-10-19. Inputs read: `01_executive_summary.md`, `02_competitors.md` (sections 0, 1, 7, 10, 11), `03_vision.md`, `04_redesign_spec.md` (structure), `05_product_roadmap.md`, `06_valuation_path.md`, `07_kill_list.md`, `panel/gtm_pricing.md` (sections 2 to 6), `panel/ai_expert.md` (section 4), `panel/data_strategist.md` (sections 2, 3, 5, 8), `panel/vc_and_ma.md` (section 1), `panel/real_estate_tycoon.md` (section 1), `panel/engineer.md` (section 15). Code checked read-only: `lib/agents/direction.ts`, `vercel.json`, `src/app/api/cron/archive/route.ts`, `maxDuration` exports, git history. Live NYC Open Data counts queried today (queries reproduced below).*

Every attack below carries: the attack, the evidence, a confidence level (High, Medium, Low), and Severity (1 to 10, impact on enterprise value). Where an audit conclusion survives my attack, I say so in section 3.

---

## 0. The short thesis in one paragraph

The audit correctly diagnoses a product that is wrong in public, then prescribes a cure that a single founder cannot execute, aimed at a buyer who will not pay for it, built on a moat that measures the wrong thing. The "single strategic bet" (a public, hashed forecast ledger on coarse public events) is a model-risk artifact for institutional buyers that KOANO cannot sell to for two or more years. Meanwhile the wedge customer it can sell to (NYC infill developers) does not value auditability, already gets the facts for free, and is a market of a few hundred firms. The two halves of the plan serve two different customers, and the plan asks one person to build both inside 90 days. The fixes in the first two weeks are right. Almost everything after week four is over-scoped.

---

## 1. Attacks, ranked by severity

### Attack 1. The buyer who values auditability cannot buy, and the buyer who can buy does not value auditability
**Severity 10. Confidence: High.**

**The attack.** The whole differentiation (deterministic, replayable, provenance-labeled, publicly scored) is a property that matters to model-risk teams, lenders' examiners and IC compliance. The audit itself says those buyers need SOC 2, SSO, org tenancy and 6 to 12 month cycles, and puts SOC 2 Type I at Horizon 3 (`05_product_roadmap.md` 12-5) and institutional ACV at Band 3 (`06_valuation_path.md`, 18 to 36 months). The customer the plan actually sells to in the next 90 days is a 3 to 20 person NYC development shop buying "on a principal's credit card" (`panel/gtm_pricing.md` §3.2 point 4). That buyer wants to know whether a site pencils at the ask. They do not read reliability diagrams and they do not care whether the narrative replays byte for byte.

**Evidence.**
- The audit's own tycoon: "My first-year analyst produces the dossier part in a morning with ZoLa, DOB NOW, ACRIS and HPD Online" (`panel/real_estate_tycoon.md` line 33). That is a statement that the wedge buyer's alternative is free and fast, not that it is unauditable.
- The GTM wedge argument (`panel/gtm_pricing.md` §3.2) lists completeness, frequency, reachability, short cycle and upward pull. Auditability is not one of the five reasons the wedge customer buys. The differentiator and the wedge never meet.
- The positioning map places KOANO's advantage on the X axis "auditability of the conclusion" and justifies the axis by "institutional buyers, lenders and IC committees face liability" (`02_competitors.md` §10). Those are exactly the buyers the GTM panel says not to lead with (`panel/gtm_pricing.md` §3.3).

**Why it matters.** Revenue in years 1 to 2 comes from a buyer who does not reward the moat, and the moat is aimed at a buyer who will not pay in years 1 to 2. That gap is where proptech startups die: they raise on the institutional story, sell to SMBs to show traction, and run out of money before the institutional channel opens.

---

### Attack 2. The forecast ledger scores events that do not measure the verdict, and would score the flagship error as a hit
**Severity 9. Confidence: High.**

**The attack.** The pre-registered events in `panel/ai_expert.md` §4.1 and `03_vision.md` §2.1 are: submarket repeat-sales index up over 12 months, NB or ALT-1 filing on the lot within 24 months, discretionary action required within 36 months, HPD B+C violations higher in 12 months. None of these resolves whether a BUY was a good decision (did the buyer make money at the price paid?). Worse, some resolve in KOANO's favor precisely when it is wrong.

**Evidence.**
- **The flagship would score as correct.** 175 3rd St got a BUY driven by "+1.0 unused FAR" (`lib/agents/direction.ts:62-65`) on a lot that already had a permitted 27-story NB (DOB NOW B00680917, `01_executive_summary.md`). The Development event "NB or ALT-1 filing on subject within 24 months" is near certain to resolve YES on a lot under active construction (amendments and follow-on filings). The ledger would book the audit's single most damaging error as a successful forecast. The guard in roadmap 30-1 fixes the verdict, but the event design itself rewards stale-data verdicts on lots where development is already happening.
- **Submarket events are shared across all lots in a ZIP or tract.** A BUY on lot A and a PASS on the lot next door resolve on the same index move. The event measures market beta, not site selection. Cross-sectional correlation is near total within a year: one rate shock resolves the whole cohort together. The AI panel's block bootstrap over tract by month clusters (`panel/ai_expert.md` §4.2) does not cure a citywide common factor; effective n per year approaches the number of independent macro regimes, which is about one.
- **The shadow panel is starved of positives for the Development event.** I queried DOB NOW job filings (`w9ak-ipjd`) today: 4,589 distinct BBLs had a New Building filing between 2024-10-01 and 2026-10-01. PLUTO (`64uk-42ks`) has 858,284 lots. Base rate over 24 months is about 0.53 percent. A 2,000-lot monthly shadow panel yields about 11 NB positives per cohort, after a 24 month wait. A constant base-rate forecast has a Brier score of about 0.005; any skill shows up in the fourth decimal place, and an AUC on 11 positives has a confidence interval wide enough to be meaningless. Stratification helps only if it oversamples underbuilt lots, at which point it is no longer the unbiased panel the vision promises.
- **"Violations higher in 12 months" is a persistence game.** HPD violations are complaint and inspection driven. A naive persistence model (last year's trend) is the natural benchmark and is very hard to beat. Winning it proves nothing a developer or lender pays for.

**What the panel got right.** The AI panel's statistical hygiene (pre-registration, eras, no LLM in backtests, block bootstrap) is correct. The problem is the choice of events, not the method.

---

### Attack 3. The moat is not time-locked: a deterministic competitor can backtest 20 years on day one, and anyone can start the CDC capture next month
**Severity 9. Confidence: Medium-High.**

**The attack.** The bet's central claim is "It cannot be bought retroactively, so starting date is the advantage" (`01_executive_summary.md` line 61) and "A competitor starting today publishes nothing for 12 to 24 months" (`03_vision.md` §2.1). Both are overstated.

**Evidence.**
- **Backtests substitute for a live ledger for most buyers.** The vision's own argument is that an LLM competitor cannot honestly backtest (pretraining leakage). That is true, and irrelevant to any competitor running deterministic scorecards. The audit lists the reconstructable history itself: DOF sales since 2003, ACRIS since 1966, PLUTO archive since 2002, DOB NOW since 2016 (`01_executive_summary.md` item 3). A deterministic rival can publish a 20-year pseudo-out-of-sample track record next quarter. Model-risk teams under SR 11-7 routinely accept documented backtests; a 12-month live ledger with roughly one macro regime is weaker evidence than a 20-year backtest across two cycles.
- **Scored accuracy is not white space outside AI startups.** AVM vendors publish accuracy (for example HouseCanary's MdAPE white paper, [housecanary.com](https://www.housecanary.com/images/65b197270a93d8fc78740602_hc_avm-accuracy_white-paper.pdf)), and lenders test AVMs independently. The audit's claim "no AI underwriting startup found publishes a track record" is true only for a narrow, cherry-picked set. Established vendors already speak the accuracy language KOANO wants to own.
- **The capture moat is symmetric.** The data strategist wrote: "A competitor that starts citywide capture next year will have more irreplaceable NYC history within a month than KOANO will have after five years at current scope" (`panel/data_strategist.md` §4 item 1). The same logic applies to KOANO: if KOANO starts Archive v2 in November 2026, a competitor starting in March 2027 is four months behind on a dataset of about 1M rows (`tesw-yqqr` 203,887 rows, `feu5-w2e2` 810,494 rows, queried today). NYCDB, JustFix, PropertyShark (Yardi), Reonomy (Altus) and Cherre (RealPage) all already ingest these tables. Whether any of them already retains historical snapshots is **unverified**; the data strategist also flagged this as unverified (`panel/data_strategist.md` §3). If any one of them does, KOANO's "only point-in-time NYC regulatory record" claim dies in diligence.
- **The city keeps history.** HPD receives annual re-registrations. Whether historical registrations are obtainable by FOIL is **unverified**, but a diligence team will ask, and a single FOIL response would backfill years of the "non-reconstructable" asset.

**Net.** A four-to-twelve month head start on a public-table diff is a timing advantage, not a moat. It becomes a moat only if paired with something proprietary (customer outcomes, private deal data), which the plan pushes to the 3 to 5 year vision (`05_product_roadmap.md` 5Y-7).

---

### Attack 4. The 90-day plan is roughly 70 person-weeks of work for one person who must also sell
**Severity 9. Confidence: High.**

**The attack.** The synthesis never costs founder time. Git history shows a single author (150 commits, all by one name, 2026-04-12 to 2026-10-15). The roadmap's "30 days" and "90 days" horizons contain 38 items.

**Evidence (my arithmetic on the roadmap's own effort labels, S = 3 working days, M = 2 weeks, L = 5 weeks):**
- Horizon 1 (30 days): 14 S, 4 M, one S-to-M (30-1), one M-to-L (30-3). About 104 working days, roughly 21 weeks.
- Horizon 2 (90 days): five L (90-1, 90-7, 90-9, 90-10, 90-12), about ten M, one M-to-L, two S. About 49 weeks.
- Total: about 70 person-weeks scheduled into 13 calendar weeks, before any time for the five design-partner sales (30-20), customer support, legal drafting with counsel (30-9), Stripe go-live and the fixture re-records the plan triggers at least four times (30-1, 30-5, 30-8, 90-1).
- Even if AI-assisted coding doubles throughput, it is 35 weeks, nearly three times the window.
- The executive summary's 90-day plan also stacks a full engine rewrite (90-1, L), a land residual engine (90-7, L), a redesign (90-4, 90-5), a multifamily pack (90-6) and a public forecast ledger into weeks 4 to 12, while asking the same person to sign and onboard five paying partners.

**Contradictions inside the plan.**
- 30-20 (five paid design partners) sits in Horizon 1, but the executive summary schedules it in weeks 4 to 8, and 30-20 itself says "start only after 30-1, 30-4 and 30-5 ship."
- "Five paying developers renew" is the 90-day target outcome (`05_product_roadmap.md` Horizon 2). Partners signed in weeks 4 to 8 have used the product for four to eight weeks at day 90. A renewal conversation that early measures politeness, not retention.
- The vision lists 44 ideas and develops 12 (`03_vision.md`), each with a "first version achievable now." Twelve "achievable now" first versions plus 38 roadmap items for one person is a backlog, not a strategy.

**Key-person risk.** The VC panel names it ("A buyer prices the probability that the founder leaves at 100% of the asset," `panel/vc_and_ma.md` §1 item 6). The synthesis dropped it. No item in the roadmap hires anyone, and no item funds anything. The plan has no capital line at all.

---

### Attack 5. The core buy signal is already priced in, and the wedge's real job (pricing a site) is pushed onto the user
**Severity 8. Confidence: High.**

**The attack.** The structural nudge says: 80 percent unused FAR means "large as-of-right development upside, buy" (`lib/agents/direction.ts:62-65`). NYC land trades on dollars per buildable square foot. Every land broker quotes it, every seller prices in the FAR, and ZoLa shows it free. "Lot is underbuilt" is the input to the price, not an edge over it. Without the asking price, a BUY has no content.

**Evidence.**
- The audit concedes KOANO "cannot see ... price" (`01_executive_summary.md` item 1) and puts the land residual at 90-7 with "user-entered price, program, cost, rent, cap and rate." When the user types every number that matters, KOANO's contribution is the as-of-right FAR, which ZoLa already gives for free ([NYC DCP press release on ZoLa](https://www.nyc.gov/site/planning/about/press-releases/pr-20190305.page)).
- Architects already sell this job. One NYC firm describes a roughly ten page pre-purchase zoning analysis with calculations, floor-by-floor breakdown and massing ([Fontan Architecture](https://fontanarchitecture.com/?p=9459)), and notes "most real estate developers will do an in-house feasibility study" ([Fontan Architecture](https://fontanarchitecture.com/building-a-townhouse-nyc/)). The wedge buyer has an incumbent workflow that includes liability-bearing professionals.
- A free Claude Code plugin with 127 CRE skills already ships an "entitlement-feasibility" skill that ends in "proceed, negotiate price, pursue an alternative use, or pass" ([claudepluginhub](https://claudepluginhub.com/skills/mariourquia-cre-skills/entitlement-feasibility)). Quality unknown, price zero.

**What survives.** The audit is right that the land residual is the thing that would make a developer pay. It is wrong to schedule it behind a ledger, a redesign and an engine inversion.

---

### Attack 6. The wedge is real but small: a few hundred firms, a ceiling near $1M to $2M ARR
**Severity 8. Confidence: Medium.**

**The attack.** The wedge is the right first customer and the wrong size for the valuation path.

**Evidence (queried today, DOB NOW `w9ak-ipjd`, New Building jobs, filing date 2024-10-01 to 2026-10-01):** 4,589 distinct BBLs, 2,107 distinct owner business names, 1,440 distinct applicant business names. Owner names are inflated by single-purpose LLCs (one per project), so the real number of distinct development sponsors is well below 2,107. For 2025, New York YIMBY counts about 1,650 NB permits, of which 501 were two-family and 188 single-family filings ([New York YIMBY 2025 report](https://newyorkyimby.com/2026/03/the-new-york-yimby-2025-report-showcases-more-than-57000-proposed-residential-and-hotel-units.html)). A large share of filers are homeowners and small builders who screen one site, not dozens.

**Arithmetic.** If 300 sponsor firms and 200 brokers, attorneys and architects bought one $3,990 annual seat each, that is about $2M ARR at 100 percent penetration of the generous universe. The GTM panel's own reverse-demo plan projects 35 to 40 seats from 600 memos (`panel/gtm_pricing.md` §4.1), about $150K ARR. Band 2 asks for $0.5M to $1.5M ARR in 6 to 15 months (`06_valuation_path.md`), which is 125 to 375 Development seats, a share of the NYC developer universe no tool has ever reached in a year. Band 3 ($5M to $8M ARR) is impossible inside the wedge; it requires the institutional channel of Attack 1.

**Also.** The reverse demo ("here is what the public record says about the lot next to yours," `panel/gtm_pricing.md` §4.1) targets exactly the lots where KOANO is most likely to be wrong: lots next to active NB filings, which are often assemblages or already under contract. A cold, unsolicited memo with a false BUY on a recipient's neighboring lot is the fastest way to be dismissed by a small, gossipy market.

---

### Attack 7. Incumbents and horizontal AI take the "80 percent" for free, and the remaining 20 percent is what KOANO has not built
**Severity 8. Confidence: Medium-High.**

**The attack.** The competitor file states the threat plainly and then underweights it. Cotality launched a directory-listed Claude connector on its MCP server on October 12, 2026 ([Cotality press release](https://www.cotality.com/press-releases/cotality-launches-claude-connector-to-deliver-trusted-property-intelligence-in-ai-workflows)). ATTOM, Green Street, CompStak, Regrid, Placer and TestFit ship MCP servers (`02_competitors.md` §0). The audit's own estimate: Claude Pro plus a PLUTO skill plus Regrid plus Claude for Excel assembles "60 to 70 percent of a KOANO site screen for about $20" (`02_competitors.md` §7). I could not verify a CoStar MCP server today (search returned nothing specific); treat CoStar's MCP status as **unverified**.

**Why the "determinism" answer is weak.**
- The counter in `02_competitors.md` §7 is "the answer is the same tomorrow." A developer who pulls PLUTO through a connector gets the same FAR number tomorrow too; facts are already deterministic. Only the verdict varies, and the wedge buyer does not want KOANO's verdict, they want the facts and their own judgment.
- The remaining 20 to 40 percent (DOB NOW guards, co-op detection, stabilization inference, land residual, entitlement path from ZAP and BSA) is exactly what the audit lists as MISSING (30-1, 90-6, 90-7, 90-8). KOANO's differentiated slice does not exist yet.
- Incumbents bundle. RealPage now owns Cherre (July 2026), Altus owns ARGUS and Reonomy, Yardi owns PropertyShark (`02_competitors.md` §1, `panel/data_strategist.md` §8). Any of them can add "provenance per figure" as a feature line. "Expensive to retrofit" (`02_competitors.md` §11) is an assertion with no evidence; provenance tags on a data platform that already knows its sources are a quarter of work for a team of ten.

---

### Attack 8. The audit claims a red team adjusted the plan, but no red team output existed when that was written
**Severity 6 (on the audit's credibility). Confidence: High.**

**Evidence.** `01_executive_summary.md` line 63 says "The red team's strongest attack is that a track record takes too long to earn revenue ... See `08_red_team.md`." `05_product_roadmap.md` line 13 says "The red team adjusted this plan. See `08_red_team.md` §4 for the changes it forced." There is no `08_red_team.md` in `/Users/victor/Desktop/koano-app/audit/` (directory listing today). The executive summary also says "Every claim below is cited there" and lists files "00 to 08." The synthesis pre-wrote the red team's conclusion and its effect.

**Other overreach and self-contradiction in the audit.**
- **Pricing contradiction.** GTM recommends $399 per seat for design partners (`panel/gtm_pricing.md` §2.1). The VC panel says "a signed paying design partner at $1,499 or more per month moves the pre-seed to the top of the range" (`panel/vc_and_ma.md` §1). The executive summary picks $399 without reconciling.
- **"Computed, not generated" was scored EXISTS** in `02_competitors.md` §11 and had to be corrected by a managing-partner note to PARTIAL. The white-space claim rests on a property KOANO does not have.
- **The valuation path borrows RCA and STR multiples** (13.6x and 7x revenue, `06_valuation_path.md` Band 4) for a dataset the VC panel says "every acquirer already has" (`panel/vc_and_ma.md` §1 item 2). RCA sold 20 years of proprietary transaction history gathered from brokers, not diffs of public tables.
- **"Three panelists picked this independently"** (`01_executive_summary.md` line 61). The AI, data and VC panels share one brief, one codebase and one prior audit. Convergence among agents fed the same context is not independence.

---

### Attack 9. Publishing your losses creates plaintiff's exhibits and a press story, and the ledger has no liability plan
**Severity 7. Confidence: Medium.**

**The attack (missed by every panel).** A public, hashed, downloadable ledger of every forecast and every miss (`panel/ai_expert.md` §4.5) is, by design, a permanent and admissible record. When a developer who relied on a KOANO memo loses money, the ledger is discovery already done for the plaintiff. When a reporter wants the "AI said BUY on a site under construction" story, the ledger is the source. The legal panel recommends ToS caps, E&O at $5M to $10M and narrow indemnity (`panel/legal_trust.md` lines 63, 265) but never addresses the ledger itself.

**What the prompt suggested that does not hold.** I checked whether "BUY/SELL" language is investment advice in the securities sense. Direct real property is generally not a security, so Investment Advisers Act exposure is low for the Development, Transaction and Community lenses; I found no evidence to the contrary and the legal panel did not raise it. The real exposure is negligent misrepresentation and reliance, plus broker-licensing questions on the CMA, which the legal panel covers (`panel/legal_trust.md` Risk 7). The VC panel flags that BUY/HOLD/WAIT "invites liability scrutiny" (`panel/vc_and_ma.md` §1 item 8); the roadmap never renames the vocabulary. For a product whose flagship BUY was wrong, keeping "BUY" on screen is a choice, not a locked decision.

---

### Attack 10. Infrastructure: the production stack looks like a hobby stack, and nobody checked
**Severity 6. Confidence: Low-Medium (plan unverified).**

**Evidence.**
- `vercel.json` defines a single cron, once per day (`0 10 * * *`), and the archive route shards the weekly job into seven daily runs inside a 300 second limit (`src/app/api/cron/archive/route.ts:5-7, 35, 57`). Every route caps at 300s (`maxDuration` exports). That design is consistent with Vercel Hobby limits (300s; the engineer panel cites Hobby 300s vs Pro 800s, `panel/engineer.md` line 43). If production is on Hobby, Vercel restricts Hobby to "non-commercial, personal use," and collecting payment is listed as commercial ([Vercel Hobby plan](https://vercel.com/docs/plans/hobby), [fair use guidelines](https://vercel.com/docs/limits/fair-use-guidelines)). Taking Stripe live (roadmap 30-12) on a Hobby deployment would breach the host's terms. The actual plan is **unverified**; no panel checked it.
- Supabase Free pauses projects after one week of inactivity and caps the database at 500 MB; Pro is 8 GB from $25 a month ([supabase.com/pricing](https://supabase.com/pricing)). The engineer panel assumes Pro and marks PITR as unverified (`panel/engineer.md` §15). For an asset whose value is "cannot be recreated," plan, backups and an insert-only role are diligence questions that should be answered in week 1, not inferred.
- **Socrata dependence.** All 22 NYC endpoints in `lib/` go through `data.cityofnewyork.us`. The portal now offers SODA3 alongside SODA2 ([NYC Open Data API guide](https://www.nyc.gov/opendata/get-started/user-guides/open-data-apis)), and Socrata is annually contracted by the city ([City Council hearing summary](https://citymeetings.nyc/city-council/2024-02-27-1000-am-committee-on-technology/chapter/what-responsibilities-does-socrata-have-with-the-nyc-open-data-portal-and-what-is-the-duration-and-cost-of-their-contract)). A weekly citywide capture that pulls 11.3M HPD violation rows (`wvxf-dwi5`, queried today), 1.84M ECB rows and 971K DOB NOW rows is a meaningful load against a free API with no SLA. A missed week is, by the audit's own logic, permanent loss. I found no reported outage today, so this is a design risk, not an observed failure.

---

### Attack 11. $399 is the wrong number in both directions
**Severity 6. Confidence: Medium.**

- **Too high for a screen.** Against ZoLa (free), a first-year analyst's morning, a $20 Claude plan with connectors, and Zoneomics at $61 to $279 a month (`panel/gtm_pricing.md` §2.2), $399 a month for a PLUTO-plus-filings screen that cannot see price is hard to justify to a cost-sensitive small developer.
- **Too low for founder-led sales.** Each design partner costs the only engineer days of meetings, onboarding and support. Five partners at $399 is about $24K ARR, which does not change the valuation band and buys the founder nothing but support load. The VC panel's $1,499 anchor is closer to what a signal-bearing pilot should cost.
- **Wrong unit.** The value event for a developer is a site decision worth millions; for a land broker it is a commission. Per-site or success-linked pricing to brokers ($79 single memo exists in the GTM plan) fits the job better than seats. The audit made the seat the headline.

---

### Attack 12. The vision is a list of twelve companies
**Severity 5. Confidence: High.**

The twelve developed vision items (`03_vision.md` §2) include a citywide point-in-time twin, an AR site-walk app, a counterfactual engine for city policy, an IC chatbot that defends itself, a lender marketplace, a press index, an entitlement forecaster, a reasoning API for incumbents, and a sentence-to-building zoning engine. Each is a funded startup somewhere. The vision states "a dependency does not disqualify an idea" (`03_vision.md` intro), which removes the only discipline a vision needs. Sentence-to-building alone requires a machine-readable City of Yes Zoning Resolution, which TestFit and Archistar have spent years and tens of millions approaching. Zero data budget, zero hires, one city. The vision is useful as a list of options to sell to an acquirer; it is fantasy as a plan.

---

## 2. Things the panel missed entirely

| Missed item | Why it matters | Severity |
|---|---|---|
| Founder time as the binding constraint | No roadmap item is costed in founder weeks; no hire, no capital line. See Attack 4. | 9 |
| Ledger as litigation and press liability | Public losses are discoverable and quotable. See Attack 9. | 7 |
| Event design rewards the flagship error | NB-filing event resolves YES on lots already under construction. See Attack 2. | 9 |
| Base-rate starvation in the shadow panel | About 11 NB positives per 2,000-lot cohort over 24 months (computed from today's DOB NOW and PLUTO counts). | 8 |
| Hosting plan and terms | Vercel Hobby forbids commercial use; plan unverified. See Attack 10. | 6 |
| Backtests as a substitute for a live ledger | A deterministic rival can publish 20 years of backtest immediately. See Attack 3. | 8 |
| Whether others already archive HPD contacts | If NYCDB users, PropertyShark or Reonomy keep snapshots, the "only record" claim fails. Unverified by everyone. | 7 |
| Model vendor dependence | The LLM narrates every verdict; the plan migrates models (90-1) and depends on Anthropic pricing and deprecation schedules (`07_kill_list.md` #32). Covered partly, not as a business risk. | 4 |

---

## 3. What survives my attacks

Honest list. These conclusions are right, and I tried to break them.

1. **Stop being wrong in public first** (30-1, 30-4, 30-5, kill list Tier 1). Survives completely. The FAR nudge (`direction.ts:62-65`) has no guard for active jobs, co-ops or stabilization. This is the highest-value week of work in the whole plan.
2. **Sealed evidence per verdict** (30-2). Survives. It is cheap (the cassette exists), it makes a marketing claim true, and it protects the founder in a dispute. It is the one "proof" item with near-term value to every buyer.
3. **Today's valuation** ($0.5M to $2M acquisition, $4M to $7M pre-seed). Survives, and if anything is generous given Attacks 1 and 6.
4. **NYC Open Data licensing for derived products.** The prompt invited this attack; it fails. NYC Administrative Code Chapter 5 requires public data sets to be made available without restrictions on use, with an attribution and modification-notice exception ([NYC Admin Code ch. 5](https://nyc-laws.readthedocs.io/en/latest/nycadmincode/t23/c05/), [amlegal](https://dev-codelibrary.amlegal.com/codes/newyorkcity/latest/NYCadmin/0-0-0-38560)). The two versions of the text disagree on registration and license wording, but neither restricts commercial use. The real licensing risks are the non-city sources the legal panel already flagged (Freddie Mac PMMS, Census Reporter, FBI `DEMO_KEY`).
5. **Unit economics of nightly citywide scoring.** Survives. 858,284 PLUTO lots scored by a deterministic function with no LLM is cheap compute. The risk is the data (stale PLUTO), not the cost.
6. **Legal fixes** (ToS, privacy, removing resident composition from the vote, crime labels, white-label CMA). Survive. They are cheap and they unblock every channel.
7. **Not leading with institutions; not expanding metros.** Survives. My attack is that the plan then builds the institutional moat anyway.
8. **The Archive v2 capture itself** (30-3). Survives as cheap insurance. My attack is on calling it a moat, not on doing it. Run it on a GitHub Action or small worker, weekly, and stop marketing it until diligence confirms nobody else has the history.

---

## 4. The alternative bet: be the best NYC site-sourcing tool for land brokers, and keep the ledger internal

**What I would do instead of the public forecast ledger as "the single strategic bet":**

1. **Weeks 1 to 2.** The correctness fixes (30-1, 30-4, 30-5), legal paper (30-9, 30-8), sealed evidence (30-2). Confirm hosting plan and backups.
2. **Weeks 3 to 8.** Build the site radar first version (`03_vision.md` §2.4 "first version": nightly deterministic PLUTO plus DOB NOW scoring, one buy box, emailed through `lib/monitor/digest.ts`), plus the land residual v1 with user inputs (90-7). This is the product that finds deals, which the tycoon says is where KOANO must live (`panel/real_estate_tycoon.md` §6, §11). Sell it to land and investment-sales brokers first: they monetize every site they find through a commission, they need a reason to call an owner, and they forward memos.
3. **Price per seat for brokers at $750 to $1,500 a month, or per qualified site delivered.** Fewer, higher-value customers, fitting one founder's support capacity.
4. **Keep the forecast ledger internal** as a QA harness until there is a buyer who asks for it. Pre-register events that measure the decision (land residual vs subsequent recorded sale price on the same lot, which ACRIS resolves), not the market.
5. **Freeze** the Bench, Trace, the redesign beyond the verdict band and mobile, the multifamily pack, the counterfactual engine, the reasoning API, the City Pressure Index and everything in Horizon 4 until there are 20 paying brokers.
6. **Raise a small round or hire one engineer before Horizon 2.** Without it, every horizon slips by a factor of three.

This bet is also time-locked in a way that matters: a broker who sources a deal through KOANO and closes it is a reference that no backtest can copy.

---

## 5. Top 10 problems (red team view, ranked by enterprise-value impact)

| # | Problem | Effort | Impact | State |
|---|---|---|---|---|
| 1 | Differentiator and paying buyer do not overlap (Attack 1) | XL (strategy) | 10 | EXISTS (as a plan flaw) |
| 2 | Ledger events do not measure the verdict and reward the flagship error (Attack 2) | M | 9 | PARTIAL (design only) |
| 3 | 90-day plan is about 70 person-weeks for one person (Attack 4) | S (re-plan) | 9 | EXISTS |
| 4 | Moat is a head start, not a lock (Attack 3) | n/a | 9 | EXISTS |
| 5 | Core BUY signal is priced in; price is the user's job (Attack 5) | L (residual) | 8 | EXISTS |
| 6 | Wedge ceiling near $1M to $2M ARR (Attack 6) | n/a | 8 | EXISTS |
| 7 | Horizontal AI plus MCP covers most of a screen today (Attack 7) | n/a | 8 | EXISTS |
| 8 | Public ledger as liability with no plan (Attack 9) | S | 7 | MISSING (mitigation) |
| 9 | Audit cites a red team that did not exist; internal contradictions (Attack 8) | S | 6 | EXISTS |
| 10 | Hosting plan, backups and Socrata dependence unchecked (Attack 10) | S | 6 | PARTIAL |

## 6. Top 10 opportunities the attacks reveal

| # | Opportunity | Effort | Impact | State |
|---|---|---|---|---|
| 1 | Pull the site radar forward to weeks 3 to 8 | M | 10 | MISSING |
| 2 | Sell to land brokers first, priced for one founder's capacity | S | 9 | MISSING |
| 3 | Pre-register decision-level events (residual vs recorded price on the same lot) | M | 9 | MISSING |
| 4 | Land residual v1 before any redesign | L | 9 | MISSING |
| 5 | Hire or raise before Horizon 2 | n/a | 9 | MISSING |
| 6 | Publish a deterministic backtest on reconstructable history instead of waiting a year | M | 8 | MISSING |
| 7 | Verify whether anyone else holds HPD contact history; FOIL it yourself | S | 7 | MISSING |
| 8 | Rename BUY/SELL for the Development lens to screening language (ADVANCE/PASS already exists in `site-screening.ts`) | S | 7 | PARTIAL |
| 9 | Confirm hosting plan, PITR and an insert-only archive role in week 1 | S | 6 | MISSING |
| 10 | Cut the vision to three items with owners and dates | S | 5 | MISSING |

## 7. What I would rebuild first

The plan, not the product. Cut the 90-day plan to the correctness fixes, sealed evidence, legal paper, the site radar first version and the land residual. Everything else waits for revenue or a second engineer.

## 8. The one thing that would make me say "I have never seen anything like this"

A Monday email to a land broker that says: "Seven lots in your buy box changed this week. Here is the one where the as-of-right residual exceeds the last recorded sale by 40 percent, the owner has held it 22 years, and there is no active DOB NOW job," with every number traceable, and a record showing how many of last quarter's seven-lot emails turned into listings. That is a ledger a customer pays for.

---

## Sources

- https://vercel.com/docs/plans/hobby (Hobby plan, non-commercial personal use)
- https://vercel.com/docs/limits/fair-use-guidelines (commercial use definition)
- https://supabase.com/pricing (Free 500 MB and pause after one week; Pro 8 GB from $25)
- https://www.nyc.gov/opendata/get-started/user-guides/open-data-apis (SODA2 and SODA3, 1,000 row default)
- https://citymeetings.nyc/city-council/2024-02-27-1000-am-committee-on-technology/chapter/what-responsibilities-does-socrata-have-with-the-nyc-open-data-portal-and-what-is-the-duration-and-cost-of-their-contract (Socrata annual contract; search snippet)
- https://nyc-laws.readthedocs.io/en/latest/nycadmincode/t23/c05/ and https://dev-codelibrary.amlegal.com/codes/newyorkcity/latest/NYCadmin/0-0-0-38560 (NYC Open Data Law, no restrictions on use; search snippet, versions disagree on wording)
- https://www.cotality.com/press-releases/cotality-launches-claude-connector-to-deliver-trusted-property-intelligence-in-ai-workflows (Cotality Claude connector, Oct 12, 2026; search snippet)
- https://claudepluginhub.com/skills/mariourquia-cre-skills/entitlement-feasibility (free cre-skills plugin, 127 skills; fetched)
- https://newyorkyimby.com/2026/03/the-new-york-yimby-2025-report-showcases-more-than-57000-proposed-residential-and-hotel-units.html (2025 NB permit counts by borough and size; search snippet)
- https://www.rebny.com/reports/q2-2025-construction-pipeline-report/ (REBNY quarterly NB filings; search snippet)
- https://www.nyc.gov/site/planning/about/press-releases/pr-20190305.page (ZoLa free tool; search snippet)
- https://fontanarchitecture.com/?p=9459 and https://fontanarchitecture.com/building-a-townhouse-nyc/ (architect zoning analysis; in-house feasibility; search snippet)
- https://www.housecanary.com/images/65b197270a93d8fc78740602_hc_avm-accuracy_white-paper.pdf (AVM vendor publishes accuracy; search snippet)
- NYC Open Data SODA queries run today: `https://data.cityofnewyork.us/resource/{tesw-yqqr, feu5-w2e2, w9ak-ipjd, 6bgk-3dad, 64uk-42ks, wvxf-dwi5}.json?$select=count(*)`; `w9ak-ipjd` grouped by `job_type` for 2025; distinct `bbl`, `owner_s_business_name`, `applicant_business_name` for `job_type='New Building'` between 2024-10-01 and 2026-10-01.

Unverified: a CoStar MCP server (search found nothing specific); whether NYCDB users, JustFix, PropertyShark or Reonomy retain historical HPD contact snapshots; whether HPD registration history is available by FOIL; KOANO's actual Vercel and Supabase plans.

## Discrepancies vs the brief

- The audit files reference `08_red_team.md` (`01_executive_summary.md` line 63, `05_product_roadmap.md` line 13). It does not exist in the audit directory today. This file is the red team output; the synthesis described its conclusions before it was written.
- The brief and audit describe KOANO as having "deterministic verdict math." The aggregation is deterministic, but the decisive input on the flagship verdict is a single unguarded rule (`lib/agents/direction.ts:62-65`), and each agent vote is LLM-set (per `panel/ai_expert.md` §1.2, which I did not re-verify). Deterministic and correct are different properties; the locked decision protects the first and says nothing about the second.
- `vercel.json` defines one daily cron; the archive's weekly cadence is implemented as seven daily shards (`src/app/api/cron/archive/route.ts:5-7, 57`). The audit describes Archive v2 as needing a worker "outside Vercel," which is correct, but no panel states which Vercel plan production runs on.
