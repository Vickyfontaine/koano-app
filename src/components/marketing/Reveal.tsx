"use client";

// Reveal — the one scroll-entrance mechanism for the marketing site (UI sprint
// WS2, A18). Content is VISIBLE by default: in the server HTML, with no
// JavaScript, for crawlers and link-preview bots, in a headless full-page
// capture, and under reduced motion. The fade-up only runs when an
// IntersectionObserver exists, reduced motion is off, and the element is below
// the fold at mount. A section can never render blank; motion is an
// enhancement, never a gate on content.
//
// Two ways to use it:
//   const show = useReveal(ref);          // boolean; pair with `fadeUp`
//   <motion.div ref={ref} initial={false} animate={show ? "visible" : "hidden"} variants={fadeUp} custom={i} />
// or the `<Reveal>` wrapper for a single block.
//
// Entrance per CLAUDE.md §10: fade-up only (y 20 to 0, opacity 0 to 1), 0.5s,
// easing [0.16, 1, 0.3, 1], stagger 0.08s, no spring, no scale.

import React, { useLayoutEffect, useRef, useState, type RefObject } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

export const EASE = [0.16, 1, 0.3, 1] as const;

export const fadeUp = {
  // The hidden state is applied instantly (never a visible fade-out).
  hidden: { opacity: 0, y: 20, transition: { duration: 0 } },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: EASE },
  }),
};

/**
 * True until the element is known to be below the fold on a client that can
 * animate; then false until it scrolls into view (once). Server render and the
 * first client render always return true, so the HTML is complete and hydration
 * matches.
 */
export function useReveal(ref: RefObject<Element>, options: { amount?: number; once?: boolean } = {}): boolean {
  const { amount = 0.15 } = options;
  const reduce = useReducedMotion();
  const [armed, setArmed] = useState(false);
  const inView = useInView(ref as RefObject<Element>, { once: true, amount });

  useLayoutEffect(() => {
    if (typeof IntersectionObserver === "undefined" || reduce) return;
    const r = ref.current?.getBoundingClientRect();
    const alreadyVisible = !!r && r.top < window.innerHeight * 0.9 && r.bottom > 0;
    if (!alreadyVisible) setArmed(true);
  }, [ref, reduce]);

  return !armed || inView;
}

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
  const show = useReveal(ref, { amount });
  const Tag = motion[as] as typeof motion.div;
  return (
    <Tag
      ref={ref}
      id={id}
      className={className}
      style={style}
      initial={false}
      animate={show ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={show ? { duration: 0.5, delay, ease: EASE } : { duration: 0 }}
    >
      {children}
    </Tag>
  );
}
