"use client";

// ProvenanceBadge — the integrity layer made visible (CLAUDE.md Section 06).
// Mandatory anywhere a non-live figure is displayed. Renders each of the five
// provenance states DISTINCTLY (PROVENANCE_META): the label is set in the
// state's AA ink token, the mark carries the state's hue AND a non-color cue
// (solid dot, diamond, hatched square, dashed ring, cut ring), so a not-covered
// or fetch-failed figure is never mislabeled "Representative" and never depends
// on color alone. 11px floor, never smaller. The full note rides in aria-label.

import React, { useId } from "react";
import { PROVENANCE_META } from "./verdict";
import type { Provenance, ProvenanceGlyph } from "./verdict";

interface ProvenanceBadgeProps {
  provenance: Provenance;
  /** Paid integration that turns this figure live (from swapIntegrationFor). */
  becomesLiveWith?: string | null;
  /** Render the full explanatory note after the badge (default: badge only). */
  showNote?: boolean;
  /** Override the label (e.g. "Recorded" on a replay of a frozen run). */
  labelOverride?: string;
  /** Override the note (title + aria) alongside labelOverride, so a replay never says "live". */
  noteOverride?: string;
}

const pillBase: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "6px",
  fontFamily: "var(--font-mono)",
  fontSize: "var(--text-micro)",
  lineHeight: "16px",
  fontWeight: 500,
  letterSpacing: "0.06em",
  textTransform: "uppercase",
  borderRadius: "var(--radius-pill)",
  padding: "3px 9px 3px 7px",
  whiteSpace: "nowrap",
  verticalAlign: "middle",
};

export function ProvenanceMark({ glyph, fill, size = 10 }: { glyph: ProvenanceGlyph; fill: string; size?: number }) {
  const patternId = useId();
  const s = size;
  const c = s / 2;
  const r = s / 2 - 1;
  const common = { width: s, height: s, viewBox: `0 0 ${s} ${s}`, "aria-hidden": true as const, focusable: "false" as const };
  switch (glyph) {
    case "solid":
      return (
        <svg {...common}>
          <circle cx={c} cy={c} r={r} fill={fill} />
        </svg>
      );
    case "diamond":
      return (
        <svg {...common}>
          <rect x={c - r * 0.72} y={c - r * 0.72} width={r * 1.44} height={r * 1.44} transform={`rotate(45 ${c} ${c})`} fill={fill} />
        </svg>
      );
    case "hatched":
      return (
        <svg {...common}>
          <defs>
            <pattern id={patternId} width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <rect width="1.4" height="3" fill={fill} />
            </pattern>
          </defs>
          <rect x={1} y={1} width={s - 2} height={s - 2} rx={1.5} fill={`url(#${patternId})`} stroke={fill} strokeWidth={1} />
        </svg>
      );
    case "dashed":
      return (
        <svg {...common}>
          <circle cx={c} cy={c} r={r - 0.5} fill="none" stroke={fill} strokeWidth={1.5} strokeDasharray="2.2 1.6" />
        </svg>
      );
    case "cut":
      return (
        <svg {...common}>
          <circle cx={c} cy={c} r={r - 0.5} fill="none" stroke={fill} strokeWidth={1.5} />
          <line x1={c - r} y1={c + r} x2={c + r} y2={c - r} stroke={fill} strokeWidth={1.5} />
        </svg>
      );
  }
}

export default function ProvenanceBadge({
  provenance,
  becomesLiveWith,
  showNote = false,
  labelOverride,
  noteOverride,
}: ProvenanceBadgeProps) {
  const meta = PROVENANCE_META[provenance];
  const note =
    noteOverride ??
    (provenance === "representative" && becomesLiveWith
      ? `Representative data. Becomes live with ${becomesLiveWith} integration`
      : meta.note);
  const label = labelOverride ?? meta.label;

  const pill = (
    <span
      style={{ ...pillBase, color: meta.color, background: meta.background }}
      role="img"
      aria-label={`${label}: ${note}`}
      title={note}
    >
      <ProvenanceMark glyph={meta.glyph} fill={meta.fill} />
      {label}
    </span>
  );

  if (!showNote) return pill;

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
      {pill}
      <span style={{ fontSize: "var(--text-caption)", color: "var(--ink-muted)", whiteSpace: "normal" }}>{note}</span>
    </span>
  );
}
