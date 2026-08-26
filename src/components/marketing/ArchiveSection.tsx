"use client";

// ArchiveSection — the compounding record, framed as an accruing asset. The
// visual is deliberately thin: two weekly captures and one honest outage gap,
// which is the real picture today. The words carry the weight, not more data.
// This is an illustrative coverage strip of how the record accrues; the live
// per-week coverage view lives in the dashboards, behind auth.

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

const DATASETS = ["Permits", "Violations", "Zoning", "Ownership"];
// Capture status per week. Honest current picture: two captures, one gap.
// "captured" | "gap" | "upcoming"
const WEEKS: Array<"captured" | "gap" | "upcoming"> = [
  "captured",
  "captured",
  "gap",
  "upcoming",
  "upcoming",
];

function Cell({ status }: { status: "captured" | "gap" | "upcoming" }) {
  const base: React.CSSProperties = {
    width: "16px",
    height: "16px",
    borderRadius: "4px",
  };
  if (status === "captured") return <span style={{ ...base, background: "var(--brand-blue)" }} />;
  if (status === "gap")
    return (
      <span
        title="No capture this week. A run failed. Shown as a gap, never backfilled."
        style={{ ...base, background: "transparent", border: "1px solid var(--signal-warning)" }}
      />
    );
  return <span style={{ ...base, background: "var(--border-light)" }} />;
}

export default function ArchiveSection() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.15 });

  return (
    <section ref={ref} style={{ background: "var(--white)", padding: "120px 32px" }}>
      <div
        className="archive-layout"
        style={{
          maxWidth: "1080px",
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "1.1fr 0.9fr",
          gap: "64px",
          alignItems: "center",
        }}
      >
        {/* Words carry the weight */}
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={fadeUp}
          custom={0}
        >
          <SectionNumber number="03" label="The archive" />
          <h2 className="text-h2" style={{ color: "var(--ink-primary)", marginTop: "16px" }}>
            The public record forgets. KOANO remembers.
          </h2>
          <p
            style={{
              fontSize: "16px",
              lineHeight: 1.7,
              color: "var(--ink-secondary)",
              marginTop: "24px",
            }}
          >
            Government open data tells you the state of a building today. It does
            not keep yesterday. Nobody stores the week-over-week history, so nobody
            can reconstruct it after the fact.
          </p>
          <p
            style={{
              fontSize: "16px",
              lineHeight: 1.7,
              color: "var(--ink-secondary)",
              marginTop: "16px",
            }}
          >
            Every week, KOANO snapshots the free public record into a time series
            of its own. It is thin right now, and that is the honest picture: two
            weekly captures and one gap where a run failed, shown as a gap rather
            than smoothed over. Every week it runs, the record is worth more, and
            it is the one asset a competitor cannot buy back later.
          </p>
        </motion.div>

        {/* The thin, honest coverage strip */}
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={fadeUp}
          custom={1}
          style={{
            background: "var(--pale-wash)",
            border: "1px solid var(--border)",
            borderRadius: "20px",
            padding: "28px",
          }}
        >
          <div
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "10px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--ink-faint)",
              marginBottom: "20px",
            }}
          >
            The record so far
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {DATASETS.map((ds) => (
              <div
                key={ds}
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <span
                  style={{
                    fontSize: "13px",
                    color: "var(--ink-secondary)",
                    width: "80px",
                    flexShrink: 0,
                  }}
                >
                  {ds}
                </span>
                <span style={{ display: "flex", gap: "8px" }}>
                  {WEEKS.map((status, i) => (
                    <Cell key={i} status={status} />
                  ))}
                </span>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "16px",
              marginTop: "24px",
              paddingTop: "16px",
              borderTop: "1px solid var(--border)",
              fontFamily: "'DM Mono', monospace",
              fontSize: "11px",
              color: "var(--ink-muted)",
              letterSpacing: "0.04em",
            }}
          >
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <Cell status="captured" /> captured
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <Cell status="gap" /> gap (run failed)
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <Cell status="upcoming" /> accruing weekly
            </span>
          </div>
        </motion.div>
      </div>

      <style jsx>{`
        @media (max-width: 860px) {
          .archive-layout {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
          }
        }
      `}</style>
    </section>
  );
}
