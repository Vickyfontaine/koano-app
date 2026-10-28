"use client";

import React, { useRef } from "react";
import { motion } from "framer-motion";
import { useReveal, fadeUp } from "./Reveal";
import SectionNumber from "../ui/SectionNumber";
import ProvenanceLedger from "../ui/ProvenanceLedger";
import { EXAMPLE_LEDGER, EXAMPLE_VERDICT_ADDRESS, EXAMPLE_VERDICT_LABEL } from "./exampleVerdict";


export default function ProvenanceSection() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useReveal(ref, { once: true, amount: 0.1 });

  return (
    <section
      ref={ref}
      style={{ background: "var(--pale-wash)", padding: "120px 32px" }}
    >
      <div style={{ maxWidth: "var(--content-reading)", margin: "0 auto" }}>
        <motion.div
          initial={false}
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
          <p className="m-only m-lead">
            Every number KOANO used carries its value, its provenance, and the exact public source it came from.
          </p>
          <p
            className="text-body-lg m-drop"
            style={{
              color: "var(--ink-secondary)",
              maxWidth: "640px",
              margin: "24px auto 0",
            }}
          >
            The same verdict, opened up. Every number KOANO used carries its
            value, its provenance, and the exact public source it came from. This
            is the real ledger from the run above. On a New York address every
            figure is fetched live at run time, and where a figure is ever not
            live, KOANO labels it distinctly rather than quietly averaging it in.
          </p>
          <p
            className="m-drop"
            style={{
              fontSize: "13px",
              color: "var(--ink-muted)",
              marginTop: "12px",
            }}
          >
            {EXAMPLE_VERDICT_LABEL}
          </p>
        </motion.div>

        <motion.div
          className="m-drop"
          initial={false}
          animate={isInView ? "visible" : "hidden"}
          variants={fadeUp}
          custom={1}
        >
          <ProvenanceLedger
            dataPoints={EXAMPLE_LEDGER}
            locationConfidence="confirmed"
            address={EXAMPLE_VERDICT_ADDRESS}
            defaultOpen
            recorded
          />
        </motion.div>

        <motion.p
          initial={false}
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
              display: "inline-flex",
              alignItems: "center",
              minHeight: "44px",
              padding: "var(--space-3) 0",
              color: "var(--mid-blue-ink)",
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
