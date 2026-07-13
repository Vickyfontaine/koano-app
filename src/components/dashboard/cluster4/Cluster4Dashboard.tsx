"use client";

// Cluster 4 — Development Intelligence dashboard (Checkpoint 3).
// Default view: multi-site comparison (Section 08). Neural map available via
// the on-demand "System view" tab — never on the default view.

import React, { useEffect, useState } from "react";
import { CLUSTERS } from "../clusters";
import VerdictHistory from "../VerdictHistory";
import SiteComparison from "./SiteComparison";
import SystemView from "./SystemView";
import type { NavTarget } from "../DashboardShell";

type Tab = "sites" | "system";

export default function Cluster4Dashboard({ navTarget }: { navTarget?: NavTarget | null }) {
  const [tab, setTab] = useState<Tab>("sites");
  const c = CLUSTERS.cluster_4;

  // Sidebar navigation: c4-system / c4-sites switch tabs; other targets are
  // sections inside the sites tab (rendered once a comparison has run).
  useEffect(() => {
    if (!navTarget) return;
    if (navTarget.id === "c4-system") {
      setTab("system");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    setTab("sites");
    if (navTarget.id === "c4-sites") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    requestAnimationFrame(() => {
      document.getElementById(navTarget.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [navTarget]);

  const tabStyle = (active: boolean): React.CSSProperties => ({
    borderRadius: "100px",
    padding: "9px 20px",
    fontFamily: "inherit",
    fontSize: "13px",
    fontWeight: 500,
    cursor: "pointer",
    border: active ? "1px solid var(--brand-blue)" : "1px solid var(--border)",
    background: active ? "var(--brand-blue)" : "transparent",
    color: active ? "var(--near-black)" : "var(--ink-muted)",
    transition: "background 0.15s ease, color 0.15s ease",
  });

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

      <div style={{ display: "flex", gap: "8px" }}>
        <button style={tabStyle(tab === "sites")} onClick={() => setTab("sites")}>
          Site comparison
        </button>
        <button style={tabStyle(tab === "system")} onClick={() => setTab("system")}>
          System view
        </button>
      </div>

      {tab === "sites" ? (
        <>
          <SiteComparison />
          <VerdictHistory id="c4-history" />
        </>
      ) : (
        <SystemView />
      )}
    </div>
  );
}
