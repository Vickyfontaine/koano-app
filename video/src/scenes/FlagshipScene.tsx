// Scene 1.4 — the flagship line. White field, the approved verbatim brand line.
import React from "react";
import { AbsoluteFill } from "remotion";
import { useFadeUp } from "../lib/motion";
import { SANS } from "../lib/ui";

export const FlagshipScene: React.FC = () => {
  const line = useFadeUp(6, { dur: 18, dist: 20 });
  return (
    <AbsoluteFill style={{ backgroundColor: "var(--white)", alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          maxWidth: 1200,
          textAlign: "center",
          fontFamily: SANS,
          fontWeight: 700,
          fontSize: 66,
          lineHeight: 1.1,
          letterSpacing: "-0.02em",
          color: "var(--ink-primary)",
          ...line,
        }}
      >
        Five agents. One verdict. Every step auditable.
      </div>
    </AbsoluteFill>
  );
};
