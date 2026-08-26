"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import SectionNumber from "../ui/SectionNumber";

const AGENTS = [
  {
    number: "01",
    name: "Market timing",
    description: "Reads recorded-sale prices, sales velocity, mortgage rates, and rents to judge whether conditions favor buying, selling, or waiting.",
    output: "Timing verdict · Confidence score · Signal window",
  },
  {
    number: "02",
    name: "Infrastructure pipeline",
    description: "Tracks approved building permits and zoning around a site for the construction and development that moves value.",
    output: "Infrastructure impact · Price effect · Timeline",
  },
  {
    number: "03",
    name: "Demand sentiment",
    description: "Reads mortgage lending, employment and wages, and household migration for where housing demand is heading.",
    output: "Demand momentum · Gentrification stage",
  },
  {
    number: "04",
    name: "Risk & volatility",
    description: "Weighs flood and climate risk, crime, environmental contamination, and building violations into a single risk score.",
    output: "Risk score · Dominant risk factors",
  },
  {
    number: "05",
    name: "Regulatory & policy",
    description: "Reads zoning, Opportunity Zone status, and landlord and violation records for the regulatory risk on a property.",
    output: "Regulatory risk · Entitlement timeline",
  },
];

const EASE = [0.16, 1, 0.3, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.5,
      ease: EASE,
    },
  }),
};

export default function AgentsSection() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });

  return (
    <section
      id="agents-section"
      ref={ref}
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

      <div style={{ maxWidth: "1280px", margin: "0 auto", position: "relative" }}>
        {/* Section header */}
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={fadeUp}
          custom={0}
          style={{ marginBottom: "80px", textAlign: "center" }}
        >
          <SectionNumber number="02" />
          <h2
            className="text-h2"
            style={{
              color: "var(--ink-primary)",
              marginTop: "16px",
            }}
          >
            Five agents. One verdict. Every step auditable.
          </h2>
        </motion.div>

        {/* Agent timeline */}
        <div
          style={{
            position: "relative",
            maxWidth: "900px",
            margin: "0 auto",
          }}
        >
          {/* Agent cards + connector line. The line lives inside this
              wrapper so it spans the five agent rows and terminates at the
              synthesis dot (7px = dot radius) — never past it. */}
          <div style={{ position: "relative" }}>
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: 0,
                bottom: "-7px",
                width: "1px",
                background: "var(--brand-blue)",
                transform: "translateX(-0.5px)",
              }}
            />

            {AGENTS.map((agent, i) => {
            const isLeft = i % 2 === 0;
            return (
              <motion.div
                key={agent.number}
                custom={i + 1}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
                variants={fadeUp}
                style={{
                  position: "relative",
                  display: "flex",
                  justifyContent: isLeft ? "flex-start" : "flex-end",
                  paddingBottom: "40px",
                }}
              >
                {/* Dot on center line — centered on the card's vertical
                    middle. Row height = card height + 40px bottom padding,
                    so the card's center sits at calc(50% - 20px). */}
                <div
                  style={{
                    position: "absolute",
                    left: "50%",
                    top: "calc(50% - 20px)",
                    width: "10px",
                    height: "10px",
                    borderRadius: "50%",
                    border: "2px solid var(--brand-blue)",
                    background: "var(--white)",
                    transform: "translate(-50%, -50%)",
                    zIndex: 2,
                  }}
                />

                {/* Card */}
                <div
                  className="card"
                  style={{
                    maxWidth: "380px",
                    width: "calc(50% - 40px)",
                    position: "relative",
                  }}
                >
                  <span
                    className="section-number"
                    style={{ display: "block", marginBottom: "12px" }}
                  >
                    {agent.number}
                  </span>
                  <h3
                    style={{
                      fontSize: "20px",
                      fontWeight: 500,
                      color: "var(--ink-primary)",
                      marginBottom: "8px",
                      lineHeight: 1.3,
                    }}
                  >
                    {agent.name}
                  </h3>
                  <p
                    style={{
                      fontSize: "15px",
                      fontWeight: 400,
                      color: "var(--ink-secondary)",
                      lineHeight: 1.55,
                      marginBottom: "16px",
                    }}
                  >
                    {agent.description}
                  </p>
                  {/* whiteSpace override: .data-chip is nowrap by default,
                      which overflowed the card on longer outputs. */}
                  <span
                    className="data-chip"
                    style={{
                      whiteSpace: "normal",
                      maxWidth: "100%",
                      lineHeight: 1.6,
                      textAlign: "left",
                    }}
                  >
                    {agent.output}
                  </span>
                </div>
              </motion.div>
            );
          })}
          </div>

          {/* Synthesis node */}
          <motion.div
            custom={6}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={fadeUp}
            style={{
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              paddingBottom: "40px",
            }}
          >
            {/* Filled synthesis dot — the connector line terminates at this
                dot's center (position needed for zIndex to apply). */}
            <div
              style={{
                position: "relative",
                width: "14px",
                height: "14px",
                borderRadius: "50%",
                background: "var(--brand-blue)",
                zIndex: 2,
                marginBottom: "16px",
              }}
            />
            <span
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "12px",
                fontWeight: 500,
                color: "var(--brand-blue)",
                letterSpacing: "0.08em",
                textTransform: "uppercase",
              }}
            >
              Synthesis agent
            </span>
          </motion.div>

          {/* Verdict card */}
          <motion.div
            custom={7}
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={fadeUp}
            style={{
              display: "flex",
              justifyContent: "center",
            }}
          >
            <div
              id="verdict-card-demo"
              style={{
                background: "var(--white)",
                border: "1px solid var(--brand-blue)",
                borderRadius: "20px",
                padding: "28px",
                maxWidth: "440px",
                width: "100%",
                textAlign: "center",
              }}
            >
              <span
                className="data-chip"
                style={{ marginBottom: "16px", display: "inline-flex" }}
              >
                Verdict
              </span>
              <h3
                style={{
                  fontSize: "22px",
                  fontWeight: 500,
                  color: "var(--ink-primary)",
                  marginBottom: "8px",
                }}
              >
                Buy · High confidence
              </h3>
              <p
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "13px",
                  color: "var(--ink-muted)",
                  letterSpacing: "0.08em",
                  marginBottom: "4px",
                }}
              >
                Confidence: 87 / 100 · Signal window: 6–12 months
              </p>
              <p
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "11px",
                  color: "var(--ink-faint)",
                  letterSpacing: "0.08em",
                  marginBottom: "20px",
                }}
              >
                Demo
              </p>
              <a
                href="/intelligence"
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
      </div>

      {/* Mobile responsive: stack cards full-width */}
      <style jsx>{`
        @media (max-width: 768px) {
          #agents-section .card {
            width: 100% !important;
            max-width: 100% !important;
          }
        }
      `}</style>
    </section>
  );
}
