# UI sprint, workstream 2: marketing site, mobile-first

Closes A1, A2 (code side; the final render drop-in is WS6 once the founder supplies the mobile set), A4, A18. Depends on the WS1 tokens.

Baseline for this workstream: `build-log/ui-ws-2/before/` (equals the WS1 "after" set). After: `build-log/ui-ws-2/after/`.

## What the baseline shows (from the WS1 captures)

- Every hero render is `display:none` below 900px (`globals.css` mobile block, A1), so phones see white space; the /intelligence and /pricing heroes keep their `100svh` height with nothing in it (a blank half-screen, A18-adjacent).
- The homepage hero card is translucent over the render; the agent chips sit on a blurred building and the lower half is empty for most of the loop (A4).
- Sections fade in with `useInView`; a static full-page capture (and any client that does not run the observer) shows blank sections (A18).
- The nav shows Sign in / Sign up to a signed-in user.
- Content widths differ per page (640 / 800 / 900 / 960 / 1000 / 1080 / 1280).

## Slices

| # | Slice | Files | Closes |
|---|---|---|---|
| 1 | `HeroRender` art-direction primitive: a `<picture>` with a `<source media="(max-width: 767px)">` pointing at `public/renders/mobile/<name>.webp` (4:5, when supplied) and the desktop WebP as the fallback, explicit `width`/`height` so nothing shifts, `loading="lazy"` below the fold and `fetchPriority="high"` for the first hero. Until the mobile set exists the component uses the temporary layout the sprint specifies: the desktop render placed BELOW the headline block at full width, never hidden. The mobile-hide rules leave `globals.css`. | new `src/components/marketing/HeroRender.tsx`, `globals.css`, `ClusterLanding.tsx`, `IntelligenceContent.tsx`, `PricingContent.tsx`, `AboutContent.tsx`, `CtaBackground.tsx` | A1, A2 (code side) |
| 2 | Homepage hero: the replay card becomes a solid white card (CLAUDE.md §10) with ink type, the chips readable, a real pause control and `prefers-reduced-motion` handling; the phone layout stacks copy then card then render. The address box (sprint scope: "homepage address box"): a hero input that resolves an address through a public, rate-limited endpoint and, for the recorded example address, opens the recorded run; for any other address shows the resolved lot and a "Create an account to run five agents on BBL x" sign-up prompt, never a fabricated verdict. | `HeroSection.tsx`, `HeroDashboard.tsx`, new `src/app/api/public/resolve/route.ts`, `middleware.ts` | A4 |
| 3 | Scroll sections render without animation: every `useInView`/`whileInView` entrance starts VISIBLE (opacity 1) and only animates when `IntersectionObserver` is available and reduced motion is off; capture, crawlers and reduced-JS clients see complete pages. One shared `Reveal` wrapper replaces the per-file `fadeUp` variants. | new `src/components/marketing/Reveal.tsx`, every marketing section | A18 |
| 4 | Auth-aware nav: a signed-in visitor sees "Dashboard" (and the account button) instead of Sign in / Sign up, on desktop and in the phone sheet; the sheet traps focus and closes on Escape. | `Nav.tsx` | |
| 5 | Contained content widths: one `--content-marketing: 1200px` for sections, `--content-prose: 720px` for prose, and the existing hero tokens; the 44px touch floor on every nav link, chip and CTA at 390; the mobile attribute-selector overrides in `globals.css` are replaced by real responsive rules in the components they patched. | `globals.css`, marketing components | A5 (marketing side), A12 |
| 6 | Capture, self-review, independent review, fixes, report, CLAUDE.md. | `build-log/ui-ws-2*` | |
