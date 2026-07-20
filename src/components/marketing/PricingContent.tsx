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

const TIERS = [
  {
    cluster: "C1",
    name: "Property intelligence",
    tagline:
      "Know what's happening to your property's value before your neighbors do — and know what to do about it.",
    price: "From $19",
    priceRange: "$19–$49 / month",
    users: "Homeowners · Renters · Neighbors",
    features: [
      "Automated valuation model with velocity indicator",
      "Equity position & 12-month projection",
      "Neighborhood signal feed — permits, zoning, infrastructure",
      "KOANO verdict: Hold / prepare to sell / sell now",
      "Scenario modeling for nearby developments",
      "Push alert feed for significant signals",
    ],
    addOn: "Cap rate, ARV modeling & cash-on-cash projections at $49/mo",
    href: "/for/community",
  },
  {
    cluster: "C2",
    name: "Transaction intelligence",
    tagline:
      "Find opportunities before they hit the MLS. Make data-backed recommendations that close deals.",
    price: "From $149",
    priceRange: "$149–$299 / month",
    users: "Agents · Brokers · Mortgage officers",
    features: [
      "Multi-market velocity heatmap",
      "Absorption rate by micro-market",
      "DOM trends — where days-on-market is compressing",
      "Price reduction pattern detection",
      "CMA builder with KOANO early-signal overlay",
      "Client-ready PDF report generator",
    ],
    addOn: "Neighborhood narrative generator & pricing recommendation engine",
    href: "/for/agents",
  },
  {
    cluster: "C4",
    name: "Development intelligence",
    tagline:
      "Find your best site. Model your deal. Understand your entitlement risk. Before anyone else does.",
    price: "From $499",
    priceRange: "$499–$1,499 / month",
    users: "CRE brokers · Developers · Contractors",
    features: [
      "Multi-site comparison — KOANO composite score",
      "Zoning & entitlement risk breakdown per site",
      "BSA approval rate history by submarket",
      "Community board sentiment & opposition prediction",
      "Pro forma intelligence — land costs, construction benchmarks",
      "IRR projection with sensitivity table",
    ],
    addOn: "Permitting timeline benchmarks & absorption projections",
    href: "/for/developers",
  },
  {
    cluster: "C5",
    name: "Portfolio intelligence",
    tagline:
      "Monitor everything. Miss nothing. Make institutional decisions with intelligence infrastructure that was previously available only to the world's largest firms.",
    price: "From $1,499",
    priceRange: "$1,499–$4,999 / month + custom",
    users: "CEOs · CFOs · CIOs · REITs · PE firms",
    features: [
      "Real-time NAV tracking across entire portfolio",
      "FFO and NOI monitoring by asset, market, asset class",
      "Portfolio risk score with per-asset breakdown",
      "Monday morning briefing — what changed overnight",
      "Hold / sell / reposition analysis per asset",
      "Your portfolio data is never used to train KOANO's models",
    ],
    addOn: "Immutable verdict log · Custom billing · Enterprise roadmap: SOC 2 Type II, SSO",
    href: "/for/institutions",
    isEnterprise: true,
  },
];

export default function PricingContent() {
  const heroRef = useRef<HTMLElement>(null);
  const tiersRef = useRef<HTMLElement>(null);
  const faqRef = useRef<HTMLElement>(null);
  const ctaRef = useRef<HTMLElement>(null);

  const heroInView = useInView(heroRef, { once: true, amount: 0.15 });
  const tiersInView = useInView(tiersRef, { once: true, amount: 0.05 });
  const faqInView = useInView(faqRef, { once: true, amount: 0.1 });
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

          {/* Headline + framing — approved copy (KOANO_COPY.md) */}
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
              margin: "24px auto 24px",
              maxWidth: "760px",
            }}
          >
            KOANO is in demo. Nobody is being charged.
          </motion.h1>
          <motion.p
            initial="hidden"
            animate={heroInView ? "visible" : "hidden"}
            variants={fadeUp}
            custom={1.5}
            className="text-body-lg"
            style={{
              color: "var(--ink-secondary)",
              maxWidth: "640px",
              margin: "0 auto 20px",
            }}
          >
            The prices below are what these tiers are worth once the paid data
            feeds are live. Today they are not. Three of the five agents run on
            representative data where the licensed sources have not been funded
            yet, and every figure that comes from one is labeled as such inside
            the product.
          </motion.p>
          <motion.p
            initial="hidden"
            animate={heroInView ? "visible" : "hidden"}
            variants={fadeUp}
            custom={2}
            className="text-body-lg"
            style={{
              color: "var(--ink-secondary)",
              maxWidth: "640px",
              margin: "0 auto 24px",
            }}
          >
            So the demo is free, and it is by request rather than open signup.
            Every analysis KOANO runs costs real money to produce, which is why
            access is limited. If you want to see it work, ask, and we will let
            you in.
          </motion.p>

          <motion.p
            initial="hidden"
            animate={heroInView ? "visible" : "hidden"}
            variants={fadeUp}
            custom={2}
            className="text-body-lg"
            style={{
              color: "var(--ink-secondary)",
              maxWidth: "600px",
              margin: "0 auto",
            }}
          >
            The same intelligence engine. Four altitudes. Choose the one that
            matches your role and the decisions you need to make.
          </motion.p>
        </div>
      </section>

      {/* Pricing tiers */}
      <section
        ref={tiersRef}
        style={{ background: "var(--pale-wash)", padding: "80px 32px 120px" }}
      >
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <div
            className="pricing-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "20px",
              alignItems: "stretch",
            }}
          >
            {TIERS.map((tier, i) => (
              <motion.div
                key={tier.cluster}
                custom={i}
                initial="hidden"
                animate={tiersInView ? "visible" : "hidden"}
                variants={fadeUp}
                style={{
                  background: "var(--white)",
                  border: tier.isEnterprise
                    ? "1px solid var(--brand-blue)"
                    : "1px solid var(--border)",
                  borderRadius: "20px",
                  padding: "32px 28px",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                {/* Header */}
                <div style={{ marginBottom: "24px" }}>
                  <span
                    className="section-number"
                    style={{ display: "block", marginBottom: "12px" }}
                  >
                    {tier.cluster}
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
                    {tier.name}
                  </h3>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "var(--ink-secondary)",
                      lineHeight: 1.5,
                      marginBottom: "16px",
                    }}
                  >
                    {tier.tagline}
                  </p>
                  <div>
                    <span
                      style={{
                        fontSize: "32px",
                        fontWeight: 700,
                        color: "var(--ink-primary)",
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {tier.price}
                    </span>
                    <span
                      style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: "12px",
                        color: "var(--ink-faint)",
                        display: "block",
                        marginTop: "4px",
                        letterSpacing: "0.06em",
                      }}
                    >
                      {tier.priceRange}
                    </span>
                  </div>
                </div>

                {/* Users */}
                <div
                  style={{
                    borderTop: "1px solid var(--border)",
                    paddingTop: "16px",
                    marginBottom: "20px",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: "11px",
                      color: "var(--ink-faint)",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    {tier.users}
                  </span>
                </div>

                {/* Features */}
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    margin: "0 0 20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    flex: 1,
                  }}
                >
                  {tier.features.map((feature) => (
                    <li
                      key={feature}
                      style={{
                        display: "flex",
                        gap: "10px",
                        fontSize: "14px",
                        color: "var(--ink-secondary)",
                        lineHeight: 1.45,
                      }}
                    >
                      <span
                        style={{
                          color: "var(--brand-blue)",
                          flexShrink: 0,
                          fontWeight: 700,
                          fontSize: "16px",
                          lineHeight: 1.2,
                        }}
                      >
                        ·
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* Add-on note */}
                <div
                  style={{
                    background: "var(--pale-wash)",
                    borderRadius: "12px",
                    padding: "12px 14px",
                    marginBottom: "24px",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: "11px",
                      color: "var(--ink-muted)",
                      letterSpacing: "0.06em",
                      lineHeight: 1.5,
                      margin: 0,
                    }}
                  >
                    {tier.addOn}
                  </p>
                </div>

                {/* CTA */}
                <Button
                  variant={tier.isEnterprise ? "primary" : "ghost"}
                  href={tier.isEnterprise ? "/contact" : "/early-access"}
                  id={`pricing-cta-${tier.cluster.toLowerCase()}`}
                >
                  {tier.isEnterprise ? "Contact sales" : "Get early access"}
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section
        ref={faqRef}
        style={{ background: "var(--white)", padding: "120px 32px" }}
      >
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <motion.div
            initial="hidden"
            animate={faqInView ? "visible" : "hidden"}
            variants={fadeUp}
            custom={0}
            style={{ marginBottom: "64px" }}
          >
            <SectionNumber number="02" label="FAQ" />
            <h2
              className="text-h2"
              style={{
                color: "var(--ink-primary)",
                marginTop: "16px",
                maxWidth: "480px",
              }}
            >
              Common questions.
            </h2>
          </motion.div>

          <motion.div
            initial="hidden"
            animate={faqInView ? "visible" : "hidden"}
            variants={fadeUp}
            custom={1}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              {/* FAQ answers — approved copy (KOANO_COPY.md) */}
              {[
                {
                  question: "Can I switch clusters after I sign up?",
                  answer:
                    "Yes. The engine is the same underneath. What changes is what gets put in front of you. A broker who also develops can flip between the transaction view and the site comparison view without a second account, and nothing about the analysis changes when they do.",
                },
                {
                  question: "Is there a free trial?",
                  answer:
                    "The whole thing is free right now, because the whole thing is a demo. There is nothing to trial and nothing to cancel. Ask for access and if we have room, you get it.",
                },
                {
                  question: "What data sources power the verdict?",
                  answer:
                    "Roughly a dozen sources today. The live ones are public and real: NYC zoning and permit records, Census demographics, FHFA price indices, FEMA flood data, IRS Opportunity Zone tracts, FBI crime statistics. The ones that cost money are not funded yet, so KOANO runs on representative stand-ins for MLS comps, foot traffic, and premium hazard data. Anywhere that happens, the product says so on the figure itself. The full catalog is on the data page.",
                },
                {
                  question: "How often is data updated?",
                  answer:
                    "Every analysis pulls its sources at the moment you run it. There is no cached market report sitting behind the answer. What KOANO does not do yet is watch anything continuously. Alerts and the portfolio monitor are point in time, and they say so. Continuous monitoring is a funded capability, not a demo one.",
                },
                {
                  question:
                    "What is the difference between the $19 and $49 Cluster 1 tiers?",
                  answer:
                    "The lower tier answers questions about a property you own. The higher one answers questions about a property you are deciding on, which means the return math, the rehab benchmarks, and the rental picture. Both are free right now, so the honest answer is that the difference is theoretical until someone is being charged.",
                },
                {
                  question: "How does enterprise pricing for Cluster 5 work?",
                  answer:
                    "It is a conversation, not a checkout. Institutional deployment involves data isolation, access controls, and compliance work that does not exist yet and will not exist until someone is paying for it to. If that is where you are, the enterprise tier is a description of what we would build with you, not a product you can buy today.",
                },
              ].map(({ question, answer }) => (
                <div
                  key={question}
                  className="card"
                  style={{ background: "var(--white)" }}
                >
                  <p
                    style={{
                      fontSize: "16px",
                      fontWeight: 500,
                      color: "var(--ink-primary)",
                      marginBottom: "16px",
                    }}
                  >
                    {question}
                  </p>
                  <p
                    style={{
                      fontSize: "14px",
                      lineHeight: 1.7,
                      color: "var(--ink-secondary)",
                      margin: 0,
                    }}
                  >
                    {answer}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Enterprise CTA */}
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
            <h2
              className="text-h2"
              style={{
                color: "var(--ink-primary)",
                marginTop: "16px",
                marginBottom: "24px",
              }}
            >
              Building for an enterprise portfolio?
            </h2>
            <p
              style={{
                fontSize: "16px",
                color: "var(--ink-secondary)",
                lineHeight: 1.6,
                marginBottom: "40px",
              }}
            >
              Cluster 5 runs on an immutable, append-only verdict record, and
              your portfolio data is never used to train KOANO&apos;s models.
              SOC 2 Type II certification, SSO, role-based access controls,
              and dedicated per-tenant data isolation land with enterprise
              onboarding. Talk to us about custom pricing and dedicated
              onboarding.
            </p>
            <div
              className="flex flex-wrap items-center justify-center"
              style={{ gap: "16px" }}
            >
              <Button
                variant="primary"
                href="/contact"
                id="pricing-enterprise-cta"
              >
                Contact sales
              </Button>
              <Button
                variant="ghost"
                href="/for/institutions"
                id="pricing-enterprise-learn"
              >
                Learn about Cluster 5
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      <style jsx>{`
        @media (max-width: 1200px) {
          .pricing-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 640px) {
          .pricing-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
}
