"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import SectionNumber from "@/components/ui/SectionNumber";
import Button from "@/components/ui/Button";
import {
  LIVE_SOURCE_GROUPS,
  REPRESENTATIVE_SOURCES,
  type ProviderCatalogEntry,
} from "../../../lib/providers/catalog";

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

// Non-staling replacements for the old source counts. These describe the system,
// so they never go out of date as the underlying list grows.
const HERO_STATS = [
  { stat: "Five", label: "Provenance states" },
  { stat: "Sourced", label: "Every figure, every verdict" },
  { stat: "Daily", label: "Archive of the public record" },
];

// The five provenance states, verbatim in spirit from lib/providers/provenance.ts,
// the integrity layer stated plainly. This is descriptive prose, not a source
// list, so it cannot drift from the registry the way a hand-kept vendor list did.
const PROVENANCE_STATES = [
  {
    key: "live",
    label: "Live",
    description:
      "Fetched in real time from an authoritative public source KOANO queried when you ran the analysis. Full trust.",
  },
  {
    key: "partner",
    label: "Partner",
    description:
      "A third-party partner feed. It carries that partner's trust profile and is attributed to them by name, never shown as something KOANO verified itself.",
  },
  {
    key: "representative",
    label: "Representative",
    description:
      "A labeled placeholder for a licensed source KOANO has not funded. You can inspect it, and it is never shown as real.",
  },
  {
    key: "fetch_failed",
    label: "Fetch failed",
    description:
      "A source KOANO covers and attempted, that failed on this run. The figure is shown as missing, never guessed, and it usually clears on a retry.",
  },
  {
    key: "coverage_absent",
    label: "Not covered",
    description:
      "A market or layer KOANO does not cover yet, such as the municipal record outside NYC. Nothing was queried, and the gap is named honestly.",
  },
];

// How a verdict is actually produced, corrected from the pre-Phase-1 copy, which
// described a 24/7 ingestion pipeline and per-tenant schemas that do not exist.
const PIPELINE_STEPS = [
  {
    number: "01",
    title: "Sources called at request time",
    description:
      "When you run an analysis, KOANO queries its live sources right then. There is no cached market report sitting behind the answer. Each figure carries the source it came from and the time it was fetched.",
  },
  {
    number: "02",
    title: "Normalization",
    description:
      "Every signal is normalized to a common shape: location (lat/lng and census tract), timestamp, provenance state, and source attribution. Nothing enters the reasoning without a label.",
  },
  {
    number: "03",
    title: "Storage",
    description:
      "Records are stored in Supabase with Row Level Security enforced, scoping every record to the account that owns it. Dedicated per-tenant isolation is on the enterprise roadmap, not live today.",
  },
  {
    number: "04",
    title: "The daily archive",
    description:
      "Separately, a daily job snapshots the free public record, such as permits, violations, zoning, and ownership, into a weekly time series the source datasets themselves do not keep. Only live data is ever archived.",
  },
  {
    number: "05",
    title: "Reasoning and synthesis",
    description:
      "The assembled signals go to the five specialist agents at once. The synthesis agent arbitrates and issues one verdict, whose overall provenance equals the weakest input it used.",
  },
];

function CoverageChip({ coverage }: { coverage: ProviderCatalogEntry["coverage"] }) {
  return (
    <span
      style={{
        fontFamily: "'DM Mono', monospace",
        fontSize: "10px",
        fontWeight: 500,
        color: coverage === "nyc" ? "var(--mid-blue)" : "var(--ink-muted)",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        border: "1px solid var(--border)",
        borderRadius: "6px",
        padding: "1px 6px",
        flexShrink: 0,
      }}
    >
      {coverage === "nyc" ? "NYC" : "US"}
    </span>
  );
}

export default function DataContent() {
  const heroRef = useRef<HTMLElement>(null);
  const liveRef = useRef<HTMLElement>(null);
  const repRef = useRef<HTMLElement>(null);
  const provRef = useRef<HTMLElement>(null);
  const pipelineRef = useRef<HTMLElement>(null);
  const ctaRef = useRef<HTMLElement>(null);

  const heroInView = useInView(heroRef, { once: true, amount: 0.15 });
  const liveInView = useInView(liveRef, { once: true, amount: 0.05 });
  const repInView = useInView(repRef, { once: true, amount: 0.1 });
  const provInView = useInView(provRef, { once: true, amount: 0.1 });
  const pipelineInView = useInView(pipelineRef, { once: true, amount: 0.1 });
  const ctaInView = useInView(ctaRef, { once: true, amount: 0.15 });

  return (
    <>
      {/* Hero */}
      <section
        ref={heroRef}
        style={{
          background: "var(--white)",
          padding: "160px 32px 120px",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <motion.div
            initial="hidden"
            animate={heroInView ? "visible" : "hidden"}
            variants={fadeUp}
            custom={0}
          >
            <SectionNumber number="01" label="Data transparency" />
          </motion.div>

          <motion.h1
            initial="hidden"
            animate={heroInView ? "visible" : "hidden"}
            variants={fadeUp}
            custom={1}
            className="text-h2"
            style={{
              color: "var(--ink-primary)",
              marginTop: "24px",
              marginBottom: "24px",
            }}
          >
            Every source, on the record.
          </motion.h1>

          <motion.p
            initial="hidden"
            animate={heroInView ? "visible" : "hidden"}
            variants={fadeUp}
            custom={2}
            className="text-body-lg"
            style={{
              color: "var(--ink-secondary)",
              maxWidth: "660px",
              margin: "0 auto 40px",
            }}
          >
            This page is generated straight from the registry the engine runs on,
            so it always shows exactly what KOANO queries and can never drift into
            naming a source we do not use. Most of it is live public data. Some
            figures are honest stand-ins for licensed data we have not funded yet,
            and they say so wherever they appear.
          </motion.p>

          <motion.div
            initial="hidden"
            animate={heroInView ? "visible" : "hidden"}
            variants={fadeUp}
            custom={3}
            style={{
              display: "flex",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            {HERO_STATS.map((item) => (
              <div
                key={item.label}
                style={{
                  background: "var(--pale-wash)",
                  border: "1px solid var(--border)",
                  borderRadius: "16px",
                  padding: "16px 24px",
                  textAlign: "center",
                  minWidth: "160px",
                }}
              >
                <p
                  style={{
                    fontSize: "22px",
                    fontWeight: 700,
                    color: "var(--ink-primary)",
                    letterSpacing: "-0.02em",
                    marginBottom: "4px",
                  }}
                >
                  {item.stat}
                </p>
                <p
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "11px",
                    color: "var(--ink-faint)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  {item.label}
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Live sources, grouped into named families */}
      <section
        ref={liveRef}
        style={{ background: "var(--pale-wash)", padding: "120px 32px" }}
      >
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <motion.div
            initial="hidden"
            animate={liveInView ? "visible" : "hidden"}
            variants={fadeUp}
            custom={0}
            style={{ marginBottom: "64px" }}
          >
            <SectionNumber number="02" label="Live sources" />
            <h2
              className="text-h2"
              style={{
                color: "var(--ink-primary)",
                marginTop: "16px",
                maxWidth: "640px",
              }}
            >
              Live public data, queried in real time.
            </h2>
            <p
              className="text-body-lg"
              style={{
                color: "var(--ink-secondary)",
                maxWidth: "660px",
                marginTop: "24px",
              }}
            >
              KOANO calls authoritative public data at the moment you run an
              analysis: municipal building records, parcel and zoning data,
              recorded sales, federal hazard and climate data, environmental
              contamination records, crime statistics, mortgage and lending
              activity, employment and migration. National sources run anywhere in
              the US. The NYC-tagged municipal layers are the deep local record
              that lets a New York verdict roll up fully live.
            </p>
          </motion.div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "36px",
            }}
          >
            {LIVE_SOURCE_GROUPS.map((family, gi) => (
              <motion.div
                key={family.group}
                custom={gi + 1}
                initial="hidden"
                animate={liveInView ? "visible" : "hidden"}
                variants={fadeUp}
              >
                <p
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "11px",
                    fontWeight: 500,
                    color: "var(--brand-blue)",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    marginBottom: "16px",
                    paddingBottom: "12px",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  {family.group}
                </p>
                <div
                  className="data-source-grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: "12px",
                  }}
                >
                  {family.entries.map((source) => (
                    <div
                      key={source.source}
                      style={{
                        background: "var(--white)",
                        border: "1px solid var(--border)",
                        borderRadius: "12px",
                        padding: "14px 16px",
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "space-between",
                          gap: "8px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "14px",
                            fontWeight: 500,
                            color: "var(--ink-primary)",
                            lineHeight: 1.35,
                          }}
                        >
                          {source.source}
                        </span>
                        <CoverageChip coverage={source.coverage} />
                      </div>
                      <span
                        style={{
                          fontSize: "12px",
                          color: "var(--ink-muted)",
                        }}
                      >
                        {source.usedBy}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Representative sources, the honest gap made the pitch */}
      <section
        ref={repRef}
        style={{ background: "var(--white)", padding: "120px 32px" }}
      >
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <motion.div
            initial="hidden"
            animate={repInView ? "visible" : "hidden"}
            variants={fadeUp}
            custom={0}
            style={{ marginBottom: "64px" }}
          >
            <SectionNumber number="03" label="Representative sources" />
            <h2
              className="text-h2"
              style={{
                color: "var(--ink-primary)",
                marginTop: "16px",
                maxWidth: "640px",
              }}
            >
              The sources KOANO does not run live.
            </h2>
            <p
              className="text-body-lg"
              style={{
                color: "var(--ink-secondary)",
                maxWidth: "660px",
                marginTop: "24px",
              }}
            >
              KOANO runs live everywhere it can. Where a source is licensed
              commercial data we have not funded, it uses a clearly labeled
              representative stand-in and names the license that turns it live.
              These never feed a verdict. They support documents only, and they
              are never shown as real.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            animate={repInView ? "visible" : "hidden"}
            variants={fadeUp}
            custom={1}
          >
            <div
              className="data-rep-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "20px",
              }}
            >
              {REPRESENTATIVE_SOURCES.map((source) => (
                <div
                  key={source.source}
                  className="card"
                  style={{ background: "var(--pale-wash)" }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      marginBottom: "10px",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: "10px",
                        fontWeight: 500,
                        color: "var(--signal-warning)",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        border: "1px solid var(--signal-warning)",
                        borderRadius: "6px",
                        padding: "1px 6px",
                      }}
                    >
                      Representative
                    </span>
                    <span
                      style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: "10px",
                        color: "var(--ink-faint)",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                      }}
                    >
                      {source.category}
                    </span>
                  </div>
                  <h3
                    style={{
                      fontSize: "18px",
                      fontWeight: 500,
                      color: "var(--ink-primary)",
                      marginBottom: "8px",
                      lineHeight: 1.3,
                    }}
                  >
                    {source.source}
                  </h3>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "var(--ink-secondary)",
                      lineHeight: 1.55,
                      marginBottom: "14px",
                    }}
                  >
                    {source.usedBy}
                  </p>
                  {source.swapNote && (
                    <p
                      style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: "12px",
                        color: "var(--ink-muted)",
                        letterSpacing: "0.04em",
                        lineHeight: 1.5,
                        margin: 0,
                        paddingTop: "12px",
                        borderTop: "1px solid var(--border)",
                      }}
                    >
                      {source.swapNote}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Provenance model, the five states */}
      <section
        ref={provRef}
        style={{ background: "var(--pale-wash)", padding: "120px 32px" }}
      >
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <motion.div
            initial="hidden"
            animate={provInView ? "visible" : "hidden"}
            variants={fadeUp}
            custom={0}
            style={{ marginBottom: "64px" }}
          >
            <SectionNumber number="04" label="Provenance" />
            <h2
              className="text-h2"
              style={{
                color: "var(--ink-primary)",
                marginTop: "16px",
                maxWidth: "640px",
              }}
            >
              Every figure carries one of five labels.
            </h2>
            <p
              className="text-body-lg"
              style={{
                color: "var(--ink-secondary)",
                maxWidth: "660px",
                marginTop: "24px",
              }}
            >
              A figure is only as trustworthy as where it came from, so KOANO tags
              each one and keeps the states distinct. A verdict&apos;s overall
              label equals the weakest input it used, so a computed score can never
              hide a stand-in inside a tidy average.
            </p>
          </motion.div>

          <div
            className="data-prov-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "16px",
            }}
          >
            {PROVENANCE_STATES.map((state, i) => (
              <motion.div
                key={state.key}
                custom={i + 1}
                initial="hidden"
                animate={provInView ? "visible" : "hidden"}
                variants={fadeUp}
                className="card"
                style={{ background: "var(--white)" }}
              >
                <span
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "11px",
                    fontWeight: 500,
                    color: "var(--brand-blue)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    display: "block",
                    marginBottom: "10px",
                  }}
                >
                  {state.label}
                </span>
                <p
                  style={{
                    fontSize: "15px",
                    color: "var(--ink-secondary)",
                    lineHeight: 1.55,
                    margin: 0,
                  }}
                >
                  {state.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pipeline architecture */}
      <section
        ref={pipelineRef}
        style={{ background: "var(--white)", padding: "120px 32px" }}
      >
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <motion.div
            initial="hidden"
            animate={pipelineInView ? "visible" : "hidden"}
            variants={fadeUp}
            custom={0}
            style={{ marginBottom: "64px" }}
          >
            <SectionNumber number="05" label="The pipeline" />
            <h2
              className="text-h2"
              style={{
                color: "var(--ink-primary)",
                marginTop: "16px",
                maxWidth: "560px",
              }}
            >
              How data becomes a verdict.
            </h2>
          </motion.div>

          <div
            style={{
              position: "relative",
              maxWidth: "720px",
              margin: "0 auto",
            }}
          >
            {/* Center vertical line */}
            <div
              style={{
                position: "absolute",
                left: "20px",
                top: "12px",
                bottom: "12px",
                width: "1px",
                background: "var(--brand-blue)",
              }}
            />

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0",
              }}
            >
              {PIPELINE_STEPS.map((step, i) => (
                <motion.div
                  key={step.number}
                  custom={i + 1}
                  initial="hidden"
                  animate={pipelineInView ? "visible" : "hidden"}
                  variants={fadeUp}
                  style={{
                    display: "flex",
                    gap: "32px",
                    paddingBottom: i < PIPELINE_STEPS.length - 1 ? "32px" : 0,
                    paddingLeft: "52px",
                    position: "relative",
                  }}
                >
                  {/* Dot */}
                  <div
                    style={{
                      position: "absolute",
                      left: "14px",
                      top: "4px",
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      border: "2px solid var(--brand-blue)",
                      background: "var(--white)",
                    }}
                  />

                  <div
                    className="card"
                    style={{ background: "var(--pale-wash)", flex: 1 }}
                  >
                    <span
                      className="section-number"
                      style={{ display: "block", marginBottom: "10px" }}
                    >
                      {step.number}
                    </span>
                    <h3
                      style={{
                        fontSize: "18px",
                        fontWeight: 500,
                        color: "var(--ink-primary)",
                        marginBottom: "8px",
                        lineHeight: 1.3,
                      }}
                    >
                      {step.title}
                    </h3>
                    <p
                      style={{
                        fontSize: "15px",
                        color: "var(--ink-secondary)",
                        lineHeight: 1.55,
                        margin: 0,
                      }}
                    >
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        ref={ctaRef}
        style={{ background: "var(--pale-wash)", padding: "120px 32px" }}
      >
        <div
          style={{
            maxWidth: "640px",
            margin: "0 auto",
            textAlign: "center",
          }}
        >
          <motion.div
            initial="hidden"
            animate={ctaInView ? "visible" : "hidden"}
            variants={fadeUp}
            custom={0}
          >
            <SectionNumber number="06" />
            <h2
              className="text-h2"
              style={{
                color: "var(--ink-primary)",
                marginTop: "16px",
                marginBottom: "24px",
              }}
            >
              See it on a building you know.
            </h2>
            <p
              style={{
                fontSize: "16px",
                color: "var(--ink-secondary)",
                lineHeight: 1.6,
                marginBottom: "40px",
              }}
            >
              Every KOANO verdict cites its sources and labels every figure. Sign
              up, run three analyses free, and check the work against an address
              you already understand.
            </p>
            <div
              className="flex flex-wrap items-center justify-center"
              style={{ gap: "16px" }}
            >
              <Button variant="primary" href="/signup" id="data-bottom-cta">
                Sign up
              </Button>
              <Button
                variant="ghost"
                href="/intelligence"
                id="data-bottom-intelligence"
              >
                How it works
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <style jsx>{`
        @media (max-width: 1024px) {
          .data-source-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 768px) {
          .data-source-grid,
          .data-rep-grid,
          .data-prov-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
}
