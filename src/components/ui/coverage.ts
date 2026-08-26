// Coverage map — the per-verdict, per-LAYER view of what ran live, what isn't
// wired for this market, and what a given feed would unlock. Built from the
// verdict's data points (the 5-agent inputs), grouped by SOURCE into named data
// LAYERS, then grouped by provenance state.
//
// Precision is the point: it names individual layers ("Comparable sales", "Zoning
// & FAR"), never a category ("limited coverage"), so a data partner can see
// exactly which rows their feed fills. The three non-live states are kept
// DISTINCT (they mean different things): coverage_absent is a structural market
// gap, fetch_failed is a transient problem worth a retry, representative is a
// labeled paid-source stand-in.

import { weakestProvenance } from "./verdict";
import type { LedgerDataPoint, Provenance } from "./verdict";

export interface CoverageLayer {
  layer: string; // human layer name, e.g. "Comparable sales (NYC DOF recorded sales)"
  state: Provenance;
  source: string; // the provider source string (for the audit trail)
  // For a non-live layer: what fills it. coverage_absent → the feed that would
  // cover this market; representative → the paid source it becomes live with.
  unlock?: string;
}

export interface CoverageMap {
  live: CoverageLayer[];
  partner: CoverageLayer[];
  representative: CoverageLayer[];
  fetch_failed: CoverageLayer[];
  coverage_absent: CoverageLayer[];
  total: number;
}

// Map a provider SOURCE string → a clean layer name (+ what a feed unlocks). The
// `unlock` only matters when the layer is non-live; it names the feed a partner
// would provide. Order: most specific first. Federal layers have no unlock (they
// run live at any US address, so they never read coverage_absent).
interface LayerRule {
  match: RegExp;
  layer: string;
  unlock?: string;
}
const LAYER_RULES: LayerRule[] = [
  // NYC-municipal + comps — the layers that read coverage_absent off-market, each
  // naming the feed a partner brings to light up a new market.
  { match: /DOF Rolling|Rolling Calendar Sales|recorded sales/i, layer: "Comparable sales (NYC DOF recorded sales)", unlock: "a national MLS feed (Trestle / ATTOM)" },
  { match: /DOB Job Application|entitlement/i, layer: "Entitlement track record (NYC DOB filings)", unlock: "a municipal entitlement / filings feed for this market" },
  { match: /DOB permits|DOB NOW|Permit Issuance/i, layer: "Building permits (NYC DOB)", unlock: "a municipal building-permits feed for this market" },
  { match: /HPD.*ECB|ECB.*violations|HPD \(|HPD violations|building violations/i, layer: "Building violations (NYC HPD / ECB / DOB)", unlock: "a municipal code-enforcement feed for this market" },
  { match: /HPD registrations|Speculation Watch|landlord/i, layer: "Ownership & landlord (NYC HPD)", unlock: "a municipal ownership-registration feed for this market" },
  { match: /MapPLUTO|PLUTO/i, layer: "Zoning, FAR & assemblage (NYC MapPLUTO)", unlock: "a municipal parcel & zoning feed for this market" },
  // paid stand-ins (representative) — the CoStar-tier gaps.
  { match: /pro.?forma|CoStar Market Analytics/i, layer: "Pro forma benchmarks", unlock: "a CoStar-tier pro-forma feed" },
  { match: /commercial deals|CoStar\/RCA|MSCI/i, layer: "Commercial deals", unlock: "a CoStar / MSCI RCA deals feed" },
  // federal / national — live at any US address (never coverage_absent).
  { match: /National Risk Index/i, layer: "Natural-hazard risk (FEMA NRI)" },
  { match: /NFHL|flood zone|FEMA.*flood/i, layer: "Flood zone (FEMA NFHL)" },
  { match: /OpenFEMA|Disaster Declarations|disaster history/i, layer: "Disaster history (OpenFEMA)" },
  { match: /EPA|Superfund|brownfield|contamination/i, layer: "Environmental contamination (EPA)" },
  { match: /USGS|seismic/i, layer: "Seismic hazard (USGS)" },
  { match: /NOAA|climate/i, layer: "Climate normals (NOAA)" },
  { match: /FHFA|House Price Index/i, layer: "House Price Index (FHFA)" },
  { match: /Census.*(ACS|Reporter)|ACS/i, layer: "Demographics (Census ACS)" },
  { match: /Building Permits Survey|BPS/i, layer: "New housing supply (Census BPS)" },
  { match: /HMDA/i, layer: "Mortgage lending (CFPB HMDA)" },
  { match: /QCEW|BLS/i, layer: "Employment & wages (BLS QCEW)" },
  { match: /IRS SOI|migration/i, layer: "County migration (IRS SOI)" },
  { match: /Opportunity Zone|QOZ/i, layer: "Opportunity Zone (IRS)" },
  { match: /Qualified Census Tract|Difficult Development Area|QCT|DDA|LIHTC/i, layer: "LIHTC eligibility (HUD QCT / DDA)" },
  { match: /Fair Market Rent|FMR/i, layer: "Fair market rents (HUD)" },
  { match: /Freddie|PMMS/i, layer: "Mortgage rate (Freddie Mac PMMS)" },
  { match: /FBI|NYPD|Crime/i, layer: "Crime (FBI / NYPD)" },
];

function layerForSource(source: string): { layer: string; unlock?: string } {
  const rule = LAYER_RULES.find((r) => r.match.test(source));
  if (rule) return { layer: rule.layer, unlock: rule.unlock };
  // Fallback: the source up to its first " — " / " (" — never "unknown".
  const clean = source.split(/ — | \(/)[0].trim();
  return { layer: clean || source };
}

export function buildCoverageMap(dataPoints: LedgerDataPoint[]): CoverageMap {
  // Collapse to one entry per LAYER, carrying the weakest state seen for it.
  const byLayer = new Map<string, CoverageLayer>();
  for (const d of dataPoints) {
    const { layer, unlock } = layerForSource(d.source);
    const cur = byLayer.get(layer);
    const state = cur ? weakestProvenance([{ provenance: cur.state }, { provenance: d.provenance }]) : d.provenance;
    byLayer.set(layer, { layer, state, source: cur?.source ?? d.source, unlock: unlock ?? cur?.unlock });
  }

  const map: CoverageMap = { live: [], partner: [], representative: [], fetch_failed: [], coverage_absent: [], total: 0 };
  // Array.from — never iterate a Map directly (TS target; CLAUDE.md gotcha).
  Array.from(byLayer.values()).forEach((l) => {
    map[l.state].push(l);
    map.total++;
  });
  const byName = (a: CoverageLayer, b: CoverageLayer) => a.layer.localeCompare(b.layer);
  map.live.sort(byName);
  map.partner.sort(byName);
  map.representative.sort(byName);
  map.fetch_failed.sort(byName);
  map.coverage_absent.sort(byName);
  return map;
}
