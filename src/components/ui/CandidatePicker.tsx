"use client";

// CandidatePicker — the single disambiguation banner. When two geocoders place a
// raw address on buildings >2 km apart inside NYC, KOANO can't say which the user
// meant, so instead of a wall it asks. The candidates arrive ranked (exact
// street-name+number match first — the strong signal the wrong-ZIP bug ignored);
// the top one is badged "Best match" but nothing runs until the user clicks. On
// selection the server RE-DERIVES the BBL from the chosen point — the browser's
// word is never trusted.

import React from "react";
import type { AddressCandidate } from "@/components/ui/verdict";

interface CandidatePickerProps {
  candidates: AddressCandidate[];
  onChoose: (candidate: AddressCandidate) => void;
  busy?: boolean;
}

export default function CandidatePicker({ candidates, onChoose, busy = false }: CandidatePickerProps) {
  return (
    <div
      style={{
        border: "1px solid var(--border)",
        borderLeft: "3px solid var(--signal-warning)",
        borderRadius: "0 16px 16px 0",
        padding: "20px 22px",
        maxWidth: "680px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
      }}
    >
      <div>
        <h3 style={{ fontSize: "16px", fontWeight: 500, color: "var(--ink-primary)", margin: "0 0 4px" }}>
          More than one building matches that address.
        </h3>
        <p style={{ fontSize: "13px", lineHeight: 1.5, color: "var(--ink-muted)", margin: 0 }}>
          Two data sources placed it on different lots. Choose the building you meant — the analysis
          runs on that lot, at full confidence, once you pick.
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {candidates.map((c, i) => {
          const best = i === 0 && c.match_reason === "Exact street match";
          return (
            <button
              key={c.id}
              onClick={() => !busy && onChoose(c)}
              disabled={busy}
              style={{
                textAlign: "left",
                border: `1px solid ${best ? "var(--mid-blue)" : "var(--border)"}`,
                background: best ? "var(--pale-wash)" : "var(--white)",
                borderRadius: "12px",
                padding: "14px 16px",
                cursor: busy ? "wait" : "pointer",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                opacity: busy ? 0.6 : 1,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "15px", fontWeight: 500, color: "var(--ink-primary)" }}>
                  {c.label}
                </span>
                {best && (
                  <span
                    style={{
                      fontFamily: "'DM Mono', monospace",
                      fontSize: "10px",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      color: "var(--near-black)",
                      background: "var(--brand-blue)",
                      borderRadius: "100px",
                      padding: "2px 9px",
                    }}
                  >
                    Best match
                  </span>
                )}
              </div>
              <div
                style={{
                  display: "flex",
                  gap: "14px",
                  flexWrap: "wrap",
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "11px",
                  letterSpacing: "0.04em",
                  color: "var(--ink-muted)",
                }}
              >
                <span>{c.match_reason}</span>
                <span>· proposed by {c.source}</span>
                {c.borough && <span>· {c.borough}</span>}
                {c.zip && <span>· {c.zip}</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
