// KOANO document engine — core types.
// The registry entry is DATA, not logic: it declares who may generate a
// document, what data it needs, how it renders, and whether it may ship yet.
// One engine reads these entries to serve all document types.

import type { BlockKey, SiteDetailBlock } from '../providers/blocks';
import type { Provenance } from '../providers/types';

// The four PAID tiers, ordered low → high by price. Free is intentionally NOT
// in the ladder: free users generate no documents (the free preview is the
// three analyses + reasoning chains, not a deliverable).
export const TIER_LADDER = ['community', 'transaction', 'development', 'portfolio'] as const;
export type Tier = (typeof TIER_LADDER)[number];

// Which dashboard/cluster a document lives in. Maps 1:1 to a home tier.
export type ClusterId = 'cluster_1' | 'cluster_2' | 'cluster_4' | 'cluster_5';

export type DocumentFormat = 'pdf' | 'docx';

// A by-design representative provider a document depends on. While the provider
// is representative, the document is `blocked` and must not ship. Keyed by the
// provider's registry key — flipping to live is the same one-line swap.
// (premiumHazard was removed here in Phase 1: hazard is now live federal data, so
// no document is blocked on it anymore.)
export type BlockedOnProvider = 'proformaBenchmark';

export type DocumentStatus = 'available' | 'blocked';

// Sections split into deterministic (template-filled, zero model tokens) and
// narrative (exactly the prose that justifies a single model call). The
// renderer consumes these; the assembler ignores them.
export type SectionKind = 'deterministic' | 'narrative';

export interface DocumentSection {
  id: string;
  title: string;
  kind: SectionKind;
}

// One declarative registry entry.
export interface DocumentType {
  id: string; // stable key, e.g. 'tax_appeal_packet'
  title: string; // human title printed on the document
  cluster: ClusterId;
  homeTier: Tier; // the tier this document belongs to; gate = homeTier and above
  scope: 'property' | 'multi_site' | 'portfolio';
  requiredBlocks: BlockKey[]; // keys from the shared provider-block layer
  formats: DocumentFormat[]; // 'pdf' universally; + 'docx' only for cma & ic_memo
  sections: DocumentSection[];
  status: DocumentStatus;
  blockedOn?: BlockedOnProvider; // present iff status === 'blocked'
}

// How the user asked the document to be built.
//   'verdict' — reuse a stored verdict's synthesis (0 content generations).
//   'fresh'   — one model call for a model-tailored narrative (1 content gen).
export type BuildSource = 'verdict' | 'fresh';

// The professional-identity block auto-filled from the user's profile
// (migration 005). Every field is nullable; a null field is simply omitted from
// the rendered letterhead, never printed blank.
export interface Letterhead {
  full_name: string | null;
  company_name: string | null;
  license_number: string | null;
  phone: string | null;
  contact_email: string | null;
  logo_url: string | null;
  headshot_url: string | null;
}

// The assembler's output: the raw provenance-tagged facts a renderer turns into
// a document. Every block keeps its full SiteDetailBlock envelope, so provenance
// rides all the way into the rendered figure and the provenance appendix.
export interface DocumentData {
  resolved_address: {
    input: string;
    normalized: string;
    bbl: string | null;
    borough: string | null;
    tract_geoid: string | null;
    // Coordinate confidence (distinct from provenance) — 'unconfirmed' rides into
    // the provenance appendix so a document never hides that its subject point
    // was resolved without a cross-check.
    location_confidence: 'confirmed' | 'unconfirmed';
  };
  blocks: Partial<Record<BlockKey, SiteDetailBlock<unknown>>>;
  overall_provenance: Provenance; // weakest across all fetched blocks
  assembled_at: string;
}
