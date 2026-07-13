"use client";

// Per-cluster view — Checkpoints 1–2 (Phase B).
// Cluster-specific dashboards arrive in Checkpoints 3 and 4; until then every
// cluster gets the shared VerdictWorkbench: a real address in, a real
// provenance-tagged verdict out. No invented figures, no unlabeled data
// (Principle 2).

import React from "react";
import { CLUSTERS, type ClusterId } from "./clusters";
import VerdictWorkbench from "./VerdictWorkbench";
import VerdictHistory from "./VerdictHistory";

export default function ClusterPlaceholderView({
  cluster,
}: {
  cluster: ClusterId;
}) {
  const c = CLUSTERS[cluster];

  return (
    <div style={{ maxWidth: "860px", display: "flex", flexDirection: "column", gap: "20px" }}>
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

      <p
        style={{
          fontSize: "16px",
          lineHeight: 1.6,
          color: "var(--ink-secondary)",
          maxWidth: "620px",
          margin: 0,
        }}
      >
        {c.tagline}
      </p>

      <VerdictWorkbench />
      <VerdictHistory id={`c${parseInt(c.number, 10)}-history`} />
    </div>
  );
}
