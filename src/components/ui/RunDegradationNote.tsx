"use client";

// RunDegradationNote — a RUN-LEVEL banner shown when the analysis was degraded by
// source THROTTLING/TIMEOUT, distinct from a per-figure data-unavailable. A single
// provider falling back badges itself; this says the run as a whole hit a FIXABLE
// infrastructure condition (retry, set an API token) rather than a data limit — so
// a degraded run never passes silently.

import React from "react";
import type { RunDegradation } from "@/components/dashboard/useVerdictStream";

export default function RunDegradationNote({ degradation }: { degradation?: RunDegradation | null }) {
  if (!degradation || !degradation.degraded) return null;
  const { timeouts, throttled, hosts } = degradation;
  const parts = [
    timeouts > 0 ? `${timeouts} timed out` : null,
    throttled > 0 ? `${throttled} throttled` : null,
  ].filter(Boolean);

  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderLeft: "3px solid var(--signal-warning)",
        borderRadius: "0 12px 12px 0",
        padding: "14px 18px",
        maxWidth: "680px",
      }}
    >
      <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--ink-primary)", margin: "0 0 4px" }}>
        This run was degraded by source throttling, not unavailable data.
      </p>
      <p style={{ fontSize: "13px", lineHeight: 1.55, color: "var(--ink-secondary)", margin: 0 }}>
        {parts.join(" · ")} while fetching live sources ({hosts.join(", ")}). Those figures fell back
        and are badged individually. This is a <strong style={{ fontWeight: 500 }}>fixable</strong>{" "}
        infrastructure condition, not a real data limit. Re-run, or confirm the source API tokens.
      </p>
    </div>
  );
}
