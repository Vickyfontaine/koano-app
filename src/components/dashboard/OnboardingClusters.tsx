"use client";

// Onboarding cluster selection — Checkpoint 1 (Phase B).
// Four cards (clusters 1, 2, 4, 5) with approved verbatim copy (Section 13).
// Selecting one writes the choice to the profiles table via POST /api/profile.
// The welcome headline is a designated copy placeholder (Section 13) and is
// rendered as such — never filled with invented copy.

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { CLUSTERS, CLUSTER_IDS, type ClusterId } from "./clusters";

const EASE = [0.16, 1, 0.3, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.08, ease: EASE },
  }),
};

export default function OnboardingClusters() {
  const router = useRouter();
  const [selected, setSelected] = useState<ClusterId | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function choose(cluster: ClusterId) {
    if (saving) return;
    setSelected(cluster);
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cluster }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not save your selection");
      router.push("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save your selection");
      setSaving(false);
      setSelected(null);
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--white)" }}>
      <header style={{ padding: "28px 40px" }}>
        <a
          href="/"
          style={{
            fontWeight: 500,
            fontSize: "15px",
            color: "var(--near-black)",
            letterSpacing: "2px",
            textDecoration: "none",
          }}
        >
          KOANO
        </a>
      </header>

      <main style={{ maxWidth: "1080px", margin: "0 auto", padding: "24px 40px 80px" }}>
        {/* [COPY TBD] onboarding welcome copy — designated placeholder, Section 13 */}
        <motion.div
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={0}
          className="copy-placeholder"
          style={{ maxWidth: "640px", margin: "0 auto 16px", textAlign: "center" }}
        >
          [COPY TBD — onboarding welcome copy]
        </motion.div>

        <motion.p
          initial="hidden"
          animate="visible"
          variants={fadeUp}
          custom={1}
          style={{
            textAlign: "center",
            fontFamily: "'DM Mono', monospace",
            fontSize: "11px",
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            color: "var(--ink-muted)",
            margin: "0 0 48px",
          }}
        >
          Select your cluster — you can switch views anytime
        </motion.p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "20px",
          }}
        >
          {CLUSTER_IDS.map((id, i) => {
            const c = CLUSTERS[id];
            const isSelected = selected === id;
            return (
              <motion.button
                key={id}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
                custom={i + 2}
                onClick={() => choose(id)}
                disabled={saving}
                style={{
                  textAlign: "left",
                  background: isSelected ? "var(--pale-wash)" : "var(--white)",
                  border: isSelected
                    ? "1px solid var(--mid-blue)"
                    : "1px solid var(--border)",
                  borderRadius: "20px",
                  padding: "28px",
                  cursor: saving ? "wait" : "pointer",
                  fontFamily: "inherit",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                  transition: "border-color 0.15s ease, background 0.15s ease",
                }}
              >
                <span className="section-number">{c.number}</span>
                <span
                  style={{
                    fontSize: "22px",
                    fontWeight: 500,
                    color: "var(--ink-primary)",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {c.label}
                </span>
                <span
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "11px",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "var(--ink-faint)",
                  }}
                >
                  {c.audience}
                </span>
                <span
                  style={{
                    fontSize: "15px",
                    lineHeight: 1.6,
                    color: "var(--ink-secondary)",
                    flex: 1,
                  }}
                >
                  {c.tagline}
                </span>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: "8px",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: "12px",
                      color: "var(--ink-muted)",
                    }}
                  >
                    {c.price}
                  </span>
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "var(--mid-blue)",
                    }}
                  >
                    {isSelected && saving ? "Saving…" : "Select ↗"}
                  </span>
                </span>
              </motion.button>
            );
          })}
        </div>

        {error && (
          <p
            style={{
              textAlign: "center",
              marginTop: "24px",
              fontSize: "14px",
              color: "var(--signal-negative)",
            }}
          >
            {error}
          </p>
        )}
      </main>
    </div>
  );
}
