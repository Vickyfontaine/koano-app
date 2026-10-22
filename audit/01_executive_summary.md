# 01. Executive Summary

*KOANO full-spectrum audit, 2026-10-19. Synthesis of a ten-role expert panel, a system map, competitive research and a red team. Details and evidence are in files 00 to 08 and `panel/`. Every claim below is cited there.*

## Current state in one paragraph

KOANO has unusually good bones and a verdict that cannot yet be trusted. The engineering discipline is rare for a six-month, one-founder codebase:
- a five-state provenance taxonomy with a weakest-wins rollup
- a per-verdict coverage map
- an append-only verdict table
- a record/replay fixture that gates every push
- a structurally grounded monitoring diff
- 15 working document types

On top of those bones, three things are not right:
- **The flagship output is wrong in ways a professional finds in four minutes.** The 175 3rd St BUY on the homepage sits on a lot with a permitted 27-story, 1,071-unit tower under construction. The #1-ranked demo site has its own 23-story filing, and the third demo site is an occupied 128-apartment co-op. The causes: KOANO never reads DOB NOW, and a +1.0 "unused FAR" nudge fires with no guards.
- **Valuations break outside one-to-three-family homes.** The pricing sheet values a co-op two-bedroom at about $149M.
- **"Auditable" and "deterministic" are only partly true.** The evidence behind a verdict is never saved. The LLM still sets every agent's vote. Non-NYC verdicts likely fail to persist because of a two-state database constraint.

The commercial layer is not ready to take money at volume:
- a global cap of 50 runs per day for all users combined
- Stripe in test mode
- the CMA, IC memo and portfolio risk report sold on /pricing but unreachable in the UI
- no Terms of Service or Privacy Policy
- a "gentrification stage" built from income and education that feeds the buy/sell vote

The archive is a well-built harness pointed at mostly reconstructable data, so the moat has not started compounding on the right asset. Honest value today: about **$0.5M to $2M** as an acquisition, **$4M to $7M** as a pre-seed.

## The five biggest things holding KOANO back

1. **Verdicts that fail a basic professional check.** The engine judges every property as an undeveloped site using stale PLUTO data. It cannot see active construction, co-ops, rent stabilization or price. One embarrassing BUY in front of an investment committee costs more than every feature gains. *(Tycoon, AI, user role-play. Fix: roadmap 30-1, 30-4, 30-5.)*
2. **The proof layer is claimed but not built.** No evidence is sealed per verdict, the calibration table scores nothing, confidence describes agent agreement rather than the published verdict, and determinism depends on a temperature setting. Newer Claude models reject that setting, and Sonnet 4.6 can be retired from February 17, 2027. *(Engineer, AI. Fix: 30-2, 90-1, 90-2.)*
3. **The moat is pointed at the wrong data.** Most of what the archive stores can be rebuilt from public history (DOF sales back to 2003, ACRIS back to 1966, PLUTO back to 2002, DOB NOW permits back to 2016). What cannot be rebuilt are the records the city overwrites: HPD owner and agent registrations, violation and filing status paths, ZAP status, and old assessment rolls. KOANO captures those only for a handful of user-tracked buildings. Every week this continues, that history is lost for good. *(Data strategist. Fix: 30-3.)*
4. **The product cannot be bought or used as sold.**
   - Paid documents are unreachable in the UI.
   - The free tier promises three documents and grants none.
   - One user can exhaust the whole company's daily capacity.
   - The dashboard does not work on a phone.
   - The verdict has no fixed place on screen, and the run is a 60 to 180 second black box.

   *(Product, design, GTM. Fix: 30-7, 30-11, 30-12, 90-4, 90-5.)*
5. **Legal and trust exposure that blocks every institutional channel.**
   - No ToS or Privacy Policy.
   - Resident income and education steer a buy/sell vote, and that text is stored immutably and shown to renters.
   - All NYPD felonies are labeled "violent".
   - Landlord portfolios merge different people who share a name.
   - KOANO branding appears on the white-label CMA.

   *(Legal. Fix: 30-8, 30-9, 30-10, 30-14.)*

## The single strategic bet

**Become the NYC site-sourcing and pricing engine whose every call is guarded, sealed and scored.**

Concretely:
- **Sell what finds deals.** The revenue product is a guarded site radar plus a land residual for land brokers and developers. Every night it scores every NYC lot against a client's buy box, corrected by DOB NOW and ACRIS, and every Monday it delivers ranked sites with "supportable land value vs ask."
- **Make every call defensible.** Every call goes through deterministic, versioned lens scorecards. The LLM extracts facts, critiques with evidence-cited flags and narrates under a verifier. It never votes.
- **Seal everything.** Every verdict is sealed with its full evidence so it can be replayed later. That protects the broker in a dispute and makes "auditable" literally true.
- **Score against reality.** Every call forecasts decision-level public events, scored against what the city later records. Examples: the residual against the lot's next recorded sale, and ADVANCE against whether an unrelated party files or trades within 24 months.
- **Publish when the counts allow.** The record stays internal until the counts pass the publication gate, then it is published as aggregate calibration.
- **Capture what the city overwrites.** Citywide point-in-time capture of the overwritten records runs underneath, as cheap insurance.

The red team changed this bet (`08_red_team.md` §0). The first draft made the public forecast ledger the headline. The red team showed three problems:
- The buyer who values a ledger cannot buy for two years.
- The original events would have scored the 175 3rd St error as a hit.
- One founder could not build it alongside everything else.

The proof layer survives, built underneath the product people pay for instead of in front of it. Three panelists still chose the scored record as the "never seen anything like this" moment, and the competitive research found nobody publishes one (Diald calls its score a "probability" and publishes no calibration). That is why it is kept, delayed and done properly rather than dropped.

## The 90-day plan (critical path)

Honest sizing: costed with the roadmap's own effort labels, weeks 1 to 8 are about 18 to 20 founder-weeks of work. So the first engineering hire or contractor (30-22) has to start during weeks 2 to 4, or the radar slips to week 12. Weeks 8 to 12 are the first thing to slip, not the first thing to cut corners on.

**Week 1: stop being wrong in public**
- Pull 175 3rd St, 1800 Park Ave and 70-33 260th St from every surface. Hand-check a replacement demo site against DOB NOW and ACRIS.
- Add DOB NOW filings. Guard the FAR nudge: no active NB or DM job, no co-op or condo, no likely-stabilized building, no landmark. Use ADVANCE/HOLD/PASS in the Develop lens.
- Stop printing building-area valuations for co-op, condo and 7+ unit subjects.
- Widen the provenance CHECK constraints (verify production first). Check every swallowed database error.
- Publish ToS and Privacy. Remove gentrification stage and education from Demand Sentiment. Fix the crime labels. Strip KOANO from white-label documents.
- Confirm the Vercel and Supabase plans, point-in-time recovery and backups.

**Weeks 2 to 4: make it sellable and stop losing history**
- Wire the CMA, IC memo and portfolio risk buttons.
- Replace the 50/day breaker with per-plan monthly credits and a usage meter. Go live on Stripe with the resolved prices:
  - Broker Radar: $1,000 per seat, with a $750 pilot.
  - Developer Pro: $399.
  - Single memo: $79.
  - Portfolio: annual pilot.
- Seal the evidence for every production verdict. The cassette already exists.
- Run Archive v2 capture as a weekly GitHub Action: HPD registrations and contacts, DOB NOW status, ZAP status, violation statuses. Ask vendors, and file a FOIL request, to learn whether anyone else holds HPD contact history before claiming uniqueness.
- Emit the computed `decision` before the narrator so "computed, then narrated" is visible. Add CI and Sentry.

**Weeks 3 to 8: the product that finds deals**
- Site radar v1: nightly deterministic PLUTO plus DOB NOW plus ACRIS scoring against one buy box per client, delivered as a Monday email through the existing digest path.
- Land residual v1: user-entered price, program, cost, rent and cap, every input labeled. The Develop verdict becomes "residual vs ask."
- Five paid design partners, mostly land and investment-sales brokers, found through DOB NOW applicant data and recorded development-site sales.

**Weeks 8 to 12: prove it and decide (NEXT items; first to slip)**
- Port the Develop lens to a deterministic scorecard (`site-screening.ts:205` is the template). Pre-register decision-level events with information-set exclusion. Start the internal ledger and a stratified shadow panel.
- Publish a deterministic backtest of the guarded site scorecard on reconstructable history, with look-ahead controls.
- Measure:
  - Did partners pay for month two?
  - Did they forward a KOANO memo unedited?
  - How many radar sites turned into calls or listings?
- **Gate:** raise a small round or hire one engineer before starting anything frozen in `05_product_roadmap.md`. That covers the Bench, Trace, the full redesign, the multifamily pack, tenancy, OM upload and the API.

**Monday morning:** open `scripts/fixtures/nyc-175-3rd-st.json` next to DOB NOW job B00680917. Then make the three changes in roadmap 30-1, 30-4 and 30-5 before showing KOANO to anyone else.
