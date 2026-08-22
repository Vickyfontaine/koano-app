"use client";

// DivergingBar — a horizontal diverging bar chart primitive.
// Bars extend left (negative) or right (positive) from a shared zero baseline
// on a common linear domain, so magnitudes are directly comparable across rows.
// visx supplies the scale; the marks are crisp HTML/CSS (like the Meter bar) so
// text stays sharp and the layout is natively responsive.
//
// Provenance-native by design: a `muted` datum (representative data) renders
// hatched, never as a solid live bar — a chart can't imply live where it isn't.

import React from "react";
import { scaleLinear } from "@visx/scale";

export interface DivergingDatum {
  key: string;
  /** Left-column label (Neue Montreal). */
  label: string;
  /** Optional mono sub-label under the label (e.g. "buy · 72"). */
  sublabel?: string;
  /** Position on the domain; sign sets the bar direction. */
  value: number;
  /** Bar fill (a CSS color / var). */
  color: string;
  /** Representative data → hatched, washed bar. */
  muted?: boolean;
  /** Text rendered at the bar's outer end (e.g. "+0.41"). */
  valueLabel?: string;
  /** Rendered in the label column, next to the sub-label (e.g. a provenance dot). */
  badge?: React.ReactNode;
  /**
   * No directional signal (a zero-contribution vote). Renders recessively with
   * an explicit "no directional signal" note instead of a bar — the absence is
   * information, not a gap.
   */
  neutral?: boolean;
}

interface DivergingBarProps {
  data: DivergingDatum[];
  /** Shared linear domain, e.g. [-2, 2]. */
  domain: [number, number];
  /** Per-row bar height in px. */
  barHeight?: number;
  /** Left label column width in px. */
  labelWidth?: number;
}

const mono: React.CSSProperties = {
  fontFamily: "'DM Mono', monospace",
  fontSize: "11px",
  letterSpacing: "0.04em",
};

export default function DivergingBar({
  data,
  domain,
  barHeight = 22,
  labelWidth = 176,
}: DivergingBarProps) {
  // Percent scale — positions are CSS left/width %, so the plot is fully fluid.
  const scale = scaleLinear({ domain, range: [0, 100] });
  const zeroPct = scale(0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {data.map((d) => {
        const vPct = scale(d.value);
        const left = Math.min(zeroPct, vPct);
        const width = Math.abs(vPct - zeroPct);
        const positive = d.value >= 0;
        return (
          <div
            key={d.key}
            style={{
              display: "grid",
              gridTemplateColumns: `${labelWidth}px 1fr`,
              alignItems: "center",
              gap: "16px",
            }}
          >
            {/* Label column */}
            <div style={{ display: "flex", flexDirection: "column", gap: "3px", minWidth: 0 }}>
              <span
                style={{
                  fontSize: "13px",
                  fontWeight: 500,
                  color: d.neutral ? "var(--ink-muted)" : "var(--ink-primary)",
                  lineHeight: 1.25,
                }}
              >
                {d.label}
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                {d.sublabel && (
                  <span style={{ ...mono, fontSize: "10px", color: "var(--ink-faint)" }}>{d.sublabel}</span>
                )}
                {d.badge}
              </div>
            </div>

            {/* Bar track */}
            <div
              style={{
                position: "relative",
                height: `${barHeight}px`,
                background: d.neutral ? "transparent" : "var(--border-light)",
                borderRadius: "5px",
              }}
            >
              {/* Zero baseline — full opacity for neutral rows (it's the whole point) */}
              <div
                aria-hidden="true"
                style={{
                  position: "absolute",
                  top: "-3px",
                  bottom: "-3px",
                  left: `${zeroPct}%`,
                  width: "1px",
                  background: "var(--ink-faint)",
                  opacity: d.neutral ? 0.7 : 0.5,
                }}
              />
              {d.neutral ? (
                <>
                  {/* A hollow node sitting on the zero line: consulted, returned nothing */}
                  <span
                    aria-hidden="true"
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: `${zeroPct}%`,
                      transform: "translate(-50%, -50%)",
                      width: "7px",
                      height: "7px",
                      borderRadius: "50%",
                      border: "1px solid var(--ink-faint)",
                      background: "var(--white)",
                    }}
                  />
                  <span
                    style={{
                      ...mono,
                      position: "absolute",
                      top: "50%",
                      left: `calc(${zeroPct}% + 12px)`,
                      transform: "translateY(-50%)",
                      fontSize: "10px",
                      color: "var(--ink-faint)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    no directional signal
                  </span>
                </>
              ) : (
                <>
                  {/* The bar */}
                  {width > 0.01 && (
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        bottom: 0,
                        left: `${left}%`,
                        width: `${width}%`,
                        background: d.color,
                        backgroundImage: d.muted
                          ? "repeating-linear-gradient(45deg, rgba(255,255,255,0.62) 0 3px, rgba(255,255,255,0) 3px 6px)"
                          : undefined,
                        opacity: d.muted ? 0.85 : 1,
                        border: d.muted ? "1px dashed rgba(255,255,255,0.7)" : "none",
                        borderRadius: positive ? "0 5px 5px 0" : "5px 0 0 5px",
                      }}
                    />
                  )}
                  {/* Value label at the bar's outer end */}
                  {d.valueLabel && (
                    <span
                      style={{
                        ...mono,
                        position: "absolute",
                        top: "50%",
                        transform: "translateY(-50%)",
                        [positive ? "left" : "right"]: `calc(${positive ? vPct : 100 - vPct}% + 6px)`,
                        color: "var(--ink-secondary)",
                        fontWeight: 500,
                        whiteSpace: "nowrap",
                      } as React.CSSProperties}
                    >
                      {d.valueLabel}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
