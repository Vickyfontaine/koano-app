# KOANO — Product Demo Film — VIDEO_BRIEF.md

> Build spec for a 1 to 2 minute product demo film, built in code with Remotion.
> Every frame shows real product output or real brand assets. No mocked UI that implies a capability KOANO does not have.
> Where this brief and CLAUDE.md disagree, the disagreement is flagged in Section 8, never resolved silently.
> Copy rules, enforced everywhere in this doc and in the film: no em dashes, no "not X but Y" constructions, no triads in on-screen copy except approved verbatim brand copy (see Section 3).

Status: approved concept and creative direction, revised for a finished, category-defining product film. Build is starting at Phase 0. Assets and actions still needed from the founder are in Section 8.

The film is for the KOANO website only.

---

## 1. Concept and the single message

**Concept.** KOANO is run on real NYC addresses on camera. The engine dispatches five specialist agents, converges them into a single verdict with the arithmetic shown, and then the engine is re-framed through all four product tiers, each ending in a real document that tier produces. The film closes on the monitoring and archive layer as the reason the subscription keeps earning its price.

**The single message a viewer leaves with:**

> KOANO does the analytical work of a real estate team in ninety seconds, and proves every number.

**Why this concept.** The audience is developers and institutional buyers, who test exactly the claims that depend on expensive data because that is where products lie. This film is that test passing. It is the most literally honest thing we can make: real recorded runs, every figure traceable to a named public source, the lead run asserted byte-identical on every push by the reproducibility gate. It leads with "does the work" (the verdict, the documents) and carries "shows its work" (the provenance badges) in every frame.

**Featured addresses.** Each tier is shown on a property that fits its real user, so the film never asks a homeowner to analyze a garage lot:
- **Spine, and the Development and Portfolio subject: 175 3rd Street, Gowanus, Brooklyn.** It is the only address with a frozen, dated, fully-live recorded verdict (`src/components/marketing/exampleVerdict.ts`, recorded 2026-08-26), it is building class G9 (a commercial/garage lot with 97% unused FAR), and it is the natural development and portfolio subject.
- **Community and Transaction subject: a fully-live residential address from the approved set, proposed as 51 Jay Street, DUMBO, Brooklyn** (verified residential and live at record time; falls back to 420 Kent Avenue or a swap if the condo billing lot complicates a single-property CMA or tax appeal). A homeowner and a broker bring a home, not a garage lot.

Both are NYC, so both roll up `overall_provenance: live`. A non-NYC address would roll up `coverage_absent`, so the film uses NYC addresses only (acceptance rule, Section 5).

**Runtime, locked:** roughly 96 seconds. Structure: cold open (~4s) · Act 1 (~30s) · Act 2 (~50s, the heart) · Act 3 (~8s) · end card (4s). The "ninety seconds" in the copy is the product's user-facing analysis time, not the film length: the product's own empty-state copy says "about a minute and a half," and the pipeline runs about sixty seconds of compute, so "ninety seconds" is the honest user-facing number.

---

## 2. Beat sheet (30 fps)

Frame math is at 30 fps. `[a–b]` is the frame range. Motion is frame-driven (Section 4). Every component named is real and lives at the path given; "captured still" means a real frame of the running product rasterized to a PNG (Section 6), never a redraw.

### Cold open — "the week it used to take" (0:00–0:04 · frames 0–120)

| Field | Detail |
|---|---|
| Visual | Full-bleed signature brand blue (`--brand-blue #A8C4D4`). KOANO wordmark small, top-left, in `--near-black`. One line of the brand stack sets center-screen in `--near-black`. No imagery, no non-KOANO footage. |
| Motion | Line eases up from below with a slow push-in on the whole field (scale 1.04→1.00), holds, then transitions into the white address scene (see transition note below). Easing `[0.16,1,0.3,1]`. |
| On-screen text | `The analysis took a week. Now it takes ninety seconds.` |
| Audio cue | Low pad into the first music note on the final word (105 BPM bed). |
| Asset / component | Type only, on brand blue. Brand stack for the line, DM Mono for the wordmark lockup. |

Transition out (blue → white): the white address scene rises from below to cover the blue over ~15 frames, and a thin brand-blue band settles at the top into the nav strip, so the blue becomes the nav accent rather than flashing away. Text contrast: `--near-black` on `--brand-blue` is about 8:1, readable at phone size.

Honesty note: "ninety seconds" is the product's analysis time and matches its own empty-state copy. This is the only B-concept borrowing, held to 4 seconds with zero external footage.

### Act 1 — the engine runs (0:04–0:34 · frames 120–1020)

Lead address: 175 3rd Street, Gowanus.

**Scene 1.1 — the address (0:04–0:09 · 120–270)**
| Field | Detail |
|---|---|
| Visual | An address field on white. The address types in and resolves to a confirmed-address chip with a `location_confidence: confirmed` marker. |
| Motion | Characters reveal on frame cadence (not a real keystroke timer). The field sits on a subtle parallax plane; the chip settles in with a short push-in, no bounce. |
| On-screen text | field value `175 3rd Street, Brooklyn` · caption `One address. The entire public record, read at once.` |
| Audio | Soft key tick per revealed word; a settle tone on resolve. |
| Component | `AddressInput` styling + `panels.tsx` chrome. Data: `EXAMPLE_VERDICT_ADDRESS`. |

**Scene 1.2 — five agents fire in parallel (0:09–0:22 · 270–660)**
| Field | Detail |
|---|---|
| Visual | Five panels arrive in a shallow-perspective fan, one per agent: Market Timing, Infrastructure, Demand & Sentiment, Risk & Volatility, Regulatory & Policy. Each fills with 2 to 3 live figures, and under each figure a source line and a solid `live` provenance badge settle into place. |
| Motion | Panels enter on a perspective move (slight Z and rotateX, settling flat) with 0.08s stagger. Figures resolve to their real values. Badges settle (opacity, no bounce). |
| On-screen text | header `Five specialist agents, working in parallel.` Figures are the real ledger values, e.g. `Median comp price $1,154 / sq ft · NYC DOF Rolling Sales`; `DOB permits in tract (24 mo) 675 · NYC DOB`; `FEMA flood zone X (minimal) · FEMA NFHL`; `Zoning M1-4/R7-2 · NYC MapPLUTO`; `Median household income $165,179 · US Census ACS`. |
| Audio | Five staggered soft attacks; a light rising bed as figures populate. |
| Component | `ProvenanceBadge`, `panels.tsx` (`Row`, `PanelHeader`, `monoLabel`, `fmt*`). Data: the 17-figure `EXAMPLE_LEDGER`, grouped by `agent`. |

**Scene 1.3 — synthesis converges (0:22–0:31 · 660–930)**
| Field | Detail |
|---|---|
| Visual | Thin data lines flow out of the five agent panels and into a single synthesis panel, which draws each agent's contribution as it arrives. `VerdictMathPanel` renders the real arithmetic: per-agent contributions on a diverging bar, the score bands, the structural nudge line, the aggregate resolving to the final score, the threshold, and the verdict word. |
| Motion | Data lines travel agent→synthesis on frame; bars grow to their real contributions as each line lands. The `aggregate 0.23` and `structural_nudge +1` add to `final 1.23`; the score marker crosses the `buy ≥ 1` threshold and the verdict locks to BUY. A single light sweep crosses the panel on the verdict lock. Confidence 69 is rendered at UI scale only, with no count-up and no hold; BUY and the `97% unused FAR` driver carry the moment. |
| On-screen text | caption `Every weight and every threshold, on the record.` Driver chip (real): `97% unused FAR, large as-of-right upside`. |
| Audio | Lines and bars rising; one clean swell as the verdict locks. |
| Component | `VerdictMathPanel` (drop-in, prop-driven) with `ScoreBands` + `DivergingBar`. Data: `EXAMPLE_VERDICT.weighting_breakdown`. |

**Scene 1.4 — the flagship line (0:31–0:34 · 930–1020)**
| Field | Detail |
|---|---|
| Visual | Verdict panel recedes on a slight push-back; the brand line sets center on white. |
| Motion | Line eases up and holds. |
| On-screen text | `Five agents. One verdict. Every step auditable.` (approved verbatim, triad exempt per decision) |
| Audio | Music settles to a held chord. |

### Act 2 — one engine, four tiers (0:34–1:24 · frames 1020–2520)

Order: Community, Transaction, Development, Portfolio (ascending altitude, building to the institutional climax). Each tier is shown on the property that fits its user: Community and Transaction on the residential address, Development and Portfolio on the Gowanus site. Each chapter is ~12.5s (375 frames): a diorama open (~2.5s), a dashboard moment (~5s), a live document assembling page by page (~5s). The Development and Portfolio maps are populated by a set of real recorded NYC verdicts (Section 5, Section 8 address set).

**Chapter template per beat:**
- Diorama open: the tier's `public/renders/*.webp` fills frame (bottom-anchored, as on the site) with a slow parallax push toward its empty center. Super: tier name and the cluster tagline sentence only. No price.
- Transition: a camera push continues through the render's empty center and resolves into that tier's dashboard, so the diorama becomes the doorway into the product.
- Dashboard moment: the tier's real components on its subject address. Maps are captured stills composited from 2x layer passes (base, markers, overlays) so they can parallax.
- Document assembling: the real sample PDF for that tier, rasterized to page PNGs, fanning in with depth, page by page. Only pages whose figures are all live are selected.

**Chapter 1 — Property intelligence, Community (0:34–0:47 · 1020–1395)** · subject: residential address
| Beat | Detail |
|---|---|
| Diorama | `public/renders/for-community.webp`. Super: `Property intelligence` · `Know what's happening to your property's value before your neighbors do.` |
| Dashboard | C1: `PropertyMap` (captured still, property + flood overlay) + `ValuationPanel` + `AlertsPanel` (`deriveAlerts(detail)`, offline-safe). Owner and landlord names are redacted on screen. |
| Document | Property Tax Appeal Evidence Packet, generated on the residential address. Asset: regenerated tax-appeal PDF (rasterized, live-figure pages only). Caption: `Property Tax Appeal Evidence Packet.` |
| Motion | Diorama parallax; camera push into the dashboard; panels settle on a perspective move; tax-appeal pages fan in with depth. |
| Audio | Warmest, most human chapter tone. |

**Chapter 2 — Transaction intelligence (0:47–1:00 · 1395–1770)** · subject: residential address
| Beat | Detail |
|---|---|
| Diorama | `public/renders/for-professionals.webp`. Super: `Transaction intelligence` · `Find opportunities before they hit the MLS.` |
| Dashboard | C2: `CompsScatter` ($/sqft scatter via the real `Scatter`, clock frozen) + `PricingPanel` band + `MarketVelocityPanel` tiles, on the residential address. |
| Document | Comparative Market Analysis (PDF and DOCX), generated on the residential address. Asset: CMA sample PDF, generated in build Phase 3 (the type is live with a `SAMPLE_MODELS` entry). Caption: `Comparative Market Analysis.` then `Client-ready.` (see Section 8: "White-labeled" was verified false and dropped). |
| Motion | Camera push into the dashboard; scatter points populate; pricing band resolves; CMA pages fan in with depth. |
| Audio | Lighter, quicker chapter feel. |

**Chapter 3 — Development intelligence (1:00–1:13 · 1770–2145)** · subject: 175 3rd Street
| Beat | Detail |
|---|---|
| Diorama | `public/renders/for-developers.webp` (4128×2304). Super: `Development intelligence` · `Find your best site.` |
| Dashboard | C4 multi-site read: `MultiSiteMap` (captured still, populated with 3 real recorded NYC sites from the approved set, lot polygons) beside the entitlement-risk read from the regulatory-policy agent (blended score), zoning `M1-4/R7-2`, built FAR `0.11` (97% unused), LIHTC `Difficult Development Area`. `DivergingBar` for the site ranking. Marker labels are hidden except 175 3rd Street. |
| Document | Development Site Screening Memo. Asset: `screening-memo-175-3rd-street.pdf` (rasterized, live-figure pages only). Caption: `Development Site Screening Memo.` |
| Motion | Camera push into the dashboard; the three-site map settles; ranking bars grow; screening-memo pages fan in with depth. |
| Audio | Chapter downbeat; page ticks. |

**Chapter 4 — Portfolio intelligence (1:13–1:24 · 2145–2520)** · subject: 175 3rd Street in an institutional portfolio
| Beat | Detail |
|---|---|
| Diorama | `public/renders/for-institutions.webp`. Super: `Portfolio intelligence` · `Monitor everything.` (approved-copy fragment; reconciled by Act 3's weekly honesty, Section 8). |
| Dashboard | C5: `PortfolioMap` (captured still, populated with the full approved set of real recorded NYC verdicts, risk-tinted markers) + `PortfolioOverview` figures + `ProvenanceLedger` (`defaultOpen`, showing `location_confidence` beside provenance). Marker labels are hidden except 175 3rd Street. |
| Document | Investment Committee Memo, the long-form crown-jewel doc, in PDF and DOCX. Asset: `koano-ic-memo-175-3rd.pdf` (rasterized, live-figure pages only). A small `PDF · DOCX` chip. Caption: `Investment Committee Memo.` |
| Motion | Camera push into the dashboard; portfolio markers resolve across the map; ledger rows cascade; IC memo pages fan in with depth. |
| Audio | Fuller instrumentation for the institutional peak; resolves into Act 3. |

### Act 3 — why it keeps earning (1:24–1:32 · frames 2520–2760)

**Scene 3.1 — monitoring (1:24–1:29 · 2520–2670)**
| Field | Detail |
|---|---|
| Visual | The monitoring feed shows a real detected change with its before and after snapshot values (grounding is structural: fixed templates, verbatim snapshot values). Owner and landlord names are redacted; addresses hidden except 175 3rd Street. |
| Motion | One notification row eases in and settles; the feed sits on a subtle parallax plane. |
| On-screen text | `Every Monday, you know what changed.` |
| Audio | A quiet notification chime, once. |
| Component | `MonitoringFeed` or `AlertsPanel` (patched to accept a `previewData` prop for the render). Data: a real notification row shape from `src/app/api/notifications/route.ts`. |

**Scene 3.2 — the archive (1:29–1:32 · 2670–2760)**
| Field | Detail |
|---|---|
| Visual | `ArchiveTrend` shown as a growing record: a real fully-covered recent window whose cells fill in, with no gap cells and no start date on screen. Never interpolated or backfilled. |
| Motion | Cells fill left to right on frame, with a gentle depth push as the grid completes. |
| On-screen text | `A proprietary archive of the city, compounding daily.` |
| Audio | Music lifts toward the close. |
| Component | `ArchiveTrend` with `previewData` (real `ArchiveResponse` shape), filtered to a fully-covered window. |

**Scene 3.3 — end card (1:32–1:36 · 2760–2880)**
| Field | Detail |
|---|---|
| Visual | Full-bleed signature brand blue (`--brand-blue`), matching the cold open. The KOANO logo is the lead element, centered, above the category line and the CTA. Logo in `--near-black` (see Section 8: a near-black logo variant is required; the current `logo.png` is blue and will not read on brand blue). Category line and URL in `--near-black`. |
| Motion | Logo eases up on a slow push-in; category line and CTA follow with a short stagger; CTA arrow nudges once. |
| On-screen text | KOANO logo · `The real estate reasoning engine.` · CTA pill `Run your first verdict ↗` · URL text `koano.co` |
| Audio | Final resolved chord and tail. |
| Asset | Near-black KOANO logo variant (Section 8) on brand blue. CTA pill treatment below. |

Transition in (white → blue): the last white archive scene recedes with a slight push-back as the brand-blue field wipes up from the bottom over ~18 frames (matching the CTA's upward nudge), the logo rising as the blue lands. Not a flash.

CTA pill on brand blue: the default `.btn-primary` is brand-blue on near-black text and would vanish on a brand-blue field, so the end-card pill inverts it: a solid `--near-black #0D2B3E` fill with white label and a white `↗`, plus a soft raised shadow. This keeps the CTA clearly visible on brand blue. Alternative if preferred: a white pill with `--near-black` text.

Logo sizing: on the 1920×1080 master the logo caps at about 200px tall; on the 1080×1920 vertical about 240px; both scale so the mark reads clearly at phone size (never below roughly 96px effective height at typical phone viewing).

---

## 3. On-screen copy, every super (KOANO locked voice)

Rules applied: no em dashes, no "not X but Y", no triads except approved verbatim brand copy. Approved verbatim lines (the flagship and the cluster taglines) are retained as locked copy, consistent with the founder's decision to exempt the flagship triad; all newly written supers below obey the no-triads rule.

**Newly written supers (must obey all rules):**
1. Cold open: `The analysis took a week. Now it takes ninety seconds.`
2. Address caption: `One address. The entire public record, read at once.`
3. Agents header: `Five specialist agents, working in parallel.`
4. Synthesis caption: `Every weight and every threshold, on the record.`
5. Monitoring: `Every Monday, you know what changed.`
6. Archive: `A proprietary archive of the city, compounding daily.`
7. Per-chapter document captions (document name only): `Property Tax Appeal Evidence Packet.` · `Comparative Market Analysis.` (adds `Client-ready.`) · `Development Site Screening Memo.` · `Investment Committee Memo.`

**Tier supers (Act 2 dioramas): tier name plus the cluster tagline sentence only. No price.**
- `Property intelligence` · `Know what's happening to your property's value before your neighbors do.`
- `Transaction intelligence` · `Find opportunities before they hit the MLS.`
- `Development intelligence` · `Find your best site.`
- `Portfolio intelligence` · `Monitor everything.`

**Approved verbatim copy (locked, used as-is):**
- Flagship: `Five agents. One verdict. Every step auditable.`
- Category line: `The real estate reasoning engine.`
- CTA: `Run your first verdict` with the trailing `↗`, linking to `/signup`; the visible URL text is `koano.co`.
- Cluster tagline sentences (one per Act 2 chapter), drawn from CLAUDE.md Section 13. The Community line is trimmed to its first clause, `Know what's happening to your property's value before your neighbors do.`

**Data readouts** (verdict word, confidence, figures, sources) are rendered by the real components from real data. They are product output, not copy, and are exempt from the prose rules. No prices appear anywhere in the film.

---

## 4. Aesthetic rules for motion (derived from our tokens)

Look: white and pale-wash through Acts 1 and 2 (the product core), with the two bookends (cold open and end card) on full-bleed signature `--brand-blue #A8C4D4` as a brand field. All other backgrounds are `--white` or `--pale-wash`; `--near-black` is used as text throughout, including on the brand-blue bookends, where `--near-black` on `--brand-blue` measures about 8:1 contrast and reads cleanly at phone size.

**Color.** Only the CSS variables in `src/app/globals.css`. Signature `--brand-blue #A8C4D4` for section numbers, synthesis, chips, and the two bookend fields. Signals `--signal-positive/-warning/-negative` for verdict and provenance only. Chart series use the domain hues in `src/components/ui/charts/domains.ts` (true-pastel fills with `_EDGE` outlines); saturated color stays reserved for status and value scales.

**Typography (matches koano.co exactly, see Section 8 font finding).** Headlines and body use the site's exact stack `Neue Montreal, DM Sans, system-ui, sans-serif` at 700 for headlines (`-0.02em`) and 500 for sub-heads; because the site serves neither Neue Montreal nor DM Sans, this renders as `system-ui` today, which the film reproduces by rendering on macOS so `system-ui` resolves to San Francisco, exactly as the founder sees the site. DM Mono (Google, OFL, actually served by the site) is used for all data, labels, sources, and section numbers at `+0.08em`, and is vendored locally for a deterministic render. Section-number eyebrows 11px `--brand-blue`. Sizes follow the `.text-*` scale in globals.css.

**Radius and elevation.** Radius tokens `--radius-chip 8 / --radius-inner 12 / --radius-card 16 / --radius-deep 20`; pills at 100px for buttons and chips. Navy-tinted shadows (`--shadow-flat/-raised/-hover`), never pure-black drops. Depth moves add real perspective, not fake drop-shadow inflation.

**Motion, frame-driven and cinematic.** Every animation is driven by `useCurrentFrame()` + `interpolate()` / `spring()`, never CSS transitions, CSS keyframes, JS timers, or Framer Motion (none of those render deterministically headless). The one constant is the easing curve `cubic-bezier(0.16, 1, 0.3, 1)`, matching `.btn-primary` and the site. This film is dynamic, not a restrained fade-up reel:
- Push-ins and parallax on the renders. Each diorama drifts toward its empty center, and a camera push continues through that center into the tier's dashboard, so the render is the doorway into the product.
- Perspective moves on panels: agent and dashboard panels enter with a slight Z and rotateX, settling flat, never a flat fade.
- Data lines flow from the five agents into synthesis in Scene 1.3, drawing each contribution as it lands.
- A single light sweep crosses the verdict panel on the verdict lock. It is the one hero flourish; used once.
- Documents fan in with depth, page over page, rather than sliding flat.
- Bookend transitions are directional push/wipe moves (blue→white rise on the way in, white→blue wipe-up on the way out), never a hard color cut.
- Stagger 0.08s (about 2.4 frames) between siblings. No bounce, no cartoon overshoot. Confidence 69 uses UI scale only, with no count-up and no hold.
- Verdict lock, chapter downbeats, and the two bookends are the accent moments; everything else stays measured so the accents read.

**Provenance styling carried into the film.** The convention from `domains.ts` and `ProvenanceBadge` holds on screen: `live` renders as a solid badge; `representative` would render hatched (diagonal fill) with a `becomes live with [source]` note. Because every featured address rolls up fully live and every featured document page is selected for live figures only, no representative or hatched figure appears anywhere in the film; every badge and every ledger row is solid live. The hatched convention is documented for completeness and is deliberately unused. This is the visual proof of the integrity layer, carried by the badges throughout rather than in a dedicated section.

---

## 5. Asset inventory

**Exists in repo, use directly:**
- Renders: `public/renders/{for-developers,for-institutions,for-professionals,for-community}.webp` (4128×2304, ≈16:9), `menu-hero.jpg` (2267×1114), `cta.webp` (3840×1319) if a background is wanted.
- Data: `src/components/marketing/exampleVerdict.ts` (`EXAMPLE_VERDICT`, `EXAMPLE_LEDGER`) and the fuller `scripts/fixtures/nyc-175-3rd-st.json`.
- Sample documents for the Gowanus tiers (rasterize to page PNGs, live-figure pages only): `screening-memo-175-3rd-street.pdf`, `koano-ic-memo-175-3rd.pdf` (+ `.docx`). Fallbacks available: `koano-entitlement-memo.pdf`, `comparison-brief-3-sites.pdf`, `koano-asset-one-pager.pdf`, `koano-monday-briefing.pdf`.

**Must be generated or recorded (in build):**
- The residential subject's documents: regenerate the Property Tax Appeal Evidence Packet and generate the CMA on the residential address (51 Jay Street or the approved swap). The existing `live-tax-appeal-fresh.pdf` is for 175 3rd Street and is not used for the Community chapter.
- CMA sample PDF. The `cma` type is live with a `SAMPLE_MODELS` entry; run the doc engine to dump a PDF on the residential address. If it cannot be generated cleanly, fall back to the Pricing Recommendation Sheet.
- Recorded NYC verdicts for the maps: 8 to 15 real verdicts across the approved address set (Section 8), recorded via a script on the direct pipeline path (bypasses the UI spend guard) into frozen JSON fixtures, so `PortfolioMap` (all of them) and `MultiSiteMap` (a 3-site subset) render populated with real risk-tinted markers.
- **Acceptance rule (hard):** every recorded verdict in the set must roll up `overall_provenance: live`. Any address that does not is swapped out and re-recorded until the whole set is live. Non-live verdicts never appear in the film.
- Rasterized page PNGs for every featured PDF (for example via `pdftoppm` at high DPI), so pages can fan in as images. Select only pages whose figures are all live.
- Captured map stills, at 2x, in layer passes: for `PropertyMap` (C1), `MultiSiteMap` (C4), `PortfolioMap` (C5), capture the base map, the marker layer, and any overlay (flood, lot polygon, risk tint) as separate 2x PNG passes from the running app with a valid Mapbox token, so they can be composited and parallaxed. Marker labels are hidden except 175 3rd Street. Live Mapbox does not render reliably in headless Chromium, so these are captured once and placed as `<Img>`.
- DM Mono font files vendored into `/video/fonts` for a deterministic render (Google, OFL, the face the site actually serves). Headline and body use the site's `system-ui` stack, so no other font file is needed (Section 8 font finding).
- A near-black KOANO logo variant for the end card (Section 8).
- A music bed: restrained ambient-electronic, built to a 105 BPM placeholder (Section 6), plus light UI sound design.

**Must be recorded (screen or camera):** nothing. The only "capture" is the map stills above. All other UI is re-rendered from real components and real data, so there is no screen recording and no external footage anywhere in the film.

---

## 6. Technical architecture

**Placement.** A `/video` subfolder in this repo (not `/remotion`, to avoid shadowing the `remotion` npm import). It shares the repo `node_modules`, React 18, and the `@/*` path alias, so it imports app components directly. Files: `video/src/Root.tsx` (registers compositions), `video/src/index.ts` (`registerRoot`), `video/remotion.config.ts`, `video/src/compositions/*`, `video/src/scenes/*`, `video/fonts/*`, `video/assets/*` (rasterized PDFs, map stills, recorded verdict fixtures).

**Install (build phase, exact-pinned).** `remotion` + `@remotion/cli`, `@remotion/tailwind` (Tailwind v3 path), `@remotion/fonts`, optionally `@remotion/player` for in-app preview. Agent Skills via `npx skills add remotion-dev/skills`; the local `remotion` and `remotion-best-practices` skills are invoked during build.

**Importing real components.**
- Tailwind v3 wired through `enableTailwind` in `remotion.config.ts`, with the content globs pointed at `src/**/*.{ts,tsx}`. Import `src/app/globals.css` in `Root.tsx` so the entire `:root` token block (the `--brand-*` palette, radius, shadow, signal variables) is present. Without this, components render as unstyled black text.
- `'use client'` is harmless under Remotion's webpack bundler. The repo uses no `next/image` and no `next/font`, so those two common Next incompatibilities do not apply. Any component reaching for `next/navigation`, `next/link`, or server-only APIs is swapped for a plain equivalent; the target presentation components do not.
- Components are driven purely by props from the fixtures. Drop-ins with no change: `VerdictMathPanel`, `ProvenanceLedger` (pass `defaultOpen`), `ProvenanceBadge`, the four charts, `panels.tsx`. Small forks: `ReasoningChain` (force the chain open), `VerdictCard` (pin date and locale). Patch to accept a `previewData` prop: `MonitoringFeed` (it fetches unconditionally today). `ArchiveTrend` and `AlertsPanel` already accept preview data or fall back offline.

**Replacing Framer Motion and CSS transitions.** All entrance and staging motion is re-authored against `useCurrentFrame()` with `interpolate` and `spring`, including the push-ins, parallax, perspective moves, data-line flows, light sweep, document fans, and bookend transitions described in Section 4. `HeroDashboard` is a visual reference only; its `setTimeout` staging is rebuilt frame-driven and fed from `EXAMPLE_VERDICT`. Component-internal Framer Motion entrances are neutralized (components are imported for structure and styling; the film owns the motion).

**Maps and fonts made deterministic.** Maps are pre-captured 2x PNG stills in layer passes, composited and placed as `<Img>` (no live GL in the render). DM Mono is loaded from vendored local files via `@remotion/fonts` `loadFont`, gated with `delayRender` / `continueRender`; headline and body use the site's `system-ui` stack and the render runs on macOS so it resolves to San Francisco, matching the site.

**Determinism.** No on-mount fetching in the render path; all data is props from `exampleVerdict.ts`, the JSON fixture, the recorded map fixtures, and the sample PDFs. Freeze the clock (pin `Date.now` and `TZ`) so `CompsScatter` (computes its axis from `Date.now()`) and `VerdictCard` (`toLocaleString`) produce identical frames every render.

**Audio.** Music bed (restrained ambient-electronic, 105 BPM placeholder) and sound-design cues added with Remotion `<Audio>` on a dedicated track, timed to the beat sheet. No voiceover.

**Output formats.** Two compositions in `Root.tsx` sharing the same scene components, branching layout on `useVideoConfig()`:
- Master: `1920×1080`, 30 fps, h.264 mp4, plus an optional ProRes master for archival.
- Vertical cut (fast-follow, after the master is approved): `1080×1920`, 30 fps, mp4. The vertical reflows multi-column dashboard moments into stacked single-column layouts and re-anchors supers; it is a real layout branch, not a center-crop.
- Render via headless Chromium: `npx remotion render <composition-id> out/<name>.mp4`.

---

## 7. Honesty ledger

Every capability the film shows, mapped to what proves it is live. Anything without a proof line is cut.

| Shown in film | Claim it makes | Proof in the codebase |
|---|---|---|
| Act 1 verdict, BUY, fully live | This exact verdict is a real recorded run, not a mockup | `src/components/marketing/exampleVerdict.ts` (recorded 2026-08-26) + `scripts/fixtures/nyc-175-3rd-st.json`; asserted byte-identical every push by the reproducibility gate `scripts/test-fixture.ts` (CLAUDE.md §07C) |
| 17 sourced figures, each `live` with a named source | Every figure is live from a real public source | `EXAMPLE_LEDGER` in `exampleVerdict.ts`; live providers in `lib/providers/real/*` (DOF sales, FHFA, Freddie PMMS, HUD FMR, DOB, Census ACS, CFPB HMDA, IRS migration, FEMA NFHL + NRI, EPA FRS, NYPD, MapPLUTO, HUD QCT/DDA, IRS QOZ) |
| Verdict math (contributions, nudge, aggregate→final, threshold) | The arithmetic is reproducible and shown | `EXAMPLE_VERDICT.weighting_breakdown`; `VerdictMathPanel.tsx`; `lib/agents/{synthesis,direction,confidence,entitlement}.ts` |
| Provenance badges, solid live throughout | A NYC verdict rolls up fully live; provenance is real and per-figure | `lib/providers/provenance.ts` (five-state taxonomy), `ProvenanceBadge.tsx`, `overall_provenance: "live"` in the fixture |
| Development: entitlement risk, FAR, zoning, LIHTC | These are live NYC development reads | `lib/agents/regulatory-policy.ts`, `lib/providers/real/{nyc-zoning,hud-qct-dda}.ts`; ledger rows in `exampleVerdict.ts` |
| Development document | The Site Screening Memo is a real generated document | `screening-memo-175-3rd-street.pdf` (PDF `/Title` = "Development Site Screening Memo"); `lib/documents/implemented.ts` key `site_screening_memo` |
| Portfolio document (PDF + DOCX) | The IC Memo is a real long-form generated document in both formats | `koano-ic-memo-175-3rd.pdf` + `.docx`; `implemented.ts` key `ic_memo`, `formats: ['pdf','docx']` |
| Portfolio and multi-site maps populated | Markers are real recorded NYC verdicts that all roll up live, not decorative pins | Recorded in build via the direct pipeline path into frozen fixtures with the live acceptance rule (Section 5); `PortfolioMap.tsx`, `MultiSiteMap.tsx` |
| Transaction: comps scatter, pricing, velocity | Live NYC comps and market reads on a residential address | `lib/providers/real/nyc-sales.ts`; `CompsScatter.tsx`, `PricingPanel`, `MarketVelocityPanel` |
| Transaction document, "Client-ready" | The CMA is a live document type, PDF and DOCX, broker-editable | `implemented.ts` key `cma`, `formats: ['pdf','docx']`, `SAMPLE_MODELS` entry; DOCX is broker-editable. "White-labeled" dropped (renderer stamps KOANO branding, `lib/documents/render/{pdf.tsx,docx.ts}`) |
| Community: valuation, flood, alerts | Live property reads and derived alerts on a residential address | `PropertyMap.tsx`, `ValuationPanel`, `AlertsPanel` (`deriveAlerts`) |
| Community document | The Tax Appeal Packet is a real generated document | `tax_appeal_packet` in `implemented.ts`; regenerated on the residential address (`scripts/verify-documents-live.ts` build path) |
| Documents carry the mandatory disclaimer | Every page is compliant (present, not called out on screen) | `lib/documents/disclaimer.ts` (`DOCUMENT_DISCLAIMER`), enforced by `scripts/test-disclaimer-regression.ts` |
| Act 3 monitoring, weekly | Changes are surfaced weekly, on a Monday digest; not real-time | `lib/monitor/{detect,scan,digest}.ts` (deterministic weekly diff, Monday digest), CLAUDE.md §07B |
| Act 3 archive, growing record | A longitudinal archive accrues from a daily cron; the film shows a real fully-covered window, never interpolated or backfilled | `lib/archive/capture.ts` (daily fan-out), `ArchiveTrend.tsx`, `archive_coverage` view (CLAUDE.md §07A) |

**Cut because it cannot be proven as claimed / would mislead:**
- Any "always watching" or real-time monitoring language. Monitoring is weekly, surfaced as a Monday digest (KOANO_COPY.md).
- The stale "three of five agents run on representative data" line. It is outdated; the NYC verdict pipeline is fully live. Representative data is confined to pro-forma benchmarks and commercial deals, which feed documents and dashboards, never the verdict.
- Any counted claim about the number of sources. Sources are named by category, never quantified (standing copy rule).
- "White-labeled" on the CMA. Verified false: the renderer stamps KOANO branding on every page. Only "Client-ready" ships.
- A live, animated Mapbox map presented as rendering in real time. Maps are honestly real captured frames of the running product.
- `pro_forma_summary` as a shippable deliverable. It is `blocked` on CoStar and is not shown; no representative or hatched figure appears anywhere, and featured document pages are selected for live figures only.
- Any archive coverage gap, genesis date, or start date on screen. The archive is shown as a real fully-covered window.
- Any non-NYC address (would roll up `coverage_absent`). The recorded map set is all NYC and every verdict must roll up live.
- Address labels on the maps and feed, except 175 3rd Street. Owner and landlord names are redacted on screen.
- Prices. No price appears anywhere in the film.

---

## 8. Risks, findings, and what is needed from the founder

**Resolved findings (verified this session):**
1. **Font, matched to the live site.** koano.co links the Fontshare `neue-montreal` URL (which returns an empty body, serving nothing) and Google `DM Mono` (which works). The compiled CSS has zero `@font-face` rules. Declared stacks: headlines and body `Neue Montreal, DM Sans, system-ui, sans-serif`; data `DM Mono, monospace`. So the site today renders DM Mono for real and renders headlines and body in `system-ui` for any visitor without Neue Montreal or DM Sans installed. The film matches this exactly: identical stacks, DM Mono vendored for determinism, headline and body as `system-ui`, rendered on macOS so `system-ui` is San Francisco, exactly as the site appears. Nothing is bought, licensed, or substituted. (Separately, this means the public site is not actually rendering Neue Montreal; that is a live-site matter outside this film.)
2. **CMA is not white-labeled.** The PDF and DOCX renderers stamp "KOANO" on every page (`lib/documents/render/pdf.tsx` `brandMark`; `lib/documents/render/docx.ts` header, "Prepared with KOANO", `creator: 'KOANO'`). "White-labeled" is dropped; the caption keeps only "Client-ready," which is true (broker-editable DOCX).
3. **175 3rd Street is commercial (class G9).** Kept as the spine and the Development and Portfolio subject; Community and Transaction move to a residential address (rule 1).
4. **Prices removed.** No price supers anywhere; the Stripe publishing gate is dropped.
5. **Bookends are brand blue.** Cold open and end card use `--brand-blue` as a full-bleed brand field, text in `--near-black` (about 8:1 contrast, phone-legible). The prior near-black-background deviation is dropped.

**Needed from the founder (assets and one confirmation):**
1. **Near-black logo variant.** The current `public/logo.png` is transparent (good) but the mark is pale-blue/brand-blue, so it will not read on the brand-blue end card. Provide a near-black (`#0D2B3E`) monochrome version of the KOANO mark, ideally an SVG, or a transparent PNG at least 1024px wide. It will sit as the lead element on the end card.
2. **Confirm the residential feature address.** Proposed: 51 Jay Street, DUMBO (in the approved set). If you prefer a small-home archetype (1 to 3 family) over a DUMBO condo for the "your property" story, name a swap and I will use it; either way it is verified residential and live at record time.
3. **Mapbox token, locally.** Capturing the 2x layered map stills needs a working `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` in the local environment. Confirm one is available (CLAUDE.md §18 lists it as a placeholder; later notes say it is set in Vercel).
4. **Music track.** A restrained ambient-electronic bed at 105 BPM will be used as a placeholder; supply the final licensed track when ready.
5. **CTA route.** `koano.co/signup` must be reachable pre-auth (the repo has a `/signup` Clerk route). Confirm the production domain serves it.

**Build risks to manage:**
- **Recording spend.** Recording 8 to 15 real verdicts costs real Anthropic spend and about 15 to 25 minutes; run once, off the guarded UI path, into frozen fixtures, honoring the live acceptance rule.
- **Component forks.** `MonitoringFeed` needs a small `previewData` prop patch; `ReasoningChain` and `VerdictCard` need minor forks. Additive, but they touch shared files.
- **CMA sample.** The `cma` type is live but has no root sample; generating one is low-risk, with the Pricing Recommendation Sheet as a fallback.

**Approved decisions (locked):** address set approved with rules 1 (building fit) and 5 (live acceptance); music restrained ambient-electronic at 105 BPM placeholder; end-card tagline stays "The real estate reasoning engine."; vertical cut is a fast-follow after the master.

---

## Appendix — build plan (Phase 4)

Each phase ends in something reviewable in Remotion Studio at full speed. "You" items are founder actions.

- **Phase 0 — Scaffold and skills.** Create `/video`, install Remotion + skills, wire Tailwind v3 + `globals.css` tokens + DM Mono locally, render a blank composition. You: provide the near-black logo variant, confirm a working local Mapbox token, confirm the residential feature address.
- **Phase 1 — Tokens, fonts, motion kit.** Build the frame-driven motion primitives (push-in, parallax, perspective, data-line flow, light sweep, document fan, bookend transitions, stagger, easing matched to tokens) and the brand-blue end card to final quality as the style benchmark. Review: the end card.
- **Phase 2 — Hero scene to final quality.** Build all of Act 1 (address, five agents, verdict math with the light-sweep verdict lock, flagship line) to final quality as the benchmark for everything else. Uses the real `VerdictMathPanel` and ledger. Review: Act 1.
- **Phase 3 — Act 2.** Record the address-set verdicts (live acceptance rule) and capture the 2x layered map stills first, generate the residential CMA and tax-appeal and rasterize the live-figure PDF pages, then build the four chapters (diorama push-through, dashboard moments, document fans) in order Community, Transaction, Development, Portfolio. Review: each chapter, then the full Act 2.
- **Phase 4 — Act 3 and cold open.** Monitoring, growing-record archive, brand-blue cold open and end card with the transitions. Review: the full silent cut at 1080p.
- **Phase 5 — Audio and timing.** Add the 105 BPM ambient-electronic bed and sound design, polish super timing to the beat. You: supply the final licensed track.
- **Phase 6 — Vertical cut (fast-follow).** Build the 1080×1920 layout branch. Review: the vertical.
- **Phase 7 — Final render.** Master 1920×1080 (mp4 + optional ProRes) and the vertical mp4. Deliver, and optionally fill the empty `/renders/demo.mp4` slot on `/intelligence`.
