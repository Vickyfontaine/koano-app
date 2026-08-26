"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import SectionNumber from "../ui/SectionNumber";
import ProvenanceLedger from "../ui/ProvenanceLedger";
import { EXAMPLE_LEDGER, EXAMPLE_VERDICT_ADDRESS } from "./exampleVerdict";

const EASE = [0.16, 1, 0.3, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: EASE },
  }),
};

export default function ProvenanceSection() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });

  return (
    <section
      ref={ref}
      style={{ background: "var(--pale-wash)", padding: "120px 32px" }}
    >
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={fadeUp}
          custom={0}
          style={{ marginBottom: "48px", textAlign: "center" }}
        >
          <SectionNumber number="02" label="Provenance" />
          <h2
            className="text-h2"
            style={{ color: "var(--ink-primary)", marginTop: "16px" }}
          >
            Every figure, sourced.
          </h2>
          <p
            className="text-body-lg"
            style={{
              color: "var(--ink-secondary)",
              maxWidth: "640px",
              margin: "24px auto 0",
            }}
          >
            The same verdict, opened up. Every number KOANO used carries its
            value, its provenance, and the exact public source it came from. This
            is the real ledger from the run above. On a New York address every
            figure is live, and where a figure is ever not live, KOANO labels it
            distinctly rather than quietly averaging it in.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={fadeUp}
          custom={1}
        >
          <ProvenanceLedger
            dataPoints={EXAMPLE_LEDGER}
            locationConfidence="confirmed"
            address={EXAMPLE_VERDICT_ADDRESS}
            defaultOpen
          />
        </motion.div>

        <motion.p
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={fadeUp}
          custom={2}
          style={{
            textAlign: "center",
            marginTop: "24px",
            fontSize: "14px",
            color: "var(--ink-muted)",
          }}
        >
          <a
            href="/data"
            style={{
              color: "var(--mid-blue)",
              textDecoration: "none",
              fontWeight: 500,
            }}
          >
            See the five provenance states, and every source →
          </a>
        </motion.p>
      </div>
    </section>
  );
}
