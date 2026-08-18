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

// A prominent decision headline (pyramid style — the conclusion, not a title).
export interface RenderVerdict {
  decision: string; // ADVANCE | HOLD | PASS
  tone: 'positive' | 'warning' | 'negative';
  confidence: number; // 0–100
  rationale: string; // one line
}

// A compact horizontal band of label/value pairs (e.g. site identity).
export interface RenderBand {
  items: { label: string; value: string }[];
}

// Prominent side-by-side figures — a headline number, NOT a table row. Used for
// the base-vs-affordable FAR contrast (the most consequential City of Yes
// figure). One figure may be flagged `emphasis` to carry the delta.
export interface RenderHighlight {
  figures: { label: string; value: string; sub?: string; emphasis?: boolean }[];
}

// One body section. A section carries at most one primary block: paragraphs, a
// table, a verdict headline, an identity band, or highlight figures. `heading`
// is optional (the verdict headline has none). `trimNote` renders a VISIBLE
// "showing X of Y …" line whenever rows were cut to fit the page ceiling —
// content loss is never silent.
export interface RenderSection {
  heading?: string;
  paragraphs?: string[];
  table?: RenderTable;
  verdict?: RenderVerdict;
  band?: RenderBand;
  highlight?: RenderHighlight;
  trimNote?: string;
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
  // Dense documents (e.g. the 2-page site screening memo) set compact to tighten
  // spacing and type. Default (airy) is used by single-figure documents.
  compact?: boolean;
}
