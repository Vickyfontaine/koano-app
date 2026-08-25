// Deterministic DIRECTIONAL nudge — the third instance of the facts-drive pattern
// (after entitlement risk and confidence). The specialist agents regress to
// "hold" (the prompt correctly discourages manufacturing conviction from weak
// signal), so when a site has a CLEAR structural signal the engine says nothing.
// This computes a directional lean from the zoning + permit FACTS and adds it to
// the synthesis score — but ONLY on unambiguous facts, so genuine hold survives.
//
// Pure and client-safe (types only). Returns the nudge (on the score's [-2,2]
// axis) and the drivers, so the panel can SHOW which facts produced the lean.

import type { AgentVerdict } from './shared';

export interface StructuralFacts {
  unusedFarPct: number | null;
  builtFar: number | null;
  maxResidentialFar: number | null;
  maxCommercialFar: number | null;
  newBuildingPermits: number | null; // tract, 24mo
}

export interface StructuralDirection {
  nudge: number; // added to the aggregate score; + = buy-ward, − = wait/sell-ward
  drivers: string[]; // the facts that produced the lean (shown to the user)
}

function num(v: unknown): number | null {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
}

// Pull the structural facts out of the agents' data points (regulatory-policy
// carries zoning, infrastructure carries permits). Tolerant to which agent holds
// which point — scans them all.
export function extractStructuralFacts(agents: AgentVerdict[]): StructuralFacts {
  const byLabel = new Map<string, unknown>();
  for (const a of agents) for (const d of a.data_points) if (!byLabel.has(d.label)) byLabel.set(d.label, d.value);
  const find = (re: RegExp): unknown => Array.from(byLabel).find(([label]) => re.test(label))?.[1];
  return {
    unusedFarPct: num(find(/^unused_far_pct/)),
    builtFar: num(find(/^built_far$/)),
    maxResidentialFar: num(find(/^max_residential_far$/)),
    maxCommercialFar: num(find(/^max_commercial_far$/)),
    newBuildingPermits: num(find(/^new_building_permits/)),
  };
}

export function structuralDirection(f: StructuralFacts): StructuralDirection {
  let nudge = 0;
  const drivers: string[] = [];

  const overMax =
    (f.builtFar != null && f.maxResidentialFar != null && f.maxResidentialFar > 0 && f.builtFar >= f.maxResidentialFar &&
      (f.maxCommercialFar == null || f.maxCommercialFar <= 0 || f.builtFar >= f.maxCommercialFar));
  const zeroHeadroom = f.unusedFarPct != null && f.unusedFarPct <= 0;

  // Over-max / zero headroom — the SUBJECT can't develop as-of-right; realizing
  // any value needs a discretionary variance. This is a subject-level constraint,
  // so it DOMINATES (and blocks the tract buy-lean below from cancelling it).
  if (zeroHeadroom || overMax) {
    nudge -= 0.7;
    drivers.push('no as-of-right FAR headroom (built at/over the district max) — realizing value needs a variance → wait');
  } else if (f.unusedFarPct != null && f.unusedFarPct >= 80) {
    // Very high as-of-right headroom — strong latent development upside.
    nudge += 1.0;
    drivers.push(`${f.unusedFarPct}% unused FAR — large as-of-right development upside → buy`);
  } else if (f.unusedFarPct != null && f.unusedFarPct >= 50) {
    nudge += 0.6;
    drivers.push(`${f.unusedFarPct}% unused FAR — meaningful as-of-right room → buy-lean`);
  }
  // NB: 15–49% headroom deliberately produces NO nudge — that is the ambiguous
  // middle the hold bias is meant to catch.

  // Active ground-up development in the tract reinforces a buy — but only when the
  // subject itself has room (not over-max), so it never offsets the variance wait.
  if (!zeroHeadroom && !overMax && f.newBuildingPermits != null && f.newBuildingPermits >= 3) {
    nudge += 0.3;
    drivers.push(`${f.newBuildingPermits} new-building permits in the tract (24mo) — active ground-up development → buy-lean`);
  }

  // Clamp so the nudge complements agent consensus, never steamrolls it.
  return { nudge: Math.max(-1.5, Math.min(1.5, Math.round(nudge * 100) / 100)), drivers };
}
