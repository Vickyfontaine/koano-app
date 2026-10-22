"use client";

// Shared panel primitives for cluster dashboards — Checkpoint 4 (Phase B).
// Every data panel gets a PanelHeader with its provenance badge; failed
// blocks render BlockError, never a silent gap or an invented value.

import React from "react";
import ProvenanceBadge from "@/components/ui/ProvenanceBadge";
import type { Provenance } from "@/components/ui/verdict";

export function fmtInt(n: number | null | undefined): string {
  return n == null ? "—" : n.toLocaleString("en-US");
}
export function fmtMoney(n: number | null | undefined): string {
  return n == null ? "—" : `$${n.toLocaleString("en-US")}`;
}
export function fmtPct(n: number | null | undefined): string {
  return n == null ? "—" : `${n}%`;
}

export const panelStyle: React.CSSProperties = {
  background: "var(--white)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-card)",
  padding: "24px",
  display: "flex",
  flexDirection: "column",
  gap: "16px",
};

export const panelTitle: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: "11px",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "var(--ink-muted)",
};

export const monoLabel = panelTitle;

export function riskColor(score: number): string {
  return score >= 67
    ? "var(--signal-negative)"
    : score >= 34
      ? "var(--signal-warning)"
      : "var(--signal-positive)";
}

export function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: "12px",
        fontSize: "14px",
        lineHeight: 1.5,
      }}
    >
      <span style={{ color: "var(--ink-muted)" }}>{label}</span>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "13px",
          color: "var(--ink-primary)",
          textAlign: "right",
        }}
      >
        {value}
      </span>
    </div>
  );
}

export function PanelHeader({
  title,
  provenance,
  becomesLiveWith,
}: {
  title: string;
  provenance?: Provenance;
  becomesLiveWith?: string | null;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "8px",
      }}
    >
      <span style={panelTitle}>{title}</span>
      {provenance && <ProvenanceBadge provenance={provenance} becomesLiveWith={becomesLiveWith} />}
    </div>
  );
}

export function BlockError({ title, error }: { title: string; error?: string }) {
  return (
    <div style={panelStyle}>
      <PanelHeader title={title} />
      <p style={{ fontSize: "13px", color: "var(--ink-muted)", margin: 0 }}>
        Unavailable{error ? `: ${error}` : ""}
      </p>
    </div>
  );
}

export function Meter({ value, color }: { value: number; color: string }) {
  return (
    <div
      aria-hidden="true"
      style={{
        height: "4px",
        borderRadius: "2px",
        background: "var(--border-light)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${Math.min(100, Math.max(0, value))}%`,
          height: "100%",
          background: color,
        }}
      />
    </div>
  );
}
