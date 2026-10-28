// Frame-driven motion kit for the KOANO film.
// The one constant is the shared easing curve [0.16, 1, 0.3, 1], matching
// .btn-primary and the site. Every helper reads useCurrentFrame() so the
// render is deterministic frame by frame. No CSS transitions, no Framer Motion.
import { Easing, interpolate, useCurrentFrame } from "remotion";

/** KOANO's shared easing curve (globals.css .btn-primary). */
export const KOANO_EASE = Easing.bezier(0.16, 1, 0.3, 1);

/** Seconds -> frames at 30fps. */
export const secs = (s: number) => Math.round(s * 30);

const clamp = { extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const };

/** Interpolate on the shared easing curve. */
export function ease(frame: number, range: [number, number], out: [number, number]) {
  return interpolate(frame, range, out, { ...clamp, easing: KOANO_EASE });
}

/** Fade-up entrance: opacity 0->1 and a small rise. Returns a style fragment. */
export function useFadeUp(
  start: number,
  opts: { dur?: number; dist?: number } = {}
): { opacity: number; transform: string } {
  const frame = useCurrentFrame();
  const { dur = 15, dist = 20 } = opts;
  const opacity = ease(frame, [start, start + dur], [0, 1]);
  const y = ease(frame, [start, start + dur], [dist, 0]);
  return { opacity, transform: `translateY(${y}px)` };
}

/** Slow push-in scale (camera-move feel). Returns a scalar. */
export function usePushIn(
  start: number,
  opts: { dur?: number; from?: number; to?: number } = {}
): number {
  const frame = useCurrentFrame();
  const { dur = 20, from = 1.04, to = 1 } = opts;
  return ease(frame, [start, start + dur], [from, to]);
}
