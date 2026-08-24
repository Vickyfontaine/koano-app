"use client";

// Cluster 4 — Development Intelligence dashboard (Checkpoint 3).
// Default and only view: multi-site comparison (Section 08). The neural map /
// "System view" was removed — it was decoration, not a decision surface.

import React, { useEffect } from "react";
import { CLUSTERS } from "../clusters";
import VerdictHistory from "../VerdictHistory";
import SiteComparison from "./SiteComparison";
import type { NavTarget } from "../DashboardShell";

export default function Cluster4Dashboard({ navTarget }: { navTarget?: NavTarget | null }) {
  const c = CLUSTERS.cluster_4;

  // Sidebar navigation scrolls to the target section (all live in the one view).
  useEffect(() => {
    if (!navTarget) return;
    if (navTarget.id === "c4-sites") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    requestAnimationFrame(() => {
      document.getElementById(navTarget.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [navTarget]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px", maxWidth: "1160px" }}>
      <div>
        <span className="section-number">{c.number}</span>
        <h1
          style={{
            fontSize: "32px",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "var(--ink-primary)",
            margin: "12px 0 8px",
          }}
        >
          {c.label}
        </h1>
        <p
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "11px",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--ink-faint)",
            margin: 0,
          }}
        >
          {c.audience}
        </p>
      </div>

      <SiteComparison />
      <VerdictHistory id="c4-history" />
    </div>
  );
}
