"use client";

// SystemView — Cluster 4's on-demand tab embedding the neural map
// (/public/neural-map.html, built and authoritative). Shows the topology of
// KOANO's synthesis hub, five specialist agents, and their data sources.

import React from "react";

export default function SystemView() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      <p style={{ fontSize: "13px", color: "var(--ink-muted)", margin: 0 }}>
        The KOANO engine: five specialist agents feeding one synthesis hub, each drawing on its
        own data sources. Hover a node to explore; drag to rotate.
      </p>
      <iframe
        src="/neural-map.html"
        title="KOANO system view — agent and data source topology"
        style={{
          width: "100%",
          height: "72vh",
          border: "1px solid var(--border)",
          borderRadius: "20px",
          background: "var(--white)",
        }}
      />
    </div>
  );
}
