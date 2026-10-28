# Mobile structural audit (360, 390, 430)

Every marketing page, the public app pages, settings and the four lenses (empty and with a verdict), at 360, 390 and 430px: 21 surfaces and 63 captures. Produced by `scripts/ui/mobile-audit.mjs`. Before the fixes: `build-log/mobile-audit/before/` (`audit.json`, full-page captures and one annotated capture per defect, outlined in red). After: `build-log/mobile-audit/after/`, same layout.

What the script checks on every capture:

| Check | Rule |
|---|---|
| Overflow | Document wider than the screen; reports the deepest elements past the edge |
| Text off screen | A text line past the screen edge, outside an intended horizontal scroller |
| Text out of its box | A text line past the edge of its nearest bounded box (fill, border or shadow) |
| Touching the edge | A bounded element that is not full-bleed but sits within 8px of the screen edge |
| Gap | More than 120px of empty space between the content of two consecutive sections |
| Gutters | The left edges that headings, paragraphs and list items start at |
| Hero image | Where the first image sits, its share of the first screen, letterboxing |

The lenses with a verdict use the recorded 175 3rd St run, replayed offline and served in place of the live stream, because the Anthropic API key still has no credit. Their panels read the live public record. "Touching the edge" found nothing on any page at any width.

## Results

| Surface | Before (all three widths) | After |
|---|---|---|
| Home | 12 gaps | 0 |
| How it works | 21 gaps | 0 |
| For developers / professionals / institutions / communities | 12 gaps each | 0 |
| Pricing | 9 gaps | 0 |
| About | 15 gaps | 0 |
| Data | 18 gaps | 0 |
| Vision | 6 gaps, 2 text out of its box | 0 |
| Settings | page 386px wide at 360 (6 elements) | 0 |
| Acquire | 3 (see "not fixed") | 3, unchanged by design |
| Price, with a verdict | 6 (both false positives, see below) | 6, false positives |
| 404, sign-in, sign-up, Develop, Property, Price empty | 0 | 0 |

Gutters, before: marketing text started at 16, 32, 57, 61, 65, 75, 85 and 113px from the edge depending on the page, with 32px on every page except the homepage (16px). After: 16px for page text and 37px for text inside a card (16 gutter + 20 card padding + 1 border) on every marketing page. The app pages already used 16 and 41 (a 24px panel padding).

## Defects and their causes

### D1. Gaps of 127 to 272px between sections (every marketing page except the homepage)

- **What:** two sections in a row leave 240px of space between their content, three times the reading gap. A hero followed by the first section leaves 127px, and the closing CTA followed by the footer leaves 169px.
- **Cause:** each section sets `padding: "120px 32px"` inline, and nothing reduces it below 768px (only the homepage had a phone override). The locations:
  - `IntelligenceContent.tsx` lines 217, 273, 444, 605, 695, 877.
  - `ClusterLanding.tsx` lines 234, 310, 381, shared by all four /for pages.
  - `PricingContent.tsx` lines 233 (`80px 32px 120px`), 418, 526.
  - `AboutContent.tsx` lines 232, 309, 408, 524.
  - `DataContent.tsx` lines 139 (`160px 32px 120px`), 242, 372, 510, 597, 720.
  - `VisionContent.tsx` lines 131, 155, 245 (`64px 32px`).
  - The CTA-to-footer gap adds the footer's own `padding: "48px 32px"` (`Footer.tsx` line 34) to the CTA's 120px bottom.
- **Captures (390, before):**
  - `before/shots/intelligence-390-gap-2.jpg` (section to section, 247px)
  - `before/shots/for-developers-390-gap-1.jpg` (hero to section, 127px)
  - `before/shots/pricing-390-gap-2.jpg` (section to CTA, 272px)
  - `before/shots/about-390-gap-5.jpg` (CTA to footer, 169px)
  - `before/shots/data-390-gap-1.jpg`
  - `before/shots/vision-390-gap-3.jpg`
- **Fix:** the layout system's section rhythm, `.mk-section` at 48px top and bottom (commits c31ef6e, bb20bb4, 1d9b4cf, 1588e7a, 1b2461c, c14f0bd).

### D2. Gaps of 135 to 167px on the homepage

- **What:** four gaps between the agents, provenance, monitoring, clusters and CTA sections.
- **Cause:** the homepage phone rule set 64px top and bottom (`globals.css`, `.home-mobile section:not(#hero-section)`).
  - Monitoring continues provenance's pale background, so the two paddings stacked to 128px of one colour.
  - Its header kept `marginBottom: 48px` (`MonitoringSection.tsx`) after the alerts below it were hidden on phones.
  - The rule meant to drop its top padding lost on CSS specificity: the `:not(#hero-section)` in the general rule counts as an id.
- **Captures:** `before/shots/home-390-gap-1.jpg` to `home-390-gap-4.jpg`.
- **Fix:** 48px sections, plus `.home-monitoring` with no top padding and no header margin, with matching specificity (759bd30).

### D3. Text 32 to 113px from the screen edge (inconsistent gutters and card padding)

- **What:** at 360, card text on the /for pages starts at 61px and leaves 238px of measure. On /intelligence, the "Russian doll" layer cards nest three deep (40, 32 and 24px padding), so the innermost card's text is 199px wide at 360.
- **Cause:**
  - The 32px section side padding (D1).
  - `.card { padding: 28px }` (`globals.css` line 395).
  - The inline card paddings: `IntelligenceContent.tsx` (40px / 32px / 24px), `PricingContent.tsx` tier cards (`32px 28px`) and the `VisionContent.tsx` card style (24px).
- **Captures:** `before/shots/intelligence-390-full.jpg` (the architecture section), `before/shots/for-developers-390-full.jpg`.
- **Fix:** a 16px gutter, `.mk-section .card` and `.mk-card` at 20px, `.mk-card-inner` at 16px.

### D4. Hero images placed inconsistently, mostly below the fold

| Page | Before (390) |
|---|---|
| For developers / professionals / institutions | 326 x 182, inset 32px, starting at y 738 to 777 (8 to 13% of the first screen) |
| For communities | 326 x 182, inset, starts at y 825 (2% of the first screen) |
| About | 326 x 316, inset, starts at y 954 (not on the first screen) |
| How it works | 390 x 214, full width, y 374 |
| Pricing | 390 x 214, full width, y 830 |
| Data | no hero image; the CTA strip is 326 x 112 |
| CTA (every page) | a 326 x 112 strip above the CTA copy: the two brownstones at its ends and an empty middle |

- **Cause:**
  - The WS2 temporary layout (`globals.css`, `.hero-with-render[data-mobile-render="false"]` under `max-width: 1023px`) drops the desktop render in flow below the copy at its own wide aspect (about 1.8:1), inside each hero's 32px side padding. Group B and About pad, Group A does not.
  - The CTA render is absolutely positioned behind the copy and becomes a strip on phones (`CtaBackground.tsx`, `globals.css` `.cta-with-render .cta-render`).
- **Captures:** `before/shots/for-developers-390-full.jpg`, `before/shots/about-390-full.jpg`, `before/shots/pricing-390-full.jpg`.
- **Fix:** one hero frame and two render slots (below). Each slot shows a labelled placeholder at final size until its mobile render exists (`build-log/mobile-render-slots.md`).

### D5. Vision: "Directional hit rate" runs past its tile (360 and 390)

- **What:** the uppercase mono label runs 18px past its tile.
- **Cause:** `VisionContent.tsx` line 227: three `minmax(0, 1fr)` columns leave each tile about 64px inside at 360, and "DIRECTIONAL" is about 80px wide in 11px mono with 0.06em tracking.
- **Capture:** `before/shots/vision-390-text-box-1.jpg`.
- **Fix:** the label hyphenates inside its tile (`hyphens: auto`, `lang="en"`). The tiles and type are unchanged (c14f0bd).

### D6. Settings: the page is 386px wide at 360

- **What:** the logo and headshot rows push the page sideways.
- **Cause:** `ProfileSettingsForm.tsx`, the native `<input type="file">` (line 147). Its intrinsic width plus the 56px preview does not fit in a flex row with no `min-width: 0`.
- **Captures:** `before/shots/settings-360-overflow-1.jpg` to `settings-360-overflow-6.jpg`.
- **Fix:** `minWidth: 0` on the row and column and `maxWidth: 100%` on the input (e5037f8). Nothing moves at 390 and up.

## Found and not fixed (need your decision under the standing rule)

1. **Hero text contrast.** White on the light sky measures 1.6 to 2.0:1 at every width. The glass card text is mostly below 4.5:1. Full table: `build-log/hero-revert/contrast.md`.
2. **Acquire, "The longitudinal record" table** (`ArchiveTrend.tsx` line 92). It is an intended horizontal scroller (`.scroll-x`, a 420px table in a 328px card), but nothing shows that it scrolls, so it reads as clipped mid-number ("50,1", "Aug"). Capture: `before/shots/dashboard-acquire-390-text-box-1.jpg`. Options: an edge fade, a "scroll" hint, or stacking the weeks. Each changes how it looks, so I didn't make one.
3. **Alignment is mixed.** The /for, pricing, intelligence and data heroes are centred; their sections below are left-aligned. The homepage is left-aligned throughout. Not a bug, so left as it is.
4. **Section header to content spacing** ranges from 48 to 80px (inline `marginBottom` on each section header). The system defines 24px (below) but I did not apply it, because it is spacing inside a section rather than a gap or overflow bug.
5. **Dashboard panels** use 24px padding (`panelStyle` in `panels.tsx`) against the system's 20px for cards. Not changed in this pass.

## False positives

- **Price, "$0" outside its box:** the scatter's y-axis labels sit to the left of the plot area by design (the outlined box is the plot area). Capture: `after/shots/dashboard-price-done-390-text-box-1.jpg`.
- **Price, a "gap" of 1,151px between the map and the scatter:** the script compares `section` elements, and the panels between those two (the CMA builder) are not sections. There is no empty space. Capture: `after/shots/dashboard-price-done-390-gap-2.jpg`.
- **Full-page captures of the lenses** show the bottom tab bar and the sticky action partway down the page, because fixed and sticky elements render at their viewport position in a full-page capture. On a device they sit at the bottom of the screen.

## The mobile layout system (below 768px)

One set of values for every page. All are tokens in `src/app/globals.css :root`, applied through `.mk-section`, `.mk-card`, `.mk-card-inner`, the hero frame and the slot rules. The phone type scale (`--m-display` 44 to `--m-micro` 11) is the approved one from the mobile proposal and is unchanged here.

| Token | Value | Use |
|---|---|---|
| `--m-gutter` | 16px | Page gutter, every page, marketing and app, including the footer |
| `--m-section-y` | 48px | Section padding, top and bottom. Two sections meet with 96px between their content |
| `.mk-continues` | 0 top | A section that shares the previous section's background starts with no top padding (48px total) |
| Section header to content | 24px | Defined; not yet applied (item 4 above) |
| `--m-card-pad` | 20px | Card padding (text sits 37px from the screen edge) |
| `--m-card-pad-inner` | 16px | A card inside a card; at most one level of nesting |
| `--m-card-gap` | 12px | Between cards in a list or grid |
| `--m-slot-gap` | 24px | From the hero copy to its render slot |

**Hero frame**
- The section has no side padding.
- The copy sits in the 16px gutter, top-aligned under the nav as today (`HERO_PADDING_TOP`).
- The render slot starts 24px below the copy, runs the full screen width with no inset, and ends at the section's bottom edge.
- Nothing overlaps the slot.

**CTA frame**
- The headline, line and buttons sit in the gutter.
- The slot starts 32px below the buttons, full width, and meets the footer (the section has no bottom padding).

**Image slots**

| Section type | Aspect | Size at 390 | Text over it |
|---|---|---|---|
| Page hero (all render heroes, including the homepage) | 4:5 | 390 x 488 | None |
| Closing CTA | 3:2 | 390 x 260 | None |
| Video (the /intelligence demo) | 16:9 | Inside the gutter, 358 x 201 | None (unchanged) |

Pixel sizes for the files, and every slot by page: `build-log/mobile-render-slots.md`.
