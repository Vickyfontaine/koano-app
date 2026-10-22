# Panel 6.9: Regulatory, Legal and Trust Review

Reviewer persona: former general counsel at a proptech company, fair housing and data licensing.
Date: 2026-10-19. Scope: the code in `/Users/victor/Desktop/koano-app` as of today, the recorded verdict fixture, the live marketing copy in `src/`, and public sources retrieved today.

**Posture.** This is a risk map for outside counsel to confirm. It is not legal advice to the founder. Where a statute or rule is named from my own knowledge and I could not retrieve it today, it is marked "counsel to confirm". The session's web search budget ran out partway through this review, so several items that I would normally verify by search (NAR SoP was fetched; NY Executive Law Article 6-E appraisal exemptions, NY GBL 527-a auto-renewal amendments, the FTC negative option rule's status, NYS nonsolicitation zones, NYC Local Law 35 of 2022 and the NYS LOADinG Act) are flagged as unverified.

State labels: `EXISTS`, `PARTIAL`, `MISSING`, `VISION`. Every ranked item has Effort (S/M/L/XL) and Impact (1 to 10, impact on enterprise value).

---

## 1. Bottom line

KOANO's document layer is more legally careful than most proptech I have reviewed. The verbatim disclaimer is enforced on every page (`lib/documents/disclaimer.ts:36-38`, rendered at `lib/documents/render/pdf.tsx:506-510`), the tax packet refuses to compute a fake over-assessment percentage (`lib/documents/builders/tax-appeal.ts:5-13`), the net sheet refuses to invent closing costs (`net-sheet.ts:89-117`), and IC memo narrative is fenced off from agent free text (`ic-memo.ts:167-171`). That discipline sits on a weak legal foundation, and the riskiest content is on the verdict side, not the document side:

1. **There is no Terms of Service, no Privacy Policy, and no consent step anywhere in the product.** No route, no footer link, no signup checkbox, no Stripe consent. Every user is on an unwritten contract with no limitation of liability, no disclaimer of reliance, no acceptable-use ban on discriminatory use, and no disclosure that their addresses go to Anthropic, Clerk, Supabase, Resend and Mapbox.
2. **The Demand Sentiment agent scores "gentrification stage" from resident income and education, and that verdict feeds the buy/sell math.** The output is stored permanently and shown to homeowners and renters on the Community dashboard. The Community landing page says "Not a tool for gentrification." The code contradicts the claim, and that gap is the fair housing exposure.
3. **The crime signal is mislabeled and its trend is miscomputed**, then fed into the risk score and the portfolio risk report. Crime is the classic proxy variable in fair housing complaints. A wrong crime number is worse than no crime number.
4. **The landlord portfolio matches individuals by first and last name only**, so it can attach other people's buildings and violations to a named private person, prints that person's address, and archives the result daily.
5. **One "free live" source (Freddie Mac PMMS) is under terms that bar commercial exploitation without a written agreement.**
6. **The audit trail that the institutional page sells as unbreakable can silently fail to record**, because the repo's DB constraints accept two provenance states while the engine emits five.

None of these is expensive to fix. Together they decide whether a bank's vendor-risk team, a pension fund's operational due diligence (ODD) team, or a city agency's counsel can sign off. Today none of them could.

---

## 2. Ranked legal risks

Severity scale: Critical (could stop a sale, a partnership or an acquisition, or invite an enforcement action), High, Medium, Low.

| # | Risk | Severity | State | Effort | Impact |
|---|---|---|---|---|---|
| 1 | No ToS, Privacy Policy, or consent; no contractual liability shield | Critical | MISSING | S | 10 |
| 2 | Resident income, education and "gentrification stage" drive a buy/sell verdict shown to consumers | Critical | EXISTS (the problem) | M | 9 |
| 3 | Crime data mislabeled (felony shown as "violent") and the trend is computed wrongly | High | EXISTS (the problem) | S | 8 |
| 4 | Individual landlords merged by name; private addresses printed and archived | High | EXISTS (the problem) | M | 8 |
| 5 | Audit trail can silently drop verdicts and documents; no document hash | High | PARTIAL | M | 8 |
| 6 | Marketing claims the code contradicts (FTC Act s.5, NY GBL 349/350) | High | EXISTS (the problem) | S | 7 |
| 7 | CMA and "Pricing Recommendation" sold to anyone; license number unverified; KOANO marks leak into white-label | High | PARTIAL | M | 7 |
| 8 | "Mortgage officers" audience vs the 2024 AVM quality control rule (effective 2025-10-01) | High | MISSING (controls) | L | 7 |
| 9 | Freddie Mac PMMS terms bar commercial use without a written agreement | Medium | EXISTS (the problem) | S | 6 |
| 10 | Immutable verdicts vs deletion requests (CCPA, enterprise DPAs); no account deletion path | Medium | MISSING | M | 6 |
| 11 | Tax appeal packet: class-blind method, no deadlines, model-written "Basis for Appeal" | Medium | PARTIAL | M | 5 |
| 12 | On-screen verdict has no disclaimer on Community and Development dashboards | Medium | PARTIAL | S | 5 |
| 13 | Census API attribution notice missing; Census Reporter used without a production arrangement; FBI DEMO_KEY in prod | Low | MISSING | S | 3 |
| 14 | Archive as an acquisition asset carries personal data and source-term flow-down issues | Medium (rising at exit) | PARTIAL | M | 6 |
| 15 | Subscription cancellation: "cancel anytime" with no self-serve cancel path | Low | MISSING | S | 3 |

### Risk 1. No Terms, no Privacy Policy, no consent (Critical, MISSING, S, 10)

**Evidence.** `src/app` contains no `terms`, `privacy` or `legal` route (directory listing: `about, api, dashboard, data, for, intelligence, login, onboarding, pricing, signup`). A grep for `privacy|terms of service|terms of use|/terms|/privacy` across `src/`, `lib/` and `public/` returns nothing. `src/components/marketing/Footer.tsx:59` carries only the copyright line. The signup route (`src/app/signup/[[...rest]]`) is the bare Clerk component with no agreement text. `src/app/api/stripe/checkout/route.ts` sets no `consent_collection`. Data flows I confirmed in code:
- Addresses and every fetched data point go to Anthropic (`lib/agents/shared.ts:16`, model `claude-sonnet-4-6`; `tax-appeal.ts:124-135`).
- Identity goes to Clerk. Profile data goes to Supabase: `full_name, company_name, license_number, phone, contact_email, logo_url, headshot_url` (`lib/documents/assembler.ts:79`).
- Email goes to Resend (`lib/monitor/digest.ts:133-146`).
- Map tiles come from Mapbox (`src/components/ui/map/KoanoMap.tsx:255-263`).

**Why it matters.** With no ToS there is nothing to limit liability, disclaim reliance, allocate IP in the outputs, prohibit discriminatory use, or set governing law and venue. The PDF footer disclaimer is a notice, not a contract, and it never appears on the dashboard verdict at all (Risk 12). Any acquirer's diligence checklist asks for these documents on day one. Any bank vendor questionnaire asks for the privacy notice and subprocessor list.

**Compliant design.**
- Publish `/terms`, `/privacy` and `/subprocessors`, and link them from Footer, AuthShell and checkout.
- Make clickwrap acceptance a gated onboarding step, and store `tos_version` and `accepted_at` on `profiles`.
- Set Stripe `consent_collection.terms_of_service = 'required'`.
- The ToS must carry: no-reliance and decision-support language matching `DOCUMENT_DISCLAIMER`; a cap on liability; an acceptable-use clause that bars use of KOANO outputs to make or support decisions that discriminate on any protected class under federal, NYS or NYC law, or for tenant screening, lending decisions, or insurance underwriting unless an enterprise agreement says otherwise; ownership of and license to generated documents; and pass-through of source terms (Risk 9).
- For enterprise, add an MSA, a DPA, and an Anthropic zero-retention or no-training statement backed by the vendor contract. The claim at `src/app/for/institutions/page.tsx:41` that portfolio data is "never used to train KOANO's models" currently has no written vendor basis in the repo.

### Risk 2. Demographics and "gentrification stage" drive the verdict (Critical, M, 9)

**Evidence.**
- `lib/agents/demand-sentiment.ts:14` says the agent "estimate[s] demand momentum and gentrification stage." Line 20: "high income + high education + high home values = late-stage ... moderate income with strong education influx = mid-arc (stages 3-5, most price appreciation happens here)." Line 23 folds "displacement pressure" into risk. Line 24 requires a 1-7 gentrification stage in every run.
- Inputs at `demand-sentiment.ts:40-46` are tract population, median household income, median rent, median home value, and `bachelors_or_higher_pct` (from `census-acs.ts:48-67`, ACS table B15003).
- The recorded production verdict (`scripts/fixtures/nyc-175-3rd-st.json`, demand-sentiment output) says: "The tract is firmly in late-stage gentrification (stage 6-7 of 7) ... 79% of residents holding a bachelor's degree or higher signal a fully arrived, high-wealth demographic."
- `lib/agents/synthesis.ts:249-253` copies every agent's reasoning steps into the stored `reasoning_chain`. That chain is written to the immutable `verdicts` table (`lib/supabase/verdicts.ts:40`) and rendered on every dashboard, including the Community dashboard (`src/components/dashboard/cluster1/Cluster1Dashboard.tsx:11,18` imports `VerdictCard` and `ReasoningChain`).
- The demand agent's buy/hold/sell vote is a weighted input to the deterministic verdict.
- Client-facing documents: the Client Neighborhood Report (Transaction, sent by an agent to a buyer or seller) prints median household income (`client-neighborhood.ts:189-190`) and the deterministic narrative says "the surrounding area reports a median household income of $X" (`:165`). The Property Intelligence Report prompt asks the model "is this neighborhood strengthening, softening, or steady" using demographics, for a reader who may be "a family member" (`property-intelligence.ts:188-190`).
- Marketing: `src/app/for/community/page.tsx:33` sells "neighborhood demographic change ... crime trend"; `:71` says "Not a tool for gentrification."

**Legal frame (for counsel).**
- The Fair Housing Act reaches sale, rental, brokerage, advertising and residential real estate-related lending. KOANO is not a housing provider, but its outputs are used by brokers (the Transaction cluster) and its marketing targets "mortgage officers" (`src/components/dashboard/clusters.ts`, cluster_2 audience). Steering liability attaches to the broker who uses a tool. The tool vendor's exposure is aiding and abetting, plus the reputational exposure of being the named source in a complaint.
- **2025/2026 federal changes.** HUD withdrew its sub-regulatory fair housing guidance in two batches, effective September 17 and 25, 2025, including the digital and algorithmic advertising guidance, as announced in Federal Register notices in April and July 2026 (Orrick, JD Supra, LeadingAge, NLIHC). HUD proposed rescinding its disparate impact regulation on 2026-01-14 (91 Fed. Reg. 1475) under EO 14281. I found no final rule as of the latest source (April 2026). Disparate impact remains cognizable in court under *Inclusive Communities* (2015) (Nixon Peabody, Georgetown). **Reduced federal enforcement does not reduce private-plaintiff, NYS Division of Human Rights, or NYC Commission on Human Rights exposure.** The NYC Human Rights Law covers more classes than federal law, including lawful source of income (counsel to confirm the current class list). KOANO's deepest market is NYC, so the binding regime is the stricter local one.
- Industry standard that brokers will measure KOANO against: NAR Code of Ethics SoP 10-1 says Realtors "shall not volunteer information regarding the racial, religious or ethnic composition of any neighborhood" and "shall not engage in any activity which may result in panic selling or steering," though "other demographic information" may be given. SoP 10-2 requires demographic information to come from a "recognized, reliable, independent, and impartial source" with any modifications disclosed. KOANO never uses race or ethnicity (verified: the ACS tables are B01003, B19013, B25064, B25077, B15003 only). That is the right floor. But an LLM-assigned "gentrification stage" is a KOANO modification, not an impartial source figure, and it is exactly the narrative a steering complaint quotes.
- The AVM rule's fifth factor (below) requires compliance with nondiscrimination law for any AVM a lender uses. Income and education are textbook proxies tested in fair-lending reviews.

**Compliant design.**
1. **Remove resident composition from the verdict.** Drop `bachelors_or_higher_pct` and the gentrification-stage instruction from `demand-sentiment.ts`. Re-base Demand on market-behavior variables that describe transactions, not residents: HMDA origination volume and YoY, sales velocity, $/sqft trend, permits, rent level (median gross rent is a price, which is defensible), QCEW employment and wage, and IRS net migration counts. Keep median household income out of the decision path. Income may appear in a clearly separated "Area statistics (Census, informational, not used in the verdict)" appendix, opt-in per document.
2. **Add a banned-language gate** to the existing grounding layer (`lib/agents/grounding.ts`): "gentrification", "gentrify", "late-stage", "arrived", "desirable", "up-and-coming", "safe/unsafe", "good schools", "family-friendly", "transitioning", "demographic shift". A violation should fail the narration, the same way the contradiction guard does.
3. **Neighborhood narratives in client documents** (`client-neighborhood.ts:148-154`, `property-intelligence.ts:188-198`) should describe the property's market, not the people. Remove "is this neighborhood strengthening, softening" in favor of "is the local recorded-sales market rising, falling or flat."
4. **Run a disparate impact test before launch and on every model-era change.** Join verdicts by tract to ACS race and ethnicity (offline, never in the product) and test whether buy, sell and drop rates differ by tract minority share after controlling for market variables. Publish the method. The `verdict_outcomes` table (migration-011) and the `method`/`inputs_era` columns (migration-021) already give you the hooks.
5. **Make the marketing true.** Either remove "Not a tool for gentrification" or make it true by (1) through (4). I recommend making it true and then publishing the test, which turns a liability into a differentiator (see Section 5).

**Existing safeguards to keep.** No race or ethnicity variables anywhere. Demographics are dropped, not faked, when not live (`client-neighborhood.ts:197-199`). The displacement-risk score is explicitly not built (`for/community/page.tsx:41-44`).

### Risk 3. Crime signal is mislabeled and miscomputed (High, S, 8)

**Evidence** in `lib/providers/real/fbi-ucr.ts`:
- `:100` `const violent = current['FELONY']` and `:129` `violent_incidents: violent`. NYPD's FELONY law category includes non-violent felonies (grand larceny, burglary, felony drug offenses). The fixture's risk agent then states "1,420 violent ... incidents" within one mile. That count is felonies, mislabeled as violent.
- `:101,:130` maps MISDEMEANOR to `property_incidents`, which is also wrong. Misdemeanors include assault 3 and many non-property offenses.
- `:113` hardcodes the prior-year window to calendar 2023 even though today is 2026. `:117-118` compares year-to-date counts with a full prior year ("YTD vs full prior year, direction only"). It returns "rising" only if YTD exceeds a whole year, and "falling" only if YTD is under half a year, so most runs read "flat" regardless of reality.
- These feed `risk-volatility.ts:28` ("rising crime is a leading indicator of value erosion"), the risk score, and `portfolio-risk-report.ts:62,79` ("N sit where local crime is rising"). The Community page markets "crime trend" (`for/community/page.tsx:33`).

**Why it matters.** Crime is the variable most often attacked as a proxy for race in housing. FBI guidance on UCR data has long warned that rankings and simple comparisons "lead to simplistic and/or incomplete analyses that often create misleading perceptions adversely affecting cities and counties, along with their residents" (quoted via PolitiFact; the current CDE page was not retrieved). A mislabeled "violent" count in an investor memo is a factual misstatement about a neighborhood. It cuts against the product's own provenance-honesty principle, because the provenance badge says `live` while the label is wrong.

**Compliant design.** Rename the fields to what the source says ("NYPD complaints: felony / misdemeanor / violation") and drop the violent/property split unless it is computed from offense codes (`ofns_desc`/`ky_cd`). Compare equal periods (trailing 12 months vs the prior trailing 12, computed from today). Normalize per resident or per area and state the method. Remove crime from the Transaction cluster's client-facing documents entirely, and keep it as a labeled risk input only in Portfolio and Development. Consider excluding crime from the verdict math and showing it only as context. That decision should follow the disparate impact test in Risk 2.

### Risk 4. Individual landlords merged by name; addresses printed and archived (High, M, 8)

**Evidence.**
- In `lib/providers/real/nyc-landlord.ts:179-188`, when there is no corporate owner, the owner is an `IndividualOwner` or `HeadOfficer` identified by first and last name. `:198` then builds the portfolio by matching `upper(firstname)` and `upper(lastname)` across all HPD contacts. Every "JOSE RODRIGUEZ" or "MARY LEE" in the city becomes one landlord with one aggregated violation count (`:235-260`).
- A `HeadOfficer` is an officer of an owning corporation. Their other officer roles get aggregated as "buildings under this owner," and the document labels them "Registered owner" (`violation-record.ts:163`).
- The caveat speaks only to undercount: "the true portfolio may be larger" (`violation-record.ts:185`, `nyc-landlord.ts:33-34`). For individuals the dominant error is overcount.
- The registered owner's business address is printed (`violation-record.ts:165`). For individual owners that is often a home address.
- `violation-record.ts:197` adds: "Higher open-violation counts across a portfolio can indicate a pattern."
- The archive captures this landlord block per property (`lib/archive/capture.ts:592`), so the merged attribution is preserved in a dataset the exit thesis proposes to sell.

**Legal frame (counsel to confirm).** Republishing public records is generally privileged. Publishing an inaccurate compilation that attributes other people's violations to a named private individual and implies "a pattern" moves toward defamation and false-light territory, and the truthfulness of the underlying records does not cure a false aggregation. The Community audience (tenants, neighbors) will act on it, including organizing and press.

**Compliant design.**
- For corporate owners, keep the current behavior. For `IndividualOwner`/`HeadOfficer`, do not aggregate a portfolio on name alone. Require a second identifier (same business address, or the same name and the same HPD `registrationcontactid` lineage). Label the result "possible related registrations (unverified)" and show the match basis.
- Never label a HeadOfficer as "Registered owner".
- Suppress the street address for individual owners (show city/state only), and do not archive individual owner addresses.
- Make the caveat two-sided: "may be over- or under-counted."
- Add a published correction and dispute channel (email plus a 10-business-day SLA) and a suppression list honored in documents and the archive. Process reduces the risk more than any disclaimer does.

### Risk 5. The audit trail can silently fail to record (High, M, 8)

**Evidence.**
- The engine's provenance type has five states (`lib/agents/synthesis.ts:87,113` uses `Provenance`, with weakest-wins over `live | partner | representative | fetch_failed | coverage_absent`).
- The repo's SQL constrains `verdicts.overall_provenance` to `('live','representative')` (`supabase/schema.sql:118`) and does the same for `documents` (`supabase/migration-006-documents.sql:30`). No later migration alters either constraint (grep of `supabase/*.sql`).
- `lib/supabase/verdicts.ts:23-46` therefore fails to insert any verdict whose rollup is `fetch_failed`, `coverage_absent` or `partner`. The failure is reported as `persist_error`, but the verdict is still shown to the user.
- The document audit insert at `src/app/api/documents/route.ts:579-593` never checks the `{ error }` returned by supabase-js, which does not throw. A rejected insert is fully silent, and the `catch` never fires.
- `documents` stores metadata only. There are no document bytes and no hash (`migration-006-documents.sql:17`), so KOANO cannot prove later what a forwarded PDF said.
- Counsel and engineering should check the live production schema. If prod was altered by hand, the repo is out of sync, which is its own finding.

**Why it matters.** The institutional page sells the record as unbreakable: "Every verdict is written append-only and cannot be edited or deleted after the fact, by anyone" (`src/app/for/institutions/page.tsx:41`), and "The immutable audit trail ... is already in production" (`:54`). For a bank under SR 11-7 or a pension fund ODD team, an audit trail with silent gaps is worse than none, because it creates false assurance. If the claim is false in practice, it is also a deception exposure (Risk 6).

**Compliant design.** Widen both CHECK constraints to the five-state enum. Check `error` on every audit insert. For enterprise tenants, fail closed: no persisted record, no document. Store `sha256(pdf_bytes)`, `sha256(render_model_json)`, renderer version, model ID, prompt hash, and the archive snapshot `content_hash` IDs the document was built from (the archive already computes `content_hash`, `capture.ts:582-743`). Then hash-chain the rows (each row stores the previous row's hash) so tampering is detectable without trusting the DB operator.

### Risk 6. Marketing claims the code contradicts (High, S, 7)

FTC Act s.5 and NY GBL ss.349-350 (counsel to confirm the NY standards) both reach claims a reasonable customer relies on. The specific conflicts:

| Claim | Where | Code reality |
|---|---|---|
| "There is no cached market report sitting behind the answer" | `src/components/marketing/DataContent.tsx:80` | The fixture cites "FHFA House Price Index (via KOANO durable archive)", "Census Building Permits Survey ... via KOANO durable cache", "EPA ... via KOANO per-BBL cache" (`epa-superfund.ts:145`, migrations 020 and 022), all tagged `live` |
| "Every account starts with three analyses and three generated documents, free" | `src/components/marketing/PricingContent.tsx:484` | `lib/documents/guard.ts:71-82`: free plan generates no documents (402) |
| "Not a tool for gentrification" | `src/app/for/community/page.tsx:71` | `demand-sentiment.ts:14,20,24` computes gentrification stage and rewards mid-arc tracts |
| "cannot be edited or deleted after the fact, by anyone" | `src/app/for/institutions/page.tsx:41` | True of rows that land. Not true that every verdict lands (Risk 5). Also a promise KOANO may be legally required to break (Risk 10) |
| "Monitor everything. Miss nothing." | `ClustersSection.tsx:24`, `for/institutions/page.tsx:9`, `PricingContent.tsx:75` | Monitoring caps at 20 properties on Transaction; sources fail and are labeled `fetch_failed` |
| Live data: "Full trust." | `DataContent.tsx:45` | The crime figure is live and wrong (Risk 3) |
| "You can change or cancel anytime." | `src/components/dashboard/UpgradeScreen.tsx:116` | No billing portal or cancel route exists (grep for `billingPortal`/`portal` returns nothing) |

**Compliant design.** Run a claims-substantiation pass: every absolute ("never", "every", "miss nothing", "full trust") either gets a code-level guarantee and a test, or gets softened. Rewrite DataContent step 01 to describe the archive honestly: "Most sources are queried at request time; a few slow federal series are served from KOANO's dated archive and labeled with their capture date." That respects the provenance principle and is more impressive, not less.

### Risk 7. CMA and pricing documents, licensing, and white-label leaks (High, M, 7)

**Evidence.**
- Any paying Transaction user can generate a "Comparative Market Analysis" with a "Pricing Recommendation" (`cma.ts:161`) or a "Pricing Recommendation Sheet" with a "Recommended Price Band" (`pricing-sheet.ts:105`), under their own letterhead.
- `license_number` is free text, "broker / appraiser license, printed as-entered" (`supabase/migration-005-profile-fields.sql:14`; `assembler.ts:79-86`). Nothing verifies it.
- The CMA uses an HPI time adjustment (`cma.ts:41-49`) and an interquartile band, which is valuation work in substance.
- KOANO marks in the white-label output: the "KOANO" wordmark on every PDF (`pdf.tsx:262`, KNOWN_ISSUES #3); the "KOANO recommendation" banner (`pdf.tsx:455`); PDF metadata `author="KOANO"` (`pdf.tsx:533,551`); the DOCX header wordmark and "Prepared with KOANO" fallback (`docx.ts:66,75`); DOCX `creator: 'KOANO'` (`docx.ts:334,361`).

**Legal frame (counsel to confirm).**
- NY RPL s.440(1) defines a broker as one who "for another and for a fee" lists, sells, buys, rents or negotiates (FindLaw copy, retrieved). The Court of Appeals has refused to extend the definition by implication (*Weingast v. Rialto Pastry Shop*, per search results).
- Producing a price opinion for one's own client is ordinarily done by licensees. An unlicensed user who sells "pricing recommendations" to sellers for a fee is the risk. KOANO's exposure is facilitation, and lending a professional-looking license field to an unverified user.
- NY appraiser licensing (Executive Law Article 6-E) generally does not reach a broker's CMA that is not represented as an appraisal. I could not retrieve the exemption text today, so this is unverified.
- The document language is already careful ("not an appraisal or a list price", `pricing-sheet.ts:108`; `cma.ts:145,162`). Keep it.

**Compliant design.**
- Gate the CMA, the pricing sheet and the net sheet on a license attestation at generation time ("I hold an active NY real estate license; this document is for a client I represent"). Verify against the NY Department of State licensee data. The existence of a public NYS licensee dataset is unverified and needs checking. Store the verification result with the document audit row.
- Unverified users get the same analysis titled "Recorded Sales Range" with no "Recommendation" language and no license field.
- The locked decision stands: the white-label CMA carries no KOANO branding. Remove the wordmark, the banner, and the PDF and DOCX author/creator metadata for client-facing types. The neutral, unbranded disclosure "Generated from public data by automated analysis" must stay. It is the AI-use disclosure that protects the agent, it already omits the KOANO name, so it is consistent with the decision.
- Add an ToS clause that documents may not be used as an appraisal, or in any federally related transaction or credit decision without an enterprise agreement (Risk 8).

### Risk 8. "Mortgage officers" and the AVM quality control rule (High, L, 7)

**Evidence.** The Transaction cluster audience is "Agents, brokers, mortgage officers" (`src/components/dashboard/clusters.ts`, cluster_2). The product computes an indicative value (`pricing-sheet.ts:87-89`, `net-sheet.ts:53`, `ValuationPanel.tsx:34-35`) and an HPI-adjusted midpoint (`cma.ts:79-88`).

**Rule status.** Six agencies (Fed, OCC, FDIC, NCUA, FHFA, CFPB) issued the final rule on 2024-08-07 implementing Dodd-Frank s.1125. Search results report it took effect on 2025-10-01, and I found no delay notice (FRTracker, LexBlog, Mondaq results; NAR summary fetched). It applies to mortgage originators and secondary market issuers that use AVMs to determine collateral value in credit decisions, and requires: a high level of confidence in estimates, protection against data manipulation, avoidance of conflicts of interest, random sample testing and reviews, and compliance with nondiscrimination laws. Appraisers are excluded (NAR summary).

**Exposure.** KOANO is not directly regulated. A loan officer who uses a KOANO indicative value in a credit decision puts the lender in scope, and the lender will push the five factors down onto KOANO through vendor terms. KOANO today has no published accuracy statistics (hit rate, median absolute error, forecast standard deviation), no random sample testing, and no nondiscrimination testing. The fifth factor makes Risk 2 a lending issue as well.

**Compliant design.**
- Near term: in the ToS and in the document footer for Transaction types, say that indicative values are not for use in credit decisions, and remove "mortgage officers" from the audience copy.
- Later, as a paid enterprise product: an "AVM-grade" tier with a published validation report (holdout of DOF recorded sales, error by price band, borough and tract minority share), confidence scores per estimate, data-manipulation controls (the immutable inputs ledger from Risk 5), and independent annual validation. That product is a bank-grade revenue line (Section 5).

### Risk 9. Freddie Mac PMMS terms (Medium, S, 6)

**Evidence.** `lib/providers/real/freddie-pmms.ts:15` fetches `https://www.freddiemac.com/pmms/docs/PMMS_history.csv` and labels it `live`. The 30-year rate appears in agent reasoning (the fixture: "The 30-yr fixed rate at 6.65%").

**Terms.** Freddie Mac's site Terms limit data to "internal business purposes or your own personal use" and say you may not "commercially exploit Data or derived products/services without a separate written agreement" (freddiemac.com/terms, fetched). The PMMS page itself says "Information from this document may be used with proper attribution" and "Alteration of this document or its content is strictly prohibited" (freddiemac.com/pmms, fetched). Those two documents conflict. FRED republishes the series under "Copyright, 2016, Freddie Mac. Reprinted with permission" (FRED MORTGAGE30US, fetched), so switching to FRED does not cure the issue. FRED is a licensee, and its permission does not flow to KOANO. CLAUDE.md s.07 says the direct CSV was chosen deliberately as "attribution-only" to avoid FRED's restriction. That reasoning relies on the PMMS page language and does not address the site-wide Terms clause, so it needs a written answer from Freddie Mac rather than an inference.

**Compliant design.** Get a written permission letter from Freddie Mac for display with attribution in a paid product. That is usually obtainable, but get it in writing. Until then, attribute "Freddie Mac Primary Mortgage Market Survey" verbatim, do not imply endorsement, and do not alter values. The fallback plan is to stop displaying the rate in client documents and use it only as an internal agent input. Counsel should confirm whether that is itself "commercial exploitation."

**Other sources.**
- NYC Open Data is provided "as is" for informational purposes, may carry additional terms set by individual agencies, and has historically included a city right to require users to terminate display or distribution. The current terms page returned 404, so this rests on search-result text and should be treated as unverified. NYC Open Data warrants nothing, so **KOANO must not warrant source data to enterprise customers either.**
- Census Bureau API: display "This product uses the Census Bureau Data API but is not endorsed or certified by the Census Bureau" (census.gov developer ToS, fetched). This is missing; `census-acs.ts:142` only names the source.
- Census Reporter: "This data is not copyrighted"; site content is CC BY 4.0 (censusreporter.org/about, fetched). There is no published API policy, and it blocks generic user agents (`census-acs.ts:38-44`), which signals it is not a production dependency. Set `CENSUS_API_KEY` and use api.census.gov.
- FBI CDE through api.data.gov: `DEMO_KEY` is limited to 30 requests per hour and 50 per day and is meant for exploration (api.data.gov developer manual, fetched). `fbi-ucr.ts:153` falls back to `DEMO_KEY` in production.
- Mapbox: the attribution control is on (`KoanoMap.tsx:263`) and no CSS hides it (grep). Geocoding does not use Mapbox (`geocode.ts` uses NYC GeoSearch and the Census geocoder), so Mapbox's rule against storing temporary geocodes does not apply. If static map images ever go into PDFs, review the Mapbox Product Terms PDF first. It was not retrievable today.
- HUD, FEMA, EPA, USGS, NOAA, BLS, CFPB HMDA, FHFA and IRS: US government works, generally public domain (counsel to confirm per dataset). The HUD QCT/DDA and Opportunity Zone layers are pulled from an ArcGIS organization that the code describes as "HUD Official Content" and "public ArcGIS mirror" (`hud-qct-dda.ts:111`, `irs-opportunity.ts:61`). Confirm the mirror is the agency's own, or cite the agency file directly.

### Risk 10. Immutability vs deletion rights (Medium, M, 6)

**Evidence.** `supabase/schema.sql:143-155` blocks UPDATE and DELETE on `verdicts` "for ALL roles, including service_role." `documents` does the same (`migration-006-documents.sql:55-67`). "Hiding" is only a side table (`migration-019-verdict-hidden.sql`). Each row carries `clerk_user_id` plus `address_input`, which for a Community user is usually their home. There is no Clerk `user.deleted` webhook or account deletion route (grep for `svix`, `user.deleted`: none).

**Legal frame (counsel to confirm thresholds).** CCPA/CPRA deletion rights apply only above the statutory thresholds, which KOANO likely does not meet today. Enterprise DPAs will require deletion on termination regardless. NY SHIELD's safeguards duty attaches to "private information," a narrow class that KOANO mostly delegates to Clerk. I could not confirm whether NY enacted a comprehensive privacy statute in 2025 or 2026. Marketing a record that cannot be deleted "by anyone" is a promise that will collide with a deletion obligation.

**Compliant design.** Use crypto-shredding. Store `clerk_user_id` and `address_input` encrypted under a per-tenant key, and keep the decision content (verdict, inputs hash, provenance) in clear. A deletion request destroys the key: the record stays immutable and verifiable while personal data becomes unrecoverable. Add a `legal_hold` flag that blocks shredding during disputes. Change the marketing to "cannot be altered; personal data can be erased on request without breaking the record."

### Risk 11. Tax appeal packet (Medium, M, 5)

**Evidence and gaps.**
- `tax-appeal.ts:52-80` applies the comps method to any building class. For condos and co-ops, NY law requires DOF to value them as if they were income-producing rentals (RPTL s.581, from memory; counsel to confirm). A recorded-sales comparison is the wrong legal basis, and a homeowner filing it will lose.
- No filing deadlines are shown. One court decision cites a January 15 to March 1 application window; I could not confirm class-specific dates today.
- "Basis for Appeal" (`:111-117, :209`) is model-written argument in a filing packet. The prompt is careful ("Never invent ... legal claims"), but the section title invites reliance.
- Representation rules: search results conflicted. One summary of form TC 707 says only attorneys may represent others in Article 7 Title 1 proceedings. Other results point to registration forms for paid representatives (TC 244 "Agent's Statement of Authority and Knowledge" is listed on the Tax Commission forms page, fetched). KOANO does not represent anyone, which keeps UPL risk low. It should never offer filing-on-behalf or "we file for you" features without counsel review.

**Compliant design.** Make the packet class-aware: comps only for Class 1 (1-3 family homes). For Class 2 condos and co-ops, output an explanation of the income method and route the user to the DOF and Tax Commission resources. Print the current year's deadlines from a maintained config with a "verify on nyc.gov" link. Retitle "Basis for Appeal" to "Evidence Summary." Add a line: "KOANO does not file or represent you. You may file yourself or use a representative permitted by the Tax Commission."

### Risk 12. Verdict screen has no disclaimer for most audiences (Medium, S, 5)

The disclaimer appears on documents, in MondayBriefing (`cluster5/MondayBriefing.tsx:151`) and in PricingPanel (`cluster2/PricingPanel.tsx:124`). It does not appear on `VerdictCard` itself, which is where a homeowner sees "SELL" about their own house (Cluster 1) and a developer sees "BUY" (Cluster 4). Add the same verbatim `DOCUMENT_DISCLAIMER` under every verdict, and use "signal" phrasing in the Community cluster ("market signal: hold") rather than an imperative. The IC memo banner "KOANO recommendation" (`pdf.tsx:455`) is acceptable for institutions, provided the ToS no-reliance clause exists.

### Risk 13. Small source-term hygiene items (Low, S, 3)

These are listed under Risk 9: the Census attribution notice, the move off Census Reporter, and dropping `DEMO_KEY`. A one-line "Sources and terms" page that links each source's terms would also answer the vendor-questionnaire question "do you have rights to every dataset you redistribute."

### Risk 14. The archive as an acquisition asset (Medium now, High at exit, M, 6)

The exit thesis sells the archive and reasoning layer to a data provider. Diligence will ask whether KOANO has the right to sublicense each archived source, and whether the archive contains personal data:
- It does contain personal data: landlord names and addresses (`capture.ts:592`).
- Sublicensing rights are uncertain for Freddie Mac data and for agency-specific NYC Open Data terms.
- Any future dataset that touches tenants (eviction filings, explicitly not built, `for/community/page.tsx:51-53`) could make a buyer's downstream product a consumer report under FCRA (counsel to confirm).

Keep a per-dataset rights register now, with source, terms URL, date reviewed, redistribution allowed (y/n), attribution text, and whether it contains personal data. That register is what turns the archive into a clean asset.

### Risk 15. Subscription cancellation (Low, S, 3)

"Cancel anytime" (`UpgradeScreen.tsx:116`) with no self-serve cancellation. Add the Stripe Billing Portal. I could not verify NY's current automatic renewal statute requirements or the federal negative option rule's status today. Build the portal regardless, since it is cheap and every acquirer checks it.

---

## 3. What a bank, a pension fund, and a city agency need before relying on KOANO

Each buyer runs a different gate, and KOANO is not ready for any of them today.

### 3.1 A bank (vendor risk, model risk, fair lending)

| Requirement | Basis | KOANO today |
|---|---|---|
| Model inventory entry, documentation, conceptual soundness, independent validation, ongoing monitoring, outcomes analysis | SR 11-7 / OCC 2011-12 model risk guidance (from memory; not re-retrieved) | PARTIAL. Deterministic verdict math and a replay fixture exist (strong for reproducibility). `verdict_outcomes` (migration-011) is the start of outcomes analysis. No model documentation pack, no validation report, no performance statistics |
| LLM component governance | Same; the LLM is a model component even as narrator | PARTIAL. Model pinned (`shared.ts:16`), temperature 0, contradiction guard. Prompts are not versioned in stored records; no prompt hash on verdict rows |
| AVM quality control (if used in credit) | 2024 AVM rule, effective 2025-10-01 | MISSING. See Risk 8 |
| Fair lending and nondiscrimination testing | ECOA/FHA, AVM factor 5 | MISSING. See Risk 2 |
| SOC 2 Type II, pen test, SSO/SAML, RBAC, tenant isolation | Standard TPRM | MISSING; marketed as roadmap (`for/institutions/page.tsx:54`, `PricingContent.tsx:87`). Supabase RLS exists; the API uses the service role and scopes by user id (`migration-019:15-16`) |
| Subprocessor list and DPA | TPRM | MISSING |
| Business continuity, SLA | TPRM | MISSING |

### 3.2 A pension fund (ODD, fiduciary reliance)

A pension fund's ODD team asks one question: can we reconstruct exactly why this recommendation was made, from what data, on what date, and prove nobody changed it?
- **Data lineage.** PARTIAL and strong in concept. Per-figure provenance, `fetched_at`, the appendix, and weakest-wins rollup all EXIST (`disclaimer.ts:89-124`). The missing piece is linking each verdict to the exact archived input snapshots (`content_hash`) and storing those IDs on the verdict row.
- **Immutable record.** PARTIAL, because of the silent failure in Risk 5. Fix the constraints, hash-chain the rows, and store document hashes.
- **Reproducibility.** EXISTS offline (record/replay fixture). Offer it as a service: "replay verdict X" returns byte-identical decision output from stored inputs.
- **Conflicts of interest.** MISSING. A policy that KOANO holds no positions, takes no referral fees from brokers or lenders, and is not paid by sources. `AboutContent.tsx:39` gestures at this ("We do not sell attention to agents or brokers"), but it needs to be a written policy.
- **Insurance and indemnity.** MISSING. Expect requests for tech E&O and professional liability at $5M to $10M, plus cyber at $5M or more, before a fund signs. These numbers are typical market asks from my experience, not verified quotes. KOANO's indemnity has to be narrow: IP infringement for KOANO's own code only. No indemnity for source-data accuracy, because no source warrants its data to KOANO (NYC Open Data "as is"; Freddie Mac "as is"; FRED "at the user's sole risk"). Pass that disclaimer through explicitly.
- **SOC 2 Type II and SOC 1 relevance.** SOC 2 Type II is the gate. Type I in 3 to 4 months, Type II after an observation window.

### 3.3 A city agency (procurement, public accountability)

- **Algorithmic transparency.** NYC agencies have reporting duties for algorithmic tools (Local Law 35 of 2022, from memory, unverified today). NYS has restrictions on state agency automated decision-making (the LOADinG Act, from memory, unverified). Either way, the agency will ask for a published methodology, the weights, and the disparate impact test. KOANO's deterministic math is an advantage here: publish `confidence-weighted v1` in full.
- **Open records.** Assume anything delivered to an agency is subject to FOIL. Documents must not contain third-party personal data beyond what is in the public record (Risk 4).
- **Accessibility.** Section 508 / WCAG 2.1 AA for the dashboard and tagged PDFs. Not audited here; react-pdf output is untagged by default (counsel and engineering to confirm).
- **Data residency and retention schedule,** MWBE certification and vendor registration (procurement rules, not verified today).
- **No fair housing ambiguity.** A city housing agency cannot use a tool whose stored reasoning says a tract is "late-stage gentrification." Risk 2 is a hard blocker for this buyer.

### 3.4 The trust stack in build order

1. ToS, Privacy, DPA template, subprocessor list (Risk 1). S.
2. Fair housing redesign plus the published disparate impact test (Risks 2 and 3). M.
3. Audit ledger fix: 5-state constraint, error checks, document hashes, hash chain, input snapshot IDs (Risk 5). M.
4. Model documentation pack in SR 11-7 shape: purpose, inputs, limitations, the provenance taxonomy, the deterministic math, the LLM's narrator-only role, validation plan, change log keyed to `method`/`inputs_era`. M.
5. Source rights register and the Freddie Mac letter (Risks 9 and 14). S.
6. SOC 2 Type I then Type II, SSO, RBAC, tenant isolation. L to XL.
7. E&O and cyber insurance bound, and a narrow indemnity in the MSA. S (cost, not effort).
8. Outcomes calibration report published quarterly from `verdict_outcomes`. L.

---

## 4. Top 10 problems (ranked by impact on enterprise value)

1. **No ToS, Privacy Policy or consent** (Risk 1). MISSING. S. Impact 10.
2. **Gentrification stage, income and education feed the buy/sell verdict** and persist immutably in consumer-visible reasoning; the Community page says the opposite (Risk 2). EXISTS. M. Impact 9.
3. **Crime figures mislabeled and trend miscomputed** in a live, badge-trusted signal (Risk 3). EXISTS. S. Impact 8.
4. **The audit trail can silently drop records**, and the institutional page promises it cannot (Risk 5). PARTIAL. M. Impact 8.
5. **Name-only merging of individual landlords**, with addresses printed and archived (Risk 4). EXISTS. M. Impact 8.
6. **Marketing claims contradicted by code** (cache, free documents, "miss nothing", "cancel anytime") (Risk 6). EXISTS. S. Impact 7.
7. **CMA and pricing documents for unverified users, with KOANO marks leaking** into white-label output, including file metadata (Risk 7). PARTIAL. M. Impact 7.
8. **No AVM-rule posture while marketing to mortgage officers** (Risk 8). MISSING. L. Impact 7.
9. **Freddie Mac PMMS used commercially without a written agreement** (Risk 9). EXISTS. S. Impact 6.
10. **Deletion is impossible by design** and promised to be so (Risk 10). MISSING. M. Impact 6.

## 5. Top 10 opportunities (ranked)

1. **Publish the fair housing test as a product feature.** A public, versioned "Fair Housing Audit" page: inputs excluded, disparate impact results by method era, and the banned-language gate. No competitor I know of publishes one. I did not research competitors for this report, so that is unverified. MISSING. M. Impact 9.
2. **Sell the audit ledger to institutions.** Hash-chained verdicts and documents, input snapshot IDs, and replay-on-demand: "prove what we knew on the day." This is the SR 11-7 and ODD answer in one feature. PARTIAL. M. Impact 9.
3. **An AVM-grade valuation tier for lenders** with published validation statistics, confidence per estimate, and nondiscrimination testing. A bank revenue line that the 2025 rule creates demand for. VISION (needs MLS or more sales coverage, plus independent validation). L. Impact 8.
4. **Turn the source rights register into a public "Sources and terms" ledger**, extending `/data` with terms URL, attribution and redistribution status per source. That turns a diligence weakness into the clean-title asset an acquirer pays for. MISSING. S. Impact 7.
5. **License-verified white-label for brokers.** A verified-agent badge on the letterhead (verified against the NY DOS licensee record) makes the KOANO CMA safer for the broker than a hand-built one. MISSING. M. Impact 7.
6. **Model documentation pack (SR 11-7 shape) as a downloadable artifact** for enterprise prospects. MISSING. M. Impact 7.
7. **A correction and dispute process for public-record errors**, which doubles as a data-quality moat because corrections feed back into the archive with provenance. MISSING. S. Impact 6.
8. **Crypto-shredding privacy architecture** that lets KOANO promise both immutability and erasure. MISSING. M. Impact 6.
9. **Class-aware tax packet with deadlines**, the most defensible consumer product in the Community tier. PARTIAL. M. Impact 5.
10. **City-agency mode:** published weights, FOIL-safe documents, tagged accessible PDFs. MISSING. L. Impact 5.

## 6. What I would rebuild first

**The Demand Sentiment agent and its prompt, this week.**
1. Remove `bachelors_or_higher_pct` and the gentrification-stage step from `lib/agents/demand-sentiment.ts`.
2. Re-base the agent on transaction-side signals.
3. Add the banned-language gate in `grounding.ts`.
4. Re-record the fixture.
5. In parallel, fix `fbi-ucr.ts` labels and periods, widen the provenance CHECK constraints, and publish ToS and Privacy.

Every later enterprise conversation depends on these five commits, and none needs new data. The verdict math stays deterministic. Only the inputs to one agent change, so the locked decision is respected.

## 7. The one thing that would make me say "I have never seen anything like this"

A **compliance certificate on every verdict and every document.** It would be a machine-verifiable page, keyed by the document hash, that proves:
- which inputs were used, with snapshot hashes;
- which protected-class proxies were structurally excluded, as a code-level guarantee;
- the current disparate impact test result for the method era that produced the verdict;
- the license and terms status of every source used;
- an unbroken hash chain from the input snapshots to the PDF the client is holding.

A bank examiner, a fund's ODD team or a city attorney could verify it without trusting KOANO. Most of the parts already exist in this repo: provenance, the archive's `content_hash`, the replay fixture, `method`/`inputs_era`. **VISION** for the full certificate. **MISSING** for each piece, all achievable now.

---

## 8. Grounded vs vision

- Grounded findings: Sections 2, 3.1 to 3.3 (state labels), 4.
- VISION: opportunity 3 (AVM-grade tier needs more sales data and independent validation), the full certificate in Section 7, and city-agency mode at scale.

---

## Sources

Retrieved directly (WebFetch):
- NAR Code of Ethics and Standards of Practice 2025: https://www.nar.realtor/about-nar/governing-documents/code-of-ethics/2025-code-of-ethics-standards-of-practice
- NAR summary of the AVM final rule: https://www.nar.realtor/washington-report/final-rule-on-quality-control-standards-for-automated-valuation-models
- Census Bureau API Terms of Service: https://www.census.gov/data/developers/terms-of-service.html
- Census Reporter About page: https://censusreporter.org/about/
- Freddie Mac PMMS page: https://www.freddiemac.com/pmms
- Freddie Mac Terms of Use: https://www.freddiemac.com/terms
- FRED MORTGAGE30US series: https://fred.stlouisfed.org/series/MORTGAGE30US
- NY RPL s.440 (FindLaw): https://codes.findlaw.com/ny/real-property-law/rpp-sect-440/
- NYC.gov Terms of Use: https://www.nyc.gov/home/terms-of-use.page
- Mapbox Terms of Service: https://www.mapbox.com/legal/tos
- Mapbox Product Terms landing page (the PDF itself was not retrieved): https://www.mapbox.com/legal/product-terms
- api.data.gov developer manual: https://api.data.gov/docs/developer-manual/
- NYC Tax Commission home and forms pages: https://www.nyc.gov/site/taxcommission/index.page , https://www.nyc.gov/site/taxcommission/forms/other-forms.page
- NYC Tax Commission TC 707 (2026) PDF, downloaded but not text-extractable in this environment: https://www.nyc.gov/assets/taxcommission/downloads/pdf/tc707-2026.pdf

Relied on via search-result summaries (not opened individually; counsel should read the originals):
- HUD guidance withdrawals: https://infobytes.orrick.com/2026-04-10/hud-withdraws-eight-fair-housing-guidance-documents-as-part-of-deregulatory-review/ , https://www.jdsupra.com/legalnews/hud-withdraws-eight-fair-housing-8645237/ , https://leadingage.org/hud-withdraws-wide-ranging-fair-housing-policies/ , https://nlihc.org/resource/hud-publishes-notice-removing-fair-housing-guidance-documents , https://www.nahro.org/news/hud-withdraws-eight-fair-housing-notices
- HUD disparate impact proposal: https://www.consumerfinancialserviceslawmonitor.com/2026/01/hud-proposes-to-rescind-fair-housing-act-disparate-impact-regulations/ , https://infobytes.orrick.com/2026-01-16/hud-moves-to-eliminate-disparate-impact-rules-under-fair-housing-act/ , https://www.nixonpeabody.com/-/media/files/alerts/2026/01/hud-rescinds-disparate-impact-regulations.pdf , https://www.law.georgetown.edu/poverty-journal/blog/what-huds-disparate-impact-proposal-means-for-housing-justice/ , https://bankingjournal.aba.com/2026/01/hud-proposes-to-remove-disparate-impact-from-fair-housing-act-rule/
- AVM rule effective date: https://frtracker.app/fr/2024-16197 , https://www.americascreditunions.org/node/2461 , https://compliancealliance.com/find-a-tool/tool/summary-of-final-rule-quality-control-standards-for-automated-valuation-models-avms/
- FBI caution on UCR rankings: https://politifact.com/factchecks/2017/apr/14/beto-orourke/beto-orourke-relies-disputed-rankings-calling-el-p/
- Mapbox temporary vs permanent geocoding: https://docs.mapbox.com/help/dive-deeper/understand-temporary-vs-permanent-geocoding/
- NYC Open Data terms (the page now returns 404): https://www.nyc.gov/html/data/terms.html
- NY DOS license law compilation: https://dos.ny.gov/real-estate-license-law
- NYC Tax Commission TC 707 and NYC Tax Appeals Tribunal representation rules: https://www.nyc.gov/assets/taxcommission/downloads/pdf/tc707.pdf , https://www.nyc.gov/assets/taxappeals/downloads/pdf/03_representation.pdf

Not verified today (web search budget exhausted): NY Executive Law Article 6-E appraisal exemptions; RPTL s.581; NY GBL 527-a status; the FTC negative option rule's status; NYS nonsolicitation zones; NYC Local Law 35 of 2022; the NYS LOADinG Act; NYC Human Rights Law class list; any 2025-2026 NY comprehensive privacy statute; Colorado AI Act effective date.

## Discrepancies vs the brief (section 3 of the prompt)

1. **Provenance states.** The brief says five states with weakest-wins. The engine has five, but the repo's DB constraints on `verdicts` and `documents` allow only `live` and `representative` (`supabase/schema.sql:118`, `migration-006-documents.sql:30`). Verdicts with any other rollup fail to persist (`lib/supabase/verdicts.ts:23-46`), and document audit failures are silent (`src/app/api/documents/route.ts:579-593`).
2. **"Verdicts are stored in an immutable, append-only table."** True of rows that land. Not every verdict lands (item 1), and nothing records what a document said (metadata only).
3. **FBI UCR as the crime source.** The code is NYPD-first (`fbi-ucr.ts:90-145`), with FBI as a statewide fallback on `DEMO_KEY` if no key is set.
4. **Freddie Mac PMMS listed among "free live data providers."** It is free to fetch, but its terms restrict commercial use without a written agreement.
5. **Pricing: "free (about 3 verdict runs)."** The code agrees, but marketing also promises "three generated documents, free" (`PricingContent.tsx:484`), which the code denies (`guard.ts:71-82`).
6. **"Documents with disclaimers."** Accurate for documents. The on-screen verdict has no disclaimer on the Community and Development dashboards.
7. **White-label CMA with no KOANO branding (locked decision).** Not yet true: there is the wordmark (`pdf.tsx:262`), the banner (`:455`), PDF author metadata (`:533,551`), and the DOCX header and creator (`docx.ts:66,75,334,361`).
8. **Community cluster described as building/landlord report and tax packet.** It also receives the full buy/sell verdict with agent reasoning, including the gentrification-stage text (`Cluster1Dashboard.tsx:11,18`).
