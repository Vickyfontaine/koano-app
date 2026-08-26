"use client";

// CoverageMap — the per-verdict, per-LAYER coverage surface. Answers, precisely:
// which data layers ran live, which aren't wired for this market (and what feed
// fills each), which failed transiently, and which use a paid stand-in.
//
// The three non-live states are rendered as SEPARATE, visually-distinct sections
// with their own wording, because they mean different things to a reader:
//   coverage_absent — a structural market gap (a feed lights it up)
//   fetch_failed    — a transient problem (worth a retry, not a limitation)
//   representative  — a labeled paid-source stand-in
// It is the artifact to take into a data-partner conversation: every row names an
// individual layer, and every non-live row names the feed that fills it.

import React, { useState } from "react";
import { buildCoverageMap, type CoverageLayer } from "./coverage";
import { PROVENANCE_META } from "./verdict";
import type { LedgerDataPoint, Provenance } from "./verdict";

interface CoverageMapProps {
  dataPoints?: LedgerDataPoint[];
  id?: string;
  defaultOpen?: boolean;
}

const mono: React.CSSProperties = {
  fontFamily: "'DM Mono', monospace",
  fontSize: "11px",
  letterSpacing: "0.04em",
};

// Section order + the DISTINCT wording per state. `retry` marks the transient one;
// `unlockVerb` frames how a non-live layer becomes live.
const SECTIONS: Array<{
  state: Provenance;
  heading: string;
  blurb: string;
  showUnlock: boolean;
}> = [
  { state: "live", heading: "Live coverage", blurb: "Fetched live from authoritative sources this run.", showUnlock: false },
  { state: "partner", heading: "Partner-sourced", blurb: "Supplied by a data partner. Attributed to the named source, not verified by KOANO.", showUnlock: false },
  { state: "representative", heading: "Representative stand-ins", blurb: "A labeled stand-in for an unfunded paid source. Becomes live with the feed named.", showUnlock: true },
  { state: "fetch_failed", heading: "Fetch failed: transient", blurb: "These layers are covered but failed to fetch this run. Usually transient. Re-run to refresh. Not a coverage limit.", showUnlock: false },
  { state: "coverage_absent", heading: "Not covered in this market", blurb: "These layers are not wired for this market. Each names the feed that would light it up, a structural gap, not a failure.", showUnlock: true },
];

function LayerRow({ l, showUnlock, color }: { l: CoverageLayer; showUnlock: boolean; color: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2px", padding: "6px 0", borderTop: "1px solid var(--border-light)" }}>
      <span style={{ fontSize: "13px", color: "var(--ink-secondary)" }}>{l.layer}</span>
      {showUnlock && l.unlock && (
        <span style={{ ...mono, fontSize: "11px", color }}>→ fills with {l.unlock}</span>
      )}
    </div>
  );
}

export default function CoverageMap({ dataPoints, id, defaultOpen }: CoverageMapProps) {
  const [open, setOpen] = useState(!!defaultOpen);
  const points = dataPoints ?? [];
  if (points.length === 0) return null;

  const map = buildCoverageMap(points);
  const liveCount = map.live.length;
  const gapCount = map.coverage_absent.length;
  const failCount = map.fetch_failed.length;

  // One honest headline that distinguishes the states rather than lumping them.
  const summaryParts = [`${liveCount}/${map.total} live`];
  if (gapCount) summaryParts.push(`${gapCount} not covered here`);
  if (failCount) summaryParts.push(`${failCount} failed (transient)`);
  if (map.representative.length) summaryParts.push(`${map.representative.length} representative`);
  if (map.partner.length) summaryParts.push(`${map.partner.length} partner`);

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: "20px", background: "var(--white)", padding: "24px" }} id={id}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{ width: "100%", border: "none", background: "transparent", cursor: "pointer", textAlign: "left", display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: "12px", padding: 0 }}
      >
        <span>
          <span style={{ ...mono, textTransform: "uppercase", color: "var(--ink-faint)" }}>Coverage map</span>
          <span style={{ fontSize: "13px", color: "var(--ink-muted)", marginLeft: "10px" }}>{summaryParts.join(" · ")}</span>
        </span>
        <span style={{ ...mono, color: "var(--mid-blue)" }}>{open ? "Hide" : "Show layers"}</span>
      </button>

      {open && (
        <div style={{ marginTop: "18px", display: "flex", flexDirection: "column", gap: "14px" }}>
          {SECTIONS.map(({ state, heading, blurb, showUnlock }) => {
            const layers = map[state];
            if (layers.length === 0) return null;
            const color = PROVENANCE_META[state].color;
            return (
              <div
                key={state}
                style={{ border: "1px solid var(--border)", borderLeft: `3px solid ${color}`, borderRadius: "0 12px 12px 0", padding: "12px 16px" }}
              >
                <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "4px" }}>
                  <span style={{ ...mono, textTransform: "uppercase", color, fontWeight: 500 }}>{heading}</span>
                  <span style={{ fontSize: "12px", color: "var(--ink-faint)" }}>{layers.length} layer{layers.length === 1 ? "" : "s"}</span>
                </div>
                <p style={{ fontSize: "12px", lineHeight: 1.5, color: "var(--ink-muted)", margin: "0 0 6px" }}>{blurb}</p>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {layers.map((l) => (
                    <LayerRow key={l.layer} l={l} showUnlock={showUnlock} color={color} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
