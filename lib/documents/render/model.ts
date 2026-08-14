// KOANO document engine — the format-agnostic render model.
// A document type's builder produces a RenderModel; both the PDF and DOCX
// renderers consume it. The disclaimer footer and the provenance appendix are
// NOT fields a builder supplies — the renderers add them structurally from
// DOCUMENT_DISCLAIMER and the ProvenanceAppendix, so no document type can omit
// them. A builder only supplies the body sections.

import type { Letterhead } from '../types';
import type { ProvenanceAppendix } from '../disclaimer';
import type { Provenance } from '../../providers/types';

// A simple table; every cell is pre-formatted text. Optionally, a cell's
// provenance can be surfaced inline (renderers may badge non-live rows).
export interface RenderTable {
  columns: string[];
  rows: string[][];
  caption?: string;
}

// One body section. Deterministic sections carry paragraphs and/or a table;
// narrative sections carry paragraphs (the model's prose). A per-figure source
// note keeps provenance visible next to the number.
export interface RenderSection {
  heading: string;
  paragraphs?: string[];
  table?: RenderTable;
  // Optional inline provenance callout under the heading (e.g. a representative
  // figure the reader must not treat as live).
  provenanceNote?: { provenance: Provenance; text: string };
}

export interface RenderModel {
  docTitle: string;
  subtitle?: string; // usually the subject address
  letterhead: Letterhead;
  sections: RenderSection[];
  appendix: ProvenanceAppendix; // appended structurally as the final section
  generatedAt: string; // ISO timestamp, stamped by the caller
}
