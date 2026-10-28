# Mobile render slots

Every place a render appears on a phone (below 768px). Each slot is full width with no side gutter. Until its mobile render exists, it shows a labelled neutral placeholder at its final size. The label gives the filename, the pixel size at 2x, the aspect ratio and what overlaps it. From 768px up, nothing changes: tablets and desktops keep the desktop renders.

Slot sizes come from the mobile layout system (`build-log/mobile-audit.md`, `PHONE_SLOTS` in `src/components/marketing/HeroRender.tsx`).

| Slot type | Aspect | On screen at 360 / 390 / 430 | File to supply (2x at 430) | Text over it |
|---|---|---|---|---|
| Hero | 4:5 | 360 x 450 / 390 x 488 / 430 x 538 | 860 x 1075 px | None. The headline, lead and buttons sit above the slot; the slot starts 24px below them and runs to the bottom of the hero |
| CTA | 3:2 | 360 x 240 / 390 x 260 / 430 x 287 | 860 x 573 px | None. The CTA headline, line and buttons sit above the slot; it starts 32px below the buttons and meets the footer |

A file larger than 860px wide (for example 1080 x 1350 for a hero) is fine as long as the aspect ratio is exact.

## Every slot

| # | Page | Section | Slot | File (`public/renders/mobile/`) | Code |
|---|---|---|---|---|---|
| 1 | `/` | Hero | Hero 4:5 | `menu-hero.webp` | `HeroSection.tsx` (`PhoneRenderSlot`, between the lead and the address box) |
| 2 | `/` | Closing CTA ("See it work on a building you know.") | CTA 3:2 | `cta.webp` | `EarlyAccessSection.tsx` via `CtaBackground.tsx` |
| 3 | `/intelligence` | Hero | Hero 4:5 | `how-it-works.webp` | `IntelligenceContent.tsx` |
| 4 | `/intelligence` | Closing CTA | CTA 3:2 | `cta.webp` | `IntelligenceContent.tsx` via `CtaBackground.tsx` |
| 5 | `/for/developers` | Hero | Hero 4:5 | `for-developers.webp` | `ClusterLanding.tsx` (`render="for-developers"`) |
| 6 | `/for/developers` | Closing CTA | CTA 3:2 | `cta.webp` | `ClusterLanding.tsx` via `CtaBackground.tsx` |
| 7 | `/for/agents` | Hero | Hero 4:5 | `for-professionals.webp` | `ClusterLanding.tsx` (`render="for-professionals"`) |
| 8 | `/for/agents` | Closing CTA | CTA 3:2 | `cta.webp` | `ClusterLanding.tsx` via `CtaBackground.tsx` |
| 9 | `/for/institutions` | Hero | Hero 4:5 | `for-institutions.webp` | `ClusterLanding.tsx` (`render="for-institutions"`) |
| 10 | `/for/institutions` | Closing CTA | CTA 3:2 | `cta.webp` | `ClusterLanding.tsx` via `CtaBackground.tsx` |
| 11 | `/for/community` | Hero | Hero 4:5 | `for-community.webp` | `ClusterLanding.tsx` (`render="for-community"`) |
| 12 | `/for/community` | Closing CTA | CTA 3:2 | `cta.webp` | `ClusterLanding.tsx` via `CtaBackground.tsx` |
| 13 | `/pricing` | Hero | Hero 4:5 | `pricing.webp` | `PricingContent.tsx` |
| 14 | `/pricing` | Closing CTA ("Building for an enterprise portfolio?") | CTA 3:2 | `cta.webp` | `PricingContent.tsx` via `CtaBackground.tsx` |
| 15 | `/about` | Hero | Hero 4:5 | `about.webp` | `AboutContent.tsx` |
| 16 | `/about` | Closing CTA | CTA 3:2 | `cta.webp` | `AboutContent.tsx` via `CtaBackground.tsx` |
| 17 | `/data` | Closing CTA | CTA 3:2 | `cta.webp` | `DataContent.tsx` via `CtaBackground.tsx` |

That is 17 slots and 9 files. Every closing CTA uses the same `cta.webp`. `/vision`, the app pages and the four lenses have no render slots.

Not render slots: the `/intelligence` demo video (`/renders/koano-demo.mp4`, 16:9, inside the gutter) stays as it is.

## Dropping a render in

1. Save the file to `public/renders/mobile/<name>.webp` at the size above.
2. Set `mobile: true` for that entry in `src/components/marketing/renders.ts`.
3. Code changes still needed before the first file lands (one commit):
   - Change the `<source>` size in `HeroRender.tsx` from 1728 x 2160 to the slot's size (860 x 1075 for a hero, 860 x 573 for the CTA).
   - Update the `.hero-with-render[data-mobile-render="true"]` rules in `globals.css`. Today they set the copy over the image, from the earlier overlay spec, which conflicts with "nothing over it". Change them to the slot frame: copy above, render below, full width.
   - Serve the CTA's mobile file in its slot. `CtaBackground` today positions the render behind the copy.
4. Run `node scripts/ui/render-manifest.mjs` to confirm the file is present.

The placeholder for that slot then disappears. This replaces the 4:5-everywhere and 9:16 specs in `KOANO_UI_SPRINT.md` and `build-log/mobile-proposal.md` §5 once you approve it.
