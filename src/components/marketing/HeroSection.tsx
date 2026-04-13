"use client";

import React from "react";
import { motion } from "framer-motion";
import Button from "../ui/Button";

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
  { value: "50+", label: "Data sources" },
  { value: "5", label: "Specialist agents" },
  { value: "6–18mo", label: "Signal advantage" },
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
        background: "var(--near-black)",
      }}
    >
      {/* Video background — fallback to near-black until hero-render.mp4 is delivered */}
      {/* When video is ready, uncomment:
      <video
        autoPlay
        muted
        loop
        playsInline
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          zIndex: 0,
        }}
      >
        <source src="/renders/hero-render.mp4" type="video/mp4" />
      </video>
      */}

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
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        {/* Eyebrow tag */}
        <motion.span
          custom={0}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          style={{
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
            fontSize: "clamp(40px, 6vw, 80px)",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            lineHeight: 1.05,
            color: "#FFFFFF",
            margin: 0,
            maxWidth: "900px",
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
            color: "rgba(255, 255, 255, 0.85)",
            maxWidth: "640px",
            marginTop: "24px",
            marginBottom: "40px",
          }}
        >
          KOANO deploys five specialist AI agents that ingest 50+ data sources,
          reason autonomously, and deliver a single verdict — with every step
          of the thinking visible and auditable.
        </motion.p>

        {/* CTA row */}
        <motion.div
          custom={3}
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          className="flex flex-wrap items-center"
          style={{ gap: "16px", marginBottom: "48px" }}
        >
          <Button variant="primary" href="/early-access" id="hero-cta-primary">
            Get early access
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
    </section>
  );
}
