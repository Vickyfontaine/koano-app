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
  // When true, the section is kept on a single page (wrap=false) rather than
  // splitting mid-table across a page break — used for the DD gap register.
  keepTogether?: boolean;
  // Optional inline provenance callout under the heading (e.g. a representative
  // figure the reader must not treat as live).
  provenanceNote?: { provenance: Provenance; text: string };
  // ---- long-form (IC memo) fields; ignored unless RenderModel.longForm ----
  // Section number printed before the heading and used as the TOC label
  // (e.g. "1", "6", "A" for exhibits). Sections with a `number` are the ones
  // the TOC lists and the two-pass page-map audits.
  number?: string;
  // A formatted, clearly-labeled empty section the reader completes. `note` is
  // the one-line "what belongs here" guidance. Renders as a bordered callout,
  // never as fabricated content.
  placeholder?: { note: string };
  // Force a page break before this section (front matter → body → exhibits).
  pageBreakBefore?: boolean;
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
  // ---- long-form document mode (the IC memo) ----
  // Turns on: a dedicated title page, a Table of Contents (PDF two-pass with a
  // page-map audit; DOCX native field with updateFields), numbered sections,
  // placeholder callouts, and part page-breaks. When false/absent, rendering is
  // byte-identical to before (every existing document type stays unchanged).
  longForm?: boolean;
  // Title-page recommendation banner (the stored verdict, shown up front).
  titleBanner?: { decision: string; tone: 'positive' | 'warning' | 'negative'; confidence: number };
  // The stored verdict's OWN generation timestamp (ISO), distinct from
  // generatedAt (when this memo was produced). Shown on the title page and
  // executive summary so a committee sees how old the underlying analysis is.
  verdictGeneratedAt?: string;
  // A visible staleness warning when the verdict predates the memo by more than
  // the threshold. Supplied by the builder (which owns the day math); the
  // renderer just paints it prominently on the title page.
  stalenessBanner?: string | null;
  // Document-level provenance stated at the TOP (title page). This is the
  // weakest of the rendered figures AND the underlying verdict — so a live-data
  // memo built on a representative verdict is honestly a representative document.
  documentProvenance?: Provenance;
  documentProvenanceNote?: string;
  // Render the provenance appendix as a condensed inline block (overall note +
  // a single wrapped "source (provenance)" list) instead of a full table. Used
  // by the strictly-one-page asset one-pager so the mandatory appendix fits
  // without ever trimming content. The appendix is still fully present.
  compactProvenance?: boolean;
}
