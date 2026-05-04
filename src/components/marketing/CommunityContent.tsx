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

const PARTNER_FEEDS = [
  {
    title: "Building violation histories",
    description:
      "Complete histories of HPD violations, ECB violations, and DOB complaints — organized by building and landlord.",
  },
  {
    title: "Landlord harassment records",
    description:
      "Cross-referenced harassment complaint data, court filings, and predatory equity indicators.",
  },
  {
    title: "Displacement risk indicators",
    description:
      "Neighborhood-level displacement risk scores derived from KOANO's full intelligence stack.",
  },
  {
    title: "Affordable housing lottery availability",
    description:
      "Real-time affordable housing lottery listings, income limits, and application deadlines.",
  },
];

export default function CommunityContent() {
  const heroRef = useRef<HTMLElement>(null);
  const missionRef = useRef<HTMLElement>(null);
  const feedRef = useRef<HTMLElement>(null);
  const ctaRef = useRef<HTMLElement>(null);

  const heroInView = useInView(heroRef, { once: true, amount: 0.15 });
  const missionInView = useInView(missionRef, { once: true, amount: 0.1 });
  const feedInView = useInView(feedRef, { once: true, amount: 0.1 });
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
            <SectionNumber number="C0" label="Community" />
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
            KOANO&apos;s conscience.
          </motion.h1>

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
            The same engine that serves institutional investors is made
            available — free of charge — to tenant advocacy organizations and
            community groups. This is not charity. It is the founding principle
            that separates KOANO from every other proptech company in existence.
          </motion.p>

          <motion.div
            initial="hidden"
            animate={heroInView ? "visible" : "hidden"}
            variants={fadeUp}
            custom={3}
            className="flex flex-wrap items-center justify-center"
            style={{ gap: "16px" }}
          >
            <Button
              variant="primary"
              href="/contact"
              id="community-hero-cta"
            >
              Apply for a community feed
            </Button>
            <Button
              variant="ghost"
              href="/about"
              id="community-hero-about"
            >
              Our founding principles
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Mission statement — approved copy verbatim */}
      <section
        ref={missionRef}
        style={{ background: "var(--pale-wash)", padding: "120px 32px" }}
      >
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <motion.div
            initial="hidden"
            animate={missionInView ? "visible" : "hidden"}
            variants={fadeUp}
            custom={0}
            style={{ marginBottom: "64px" }}
          >
            <SectionNumber number="01" label="The principle" />
            <h2
              className="text-h2"
              style={{
                color: "var(--ink-primary)",
                marginTop: "16px",
                maxWidth: "640px",
              }}
            >
              Not a tool for gentrification.
            </h2>
          </motion.div>

          <div
            className="community-mission-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "40px",
              alignItems: "start",
            }}
          >
            <motion.div
              initial="hidden"
              animate={missionInView ? "visible" : "hidden"}
              variants={fadeUp}
              custom={1}
            >
              {/* Verbatim approved copy — Section 10 */}
              <p
                style={{
                  fontSize: "18px",
                  fontWeight: 400,
                  color: "var(--ink-primary)",
                  lineHeight: 1.7,
                  marginBottom: "24px",
                }}
              >
                KOANO is not positioned as a tool for gentrification. The same
                engine that serves institutional investors is made available —
                free of charge, through nonprofit partnerships — to tenant
                advocacy organizations and community groups.
              </p>
              <p
                style={{
                  fontSize: "18px",
                  fontWeight: 400,
                  color: "var(--ink-primary)",
                  lineHeight: 1.7,
                  marginBottom: "24px",
                }}
              >
                This is not charity. It is the founding principle that separates
                KOANO from every other proptech company in existence.
              </p>
              <p
                style={{
                  fontSize: "18px",
                  fontWeight: 400,
                  color: "var(--ink-primary)",
                  lineHeight: 1.7,
                }}
              >
                Cluster 0 is KOANO&apos;s conscience. It earns its weight in
                trust, press, nonprofit partnerships, and moral authority — not
                in revenue.
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              animate={missionInView ? "visible" : "hidden"}
              variants={fadeUp}
              custom={2}
            >
              {/* IMPACCT Brooklyn */}
              <div
                className="card"
                style={{
                  background: "var(--white)",
                  borderColor: "var(--brand-blue)",
                  borderWidth: "1px",
                  borderStyle: "solid",
                  borderRadius: "20px",
                  padding: "32px",
                }}
              >
                <span
                  className="section-number"
                  style={{ display: "block", marginBottom: "16px" }}
                >
                  Partner spotlight
                </span>
                <h3
                  style={{
                    fontSize: "22px",
                    fontWeight: 500,
                    color: "var(--ink-primary)",
                    marginBottom: "8px",
                    lineHeight: 1.3,
                  }}
                >
                  IMPACCT Brooklyn
                </h3>
                <p
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "12px",
                    color: "var(--ink-faint)",
                    letterSpacing: "0.08em",
                    marginBottom: "16px",
                  }}
                >
                  Serving Central Brooklyn since 1964
                </p>
                <p
                  style={{
                    fontSize: "15px",
                    color: "var(--ink-secondary)",
                    lineHeight: 1.55,
                  }}
                >
                  KOANO partners with organizations like IMPACCT Brooklyn to
                  provide community data feeds: building violation histories,
                  landlord harassment records, displacement risk indicators, and
                  affordable housing lottery availability. These partners receive
                  a curated read-only intelligence feed at no cost.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* What partners receive */}
      <section
        ref={feedRef}
        style={{ background: "var(--white)", padding: "120px 32px" }}
      >
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <motion.div
            initial="hidden"
            animate={feedInView ? "visible" : "hidden"}
            variants={fadeUp}
            custom={0}
            style={{ marginBottom: "64px" }}
          >
            <SectionNumber number="02" label="The community feed" />
            <h2
              className="text-h2"
              style={{
                color: "var(--ink-primary)",
                marginTop: "16px",
                maxWidth: "560px",
              }}
            >
              What community partners receive.
            </h2>
            <p
              className="text-body-lg"
              style={{
                color: "var(--ink-secondary)",
                maxWidth: "560px",
                marginTop: "24px",
              }}
            >
              A curated, read-only intelligence feed — at no cost — updated
              continuously from KOANO&apos;s full data pipeline.
            </p>
          </motion.div>

          <div
            className="community-feed-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "20px",
            }}
          >
            {PARTNER_FEEDS.map((item, i) => (
              <motion.div
                key={item.title}
                custom={i + 1}
                initial="hidden"
                animate={feedInView ? "visible" : "hidden"}
                variants={fadeUp}
                className="card"
              >
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

      {/* Partner CTA */}
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
            <SectionNumber number="03" />

            <div
              className="copy-placeholder"
              style={{ marginTop: "24px", marginBottom: "24px" }}
            >
              [COPY TBD — /community page: partner CTA]
            </div>

            <p
              style={{
                fontSize: "16px",
                color: "var(--ink-secondary)",
                lineHeight: 1.6,
                marginBottom: "40px",
              }}
            >
              If you represent a nonprofit, tenant advocacy organization, or
              community group, we&apos;d like to talk. Community feeds are
              provided at no cost and require no technical integration.
            </p>

            <div
              className="flex flex-wrap items-center justify-center"
              style={{ gap: "16px" }}
            >
              <Button
                variant="primary"
                href="/contact"
                id="community-bottom-cta"
              >
                Apply to become a partner
              </Button>
              <Button variant="ghost" href="/about" id="community-bottom-about">
                Our founding story
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <style jsx>{`
        @media (max-width: 900px) {
          .community-mission-grid {
            grid-template-columns: 1fr !important;
          }
          .community-feed-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
}
