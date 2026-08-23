"use client";

// Scatter — a small x/y scatter primitive (e.g. comp $/sqft over time). visx
// supplies both scales; points and axes are HTML/CSS marks (crisp text, fluid
// width). A `muted` point (representative) renders hollow; a colored point
// carries a value encoding (here, the comp's $/sqft diverging color). Optional
// horizontal reference line for a benchmark (the indicative value).

import React from "react";
import { scaleLinear } from "@visx/scale";

export interface ScatterPoint {
  key: string;
  x: number; // domain value (e.g. a timestamp)
  y: number;
  color: string;
  muted?: boolean;
  title?: string; // hover, "\n"-joined
}

export interface AxisTick {
  value: number;
  label: string;
}

interface ScatterProps {
  points: ScatterPoint[];
  xDomain: [number, number];
  yDomain: [number, number];
  xTicks: AxisTick[];
  yTicks: AxisTick[];
  refLine?: { y: number; label: string };
  height?: number;
  gutter?: number; // left space for y labels
}

const axisLabel: React.CSSProperties = {
  fontFamily: "'DM Mono', monospace",
  fontSize: "9px",
  letterSpacing: "0.04em",
  color: "var(--ink-faint)",
  whiteSpace: "nowrap",
};

export default function Scatter({
  points,
  xDomain,
  yDomain,
  xTicks,
  yTicks,
  refLine,
  height = 180,
  gutter = 48,
}: ScatterProps) {
  const xScale = scaleLinear({ domain: xDomain, range: [0, 100] });
  const yScale = scaleLinear({ domain: yDomain, range: [0, 100] });
  const topPct = (v: number) => 100 - Math.max(0, Math.min(100, yScale(v)));
  const leftPct = (v: number) => Math.max(0, Math.min(100, xScale(v)));

  return (
    <div>
      <div
        style={{
          position: "relative",
          height: `${height}px`,
          marginLeft: `${gutter}px`,
          borderLeft: "1px solid var(--border)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        {/* Y gridlines + labels (labels sit in the left gutter) */}
        {yTicks.map((t) => (
          <div key={`y-${t.value}`} style={{ position: "absolute", left: 0, right: 0, top: `${topPct(t.value)}%` }}>
            <div style={{ borderTop: "1px solid var(--border-light)", height: 0 }} />
            <span
              style={{
                ...axisLabel,
                position: "absolute",
                left: `-${gutter}px`,
                width: `${gutter - 8}px`,
                textAlign: "right",
                transform: "translateY(-50%)",
              }}
            >
              {t.label}
            </span>
          </div>
        ))}

        {/* Reference line (indicative value) */}
        {refLine && (
          <div style={{ position: "absolute", left: 0, right: 0, top: `${topPct(refLine.y)}%` }}>
            <div style={{ borderTop: "1px dashed var(--ink-faint)", height: 0, opacity: 0.7 }} />
            <span
              style={{
                ...axisLabel,
                position: "absolute",
                right: "2px",
                top: "-14px", // above the line, clear of points centered on it
                color: "var(--ink-muted)",
                background: "rgba(255,255,255,0.92)",
                borderRadius: "3px",
                padding: "1px 4px",
              }}
            >
              {refLine.label}
            </span>
          </div>
        )}

        {/* Points */}
        {points.map((p) => (
          <span
            key={p.key}
            title={p.title}
            style={{
              position: "absolute",
              left: `${leftPct(p.x)}%`,
              top: `${topPct(p.y)}%`,
              transform: "translate(-50%, -50%)",
              width: "11px",
              height: "11px",
              borderRadius: "50%",
              background: p.muted ? "#FFFFFF" : p.color,
              border: `1.5px solid ${p.color}`,
              boxShadow: "0 0 0 1.5px #fff",
            }}
          />
        ))}
      </div>

      {/* X axis labels */}
      <div style={{ position: "relative", height: "14px", marginTop: "6px", marginLeft: `${gutter}px` }}>
        {xTicks.map((t) => (
          <span
            key={`x-${t.value}`}
            style={{ ...axisLabel, position: "absolute", left: `${leftPct(t.value)}%`, transform: "translateX(-50%)" }}
          >
            {t.label}
          </span>
        ))}
      </div>
    </div>
  );
}
