// Phase 0 smoke scene. Proves the pipeline end to end:
//  - a KOANO design token as a full-bleed background (--brand-blue),
//  - token text color (--near-black) at ~8:1 contrast (the bookend combo),
//  - frame-driven motion on the shared easing curve [0.16, 1, 0.3, 1],
//  - the brand font stack (renders as system-ui today, matching koano.co).
// Replaced by the real end card in Phase 1.
import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";

const EASE = Easing.bezier(0.16, 1, 0.3, 1);

export const Smoke: React.FC = () => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE,
  });
  const y = interpolate(frame, [0, 15], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: EASE,
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "var(--brand-blue)",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          opacity,
          transform: `translateY(${y}px)`,
          color: "var(--near-black)",
          fontFamily: "'Neue Montreal', 'DM Sans', system-ui, sans-serif",
          fontWeight: 700,
          fontSize: 120,
          letterSpacing: "-0.02em",
        }}
      >
        KOANO
      </div>
    </AbsoluteFill>
  );
};
