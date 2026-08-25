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
import type { DocumentData } from './types';

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
    // A normally-live block that errored fell back to representative: label it
    // as such rather than hiding the transient failure (Principle 2).
    const fellBack = block.provenance === 'representative' && !!block.error;
    rows.push({
      block: BLOCK_LABELS[key],
      source: block.source,
      provenance: block.provenance,
      fetched_at: block.fetched_at,
      ...(block.swap_note ? { swap_note: block.swap_note } : {}),
      ...(fellBack
        ? { fallback_note: 'Live source was unavailable this request; a representative value was used.' }
        : {}),
    });
  }

  const provenanceNote =
    data.overall_provenance === 'live'
      ? 'Every figure in this document was fetched live from an authoritative public source at generation time.'
      : 'This document contains one or more representative figures (labeled below). It is not fully live: any figure marked representative is a plausible stand-in for a paid data source that is not yet integrated.';

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
  const blockOverall: Provenance = Object.values(blocks).some((b) => b && b.provenance === 'representative')
    ? 'representative'
    : 'live';
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
  const overall: Provenance =
    blockOverall === 'representative' || opts.verdict.provenance === 'representative' ? 'representative' : 'live';
  const overall_note =
    overall === 'live'
      ? 'Every rendered figure AND the underlying KOANO verdict were derived from live, authoritative public data at generation time.'
      : `This document is NOT fully live. ${
          opts.verdict.provenance === 'representative'
            ? 'The underlying KOANO verdict drew on one or more representative agent inputs (a plausible stand-in for a paid source not yet integrated). '
            : ''
        }${
          blockOverall === 'representative' ? 'One or more rendered figures are representative. ' : ''
        }Any representative input is labeled below.`;
  return { overall, overall_note, rows };
}
