"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import SectionNumber from "@/components/ui/SectionNumber";
import Button from "@/components/ui/Button";
import {
  HERO_CONTAINER_MAX,
  HERO_HEADLINE_MAX,
  HERO_SUBHEAD_MAX,
  HERO_PADDING_TOP,
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

interface Feature {
  title: string;
  description: string;
}

interface ClusterLandingProps {
  clusterNumber: string;
  clusterName: string;
  tagline: string;
  price: string;
  priceRange: string;
  headline: string;
  subhead: string;
  /** Optional short stance line rendered under the subhead, verbatim. */
  stanceLine?: string;
  /** Overrides the features-section h2 (defaults to "{clusterName} dashboard"). */
  featuresHeading?: string;
  features: Feature[];
  secondaryFeatures?: {
    title: string;
    price?: string;
    items: Feature[];
  };
  users: string;
  /** Optional hero background render, placed full-bleed behind the text. */
  render?: string;
}

export default function ClusterLanding({
  clusterNumber,
  clusterName,
  tagline,
  priceRange,
  headline,
  subhead,
  stanceLine,
  featuresHeading,
  features,
  secondaryFeatures,
  users,
  render,
}: ClusterLandingProps) {
  const heroRef = useRef<HTMLElement>(null);
  const featuresRef = useRef<HTMLElement>(null);
  const pricingRef = useRef<HTMLElement>(null);
  const heroInView = useInView(heroRef, { once: true, amount: 0.15 });
  const featuresInView = useInView(featuresRef, { once: true, amount: 0.1 });
  const pricingInView = useInView(pricingRef, { once: true, amount: 0.15 });

  return (
    <>
      {/* Hero section — light, with render slot */}
      <section
        ref={heroRef}
        style={{
          background: "var(--white)",
          // Group-B viewport fit: cap the section to the below-nav viewport.
          // The text is TOP-anchored (HERO_PADDING_TOP below the nav) so its
          // nav→number gap matches every other hero's; the cover image's clear
          // vertical channel is full-height, so top-anchored text still sits in
          // it. Horizontal padding 32; no bottom padding so the tallest
          // (3-line) headlines get maximum room before the cap.
          padding: `${HERO_PADDING_TOP}px 32px 0`,
          position: "relative",
          overflow: "hidden",
          minHeight: "calc(100svh - var(--nav-h))",
          maxHeight: "calc(100svh - var(--nav-h))",
          display: "flex",
          alignItems: "flex-start",
        }}
      >
        {/* Hero render — full-bleed behind the text block. The image was
            composed against the hero's text width + padding, so the copy lands
            in its blank strip. */}
        {render && (
          <img
            src={render}
            alt=""
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center",
              zIndex: 0,
              pointerEvents: "none",
            }}
          />
        )}

        <div
          style={{
            maxWidth: HERO_CONTAINER_MAX,
            width: "100%",
            margin: "0 auto",
            textAlign: "center",
            position: "relative",
            zIndex: 1,
          }}
        >
          <motion.div
            initial="hidden"
            animate={heroInView ? "visible" : "hidden"}
            variants={fadeUp}
            custom={0}
          >
            <SectionNumber number={clusterNumber} />
          </motion.div>

          {/* Headline + subhead — approved copy (KOANO_COPY.md) */}
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
            {headline}
          </motion.h1>
          <motion.p
            initial="hidden"
            animate={heroInView ? "visible" : "hidden"}
            variants={fadeUp}
            custom={2}
            style={{
              fontSize: "18px",
              fontWeight: 400,
              color: "var(--ink-secondary)",
              lineHeight: 1.6,
              maxWidth: HERO_SUBHEAD_MAX,
              margin: "0 auto 16px",
            }}
          >
            {subhead}
          </motion.p>

          {stanceLine && (
            <motion.p
              initial="hidden"
              animate={heroInView ? "visible" : "hidden"}
              variants={fadeUp}
              custom={2}
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "12px",
                fontWeight: 500,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "var(--brand-blue)",
                margin: "0 auto 16px",
              }}
            >
              {stanceLine}
            </motion.p>
          )}

          {/* Approved tagline from Section 10 */}
          <motion.p
            initial="hidden"
            animate={heroInView ? "visible" : "hidden"}
            variants={fadeUp}
            custom={2}
            style={{
              fontSize: "20px",
              fontWeight: 400,
              color: "var(--ink-secondary)",
              lineHeight: 1.6,
              maxWidth: HERO_SUBHEAD_MAX,
              margin: "0 auto 40px",
            }}
          >
            {tagline}
          </motion.p>

          {/* Users label */}
          <motion.p
            initial="hidden"
            animate={heroInView ? "visible" : "hidden"}
            variants={fadeUp}
            custom={3}
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "12px",
              fontWeight: 500,
              color: "var(--ink-faint)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              marginBottom: "32px",
            }}
          >
            For {users}
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial="hidden"
            animate={heroInView ? "visible" : "hidden"}
            variants={fadeUp}
            custom={4}
            className="flex flex-wrap items-center justify-center"
            style={{ gap: "16px" }}
          >
            <Button variant="primary" href="/signup">
              Sign up
            </Button>
            <Button variant="ghost" href="/pricing">
              See pricing
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Features section */}
      <section
        ref={featuresRef}
        style={{
          background: "var(--pale-wash)",
          padding: "120px 32px",
        }}
      >
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <motion.div
            initial="hidden"
            animate={featuresInView ? "visible" : "hidden"}
            variants={fadeUp}
            custom={0}
            style={{ marginBottom: "64px" }}
          >
            <SectionNumber number="01" label="What you get" />
            <h2
              className="text-h2"
              style={{
                color: "var(--ink-primary)",
                marginTop: "16px",
                maxWidth: "600px",
              }}
            >
              {featuresHeading ?? `${clusterName} dashboard`}
            </h2>
          </motion.div>

          {/* Feature cards grid */}
          <div
            className="cluster-features-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "20px",
            }}
          >
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                custom={i + 1}
                initial="hidden"
                animate={featuresInView ? "visible" : "hidden"}
                variants={fadeUp}
                className="card"
                style={{ background: "var(--white)" }}
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
                  {feature.title}
                </h3>
                <p
                  style={{
                    fontSize: "15px",
                    fontWeight: 400,
                    color: "var(--ink-secondary)",
                    lineHeight: 1.55,
                    margin: 0,
                  }}
                >
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Secondary features / add-on section (if present) */}
      {secondaryFeatures && (
        <section
          style={{
            background: "var(--white)",
            padding: "120px 32px",
          }}
        >
          <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
            <div style={{ marginBottom: "64px" }}>
              <SectionNumber number="02" label={secondaryFeatures.title} />
              <h2
                className="text-h2"
                style={{
                  color: "var(--ink-primary)",
                  marginTop: "16px",
                  maxWidth: "600px",
                }}
              >
                {secondaryFeatures.title}
              </h2>
              {secondaryFeatures.price && (
                <span className="price-chip" style={{ marginTop: "16px", display: "inline-flex" }}>
                  {secondaryFeatures.price}
                </span>
              )}
            </div>

            <div
              className="cluster-features-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: "20px",
              }}
            >
              {secondaryFeatures.items.map((feature) => (
                <div
                  key={feature.title}
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
                    {feature.title}
                  </h3>
                  <p
                    style={{
                      fontSize: "15px",
                      fontWeight: 400,
                      color: "var(--ink-secondary)",
                      lineHeight: 1.55,
                      margin: 0,
                    }}
                  >
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Pricing CTA section */}
      <section
        ref={pricingRef}
        style={{
          background: secondaryFeatures ? "var(--pale-wash)" : "var(--white)",
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
            animate={pricingInView ? "visible" : "hidden"}
            variants={fadeUp}
            custom={0}
          >
            <SectionNumber number={secondaryFeatures ? "03" : "02"} />

            <h2
              className="text-h2"
              style={{
                color: "var(--ink-primary)",
                marginTop: "16px",
                marginBottom: "24px",
              }}
            >
              Start with {clusterName.toLowerCase()}
            </h2>

            <span
              className="price-chip"
              style={{
                display: "inline-flex",
                marginBottom: "16px",
                fontSize: "13px",
                padding: "8px 20px",
              }}
            >
              {priceRange}
            </span>

            <p
              style={{
                fontSize: "16px",
                fontWeight: 400,
                color: "var(--ink-secondary)",
                lineHeight: 1.6,
                marginBottom: "40px",
              }}
            >
              {tagline}
            </p>

            <div
              className="flex flex-wrap items-center justify-center"
              style={{ gap: "16px" }}
            >
              <Button variant="primary" href="/signup">
                Sign up
              </Button>
              <Button variant="ghost" href="/pricing">
                Compare all plans
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Responsive grid */}
      <style jsx>{`
        @media (max-width: 1024px) {
          .cluster-features-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 640px) {
          .cluster-features-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
}
