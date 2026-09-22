"use client";

import React from "react";
import { motion } from "framer-motion";
import Button from "../ui/Button";
import HeroDashboard from "./HeroDashboard";

const EASE = [0.16, 1, 0.3, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.3 + i * 0.08,
      duration: 0.5,
      ease: EASE,
    },
  }),
};

const STATS = [
  { value: "Every figure", label: "Data-Sourced" },
  { value: "Every verdict", label: "Reproducible" },
  { value: "Every step", label: "Auditable" },
];

export default function HeroSection() {
  return (
    <section
      id="hero-section"
      style={{
        position: "relative",
        width: "100%",
        height: "100vh",
        minHeight: "700px",
        overflow: "hidden",
        // Sky colour sampled from the hero image, so the area above the
        // contained (uncropped) image blends into its sky seamlessly.
        background: "#adc1ca",
      }}
    >
      {/* Hero background image — replaces the dark fill (near-black stays only as
          a load fallback behind it). Full-bleed, behind the content overlay. */}
      <img
        src="/renders/menu-hero.jpg"
        alt=""
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          // Contain (not cover) so the image keeps its native proportions and
          // isn't zoomed/cropped; grounded at the bottom so the buildings sit on
          // the fold and only sky extends above (into the matching section bg).
          objectFit: "contain",
          objectPosition: "center bottom",
          zIndex: 0,
          pointerEvents: "none",
        }}
      />

      {/* Content overlay */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "0 32px",
          height: "100%",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          className="hero-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1.05fr 0.95fr",
            gap: "56px",
            alignItems: "center",
            width: "100%",
          }}
        >
          {/* Left — copy */}
          <div>
            {/* Eyebrow tag */}
            <motion.span
              custom={0}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              style={{
                display: "block",
                fontFamily: "'DM Mono', monospace",
                fontSize: "11px",
                fontWeight: 500,
                color: "var(--brand-blue)",
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                marginBottom: "24px",
              }}
            >
              Real estate reasoning engine
            </motion.span>

            {/* Headline */}
            <motion.h1
              custom={1}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              style={{
                fontSize: "clamp(34px, 3.8vw, 58px)",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                lineHeight: 1.05,
                color: "#FFFFFF",
                margin: 0,
                maxWidth: "560px",
              }}
            >
              Real estate has always had data.
              <br />
              It&apos;s never had a brain.
            </motion.h1>

            {/* Subhead */}
            <motion.p
              custom={2}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              style={{
                fontSize: "18px",
                fontWeight: 400,
                lineHeight: 1.6,
                color: "#010d5c",
                maxWidth: "520px",
                marginTop: "24px",
                marginBottom: "36px",
              }}
            >
              KOANO deploys five specialist agents that read every public record
              touching a property, scattered across federal, state and city
              agencies. Each weighs its own evidence, and the verdict they
              produce shows its arithmetic figure by figure.
            </motion.p>

            {/* CTA row */}
            <motion.div
              custom={3}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="flex flex-wrap items-center"
              style={{ gap: "16px", marginBottom: "40px" }}
            >
              <Button variant="primary" href="/signup" id="hero-cta-primary">
                Sign up
              </Button>
              <Button variant="ghost-light" href="/intelligence" id="hero-cta-secondary">
                See how it works
              </Button>
            </motion.div>

            {/* Stats row */}
            <motion.div
              custom={4}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
              className="flex flex-wrap items-center"
              style={{ gap: "0" }}
            >
              {STATS.map((stat, i) => (
                <React.Fragment key={stat.label}>
                  {i > 0 && (
                    <span
                      style={{
                        color: "rgba(255, 255, 255, 0.3)",
                        margin: "0 20px",
                        fontSize: "13px",
                        userSelect: "none",
                      }}
                    >
                      ·
                    </span>
                  )}
                  <span
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: "13px",
                      color: "rgba(255, 255, 255, 0.85)",
                      letterSpacing: "0.08em",
                    }}
                  >
                    <span style={{ fontWeight: 700, marginRight: "6px" }}>
                      {stat.value}
                    </span>
                    <span style={{ fontWeight: 400, opacity: 0.7 }}>
                      {stat.label}
                    </span>
                  </span>
                </React.Fragment>
              ))}
            </motion.div>
          </div>

          {/* Right — animated dashboard demonstrating a real KOANO run */}
          <motion.div
            className="hero-dashboard-col"
            custom={2}
            initial="hidden"
            animate="visible"
            variants={fadeUp}
            style={{ display: "flex", justifyContent: "flex-end" }}
          >
            <HeroDashboard />
          </motion.div>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 900px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
          }
          .hero-dashboard-col {
            justify-content: flex-start !important;
          }
        }
      `}</style>
    </section>
  );
}
