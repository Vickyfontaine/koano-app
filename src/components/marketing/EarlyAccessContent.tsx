"use client";

import React, { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import SectionNumber from "@/components/ui/SectionNumber";

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

const CLUSTERS = [
  {
    id: "cluster_1",
    label: "Property intelligence",
    sub: "Homeowners · Landlords · Flippers",
  },
  {
    id: "cluster_2",
    label: "Transaction intelligence",
    sub: "Agents · Brokers · Mortgage officers",
  },
  {
    id: "cluster_4",
    label: "Development intelligence",
    sub: "Developers · CRE brokers · Contractors",
  },
  {
    id: "cluster_5",
    label: "Portfolio intelligence",
    sub: "REITs · PE firms · C-suite",
  },
];

export default function EarlyAccessContent() {
  const heroRef = useRef<HTMLElement>(null);
  const heroInView = useInView(heroRef, { once: true, amount: 0.15 });

  const [email, setEmail] = useState("");
  const [selectedCluster, setSelectedCluster] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !selectedCluster) return;
    setSubmitting(true);
    // Supabase email capture will be wired in Phase 5
    await new Promise((r) => setTimeout(r, 600));
    setSubmitted(true);
    setSubmitting(false);
  };

  return (
    <>
      {/* Hero + form */}
      <section
        ref={heroRef}
        style={{
          background: "var(--white)",
          padding: "160px 32px 120px",
          minHeight: "80vh",
          display: "flex",
          alignItems: "center",
        }}
      >
        <div
          style={{
            maxWidth: "640px",
            margin: "0 auto",
            width: "100%",
            textAlign: "center",
          }}
        >
          <motion.div
            initial="hidden"
            animate={heroInView ? "visible" : "hidden"}
            variants={fadeUp}
            custom={0}
          >
            <SectionNumber number="01" />
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
              margin: "24px auto 16px",
              maxWidth: "760px",
            }}
          >
            Ask for access.
          </motion.h1>

          <motion.p
            initial="hidden"
            animate={heroInView ? "visible" : "hidden"}
            variants={fadeUp}
            custom={2}
            className="text-body-lg"
            style={{
              color: "var(--ink-secondary)",
              maxWidth: "600px",
              margin: "0 auto 48px",
            }}
          >
            KOANO is in a limited demo, so access is granted by hand, which
            means we read what you send. Tell us what you work on and what you
            would point this at, and we will take it from there.
          </motion.p>

          {submitted ? (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE }}
              style={{
                background: "var(--pale-wash)",
                border: "1px solid var(--brand-blue)",
                borderRadius: "20px",
                padding: "40px 32px",
                textAlign: "center",
              }}
            >
              <span
                className="data-chip"
                style={{ display: "inline-flex", marginBottom: "16px" }}
              >
                You&apos;re on the list
              </span>
              <h3
                style={{
                  fontSize: "22px",
                  fontWeight: 500,
                  color: "var(--ink-primary)",
                  marginBottom: "12px",
                }}
              >
                We&apos;ll be in touch.
              </h3>
              <p
                style={{
                  fontSize: "15px",
                  color: "var(--ink-secondary)",
                  lineHeight: 1.55,
                }}
              >
                We&apos;re onboarding early access users cluster by cluster.
                When your cluster is ready, you&apos;ll be the first to know.
              </p>
            </motion.div>
          ) : (
            <motion.form
              initial="hidden"
              animate={heroInView ? "visible" : "hidden"}
              variants={fadeUp}
              custom={3}
              onSubmit={handleSubmit}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              {/* Email input */}
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                style={{
                  border: "1px solid var(--border)",
                  borderRadius: "100px",
                  padding: "13px 20px",
                  fontSize: "16px",
                  color: "var(--ink-primary)",
                  background: "var(--white)",
                  outline: "none",
                  width: "100%",
                  fontFamily: "inherit",
                  transition: "border-color 0.2s ease",
                }}
                onFocus={(e) =>
                  (e.currentTarget.style.borderColor = "var(--brand-blue)")
                }
                onBlur={(e) =>
                  (e.currentTarget.style.borderColor = "var(--border)")
                }
              />

              {/* Cluster selection */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                }}
              >
                {CLUSTERS.map((cluster) => (
                  <button
                    key={cluster.id}
                    type="button"
                    onClick={() => setSelectedCluster(cluster.id)}
                    style={{
                      background:
                        selectedCluster === cluster.id
                          ? "var(--sky)"
                          : "var(--white)",
                      border:
                        selectedCluster === cluster.id
                          ? "1px solid var(--brand-blue)"
                          : "1px solid var(--border)",
                      borderRadius: "16px",
                      padding: "16px",
                      textAlign: "left",
                      cursor: "pointer",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "14px",
                        fontWeight: 500,
                        color: "var(--ink-primary)",
                        marginBottom: "4px",
                        lineHeight: 1.3,
                      }}
                    >
                      {cluster.label}
                    </p>
                    <p
                      style={{
                        fontFamily: "'DM Mono', monospace",
                        fontSize: "11px",
                        color: "var(--ink-faint)",
                        letterSpacing: "0.06em",
                        margin: 0,
                      }}
                    >
                      {cluster.sub}
                    </p>
                  </button>
                ))}
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={!email || !selectedCluster || submitting}
                id="early-access-submit"
                style={{
                  background:
                    email && selectedCluster
                      ? "var(--brand-blue)"
                      : "var(--border)",
                  color:
                    email && selectedCluster ? "var(--near-black)" : "var(--ink-faint)",
                  border: "1px solid transparent",
                  borderRadius: "100px",
                  padding: "13px 28px",
                  fontWeight: 500,
                  fontSize: "14px",
                  fontFamily: "inherit",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  cursor: email && selectedCluster ? "pointer" : "not-allowed",
                  transition: "all 0.2s ease",
                  width: "100%",
                }}
              >
                {submitting ? "Submitting..." : "Join waitlist"}
                {!submitting && <span aria-hidden="true">↗</span>}
              </button>

              <p
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "11px",
                  color: "var(--ink-faint)",
                  letterSpacing: "0.06em",
                  textAlign: "center",
                }}
              >
                No spam. Unsubscribe any time.
              </p>
            </motion.form>
          )}
        </div>
      </section>

      {/* Stats row */}
      <section
        style={{
          background: "var(--pale-wash)",
          padding: "64px 32px",
          borderTop: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            maxWidth: "800px",
            margin: "0 auto",
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: "48px",
          }}
        >
          {[
            { stat: "Dozens", label: "Data sources" },
            { stat: "5", label: "Specialist agents" },
            { stat: "6–18mo", label: "Signal advantage" },
          ].map((item) => (
            <div key={item.label} style={{ textAlign: "center" }}>
              <p
                style={{
                  fontSize: "36px",
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
                  fontSize: "12px",
                  color: "var(--ink-faint)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
