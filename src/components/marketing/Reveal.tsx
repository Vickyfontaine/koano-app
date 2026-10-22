"use client";

// Reveal — the one scroll-entrance wrapper for the marketing site (UI sprint
// WS2, A18). The content is VISIBLE by default (server render, no JavaScript,
// crawlers, link-preview bots, a headless full-page capture, reduced motion):
// the fade-up only runs when IntersectionObserver exists, reduced motion is
// off, and the element has not yet scrolled into view. So a section can never
// render blank; motion is an enhancement, never a gate on content.
//
// Entrance per CLAUDE.md §10: fade-up only (y 20 to 0, opacity 0 to 1), 0.5s,
// easing [0.16, 1, 0.3, 1], no spring, no scale. `delay` staggers siblings.

import React, { useLayoutEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

const EASE = [0.16, 1, 0.3, 1] as const;

interface RevealProps {
  children: React.ReactNode;
  delay?: number;
  /** Fraction of the element that must be visible before it animates. */
  amount?: number;
  className?: string;
  style?: React.CSSProperties;
  id?: string;
  as?: "div" | "section" | "p" | "h1" | "h2" | "span" | "li";
}

export default function Reveal({ children, delay = 0, amount = 0.15, className, style, id, as = "div" }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [armed, setArmed] = useState(false);
  const inView = useInView(ref, { once: true, amount });

  // Arm before first paint (no flash): only when the observer exists and
  // motion is wanted. Server render and no-JS clients never hide anything.
  useLayoutEffect(() => {
    if (typeof IntersectionObserver === "undefined" || reduce) return;
    // If the element is already in the viewport on mount, do not hide it.
    const r = ref.current?.getBoundingClientRect();
    const alreadyVisible = !!r && r.top < window.innerHeight * 0.9 && r.bottom > 0;
    if (!alreadyVisible) setArmed(true);
  }, [reduce]);

  const hidden = armed && !inView;
  const Tag = motion[as] as typeof motion.div;
  return (
    <Tag
      ref={ref}
      id={id}
      className={className}
      style={style}
      initial={false}
      animate={hidden ? { opacity: 0, y: 20 } : { opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: hidden ? 0 : delay, ease: EASE }}
    >
      {children}
    </Tag>
  );
}
