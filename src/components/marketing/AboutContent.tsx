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

              {/* Hero — approved copy (KOANO_COPY.md) */}
              <motion.h1
                initial="hidden"
                animate={heroInView ? "visible" : "hidden"}
                variants={fadeUp}
                custom={1}
                style={{
                  fontSize: "clamp(32px, 4vw, 52px)",
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.15,
                  color: "var(--ink-primary)",
                  margin: "24px 0 20px",
                }}
              >
                Real estate has more data than almost any industry, and less
                intelligence.
              </motion.h1>
              <motion.p
                initial="hidden"
                animate={heroInView ? "visible" : "hidden"}
                variants={fadeUp}
                custom={1.5}
                className="text-body-lg"
                style={{
                  color: "var(--ink-secondary)",
                  marginBottom: "32px",
                }}
              >
                The information is public. The zoning is published. The permits
                are filed. The bonds are issued and the census is taken. And
                yet the work of turning any of it into a decision still happens
                the way it did thirty years ago, which is a person, a
                spreadsheet, and a week.
              </motion.p>

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
                  href="/for/community"
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

          {/* Founding story — approved copy (KOANO_COPY.md) */}
          <motion.div
            initial="hidden"
            animate={teamInView ? "visible" : "hidden"}
            variants={fadeUp}
            custom={1}
            style={{
              maxWidth: "720px",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
          >
            <h3
              style={{
                fontSize: "22px",
                fontWeight: 500,
                color: "var(--ink-primary)",
                margin: 0,
              }}
            >
              Why this exists
            </h3>
            <p style={{ fontSize: "16px", lineHeight: 1.7, color: "var(--ink-secondary)", margin: 0 }}>
              The gap is not data. It is reasoning. Nobody is short of sources.
              What people are short of is the days it takes to read a zoning
              code, cross-reference a permit history, and figure out whether a
              community board is going to hand you a problem. That work is
              tedious, it is expensive, and it is exactly the kind of work a
              capable model can do now.
            </p>
            <p style={{ fontSize: "16px", lineHeight: 1.7, color: "var(--ink-secondary)", margin: 0 }}>
              KOANO is an attempt to do it honestly. Every figure in the
              product is labeled with where it came from. Every verdict is
              written to a record that cannot be edited afterward. When the
              engine disagrees with itself, it says so instead of averaging
              the disagreement away. That is not a feature. It is the reason
              the thing is worth trusting at all.
            </p>
            <h3
              style={{
                fontSize: "22px",
                fontWeight: 500,
                color: "var(--ink-primary)",
                margin: "16px 0 0",
              }}
            >
              The part that is harder to say
            </h3>
            <p style={{ fontSize: "16px", lineHeight: 1.7, color: "var(--ink-secondary)", margin: 0 }}>
              A tool that makes development faster is a tool that makes
              development faster. That has a history in this city, and the
              people who lose in that history are usually the ones who were
              never in the room.
            </p>
            <p style={{ fontSize: "16px", lineHeight: 1.7, color: "var(--ink-secondary)", margin: 0 }}>
              KOANO is not going to claim it solves that. It has not earned the
              standing to. What it can say is that the same engine that reads a
              site for a developer can read a building for the person living in
              it, and that the intention is to build that second thing rather
              than talk about it. Not as a gesture. As a product, once there is
              a product to give.
            </p>
            <p style={{ fontSize: "16px", lineHeight: 1.7, color: "var(--ink-secondary)", margin: 0 }}>
              Today there is a demo, running on public data. That is the whole
              of it.
            </p>
            <div style={{ marginTop: "16px" }}>
              <p style={{ fontSize: "16px", fontWeight: 500, color: "var(--ink-primary)", margin: 0 }}>
                Victor Fontaine
              </p>
              <p
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "12px",
                  letterSpacing: "0.08em",
                  color: "var(--ink-faint)",
                  margin: "4px 0 0",
                }}
              >
                Founder, KOANO
              </p>
            </div>
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
              <Button variant="ghost" href="/for/community" id="about-bottom-community">
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
