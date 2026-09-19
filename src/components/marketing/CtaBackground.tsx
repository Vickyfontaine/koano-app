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
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        objectPosition: "center bottom",
        zIndex: -1,
        pointerEvents: "none",
      }}
    />
  );
}
