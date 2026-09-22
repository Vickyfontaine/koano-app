"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import SectionNumber from "@/components/ui/SectionNumber";
import Button from "@/components/ui/Button";
import {
  HERO_CONTAINER_MAX,
  HERO_HEADLINE_MAX,
  HERO_SECTION_PADDING,
} from "@/components/marketing/heroLayout";
import CtaBackground from "@/components/marketing/CtaBackground";

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
    inputs: "NYC recorded sales · FHFA HPI · Freddie Mac PMMS · HUD Fair Market Rents",
    outputs: "Timing verdict · Confidence score · Signal window",
    description:
      "Reads recorded-sale prices ranked by true distance from the site, the FHFA price index, mortgage rates, and rents, to judge whether conditions favor buying, selling, or waiting.",
  },
  {
    number: "02",
    name: "Infrastructure pipeline",
    file: "infrastructure.ts",
    inputs: "NYC DOB permits · MapPLUTO zoning · Census Building Permits Survey",
    outputs: "Infrastructure impact · Price effect · Timeline",
    description:
      "Tracks approved building permits and the zoning around a parcel, with county new-supply as context, to read the construction and development shaping a site.",
  },
  {
    number: "03",
    name: "Demand sentiment",
    file: "demand-sentiment.ts",
    inputs: "CFPB HMDA · BLS QCEW · IRS migration · Census ACS",
    outputs: "Demand momentum · Gentrification stage (1–7)",
    description:
      "Reads mortgage lending, employment and wages, household migration, and demographic change to gauge where housing demand is strengthening or softening.",
  },
  {
    number: "04",
    name: "Risk & volatility",
    file: "risk-volatility.ts",
    inputs: "FEMA flood + National Risk Index · FBI / NYPD crime · EPA contamination · USGS seismic · violations",
    outputs: "Risk score (1–100) · Risk breakdown",
    description:
      "Aggregates flood and multi-peril hazard, crime, environmental contamination, seismic exposure, and building violations into a single risk score with a full breakdown of the dominant factors.",
  },
  {
    number: "05",
    name: "Regulatory & policy",
    file: "regulatory-policy.ts",
    inputs: "NYC zoning / PLUTO · IRS Opportunity Zones · HUD QCT/DDA · HPD landlord records",
    outputs: "Regulatory risk · Entitlement timeline",
    description:
      "Reads zoning and land-use, Opportunity Zone and LIHTC eligibility, and landlord and violation records for the regulatory risk and entitlement picture on a property.",
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
      "When agents disagree, the disagreement appears in the verdict under Minority signals. Dissent is never hidden. It is the most important signal you can receive.",
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
      "More recent signals are weighted higher. Data from the last 30 days outweighs data from 12 months ago. The engine reasons about now, not about what happened then.",
  },
];

const REASONING_DEMO = [
  { agent: "Market timing", verdict: "Recorded-sale prices rising, sales velocity steady" },
  { agent: "Infrastructure", verdict: "Active DOB permits nearby, multi-year build pipeline" },
  { agent: "Demand sentiment", verdict: "Mortgage lending and in-migration both rising" },
  { agent: "Risk & volatility", verdict: "Risk score 22/100, low flood and crime exposure" },
  { agent: "Regulatory", verdict: "Opportunity Zone tract, FAR headroom on the lot" },
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
          position: "relative",
          overflow: "hidden",
          // Group-A viewport fit: the section is exactly the below-nav viewport
          // height, and the full-bleed image is BOTTOM-anchored (below), so the
          // buildings/park always land on the fold and only the empty TOP sky
          // is cropped when the image is taller than the window — never the
          // content. This is what fixes wide-short windows, where the image is
          // simply too tall to ever shift into view. Image width is 100% and
          // aspect is preserved; no object-fit. Text overlay stays in the sky.
          // +6px extends the section a hair past the fold so the image content
          // covers any sub-pixel seam at the viewport bottom (no hairline gap).
          height: "calc(100svh - var(--nav-h) + 6px)",
        }}
      >
        {/* Hero render — full-bleed, BOTTOM-anchored. Its base (skyline street /
            park foreground) sits on the section bottom = the fold; if the image
            is taller than the window its empty top sky overflows above and is
            clipped (never the buildings). object-fit is deliberately NOT used —
            aspect is preserved and nothing meaningful is cropped. */}
        <img
          src="/renders/how-it-works.webp"
          alt=""
          aria-hidden="true"
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: "100%",
            height: "auto",
            display: "block",
          }}
        />

        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            justifyContent: "flex-start",
            alignItems: "center",
            textAlign: "center",
            padding: HERO_SECTION_PADDING,
          }}
        >
          <div style={{ maxWidth: HERO_CONTAINER_MAX, width: "100%" }}>
          <motion.div
            initial="hidden"
            animate={heroInView ? "visible" : "hidden"}
            variants={fadeUp}
            custom={0}
          >
            <SectionNumber number="01" />
          </motion.div>

          {/* Headline + body — approved copy (KOANO_COPY.md) */}
          <motion.h1
            initial="hidden"
            animate={heroInView ? "visible" : "hidden"}
            variants={fadeUp}
            custom={1}
            style={{
              fontSize: "clamp(36px, 5vw, 64px)",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              lineHeight: 1.1,
              color: "var(--ink-primary)",
              margin: "24px auto 20px",
              maxWidth: HERO_HEADLINE_MAX,
            }}
          >
            Five agents. One verdict. Every step on the record.
          </motion.h1>

          <motion.div
            initial="hidden"
            animate={heroInView ? "visible" : "hidden"}
            variants={fadeUp}
            custom={2}
            className="flex flex-wrap items-center justify-center"
            style={{ gap: "16px", marginTop: "20px" }}
          >
            <Button variant="primary" href="/signup" id="intelligence-hero-cta">
              Sign up
            </Button>
            <Button variant="ghost" href="/pricing" id="intelligence-hero-pricing">
              See pricing
            </Button>
          </motion.div>
          </div>
        </div>
      </section>

      {/* Product demo video */}
      <section style={{ background: "var(--white)", padding: "120px 32px" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto", textAlign: "center" }}>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeUp}
            custom={0}
            style={{ marginBottom: "40px" }}
          >
            <SectionNumber number="02" label="Product demo" />
            <h2 className="text-h2" style={{ color: "var(--ink-primary)", marginTop: "16px" }}>
              Watch the demo.
            </h2>
          </motion.div>

          {/* Demo video slot — 16:9. Drop the product demo in here, e.g.:
              <video src="/renders/demo.mp4" controls playsInline poster="…"
                     style={{ width: "100%", height: "100%", objectFit: "cover" }} /> */}
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            variants={fadeUp}
            custom={1}
            style={{
              position: "relative",
              aspectRatio: "16 / 9",
              borderRadius: "var(--radius-card)",
              overflow: "hidden",
              border: "1px solid var(--border)",
              background: "var(--pale-wash)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "50%",
                background: "var(--brand-blue)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderTop: "12px solid transparent",
                  borderBottom: "12px solid transparent",
                  borderLeft: "20px solid var(--near-black)",
                  marginLeft: "5px",
                }}
              />
            </div>
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
            <SectionNumber number="03" label="The architecture" />
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
              The intelligence is structured as a Russian doll. Each layer
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
              className="arch-l1"
              style={{
                background: "var(--white)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-deep)",
                padding: "40px",
                boxShadow: "var(--shadow-flat)",
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
                Public data queried in real time: census demographics,
                building permits, zoning, hazard and climate data, crime,
                mortgage lending, and recorded sales. Every signal normalized,
                timestamped, and labeled with its source.
              </p>

              {/* Layer 2 — middle */}
              <div
                className="arch-l2"
                style={{
                  background: "var(--pale-wash)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius-card)",
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
                  ingested data. Each agent owns a domain: market timing,
                  infrastructure, demand, risk, and regulatory policy.
                </p>

                {/* Layer 3 — inner */}
                <div
                  className="arch-l3"
                  style={{
                    background: "var(--white)",
                    border: "1px solid var(--brand-blue)",
                    borderRadius: "var(--radius-inner)",
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
                    verdict, with confidence score, signal window, and a full
                    auditable reasoning chain.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
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
            <SectionNumber number="04" label="The agents" />
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
                    style={{ alignSelf: "flex-start", marginTop: "4px", textAlign: "center", justifyContent: "center" }}
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
            <SectionNumber number="05" label="Synthesis" />
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
              simultaneously. It amplifies consensus and surfaces conflicts.
              It never hides them. If agents disagree, the disagreement appears in
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
            <SectionNumber number="06" label="The verdict" />
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
              reasoning chain is not optional. It is the product.
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
                borderRadius: "var(--radius-card)",
                padding: "32px",
                boxShadow: "var(--shadow-flat)",
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
                      className="reason-row"
                      style={{ display: "flex", gap: "12px", fontSize: "13px" }}
                    >
                      <span
                        className="reason-agent"
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
                href="/signup"
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
        style={{
          background: "var(--pale-wash)",
          padding: "120px 32px",
          position: "relative",
          isolation: "isolate",
          overflow: "hidden",
        }}
      >
        <CtaBackground />
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
            <SectionNumber number="07" />
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
              Sign up and run three full analyses free. Every verdict arrives
              with its reasoning and its sources, so you can check the work
              against what you already know about the address.
            </p>
            <div
              className="flex flex-wrap items-center justify-center"
              style={{ gap: "16px" }}
            >
              <Button
                variant="primary"
                href="/signup"
                id="intelligence-bottom-cta"
              >
                Sign up
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
