"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import SectionNumber from "../ui/SectionNumber";

// Ordered by KOANO's positioning priority (CLAUDE.md Section 01):
// professional and institutional first, homeowners last.
const CLUSTERS = [
  {
    name: "Development intelligence",
    copy: "Find your best site. Model your deal. Understand your entitlement risk. Before anyone else does.",
    price: "From $499 / month",
    href: "/for/developers",
  },
  {
    name: "Transaction intelligence",
    copy: "Find opportunities before they hit the MLS. Make data-backed recommendations that close deals.",
    price: "From $149 / month",
    href: "/for/agents",
  },
  {
    name: "Portfolio intelligence",
    copy: "Monitor everything. Miss nothing. Make billion-dollar decisions with the intelligence infrastructure that was previously only available to the world's largest financial institutions.",
    price: "From $1,499 / month",
    href: "/for/institutions",
  },
  {
    name: "Property intelligence",
    copy: "Know what's happening to your property's value before your neighbors do — and know what to do about it.",
    price: "From $19 / month",
    href: "/for/homeowners",
  },
];

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

export default function ClustersSection() {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.15 });

  return (
    <section
      id="clusters-section"
      ref={ref}
      style={{
        background: "var(--white)",
        padding: "120px 32px",
      }}
    >
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        {/* Section header */}
        <motion.div
          initial="hidden"
          animate={isInView ? "visible" : "hidden"}
          variants={fadeUp}
          custom={0}
          style={{ marginBottom: "64px" }}
        >
          <SectionNumber number="01" />
          <h2
            className="text-h2"
            style={{
              color: "var(--ink-primary)",
              marginTop: "16px",
              maxWidth: "700px",
            }}
          >
            The same engine. Four different altitudes.
          </h2>
        </motion.div>

        {/* Cluster cards grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "20px",
          }}
          className="clusters-grid"
        >
          {CLUSTERS.map((cluster, i) => (
            <motion.a
              key={cluster.name}
              href={cluster.href}
              id={`cluster-card-${i + 1}`}
              custom={i + 1}
              initial="hidden"
              animate={isInView ? "visible" : "hidden"}
              variants={fadeUp}
              className="card card-hover"
              style={{
                textDecoration: "none",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                minHeight: "280px",
              }}
            >
              {/* Card content */}
              <div>
                <h3
                  style={{
                    fontSize: "22px",
                    fontWeight: 500,
                    color: "var(--ink-primary)",
                    marginBottom: "16px",
                    lineHeight: 1.3,
                  }}
                >
                  {cluster.name}
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
                  {cluster.copy}
                </p>
              </div>

              {/* Price chip */}
              <div style={{ marginTop: "24px" }}>
                <span className="price-chip">{cluster.price}</span>
              </div>
            </motion.a>
          ))}
        </div>
      </div>

      {/* Responsive grid styles */}
      <style jsx>{`
        @media (max-width: 1024px) {
          .clusters-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 640px) {
          .clusters-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
