"use client";

// BarChart — a compact vertical-bar primitive for an ordered series (e.g. a
// monthly permit trend). visx supplies the value scale; bars + axes are HTML/CSS
// (crisp text, fluid width). Provenance-native: a `muted` bar renders hatched.
// Optional y-axis so bar heights carry magnitude, not just shape.

import React from "react";
import { scaleLinear } from "@visx/scale";

export interface BarDatum {
  key: string;
  label: string; // x-axis label (shown at sampled positions)
  value: number;
  muted?: boolean;
  title?: string; // hover; defaults to `${label}: ${value}`
}

interface BarChartProps {
  data: BarDatum[];
  height?: number;
  color?: string;
  /** Outline for the bars — a deeper tint of the fill, so a pastel fill reads on white. */
  borderColor?: string;
  /** Label every Nth bar on the x-axis (0 = none). */
  axisEvery?: number;
  /** Render a y-axis (0 / mid / max) with gridlines so heights carry magnitude. */
  yAxis?: boolean;
  valueFormat?: (n: number) => string;
  ariaLabel?: string;
}

const axisLabel: React.CSSProperties = {
  fontFamily: "'DM Mono', monospace",
  fontSize: "9px",
  letterSpacing: "0.04em",
  color: "var(--ink-faint)",
  whiteSpace: "nowrap",
};

export default function BarChart({
  data,
  height = 140,
  color = "var(--mid-blue)",
  borderColor,
  axisEvery = 6,
  yAxis = false,
  valueFormat = (n) => n.toLocaleString("en-US"),
  ariaLabel,
}: BarChartProps) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const yScale = scaleLinear({ domain: [0, max], range: [0, 100] });
  const n = data.length || 1;
  const gutter = yAxis ? 34 : 0;
  const yTicks = yAxis ? [max, max / 2, 0] : [];

  return (
    <div>
      <div style={{ marginLeft: `${gutter}px` }}>
        <div style={{ position: "relative", height: `${height}px` }}>
          {/* Y gridlines + labels (labels sit in the left gutter) */}
          {yTicks.map((v) => (
            <div key={v} style={{ position: "absolute", left: 0, right: 0, top: `${100 - yScale(v)}%` }}>
              <div style={{ borderTop: "1px solid var(--border-light)", height: 0 }} />
              <span
                style={{
                  ...axisLabel,
                  position: "absolute",
                  left: `-${gutter}px`,
                  width: `${gutter - 6}px`,
                  textAlign: "right",
                  transform: "translateY(-50%)",
                }}
              >
                {valueFormat(Math.round(v))}
              </span>
            </div>
          ))}
          {/* Bars */}
          <div
            role="img"
            aria-label={ariaLabel}
            style={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-end", gap: "2px" }}
          >
            {data.map((d) => (
              <div
                key={d.key}
                title={d.title ?? `${d.label}: ${valueFormat(d.value)}`}
                style={{ flex: 1, minWidth: 0, height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}
              >
                <div
                  style={{
                    height: `${yScale(d.value)}%`,
                    minHeight: d.value > 0 ? "2px" : "0",
                    background: color,
                    backgroundImage: d.muted
                      ? "repeating-linear-gradient(45deg, rgba(255,255,255,0.6) 0 3px, rgba(255,255,255,0) 3px 6px)"
                      : undefined,
                    border: borderColor ? `1px solid ${borderColor}` : undefined,
                    borderRadius: "2px 2px 0 0",
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
      {axisEvery > 0 && (
        <div style={{ position: "relative", height: "14px", marginTop: "6px", marginLeft: `${gutter}px` }}>
          {data.map((d, i) =>
            i % axisEvery === 0 ? (
              <span
                key={d.key}
                style={{
                  ...axisLabel,
                  position: "absolute",
                  left: `${((i + 0.5) / n) * 100}%`,
                  transform: i === 0 ? "translateX(0)" : "translateX(-50%)",
                }}
              >
                {d.label}
              </span>
            ) : null,
          )}
        </div>
      )}
    </div>
  );
}
