"use client";

// ProvenanceBadge — the integrity layer made visible (CLAUDE.md Section 06).
// Mandatory anywhere a non-live figure is displayed. `live` renders a quiet
// confirmation; `representative` renders a visible amber badge, optionally
// followed by the "becomes live with [source] integration" note.

import React from "react";
import type { Provenance } from "./verdict";

interface ProvenanceBadgeProps {
  provenance: Provenance;
  /** Paid integration that turns this figure live (from swapIntegrationFor). */
  becomesLiveWith?: string | null;
  /** Render the full explanatory note after the badge (default: badge only). */
  showNote?: boolean;
}

const pillBase: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "5px",
  fontFamily: "'DM Mono', monospace",
  fontSize: "10px",
  fontWeight: 500,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  borderRadius: "100px",
  padding: "3px 9px",
  whiteSpace: "nowrap",
  verticalAlign: "middle",
};

export default function ProvenanceBadge({
  provenance,
  becomesLiveWith,
  showNote = false,
}: ProvenanceBadgeProps) {
  if (provenance === "live") {
    return (
      <span
        style={{
          ...pillBase,
          color: "var(--signal-positive)",
          background: "rgba(34, 197, 94, 0.08)",
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: "var(--signal-positive)",
          }}
        />
        Live
      </span>
    );
  }

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
      <span
        style={{
          ...pillBase,
          color: "var(--signal-warning)",
          background: "rgba(245, 158, 11, 0.10)",
        }}
      >
        <span
          aria-hidden="true"
          style={{
            width: "6px",
            height: "6px",
            borderRadius: "50%",
            background: "var(--signal-warning)",
          }}
        />
        Representative
      </span>
      {showNote && (
        <span
          style={{
            fontSize: "12px",
            color: "var(--ink-muted)",
            whiteSpace: "normal",
          }}
        >
          {becomesLiveWith
            ? `Representative data — becomes live with ${becomesLiveWith} integration`
            : "Representative data — not fetched live from the source"}
        </span>
      )}
    </span>
  );
}
