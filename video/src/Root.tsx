// Composition registry for the KOANO film.
// Importing the app's globals.css brings in the whole :root token block
// (the --brand-* palette, radius, shadow, signal variables) plus the
// @tailwind directives, processed by @remotion/tailwind. Real KOANO
// components imported via `@/...` then render with correct tokens.
import "../../src/app/globals.css";

import React from "react";
import { Composition } from "remotion";
import { Smoke } from "./Smoke";
import { EndCard } from "./scenes/EndCard";
import { ReviewGate1, GATE1_DURATION } from "./compositions/ReviewGate1";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {/* Gate 1 review — cold open + all of Act 1 + end card. */}
      <Composition
        id="ReviewGate1"
        component={ReviewGate1}
        durationInFrames={GATE1_DURATION}
        fps={30}
        width={1920}
        height={1080}
      />
      {/* Phase 1 — end card (style benchmark), 4s brand-blue bookend. */}
      <Composition
        id="EndCard"
        component={EndCard}
        durationInFrames={120}
        fps={30}
        width={1920}
        height={1080}
      />
      {/* Phase 0 smoke composition: validates tokens, tailwind, motion. */}
      <Composition
        id="Smoke"
        component={Smoke}
        durationInFrames={90}
        fps={30}
        width={1920}
        height={1080}
      />
    </>
  );
};
