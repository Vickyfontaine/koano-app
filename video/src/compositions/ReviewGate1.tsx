// Gate 1 review cut: cold open + all of Act 1 + the end card.
// Scenes are sequenced with directional transitions (Section 4): the white
// address scene rises over the blue cold open, white scenes cross-fade, and the
// brand-blue end card wipes up from the bottom at the close.
import React from "react";
import { AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { useKoanoFonts } from "../fonts";
import { ColdOpen } from "../scenes/ColdOpen";
import { AddressScene } from "../scenes/AddressScene";
import { AgentsScene } from "../scenes/AgentsScene";
import { SynthesisScene } from "../scenes/SynthesisScene";
import { FlagshipScene } from "../scenes/FlagshipScene";
import { EndCard } from "../scenes/EndCard";

// Sequence durations (frames). Total = sum(seq) - sum(transitions).
export const GATE1_SEQ = { cold: 120, address: 150, agents: 360, synth: 300, flag: 90, end: 120 };
export const GATE1_TR = { t1: 15, t2: 12, t3: 12, t4: 12, t5: 18 };
export const GATE1_DURATION =
  Object.values(GATE1_SEQ).reduce((a, b) => a + b, 0) -
  Object.values(GATE1_TR).reduce((a, b) => a + b, 0); // 1071

export const ReviewGate1: React.FC = () => {
  useKoanoFonts();
  return (
    <AbsoluteFill style={{ backgroundColor: "var(--white)" }}>
      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={GATE1_SEQ.cold}>
          <ColdOpen />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-bottom" })}
          timing={linearTiming({ durationInFrames: GATE1_TR.t1 })}
        />
        <TransitionSeries.Sequence durationInFrames={GATE1_SEQ.address}>
          <AddressScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: GATE1_TR.t2 })}
        />
        <TransitionSeries.Sequence durationInFrames={GATE1_SEQ.agents}>
          <AgentsScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: GATE1_TR.t3 })}
        />
        <TransitionSeries.Sequence durationInFrames={GATE1_SEQ.synth}>
          <SynthesisScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: GATE1_TR.t4 })}
        />
        <TransitionSeries.Sequence durationInFrames={GATE1_SEQ.flag}>
          <FlagshipScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-bottom" })}
          timing={linearTiming({ durationInFrames: GATE1_TR.t5 })}
        />
        <TransitionSeries.Sequence durationInFrames={GATE1_SEQ.end}>
          <EndCard />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
