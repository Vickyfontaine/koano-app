"use client";

// HeroRender — art-directed hero image (UI sprint WS2, A1 and A2).
//
// A <picture> that serves the 4:5 mobile render below 768px when the founder
// has supplied one, and the desktop render otherwise, with explicit intrinsic
// dimensions so the slot reserves its height before the bytes arrive (no layout
// shift), lazy loading below the fold and a high fetch priority for the first
// hero. Decorative: empty alt, aria-hidden.
//
// Two placements, chosen by the parent with `variant`:
//   "bleed"  — the desktop composition: absolutely positioned behind the copy
//              (the parent positions it). On phones WITHOUT a mobile render the
//              CSS in globals.css turns it into an in-flow block below the
//              headline at full width (the sprint's temporary layout); WITH a
//              mobile render it stays full-bleed and the copy sits in the
//              reserved upper area.
//   "block"  — always in flow (used where the image is already a block).

import React from "react";
import { mobileSrc, type RenderSlot } from "./renders";

interface HeroRenderProps {
  slot: RenderSlot;
  variant?: "bleed" | "block";
  priority?: boolean;
  /** Extra class for the parent's own placement rules. */
  className?: string;
  style?: React.CSSProperties;
}

export default function HeroRender({ slot, variant = "bleed", priority = false, className = "", style }: HeroRenderProps) {
  const mobile = mobileSrc(slot);
  const img = (
    <img
      src={slot.src}
      width={slot.width}
      height={slot.height}
      alt=""
      aria-hidden="true"
      decoding="async"
      loading={priority ? "eager" : "lazy"}
      // eslint-disable-next-line react/no-unknown-property
      fetchPriority={priority ? "high" : "auto"}
      className={`hero-render hero-render-${variant} ${className}`.trim()}
      style={style}
    />
  );
  if (!mobile) return img;
  return (
    <picture className={`hero-picture hero-picture-${variant}`}>
      <source media="(max-width: 767px)" srcSet={mobile} width={1728} height={2160} />
      {img}
    </picture>
  );
}
