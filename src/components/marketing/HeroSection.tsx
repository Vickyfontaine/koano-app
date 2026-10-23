"use client";

import React from "react";
import Button from "../ui/Button";
import HeroDashboard from "./HeroDashboard";
import HeroAddressBox from "./HeroAddressBox";
import HeroRender from "./HeroRender";
import { RENDERS } from "./renders";

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
        // Fills the viewport and GROWS with its content (the address box can
        // open a result card), so the copy never slides under the nav.
        minHeight: "max(700px, 100vh)",
        overflow: "hidden",
        // Sky colour sampled from the hero image, so the area above the
        // contained (uncropped) image blends into its sky seamlessly.
        background: "#adc1ca",
      }}
    >
      {/* Hero background image — replaces the dark fill (near-black stays only as
          a load fallback behind it). Full-bleed, behind the content overlay. */}
      <HeroRender
        slot={RENDERS["menu-hero"]}
        priority
        // Contain (not cover) so the image keeps its native proportions and
        // isn't zoomed/cropped; grounded at the bottom so the buildings sit on
        // the fold and only sky extends above (into the matching section bg).
        style={{ objectFit: "contain", objectPosition: "center bottom" }}
      />

      {/* Scrim: a navy wash over the text column so white copy reads AA on the
          light sky (5.3:1 on the blended ground); fades out under the card and
          the buildings. On phones the copy block carries the same wash. */}
      <div className="hero-scrim" aria-hidden="true" />

      {/* Content overlay */}
      <div
        className="hero-inner"
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: "var(--content-marketing)",
          margin: "0 auto",
          padding: "calc(var(--nav-h) + 32px) 32px 56px",
          minHeight: "max(700px, 100vh)",
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
            <span
              className="hero-enter"
              style={{
                animationDelay: "0.30s",
                display: "block",
                fontFamily: "var(--font-mono)",
                fontSize: "11px",
                fontWeight: 500,
                color: "rgba(255, 255, 255, 0.85)",
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                marginBottom: "24px",
              }}
            >
              Real estate reasoning engine
            </span>

            {/* Headline */}
            <h1
              className="hero-enter"
              style={{
                animationDelay: "0.38s",
                fontSize: "clamp(34px, 3.8vw, 58px)",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                lineHeight: 1.05,
                color: "#FFFFFF",
                margin: 0,
                maxWidth: "560px",
              }}
            >
              SMART DATA.
              <br />
              SMARTER REAL ESTATE DECISIONS.
            </h1>

            {/* Subhead */}
            <p
              className="hero-enter"
              style={{
                animationDelay: "0.46s",
                fontSize: "18px",
                fontWeight: 500,
                lineHeight: 1.6,
                color: "#FFFFFF",
                maxWidth: "520px",
                marginTop: "24px",
                marginBottom: "28px",
              }}
            >
              KOANO deploys five specialist agents that read every public record
              touching a property, scattered across federal, state and city
              agencies. Each weighs its own evidence, and the verdict they
              produce shows its arithmetic figure by figure.
            </p>

            {/* Address box: resolve a lot against the public record, no account needed */}
            <div className="hero-enter" style={{ animationDelay: "0.54s" }}>
              <HeroAddressBox />
            </div>

            {/* CTA row */}
            <div
              className="hero-enter flex flex-wrap items-center"
              style={{ animationDelay: "0.62s", gap: "16px", marginBottom: "32px" }}
            >
              <Button variant="primary" href="/signup" id="hero-cta-primary">
                Sign up
              </Button>
              <Button variant="ghost-light" href="/intelligence" id="hero-cta-secondary">
                See how it works
              </Button>
            </div>

            {/* Stats row */}
            <div
              className="hero-enter hero-stats flex flex-wrap items-center"
              style={{ animationDelay: "0.70s", gap: "0" }}
            >
              {STATS.map((stat, i) => (
                <React.Fragment key={stat.label}>
                  {i > 0 && (
                    <span
                      className="hero-stat-sep"
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
                      fontFamily: "var(--font-mono)",
                      fontSize: "13px",
                      color: "rgba(255, 255, 255, 0.85)",
                      letterSpacing: "0.08em",
                    }}
                  >
                    <span style={{ fontWeight: 700, marginRight: "6px" }}>
                      {stat.value}
                    </span>
                    <span style={{ fontWeight: 400, opacity: 0.85 }}>
                      {stat.label}
                    </span>
                  </span>
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Right — animated dashboard demonstrating a real KOANO run */}
          <div
            className="hero-enter hero-dashboard-col"
            style={{ animationDelay: "0.46s", display: "flex", justifyContent: "flex-end" }}
          >
            <HeroDashboard />
          </div>
        </div>
      </div>

      <style jsx>{`
        .hero-enter {
          animation: hero-enter 0.5s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes hero-enter {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        /* White copy on the navy wash: the focus ring is white here. */
        #hero-section :global(:focus-visible) {
          outline-color: var(--white);
        }
        .hero-scrim {
          position: absolute;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          background: linear-gradient(
            90deg,
            rgba(13, 43, 62, 0.62) 0%,
            rgba(13, 43, 62, 0.58) 42%,
            rgba(13, 43, 62, 0) 68%
          );
        }
        @media (max-width: 900px) {
          .hero-grid {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
          }
          .hero-dashboard-col {
            justify-content: flex-start !important;
          }
        }
        @media (max-width: 767px) {
          .hero-scrim {
            display: none;
          }
          .hero-inner {
            background: rgba(13, 43, 62, 0.62);
          }
          .hero-stats {
            flex-direction: column;
            align-items: flex-start !important;
            gap: 6px !important;
          }
          .hero-stat-sep {
            display: none;
          }
        }
      `}</style>
    </section>
  );
}
