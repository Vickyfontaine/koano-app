# 08. Red Team: Attacks, Concessions, Rebuttals, Adjustments

A separate subagent played a skeptical short-seller and veteran proptech investor. It read the full audit and the code, ran its own NYC Open Data counts, and wrote 12 ranked attacks. Its full file is `panel/red_team_attacks.md`.

This document answers each attack. It concedes what is right, rebuts what is wrong, and records the changes the red team forced. Those changes have been applied to `01_executive_summary.md` and `05_product_roadmap.md`, and noted in `06_valuation_path.md`.

**Process note (the red team's Attack 8, conceded).** The first drafts of the executive summary and roadmap referenced this file before it existed. That was a sequencing error by the managing partner. The references are now true, and both files were revised after the attacks below.

---

## 0. Scorecard

| # | Attack | Severity | Verdict | Plan changed? |
|---|---|---|---|---|
| 1 | Buyers who value auditability can't buy yet; buyers who can buy don't value it | 10 | **Mostly conceded** | Yes: the bet and the wedge are reframed |
| 2 | Ledger events don't measure the verdict and would score the flagship error as a hit | 9 | **Conceded** | Yes: decision-level events and exclusion rules |
| 3 | The moat is a head start, not a lock; rivals can backtest 20 years on day one | 9 | **Partly conceded** | Yes: KOANO publishes its own backtest first |
| 4 | The 90-day plan is about 70 person-weeks for one founder | 9 | **Conceded** | Yes: the plan was cut to a critical path, with a hire or raise gate |
| 5 | The core BUY signal is already priced in; the residual is the real product | 8 | **Conceded** | Yes: the land residual moves into weeks 3 to 8 |
| 6 | The wedge ceiling is near $1M to $2M ARR | 8 | **Conceded on the number, rebutted on the meaning** | Partly: the wedge is now brokers plus developers, with lenders as the second wedge |
| 7 | Horizontal AI plus MCP covers most of a site screen for free | 8 | **Partly rebutted** | No structural change; the demo now proves the gap |
| 8 | The audit cited a red team that did not yet exist | 6 | **Conceded** | Fixed |
| 9 | Publishing losses creates plaintiff exhibits and press stories | 7 | **Conceded** | Yes: a publication policy was added |
| 10 | The infrastructure may be on a hobby plan; nobody checked | 6 | **Conceded (unverified either way)** | Yes: a week-1 check |
| 11 | $399 is wrong in both directions | 6 | **Conceded** | Yes: one price architecture, resolving the GTM vs VC conflict |
| 12 | The vision is a list of twelve companies | 5 | **Conceded on scope, rebutted on purpose** | Yes: only three vision items carry owners and dates |

---

## 1. Attack by attack

### Attack 1. The buyer who values auditability cannot buy, and the buyer who can buy does not value it (Severity 10)

**The attack.** Model-risk teams and institutions value a calibrated, replayable record, but the audit places SOC 2 at 12 months and institutional revenue at 18 to 36 months. The customer KOANO can sell now, a small NYC developer, values speed and a right answer. The audit's own tycoon says a junior analyst builds the dossier "in a morning with ZoLa, DOB NOW, ACRIS and HPD Online."

**Concede.** The executive summary's first draft made the public forecast ledger "the single strategic bet," and that put the most valuable asset in front of a customer who will not pay for it for two years. Revenue in year one comes from finding and pricing sites, not from calibration curves.

**Rebut, in part.** Auditability is not worthless to the near-term buyer. It just takes a different form:
- A land broker forwards a memo to an owner or a buyer. A memo that never states a false fact, and that the broker can defend line by line, is the product. Sealed evidence (30-2) protects the broker in a dispute, and that survives the red team's own review (§3.2 of its file).
- The 175 3rd St case shows that "a morning with ZoLa" is exactly the workflow that missed the tower under construction. A guarded scorecard that checks DOB NOW and ACRIS on every lot, every night, does something that morning of manual work does not.

**Adjustment.** The strategic bet is reframed. The sellable product leads: a guarded site radar plus land residual for brokers and developers. The ledger becomes the internal quality harness that every call passes through, and it is published only once decision-level events resolve. The proof layer stays, but is built underneath the revenue product rather than in front of it (`01_executive_summary.md`, revised).

### Attack 2. The ledger scores events that do not measure the verdict (Severity 9)

**The attack.** The pre-registered event "NB or ALT-1 filing on the lot within 24 months" would resolve YES at 175 3rd St, so it scores the flagship error as a hit. Submarket-index events are shared by every lot in a ZIP code, so they measure the market, not the pick. The 24-month NB base rate is about 0.53%, so a 2,000-lot shadow panel gets about 11 positives per cohort, which is too few to score.

**Concede, fully.** This is the sharpest technical catch in the audit. The AI panel's event table (`panel/ai_expert.md` §4.1) was statistically careful on intervals but wrong on construct validity.

**Adjustment** (roadmap 90-2, revised):
1. **Information-set exclusion.** A forecast is ineligible for scoring if its outcome was already knowable at verdict time. For example, an active NB or DM job on the lot, or a deed recorded but not yet published, makes it ineligible. The archive's first-seen timestamps make this enforceable.
2. **Decision-level events first.** The primary event is the deterministic land residual at verdict time against the lot's next recorded arm's-length sale price in ACRIS (did the market clear above or below KOANO's supportable value?). Second is the screening call (ADVANCE or PASS) against whether the lot traded or was filed by an unrelated party within 24 months. Market-level events are kept only as context and reported separately.
3. **Base-rate honesty.** Oversample the shadow panel on the lots the scorecard actually flags (stratified, with weights disclosed), report positives per cohort, and publish no reliability diagram until the counts meet the gate in `panel/ai_expert.md` §4.3.

### Attack 3. The moat is not time-locked (Severity 9)

**The attack.** A deterministic competitor can publish a 20-year backtest on public history immediately, and model-risk teams accept documented backtests. The capture head start is months, and NYCDB, PropertyShark, Reonomy or Cherre may already keep HPD contact snapshots (unverified by anyone).

**Concede.** A backtest on reconstructable history is available to anyone and is accepted practice. KOANO should publish one too, before anyone else, because its scorecards will be deterministic after 90-1. Whether others hold HPD contact history is also unverified, so KOANO must not claim to be "the only record" until it has checked. That means asking the vendors and filing a FOIL request with HPD.

**Rebut, in part.** Two things cannot be backtested:
- **The overwritten fields.** Owner and agent registrations, and violation and filing status paths, only exist for weeks someone captured. A backtest must either omit them or reconstruct them with look-ahead bias.
- **Live out-of-sample performance.** In model risk review a live record is stronger evidence than a backtest built by the vendor on data it chose.

The time lock is real but narrower than the first drafts claimed. It is a head start of months on the overwritten fields, plus years on live scored calls.

**Adjustment.** Roadmap 90-19 (new) publishes a deterministic backtest of the guarded site scorecard on DOF annualized sales, archived PLUTO and DOB permit history, with the look-ahead controls in `panel/ai_expert.md` §4.4. Roadmap 30-21 (new) checks who else holds HPD contact history before any marketing claim.

### Attack 4. The 90-day plan is about 70 person-weeks for one founder (Severity 9)

**The attack.** Costing the roadmap's own effort labels gives about 21 person-weeks for the "30-day" items and 49 for the "90-day" items. Git shows one author. There is no hire or capital line, and design-partner "renewal" after 4 to 8 weeks of use is not a real signal.

**Concede, fully.** The first roadmap ranked items correctly and then scheduled all of them.

**Adjustment.** The 90-day plan is cut to a critical path (`01_executive_summary.md`, revised). Re-costed honestly, it is still about 18 to 20 founder-weeks against 12 calendar weeks, so the plan now requires the hire or contractor (30-22) to start in weeks 2 to 4, with weeks 8 to 12 named as the first to slip. The red team's arithmetic was right; the first revision of this response repeated the error at smaller scale. The critical path covers:
- correctness fixes
- legal paper
- the provenance constraint
- sealed evidence
- the paid documents wired
- capacity and Stripe
- Archive v2 capture as a weekly GitHub Action
- the site radar v1
- the land residual v1
- five paying design partners

Everything else in Horizon 2 is **frozen until one of two gates opens**: 20 paying customers, or a second engineer funded. Frozen items include the Bench, Trace, the full redesign, the multifamily pack, tenancy, the provider-context rewrite, the published ledger and OM upload. A small raise or a first engineering hire is now an explicit roadmap item (30-22). "Renewal" is replaced as the 90-day metric by "forwarded a KOANO memo unedited" and "paid for month two."

### Attack 5. The core BUY signal is already priced in (Severity 8)

**The attack.** Land trades per buildable square foot, so "underbuilt, therefore buy" is an input to price, not an edge. The land residual, which is what developers would pay for, sat behind the ledger, the redesign and the engine rewrite.

**Concede.** The tycoon said the same thing (`panel/real_estate_tycoon.md` §10: re-express the verdict as "supportable land value vs ask"), and the first roadmap still put it at 90-7.

**Adjustment.** The land residual v1 moves into weeks 3 to 8. With user-entered price and program, and every input labeled, the development verdict becomes "residual vs ask" as soon as it exists. The FAR nudge is guarded in week 1 and then retired once the residual exists (`07_kill_list.md` #24).

### Attack 6. The wedge is small (Severity 8)

**The attack.** About 4,589 lots with NB filings, about 2,107 owner names and about 1,440 applicant firms over 24 months. Full penetration is roughly $1M to $2M ARR.

**Concede the number.** NYC developers alone cap out around there.

**Rebut the meaning.** A wedge is meant to be narrow. $1M to $2M ARR with strong retention is the Band 2 ($10M) proof in `06_valuation_path.md`. It is not the end state.

**Adjustment.** The wedge is widened inside NYC to the people who monetize sites:
- **Primary:** land and investment-sales brokers, priced per seat at a level one founder can support.
- **Developers:** at a lower seat price.
- **Second wedge, after the first 20 customers:** lenders and debt funds, buying collateral monitoring and the screening memo as a credit fact sheet.

### Attack 7. Horizontal AI plus MCP covers the 80% for free (Severity 8)

**The attack.** Cotality shipped a Claude connector in October 2026, ATTOM, CompStak, Regrid and Green Street ship MCP servers, and a free 127-skill CRE plugin exists. A user with Claude plus those connectors gets most of a site screen without KOANO.

**Partly rebut.** Horizontal assistants are a real substitute for one-off questions, and the competitor file already treats MCP commoditization as the structural market fact (`02_competitors.md` §0). They do not:
1. score every lot in the city nightly against a buy box (the radar)
2. guarantee the same answer twice
3. carry per-figure provenance with named gaps
4. seal a record a broker can defend later

The 175 3rd St failure is also the demonstration: a model with MCP access to stale parcel data makes the same mistake unless something forces a DOB NOW check.

**Concede the risk.** If KOANO's product is "a better answer when asked," it loses to free. Only the proactive radar and the defensible record survive that comparison.

**Adjustment.** None to structure. The new demo (30-5) is built to show the gap directly: the same lot asked to a general assistant versus KOANO's guarded, sealed result.

### Attack 8. The audit cited a red team that did not exist (Severity 6)

**Conceded and fixed.** See the process note at the top.

**The pricing conflict it raised is resolved under Attack 11.** The GTM panel recommended $399 per seat, while the VC panel said a $1,499+ partner moves valuation.

### Attack 9. Publishing your losses creates plaintiff exhibits (Severity 7)

**Concede.** No panel addressed it.

**Adjustment.** Roadmap 12-2 now carries a publication policy:
- Publish **aggregate** calibration only: reliability by event and cohort, with counts and exclusions.
- Never publish an individual client verdict or address without consent. The shadow panel's random lots are the publicly listed examples.
- Frame every verdict in the ToS and on documents as decision-support with a stated method and known error rates, not advice.
- Get counsel review of the Track Record page before launch, and carry E&O insurance before any institutional contract.

A disclosed error rate is a defense ("we told you the hit rate"), provided the language is right. That is a question for counsel to confirm, not a conclusion of this audit.

### Attack 10. The infrastructure may be a hobby stack (Severity 6)

**Concede, unverified either way.** Nobody checked which Vercel and Supabase plans production runs on. Vercel's Hobby plan is non-commercial ([vercel.com/docs/plans/hobby](https://vercel.com/docs/plans/hobby)). The brief says Supabase Pro.

**Adjustment.** Roadmap 30-23 (new), in week 1:
- Confirm the Vercel plan (Pro before Stripe goes live).
- Confirm Supabase Pro with point-in-time recovery.
- Create an insert-only database role for archive writes.
- Snapshot the archive weekly to separate storage.

### Attack 11. $399 is wrong in both directions (Severity 6)

**Concede.** It is too high for a solo developer screening casually, who has ZoLa for free, and too low for a broker who earns a commission on each site found, given one founder's support capacity.

**Resolved price architecture** (replaces `panel/gtm_pricing.md` §2.1 where the two conflict; the GTM file's other tiers stand):

| Offer | Price |
|---|---|
| **Broker Radar** (primary wedge) | $1,000/month per seat, annual preferred, 3-month paid pilot at $750/month. Includes the radar, unlimited screening memos, the land residual and monitoring |
| **Developer Pro** | $399/month, or $79 per single memo as the entry point |
| **Design partners** | First five at a discounted but paid rate, never free, so the metric is real |
| **Portfolio** | Unchanged: annual, $24k platform fee, paid pilot |

The VC panel's point stands: five partners at about $1,000 per month is a stronger seed story than twenty at $399.

### Attack 12. The vision is a list of twelve companies (Severity 5)

**Concede on scope.** Twelve developed ideas for a solo founder is not a plan.

**Rebut on purpose.** The prompt asked for unconstrained vision, deliberately separated from the plan. It is labeled `VISION` throughout and is not scheduled.

**Adjustment.** Only three vision items carry owners and dates. All others stay unscheduled.

| Vision item | Scheduled as |
|---|---|
| Site radar | Weeks 3 to 8 |
| Sealed, replayable verdict | Weeks 2 to 4 |
| Point-in-time capture, as cheap insurance | Weeks 2 to 4 |

---

## 2. What survived the red team (by its own account)

These conclusions were attacked and held (`panel/red_team_attacks.md` §3):
1. Stop being wrong in public first. 30-1, 30-4, 30-5 and Tier 1 of the kill list are "the highest-value week of work in the whole plan."
2. Sealed evidence per verdict.
3. Today's valuation (if anything generous).
4. NYC Open Data licensing is not a risk for derived products. The NYC Open Data Law bars use restrictions beyond attribution. The real licensing risks are the non-city sources the legal panel flagged (Freddie Mac PMMS, Census Reporter, the FBI key).
5. Nightly citywide deterministic scoring is cheap. The risk is stale data, not compute.
6. All legal fixes.
7. Not leading with institutions, and not expanding metros.
8. Archive v2 capture, as cheap insurance rather than a marketed moat.

## 3. Where the managing partner disagrees with the red team

1. **"Keep the ledger internal" indefinitely.** Disagree. Keep it internal **until decision-level events resolve and pass the publication gate**, then publish aggregate results. A sealed internal ledger costs almost nothing. Publishing it is the one move that separates KOANO from Diald's uncalibrated "probability" in front of lenders, who are the second wedge. Delaying publication is right. Abandoning it is not.
2. **Freezing the Bench entirely.** Partly disagree. The early `decision` event, which shows the computed verdict before the narrator, is an S-sized change. It makes "computed, then narrated" visible in every demo, so it stays in the 90 days. The full Bench and Trace remain frozen.
3. **Development BUY/SELL language.** Agree with the red team. The Develop lens uses ADVANCE, HOLD and PASS, which already exist in `site-screening.ts`. BUY and SELL are reserved for the Acquire lens.

## 4. Net changes to the plan

| Change | Where applied |
|---|---|
| Strategic bet reframed: the revenue product (guarded site radar plus land residual for brokers and developers) leads, and the scored, sealed record is built underneath it and published once decision-level events pass the gate | `01_executive_summary.md` |
| 90-day plan cut to a critical path of about 18 to 20 founder-weeks (honestly costed), requiring a hire or contractor inside the 90 days, with everything else FROZEN behind a gate | `01_executive_summary.md`, `05_product_roadmap.md` |
| Land residual v1 and site radar v1 pulled into weeks 3 to 8 | `05_product_roadmap.md` 30-24, 30-25 (new) |
| Ledger events redesigned: information-set exclusion, decision-level primary events, base-rate disclosure | `05_product_roadmap.md` 90-2 |
| New items: own backtest (90-19), HPD-history verification (30-21), hire or raise (30-22), hosting check (30-23), publication policy (12-2) | `05_product_roadmap.md` |
| Wedge widened to brokers first; pricing conflict resolved ($1,000 broker seat, $399 developer, $79 memo) | this file §1 Attack 11; `01_executive_summary.md` |
| Frozen until 20 paying customers or a second engineer: Bench (except the early `decision` event), Trace, full redesign, multifamily pack, tenancy, provider-context rewrite, OM upload, API | `05_product_roadmap.md` |
