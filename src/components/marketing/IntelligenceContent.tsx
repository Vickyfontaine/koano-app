"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import SectionNumber from "@/components/ui/SectionNumber";
import Button from "@/components/ui/Button";

// The authoritative neural map is /public/neural-map.html (CLAUDE.md
// Section 03) — embedded as a same-origin iframe, the same pattern the
// dashboard embeds use. The former react-three-fiber duplicate broke in
// production (drei <Text> was fed a CSS URL as a font file) and diverged
// from the Section 10 neural-map palette; it has been removed.
function NeuralMapSection() {
  return (
    <iframe
      src="/neural-map.html"
      title="KOANO neural map — agent and data source topology"
      style={{
        width: "100%",
        height: 600,
        border: "1px solid var(--border)",
        borderRadius: "20px",
        background: "var(--white)",
        display: "block",
      }}
    />
  );
}

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

const AGENTS_DETAIL = [
  {
    number: "01",
    name: "Market timing",
    file: "market-timing.ts",
    inputs: "Pricing velocity · DOM trends · Absorption rates",
    outputs: "Timing verdict · Confidence score · Signal window",
    description:
      "Analyzes how fast prices are moving, how long properties sit on the market, and how quickly inventory absorbs — to determine whether conditions favor buying, selling, or waiting.",
  },
  {
    number: "02",
    name: "Infrastructure pipeline",
    file: "infrastructure.ts",
    inputs: "DOT data · Permits (Shovels.ai) · Zoning variances · Municipal bonds",
    outputs: "Infrastructure impact · Price effect · Timeline",
    description:
      "Tracks every permitted project, infrastructure bond, and zoning change within a subject area to surface price-moving signals 6–18 months before they appear in comparable sales.",
  },
  {
    number: "03",
    name: "Demand sentiment",
    file: "demand-sentiment.ts",
    inputs: "Foot traffic (Placer.ai) · Search trends · Review velocity",
    outputs: "Demand momentum · Gentrification stage (1–7)",
    description:
      "Measures foot traffic patterns, search interest, and review velocity to detect demand shifts in real time — before they appear in listing prices.",
  },
  {
    number: "04",
    name: "Risk & volatility",
    file: "risk-volatility.ts",
    inputs: "Climate risk (First Street) · Crime (FBI UCR) · STR saturation",
    outputs: "Risk score (1–100) · Risk breakdown · Risk-adjusted return",
    description:
      "Aggregates climate vulnerability, crime patterns, and short-term rental saturation into a single risk score, with a full breakdown of the dominant risk factors.",
  },
  {
    number: "05",
    name: "Regulatory & policy",
    file: "regulatory-policy.ts",
    inputs: "Zoning (Zoneomics) · City council decisions · FEMA · Opportunity zones",
    outputs: "Regulatory risk · Entitlement timeline",
    description:
      "Monitors the regulatory environment for changes that could affect property value — from city council votes to federal opportunity zone designations.",
  },
];

const ARBITRATION = [
  {
    number: "01",
    title: "Consensus amplification",
    description:
      "When four or more agents agree, confidence rises exponentially. Strong consensus produces high-conviction verdicts with tight signal windows.",
  },
  {
    number: "02",
    title: "Conflict surfacing",
    description:
      "When agents disagree, the disagreement appears in the verdict under Minority signals. Dissent is never hidden — it is the most important signal you can receive.",
  },
  {
    number: "03",
    title: "Domain weighting",
    description:
      "The query type adjusts how agent outputs are weighted. A site acquisition query weights infrastructure and regulatory signals higher. A hold/sell decision weights market timing higher.",
  },
  {
    number: "04",
    title: "Recency bias",
    description:
      "More recent signals are weighted higher. Data from the last 30 days outweighs data from 12 months ago. The engine reasons about now — not about what happened then.",
  },
];

const REASONING_DEMO = [
  { agent: "Market timing", verdict: "Strong buy signal — absorption at 18-year high" },
  { agent: "Infrastructure", verdict: "2 transit projects within 0.5mi — 18-month timeline" },
  { agent: "Demand sentiment", verdict: "Foot traffic up 34% YoY — gentrification stage 4" },
  { agent: "Risk & volatility", verdict: "Risk score 22/100 — low flood, low crime, low STR" },
  { agent: "Regulatory", verdict: "Opportunity zone — tax benefits through 2026" },
];

export default function IntelligenceContent() {
  const heroRef = useRef<HTMLElement>(null);
  const architectureRef = useRef<HTMLElement>(null);
  const agentsRef = useRef<HTMLElement>(null);
  const synthesisRef = useRef<HTMLElement>(null);
  const verdictRef = useRef<HTMLElement>(null);
  const ctaRef = useRef<HTMLElement>(null);

  const heroInView = useInView(heroRef, { once: true, amount: 0.15 });
  const architectureInView = useInView(architectureRef, { once: true, amount: 0.1 });
  const agentsInView = useInView(agentsRef, { once: true, amount: 0.05 });
  const synthesisInView = useInView(synthesisRef, { once: true, amount: 0.1 });
  const verdictInView = useInView(verdictRef, { once: true, amount: 0.15 });
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
            <SectionNumber number="01" />
          </motion.div>

          <motion.div
            initial="hidden"
            animate={heroInView ? "visible" : "hidden"}
            variants={fadeUp}
            custom={1}
            className="copy-placeholder"
            style={{ marginTop: "24px", marginBottom: "24px" }}
          >
            [COPY TBD — /intelligence page headline]
          </motion.div>

          <motion.p
            initial="hidden"
            animate={heroInView ? "visible" : "hidden"}
            variants={fadeUp}
            custom={2}
            className="text-body-lg"
            style={{
              color: "var(--ink-secondary)",
              maxWidth: "640px",
              margin: "0 auto 40px",
            }}
          >
            KOANO is not a data dashboard. It is a coordinated reasoning system
            — five specialist agents that ingest raw signals, reason
            independently, and converge on a single verdict. Every conclusion is
            visible. Every disagreement is surfaced.
          </motion.p>

          <motion.div
            initial="hidden"
            animate={heroInView ? "visible" : "hidden"}
            variants={fadeUp}
            custom={3}
            className="flex flex-wrap items-center justify-center"
            style={{ gap: "16px" }}
          >
            <Button variant="primary" href="/early-access" id="intelligence-hero-cta">
              Get early access
            </Button>
            <Button variant="ghost" href="/pricing" id="intelligence-hero-pricing">
              See pricing
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Architecture — Russian doll */}
      <section
        ref={architectureRef}
        style={{ background: "var(--pale-wash)", padding: "120px 32px" }}
      >
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <motion.div
            initial="hidden"
            animate={architectureInView ? "visible" : "hidden"}
            variants={fadeUp}
            custom={0}
            style={{ marginBottom: "80px", textAlign: "center" }}
          >
            <SectionNumber number="02" label="The architecture" />
            <h2
              className="text-h2"
              style={{ color: "var(--ink-primary)", marginTop: "16px" }}
            >
              Three layers. One answer.
            </h2>
            <p
              className="text-body-lg"
              style={{
                color: "var(--ink-secondary)",
                maxWidth: "560px",
                margin: "24px auto 0",
              }}
            >
              The intelligence is structured as a Russian doll — each layer
              understands the layers inside it. Raw data becomes structured
              signals. Signals become agent verdicts. Agent verdicts become one
              unified conclusion.
            </p>
          </motion.div>

          {/* Russian doll nested visual */}
          <motion.div
            initial="hidden"
            animate={architectureInView ? "visible" : "hidden"}
            variants={fadeUp}
            custom={1}
            style={{ maxWidth: "720px", margin: "0 auto" }}
          >
            {/* Layer 1 — outer */}
            <div
              style={{
                background: "var(--white)",
                border: "1px solid var(--border)",
                borderRadius: "24px",
                padding: "40px",
              }}
            >
              <span
                className="section-number"
                style={{ display: "block", marginBottom: "10px" }}
              >
                Layer 01
              </span>
              <h3
                style={{
                  fontSize: "20px",
                  fontWeight: 500,
                  color: "var(--ink-primary)",
                  marginBottom: "8px",
                }}
              >
                Data ingestion
              </h3>
              <p
                style={{
                  fontSize: "15px",
                  color: "var(--ink-secondary)",
                  lineHeight: 1.55,
                  marginBottom: "32px",
                }}
              >
                Dozens of sources ingested — census, permits, climate risk,
                foot traffic, crime data, zoning changes, and more. Every
                signal normalized and timestamped.
              </p>

              {/* Layer 2 — middle */}
              <div
                style={{
                  background: "var(--pale-wash)",
                  border: "1px solid var(--border)",
                  borderRadius: "20px",
                  padding: "32px",
                }}
              >
                <span
                  className="section-number"
                  style={{ display: "block", marginBottom: "10px" }}
                >
                  Layer 02
                </span>
                <h3
                  style={{
                    fontSize: "20px",
                    fontWeight: 500,
                    color: "var(--ink-primary)",
                    marginBottom: "8px",
                  }}
                >
                  Agent reasoning
                </h3>
                <p
                  style={{
                    fontSize: "15px",
                    color: "var(--ink-secondary)",
                    lineHeight: 1.55,
                    marginBottom: "32px",
                  }}
                >
                  Five specialist agents reason independently against the
                  ingested data. Each agent owns a domain — market timing,
                  infrastructure, demand, risk, and regulatory policy.
                </p>

                {/* Layer 3 — inner */}
                <div
                  style={{
                    background: "var(--white)",
                    border: "1px solid var(--brand-blue)",
                    borderRadius: "16px",
                    padding: "24px",
                    textAlign: "center",
                  }}
                >
                  <span
                    className="section-number"
                    style={{ display: "block", marginBottom: "10px" }}
                  >
                    Layer 03
                  </span>
                  <h3
                    style={{
                      fontSize: "20px",
                      fontWeight: 500,
                      color: "var(--ink-primary)",
                      marginBottom: "8px",
                    }}
                  >
                    Synthesis verdict
                  </h3>
                  <p
                    style={{
                      fontSize: "15px",
                      color: "var(--ink-secondary)",
                      lineHeight: 1.55,
                    }}
                  >
                    One synthesis agent receives all five agent outputs
                    simultaneously, arbitrates conflicts, and issues a single
                    verdict — with confidence score, signal window, and a full
                    auditable reasoning chain.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Neural pathway visualization */}
      <section
        style={{
          background: "var(--pale-wash)",
          padding: "80px 32px 120px",
        }}
      >
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "11px",
                fontWeight: 500,
                color: "var(--brand-blue)",
                letterSpacing: "1.5px",
                textTransform: "uppercase",
              }}
            >
              Live agent network
            </span>
            <p
              style={{
                fontSize: "15px",
                color: "var(--ink-muted)",
                marginTop: "12px",
                maxWidth: "480px",
                margin: "12px auto 0",
              }}
            >
              Five specialist agents connected to their data sources, flowing
              into a single synthesis verdict. Drag to rotate.
            </p>
          </div>
          <NeuralMapSection />
        </div>
      </section>

      {/* The 5 agents */}
      <section
        ref={agentsRef}
        style={{
          background: "var(--white)",
          padding: "120px 32px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle grid overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: `
              linear-gradient(var(--border-light) 1px, transparent 1px),
              linear-gradient(90deg, var(--border-light) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
            opacity: 0.5,
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            position: "relative",
          }}
        >
          <motion.div
            initial="hidden"
            animate={agentsInView ? "visible" : "hidden"}
            variants={fadeUp}
            custom={0}
            style={{ marginBottom: "80px", textAlign: "center" }}
          >
            <SectionNumber number="03" label="The agents" />
            <h2
              className="text-h2"
              style={{ color: "var(--ink-primary)", marginTop: "16px" }}
            >
              Five specialists. One for each domain.
            </h2>
          </motion.div>

          <div
            className="intelligence-agents-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "20px",
              maxWidth: "960px",
              margin: "0 auto",
            }}
          >
            {AGENTS_DETAIL.map((agent, i) => (
              <motion.div
                key={agent.number}
                custom={i + 1}
                initial="hidden"
                animate={agentsInView ? "visible" : "hidden"}
                variants={fadeUp}
                className="card"
                style={
                  i === 4
                    ? {
                        gridColumn: "1 / -1",
                        maxWidth: "460px",
                        margin: "0 auto",
                        width: "100%",
                      }
                    : {}
                }
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "16px",
                  }}
                >
                  <span className="section-number">{agent.number}</span>
                  <span
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: "11px",
                      color: "var(--ink-faint)",
                      letterSpacing: "0.08em",
                    }}
                  >
                    {agent.file}
                  </span>
                </div>
                <h3
                  style={{
                    fontSize: "20px",
                    fontWeight: 500,
                    color: "var(--ink-primary)",
                    marginBottom: "10px",
                    lineHeight: 1.3,
                  }}
                >
                  {agent.name}
                </h3>
                <p
                  style={{
                    fontSize: "15px",
                    color: "var(--ink-secondary)",
                    lineHeight: 1.55,
                    marginBottom: "20px",
                  }}
                >
                  {agent.description}
                </p>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "8px",
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: "10px",
                        fontWeight: 500,
                        color: "var(--ink-faint)",
                        letterSpacing: "0.12em",
                        textTransform: "uppercase",
                      }}
                    >
                      Inputs
                    </span>
                    <p
                      style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: "12px",
                        color: "var(--ink-muted)",
                        letterSpacing: "0.06em",
                        marginTop: "4px",
                      }}
                    >
                      {agent.inputs}
                    </p>
                  </div>
                  <span
                    className="data-chip"
                    style={{ alignSelf: "flex-start", marginTop: "4px" }}
                  >
                    {agent.outputs}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Synthesis & arbitration */}
      <section
        ref={synthesisRef}
        style={{ background: "var(--pale-wash)", padding: "120px 32px" }}
      >
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <motion.div
            initial="hidden"
            animate={synthesisInView ? "visible" : "hidden"}
            variants={fadeUp}
            custom={0}
            style={{ marginBottom: "64px" }}
          >
            <SectionNumber number="04" label="Synthesis" />
            <h2
              className="text-h2"
              style={{
                color: "var(--ink-primary)",
                marginTop: "16px",
                maxWidth: "640px",
              }}
            >
              When agents disagree, you see it.
            </h2>
            <p
              className="text-body-lg"
              style={{
                color: "var(--ink-secondary)",
                maxWidth: "640px",
                marginTop: "24px",
              }}
            >
              The synthesis agent receives all five structured outputs
              simultaneously. It amplifies consensus and surfaces conflicts —
              never hides them. If agents disagree, the disagreement appears in
              the verdict as a minority signal.
            </p>
          </motion.div>

          <div
            className="intelligence-arb-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "20px",
            }}
          >
            {ARBITRATION.map((item, i) => (
              <motion.div
                key={item.title}
                custom={i + 1}
                initial="hidden"
                animate={synthesisInView ? "visible" : "hidden"}
                variants={fadeUp}
                className="card"
                style={{ background: "var(--white)" }}
              >
                <span
                  className="section-number"
                  style={{ display: "block", marginBottom: "12px" }}
                >
                  {item.number}
                </span>
                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: 500,
                    color: "var(--ink-primary)",
                    marginBottom: "10px",
                    lineHeight: 1.3,
                  }}
                >
                  {item.title}
                </h3>
                <p
                  style={{
                    fontSize: "15px",
                    color: "var(--ink-secondary)",
                    lineHeight: 1.55,
                    margin: 0,
                  }}
                >
                  {item.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Verdict output */}
      <section
        ref={verdictRef}
        style={{ background: "var(--white)", padding: "120px 32px" }}
      >
        <div style={{ maxWidth: "960px", margin: "0 auto" }}>
          <motion.div
            initial="hidden"
            animate={verdictInView ? "visible" : "hidden"}
            variants={fadeUp}
            custom={0}
            style={{ marginBottom: "64px", textAlign: "center" }}
          >
            <SectionNumber number="05" label="The verdict" />
            <h2
              className="text-h2"
              style={{ color: "var(--ink-primary)", marginTop: "16px" }}
            >
              A decision, not a dashboard.
            </h2>
            <p
              className="text-body-lg"
              style={{
                color: "var(--ink-secondary)",
                maxWidth: "560px",
                margin: "24px auto 0",
              }}
            >
              Every KOANO verdict is a structured output with a headline,
              confidence score, signal window, and full reasoning chain. The
              reasoning chain is not optional — it is the product.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            animate={verdictInView ? "visible" : "hidden"}
            variants={fadeUp}
            custom={1}
            style={{ maxWidth: "560px", margin: "0 auto" }}
          >
            <div
              style={{
                background: "var(--white)",
                border: "1px solid var(--brand-blue)",
                borderRadius: "20px",
                padding: "32px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "20px",
                }}
              >
                <span className="data-chip">Verdict</span>
                <span
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "11px",
                    color: "var(--ink-faint)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  Demo
                </span>
              </div>

              <h3
                style={{
                  fontSize: "28px",
                  fontWeight: 500,
                  color: "var(--ink-primary)",
                  marginBottom: "8px",
                }}
              >
                Buy
              </h3>
              <p
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "13px",
                  color: "var(--ink-muted)",
                  letterSpacing: "0.06em",
                  marginBottom: "4px",
                }}
              >
                Confidence: 87 / 100
              </p>
              <p
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "13px",
                  color: "var(--ink-muted)",
                  letterSpacing: "0.06em",
                  marginBottom: "24px",
                }}
              >
                Signal window: 6–12 months
              </p>

              <div
                style={{
                  borderTop: "1px solid var(--border)",
                  paddingTop: "20px",
                  marginBottom: "20px",
                }}
              >
                <p
                  style={{
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "var(--ink-primary)",
                    marginBottom: "14px",
                  }}
                >
                  Reasoning chain
                </p>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  {REASONING_DEMO.map((item) => (
                    <div
                      key={item.agent}
                      style={{ display: "flex", gap: "12px", fontSize: "13px" }}
                    >
                      <span
                        style={{
                          fontFamily: "'DM Mono', monospace",
                          color: "var(--brand-blue)",
                          flexShrink: 0,
                          fontSize: "11px",
                          letterSpacing: "0.06em",
                          paddingTop: "1px",
                          width: "130px",
                        }}
                      >
                        {item.agent}
                      </span>
                      <span style={{ color: "var(--ink-secondary)" }}>
                        {item.verdict}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <a
                href="/early-access"
                style={{
                  fontSize: "14px",
                  fontWeight: 500,
                  color: "var(--mid-blue)",
                  textDecoration: "none",
                }}
              >
                View full reasoning chain →
              </a>
            </div>
          </motion.div>
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
              The intelligence is ready.
            </h2>
            <p
              style={{
                fontSize: "16px",
                color: "var(--ink-secondary)",
                lineHeight: 1.6,
                marginBottom: "40px",
              }}
            >
              KOANO is currently in private early access. Request access and
              we&apos;ll notify you when your cluster is ready.
            </p>
            <div
              className="flex flex-wrap items-center justify-center"
              style={{ gap: "16px" }}
            >
              <Button
                variant="primary"
                href="/early-access"
                id="intelligence-bottom-cta"
              >
                Get early access
              </Button>
              <Button variant="ghost" href="/pricing" id="intelligence-bottom-pricing">
                See pricing
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <style jsx>{`
        @media (max-width: 768px) {
          .intelligence-agents-grid {
            grid-template-columns: 1fr !important;
          }
          .intelligence-arb-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
}
