import React from "react";

/**
 * Background image for the CTA sections. The image (public/renders/cta.webp) has
 * an opaque white background with brownstones flanking a white center channel
 * for the copy. It is laid behind the text (z-index -1) so it covers the
 * section's own colour — on a pale-wash section you still see the image with
 * its white background — without affecting layout: it's absolutely positioned,
 * so it never changes the section's height or the text position.
 *
 * The host section must be `position: relative` + `isolation: isolate` (so the
 * z-index:-1 paints above the section background but below the in-flow copy)
 * and `overflow: hidden`.
 */
export default function CtaBackground() {
  return (
    <img
      src="/renders/cta.webp"
      alt=""
      aria-hidden="true"
      style={{
        position: "absolute",
        // Box is anchored at the section top and made 16px TALLER than the
        // section (the extra 16px hangs below and is clipped by the host's
        // overflow:hidden). With objectPosition center-bottom this lands the
        // buildings' base on the footer's blue separator, while the top stays
        // flush with the section top — no strip of the section's own colour
        // (pale-wash blue, or a faint seam on white) is uncovered above.
        // NOTE: height must be explicit — an absolutely-positioned <img> with
        // height:auto resolves to the image's intrinsic height, which breaks
        // object-fit's box. So we size it, not top/bottom.
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
