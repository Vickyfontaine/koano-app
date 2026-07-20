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

const FREE_SOURCES = [
  { name: "US Census ACS", category: "Demographics" },
  { name: "BLS", category: "Economics" },
  { name: "Redfin Data Center", category: "Market data" },
  { name: "Freddie Mac", category: "Mortgage rates" },
  { name: "FHFA", category: "Price indices" },
  { name: "FBI UCR", category: "Crime data" },
  { name: "EPA / FEMA", category: "Environmental" },
  { name: "NOAA", category: "Climate" },
  { name: "IRS Opportunity Zones", category: "Tax policy" },
  { name: "HUD USER", category: "Housing policy" },
  { name: "SEC EDGAR", category: "REIT filings" },
  { name: "World Bank", category: "Global economics" },
  { name: "OECD", category: "Global economics" },
  { name: "OpenStreetMap", category: "Geography" },
  { name: "USGS", category: "Terrain & geology" },
  { name: "NYC Open Data", category: "City data" },
  {
    name: "NYC HPD / ECB / DOB violations (wvxf-dwi5, 6bgk-3dad, eabe-havv)",
    category: "Building violations",
  },
  {
    name: "NYC HPD registrations + Speculation Watch List (tesw-yqqr, feu5-w2e2, adax-9mit)",
    category: "Ownership records",
  },
  { name: "LA GeoHub", category: "City data" },
  { name: "Chicago Data Portal", category: "City data" },
  { name: "OpenFEMA", category: "Disaster data" },
  { name: "Google Trends", category: "Search demand" },
  { name: "Reddit API", category: "Sentiment" },
  { name: "Municipode", category: "Zoning codes" },
  { name: "HUD Fair Housing", category: "Compliance" },
  { name: "CDC PLACES", category: "Health data" },
  { name: "MSRB EMMA", category: "Municipal bonds" },
];

const PAID_SOURCES = [
  { name: "ATTOM", category: "Property data" },
  { name: "Shovels.ai", category: "Permits" },
  { name: "Zoneomics", category: "Zoning" },
  { name: "First Street Foundation", category: "Climate risk" },
  { name: "Placer.ai", category: "Foot traffic" },
  { name: "SafeGraph", category: "Mobility" },
  { name: "Walk Score", category: "Walkability" },
  { name: "Yelp Fusion", category: "Business data" },
  { name: "Google Places", category: "Business data" },
  { name: "AirDNA", category: "Short-term rental" },
  { name: "BatchData", category: "Property ownership" },
  { name: "SpotCrime", category: "Crime (real-time)" },
  { name: "GreatSchools", category: "Education" },
  { name: "Regrid", category: "Parcel data" },
  { name: "Mapbox", category: "Mapping" },
  { name: "HouseCanary", category: "AVM" },
  { name: "CoreLogic / Trestle", category: "MLS data" },
  { name: "Reonomy", category: "Commercial data" },
  { name: "CoStar / LoopNet", category: "Commercial listings" },
  {
    name: "MSCI Real Capital Analytics",
    category: "Institutional (Cluster 5)",
  },
];

const PIPELINE_STEPS = [
  {
    number: "01",
    title: "Continuous ingestion",
    description:
      "Free sources are ingested via GitHub Actions cron jobs running 24/7. Paid sources are called on-demand and cached for 24 hours to minimize API costs.",
  },
  {
    number: "02",
    title: "Normalization",
    description:
      "Every signal is normalized to a common schema: location (lat/lng + census tract), timestamp, data type, confidence level, and source attribution.",
  },
  {
    number: "03",
    title: "Storage",
    description:
      "Normalized signals are stored in Supabase with Row Level Security enforced. Cluster 5 data lives in an isolated schema per enterprise client — never co-mingled.",
  },
  {
    number: "04",
    title: "Agent reasoning",
    description:
      "When a verdict is requested, relevant signals are assembled and passed to the five specialist agents simultaneously. Each agent reasons independently.",
  },
  {
    number: "05",
    title: "Synthesis",
    description:
      "The synthesis agent receives all five structured outputs, arbitrates conflicts, and issues the final verdict with a full reasoning chain.",
  },
];

export default function DataContent() {
  const heroRef = useRef<HTMLElement>(null);
  const freeRef = useRef<HTMLElement>(null);
  const paidRef = useRef<HTMLElement>(null);
  const pipelineRef = useRef<HTMLElement>(null);
  const ctaRef = useRef<HTMLElement>(null);

  const heroInView = useInView(heroRef, { once: true, amount: 0.15 });
  const freeInView = useInView(freeRef, { once: true, amount: 0.05 });
  const paidInView = useInView(paidRef, { once: true, amount: 0.05 });
  const pipelineInView = useInView(pipelineRef, { once: true, amount: 0.1 });
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
            <SectionNumber number="01" label="Data transparency" />
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
            Every source. Every signal. Fully auditable.
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
            KOANO ingests data from dozens of sources — free public datasets
            live today, plus commercial providers that come online as they are
            licensed. Every verdict cites its top data sources. We publish the
            full list here because trust requires transparency.
          </motion.p>

          <motion.div
            initial="hidden"
            animate={heroInView ? "visible" : "hidden"}
            variants={fadeUp}
            custom={3}
            style={{
              display: "flex",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: "12px",
            }}
          >
            {[
              { stat: "25+", label: "Free sources" },
              { stat: "20+", label: "Paid sources" },
              { stat: "24h", label: "Max data age" },
              { stat: "100%", label: "Source-cited verdicts" },
            ].map((item) => (
              <div
                key={item.label}
                style={{
                  background: "var(--pale-wash)",
                  border: "1px solid var(--border)",
                  borderRadius: "16px",
                  padding: "16px 24px",
                  textAlign: "center",
                }}
              >
                <p
                  style={{
                    fontSize: "24px",
                    fontWeight: 700,
                    color: "var(--ink-primary)",
                    letterSpacing: "-0.02em",
                    marginBottom: "4px",
                  }}
                >
                  {item.stat}
                </p>
                <p
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "11px",
                    color: "var(--ink-faint)",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  {item.label}
                </p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Free sources */}
      <section
        ref={freeRef}
        style={{ background: "var(--pale-wash)", padding: "120px 32px" }}
      >
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <motion.div
            initial="hidden"
            animate={freeInView ? "visible" : "hidden"}
            variants={fadeUp}
            custom={0}
            style={{ marginBottom: "64px" }}
          >
            <SectionNumber number="02" label="Free sources" />
            <h2
              className="text-h2"
              style={{
                color: "var(--ink-primary)",
                marginTop: "16px",
                maxWidth: "560px",
              }}
            >
              Public datasets, ingested continuously.
            </h2>
            <p
              className="text-body-lg"
              style={{
                color: "var(--ink-secondary)",
                maxWidth: "560px",
                marginTop: "24px",
              }}
            >
              These sources are ingested on a rolling schedule via GitHub
              Actions cron jobs and stored in Supabase. They form the backbone
              of every verdict.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            animate={freeInView ? "visible" : "hidden"}
            variants={fadeUp}
            custom={1}
          >
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              {FREE_SOURCES.map((source) => (
                <div
                  key={source.name}
                  style={{
                    background: "var(--white)",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                    padding: "10px 16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "var(--ink-primary)",
                    }}
                  >
                    {source.name}
                  </span>
                  <span
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: "10px",
                      color: "var(--ink-faint)",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    {source.category}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Paid sources */}
      <section
        ref={paidRef}
        style={{ background: "var(--white)", padding: "120px 32px" }}
      >
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <motion.div
            initial="hidden"
            animate={paidInView ? "visible" : "hidden"}
            variants={fadeUp}
            custom={0}
            style={{ marginBottom: "64px" }}
          >
            <SectionNumber number="03" label="Licensed sources" />
            <h2
              className="text-h2"
              style={{
                color: "var(--ink-primary)",
                marginTop: "16px",
                maxWidth: "560px",
              }}
            >
              Commercial providers, called on-demand.
            </h2>
            <p
              className="text-body-lg"
              style={{
                color: "var(--ink-secondary)",
                maxWidth: "560px",
                marginTop: "24px",
              }}
            >
              These sources are called when a verdict is requested and cached
              for 24 hours. Their data is the signal layer that makes the
              reasoning accurate at the neighborhood level.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            animate={paidInView ? "visible" : "hidden"}
            variants={fadeUp}
            custom={1}
          >
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "10px",
              }}
            >
              {PAID_SOURCES.map((source) => (
                <div
                  key={source.name}
                  style={{
                    background: "var(--pale-wash)",
                    border: "1px solid var(--border)",
                    borderRadius: "12px",
                    padding: "10px 16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "var(--ink-primary)",
                    }}
                  >
                    {source.name}
                  </span>
                  <span
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: "10px",
                      color: "var(--ink-faint)",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    {source.category}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Pipeline architecture */}
      <section
        ref={pipelineRef}
        style={{ background: "var(--pale-wash)", padding: "120px 32px" }}
      >
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          <motion.div
            initial="hidden"
            animate={pipelineInView ? "visible" : "hidden"}
            variants={fadeUp}
            custom={0}
            style={{ marginBottom: "64px" }}
          >
            <SectionNumber number="04" label="The pipeline" />
            <h2
              className="text-h2"
              style={{
                color: "var(--ink-primary)",
                marginTop: "16px",
                maxWidth: "560px",
              }}
            >
              How data becomes a verdict.
            </h2>
          </motion.div>

          <div
            style={{
              position: "relative",
              maxWidth: "720px",
              margin: "0 auto",
            }}
          >
            {/* Center vertical line */}
            <div
              style={{
                position: "absolute",
                left: "20px",
                top: "12px",
                bottom: "12px",
                width: "1px",
                background: "var(--brand-blue)",
              }}
            />

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0",
              }}
            >
              {PIPELINE_STEPS.map((step, i) => (
                <motion.div
                  key={step.number}
                  custom={i + 1}
                  initial="hidden"
                  animate={pipelineInView ? "visible" : "hidden"}
                  variants={fadeUp}
                  style={{
                    display: "flex",
                    gap: "32px",
                    paddingBottom: i < PIPELINE_STEPS.length - 1 ? "32px" : 0,
                    paddingLeft: "52px",
                    position: "relative",
                  }}
                >
                  {/* Dot */}
                  <div
                    style={{
                      position: "absolute",
                      left: "14px",
                      top: "4px",
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      border: "2px solid var(--brand-blue)",
                      background: "var(--pale-wash)",
                    }}
                  />

                  <div
                    className="card"
                    style={{ background: "var(--white)", flex: 1 }}
                  >
                    <span
                      className="section-number"
                      style={{ display: "block", marginBottom: "10px" }}
                    >
                      {step.number}
                    </span>
                    <h3
                      style={{
                        fontSize: "18px",
                        fontWeight: 500,
                        color: "var(--ink-primary)",
                        marginBottom: "8px",
                        lineHeight: 1.3,
                      }}
                    >
                      {step.title}
                    </h3>
                    <p
                      style={{
                        fontSize: "15px",
                        color: "var(--ink-secondary)",
                        lineHeight: 1.55,
                        margin: 0,
                      }}
                    >
                      {step.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
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
              See it in action.
            </h2>
            <p
              style={{
                fontSize: "16px",
                color: "var(--ink-secondary)",
                lineHeight: 1.6,
                marginBottom: "40px",
              }}
            >
              Every KOANO verdict cites its top data sources. Request early
              access to see how dozens of sources come together in a single
              verdict.
            </p>
            <div
              className="flex flex-wrap items-center justify-center"
              style={{ gap: "16px" }}
            >
              <Button variant="primary" href="/early-access" id="data-bottom-cta">
                Get early access
              </Button>
              <Button
                variant="ghost"
                href="/intelligence"
                id="data-bottom-intelligence"
              >
                How it works
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
