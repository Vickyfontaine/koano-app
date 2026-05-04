"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import SectionNumber from "@/components/ui/SectionNumber";
import Button from "@/components/ui/Button";

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

const WHAT_WE_ARE_NOT = [
  {
    label: "NOT a Zillow / Redfin clone",
    description:
      "We do not show listings, estimated values, or search results. We show verdicts.",
  },
  {
    label: "NOT a data dashboard",
    description:
      "We do not give you charts and ask you to figure it out. We give you a conclusion.",
  },
  {
    label: "NOT a listing platform",
    description:
      "We do not sell attention to agents or brokers. We sell intelligence to decision-makers.",
  },
  {
    label: "NOT a black box",
    description:
      "Showing the reasoning is not a feature. It is the product. Every conclusion is auditable.",
  },
];

const PRINCIPLES = [
  {
    number: "01",
    title: "Reasoning over reporting",
    description:
      "Real estate has always had data. What it has never had is a brain. KOANO does not report data — it reasons about it.",
  },
  {
    number: "02",
    title: "Transparency as trust",
    description:
      "Every verdict comes with a full reasoning chain. You can see exactly why KOANO reached its conclusion — and exactly where its agents disagreed.",
  },
  {
    number: "03",
    title: "Intelligence for everyone",
    description:
      "The same engine that helps a REIT make a $50M acquisition also tells a renter in Crown Heights if their building is safe. This is not a coincidence. It is the architecture.",
  },
  {
    number: "04",
    title: "Decisions, not dashboards",
    description:
      "KOANO ends at a verdict. Buy, sell, hold, wait, or drop — with a confidence score, a signal window, and every step of the thinking that got there.",
  },
];

export default function AboutContent() {
  const heroRef = useRef<HTMLElement>(null);
  const principlesRef = useRef<HTMLElement>(null);
  const notRef = useRef<HTMLElement>(null);
  const teamRef = useRef<HTMLElement>(null);
  const ctaRef = useRef<HTMLElement>(null);

  const heroInView = useInView(heroRef, { once: true, amount: 0.15 });
  const principlesInView = useInView(principlesRef, { once: true, amount: 0.1 });
  const notInView = useInView(notRef, { once: true, amount: 0.1 });
  const teamInView = useInView(teamRef, { once: true, amount: 0.15 });
  const ctaInView = useInView(ctaRef, { once: true, amount: 0.15 });

  return (
    <>
      {/* Hero */}
      <section
        ref={heroRef}
        style={{
          background: "var(--white)",
          padding: "160px 32px 120px",
        }}
      >
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <div
            className="about-hero-layout"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "80px",
              alignItems: "start",
            }}
          >
            <div>
              <motion.div
                initial="hidden"
                animate={heroInView ? "visible" : "hidden"}
                variants={fadeUp}
                custom={0}
              >
                <SectionNumber number="01" label="About KOANO" />
              </motion.div>

              {/* COPY TBD */}
              <motion.div
                initial="hidden"
                animate={heroInView ? "visible" : "hidden"}
                variants={fadeUp}
                custom={1}
                className="copy-placeholder"
                style={{ marginTop: "24px", marginBottom: "32px" }}
              >
                [COPY TBD — /about page: founding story and team]
              </motion.div>

              <motion.div
                initial="hidden"
                animate={heroInView ? "visible" : "hidden"}
                variants={fadeUp}
                custom={2}
                className="flex flex-wrap"
                style={{ gap: "16px" }}
              >
                <Button
                  variant="primary"
                  href="/early-access"
                  id="about-hero-cta"
                >
                  Get early access
                </Button>
                <Button
                  variant="ghost"
                  href="/community"
                  id="about-hero-community"
                >
                  Our community mission
                </Button>
              </motion.div>
            </div>

            <motion.div
              initial="hidden"
              animate={heroInView ? "visible" : "hidden"}
              variants={fadeUp}
              custom={3}
            >
              {/* Promise quote */}
              <div
                style={{
                  padding: "40px",
                  borderLeft: "2px solid var(--brand-blue)",
                }}
              >
                <p
                  style={{
                    fontSize: "22px",
                    fontWeight: 500,
                    color: "var(--ink-primary)",
                    lineHeight: 1.5,
                    marginBottom: "24px",
                    fontStyle: "italic",
                  }}
                >
                  &ldquo;The same intelligence that helps a REIT make a $50M
                  acquisition also tells a renter in Crown Heights if their
                  building is safe.&rdquo;
                </p>
                <span
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "12px",
                    color: "var(--ink-faint)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  KOANO founding promise
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Founding principles */}
      <section
        ref={principlesRef}
        style={{ background: "var(--pale-wash)", padding: "120px 32px" }}
      >
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <motion.div
            initial="hidden"
            animate={principlesInView ? "visible" : "hidden"}
            variants={fadeUp}
            custom={0}
            style={{ marginBottom: "64px" }}
          >
            <SectionNumber number="02" label="Principles" />
            <h2
              className="text-h2"
              style={{
                color: "var(--ink-primary)",
                marginTop: "16px",
                maxWidth: "560px",
              }}
            >
              What we believe.
            </h2>
          </motion.div>

          <div
            className="about-principles-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "20px",
            }}
          >
            {PRINCIPLES.map((item, i) => (
              <motion.div
                key={item.title}
                custom={i + 1}
                initial="hidden"
                animate={principlesInView ? "visible" : "hidden"}
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
                    fontSize: "20px",
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

      {/* What KOANO is NOT */}
      <section
        ref={notRef}
        style={{ background: "var(--white)", padding: "120px 32px" }}
      >
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <motion.div
            initial="hidden"
            animate={notInView ? "visible" : "hidden"}
            variants={fadeUp}
            custom={0}
            style={{ marginBottom: "64px" }}
          >
            <SectionNumber number="03" label="What we are not" />
            <h2
              className="text-h2"
              style={{
                color: "var(--ink-primary)",
                marginTop: "16px",
                maxWidth: "560px",
              }}
            >
              A new category.
            </h2>
            <p
              className="text-body-lg"
              style={{
                color: "var(--ink-secondary)",
                maxWidth: "560px",
                marginTop: "24px",
              }}
            >
              KOANO is a real estate reasoning engine. This is a new category
              — not analytics, not listings, not data.
            </p>
          </motion.div>

          <div
            className="about-not-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "20px",
            }}
          >
            {WHAT_WE_ARE_NOT.map((item, i) => (
              <motion.div
                key={item.label}
                custom={i + 1}
                initial="hidden"
                animate={notInView ? "visible" : "hidden"}
                variants={fadeUp}
                className="card"
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginBottom: "12px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "18px",
                      color: "var(--signal-negative)",
                      fontWeight: 700,
                      lineHeight: 1,
                    }}
                  >
                    ✕
                  </span>
                  <h3
                    style={{
                      fontSize: "16px",
                      fontWeight: 500,
                      color: "var(--ink-primary)",
                      lineHeight: 1.3,
                    }}
                  >
                    {item.label}
                  </h3>
                </div>
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

      {/* Team */}
      <section
        ref={teamRef}
        style={{ background: "var(--pale-wash)", padding: "120px 32px" }}
      >
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <motion.div
            initial="hidden"
            animate={teamInView ? "visible" : "hidden"}
            variants={fadeUp}
            custom={0}
            style={{ marginBottom: "48px" }}
          >
            <SectionNumber number="04" label="Team" />
            <h2
              className="text-h2"
              style={{
                color: "var(--ink-primary)",
                marginTop: "16px",
                maxWidth: "480px",
              }}
            >
              The people behind it.
            </h2>
          </motion.div>

          <motion.div
            initial="hidden"
            animate={teamInView ? "visible" : "hidden"}
            variants={fadeUp}
            custom={1}
            className="copy-placeholder"
          >
            [COPY TBD — /about page: founding story and team]
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section
        ref={ctaRef}
        style={{ background: "var(--white)", padding: "120px 32px" }}
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
            <SectionNumber number="05" />
            <h2
              className="text-h2"
              style={{
                color: "var(--ink-primary)",
                marginTop: "16px",
                marginBottom: "24px",
              }}
            >
              Join us early.
            </h2>
            <p
              style={{
                fontSize: "16px",
                color: "var(--ink-secondary)",
                lineHeight: 1.6,
                marginBottom: "40px",
              }}
            >
              KOANO is in private early access. We&apos;re onboarding users
              cluster by cluster, starting with those who will help us build the
              most accurate reasoning engine in real estate.
            </p>
            <div
              className="flex flex-wrap items-center justify-center"
              style={{ gap: "16px" }}
            >
              <Button
                variant="primary"
                href="/early-access"
                id="about-bottom-cta"
              >
                Get early access
              </Button>
              <Button variant="ghost" href="/community" id="about-bottom-community">
                Our community mission
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <style jsx>{`
        @media (max-width: 900px) {
          .about-hero-layout {
            grid-template-columns: 1fr !important;
            gap: 48px !important;
          }
          .about-principles-grid,
          .about-not-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
}
