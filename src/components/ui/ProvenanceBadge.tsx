"use client";

// ProvenanceBadge — the integrity layer made visible (CLAUDE.md Section 06).
// Mandatory anywhere a non-live figure is displayed. Renders each of the five
// provenance states DISTINCTLY (PROVENANCE_META): `live` a quiet green
// confirmation, `partner` a blue attributed badge, `representative` /
// `fetch_failed` amber caveats, `coverage_absent` a muted structural gap — so a
// not-covered or fetch-failed figure is never mislabeled "Representative".

import React from "react";
import { PROVENANCE_META } from "./verdict";
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
  const meta = PROVENANCE_META[provenance];

  // `live` is a quiet standalone confirmation (no note needed).
  if (provenance === "live") {
    return (
      <span style={{ ...pillBase, color: meta.color, background: meta.background }}>
        <span
          aria-hidden="true"
          style={{ width: "6px", height: "6px", borderRadius: "50%", background: meta.color }}
        />
        {meta.label}
      </span>
    );
  }

  // A representative stand-in keeps its "becomes live with [paid source]" note;
  // the other caveats use their own state-specific note.
  const note =
    provenance === "representative" && becomesLiveWith
      ? `Representative data — becomes live with ${becomesLiveWith} integration`
      : meta.note;

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
      <span style={{ ...pillBase, color: meta.color, background: meta.background }}>
        <span
          aria-hidden="true"
          style={{ width: "6px", height: "6px", borderRadius: "50%", background: meta.color }}
        />
        {meta.label}
      </span>
      {showNote && (
        <span style={{ fontSize: "12px", color: "var(--ink-muted)", whiteSpace: "normal" }}>{note}</span>
      )}
    </span>
  );
}
