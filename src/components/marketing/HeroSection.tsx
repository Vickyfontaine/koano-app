"use client";

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
        className="m-drop"
        // Contain (not cover) so the image keeps its native proportions and
        // isn't zoomed/cropped; grounded at the bottom so the buildings sit on
        // the fold and only sky extends above (into the matching section bg).
        style={{ objectFit: "contain", objectPosition: "center bottom" }}
      />

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
                color: "var(--ink-primary)",
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
                color: "var(--near-black)",
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
              className="hero-enter m-drop"
              style={{
                animationDelay: "0.46s",
                fontSize: "18px",
                fontWeight: 500,
                lineHeight: 1.6,
                color: "var(--near-black)",
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

            {/* Phones (mobile proposal): one line, then the render full width
                as the screen's image, then the address box and buttons. */}
            <p className="m-only m-lead hero-m-lead">
              Five specialist agents read every public record touching a property.
            </p>
            <div className="m-only hero-m-render" aria-hidden="true">
              <HeroRender slot={RENDERS["menu-hero"]} variant="block" priority />
            </div>

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
              <Button variant="ghost" href="/intelligence" id="hero-cta-secondary">
                See how it works
              </Button>
            </div>

            {/* Stats row: frosted pills like the replay card, because the
                row lands on the render's cast shadow at desktop widths. */}
            <div
              className="hero-enter hero-stats m-drop flex flex-wrap items-center"
              style={{ animationDelay: "0.70s", gap: "var(--space-2)" }}
            >
              {STATS.map((stat) => (
                <span
                  key={stat.label}
                  className="hero-stat"
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "13px",
                    color: "var(--near-black)",
                    letterSpacing: "0.08em",
                  }}
                >
                  <span style={{ fontWeight: 700, marginRight: "6px" }}>
                    {stat.value}
                  </span>
                  <span style={{ fontWeight: 400 }}>{stat.label}</span>
                </span>
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
        /* backwards, not both: a finished entrance must hold no opacity
           animation, or the column becomes the frosted card's backdrop root
           and the card blurs nothing. */
        .hero-enter {
          animation: hero-enter 0.5s cubic-bezier(0.16, 1, 0.3, 1) backwards;
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
        /* No scrim over the render (founder decision): the copy is near-black
           ink straight on the sky and the cast shadow, and the ghost button
           takes the same ink so it reads AA there too. */
        #hero-section :global(.btn-ghost) {
          color: var(--ink-primary);
          border-color: rgba(13, 43, 62, 0.55);
        }
        .hero-stat {
          background: var(--hero-frost-fill);
          backdrop-filter: var(--hero-frost-blur);
          -webkit-backdrop-filter: var(--hero-frost-blur);
          border: 1px solid rgba(255, 255, 255, 0.7);
          border-radius: var(--radius-pill);
          padding: var(--space-1) var(--space-3);
        }
        #hero-section :global(.btn-ghost:hover) {
          background: rgba(255, 255, 255, 0.35);
          border-color: var(--ink-primary);
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
          .hero-stats {
            flex-direction: column;
            align-items: flex-start !important;
          }
        }
      `}</style>
    </section>
  );
}
