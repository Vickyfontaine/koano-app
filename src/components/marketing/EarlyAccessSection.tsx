"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import SectionNumber from "../ui/SectionNumber";
import Button from "../ui/Button";

const EASE = [0.16, 1, 0.3, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.08,
      duration: 0.5,
      ease: EASE,
    },
  }),
};

export default function EarlyAccessSection() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.15 });

  return (
    <section
      id="early-access-section"
      ref={ref}
      style={{
        background: "var(--white)",
        padding: "120px 32px",
      }}
    >
      <div
        style={{
          maxWidth: "640px",
          margin: "0 auto",
          textAlign: "center",
        }}
      >
        {/* Section number */}
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={fadeUp}
          custom={0}
        >
          <SectionNumber number="03" />
        </motion.div>

        {/* Headline + subhead — approved copy (KOANO_COPY.md) */}
        <motion.h2
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={fadeUp}
          custom={1}
          className="text-h2"
          style={{
            color: "var(--ink-primary)",
            marginTop: "16px",
            marginBottom: "16px",
          }}
        >
          See it work on a building you know.
        </motion.h2>

        <motion.p
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={fadeUp}
          custom={2}
          className="text-body-lg"
          style={{
            color: "var(--ink-secondary)",
            maxWidth: "560px",
            margin: "0 auto 40px",
          }}
        >
          Sign up and run three full analyses at no cost. Every verdict
          arrives with its reasoning and its sources, so you can check the
          work against what you already know about the address.
        </motion.p>

        {/* Self-serve signup CTA (replaced the retired waitlist email form) */}
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={fadeUp}
          custom={3}
          className="flex flex-wrap items-center justify-center"
          style={{ gap: "16px" }}
        >
          <Button variant="primary" href="/signup" id="early-access-signup">
            Sign up
          </Button>
          <Button variant="ghost" href="/pricing" id="early-access-pricing">
            See pricing
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
