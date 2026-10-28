// Scene 1.1 — the address. White field. The address types in on frame cadence
// and resolves to a confirmed-address chip. Subject: 175 3rd Street (the
// commercial spine address; full house number is fine here).
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { EXAMPLE_VERDICT_ADDRESS } from "@/components/marketing/exampleVerdict";
import { ease } from "../lib/motion";
import { MONO, SANS } from "../lib/ui";

export const AddressScene: React.FC = () => {
  const frame = useCurrentFrame();
  const full = EXAMPLE_VERDICT_ADDRESS; // "175 3rd Street, Brooklyn"
  const typeStart = 8;
  const typeEnd = 46;
  const chars = Math.round(
    interpolate(frame, [typeStart, typeEnd], [0, full.length], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    })
  );
  const shown = full.slice(0, chars);
  const caretOn = frame % 16 < 8 && chars < full.length;

  const fieldOpacity = ease(frame, [0, 10], [0, 1]);
  const fieldY = ease(frame, [0, 10], [18, 0]);

  const confirmAt = typeEnd + 6;
  const chipO = ease(frame, [confirmAt, confirmAt + 10], [0, 1]);
  const chipY = ease(frame, [confirmAt, confirmAt + 10], [10, 0]);
  const capO = ease(frame, [confirmAt + 6, confirmAt + 20], [0, 1]);

  return (
    <AbsoluteFill style={{ backgroundColor: "var(--white)", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 860, display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
        <div
          style={{
            width: "100%",
            opacity: fieldOpacity,
            transform: `translateY(${fieldY}px)`,
            background: "var(--white)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            boxShadow: "var(--shadow-raised)",
            padding: "26px 30px",
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <span style={{ color: "var(--ink-faint)", fontSize: 24 }}>⌕</span>
          <span style={{ fontFamily: SANS, fontSize: 30, fontWeight: 500, color: "var(--ink-primary)" }}>
            {shown}
            <span style={{ opacity: caretOn ? 1 : 0, color: "var(--mid-blue)" }}>|</span>
          </span>
        </div>

        <div style={{ opacity: chipO, transform: `translateY(${chipY}px)`, display: "flex", alignItems: "center", gap: 9 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              fontFamily: MONO,
              fontSize: 13,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--signal-positive)",
              background: "rgba(34,197,94,0.10)",
              border: "1px solid rgba(34,197,94,0.25)",
              borderRadius: 100,
              padding: "5px 12px",
            }}
          >
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--signal-positive)" }} />
            Address confirmed
          </span>
        </div>

        <div
          style={{
            marginTop: 6,
            opacity: capO,
            fontFamily: SANS,
            fontSize: 22,
            color: "var(--ink-muted)",
            textAlign: "center",
          }}
        >
          One address. The entire public record, read at once.
        </div>
      </div>
    </AbsoluteFill>
  );
};
