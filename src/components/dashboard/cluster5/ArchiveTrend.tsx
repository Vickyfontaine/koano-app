"use client";

// ArchiveTrend — the longitudinal record. KOANO snapshots the free public record
// weekly; nobody else stores the time series, so it accrues into an asset. This
// panel plots ONLY what was actually captured (from /api/archive → the coverage
// view) and shows every gap AS a gap — never interpolated, never backfilled. A
// missing capture is part of the honest record, not a hole to paper over.

import React, { useEffect, useState } from "react";
import { PanelHeader, panelStyle } from "../panels";

interface CoverageCell {
  week: string;
  rows_present: number;
  is_gap: boolean;
}
interface DatasetCoverage {
  dataset: string;
  label: string;
  cells: CoverageCell[];
  total: number;
}
interface ArchiveResponse {
  observation: { first_week: string | null; last_week: string | null; week_count: number; weeks: string[] };
  datasets: DatasetCoverage[];
  gap_count: number;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function weekLabel(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return `${MONTHS[(m || 1) - 1]} ${d}${y ? "" : ""}`;
}
function fmt(n: number): string {
  return n.toLocaleString("en-US");
}

const mono: React.CSSProperties = {
  fontFamily: "'DM Mono', monospace",
  fontSize: "11px",
  letterSpacing: "0.04em",
};

export default function ArchiveTrend({ id, previewData }: { id?: string; previewData?: ArchiveResponse }) {
  const [data, setData] = useState<ArchiveResponse | null>(previewData ?? null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (previewData) return;
    let live = true;
    fetch("/api/archive")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`Request failed (${r.status})`))))
      .then((j) => live && setData(j as ArchiveResponse))
      .catch((e) => live && setError(e instanceof Error ? e.message : "Could not load archive"));
    return () => {
      live = false;
    };
  }, [previewData]);

  return (
    <div style={panelStyle} id={id}>
      <PanelHeader title="The longitudinal record: weekly public-record snapshots" />
      <p style={{ fontSize: "13px", lineHeight: 1.6, color: "var(--ink-muted)", margin: 0, maxWidth: "680px" }}>
        NYC Open Data gives current state, not history. Nobody stores the time series. KOANO
        snapshots it weekly, so it accrues into a dataset that can&apos;t be acquired retroactively.
        This shows exactly what has been captured. Gaps are shown as gaps, never interpolated or
        backfilled.
      </p>

      {error && <p style={{ fontSize: "13px", color: "var(--signal-negative)", margin: 0 }}>{error}</p>}
      {!error && !data && <p style={{ fontSize: "13px", color: "var(--ink-faint)", margin: 0 }}>Loading…</p>}

      {data && data.observation.week_count === 0 && (
        <p style={{ fontSize: "13px", color: "var(--ink-muted)", margin: 0 }}>
          No snapshots captured yet. The weekly archive cron has not populated the record.
        </p>
      )}

      {data && data.observation.week_count > 0 && (
        <>
          <div style={{ ...mono, color: "var(--ink-secondary)" }}>
            Observation window: {weekLabel(data.observation.first_week!)} –{" "}
            {weekLabel(data.observation.last_week!)}, {data.observation.first_week!.slice(0, 4)} ·{" "}
            {data.observation.week_count} weekly snapshot{data.observation.week_count === 1 ? "" : "s"}
            {data.gap_count > 0 && (
              <span style={{ color: "var(--signal-warning)" }}> · {data.gap_count} gap{data.gap_count === 1 ? "" : "s"}</span>
            )}
          </div>

          {/* Coverage timeline: datasets × weeks. A captured cell shows its row
              count; a gap shows amber "gap" — the outage made visible, in place. */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse", minWidth: "420px" }}>
              <thead>
                <tr>
                  <th style={{ ...mono, textAlign: "left", padding: "8px 12px", color: "var(--ink-faint)" }}>Dataset</th>
                  {data.observation.weeks.map((w) => (
                    <th key={w} style={{ ...mono, textAlign: "right", padding: "8px 12px", color: "var(--ink-faint)" }}>
                      {weekLabel(w)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.datasets.map((ds) => (
                  <tr key={ds.dataset}>
                    <td style={{ fontSize: "13px", color: "var(--ink-secondary)", padding: "8px 12px", borderTop: "1px solid var(--border-light)", whiteSpace: "nowrap" }}>
                      {ds.label}
                    </td>
                    {ds.cells.map((c) => (
                      <td
                        key={c.week}
                        style={{
                          ...mono,
                          textAlign: "right",
                          padding: "8px 12px",
                          borderTop: "1px solid var(--border-light)",
                          color: c.is_gap ? "var(--signal-warning)" : "var(--ink-primary)",
                          background: c.is_gap ? "rgba(245,158,11,0.06)" : "transparent",
                        }}
                        title={c.is_gap ? "No capture this week: a gap, not zero activity" : `${fmt(c.rows_present)} rows captured`}
                      >
                        {c.is_gap ? "gap" : fmt(c.rows_present)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p style={{ fontSize: "12px", lineHeight: 1.55, color: "var(--ink-faint)", margin: 0, maxWidth: "680px" }}>
            An amber <span style={{ color: "var(--signal-warning)" }}>gap</span> is a week a dataset
            was not captured (a cron outage, not zero real-world activity). It is left as a hole, never
            filled with a guessed value. The record only ever contains real captures.
          </p>
        </>
      )}
    </div>
  );
}
