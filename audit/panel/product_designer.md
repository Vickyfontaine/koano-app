# Panel 6.4: Senior Product Designer / UX Lead

Reviewer persona: led product design at Airbnb, Figma and a vertical SaaS unicorn. Analysis only. Every grounded finding cites a file, line, route or screenshot. Vision ideas are fenced off in their own section.

Evidence base:
- Signed-in production dashboards, 2026-09-30, 3840x2160 above the fold: `demo-kit/design-upload-2/dashboards/{development,transaction,community,portfolio}.png`
- Live marketing site captured 2026-10-19 at 1440px and 390px: `scratchpad/shots/desktop_.png`, `desktop_pricing.png`, `desktop_signup.png`, `desktop_for_developers.png`, `mobile_.png`, `mobile_pricing.png`, `mobile_dashboard.png`
- Code: `src/app/onboarding`, `src/app/dashboard/**`, `src/components/dashboard/**`, `src/components/ui/{AddressInput,CandidatePicker,LoadingState}.tsx`, `lib/koano-guard.ts`, `lib/documents/{guard,registry,implemented}.ts`, `src/components/marketing/{PricingContent,HeroSection}.tsx`
- I could not sign in. Dashboard behavior below is derived from component code plus the four screenshots.

---

## 0. The verdict in one paragraph

KOANO has the rarest asset in this category (a deterministic, auditable verdict with honest provenance) and a dashboard that hides it. In three of four clusters the verdict is not the first thing a user sees. In Transaction it renders after seven panels and the documents block (`Cluster2Dashboard.tsx:179-296`). The documents that the pricing page sells as the headline deliverable of two tiers (the CMA, the IC memo, the Portfolio Risk Report) are implemented server-side and have no button anywhere in the UI. Free users are promised "three generated documents" on the pricing page and are hard-blocked from generating any document by the tier gate, and that block surfaces as a red text line rather than the upgrade modal. The dashboard has no responsive layout at all, so on a phone the content column is 150px wide. Each of these breaks one of the three journeys that create revenue: first verdict, first document, first payment. The good news is that all of the hard parts (engine, provenance, documents, guard) exist, so the fix is mostly information architecture and wiring, which is the cheapest kind of fix there is.

---

## 1. Heuristic evaluation (Nielsen's 10)

Severity scale: 4 = catastrophe, blocks revenue or trust; 3 = major; 2 = minor; 1 = cosmetic.

### H1. Visibility of system status
- **Sev 4. Free allowance is invisible.** There is no usage meter anywhere in the dashboard (`grep remaining|usage` in `src/components/dashboard` and `src/components/ui` returns nothing). The user learns they are out only when the 402 modal appears (`UpgradeScreen.tsx:112`). Free counts are lifetime and attempts count even if the run fails (`lib/koano-guard.ts:3-7, 19-20`).
- **Sev 3. Three different run-time promises.** "takes about a minute and a half" (`Cluster1Dashboard.tsx:157`, `Cluster2Dashboard.tsx:171`), "~1 to 3 min" (`SiteComparison.tsx:253`), "about two minutes" (Site comparison empty state), "the run takes ~60s" (`LoadingState.tsx:3`). Pick one measured number and show a live ETA.
- **Sev 3. Transaction hides the agent progress below the fold.** `LoadingState` for the verdict pipeline sits after market velocity, the comps map, CMA builder, scatter, pricing, permit trend, narrative and documents (`Cluster2Dashboard.tsx:268-275`). The most theatrical, trust-building moment in the product (five agents converging live) happens off screen.
- **Sev 3. Development waits for the slowest site.** No ranking appears until every slot finishes; completed slots say "Complete. Waiting for the other sites" (`SiteComparison.tsx:338`). One slow geocode holds the whole answer hostage for minutes.
- **Sev 2. Global capacity breaker is a hidden shared state.** `KOANO_DAILY_RUN_CAP` defaults to 50 attempts per 24h across all users (`koano-guard.ts:70-73`). One three-site comparison is three attempts. A prospect demoing on a busy day gets "KOANO's demo capacity for the day is used up" (`koano-guard.ts:152`) with no warning in the UI beforehand. The word "demo" in a production error message undercuts a $1,499 product.

### H2. Match between system and the real world
- **Sev 4. Three numbering systems for the same four products.** `clusters.ts:5-10` documents it: `cluster_id` (1/2/4/5), `number` ("01/02/04/05", rendered as the page eyebrow), and `badge` ("C1 to C4", rendered in the sidebar). The development screenshot shows eyebrow "04", sidebar "C1 · Development intelligence", and the note "Viewing C1. Your home cluster is C2." The community view is eyebrow "01", badge "C4". Onboarding cards show the `number` (`OnboardingClusters.tsx:160`), the upgrade modal shows the `number` (`UpgradeScreen.tsx:149`), the pricing page shows the `badge` (`PricingContent.tsx:30-36`). No real user thinks of themselves as "C2". Agents think "I'm an agent".
- **Sev 3. Internal vocabulary leaks.** "Cluster view" (`Sidebar.tsx:75`), "home cluster", "BBL 3009720058" in the portfolio table header row (portfolio screenshot), "proposed by {source}" naming geocoders in the candidate picker (`CandidatePicker.tsx:98`), "Pre-grounding-gate" badge in history (`VerdictHistory.tsx:186`), "Verdict history: append-only audit trail" as a panel title (`VerdictHistory.tsx:75`). Provenance honesty is a locked decision, and it survives translation: keep the facts, translate the words.
- **Sev 2. Prices without currency.** "From 19 / month" (`clusters.ts:40`) renders in onboarding and in the upgrade modal; the pricing page says "From $19".

### H3. User control and freedom
- **Sev 3. History is read-only.** A past verdict can be expanded to "Show math" or hidden (`VerdictHistory.tsx:192-227`) but cannot be reopened into the dashboard, re-run, watched, or turned into a document. The user's own past work is a dead list.
- **Sev 3. Candidate picker has no cancel or edit path.** `CandidatePicker.tsx` renders only candidate buttons. The way out is to retype in the address box above.
- **Sev 2. "Remove" in Portfolio executes immediately** with no undo (`Cluster5Dashboard.tsx` `removeProperty`, the "Remove" text link in the portfolio screenshot).

### H4. Consistency and standards
- **Sev 4. The verdict occupies a different position in every cluster.** Community: map first, verdict second (`Cluster1Dashboard.tsx:166-200`, screenshot shows HOLD half below the fold). Transaction: verdict last (`Cluster2Dashboard.tsx:296`). Development: map, then table, then per-site verdict cards far below (`SiteComparison.tsx:370-468`). Portfolio: map, table, then the verdict for whichever row was re-run (`Cluster5Dashboard.tsx:121-160`). The product's core object has no home.
- **Sev 3. Document placement differs per cluster.** Community puts documents before the reasoning chain (`Cluster1Dashboard.tsx:231-293`); Transaction before the verdict; Development per site plus one brief at the bottom; Portfolio in a block that is not tied to any verdict.
- **Sev 2. Inline styles everywhere, no media queries.** Every dashboard file hand-writes `fontSize`, `fontFamily`, `padding`. That is why consistency drifts.

### H5. Error prevention
- **Sev 4. Development burns the whole free allowance in one click.** Three sites = three verdict attempts, free = 3 lifetime (`koano-guard.ts:38`, `SiteComparison.tsx` fires three streams). A new developer, in their own cluster, doing the cluster's one advertised job, exhausts the trial before seeing a single ranked result, and failed slots still count.
- **Sev 3. Sidebar items target sections that do not exist yet.** "Valuation", "Permit history", "Alerts", "Market velocity", "Entitlement risk", "Pro forma" all target DOM ids mounted only after a run (`clusters.ts:87-113`). Clicking them in the empty state does nothing, silently. In Development, `id="c4-entitlement"` and `id="c4-proforma"` are rendered once per site (`SitePanels.tsx:52,155`), so with three sites there are three duplicate ids and the nav only ever reaches the first.
- **Sev 3. Cluster switcher lets users wander into documents their plan cannot generate**, then returns a 403 text error (`lib/documents/guard.ts:84-95`).

### H6. Recognition rather than recall
- **Sev 3. No address autocomplete.** `AddressInput.tsx` is a plain text field with a fixed placeholder (`AddressInput.tsx:33`). Disambiguation is pushed to after submit. Every best-in-class geo product (Google Maps, Zillow, Placer.ai search) resolves while you type.
- **Sev 2. No recents.** The address box never offers your last five addresses even though `/api/verdicts` already returns them for history.

### H7. Flexibility and efficiency of use
- **Sev 3. No keyboard surface, no command palette, no deep links.** The dashboard is a single client SPA at `/dashboard`; the active cluster and subject address are React state (`DashboardShell.tsx:31`). A broker cannot bookmark or share "175 3rd St, transaction view". A refresh loses the run.
- **Sev 2. No batch entry for Portfolio.** Assets are added one address at a time (`PortfolioOverview.tsx:99-121`). An institution with 200 assets will not type 200 addresses.

### H8. Aesthetic and minimalist design
- **Sev 3. Maps take the hero slot without earning it.** Development: a 1,090x430 map whose only content is two pins 15km apart (development.png). Portfolio: a full-width map with one dashed pin (portfolio.png). The map is orientation, not the answer. The answer (rank, verdict, why) is pushed below.
- **Sev 3. Every verdict renders the full evidence stack inline.** Per site in Development: VerdictCard, VerdictMathPanel, SitePanels, ReasoningChain, CoverageMap, ProvenanceLedger, two DocumentButtons (`SiteComparison.tsx:468-510`). Three sites produce an extremely long scroll with near-identical blocks. Evidence should be one click away, not always expanded.
- **Sev 2. Market Velocity grid leaves an orphan card** (Employment alone on row two, transaction.png), and labels like "RECORDED SALES VELOCITY 12.8 sales/mo · not absorption / months-of-supply" explain what the figure is not rather than what it means.

### H9. Help users recognize, diagnose, recover from errors
- **Sev 4. Document paywall surfaces as a plain red sentence.** `DocumentButton.tsx:71-75` throws the JSON error into a text line. It never calls `openUpgrade`, even though the guard returns `upgrade_required: true` (`lib/documents/guard.ts:72-81`). This is the moment of peak intent (user wants the PDF) and the product answers with an error string.
- **Sev 3. "Build from my last analysis" is disabled after an analysis in Transaction.** `client_neighborhood_report` is mounted without `hasRecentVerdict` (`Cluster2Dashboard.tsx:220-226`), so the reuse option shows "Run an analysis first to enable" right after the user ran one, and the default becomes "Fresh", which spends a generation.
- **Sev 2. Generic fallbacks.** "Live NYC data is deepest. Try a New York City street address." is appended to every failure, including non-geographic ones (`Cluster1Dashboard.tsx:192-194`, `Cluster2Dashboard.tsx:289-291`).

### H10. Help and documentation
- **Sev 2. No first-run guidance.** The empty state is a heading and a paragraph (`Cluster1Dashboard.tsx:148-161`). No sample address, no "see a finished example", no explanation of what HOLD at confidence 80 means for the persona. The marketing site has a real recorded verdict (`src/components/marketing/exampleVerdict.ts`) that the dashboard never uses.

---

## 2. Cognitive walkthroughs

For each step: will the user know what to do, see the control, connect it to their goal, and understand the feedback?

### Walkthrough A: new visitor to first verdict (persona: development associate, NYC)

| # | Step | Evidence | Pass/Fail | Problem |
|---|---|---|---|---|
| 1 | Lands on `/` | desktop_.png | Partial | Hero card shows five agent rows with verdict chips rendered blurred/translucent over a render (HOLD/BUY/HOLD/HOLD/WAIT barely legible). The single most persuasive object, a real verdict, is decoration. No address field on the homepage (`HeroSection.tsx:162-165` offers only Sign up and See how it works). |
| 2 | Scrolls | desktop_.png chunks 1 to 3 | Fail (capture) | Below the hero the full-page capture is blank grid and wash for roughly 6,000px. Most likely framer-motion `whileInView` reveals that never fire in a headless full-page screenshot, so this may not be what a scrolling human sees. It is still what crawlers, link-preview bots and reduced-JS clients risk seeing. Flag for the design engineer; not counted as a confirmed defect. |
| 3 | Clicks Sign up | desktop_signup.png | Pass | Clean Clerk form. Footer says "The free plan includes a limited number of analyses", which is vaguer than pricing's "three analyses and three generated documents". |
| 4 | Redirect to `/onboarding` | `signup/[[...rest]]/page.tsx:18`, `OnboardingClusters.tsx` | Partial | "Which of these is your work?" is good copy. But the card order is Property (01), Transaction (02), Development (04), Portfolio (05), the opposite of positioning order (developers first). Cards show "From 19 / month" with no currency, and the eyebrow "04" for developers contradicts "C1" on the marketing page the user just left. |
| 5 | Lands on Development dashboard | development.png (empty variant from code) | Partial | Three inputs, Site A placeholder "175 3rd Street, Brooklyn, NY". Nothing says "try one site first" or that three sites spend three of three free runs. |
| 6 | Enters 1 to 3 addresses, Run comparison | `SiteComparison.tsx:117-156` | Partial | If ambiguous, the candidate picker appears one slot at a time. Labels are geocoder names, no map thumbnail. |
| 7 | Waits 1 to 3 minutes | `SiteComparison.tsx:297-327` | Partial | Per-site LoadingState cards are real and honest, a strength. But no ranking until all finish. |
| 8 | Sees result | development.png | Partial | First thing in view is a map of two pins. The table with BUY/79/50 sits at the very bottom of the viewport at 1440px. "Why is #1 first?" requires knowing the formula `verdict weight x 100 + confidence - risk` (`SiteComparison.tsx:40-41`), which is shown only as a sentence. |

Time to first verdict: about 4 to 6 minutes from landing, of which 1 to 3 are agent runtime. Steps with a fail or partial: 7 of 8.

### Walkthrough B: first verdict to first document (persona: agent, Transaction)

| # | Step | Evidence | Pass/Fail | Problem |
|---|---|---|---|---|
| 1 | Runs an address in Transaction | transaction.png | Partial | Market velocity tiles appear first. Verdict is at the bottom (`Cluster2Dashboard.tsx:296`). |
| 2 | Looks for the CMA (the thing the pricing page promises: "Comparative Market Analysis, as PDF and editable Word", `PricingContent.tsx:61`) | `Cluster2Dashboard.tsx:243-262` | **Fail** | A disabled tile: "Not yet available. The CMA needs listing photos and geocoded comps, which KOANO does not source today." Meanwhile `cma` is `status: 'available'` in `lib/documents/registry.ts:111-127`, listed in `IMPLEMENTED_DOC_TYPES` (`lib/documents/implemented.ts`), and handled by `src/app/api/documents/route.ts:473`. The product sells it, builds it, and tells the user it does not exist. |
| 3 | Clicks "Generate PDF" on Client Neighborhood Report | `DocumentButton.tsx:131-167` | Partial | Must first parse a two-radio "Build from my last analysis / Fresh" choice; the reuse option is disabled with "Run an analysis first to enable" (H9). |
| 4 | Free user submits | `lib/documents/guard.ts:68-81` | **Fail** | 402 "Generating documents requires a paid plan." Shown as red text (`DocumentButton.tsx:229-240`), no modal, no plan suggestion, no preview of the document they would get. |
| 5 | Paid user gets the file | `DocumentButton.tsx:76-89` | Pass | Silent download, "Downloaded." No preview, no "send to client", no record in the UI of documents generated. |

The free path to a first document does not exist, despite the pricing page and FAQ promising three free documents (`PricingContent.tsx:208-209, 484`).

### Walkthrough C: free to paid

| # | Step | Evidence | Pass/Fail | Problem |
|---|---|---|---|---|
| 1 | Fourth verdict attempt | `useVerdictStream.ts:137-138` | Pass | 402 opens `UpgradeScreen`. |
| 2 | Reads modal | `UpgradeScreen.tsx:103-169` | Partial | "You've used all 3 free verdict runs." Four equal cards with eyebrow 01/02/04/05, taglines, "From 19 / month". The user's home cluster is not preselected or highlighted. Nothing shows what was gained in the three free runs (no "your 3 verdicts" recap), nothing previews what the paid plan unlocks for the job they were doing. |
| 3 | Footer | `UpgradeScreen.tsx:193-195` | Fail (trust) | "Secure checkout by Stripe · test mode" is user-visible. Production cannot take money (`brief: Stripe test mode`). |
| 4 | Selects tier, Stripe checkout | `UpgradeScreen.tsx:40-57` | Pass | Straight redirect. |
| 5 | Returns to `/dashboard?upgraded=1` | `UpgradeProvider.tsx:40-170` | Pass | Polling overlay is well considered (timeout path, honest copy). |
| 6 | Portfolio "Contact sales" on pricing | `PricingContent.tsx:422-428` | Fail | The enterprise CTA links to `/signup`, the same as everyone else. A $1,499 to $4,999 buyer gets a self-serve Clerk form. |
| 7 | Document paywall path | Walkthrough B step 4 | Fail | The second, more valuable, upgrade trigger (documents) has no upgrade UI. |

---

## 3. Personas, jobs to be done, and whether each dashboard serves the job

### Cluster 1 (Community, `cluster_1`, $19): "Dana, the Park Slope co-op owner"
- **Who:** owns one unit or a small building, 40s, not a professional, checks Zillow monthly, anxious about a tax bill, a construction site next door, or a landlord's violations if a renter.
- **Main job:** "When my tax assessment arrives or something changes on my block, help me understand whether my property is threatened or mis-valued, and give me something official I can act with."
- **Sub-jobs:** (1) Is the assessed value fair? (2) What is being built or permitted around me? (3) Who owns my building and are they a bad actor? (4) Tell me when something changes. (5) Hand the city or my board a credible packet.
- **What the dashboard does:** map first, then a HOLD/BUY verdict with investment vocabulary ("confidence-weighted score of -0.19 clears the hold threshold", community.png), then valuation, permits, violations, ownership, alerts, then four documents.
- **Judgment: displays data.** "HOLD" is an investor verb that answers a question Dana did not ask. Her highest-value job (tax appeal) is the fourth document tile, below the fold, behind a paywall that the UI does not explain. Her recurring job (tell me when something changes) cannot be started from her cluster: the only control that adds a property to monitoring is in Portfolio (`PortfolioOverview.tsx:121`, the sole caller of `POST /api/properties`). Alerts here are explicitly "point-in-time signals, not continuous monitoring" (`AlertsPanel.tsx:6-7`).

### Cluster 2 (Transaction, `cluster_2`, $149): "Marcus, the Brooklyn listing agent"
- **Who:** independent or brokerage agent, 8 to 15 listings a year, lives in his phone, competes on looking smarter than the other agent at the listing appointment.
- **Main job:** "Before a listing appointment, give me a defensible price range and a client-ready story in my branding that wins the listing."
- **Sub-jobs:** (1) Price range with comps. (2) A neighborhood narrative he can paste. (3) A branded CMA PDF and editable Word. (4) Net sheet. (5) Early signals that make him look prescient.
- **What the dashboard does:** six market-velocity tiles, comps map, CMA builder panel, scatter, pricing panel, permit trend, narrative generator, documents (with CMA disabled), then the verdict.
- **Judgment: displays data, and actively contradicts the sale.** The price recommendation (the actual answer to job 1) is the fifth panel. The CMA (job 3) is falsely marked unavailable. The letterhead that white-labels documents lives on a separate settings page that the transaction flow never prompts for (`src/app/dashboard/settings/page.tsx`, `ProfileSettingsForm.tsx`). The whole view is desktop-only (no media queries) for the most mobile persona in the product.

### Cluster 4 (Development, `cluster_4`, $499): "Priya, acquisitions associate at a 30-person NYC developer"
- **Who:** screens 20 to 50 sites a month, reports to a principal on Monday, lives in Excel, ZoLa, PLUTO, ACRIS and Placer-style tools.
- **Main job:** "Tell me which of these sites deserves a site visit and a call to the broker this week, and why, in a memo my principal will read."
- **Sub-jobs:** (1) Kill bad sites fast. (2) As-of-right envelope and entitlement risk. (3) Rank a shortlist. (4) Produce the screening memo / comparison brief. (5) Watch shortlisted sites for permits, sales, rezonings.
- **What the dashboard does:** three inputs, a map of pins, a ranking table, a small-multiples verdict-math strip, then three full evidence stacks, then documents, then a monitoring feed that she has no way to populate from this view.
- **Judgment: partially serves the job.** The ranking table and the verdict-math strip are the best decision surface in the product. But: the cap of 3 sites is a demo cap, not a screening workflow (she screens 50); the map leads; the entitlement and as-of-right figures (the reason she would pay) are buried in per-site `SitePanels`; the Pro forma nav item points at a blocked document (`registry.ts:200-216`, `status: 'blocked'`); and "watch this site" does not exist here.

### Cluster 5 (Portfolio, `cluster_5`, $1,499): "Robert, VP asset management at a $2B multifamily owner"
- **Who:** 80 to 400 assets, reports to an IC and LPs, uses Yardi/MRI, Argus, CoStar, an analyst team. Will judge KOANO in under three minutes in a demo.
- **Main job:** "Every Monday, tell me which of my assets changed risk and why, before my IC asks, and give me the memo."
- **Sub-jobs:** (1) Load the book. (2) See risk concentration. (3) What changed this week. (4) Drill into one asset. (5) IC memo and portfolio risk report.
- **What the dashboard does:** a full-width map (one dashed pin in the screenshot), a one-row table, a "Generate briefing" button, a monitoring feed, documents (briefing PDF and one-pager only), risk monitor, archive trend, history.
- **Judgment: displays data.** The question "what changed this week" is answered by the monitoring feed, which is the sixth block. The IC memo and Portfolio Risk Report, the two documents an institution actually circulates, are implemented (`registry.ts:288-357`, `route.ts:355,399`) and absent from the UI. Assets are added one at a time with no CSV import. The portfolio screenshot shows 175 3rd Street with a resolved BBL but a dashed "Location unverified" pin (`PortfolioMap.tsx:88-94`), which reads to an institutional buyer as "this tool is not sure where my building is".

---

## 4. Information architecture critique

**Navigation.** The sidebar mixes three kinds of items: in-page anchors (`Sidebar.tsx:119-151`), a route change (Settings, `Sidebar.tsx:154-167`), and an identity control (Clerk UserButton). Anchors that point at unmounted sections are dead in the empty state (H5). There is no global object model: no "Properties", "Documents", "Watchlist" as first-class places. Everything is a section of a cluster page. Recommendation: objects as nav (Home, Properties, Compare, Watchlist, Documents, History), clusters as lenses.

**Cluster switching.** The switcher is a native `<select>` labelled "Cluster view" (`Sidebar.tsx:77-100`) showing `badge` while page eyebrows show `number`. The "Viewing C1. Your home cluster is C2." note (development.png, `Sidebar.tsx:104-116`) tells the user something about our database, not about their work. Switching also resets all state (`key={cluster}` on Sidebar and a full component swap in `DashboardShell.tsx:47,65-75`), so a user who ran an address in Community and switches to Transaction to see the agent view loses the run and must spend another verdict. Fix: one subject, many lenses. The subject (address or portfolio) persists; the lens changes what is foregrounded. Kill the badge/number split in UI copy entirely; use plain names (Development, Transaction, Portfolio, Property).

**Address entry.** Plain text, no autocomplete, no recents, no "paste a list", no BBL or lot entry for developers who think in BBLs (`AddressInput.tsx`). Development uses a separate three-field form with its own resolve logic (`SiteComparison.tsx:117-156`) that does not reuse `useAddressResolver` and does not check `isUpgradeRequired` on resolve.

**Candidate picker.** Conceptually excellent (asks instead of guessing, and the server re-derives the BBL, `CandidatePicker.tsx:3-9`). Presentation is a text list. It needs a mini map with both lots outlined, the lot's building class and year built, and a cancel. "Proposed by NYC Geoclient" is provenance; "Best match" with a lot thumbnail is UX. Keep both.

**Verdict history.** Global across clusters, filter by address only, 50 rows, no reopen (`VerdictHistory.tsx:34, 66-71`). History should be the user's library: reopen in any lens, compare two runs of the same address over time (this is where the longitudinal archive becomes visible), generate a document from any row.

**Documents.** Twelve doc types are wired to buttons; fifteen are implemented. Missing from UI: `cma`, `ic_memo`, `portfolio_risk_report` (`grep docType=` across `src` versus `lib/documents/implemented.ts`). There is no documents library (what did I generate, for whom, when), no preview, no share link. The `KOANO_CV_AUDIT.md` claims "15 client-ready document types" shipped; three of those are unreachable by a user.

**Monitoring.** Settings lives on a separate route (`src/app/dashboard/settings/page.tsx:44-46`). Watching can only begin by adding a property in Portfolio. Community ($19, "monitoring on up to 3 buildings"), Transaction (20) and Development (50) have no Watch button on their verdicts. The `MonitoringFeed` is rendered in Development (`SiteComparison.tsx:549`) with no way to feed it.

**Settings.** Letterhead (name, company, license, logo) is the white-label CMA's raw material and sits on an unlinked standalone page. It should be requested inline the first time a user generates a client-facing document ("Add your logo so this goes out under your name").

**Upgrade flow.** Two triggers exist in the guard (verdict 402, document 402/403). Only the first opens the modal. The modal is plan-agnostic and does not use the home cluster. It exposes "test mode". Enterprise "Contact sales" routes to self-serve signup.

---

## 5. Activation: the aha, and the first five minutes redesigned

**Today's time to aha:** 4 to 6 minutes to a first verdict for a determined user, and the verdict that arrives is not framed as an aha. For Transaction users the verdict can be below a 4,000px scroll. For free users, the document (the thing they would show a colleague) never arrives.

**What the aha should be (one sentence per persona, same underlying moment):** "KOANO told me something specific and true about a property I know, showed me exactly why, and handed me a document I would actually send."

- Priya: "It ranked my three sites, the ranking matches my gut on two and surprised me on one, and the reason it gave (97% unused FAR on the site I underrated) checks out in ZoLa."
- Marcus: "It produced a price range I can defend and a branded PDF I can send tonight."
- Robert: "It flagged that one of my buildings picked up two Class C violations and a new neighboring permit this week, with links to the city records."
- Dana: "It found the comparable sales the assessor ignored and built the appeal packet."

The aha is **specific true insight + visible reasoning + a deliverable**. KOANO is uniquely able to do all three. Today it delivers the first, buries the second, and blocks the third.

**Redesigned first five minutes**

```
0:00  Landing (/)
      Hero contains a live address box, not just "Sign up".
      Typing shows autocomplete. Submitting before signup shows a
      PRE-RECORDED real verdict for 175 3rd St (exampleVerdict.ts)
      if the address matches, otherwise a signup wall with the
      resolved lot outlined on a map: "We found it. Create an
      account to run five agents on BBL 3-00972-0058."

0:30  Signup (Clerk, Google one-tap). Role question folded into
      signup: "What do you do?" 4 chips. No separate onboarding page.

0:45  Dashboard opens ON THE ADDRESS THEY TYPED, in their lens,
      already running. If none, opens a finished sample verdict
      (labelled "Example: recorded Aug 26, 2026") with a single
      prompt: "Now try one you know."

0:45 to 2:15  The run is the show. Full-width agent rail at top:
      five agents land one by one with their band and top
      evidence line. Fast blocks (zoning, permits, flood) fill
      the right column within seconds. Usage meter visible:
      "Free: 2 of 3 runs left."

2:15  Verdict lands in the hero slot. One persona-specific
      sentence above the number ("Strong as-of-right upside,
      entitlement risk moderate"). "Why" chips under it open the
      math. Provenance summary inline: "31 live, 2 representative,
      4 not covered".

2:30  Primary CTA is the persona's document, previewed as a
      thumbnail with the first page rendered (watermarked
      "Preview" for free). One click on a free account opens the
      upgrade sheet pre-selected to their tier, showing the
      document they are buying. Secondary CTA: "Watch this
      property" (shows what weekly alerts look like).

3:00  Second run, prompted: "Compare it with another site" (dev),
      "Price a second listing" (agent), "Add 5 more assets or
      import CSV" (portfolio), "Check your tax assessment" (community).

5:00  Ends with something saved: a watched property or a
      generated document. That is the activation event to measure.
```

Activation metric to instrument: **first document generated or first property watched within 24 hours of signup**. Today neither is possible for a free user (documents tier-gated; watching only from Portfolio, and monitoring cap for free is 0, `koano-guard.ts:49-50`). The free tier definition needs a product decision: either honor the "three generated documents" promise (watermarked preview is the honest middle) or change the pricing copy. Provenance and determinism are untouched either way.

---

## 6. Benchmark

### 6.1 Diald AI (what is publicly visible)

What I could verify from Diald's own pages:
- Homepage headline "Every site has a story."; a three-step flow "01 Capture: Start with an address. 02 Analyze: 19 agents read the market. 03 Decide: Your assumptions, stress-tested." A Capture mockup shows "350 Fifth Avenue, New York" with plan tags ("Underwriting", "5-yr hold", "Light reno") and a caption that you type the property and plan in plain language. Two score cards: "Neighborhood Investment Rating: A" and "Diald Confidence Score: 82%" (https://diald.ai).
- The score page explains two layers: a letter-grade location rating (A/B/C) and a percentage "confidence that the projected exit cap rate will be achieved", which "recalculates live when the exit cap rate or hold period changes", with bands 85%+, 75 to 85, 60 to 75, below 60, a confidence gauge, and a hoverable agent network (https://diald.ai/score).
- Product page: Diald Memo synthesized from 19 agents and "1.7M+ sources", comps and pro forma inside the memo, property and portfolio monitoring with bi-weekly summaries on the 1st and 16th, folder sharing by email (https://diald.ai/product).
- Pricing: Pilot $0 (review shared analyses only, "No deal underwriting included"), Plus $20/month (1 deal per month, monitor 1 property, PDF generation), Pro $100/month for 6 deals or $200 for 12 (https://diald.ai/pricing).
- The sample analysis and the demo are gated or did not render for me: /sample requires an account, /demo shows only headings (https://diald.ai/sample, https://diald.ai/demo).
- Secondary coverage: $3.75M early-stage funding reported by Commercial Observer in December 2025, with named clients The Max Collaborative and Way Capital (https://commercialobserver.com/2025/12/diald-ai-early-stage-funding/). Search snippets reference an August 10, 2026 Business Wire release about a "conversational AI underwriting platform"; I could not open the release itself (429), so treat those details as unverified.

**I could not see Diald's actual dashboard.** No public screenshots of the signed-in product beyond the capture mockup and score cards. Any claim that KOANO's dashboard is better or worse than Diald's dashboard is unverified. What can be compared is the product framing.

**Where Diald's framing is ahead of KOANO's UI:**
1. **Intent capture before analysis.** Diald asks for the plan (hold, scope) in natural language at step one. KOANO asks only for an address, then gives every persona the same verdict.
2. **A score with a stated meaning.** "82%: confidence the exit cap is achieved" is a sentence a principal understands. KOANO's "Confidence 80/100" (community.png) does not say confidence in what.
3. **Assumption-reactive output.** Diald recalculates when the user changes hold period or exit cap. KOANO's verdict is static per run; the user cannot ask "what if I hold 3 years".
4. **The memo is the product.** Diald sells "address to investment memo". KOANO's memo-equivalents are tiles at the bottom.
5. **Sharing.** Diald's free tier is literally "review what was shared with you", a built-in viral loop. KOANO has no share primitive.

**Where KOANO is structurally ahead (and the UI must make it obvious):**
1. **Deterministic, replayable verdict math.** Diald does not publicly claim reproducibility. KOANO can show the arithmetic (`VerdictMathPanel`) and prove byte-identical replay.
2. **Per-figure provenance with five states and a coverage map.** Diald's public pages talk about "1.7M+ sources" as volume; KOANO can show which source fed which figure, and what is missing.
3. **Immutable verdict record.** A history users can audit later, and the start of a calibration record.
4. **Deep NYC public-record joins** (HPD, DOB, PLUTO, DOF) that feed concrete, checkable facts.

The way to beat Diald on dashboards: **make the reasoning the interface**, rather than adding charts. Diald shows a score; KOANO should show a score that you can open like a spreadsheet cell and trace to the city record.

### 6.2 Best-in-class dashboards (only what I can stand behind)

- **Felt** (verified on https://felt.com): "Charts and filters on the map, no code"; "Ask Felt AI a question in plain language and get the answer as a map"; "Clients and colleagues view and comment without a seat". Lesson: the map is a canvas you query and share, not a header image. KOANO's maps are static orientation panels.
- **Placer.ai** (verified on https://www.placer.ai/): property, chain and industry reports, custom reports on the platform, foot-traffic trends for any property, a free trial of the dashboard. Lesson: one object (a place) with many report lenses, which is exactly the cluster-as-lens model recommended here.
- **Cherre** (verified on https://cherre.com/): positions as connected real estate data plus an "Agent STUDIO" and "AI Agents" marketplace. Lesson: institutions buy connected data plus agents; KOANO's "reasoning layer" positioning should show the joins in the UI (lot, owner, permits, violations linked), not separate panels.
- **Linear, Stripe, Bloomberg** (from long professional familiarity, not re-verified this session, so stated only at the level of widely known patterns): Linear's command menu and keyboard-first navigation; Stripe's object pages where every entity has a URL, a timeline, and a related-objects rail, plus a visible test/live mode toggle that is a dev affordance and never leaks into customer checkout copy; Bloomberg's dense, monospaced, change-highlighted tables where the delta is the content. KOANO needs all three: URLs per subject, a timeline per property, and deltas as the primary encoding in Portfolio.

---

## 7. The redesign: the dashboard as the undisputed centerpiece

### 7.1 Principles
1. **One subject, one URL, many lenses.** `/p/{bbl}?lens=development`. The subject persists across lens switches. The four clusters become lenses (and pricing tiers), not separate apps.
2. **The verdict owns the top 40% of the viewport, always, in the same place.** Everything else is evidence beneath it.
3. **Reasoning is the interface.** Every number in the verdict band is clickable and opens its derivation and its source row in the ledger.
4. **Evidence collapsed by default, one click deep.** Ledger, coverage map, reasoning chain become a right-hand drawer, not three inline blocks.
5. **The deliverable is the primary CTA.** A rendered first-page thumbnail of the persona's main document sits next to the verdict.
6. **Watch is a verb on every subject.**
7. **Provenance stays loud.** Representative and absent data keep their badges and hatching; the redesign only moves them to where the eye already is.

### 7.2 Shared shell (all clusters)

```
+------------------------------------------------------------------------------------------------+
| [KOANO logo, original blue]  [ Search address, BBL, or paste a list...   (cmd-K) ]  [Free 2/3] |
|                                                                   [Watchlist 4] [Docs] [Avatar]|
+-----------+------------------------------------------------------------------------------------+
| LENS      |  (A) SUBJECT HEADER: 175 3rd St, Brooklyn  BBL 3-00972-0058  M1-2/R6A  [Watch][Share] |
| Develop.  |------------------------------------------------------------------------------------|
| Transact. |  (B) VERDICT BAND  (fixed height, same position in every lens)                     |
| Portfolio |------------------------------------------------------------------------------------|
| Property  |  (C) LENS WORKSPACE (persona-specific)            | (D) EVIDENCE DRAWER (toggle)   |
|-----------|                                                   |  Math | Reasoning | Sources |  |
| Properties|                                                   |  Coverage                      |
| Compare   |                                                   |                                |
| Watchlist |                                                   |                                |
| Documents |                                                   |                                |
| History   |                                                   |                                |
| Settings  |                                                   |                                |
+-----------+------------------------------------------------------------------------------------+
Annotations
 1 Lens switcher replaces the <select> in Sidebar.tsx:77-100. Plain names, no C1/04 numerals.
   "Your plan: Development" shown as a small tag, not "home cluster".
 2 Global search replaces per-cluster AddressInput. Autocomplete + recents (from /api/verdicts)
   + BBL entry + paste-many. Resolution and CandidatePicker live in the search dropdown.
 3 Usage meter "Free 2/3" always visible; turns into "Development: 142/150 today" when paid.
 4 Subject header persists across lenses; switching lens never re-runs or loses state.
 5 Evidence drawer hosts VerdictMathPanel, ReasoningChain, ProvenanceLedger, CoverageMap,
   collapsed by default, deep-linkable (#math, #sources).
```

### 7.3 Development lens (desktop, 1440px)

```
+--------------------------------------------------------------------------------------------------+
| COMPARE  3 sites  [+ add site]  [paste list]          sorted by: Opportunity v   [Brief PDF ->] |
+--------------------------------------------------------------------------------------------------+
|  #1 1800 Park Ave, Manhattan     |  #2 175 3rd St, Brooklyn        |  #3 (running 3/5 agents)     |
|  BUY   conf 79  risk 50          |  BUY   conf 68  risk 51         |  [agent rail animating]      |
|  [====== opportunity 229 =====]  |  [===== opportunity 217 ===]    |  rank pending, not blocking  |
|  Why #1: +11 confidence          |  Why #2: entitlement risk 63    |                              |
|  Envelope: 97% FAR unused  LIVE  |  Envelope: 41% FAR unused LIVE  |                              |
|  Entitlement risk 47  LIVE       |  Entitlement risk 63  LIVE      |                              |
|  OZ tract: yes  LIVE             |  OZ tract: no   LIVE            |                              |
|  Pro forma: REPRESENTATIVE //// |  Pro forma: REPRESENTATIVE ////|                              |
|  [Screening memo] [Watch]        |  [Screening memo] [Watch]       |                              |
+--------------------------------------------------------------------------------------------------+
|  DIFFERENCES THAT DECIDED THE RANK (deterministic, from SiteMathStrip)                           |
|  Agent           Site 1      Site 2      Delta                                                    |
|  Regulatory      BUY .82     HOLD .74    <- largest swing          [open math]                    |
|  Infrastructure  BUY .80     BUY .82                                                              |
|  ...                                                                                              |
+-----------------------------------------------------+--------------------------------------------+
|  MAP (secondary, 40% width): lot polygons, zoning,  |  SHORTLIST WATCH: permits, sales, rezoning |
|  OZ shading, 500m permit halo; click lot = select   |  on watched sites this week (MonitoringFeed)|
+-----------------------------------------------------+--------------------------------------------+
Annotations
 1 Columns rank progressively: each site card fills as its stream completes. Removes the
   "Complete. Waiting for the other sites" block (SiteComparison.tsx:338).
 2 "Why #N" is generated deterministically from opportunityScore components
   (SiteComparison.tsx:40-41), not by the LLM.
 3 "Differences that decided the rank" is SiteMathStrip promoted and pivoted to show deltas.
 4 Entitlement and envelope (SitePanels.tsx:52,155) move into the card; duplicate DOM ids go away.
 5 Map demoted to evidence. MultiSiteMap stays, at 40% width, below the decision.
 6 Pre-run warning on free: "Comparing 3 sites uses 3 of your 3 free runs. Run 1 site first?"
 7 VISION: 50-site batch screen with a kill-list table (requires raising run limits and cost).
```

### 7.4 Transaction lens

```
+--------------------------------------------------------------------------------------------------+
| 425 6th St, Brooklyn 11215   2-fam, 2,150 sf, built 1899   [Watch] [Share] [Letterhead: set ✓]   |
+--------------------------------------------------------------------------------------------------+
| SUGGESTED LIST RANGE                 | MARKET TIMING (verdict)       | YOUR CLIENT DOCUMENTS       |
| $2.48M  to  $2.71M                   | HOLD  conf 74  window 12 mo   | [CMA thumbnail p.1]         |
| from 10 recorded sales, median       | "Prices rising 5.7% yoy;      |  CMA  PDF | DOCX  [Generate]|
| $1,231/sf  LIVE (DOF)                |  mortgage demand +2.1%"       | [Pricing sheet] [Net sheet] |
| band rule shown [open math]          | [why]                         | [Neighborhood report]       |
+--------------------------------------+-------------------------------+-----------------------------+
| COMPS  (table left, map right, linked hover)                                                     |
| Address        Sold      $/sf    Dist   Prov     |   [map: subject + 10 comps colored by $/sf]   |
| 412 5th St     Jun 26    $1,310  0.2mi  LIVE     |                                              |
| ...  [include/exclude checkbox per comp -> recomputes range deterministically]                  |
+--------------------------------------------------------------------------------------------------+
| EARLY SIGNALS (live)  3 new permits within 500m · 1 ownership change · HMDA denials 31.9%        |
+--------------------------------------------------------------------------------------------------+
| VELOCITY STRIP (compact sparkline row): FHFA 5.7% | DOF sales 154 | $/sf $1,231 | QCEW -5%      |
+--------------------------------------------------------------------------------------------------+
Annotations
 1 Price range is the hero for this persona (PricingPanel.tsx promoted). Verdict sits beside it as
   timing context, in the fixed verdict band position.
 2 CMA tile re-enabled: remove the "Not yet available" block (Cluster2Dashboard.tsx:243-262),
   mount DocumentButton docType="cma" formats=["pdf","docx"]. If listing photos are absent,
   the CMA states so in the document; provenance rules already cover this.
 3 First CMA generate with empty letterhead opens an inline letterhead sheet
   (ProfileSettingsForm fields) instead of sending the user to /dashboard/settings.
 4 Comp include/exclude is the agent's real workflow; recomputation is deterministic.
 5 Six velocity tiles (MarketVelocityPanel) collapse to one strip; fixes the orphan card.
 6 Verdict LoadingState moves into the verdict band (top), not after the documents.
```

### 7.5 Portfolio lens

```
+--------------------------------------------------------------------------------------------------+
| PORTFOLIO  84 assets  [Import CSV / paste BBLs]  [Add]           Week of Oct 19   [IC memo v]    |
+--------------------------------------------------------------------------------------------------+
| THIS WEEK                                                                                        |
|  3 assets changed risk band   |  7 new material events   |  2 verdicts flipped  | 1 data gap   |
|  [list]                       |  [list]                  |  HOLD->WAIT (2)      | HPD fetch    |
|                               |                          |                      | failed  ⚠    |
+--------------------------------------------------------------------------------------------------+
| ASSETS  (dense table, Bloomberg-style, deltas first)                                             |
| Asset            Verdict   Δ wk   Risk  Δ   Conf  Prov    Last event                  Actions   |
| 175 3rd St       BUY 68    =      51   +4   68    LIVE    New DOB permit adj. lot     [1-pager] |
| 88 Pierrepont    HOLD 71   BUY->  44   -2   71    PART.   Class C violation x2         [IC memo] |
| ... sortable, filterable, multi-select -> [Portfolio risk report]                               |
+-----------------------------------------------+--------------------------------------------------+
| RISK CONCENTRATION MAP (pins by risk band,    | ARCHIVE TREND: risk over time for selection     |
| clusters at zoom-out; dashed = unverified     | (ArchiveTrend.tsx, from the longitudinal archive)|
| location, with tooltip saying why)            |                                                  |
+-----------------------------------------------+--------------------------------------------------+
Annotations
 1 "This week" (MonitoringFeed + RiskMonitor) becomes the hero. The map moves from first
   (Cluster5Dashboard.tsx:121) to supporting evidence.
 2 Deltas are the primary encoding. The verdict band per asset opens in the drawer, not inline.
 3 Mount DocumentButton for ic_memo (pdf, docx) per asset and portfolio_risk_report for
   selection. Both are implemented server-side today and unreachable.
 4 CSV/BBL paste import. VISION: Yardi/MRI rent roll connectors.
 5 Data gaps are a first-class tile: provenance failures are news for an institution.
 6 Fix the "Location unverified" read: when a BBL is resolved but not cross-checked, say exactly
   that in the tooltip; consider a lighter treatment than a dashed warning pin.
 7 "Contact sales" on /pricing goes to a real form or calendar, not /signup.
```

### 7.6 Property lens (Community)

```
+--------------------------------------------------------------------------------------------------+
| 1150 E 21st St, Brooklyn 11210   1-fam, R2   Owner: on record   [Watch this home] [Share]        |
+--------------------------------------------------------------------------------------------------+
| WHAT KOANO FOUND (plain language, deterministic from data)                                       |
|  ✓ No open HPD violations             LIVE                                                       |
|  ! 3 permits filed within 500 ft in 90 days (largest: 6-story new building)   LIVE               |
|  ! Assessed value is above 7 of 10 nearby recorded sales per sf   LIVE (DOF) + REPR (comps ////) |
|  ✓ Flood zone X, very low             LIVE (FEMA)                                                |
+--------------------------------------------+-----------------------------------------------------+
| WHAT YOU CAN DO                            | INVESTOR VIEW (collapsed)                           |
| [Tax appeal packet: preview p.1] Generate  |  HOLD  conf 80  risk 50  window 12 mo  [open]       |
| [Permit history report]                    |  Kept for those who want it; not the headline.      |
| [Violation & ownership record]             |                                                     |
+--------------------------------------------+-----------------------------------------------------+
| MAP: your lot, neighboring permits, EPA sites, comps (PropertyMap.tsx)                           |
+--------------------------------------------------------------------------------------------------+
Annotations
 1 The verdict stays (determinism and provenance unchanged) but the band shows a persona sentence
   first; HOLD/BUY lives in the "Investor view" for this lens only. VerdictCard gets a lens prop.
 2 Findings list is AlertsPanel (deriveAlerts) promoted and rewritten as plain sentences.
 3 "Watch this home" calls the same POST /api/properties path Portfolio uses, then
   PATCH /api/monitoring. Free users see what alerts would look like, and the upgrade sheet.
 4 Tax appeal packet is the primary CTA when assessed value looks high (deterministic rule).
```

### 7.7 Mobile (390px), Transaction lens

```
+------------------------------+
| KOANO      [search]   [≡]    |
+------------------------------+
| 425 6th St, Brooklyn         |
| [Watch] [Share]              |
+------------------------------+
| LIST RANGE                   |
| $2.48M to $2.71M             |
| 10 sales · $1,231/sf · LIVE  |
| [why]                        |
+------------------------------+
| TIMING  HOLD · conf 74       |
| window 12 mo         [math]  |
+------------------------------+
| [ Generate CMA  PDF ]        |  <- sticky bottom bar on scroll
| [ Send to client ]           |
+------------------------------+
| Comps (swipe cards)          |
| 412 5th St  $1,310/sf  LIVE  |
| < 1 / 10 >                   |
+------------------------------+
| Early signals (3)        >   |
| Velocity             >       |
| Sources & coverage   >       |
+------------------------------+
| [Home][Search][Watch][Docs]  |  <- bottom tab bar replaces sidebar
+------------------------------+
Annotations
 1 Today the dashboard has no media queries: Sidebar is position fixed, 240px
   (Sidebar.tsx:29-43) and main has marginLeft 240px (DashboardShell.tsx:57-63), leaving
   ~150px of content at 390px. This wireframe requires a responsive shell.
 2 Evidence sections become drill-in rows; provenance badges remain on every figure.
```

### 7.8 Files to change (grounded, no new data required)

| Change | Files | State today |
|---|---|---|
| Responsive shell, URL-addressable subject and lens, persistent subject across lens switch | `src/components/dashboard/DashboardShell.tsx`, `Sidebar.tsx`, `src/app/dashboard/page.tsx` (add `[bbl]` route or search params) | MISSING |
| Remove C-badge and number numerals from UI; plain lens names | `src/components/dashboard/clusters.ts` (UI labels), `OnboardingClusters.tsx:160`, `UpgradeScreen.tsx:149`, `Sidebar.tsx:96,114`, every `section-number` eyebrow in cluster dashboards | PARTIAL (documented as intentional, still confusing) |
| Verdict band in a fixed top slot in every lens | `Cluster1Dashboard.tsx`, `Cluster2Dashboard.tsx`, `cluster4/SiteComparison.tsx`, `cluster5/Cluster5Dashboard.tsx`, `src/components/ui/VerdictCard.tsx` (lens prop) | PARTIAL |
| Evidence drawer | `src/components/ui/{VerdictMathPanel,ReasoningChain,ProvenanceLedger,CoverageMap}.tsx` wrapped in a new drawer in the shell | MISSING |
| Wire CMA, IC memo, Portfolio Risk Report | `Cluster2Dashboard.tsx:243-262` (replace tile with DocumentButton `cma`), `Cluster5Dashboard.tsx:205-240` (add `ic_memo`, `portfolio_risk_report`) | EXISTS server-side, MISSING in UI |
| Document 402/403 opens upgrade sheet; tier preselected; preview thumbnail | `DocumentButton.tsx:71-75`, `UpgradeProvider.tsx`, `UpgradeScreen.tsx` | MISSING |
| Fix `hasRecentVerdict` on Transaction docs | `Cluster2Dashboard.tsx:220-226` | PARTIAL (bug) |
| Usage meter | new `/api/usage` read over `usage_events` (same query as `koano-guard.ts:161-168`), shell header | MISSING |
| Free-tier truth: either allow watermarked doc previews or change copy | `lib/documents/guard.ts:68-81` or `PricingContent.tsx:208-209,484,500` | PARTIAL (contradiction) |
| Hide "test mode" from customer UI | `UpgradeScreen.tsx:193-195` | EXISTS (should not) |
| Watch from any lens | `Cluster1Dashboard.tsx`, `Cluster2Dashboard.tsx`, `SiteComparison.tsx` using `POST /api/properties` + `PATCH /api/monitoring` | MISSING |
| Progressive ranking, free-run warning | `SiteComparison.tsx:297-338, 117-156` | PARTIAL |
| Address autocomplete, recents, paste-many, CSV import | `src/components/ui/AddressInput.tsx`, `cluster5/PortfolioOverview.tsx` | MISSING |
| Candidate picker with lot map and cancel | `src/components/ui/CandidatePicker.tsx` | PARTIAL |
| History reopen, re-run, generate document | `VerdictHistory.tsx` | PARTIAL |
| Inline letterhead prompt on first client document | `DocumentButton.tsx`, `ProfileSettingsForm.tsx` | MISSING |
| Enterprise CTA to a real contact path | `PricingContent.tsx:422-428` | PARTIAL |
| Homepage address box and sample verdict | `HeroSection.tsx:162-165`, `exampleVerdict.ts` | MISSING |

---

## 8. Top 10 problems (ranked by enterprise-value impact)

| # | Problem | Evidence | State | Effort | Impact |
|---|---|---|---|---|---|
| 1 | Headline documents sold on pricing (CMA, IC memo, Portfolio Risk Report) are implemented but unreachable; Transaction UI says the CMA is "Not yet available" | `PricingContent.tsx:61,82,84`; `registry.ts:111-127,288-357`; `implemented.ts`; `Cluster2Dashboard.tsx:243-262`; no `docType="cma"/"ic_memo"/"portfolio_risk_report"` in `src` | PARTIAL | S | 10 |
| 2 | Verdict has no consistent home; last in Transaction, below map elsewhere | `Cluster2Dashboard.tsx:296`; `Cluster1Dashboard.tsx:166-200`; development.png, community.png, transaction.png | PARTIAL | M | 9 |
| 3 | Free tier promise ("three generated documents") contradicts the guard (free = zero documents), and the block shows as error text, not an upgrade | `PricingContent.tsx:208,484`; `lib/documents/guard.ts:68-81`; `DocumentButton.tsx:71-75` | PARTIAL | S | 9 |
| 4 | Dashboard is not responsive; unusable on phones | `Sidebar.tsx:29-43`; `DashboardShell.tsx:57-63`; no media queries in `src/components/dashboard` | MISSING | M | 8 |
| 5 | Development's core action consumes the entire free allowance in one click; failed attempts count; 50/day global cap with "demo" copy | `koano-guard.ts:3-7,19-20,38,70-73,152`; `SiteComparison.tsx` | PARTIAL | S | 8 |
| 6 | Monitoring (the recurring-revenue engine) can only be started from Portfolio; Community, Transaction, Development cannot watch | `PortfolioOverview.tsx:121` is the only add path; `AlertsPanel.tsx:6-7`; `SiteComparison.tsx:549` | MISSING | S | 8 |
| 7 | Three numbering systems (cluster_id, number, badge) visible to users; "Viewing C1. Your home cluster is C2." | `clusters.ts:5-10`; `Sidebar.tsx:96,114`; `OnboardingClusters.tsx:160`; development.png | PARTIAL | S | 6 |
| 8 | No URL per subject, switching lens wipes state, history cannot reopen a run | `DashboardShell.tsx:31,47`; `VerdictHistory.tsx:192-227` | MISSING | M | 7 |
| 9 | Upgrade modal is generic, ignores home cluster, shows "test mode"; enterprise CTA goes to self-serve signup | `UpgradeScreen.tsx:21-26,193-195`; `PricingContent.tsx:422-428` | PARTIAL | S | 7 |
| 10 | Persona mismatch in Community: investor verbs (HOLD, confidence-weighted score) as the headline for homeowners | community.png; `VerdictCard.tsx` used unchanged in `Cluster1Dashboard.tsx:200` | PARTIAL | M | 5 |

## 9. Top 10 opportunities (ranked)

| # | Opportunity | State | Effort | Impact |
|---|---|---|---|---|
| 1 | Wire the three missing flagship documents and make "the deliverable" the primary CTA beside every verdict, with a first-page preview | MISSING (UI) | S | 10 |
| 2 | Fixed verdict band plus evidence drawer across all lenses (the "reasoning is the interface" layout) | MISSING | M | 9 |
| 3 | Clickable verdict numbers that trace to the source row and the city record (the thing Diald does not publicly show) | PARTIAL (data exists in `ProvenanceLedger`) | M | 9 |
| 4 | Portfolio "This week" delta view as the hero, with data gaps as news | PARTIAL (`MonitoringFeed`, `RiskMonitor`, `ArchiveTrend` exist) | M | 9 |
| 5 | Watch from anywhere, with a free "what alerts would look like" preview | MISSING | S | 8 |
| 6 | One subject, one URL, many lenses; shareable read-only verdict link (viral loop Diald already uses with its free Pilot tier) | MISSING | M | 8 |
| 7 | Homepage address box resolving into a real recorded verdict or a signup wall with the lot outlined | MISSING | M | 7 |
| 8 | Usage meter and pre-run cost warnings; progressive ranking in Compare | MISSING | S | 7 |
| 9 | Comp include/exclude with deterministic recompute in Transaction | MISSING | M | 6 |
| 10 | CSV/BBL paste import for Portfolio and Compare | MISSING | S | 6 |

## 10. What I would redesign first

Week 1 (all S effort, no new data): wire `cma`, `ic_memo`, `portfolio_risk_report` buttons; route document 402/403 into the upgrade sheet with the tier preselected; fix `hasRecentVerdict` in Transaction; hide "test mode"; add a Watch button to Community, Transaction and Development; add the usage meter; resolve the free-documents contradiction one way or the other; remove C-numerals from user-facing UI.

Weeks 2 to 4: the shared shell (responsive, URL per subject, lens switcher, global search with autocomplete and recents), the fixed verdict band, the evidence drawer. Then rebuild Portfolio around "This week" and Transaction around the price range. Development needs the least surgery: promote the table and math strip, demote the map, rank progressively.

## 11. The one thing that would make me say "I have never seen anything like this"

**A verdict you can click into, all the way down.** You see "BUY, confidence 79". You click 79. It expands into the five agent bands with their weights. You click the Regulatory band. It shows "97% unused FAR" with a LIVE badge. You click that. It shows the PLUTO row for BBL 1-01234-0056, the query KOANO ran, the timestamp, and the archived snapshot from the day of the run, and a link to the same lot on the city's own site. Then a "replay" button re-runs the deterministic math on stored inputs and shows the identical result. Every competitor, Diald included as far as its public pages show, asks you to trust a score. KOANO can be the first product where a principal can audit a real estate AI verdict to the source record in four clicks, live in a meeting. That is EXISTS in the engine (provenance, ledger, replay fixture) and MISSING in the UI.

---

## 12. VISION (requires data, partners, capital or technology not in hand)

Kept separate from the grounded audit above.

1. **Assumption-reactive verdicts.** Let the user set hold period, budget, strategy; re-run only the deterministic synthesis on stored agent bands so the verdict updates in under a second, with the delta explained. Dependency: agents would need to emit bands conditioned on a small set of strategy parameters. Respects determinism. (VISION)
2. **Time-travel slider on every property.** Drag back to any date since the archive began (August 2026) and see what KOANO would have said with only the data available then, next to what actually happened. This is the calibration record made visible and the moat made tangible. Dependency: years of archive. (VISION)
3. **Fifty-site screening table for developers** with kill reasons, batch-priced. Dependency: compute budget and lifted run caps. (VISION)
4. **Live meeting mode.** A presenter view for IC meetings: the verdict band full-screen, the drawer as the audit trail, every click logged into the IC memo appendix. (VISION, mostly design and engineering)
5. **Connected book.** Yardi, MRI, Argus imports so Portfolio opens on the user's real assets on day one, provenance tagged "partner". Dependency: integrations and partner agreements. (VISION)
6. **Shared, commentable verdict pages** (Felt-style "view and comment without a seat") so a broker sends a client a living verdict instead of a PDF. (MISSING today, achievable; listed here because the comment and permissions model is a larger build)

---

## Sources

- https://diald.ai
- https://diald.ai/score
- https://diald.ai/product
- https://diald.ai/pricing
- https://diald.ai/sample
- https://diald.ai/demo
- https://commercialobserver.com/2025/12/diald-ai-early-stage-funding/
- https://www.rutlandherald.com/news/business/diald-launches-conversational-ai-underwriting-platform-opening-institutional-grade-real-estate-analysis-to-everyone/article_9338e2f1-5791-527b-9fce-7bf2772fb240.html (attempted, HTTP 429, content not retrieved; headline seen only in search results)
- https://app.fundz.net/companies/diald-ai (seen in search results only, not opened; used only to note the August 10, 2026 release headline as unverified)
- https://www.placer.ai/
- https://felt.com/
- https://cherre.com/

## Discrepancies vs the brief (section 3 of the prompt)

1. **Transaction documents.** Brief: Transaction produces a "white-labeled CMA, pricing memo". Code: the CMA is implemented server-side (`lib/documents/registry.ts:111-127`, `implemented.ts`, `api/documents/route.ts:473`) but the dashboard shows it as "Not yet available" (`Cluster2Dashboard.tsx:243-262`). There is a "Pricing Recommendation Sheet", not a "pricing memo".
2. **Portfolio documents.** Brief: "IC memo, portfolio risk report". Code: both implemented server-side, neither reachable from the Portfolio dashboard, which offers only the Monday Briefing PDF and Asset One-Pager (`Cluster5Dashboard.tsx:205-240`).
3. **Free tier.** Brief: "free (about 3 verdict runs)". Code: 3 lifetime verdict runs and 3 lifetime content generations (`koano-guard.ts:38`), but documents are blocked entirely for free users (`lib/documents/guard.ts:68-81`). Pricing copy promises "three analyses and three generated documents" (`PricingContent.tsx:208,484`) and also says "Both tiers are free right now" (`PricingContent.tsx:500`).
4. **Tier differentiation.** Brief: "Tiers differ by the documents they produce and monitoring caps, not feature locks." Code also differs by daily run allotments (20/50/150/500 verdicts per rolling 24h, `koano-guard.ts:37-43`) and uses a monotonic document tier ladder (`lib/documents/guard.ts:31-33`), which is effectively a feature lock on documents.
5. **Pricing.** Brief lists single prices. Pricing page shows ranges ($149 to $299, $499 to $1,499, $1,499 to $4,999 + custom, $19 to $49; `PricingContent.tsx:41,59,77,97`) that the checkout (`UpgradeScreen.tsx:21-26`, four tiers) does not offer.
6. **Monitoring.** Brief: weekly monitoring on paid tiers. Code supports caps per tier (`koano-guard.ts:49-55`), but only the Portfolio view can add a property to the watched set, so Community, Transaction and Development subscribers cannot start monitoring from their own dashboards.
7. **Cluster identity.** The brief speaks of four clusters by audience. The code uses cluster_1/2/4/5 internally, 01/02/04/05 as visible eyebrows, and C1 to C4 badges in a different order, all visible to users (`clusters.ts:5-10`).
8. **Run time.** LoadingState says ~60s (`LoadingState.tsx:3`); empty states say about 90 seconds or 1 to 3 minutes.
9. **Dashboard routes.** `CLAUDE.md` sections 11 and 12 list `/dashboard/site/[id]`, `/dashboard/property/[id]`, `/dashboard/portfolio`, `/dashboard/reasoning/[id]`. None exist; the only dashboard routes are `/dashboard` and `/dashboard/settings` (`find src/app/dashboard -name page.tsx`). This is the root of the "no URL per subject" problem in section 4.
10. **Approval gate.** `CLAUDE.md` describes `lib/koano-guard.ts` as "approval gate + per-user rolling limits". The code has retired the approval gate (allow-all shim, `koano-guard.ts:11-13, 99-104`) and free limits are lifetime, not rolling.
11. **Cluster 5 hero.** `CLAUDE.md` section 08 still says the neural map is the full-screen hero of Portfolio; the code replaced it with a Mapbox risk map (`Cluster5Dashboard.tsx:3-7, 121`), consistent with the Phase 4 note but not with section 08.
