# 06. Valuation Path: $1M to $250M+

How KOANO moves through four valuation bands, what must be true at each, and the comparable transactions that justify each band. All comparables are drawn from `panel/vc_and_ma.md` §2 and `02_competitors.md`, each verified there with a URL. Implied multiples are arithmetic on cited figures. Nothing here is a forecast. It is a list of conditions.

---

## 0. Where KOANO is today (October 2026)

| Lens | Value | Why |
|---|---|---|
| Strategic acquisition, as is | **$0.5M to $2M** | A buyer gets one founder plus code it could rebuild in 2 to 4 quarters. There is no revenue, Stripe is in test mode (`lib/stripe/client.ts:2`), there is no analytics, a global 50 runs/day cap applies (`koano-guard.ts:71`), and the archive is about 10 weeks deep with a known gap. |
| Priced pre-seed, no design partners | **$4M to $7M post** | Below the 2025 median SAFE cap for a solo, pre-revenue, single-city proptech ([Carta Q2 2025](https://carta.com/data/state-of-pre-seed-q2-2025/), via `panel/vc_and_ma.md`). |
| Priced pre-seed, 3 to 5 paying design partners | **$8M to $12M post** | Moves into the median band (Henry AI's $4.3M seed and Built AI's $6M seed are the shape). |

Two findings from this audit reduce today's number further until they are fixed:
- The flagship verdicts recommend buying sites already under construction (`panel/real_estate_tycoon.md` §0).
- The pricing sheet values a co-op two-bedroom at about $149M (`panel/user_roleplay.md` problem 1).

A diligence team that finds either one prices the whole engine as unreliable. Fixing both is a precondition for every band below, not just the first.

---

## Band 1. Reaching a defensible $1M to $3M (pre-seed close or acqui-hire floor)

**Time:** 0 to 3 months.

**Proof points that must exist:**
1. No false flagship output. The new demo site survives DOB NOW and ACRIS checks, and valuation guardrails prevent building-area values on co-ops and multifamily (`05_product_roadmap.md` 30-1, 30-4, 30-5).
2. Sealed, replayable verdicts in production, so "auditable" is demonstrable (30-2).
3. Archive v2 capturing the overwritten NYC records citywide (30-3). The moat clock starts on the right asset.
4. Legal paper exists (ToS, Privacy), and the fair-housing exposure in Demand Sentiment is removed (30-8, 30-9).
5. Stripe live with one working price per tier, and the documents people pay for are reachable (30-7, 30-12).

**Metrics:** first 3 to 5 paid design partners at any price, instrumented activation (first document or first watched property within 24 hours).

**Justifying comparables:**
- Pre-seed SAFE medians (Carta Q2 2025, about $10M cap for $250K to $1M rounds).
- Gridics, a zoning data layer that reached only a $1.5M seed extension (Nov 2022), shows where public-data tooling without traction prices.

## Band 2. $10M (seed, or an early strategic acquisition)

**Time:** 6 to 15 months.

| Metric | Threshold |
|---|---|
| ARR | $0.5M to $1.5M |
| Paying logos | 15 to 30, including 3+ institutional at $18K+ ACV (paid Portfolio pilots converted to annual) |
| Verdict volume | 2,000+ per month (requires 30-11) |
| Gross margin | Measured per verdict and per customer (90-18). The engine inversion (90-1) cuts model cost roughly 4x per the AI panel's estimate |
| Calibration | Methodology published, forecast ledger live and hashed publicly (90-2), shadow panel running (90-3), first short-horizon events resolving |
| Archive | 12 months gapless on the overwritten NYC datasets, record-level |
| Data partnerships | 1 signed LOI, ideally a parcel provider (Regrid or ATTOM) |
| Product | The redesign shipped (Bench, verdict band, permalink), the land residual v1, and the multifamily pack |

**Justifying comparables:**
- Diald AI: $3.75M (Dec 2025) plus $1M (Aug 2026), a Moody's partnership, $0 to $200 per month pricing (`02_competitors.md`).
- Built AI: $6M seed, Dec 2025.
- Henry AI: $4.3M seed, Feb 2025.

A $10M post-money is a seed with real logos. A strategic buyer at this band is most plausibly ATTOM (which bought ResiShares' analytics, Jan 2026) or a brokerage acqui-hire (`panel/vc_and_ma.md` §3, ranks 7 and 11).

## Band 3. $50M (Series A/B or strategic sale)

**Time:** 18 to 36 months.

| Metric | Threshold |
|---|---|
| ARR | $5M to $8M |
| Logos | 60 to 120, with 10+ institutional at $50K+ ACV |
| Net revenue retention | 115%+ |
| Gross margin | 70%+ |
| Verdict volume | 25,000+ per month, 30%+ via API |
| Calibration | 1,000+ resolved forecasts per headline event. Directional hit rate monotonic in confidence buckets. Brier skill score positive against base rate and naive momentum with block-bootstrap CIs. Third-party reviewed |
| Archive | 24 months gapless, record-level point-in-time NYC, plus parcel-level coverage in 5+ metros through partner feeds |
| Data partnerships | 1 to 2 live `partner` feeds; the provider SDK used by a partner's own engineers |
| Enterprise | SOC 2 Type I, SSO, org tenancy, model documentation pack |
| Product | Site radar (12-1), ownership and debt graph (12-3), Verdict API (12-6) |

**Justifying comparables:**
- Reonomy to Altus, $201.5M (2021). A CRE property graph with about 115 staff. A $50M KOANO is a smaller version of that thesis with a forecast ledger Reonomy never had.
- Cherre to RealPage (July 2026, undisclosed), after a $30M Series C. The data-layer-to-strategic path is live.
- TestFit, a $20M Series A for developer feasibility.

At this band, likely acquirers are RealPage/Cherre (wanting a provenance-native reasoning layer on Cherre-connected client data), Altus (an IC-memo layer above ARGUS) and Cotality (`panel/vc_and_ma.md` §3).

## Band 4. $250M+ (strategic sale to a Moody's, MSCI or CoStar class buyer, or Series C)

**Time:** 4 to 6 years.

| Metric | Threshold |
|---|---|
| ARR | $20M to $35M |
| Logos | 300+, with 25+ top-100 managers or lenders |
| NRR | 125%+ |
| Verdict volume | 250,000+ per month, mostly embedded or API |
| Calibration | 20,000+ resolved forecasts across 3+ market cycles. Clients cite KOANO's published calibration in IC minutes and lender credit files |
| Archive | 36+ months point-in-time, 25+ metros, licensable as a standalone dataset |
| Data partnerships | 3+, one exclusive |
| Enterprise | SOC 2 Type II, data residency, API SLAs, an SR 11-7 validation by a client bank |

**Justifying comparables:**

| Deal | Price | Multiple / basis | Read-across |
|---|---|---|---|
| MSCI to Real Capital Analytics (2021) | $950M | About 13.6x ARR | Paid for 20+ years of proprietary transaction history. KOANO's analogue is the scored forecast ledger plus point-in-time capture. |
| CoStar to STR (2019) | $450M | About 7x revenue | Paid for a proprietary benchmark panel. |
| CoStar to Zonda (2026) | $800M | About 4.7x revenue | Lot-level data. |
| MSCI to First Street (announced June 2026) | $120M plus earn-out | n/a | Physical risk analytics bought by an index and risk house (MSCI release via `02_competitors.md`). Closing was expected Q3 2026; I could not confirm it has closed. |
| Fitch to Trepp (agreed April 30, 2026) | About $1B | n/a | CMBS and loan data bought for AI-ready trusted infrastructure (City AM via `02_competitors.md` §1). Close unconfirmed. |

At 7x to 14x ARR, $25M to $35M ARR supports $175M to $490M, with the premium end reserved for a buyer who cannot replicate the track record without waiting years.

---

## The one asset that changes the multiple

The convergent finding of the VC, AI and data panels: ARR gets KOANO into the comp band, and only a **published, tamper-evident, independently reviewable forecast record** moves it to the premium end. RCA and STR commanded premiums because their history could not be recreated. Buyers will not pay a premium for KOANO's free-public-data archive as it stands. They will pay for:
1. Point-in-time capture of the fields the city overwrites.
2. Years of scored, hashed forecasts on pre-registered public events.

Both are time-locked. Whoever starts first wins, and KOANO has the harness to start this quarter.

## What destroys value along the path (avoid)

| Risk | Effect |
|---|---|
| Shipping a wrong verdict to an institution | Drops a band. One IC embarrassment travels. |
| A fair-housing complaint naming KOANO's "gentrification stage" text | Ends the bank and city-agency channels. |
| Selling the archive as unique when diligence can rebuild 90% of it | Turns a premium into a discount. |
| Expanding to new metros before the NYC engine is right | Multiplies whatever is wrong. |
| Relying on temperature-based determinism past Sonnet 4.6's possible retirement (not sooner than Feb 17, 2027, per [Anthropic](https://platform.claude.com/docs/en/about-claude/model-deprecations)) | Forces a model migration that changes every verdict at once. |
