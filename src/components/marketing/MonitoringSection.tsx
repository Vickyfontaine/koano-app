"use client";

// MonitoringSection — the weekly diff → in-app feed → Monday digest loop. The
// example alerts below use KOANO's EXACT notification templates (verbatim from
// lib/monitor/detect.ts); only the before/after values are illustrative, and the
// section says so. The template wording is the real product's, including the
// engine's own arrows and the sale-vs-re-registration caveat that leads by design.

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import SectionNumber from "../ui/SectionNumber";

const EASE = [0.16, 1, 0.3, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: EASE },
  }),
};

// Verbatim KOANO notification templates, filled with illustrative values.
const EXAMPLE_ALERTS = [
  {
    title: "Ownership record changed",
    body:
      "This may be a sale, or the same owner re-registering under a slightly different name. KOANO matches names exactly and cannot tell the two apart. Registered owner: SMITH REALTY LLC → 3RD STREET HOLDINGS LLC.",
  },
  {
    title: "HPD violations resolved",
    body: "Open HPD violations: 7 → 3 (4 resolved).",
  },
  {
    title: "Comp price movement in this ZIP",
    body:
      "Median recorded $/sq ft in this ZIP: $1,120 → $1,154 (+3%), over 100 recorded sales.",
  },
];

export default function MonitoringSection() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });

  return (
    <section ref={ref} style={{ background: "var(--pale-wash)", padding: "120px 32px" }}>
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={fadeUp}
          custom={0}
          style={{ marginBottom: "48px", textAlign: "center" }}
        >
          <SectionNumber number="04" label="Monitoring" />
          <h2 className="text-h2" style={{ color: "var(--ink-primary)", marginTop: "16px" }}>
            It watches the buildings you are watching.
          </h2>
          <p
            className="text-body-lg"
            style={{
              color: "var(--ink-secondary)",
              maxWidth: "660px",
              margin: "24px auto 0",
            }}
          >
            Add a property and KOANO checks its public record every week, diffs it
            against the week before, and tells you only what actually changed. It
            reports the before and after it read from two snapshots, with no
            inference and no adjectives the data does not support, in the app and
            in a Monday digest.
          </p>
        </motion.div>

        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={fadeUp}
          custom={1}
        >
          <div
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "10px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--ink-faint)",
              marginBottom: "16px",
              textAlign: "center",
            }}
          >
            Example alerts, in KOANO&apos;s exact wording
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {EXAMPLE_ALERTS.map((alert) => (
              <div
                key={alert.title}
                style={{
                  background: "var(--white)",
                  border: "1px solid var(--border)",
                  borderLeft: "3px solid var(--brand-blue)",
                  borderRadius: "0 14px 14px 0",
                  padding: "18px 20px",
                }}
              >
                <p
                  style={{
                    fontSize: "15px",
                    fontWeight: 500,
                    color: "var(--ink-primary)",
                    margin: "0 0 6px",
                  }}
                >
                  {alert.title}
                </p>
                <p
                  style={{
                    fontSize: "14px",
                    lineHeight: 1.6,
                    color: "var(--ink-secondary)",
                    margin: 0,
                  }}
                >
                  {alert.body}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.p
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={fadeUp}
          custom={2}
          style={{
            textAlign: "center",
            marginTop: "24px",
            fontSize: "13px",
            color: "var(--ink-muted)",
            maxWidth: "620px",
            marginLeft: "auto",
            marginRight: "auto",
            lineHeight: 1.6,
          }}
        >
          Every alert is a fixed template filled with values read straight from the
          record. It is a factual claim leaving KOANO by email, so nothing in it is
          written by a model.
        </motion.p>
      </div>
    </section>
  );
}
