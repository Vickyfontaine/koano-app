"use client";

// ScoreBands — a horizontal axis of colored verdict bands with a marker at the
// computed score. Shows exactly where an aggregate score lands relative to the
// decision thresholds: the visual answer to "why this verdict and not the next
// one?" visx scales the positions; the marks are HTML/CSS for crisp labels.

import React from "react";
import { scaleLinear } from "@visx/scale";

export interface ScoreBand {
  from: number;
  to: number;
  label: string;
  color: string; // the band's verdict color (used as a translucent tint)
}

interface ScoreBandsProps {
  domain: [number, number];
  bands: ScoreBand[];
  /** The aggregate score marker. */
  score: number;
  /** Verdict label shown above the marker. */
  verdictLabel: string;
  verdictColor: string;
  /** Domain values to tick beneath the axis (e.g. the thresholds). */
  ticks: number[];
}

const mono: React.CSSProperties = {
  fontFamily: "'DM Mono', monospace",
  letterSpacing: "0.06em",
};

function fmt(n: number): string {
  const s = n.toFixed(n % 1 === 0 ? 1 : 2);
  return s.startsWith("-") ? "−" + s.slice(1) : s;
}

export default function ScoreBands({
  domain,
  bands,
  score,
  verdictLabel,
  verdictColor,
  ticks,
}: ScoreBandsProps) {
  const scale = scaleLinear({ domain, range: [0, 100] });
  const scorePct = Math.max(0, Math.min(100, scale(score)));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
      {/* Verdict + score marker label, positioned over the score */}
      <div style={{ position: "relative", height: "34px" }}>
        <div
          style={{
            position: "absolute",
            left: `${scorePct}%`,
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "2px",
            whiteSpace: "nowrap",
          }}
        >
          <span
            style={{
              fontSize: "13px",
              fontWeight: 700,
              letterSpacing: "-0.01em",
              textTransform: "uppercase",
              color: verdictColor,
            }}
          >
            {verdictLabel}
          </span>
          <span style={{ ...mono, fontSize: "10px", color: "var(--ink-muted)" }}>
            score {fmt(score)}
          </span>
        </div>
      </div>

      {/* The band track */}
      <div style={{ position: "relative", height: "28px", borderRadius: "6px", overflow: "hidden" }}>
        {bands.map((b, i) => {
          const left = scale(b.from);
          const right = scale(b.to);
          const isTop = i === bands.length - 1;
          const chosen = score >= b.from && (isTop ? score <= b.to : score < b.to);
          return (
            <div
              key={b.label}
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: `${left}%`,
                width: `${right - left}%`,
                background: b.color,
                // The band the score is in reads strongest — it is where the user is.
                opacity: chosen ? 0.34 : 0.12,
              }}
            />
          );
        })}
        {/* Band labels */}
        {bands.map((b, i) => {
          const mid = scale((b.from + b.to) / 2);
          const isTop = i === bands.length - 1;
          const chosen = score >= b.from && (isTop ? score <= b.to : score < b.to);
          return (
            <span
              key={`${b.label}-lbl`}
              style={{
                ...mono,
                position: "absolute",
                top: "50%",
                left: `${mid}%`,
                transform: "translate(-50%, -50%)",
                fontSize: "9px",
                fontWeight: chosen ? 700 : 500,
                textTransform: "uppercase",
                color: b.color,
                opacity: chosen ? 1 : 0.7,
              }}
            >
              {b.label}
            </span>
          );
        })}
        {/* Score marker — authoritative dark rule so it reads on any band */}
        <div
          style={{
            position: "absolute",
            top: "-4px",
            bottom: "-4px",
            left: `${scorePct}%`,
            width: "3px",
            transform: "translateX(-1.5px)",
            background: "var(--ink-primary)",
            borderRadius: "2px",
          }}
        />
      </div>

      {/* Threshold ticks */}
      <div style={{ position: "relative", height: "18px", marginTop: "4px" }}>
        {ticks.map((t) => {
          const left = scale(t);
          return (
            <span
              key={t}
              style={{
                ...mono,
                position: "absolute",
                left: `${left}%`,
                transform: "translateX(-50%)",
                fontSize: "9px",
                color: "var(--ink-faint)",
              }}
            >
              {fmt(t)}
            </span>
          );
        })}
      </div>
    </div>
  );
}
