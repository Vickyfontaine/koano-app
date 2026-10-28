// Scene 1.3 — synthesis converges. The REAL VerdictMathPanel renders the exact
// recorded arithmetic (EXAMPLE_VERDICT.weighting_breakdown): per-agent
// contributions, structural nudge, aggregate -> final, threshold, verdict. A
// single light sweep crosses the panel on the verdict lock.
import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import VerdictMathPanel from "@/components/ui/VerdictMathPanel";
import { EXAMPLE_VERDICT } from "@/components/marketing/exampleVerdict";
import { ease } from "../lib/motion";
import { SANS } from "../lib/ui";

const SWEEP_START = 46;

export const SynthesisScene: React.FC = () => {
  const frame = useCurrentFrame();
  const capO = ease(frame, [0, 12], [0, 1]);
  const capY = ease(frame, [0, 12], [16, 0]);
  const panelO = ease(frame, [8, 24], [0, 1]);
  const panelS = ease(frame, [8, 30], [0.97, 1]);

  // One-time diagonal light sweep across the panel on the verdict lock.
  const sweepX = ease(frame, [SWEEP_START, SWEEP_START + 22], [-40, 160]); // % across
  const sweepO =
    ease(frame, [SWEEP_START, SWEEP_START + 6], [0, 0.55]) -
    ease(frame, [SWEEP_START + 6, SWEEP_START + 22], [0, 0.55]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "var(--white)",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: 28,
      }}
    >
      <div
        style={{
          opacity: capO,
          transform: `translateY(${capY}px)`,
          fontFamily: SANS,
          fontSize: 26,
          fontWeight: 500,
          color: "var(--ink-secondary)",
        }}
      >
        Every weight and every threshold, on the record.
      </div>

      <div
        style={{
          position: "relative",
          width: 720,
          opacity: panelO,
          transform: `scale(${panelS})`,
          transformOrigin: "center",
        }}
      >
        <VerdictMathPanel verdict={EXAMPLE_VERDICT} />
        {/* light sweep */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 16,
            overflow: "hidden",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: "-20%",
              left: `${sweepX}%`,
              width: "34%",
              height: "140%",
              transform: "rotate(12deg)",
              background:
                "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0) 100%)",
              opacity: sweepO,
              mixBlendMode: "screen",
            }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};
