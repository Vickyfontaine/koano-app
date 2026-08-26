// KOANO document engine — PDF renderer (@react-pdf/renderer, pure JS).
// Consumes a format-agnostic RenderModel and produces a PDF buffer. The
// disclaimer footer (fixed on EVERY page) and the provenance appendix are added
// here structurally — a document type supplies only body sections and therefore
// cannot omit either. Runs in the Node runtime only (the route sets
// runtime='nodejs'); never on Edge.
//
// Styles come from makeStyles(compact) and are threaded via props (no module
// state), so a single render is one density — dense docs (the 2-page screening
// memo) pass compact:true to tighten spacing and type.

import React from 'react';
import {
  Document,
  Page,
  View,
  Text,
  StyleSheet,
  renderToBuffer,
} from '@react-pdf/renderer';
import { PDF_FONT_FAMILY, PDF_FONT_FAMILY_BOLD, registerPdfFonts } from './fonts';
import { DOCUMENT_DISCLAIMER } from '../disclaimer';
import type { RenderModel, RenderSection, RenderTable } from './model';
import type { Provenance } from '../../providers/types';
import { isTrustedProvenance } from '../../providers/provenance';
import type { Letterhead } from '../types';

// Coastal-Intelligence palette (subset used in print).
const INK = '#0D2B3E';
const INK_SECONDARY = '#3D5A6E';
const INK_MUTED = '#5A7A8C';
const INK_FAINT = '#8AABB8';
const BORDER = '#D6EBF7';
const BRAND = '#5A9BBE';

const TONE_COLOR: Record<'positive' | 'warning' | 'negative', string> = {
  positive: '#22C55E',
  warning: '#F59E0B',
  negative: '#EF4444',
};

// pick(compact, airyValue, compactValue)
function makeStyles(compact: boolean) {
  const p = <A, C>(airy: A, dense: C) => (compact ? dense : airy);
  return StyleSheet.create({
    page: {
      fontFamily: PDF_FONT_FAMILY,
      fontSize: p(10, 9),
      color: INK,
      paddingTop: p(54, 40),
      paddingHorizontal: p(48, 44),
      paddingBottom: p(64, 54), // room for the fixed footer
      // NOTE: never set a page-level lineHeight with a render-prop fixed footer —
      // it silently drops the footer (and the mandatory disclaimer). lineHeight
      // lives on the body text styles below.
    },
    letterhead: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-end',
      borderBottomWidth: 1,
      borderBottomColor: BORDER,
      paddingBottom: p(10, 6),
      marginBottom: p(20, 10),
    },
    letterheadName: { fontFamily: PDF_FONT_FAMILY_BOLD, fontSize: 12, color: INK },
    letterheadLine: { fontSize: 9, color: INK_MUTED },
    brandMark: { fontFamily: PDF_FONT_FAMILY_BOLD, fontSize: 11, color: BRAND, letterSpacing: 1 },
    docTitle: { fontFamily: PDF_FONT_FAMILY_BOLD, fontSize: p(22, 16), color: INK, marginBottom: p(4, 2) },
    subtitle: { fontSize: p(11, 9.5), color: INK_SECONDARY, marginBottom: p(18, 8), lineHeight: 1.4 },
    section: { marginBottom: p(12, 7) },
    heading: {
      fontFamily: PDF_FONT_FAMILY_BOLD,
      fontSize: p(13, 11),
      color: INK,
      marginBottom: p(5, 3),
      borderBottomWidth: 0.5,
      borderBottomColor: BORDER,
      paddingBottom: 2,
    },
    paragraph: { fontSize: p(10, 9), color: INK_SECONDARY, marginBottom: p(5, 3), lineHeight: p(1.5, 1.35) },
    provNote: { fontSize: 8.5, marginBottom: p(6, 4), padding: 5, borderRadius: 3 },
    // table
    tRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: BORDER },
    tHeadRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: INK_FAINT },
    tCell: { flex: 1, fontSize: p(9, 8.5), color: INK_SECONDARY, paddingVertical: p(3, 1.5), paddingRight: 6 },
    tHeadCell: { flex: 1, fontSize: 8.5, fontFamily: PDF_FONT_FAMILY_BOLD, color: INK, paddingVertical: p(3, 1.5), paddingRight: 6 },
    caption: { fontSize: 8, color: INK_FAINT, marginTop: 3 },
    // appendix
    appRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: BORDER, paddingVertical: p(3, 1.5) },
    appBlock: { flex: 1.2, fontSize: p(8.5, 8), color: INK },
    appSource: { flex: 2, fontSize: p(8.5, 8), color: INK_MUTED },
    appProv: { flex: 0.8, fontSize: p(8.5, 8) },
    appNote: { fontSize: 8.5, color: INK_SECONDARY, marginTop: p(8, 4), marginBottom: p(4, 2), lineHeight: 1.4 },
    provCompact: { fontSize: 8, color: INK_MUTED, lineHeight: 1.5 },
    swapNote: { fontSize: 7.5, color: INK_FAINT, marginTop: 1 },
    // footer (fixed on every page)
    footer: {
      position: 'absolute',
      bottom: 24,
      left: p(48, 44),
      right: p(48, 44),
      borderTopWidth: 0.5,
      borderTopColor: BORDER,
      paddingTop: 6,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    disclaimer: { flex: 1, fontSize: 7, color: INK_MUTED, paddingRight: 12 },
    pageNo: { fontSize: 7, color: INK_FAINT },
    // verdict headline (pyramid — the conclusion, not a title)
    verdictWord: { fontFamily: PDF_FONT_FAMILY_BOLD, fontSize: p(26, 21), letterSpacing: 1 },
    verdictMeta: { fontSize: 10, color: INK_MUTED, marginTop: 2 },
    verdictRationale: { fontSize: p(12, 11), color: INK_SECONDARY, marginTop: 5, marginBottom: 4 },
    // compact identity band
    band: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      borderWidth: 0.5,
      borderColor: BORDER,
      borderRadius: 4,
      paddingVertical: p(6, 4),
      paddingHorizontal: 8,
      marginBottom: 4,
    },
    bandItem: { marginRight: 18, marginVertical: 2 },
    bandLabel: { fontSize: 7, color: INK_FAINT, textTransform: 'uppercase', letterSpacing: 0.5 },
    bandValue: { fontSize: 10, color: INK, fontFamily: PDF_FONT_FAMILY_BOLD },
    // highlight figures (base vs affordable FAR — a headline, not a table row)
    hlRow: { flexDirection: 'row', gap: 10, marginVertical: 4 },
    hlFigure: { flex: 1, borderWidth: 0.5, borderColor: BORDER, borderRadius: 6, padding: p(10, 8) },
    hlFigureEmph: { backgroundColor: '#F0F7FC', borderColor: BRAND },
    hlLabel: { fontSize: 8, color: INK_MUTED, textTransform: 'uppercase', letterSpacing: 0.5 },
    hlValue: { fontFamily: PDF_FONT_FAMILY_BOLD, fontSize: p(17, 15), color: INK, marginTop: 3 },
    hlSub: { fontSize: 8.5, color: INK_MUTED, marginTop: 2 },
    trimNote: { fontSize: 8, color: INK_FAINT, fontStyle: 'italic', marginTop: 3 },
    // ---- long-form (IC memo) ----
    titlePage: { flexDirection: 'column' },
    titleSpacerTop: { marginTop: 90 },
    titleDoc: { fontFamily: PDF_FONT_FAMILY_BOLD, fontSize: 30, color: INK, marginBottom: 6, lineHeight: 1.15 },
    titleSub: { fontSize: 13, color: INK_SECONDARY, marginBottom: 26 },
    titleBanner: { borderWidth: 0.5, borderColor: BORDER, borderRadius: 6, padding: 16, marginBottom: 22 },
    titleBannerLabel: { fontSize: 8, color: INK_MUTED, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
    titleBannerWord: { fontFamily: PDF_FONT_FAMILY_BOLD, fontSize: 24, letterSpacing: 1 },
    titleBannerConf: { fontSize: 10, color: INK_MUTED, marginTop: 3 },
    titleDates: { marginBottom: 8 },
    titleDateLine: { fontSize: 10, color: INK_SECONDARY, marginBottom: 2 },
    staleBanner: {
      borderWidth: 0.5,
      borderColor: '#F59E0B',
      backgroundColor: '#FFFBEB',
      borderRadius: 5,
      padding: 10,
      marginBottom: 16,
      fontSize: 9.5,
      color: '#B45309',
      lineHeight: 1.4,
    },
    docProvRep: {
      borderWidth: 0.5,
      borderColor: '#F59E0B',
      backgroundColor: '#FFFBEB',
      borderRadius: 5,
      padding: 10,
      marginTop: 14,
      marginBottom: 4,
      fontSize: 9.5,
      color: '#B45309',
      letterSpacing: 0.3,
    },
    docProvLive: { fontSize: 9, color: INK_MUTED, marginTop: 14, marginBottom: 4, letterSpacing: 0.3 },
    titleConfidential: { fontSize: 8, color: INK_FAINT, marginTop: 24, letterSpacing: 0.5, textTransform: 'uppercase' },
    tocTitle: { fontFamily: PDF_FONT_FAMILY_BOLD, fontSize: 16, color: INK, marginBottom: 14, borderBottomWidth: 0.5, borderBottomColor: BORDER, paddingBottom: 4 },
    tocRow: { flexDirection: 'row', alignItems: 'flex-end', borderBottomWidth: 0.5, borderBottomColor: BORDER, paddingVertical: 5 },
    tocNum: { width: 34, fontSize: 10, color: INK_MUTED, fontFamily: PDF_FONT_FAMILY_BOLD },
    tocLabel: { flex: 1, fontSize: 10.5, color: INK, paddingRight: 8 },
    tocPage: { fontSize: 10, color: INK_MUTED },
    numberedHeading: {
      fontFamily: PDF_FONT_FAMILY_BOLD,
      fontSize: 14,
      color: INK,
      marginBottom: 6,
      borderBottomWidth: 0.5,
      borderBottomColor: BORDER,
      paddingBottom: 3,
    },
    placeholderBox: {
      borderWidth: 0.5,
      borderColor: INK_FAINT,
      borderStyle: 'dashed',
      borderRadius: 5,
      padding: 12,
      marginTop: 4,
    },
    placeholderTag: { fontSize: 8, color: INK_MUTED, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 5 },
    placeholderNote: { fontSize: 10, color: INK_SECONDARY, fontStyle: 'italic', lineHeight: 1.4 },
    captureMarker: { fontSize: 1, height: 1, color: '#FFFFFF' },
  });
}

type Styles = ReturnType<typeof makeStyles>;

// The built-in PDF fonts (Helvetica) use WinAnsi encoding, which lacks common
// typographic/math glyphs — an unmapped char renders as garbage (≥ became "e",
// → became "'") with NO error. Map the known offenders to ASCII for the PDF
// path only; DOCX keeps the rich Unicode (Word has the glyphs). Applied to every
// string in the model via a JSON round-trip so nothing can slip through.
const PDF_GLYPH_MAP: Record<string, string> = {
  '≥': '>=',
  '≤': '<=',
  '→': '->',
  '←': '<-',
  '⇒': '=>',
  '⇐': '<=',
  '↑': 'up',
  '↓': 'down',
  '−': '-', // U+2212 minus
  '≈': '~',
  '≠': '!=',
};
function sanitizePdfText(s: string): string {
  return s.replace(/[≥≤→←⇒⇐↑↓−≈≠]/g, (c) => PDF_GLYPH_MAP[c] ?? c);
}
function sanitizeModelForPdf(model: RenderModel): RenderModel {
  return JSON.parse(
    JSON.stringify(model, (_k, v) => (typeof v === 'string' ? sanitizePdfText(v) : v)),
  ) as RenderModel;
}

function provColor(p: Provenance): string {
  switch (p) {
    case 'live':
      return '#22C55E';
    case 'partner':
      return '#5A9BBE';
    case 'representative':
    case 'fetch_failed':
      return '#F59E0B';
    case 'coverage_absent':
      return '#8AABB8';
  }
}

function LetterheadBlock({ lh, s }: { lh: Letterhead; s: Styles }) {
  const lines = [
    lh.company_name,
    lh.license_number ? `License ${lh.license_number}` : null,
    [lh.phone, lh.contact_email].filter(Boolean).join('  ·  ') || null,
  ].filter(Boolean) as string[];
  // Left = the PREPARER's identity; right = the KOANO brand mark (once). When
  // there is no preparer identity, the left is left blank — never a second
  // "KOANO", which duplicated the wordmark.
  return (
    <View style={s.letterhead}>
      <View>
        {lh.full_name ? <Text style={s.letterheadName}>{lh.full_name}</Text> : null}
        {lines.map((l, i) => (
          <Text key={i} style={s.letterheadLine}>{l}</Text>
        ))}
      </View>
      <Text style={s.brandMark}>KOANO</Text>
    </View>
  );
}

function Table({ table, s }: { table: RenderTable; s: Styles }) {
  return (
    <View>
      <View style={s.tHeadRow}>
        {table.columns.map((c, i) => (
          <Text key={i} style={s.tHeadCell}>{c}</Text>
        ))}
      </View>
      {table.rows.map((row, ri) => (
        <View key={ri} style={s.tRow} wrap={false}>
          {row.map((cell, ci) => (
            <Text key={ci} style={s.tCell}>{cell}</Text>
          ))}
        </View>
      ))}
      {table.caption ? <Text style={s.caption}>{table.caption}</Text> : null}
    </View>
  );
}

function VerdictHeadline({ v, s }: { v: NonNullable<RenderSection['verdict']>; s: Styles }) {
  return (
    <View wrap={false}>
      <Text style={{ ...s.verdictWord, color: TONE_COLOR[v.tone] }}>{v.decision}</Text>
      <Text style={s.verdictMeta}>Confidence {v.confidence} / 100</Text>
      <Text style={s.verdictRationale}>{v.rationale}</Text>
    </View>
  );
}

function IdentityBand({ band, s }: { band: NonNullable<RenderSection['band']>; s: Styles }) {
  return (
    <View style={s.band} wrap={false}>
      {band.items.map((it, i) => (
        <View key={i} style={s.bandItem}>
          <Text style={s.bandLabel}>{it.label}</Text>
          <Text style={s.bandValue}>{it.value}</Text>
        </View>
      ))}
    </View>
  );
}

function HighlightFigures({ highlight, s }: { highlight: NonNullable<RenderSection['highlight']>; s: Styles }) {
  return (
    <View style={s.hlRow} wrap={false}>
      {highlight.figures.map((f, i) => (
        <View key={i} style={f.emphasis ? { ...s.hlFigure, ...s.hlFigureEmph } : s.hlFigure}>
          <Text style={s.hlLabel}>{f.label}</Text>
          <Text style={{ ...s.hlValue, ...(f.emphasis ? { color: BRAND } : {}) }}>{f.value}</Text>
          {f.sub ? <Text style={s.hlSub}>{f.sub}</Text> : null}
        </View>
      ))}
    </View>
  );
}

// A zero-height marker whose render callback records the page it lands on. Used
// by the two-pass long-form TOC: pass 1 fills the sink, pass 2 prints those
// numbers in the TOC and refills a second sink, and renderPdfAudited asserts the
// two agree — so a TOC entry can never silently point at the wrong page.
function PageCapture({ id, sink, s }: { id: string; sink: Record<string, number>; s: Styles }) {
  return (
    <Text
      style={s.captureMarker}
      render={({ pageNumber }) => {
        sink[id] = pageNumber;
        return '';
      }}
    />
  );
}

function PlaceholderBlock({ note, s }: { note: string; s: Styles }) {
  return (
    <View style={s.placeholderBox} wrap={false}>
      <Text style={s.placeholderTag}>To be completed by the analyst</Text>
      <Text style={s.placeholderNote}>{note}</Text>
    </View>
  );
}

function Section({ section, s, sink }: { section: RenderSection; s: Styles; sink?: Record<string, number> }) {
  // keepTogether → the whole section moves to the next page rather than
  // splitting mid-table (e.g. the DD register orphaning its first row).
  // IMPORTANT: only ever pass `wrap` when keeping together. Passing
  // wrap={undefined} is coerced to wrap={false} by @react-pdf, which disables
  // pagination for that section and DROPS the fixed footer on continuation
  // pages (the multi-page stress test catches this).
  const headingText = section.number ? `${section.number}.  ${section.heading}` : section.heading;
  const headingStyle = section.number ? s.numberedHeading : s.heading;
  return (
    <View
      style={s.section}
      {...(section.keepTogether ? { wrap: false } : {})}
      {...(section.pageBreakBefore ? { break: true } : {})}
    >
      {section.number && sink ? <PageCapture id={section.number} sink={sink} s={s} /> : null}
      {section.verdict ? <VerdictHeadline v={section.verdict} s={s} /> : null}
      {section.heading ? (
        <Text style={headingStyle} minPresenceAhead={40} {...(section.number ? { bookmark: { title: headingText as string, fit: true } } : {})}>{headingText}</Text>
      ) : null}
      {section.placeholder ? <PlaceholderBlock note={section.placeholder.note} s={s} /> : null}
      {section.provenanceNote ? (
        <Text
          style={{
            ...s.provNote,
            backgroundColor: section.provenanceNote.provenance === 'live' ? '#F0FDF4' : '#FFFBEB',
            color: provColor(section.provenanceNote.provenance),
          }}
        >
          {section.provenanceNote.text}
        </Text>
      ) : null}
      {section.band ? <IdentityBand band={section.band} s={s} /> : null}
      {section.highlight ? <HighlightFigures highlight={section.highlight} s={s} /> : null}
      {(section.paragraphs ?? []).map((para, i) => (
        <Text key={i} style={s.paragraph}>{para}</Text>
      ))}
      {section.table ? <Table table={section.table} s={s} /> : null}
      {section.trimNote ? <Text style={s.trimNote}>{section.trimNote}</Text> : null}
    </View>
  );
}

function ProvenanceAppendixSection({ model, s }: { model: RenderModel; s: Styles }) {
  const a = model.appendix;

  // Condensed appendix (one-pager): the mandatory appendix stays fully present
  // — every source + the verdict + the overall rollup — but as a compact inline
  // list rather than a table, so a strictly-one-page document never has to trim
  // content to make room for it.
  if (model.compactProvenance) {
    return (
      <View style={s.section} wrap={false}>
        <Text style={s.heading}>Sources & Provenance</Text>
        <Text style={s.appNote}>{a.overall_note}</Text>
        <Text style={s.provCompact}>
          {a.rows.map((r, i) => (
            <Text key={i}>
              {i > 0 ? '   ·   ' : ''}
              <Text>{r.block} </Text>
              <Text style={{ color: provColor(r.provenance) }}>({r.provenance})</Text>
            </Text>
          ))}
        </Text>
      </View>
    );
  }

  return (
    <View style={s.section}>
      <Text style={s.heading}>Sources & Provenance</Text>
      <Text style={s.appNote}>{a.overall_note}</Text>
      <View style={s.tHeadRow}>
        <Text style={{ ...s.tHeadCell, flex: 1.2 }}>Data</Text>
        <Text style={{ ...s.tHeadCell, flex: 2 }}>Source</Text>
        <Text style={{ ...s.tHeadCell, flex: 0.8 }}>Provenance</Text>
      </View>
      {a.rows.map((r, i) => (
        <View key={i} style={s.appRow} wrap={false}>
          <Text style={s.appBlock}>{r.block}</Text>
          <View style={s.appSource}>
            <Text>{r.source}</Text>
            {r.swap_note ? <Text style={s.swapNote}>{r.swap_note}</Text> : null}
            {r.fallback_note ? <Text style={s.swapNote}>{r.fallback_note}</Text> : null}
          </View>
          <Text style={{ ...s.appProv, color: provColor(r.provenance) }}>{r.provenance}</Text>
        </View>
      ))}
    </View>
  );
}

// ---- long-form (IC memo) title page + TOC ----

function TitlePage({ model, s }: { model: RenderModel; s: Styles }) {
  const memoDate = new Date(model.generatedAt).toISOString().slice(0, 10);
  const vDate = model.verdictGeneratedAt ? new Date(model.verdictGeneratedAt).toISOString().slice(0, 10) : null;
  const banner = model.titleBanner;
  return (
    <View style={s.titlePage}>
      <LetterheadBlock lh={model.letterhead} s={s} />
      <View style={s.titleSpacerTop}>
        <Text style={s.titleDoc}>{model.docTitle}</Text>
        {model.subtitle ? <Text style={s.titleSub}>{model.subtitle}</Text> : null}
        {banner ? (
          <View style={s.titleBanner}>
            <Text style={s.titleBannerLabel}>KOANO recommendation</Text>
            <Text style={{ ...s.titleBannerWord, color: TONE_COLOR[banner.tone] }}>{banner.decision}</Text>
            <Text style={s.titleBannerConf}>Confidence {banner.confidence} / 100</Text>
          </View>
        ) : null}
        <View style={s.titleDates}>
          {vDate ? <Text style={s.titleDateLine}>Verdict generated: {vDate}</Text> : null}
          <Text style={s.titleDateLine}>Memo generated: {memoDate}</Text>
        </View>
        {model.stalenessBanner ? <Text style={s.staleBanner}>{model.stalenessBanner}</Text> : null}
        {model.documentProvenanceNote ? (
          <Text style={model.documentProvenance != null && !isTrustedProvenance(model.documentProvenance) ? s.docProvRep : s.docProvLive}>
            {model.documentProvenanceNote}
          </Text>
        ) : null}
        <Text style={s.titleConfidential}>Confidential: decision support, not a decision</Text>
      </View>
    </View>
  );
}

interface TocEntry {
  id: string;
  number: string;
  label: string;
}

function tocEntries(model: RenderModel): TocEntry[] {
  const entries: TocEntry[] = [];
  for (const sec of model.sections) {
    if (sec.number && sec.heading) entries.push({ id: sec.number, number: sec.number, label: sec.heading });
  }
  entries.push({ id: 'prov', number: '', label: 'Sources & Provenance' });
  return entries;
}

function TocPage({ model, tocMap, s }: { model: RenderModel; tocMap: Record<string, number> | null; s: Styles }) {
  return (
    <View break>
      <Text style={s.tocTitle}>Table of Contents</Text>
      {tocEntries(model).map((e) => (
        <View key={e.id} style={s.tocRow}>
          <Text style={s.tocNum}>{e.number}</Text>
          <Text style={s.tocLabel}>{e.label}</Text>
          <Text style={s.tocPage}>{tocMap && tocMap[e.id] ? String(tocMap[e.id]) : ''}</Text>
        </View>
      ))}
    </View>
  );
}

// The fixed footer: disclaimer verbatim on EVERY page + page numbers.
function Footer({ s }: { s: Styles }) {
  return (
    <View style={s.footer} fixed>
      <Text style={s.disclaimer}>{DOCUMENT_DISCLAIMER}</Text>
      <Text
        style={s.pageNo}
        render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
      />
    </View>
  );
}

function KoanoPdf({
  model,
  sink,
  tocMap,
}: {
  model: RenderModel;
  sink?: Record<string, number>;
  tocMap?: Record<string, number> | null;
}) {
  const s = makeStyles(!!model.compact);
  const generated = new Date(model.generatedAt).toISOString().slice(0, 10);

  if (model.longForm) {
    return (
      <Document title={model.docTitle} author="KOANO">
        <Page size="A4" style={s.page}>
          <TitlePage model={model} s={s} />
          <TocPage model={model} tocMap={tocMap ?? null} s={s} />
          {model.sections.map((section, i) => (
            <Section key={i} section={section} s={s} sink={sink} />
          ))}
          <View break style={s.section}>
            {sink ? <PageCapture id="prov" sink={sink} s={s} /> : null}
            <ProvenanceAppendixSection model={model} s={s} />
          </View>
          <Footer s={s} />
        </Page>
      </Document>
    );
  }

  return (
    <Document title={model.docTitle} author="KOANO">
      <Page size="A4" style={s.page}>
        <LetterheadBlock lh={model.letterhead} s={s} />
        <Text style={s.docTitle}>{model.docTitle}</Text>
        {model.subtitle ? (
          <Text style={s.subtitle}>{model.subtitle}  ·  Generated {generated}</Text>
        ) : (
          <Text style={s.subtitle}>Generated {generated}</Text>
        )}
        {model.sections.map((section, i) => (
          <Section key={i} section={section} s={s} />
        ))}
        <ProvenanceAppendixSection model={model} s={s} />
        <Footer s={s} />
      </Page>
    </Document>
  );
}

// The two-pass TOC page-map audit. `claimed` is what the TOC printed (pass-1
// page map); `actual` is where each numbered section really landed in the final
// render (pass-2 page map). They MUST agree — a divergence means a TOC entry
// silently points at the wrong page (the same silent-failure class as a dropped
// disclaimer), so we throw loudly rather than ship it.
export function auditTocPages(claimed: Record<string, number>, actual: Record<string, number>): void {
  const mismatches: string[] = [];
  for (const id of Object.keys(actual)) {
    if (claimed[id] !== actual[id]) {
      mismatches.push(`"${id}": TOC says p${claimed[id] ?? '—'} but section starts on p${actual[id]}`);
    }
  }
  // Also catch a section that never got a claimed page at all.
  for (const id of Object.keys(actual)) {
    if (!(id in claimed)) mismatches.push(`"${id}": missing from the TOC page map`);
  }
  if (mismatches.length > 0) {
    throw new Error(`Long-form TOC page-map audit FAILED — ${mismatches.join('; ')}`);
  }
}

// Long-form render + audit, exposed for the harness. Renders twice: pass 1 fills
// the page map, pass 2 prints it in the TOC and captures the actual pages, then
// audits. Returns the final buffer plus both maps.
export async function renderPdfAudited(
  model: RenderModel,
): Promise<{ buffer: Buffer; tocPageMap: Record<string, number>; actualPageMap: Record<string, number> }> {
  registerPdfFonts();
  const safe = sanitizeModelForPdf(model);
  const tocPageMap: Record<string, number> = {};
  await renderToBuffer(<KoanoPdf model={safe} sink={tocPageMap} tocMap={null} />);
  const actualPageMap: Record<string, number> = {};
  const buffer = await renderToBuffer(<KoanoPdf model={safe} sink={actualPageMap} tocMap={tocPageMap} />);
  auditTocPages(tocPageMap, actualPageMap);
  return { buffer, tocPageMap, actualPageMap };
}

// Render a RenderModel to a PDF buffer. Node runtime only. Long-form documents
// go through the two-pass audited path; everything else renders single-pass
// exactly as before.
export async function renderPdf(model: RenderModel): Promise<Buffer> {
  registerPdfFonts();
  if (model.longForm) return (await renderPdfAudited(model)).buffer;
  return renderToBuffer(<KoanoPdf model={sanitizeModelForPdf(model)} />);
}
