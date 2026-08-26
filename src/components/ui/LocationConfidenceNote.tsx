"use client";

// LocationConfidenceNote — surfaces a degraded coordinate resolution. This is a
// FIRST-CLASS trust signal, separate from data provenance: provenance says a
// figure was fetched live; it says nothing about whether the point we fetched it
// FOR is the right building. When an address resolved from a single geocoder with
// no cross-check, a fuzzy mis-match could not have been caught — so live data may
// describe the wrong lot. Renders nothing when the location is confirmed.

import React from "react";

export default function LocationConfidenceNote({
  confidence,
}: {
  confidence?: "confirmed" | "unconfirmed";
}) {
  if (confidence !== "unconfirmed") return null;
  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderLeft: "3px solid var(--signal-warning)",
        borderRadius: "0 12px 12px 0",
        background: "rgba(245, 158, 11, 0.06)",
        padding: "14px 18px",
      }}
    >
      <p style={{ fontSize: "13px", fontWeight: 500, color: "var(--ink-primary)", margin: 0 }}>
        Location not cross-confirmed
      </p>
      <p style={{ fontSize: "13px", lineHeight: 1.55, color: "var(--ink-secondary)", margin: "4px 0 0" }}>
        This address resolved from a single geocoder with no independent cross-check, so the figures
        below may describe a nearby lot rather than the exact building. This is a coordinate-confidence
        flag, separate from data provenance. Verify the address if the property facts look wrong.
      </p>
    </div>
  );
}
