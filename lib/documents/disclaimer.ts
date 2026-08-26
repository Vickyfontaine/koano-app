// KOANO document engine — the non-bypassable integrity contract.
// Two things every rendered document MUST carry, enforced structurally so no
// document type can omit them:
//   1. The disclaimer footer (verbatim, on every page).
//   2. The provenance appendix (every figure's source + the weakest-input
//      rollup), so a forwarded document remains auditable and honest.
// The renderer (Slice 3) paints these; this module is their format-agnostic
// source of truth.

import type { BlockKey, SiteDetailBlock } from '../providers/blocks';
import type { Provenance } from '../providers/types';
import { weakestProvenance, isTrustedProvenance, PROVENANCE_LABEL } from '../providers/provenance';
import type { DocumentData } from './types';

// One plain-language caveat sentence per non-live overall state — so a document's
// appendix names WHY it is not fully live (a stand-in vs a failed fetch vs an
// uncovered market vs partner data), never collapsing them to "representative".
function notFullyLiveNote(p: Provenance): string {
  switch (p) {
    case 'partner':
      return 'This document includes one or more partner-sourced figures (attributed to the named data partner below), alongside live public data.';
    case 'representative':
      return 'This document contains one or more representative figures (labeled below): a plausible stand-in for a paid data source not yet integrated. It is not fully live.';
    case 'fetch_failed':
      return 'One or more live sources failed to fetch at generation time (labeled below) — usually transient. It is not fully live; regenerate to refresh.';
    case 'coverage_absent':
      return "One or more data layers are outside KOANO's coverage for this market (labeled below) and were not available. It is not fully live.";
    case 'live':
      return 'Every figure in this document was fetched live from an authoritative public source at generation time.';
  }
}

// VERBATIM — do not edit. This is a legal safeguard, not copy. It renders on
// every page of every document. Documents are forwardable and leave the
// product, so this can never be optional or per-type.
export const DOCUMENT_DISCLAIMER =
  'Informational only. Generated from public data by automated analysis. ' +
  'Not professional real estate, legal, tax, or appraisal advice.';

// Human labels for each provider block, for the provenance appendix.
const BLOCK_LABELS: Record<BlockKey, string> = {
  zoning: 'Zoning / PLUTO',
  permits: 'Building permits',
  opportunity_zone: 'Opportunity Zone status',
  lihtc_eligibility: 'LIHTC eligibility (HUD QCT / DDA)',
  geometry: 'Map geometry (tract / lot boundaries)',
  proforma: 'Pro forma benchmarks',
  flood: 'Flood zone',
  flood_zones: 'Flood-zone boundaries (FEMA NFHL)',
  demographics: 'Demographics (ACS)',
  hpi: 'House Price Index',
  building_permits_supply: 'New housing supply (Census Building Permits Survey)',
  mls_comps: 'Comparable sales',
  crime: 'Crime statistics',
  building_violations: 'Building violations',
  landlord_portfolio: 'Ownership / landlord portfolio',
  mortgage_demand: 'Mortgage demand (HMDA)',
  employment: 'Employment & wages (QCEW)',
  migration: 'County migration (IRS SOI)',
  contamination: 'Environmental contamination (EPA)',
  seismic: 'Seismic hazard (USGS)',
  disaster_history: 'Disaster history (FEMA)',
  national_risk: 'Natural-hazard risk (FEMA National Risk Index)',
  climate: 'Climate normals (NOAA)',
  costar_deals: 'Commercial deals',
  assemblage: 'Assemblage / air rights',
  entitlement: 'Entitlement track record',
};

export interface ProvenanceAppendixRow {
  block: string; // human label
  source: string; // provider's source string
  provenance: Provenance;
  fetched_at: string;
  swap_note?: string; // representative blocks: which paid source makes it live
  fallback_note?: string; // a normally-live block that fell back this call
}

export interface ProvenanceAppendix {
  overall: Provenance;
  // A plain-language rollup line printed under the appendix heading.
  overall_note: string;
  rows: ProvenanceAppendixRow[];
}

// Build the provenance appendix from assembled data. Every fetched block
// becomes one row; the overall line states, in plain language, whether the
// whole document is live or contains representative figures.
export function buildProvenanceAppendix(data: DocumentData): ProvenanceAppendix {
  const rows: ProvenanceAppendixRow[] = [];

  for (const key of Object.keys(data.blocks) as BlockKey[]) {
    const block = data.blocks[key];
    if (!block) continue;
    // A normally-live block whose live call FAILED (fetch_failed) is a transient
    // degradation — surface it as fixable, not a silent gap (Principle 2). A
    // coverage_absent block is surfaced by its own provenance label (it is not a
    // failure), so it needs no fallback note.
    const fellBack = block.provenance === 'fetch_failed';
    rows.push({
      block: BLOCK_LABELS[key],
      source: block.source,
      provenance: block.provenance,
      fetched_at: block.fetched_at,
      ...(block.swap_note ? { swap_note: block.swap_note } : {}),
      ...(fellBack
        ? { fallback_note: 'Live source failed this request (usually transient); regenerate to refresh.' }
        : {}),
    });
  }

  const provenanceNote = notFullyLiveNote(data.overall_provenance);

  // Coordinate-confidence is a SEPARATE flag from provenance: 'unconfirmed' means
  // the subject point was resolved from a single geocoder without a cross-check,
  // so even live figures may describe a nearby lot. Stated distinctly, never
  // folded into the provenance wording.
  const overall_note =
    data.resolved_address.location_confidence === 'unconfirmed'
      ? `${provenanceNote} SEPARATELY — location not cross-confirmed: this address resolved from a single geocoder with no independent cross-check, so figures may describe a nearby lot rather than the exact building. Verify the address before relying on this document.`
      : provenanceNote;

  return { overall: data.overall_provenance, overall_note, rows };
}

// Shared appendix builder for documents that (optionally) drop non-live
// demographics and (optionally) account for the KOANO VERDICT as its own
// provenance source. Overall provenance is the weakest of the rendered blocks
// AND the verdict — so a live-data document built on a representative verdict is
// honestly a representative document. Used by the IC memo, the asset one-pager,
// and (verdict omitted) the property intelligence report, so the three cannot
// drift apart.
export function appendixWithVerdict(
  data: DocumentData,
  opts?: {
    dropDemographicsIfNotLive?: boolean;
    demoLive?: boolean;
    verdict?: { provenance: Provenance; generatedAt: string };
  },
): ProvenanceAppendix {
  const dropDemo = !!opts?.dropDemographicsIfNotLive && opts?.demoLive === false;
  const blocks: Partial<Record<BlockKey, SiteDetailBlock<unknown>>> = {};
  for (const key of Object.keys(data.blocks) as BlockKey[]) {
    if (key === 'demographics' && dropDemo) continue;
    const blk = data.blocks[key];
    if (blk) blocks[key] = blk;
  }
  const blockOverall: Provenance = weakestProvenance(
    Object.values(blocks).filter((b): b is SiteDetailBlock<unknown> => !!b),
  );
  const base = buildProvenanceAppendix({ ...data, blocks, overall_provenance: blockOverall });

  // No verdict → the plain block-only appendix (property intelligence report).
  if (!opts?.verdict) return base;

  const rows: ProvenanceAppendixRow[] = [
    ...base.rows,
    {
      block: 'KOANO verdict',
      source: 'KOANO synthesis engine (confidence-weighted v1)',
      provenance: opts.verdict.provenance,
      fetched_at: opts.verdict.generatedAt,
    },
  ];
  const overall: Provenance = weakestProvenance([
    { provenance: blockOverall },
    { provenance: opts.verdict.provenance },
  ]);
  const overall_note =
    overall === 'live'
      ? 'Every rendered figure AND the underlying KOANO verdict were derived from live, authoritative public data at generation time.'
      : `This document is NOT fully live. ${
          !isTrustedProvenance(opts.verdict.provenance)
            ? `The underlying KOANO verdict is ${PROVENANCE_LABEL[opts.verdict.provenance]} (see below). `
            : ''
        }${
          !isTrustedProvenance(blockOverall)
            ? `One or more rendered figures are ${PROVENANCE_LABEL[blockOverall]}. `
            : ''
        }Each is labeled below.`;
  return { overall, overall_note, rows };
}
