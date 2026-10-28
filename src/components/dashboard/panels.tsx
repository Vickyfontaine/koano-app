"use client";

// Shared panel primitives for cluster dashboards — Checkpoint 4 (Phase B).
// Every data panel gets a PanelHeader with its provenance badge; failed
// blocks render BlockError, never a silent gap or an invented value.

import React from "react";
import ProvenanceBadge from "@/components/ui/ProvenanceBadge";
import type { Provenance } from "@/components/ui/verdict";

export function fmtInt(n: number | null | undefined): string {
  return n == null ? "n/a" : n.toLocaleString("en-US");
}
export function fmtMoney(n: number | null | undefined): string {
  return n == null ? "n/a" : `$${n.toLocaleString("en-US")}`;
}
export function fmtPct(n: number | null | undefined): string {
  return n == null ? "n/a" : `${n}%`;
}

export const panelStyle: React.CSSProperties = {
  background: "var(--white)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-card)",
  padding: "var(--panel-pad)",
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

// Panel heading (UI sprint WS4, A7): sentence case in the UI size, the ink
// primary. The mono microlabel above stays for SUB-labels inside a panel.
export const panelHeading: React.CSSProperties = {
  fontSize: "var(--text-ui)",
  fontWeight: 500,
  letterSpacing: "-0.01em",
  color: "var(--ink-primary)",
  lineHeight: 1.3,
};

const panelSub: React.CSSProperties = {
  fontSize: "var(--text-data)",
  color: "var(--ink-muted)",
  lineHeight: 1.5,
  marginTop: "2px",
};

// Fill hue for meters, bars and dots.
export function riskColor(score: number): string {
  return score >= 67
    ? "var(--signal-negative)"
    : score >= 34
      ? "var(--signal-warning)"
      : "var(--signal-positive)";
}

// AA ink for a risk figure rendered as TEXT (never the fill hue).
export function riskInk(score: number): string {
  return score >= 67
    ? "var(--signal-negative-ink)"
    : score >= 34
      ? "var(--signal-warning-ink)"
      : "var(--signal-positive-ink)";
}

// A label and its value on one line when both fit; otherwise the value wraps
// onto its own full-width line (flex-wrap) instead of being squeezed into a
// column one word wide beside a long label.
export function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "space-between",
        columnGap: "12px",
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
          marginLeft: "auto",
          maxWidth: "100%",
          overflowWrap: "break-word",
        }}
      >
        {value}
      </span>
    </div>
  );
}

export function PanelHeader({
  title,
  sub,
  provenance,
  becomesLiveWith,
}: {
  title: string;
  /** One line under the title: what the panel reads and from where. */
  sub?: string;
  provenance?: Provenance;
  becomesLiveWith?: string | null;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: "var(--space-3)",
      }}
    >
      <div style={{ minWidth: 0 }}>
        <h3 style={{ ...panelHeading, margin: 0 }}>{title}</h3>
        {sub && <p style={{ ...panelSub, margin: 0 }}>{sub}</p>}
      </div>
      {provenance && (
        <span style={{ flex: "none", paddingTop: "2px" }}>
          <ProvenanceBadge provenance={provenance} becomesLiveWith={becomesLiveWith} />
        </span>
      )}
    </div>
  );
}

/** Skeleton rows while a panel's data is still in flight (never "Unavailable"). */
export function PanelLoading({ title, rows = 3, id }: { title: string; rows?: number; id?: string }) {
  return (
    <div style={panelStyle} id={id} aria-busy="true">
      <PanelHeader title={title} />
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }} aria-hidden="true">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="koano-pulse"
            style={{
              height: "var(--space-3)",
              width: `${78 - i * 14}%`,
              borderRadius: "var(--radius-chip)",
              background: "var(--border-light)",
            }}
          />
        ))}
      </div>
      <span className="sr-only">Loading {title}</span>
    </div>
  );
}

/** Nothing to show, by design (no data for this subject, not a failure). */
export function PanelEmpty({ title, children, id, provenance }: { title: string; children: React.ReactNode; id?: string; provenance?: Provenance }) {
  return (
    <div style={panelStyle} id={id}>
      <PanelHeader title={title} provenance={provenance} />
      <p style={{ fontSize: "var(--text-body)", lineHeight: 1.5, color: "var(--ink-secondary)", margin: 0 }}>{children}</p>
    </div>
  );
}

/** The block could not be read for this run: the reason, plainly. */
export function PanelAbsent({ title, reason, id }: { title: string; reason?: string; id?: string }) {
  return (
    <div style={{ ...panelStyle, borderLeft: "3px solid var(--signal-warning)" }} id={id}>
      <PanelHeader title={title} />
      <p style={{ fontSize: "var(--text-body)", lineHeight: 1.5, color: "var(--ink-secondary)", margin: 0 }}>
        Not available for this run.{reason ? ` ${reason.replace(/\.$/, "")}.` : ""} Nothing is estimated in its place.
      </p>
    </div>
  );
}

/** Legacy entry point: no error means the fetch is still in flight. */
export function BlockError({ title, error, id }: { title: string; error?: string; id?: string }) {
  return error ? <PanelAbsent title={title} reason={error} id={id} /> : <PanelLoading title={title} id={id} />;
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
