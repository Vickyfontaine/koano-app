import React from "react";
import HeroRender from "./HeroRender";
import { RENDERS } from "./renders";

/**
 * Background image for the CTA sections. The image (public/renders/cta.webp) has
 * an opaque white background with brownstones flanking a white center channel
 * for the copy. It is laid behind the text (z-index -1) so it covers the
 * section's own colour without affecting layout. On phones (host section
 * `.cta-with-render`) it drops below the copy as a full-width strip instead of
 * being hidden (UI sprint, A1).
 *
 * The host section must be `position: relative` + `isolation: isolate` (so the
 * z-index:-1 paints above the section background but below the in-flow copy)
 * and `overflow: hidden`.
 */
export default function CtaBackground() {
  return (
    <HeroRender
      slot={RENDERS.cta}
      className="cta-render"
      style={{
        position: "absolute",
        // Anchored at the section top and 16px TALLER than the section (the
        // extra hangs below and is clipped) so the buildings' base lands on the
        // footer's separator with no strip of the section colour showing above.
        top: 0,
        left: 0,
        right: 0,
        width: "100%",
        height: "calc(100% + 16px)",
        objectFit: "cover",
        objectPosition: "center bottom",
        zIndex: -1,
        pointerEvents: "none",
      }}
    />
  );
}
