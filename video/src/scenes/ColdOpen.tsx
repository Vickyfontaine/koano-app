// Cold open (~4s). Full-bleed brand blue matching the end card and homepage
// hero, one line in near-black. Slow push-in on the whole field.
import React from "react";
import { AbsoluteFill } from "remotion";
import { useFadeUp, usePushIn } from "../lib/motion";
import { SANS } from "../lib/ui";

export const ColdOpen: React.FC = () => {
  const line = useFadeUp(8, { dur: 18, dist: 22 });
  const scale = usePushIn(0, { dur: 110, from: 1.05, to: 1.0 });

  return (
    <AbsoluteFill style={{ backgroundColor: "var(--brand-blue)" }}>
      <AbsoluteFill style={{ transform: `scale(${scale})`, transformOrigin: "center" }}>
        <div
          style={{
            position: "absolute",
            top: 56,
            left: 64,
            fontFamily: SANS,
            fontWeight: 700,
            fontSize: 26,
            letterSpacing: "0.02em",
            color: "var(--near-black)",
          }}
        >
          KOANO
        </div>
        <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
          <div
            style={{
              maxWidth: 1100,
              textAlign: "center",
              fontFamily: SANS,
              fontWeight: 700,
              fontSize: 68,
              lineHeight: 1.08,
              letterSpacing: "-0.02em",
              color: "var(--near-black)",
              ...line,
            }}
          >
            The analysis took a week. Now it takes ninety seconds.
          </div>
        </AbsoluteFill>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
