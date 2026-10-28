# Mobile design proposal (390px)

Status: **proposal, waiting for founder approval.** Built on the homepage only (section 6), with the desktop renders standing in for the mobile set. No other page has changed.

Font family and logo are unchanged. Every headline below is the existing headline, verbatim. Every proposed mobile line is cut from that page's existing copy (a sentence or a clause of one, sometimes two clauses joined), never new positioning. Each one still needs your sign-off, because a cut changes what a phone visitor reads. The long copy stays as it is from 768px up.

Evidence: `build-log/mobile-ref/foundation/` (reference, home page, 16 screens) and `build-log/mobile-ref/koano/` (the nine KOANO marketing pages). Each folder holds a full-page capture, one capture per screen (`<page>-sNN.jpg`) and `measure.json`, produced by `scripts/ui/mobile-measure.mjs` at 390 x 844. The reference is studied for its principles only. None of its design, copy or assets is used.

## 1. What the measurements say

Method: each screen is one 844px viewport. "Imagery" is the share of the screen covered by an image, video, canvas, large SVG or CSS background image, measured on a 10px grid. Nav and header media counts as chrome, not imagery. "Words" are the words visible on that screen. "Headline" is the largest type size on a screen, and "body" is the size that carries the most words. "Text over / above / below / no image" says where each word sits relative to the imagery on its screen.

| Page | Screens | Words | Words per screen | Imagery, mean | Imagery, max | Screens with 10%+ imagery | Headline (max / median) | Body | Text over / above / below / no image |
|---|---|---|---|---|---|---|---|---|---|
| **Reference (thefoundation.house)** | 16 | 600 | **38** | **47%** | 100% | 12 of 16 | 77 / 70px | 18px | 26 / 20 / 29 / 24% |
| KOANO home | 17 | 1,438 | 85 | 2% | 15% | 2 of 17 | 34 / 32px | 11px | 0 / 10 / 3 / 88% |
| KOANO how it works | 12 | 828 | 69 | 5% | 26% | 3 of 12 | 36 / 32px | 15px | 0 / 11 / 6 / 83% |
| KOANO for developers | 6 | 376 | 63 | 5% | 12% | 2 of 6 | 36 / 32px | 15px | 0 / 18 / 27 / 55% |
| KOANO for professionals | 6 | 390 | 65 | 5% | 12% | 2 of 6 | 36 / 32px | 15px | 0 / 16 / 30 / 54% |
| KOANO for institutions | 6 | 399 | 67 | 5% | 12% | 2 of 6 | 36 / 32px | 15px | 0 / 18 / 29 / 53% |
| KOANO for communities | 6 | 457 | 76 | 5% | 17% | 2 of 6 | 36 / 32px | 15px | 0 / 21 / 24 / 55% |
| KOANO pricing | 10 | 952 | 95 | 4% | 24% | 2 of 10 | 36 / 32px | 14px | 0 / 10 / 14 / 76% |
| KOANO about | 8 | 701 | 88 | 6% | 33% | 2 of 8 | 32 / 32px | 16px | 0 / 3 / 9 / 89% |
| KOANO data | 13 | 998 | 77 | 1% | 13% | 1 of 13 | 32 / 18px | 15px | 0 / 1 / 4 / 95% |

The principles, in plain terms:

1. **The image is the screen.** On the reference, half of each screen is imagery on average, and six screens are 90 to 100% image. On KOANO no screen is more than a third image, and most have none. The renders exist but sit as a thin strip under the copy (the WS2 temporary layout), at 12 to 33% of one screen.
2. **Text sits inside the image's clear area.** About a quarter of the reference's words sit on the image itself, in its empty sky, and most of the rest sit directly above or below it. On KOANO no word sits on an image, and 53 to 95% of words are on screens with no image at all.
3. **One big headline, then one line.** The reference sets its headlines at 70 to 77px with an 18px body. KOANO's phone headlines are 32 to 36px, a little more than twice the body size, so nothing on the screen leads.
4. **Few words per screen.** The reference averages 38 words per screen. KOANO runs at 63 to 95, about twice as dense. The homepage alone is 1,438 words over 17 screens.
5. **The reference is longer in screens, not in words.** Its 16 screens hold 600 words. KOANO's homepage has about the same number of screens with 2.4 times the words. The goal on mobile is to keep roughly the same number of screens and cut the words, not to make pages shorter by cramming them.

Targets for KOANO on phones: **40 words per screen or fewer** on average, **40% imagery or more** on every render-led screen, the hero headline set at least 2.5 times the body size, and no more than one headline plus one short line per section.

## 2. Mobile type scale (below 768px; family unchanged)

Sizes only. Neue Montreal and DM Mono stay exactly as they are. These apply below 768px; the desktop scale in CLAUDE.md §10 is unchanged.

| Token | Size / line height | Weight, tracking | Use |
|---|---|---|---|
| `--m-display` | 44 / 1.0 | 700, -0.02em, uppercase as today | Page H1 (hero headline). 2.75x the body. At 44px "SMARTER REAL ESTATE DECISIONS." sets in four lines at 358px |
| `--m-h2` | 30 / 1.08 | 700, -0.02em | Section headline |
| `--m-h3` | 20 / 1.25 | 500 | Card and list titles (agent names, lens names, tier names) |
| `--m-lead` | 17 / 1.45 | 400 | The one short line under a headline |
| `--m-body` | 16 / 1.5 | 400 | The few long passages that stay on phones (FAQ answers, the not-built-yet notes when opened) |
| `--m-ui` | 15 / 1.3 | 500 | Buttons, inputs |
| `--m-label` | 13 / 1.3 | 500 | Labels, captions |
| `--m-micro` | 11 / 1.4 | DM Mono, 400 to 500 | Source tags, timestamps, the recorded-example stamp. The 11px floor holds |

Hierarchy goes from 44 to 30 to 20 to 17. Each step is at least 1.2x, and the display size is 2.6x the line under it, close to the reference's 70/18 contrast, scaled to KOANO's longer headlines.

## 3. Layout: render-led sections

- **A render-led screen** is one full-width render (no side gutter), at least 50% of the screen tall, with its headline and one line set **inside the render's reserved clear zone** (the empty sky or background area). The headline sits in the top 45% of the image. Buttons go directly below the image, never on the plinth.
- **A text screen** (no render) carries one headline, one line, and at most one compact list (names only, no paragraphs) or one product card.
- **Long copy is hidden on phones, not deleted.** It renders from 768px up exactly as today. On phones it is either dropped from that section or moved behind a "Read more" disclosure where the section exists to explain (FAQ, not-built-yet notes).
- **Every page ends on a render-led CTA screen** (the `cta` render).
- **Recorded-example rule unchanged.** Wherever the 175 3rd St run appears on mobile, it keeps `EXAMPLE_VERDICT_LABEL`.

### Which sections merge or drop on mobile

| Page | Merge | Drop on phones (kept from 768) | Render-led screens |
|---|---|---|---|
| Home | Archive merges into Monitoring (one headline, one line) | Agent descriptions and output chips, the synthesis node, the verdict math panel, the ledger table and its intro, the archive coverage grid, the monitoring example alerts, cluster descriptions, the data ticker, the hero stat pills | Hero (`menu-hero`), CTA (`cta`) |
| How it works | "When agents disagree" folds its four cards into its one line | The demo-video caption block becomes the stamp only; layer and agent descriptions; source lists under each agent; the four synthesis cards; the sample verdict card (the demo video carries it) | Hero (`how-it-works`), CTA |
| For developers, professionals, institutions, communities | The audience line moves into the hero as the eyebrow | The hero's second paragraph (the cluster tagline repeats in the CTA); "What you get today" and "What is not built yet" become title-only lists, each item expandable | Hero (cluster render), CTA |
| Pricing | The hero's three paragraphs become one line | Tier feature lists (title, price, one line, CTA remain); FAQ answers collapse behind their questions | Hero (`pricing`), CTA |
| About | "What we believe" and "A new category" merge into one list of four titles | The belief and category paragraphs; "The people behind it" collapses to its two titles, each expandable | Hero (`about`), CTA |
| Data | none | The source registry becomes one collapsed list per layer; the pipeline steps become titles only | CTA only (the data page stays plain, as on desktop) |

## 4. Mobile copy, page by page (current vs proposed)

"Current" is what a phone shows today: the headline and the copy under it, with its word count. "Proposed" is the headline (unchanged) and the one line. Where a section's whole job is a list, the list items stay as titles only.

### Home (`/`)

| Section | Current | Proposed mobile |
|---|---|---|
| Hero | **SMART DATA. SMARTER REAL ESTATE DECISIONS.** + "KOANO deploys five specialist agents that read every public record touching a property, scattered across federal, state and city agencies. Each weighs its own evidence, and the verdict they produce shows its arithmetic figure by figure." + three stat pills (163 words in the section) | **SMART DATA. SMARTER REAL ESTATE DECISIONS.** + "Five specialist agents read every public record touching a property." Address box and the two buttons stay, below the render. Stat pills drop |
| Replay card | The recorded 175 3rd St replay | Unchanged (it is the product, labeled "Recorded example") |
| 01 Agents | **Five agents. One verdict. Every step auditable.** + five cards with a description and an output chip each, the synthesis node, and the full verdict math panel (420 words) | Same headline + "Each weighs its own evidence, and the verdict shows its arithmetic figure by figure." + the five agent names as a list |
| 02 Provenance | **Every figure, sourced.** + "The same verdict, opened up. Every number KOANO used carries its value, its provenance, and the exact public source it came from…" + the ledger (319 words) | Same headline + "Every number KOANO used carries its value, its provenance, and the exact public source it came from." + the link "See the five provenance states, and every source" |
| 03 Archive + 04 Monitoring (merged) | **The public record forgets. KOANO remembers.** (118 words) and **It watches the buildings you are watching.** + three example alerts (172 words) | **It watches the buildings you are watching.** + "Every week, KOANO snapshots the free public record and tells you only what actually changed." (joins the archive's first clause to the monitoring paragraph's last clause) |
| 05 Clusters | **The same engine. Four different altitudes.** + four cards, each with the approved one-line description and price (97 words) | Same headline + the four lens names with their price chips, each linking to its page. The approved descriptions stay on the `/for` pages and at 768 up |
| Data ticker | Scrolling source names | Dropped on phones |
| CTA | **See it work on a building you know.** + "Sign up and run three full analyses at no cost. Every verdict arrives with its reasoning and its sources, so you can check the work against what you already know about the address." (47 words) | Same headline + "Sign up and run three full analyses at no cost." Render-led |

Measured on the build (section 6): 7 screens and 267 words (38 per screen), with the hero at 53% render and the CTA at 48%.

### How it works (`/intelligence`)

| Section | Current | Proposed mobile |
|---|---|---|
| Hero | **Five agents. One verdict. Every step on the record.** (15 words) | Unchanged, set in the render's clear zone |
| Demo | **Watch the demo.** + the recorded-example stamp | Unchanged |
| Layers | **Three layers. One answer.** + intro + three layer descriptions (129 words) | Same headline + "Raw data becomes structured signals. Signals become agent verdicts. Agent verdicts become one unified conclusion." + the three layer titles |
| Agents | **Five specialists. One for each domain.** + five descriptions with source lists (264 words) | Same headline + the five agent names, each expandable to its description and sources |
| Synthesis | **When agents disagree, you see it.** + intro + four cards (150 words) | Same headline + "If agents disagree, the disagreement appears in the verdict as a minority signal." |
| Verdict | **A decision, not a dashboard.** + paragraph + sample verdict (146 words) | Same headline + "The reasoning chain is not optional. It is the product." |
| CTA | **See it on a building you know.** + 2 sentences (44 words) | Same headline + "Sign up and run three full analyses free." |

### For developers (`/for/developers`)

| Section | Current | Proposed mobile |
|---|---|---|
| Hero | **You already know the site. The question is what happens next to it.** + paragraph + tagline + audience line (67 words) | Eyebrow "For CRE brokers, developers, and contractors" + same headline + "Five agents read the zoning, the permit history, and the development activity around a parcel." |
| What you get today | Five items with paragraphs (135 words) | **What you get today** + the five item titles, each expandable |
| What is not built yet | Two items with paragraphs (97 words) | **What is not built yet** + the two titles, each expandable |
| CTA | **Start with development intelligence** + tagline | Unchanged (the approved tagline, 15 words) |

### For professionals (`/for/agents`)

| Section | Current | Proposed mobile |
|---|---|---|
| Hero | **The MLS tells you what already happened.** + paragraph + tagline + audience line (62 words) | Eyebrow "For agents, brokers, and mortgage officers" + same headline + "KOANO reads the signals that move first." |
| What you get today | Five items with paragraphs (153 words) | Titles only, each expandable |
| What is not built yet | Two items (93 words) | Titles only, each expandable |
| CTA | **Start with transaction intelligence** + tagline | Unchanged |

### For institutions (`/for/institutions`)

| Section | Current | Proposed mobile |
|---|---|---|
| Hero | **A portfolio does not change on a reporting cycle.** + paragraph + tagline + audience line (70 words) | Eyebrow "For CEOs, CFOs, CIOs, REITs, and PE firms" + same headline + "KOANO watches the assets and the markets you hold, and tells you what moved, what is at risk, and why." |
| What you get today | Six items (175 words) | Titles only, each expandable |
| What is not built yet | Two items (78 words) | Titles only, each expandable |
| CTA | **Start with portfolio intelligence** + tagline (22 words) | Same headline + "Monitor everything. Miss nothing." (the first two sentences of the approved tagline) |

### For communities (`/for/community`)

| Section | Current | Proposed mobile |
|---|---|---|
| Hero | **The record on your building is public. Reading it is the hard part.** + paragraph + tagline (77 words) | Same headline + "KOANO reads the violations, the ownership, the permits, and the risk data tied to an address, and tells you what it means." |
| What this reads today | Four items with long paragraphs (163 words) | Titles only, each expandable (the HPD coverage caveat stays inside "Violation history") |
| What is not built yet | Three items (132 words) | Titles only, each expandable |
| CTA | **Start with property intelligence** + tagline | Unchanged |

### Pricing (`/pricing`)

| Section | Current | Proposed mobile |
|---|---|---|
| Hero | **Start free. Upgrade when you hit the limit.** + three paragraphs (98 words) | Same headline + "Every account starts with three analyses and three generated documents. No approval, no waitlist, no card." |
| Tiers | Four tiers with taglines, feature lists and caveats (352 words) | Each tier: name, price, its "becomes live with" caveat where it has one, and its button. Feature lists expand |
| Common questions | Six Q&As (389 words) | Questions only, each expands to its answer |
| Enterprise CTA | **Building for an enterprise portfolio?** + paragraph (60 words) | Same headline + "Talk to us about custom pricing and dedicated onboarding." |

### About (`/about`)

| Section | Current | Proposed mobile |
|---|---|---|
| Hero | **Real estate has more data than almost any industry, and less intelligence.** + paragraph + pull quote (99 words) | Same headline + "The information is public. The work of turning it into a decision still takes a person, a spreadsheet, and a week." (trimmed from the paragraph's last sentence) |
| What we believe + A new category (merged) | Four beliefs (127 words) and four "NOT a…" items (109 words) | **What we believe.** + the four belief titles ("Reasoning over reporting", "Transparency as trust", "Intelligence for everyone", "Decisions, not dashboards"). "A new category" drops on phones |
| The people behind it | Two essays (275 words) | **The people behind it.** + the two titles, each expandable. The closing line "Today there is a demo, running on public data. That is the whole of it." stays visible |
| CTA | **See it for yourself.** + paragraph (33 words) | Same headline + "Sign up, run three analyses free, and read the reasoning on a building you already know." |

### Data (`/data`)

| Section | Current | Proposed mobile |
|---|---|---|
| Hero | **Every source, on the record.** + paragraph (82 words) | Same headline + "Most of it is live public data. Some figures are honest stand-ins for licensed data we have not funded yet, and they say so wherever they appear." |
| Live sources | Intro + the registry (348 words) | **Live public data, queried in real time.** + one collapsed list per layer |
| Not live | Intro + two items (111 words) | Same headline + "These never feed a verdict." + the two titles, each expandable |
| Five labels | Intro + five definitions (176 words) | Same headline + the five state names with their badge glyphs, each expandable |
| Pipeline | Five steps (181 words) | Same headline + the five step titles |
| CTA | **See it on a building you know.** + paragraph (40 words) | Same headline + "Sign up, run three analyses free, and check the work against an address you already understand." |

`/vision` is out of scope (footer-linked concept page, unchanged).

## 5. Updated mobile render spec (all 9 files in `public/renders/mobile/`)

This replaces the 4:5 spec in `KOANO_UI_SPRINT.md` and `blockers.md`. A phone hero is now a full screen (390 x 780 below the nav), so the heroes are portrait 9:16. CTA screens stay 4:5. Style is unchanged: the architectural diorama house style, miniature buildings on a base plinth, realistic materials and shadows.

Common to all nine:

| Spec | Value |
|---|---|
| Format | WebP, quality 85 to 90, under 600 KB each |
| Background | Solid, the exact colour of the page area it sits on (listed per file), carried to every edge so the image meets the page with no seam |
| Text zone | A clean area with no building, tree, crane, shadow or texture. The headline and the one line are set there in near-black (`#0D2B3E`), so the zone must be light enough for AA (luminance near the page background) |
| Side safety | Keep the subject 6% in from each side: the page gutter is 16px at 390 |
| Subject | Front-elevation or three-quarter diorama, plinth fully visible, never cropped by the bottom edge |
| Shadow | The cast shadow falls down or behind, never up into the text zone |

| File | Page and slot | Aspect, pixels | Subject | Composition | Text zone | Background |
|---|---|---|---|---|---|---|
| `menu-hero.webp` | Homepage hero | 9:16, 2160 x 3840 | Brownstone row (the current homepage subject) | Plinth and buildings in the lower 50%, centred | Top 45%, holds a 4-line 44px headline and a 2-line lead | `#ADC1CA`, the current hero sky |
| `how-it-works.webp` | /intelligence hero | 9:16, 2160 x 3840 | NYC skyline | Skyline and plinth in the lower 50% | Top 45% | Page white `#FFFFFF` |
| `pricing.webp` | /pricing hero | 9:16, 2160 x 3840 | Park with trees and people | Lower 50% | Top 45% | Page white |
| `for-developers.webp` | /for/developers hero | 9:16, 2160 x 3840 | Construction site with crane | Lower 50%. The crane jib may rise into the top 55% only at the far right, outside the text column | Top 45%, left 70% of the width | Page white |
| `for-professionals.webp` | /for/agents hero | 9:16, 2160 x 3840 | Detached houses | Lower 50% | Top 45% | Page white |
| `for-institutions.webp` | /for/institutions hero | 9:16, 2160 x 3840 | Commercial mid-rise | Lower 55%: a mid-rise is tall, so let it take 5% more, centred | Top 40% | Page white |
| `for-community.webp` | /for/community hero | 9:16, 2160 x 3840 | Brownstone row | Lower 50% | Top 45% | Page white |
| `about.webp` | /about hero | 9:16, 2160 x 3840 | The current about subject | Lower 50% | Top 45%. The hero headline is long (12 words), so this zone must hold 5 lines at 44px | Page white |
| `cta.webp` | Every page's closing CTA | 4:5, 2160 x 2700 | Brownstones (the current CTA subject) | Lower 55% | Top 40%, holds a 2 to 3 line 30px headline and one line. The button sits below the image | Page white, or pale wash `#F0F7FC` where the CTA sits on a pale section: supply both if both occur (`cta.webp`, `cta-wash.webp`) |

Drop-in: put each file in `public/renders/mobile/`, flip `mobile: true` for it in `src/components/marketing/renders.ts`, and run `node scripts/ui/render-manifest.mjs`. The `<picture>` source switches below 768px. Its declared size must change from 1728 x 2160 (4:5) to 2160 x 3840 for the heroes when this spec is approved.

## 6. Built on the homepage (desktop renders as stand-ins)

Below 768px only; the homepage at 768 and up is unchanged. The other pages are unchanged.

- The mobile type scale tokens are added to `:root` and applied to the homepage's mobile block.
- Hero: the headline and one line sit in the sky colour (the clear zone), and the `menu-hero` render runs full width below them, cropped onto the brownstones (the stand-in has its buildings on the right). The address box and buttons follow the render. The stat pills drop.
- Agents, provenance, merged monitoring, clusters: headline plus one line (plus names-only lists), as in section 4. The archive section and the data ticker are hidden on phones. The long copy is still in the page from 768px.
- CTA: render-led. The `cta` render is cropped to fill half a screen, and the copy sits above it.

Result at 390, measured the same way as section 1:

| | Screens | Words | Words per screen | Hero screen imagery | CTA screen imagery | Hero headline / lead |
|---|---|---|---|---|---|---|
| Before | 17 | 1,438 | 85 | 15% (render below the copy, below the fold) | 13% | 32px / 18px |
| After | 7 | 267 | 38 | 53% | 48% | 44px / 17px |
| Reference | 16 | 600 | 38 | 100% | n/a | 70px / 20px |

Screens 2 to 5 (the address box and replay card, agents, provenance and monitoring, clusters) carry no imagery. Of these, only the hero and the CTA have renders on any page today. Getting the other screens toward the reference's 47% mean would need renders for those sections. That is a new asset request, not part of this proposal.

At 768 and 1440 the homepage is unchanged: same page height, and a pixel diff against the pre-change captures differs only in the animated replay card and the data ticker.

Before and after: `build-log/mobile-ref/home-before/` and `build-log/mobile-ref/home-after/` (full page, one capture per screen, `measure.json`), and the side-by-side `build-log/mobile-ref/home-before-after-390.jpg`.
