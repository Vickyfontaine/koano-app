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
  });
}

type Styles = ReturnType<typeof makeStyles>;

function provColor(p: 'live' | 'representative'): string {
  return p === 'live' ? '#22C55E' : '#F59E0B';
}

function LetterheadBlock({ lh, s }: { lh: Letterhead; s: Styles }) {
  const lines = [
    lh.company_name,
    lh.license_number ? `License ${lh.license_number}` : null,
    [lh.phone, lh.contact_email].filter(Boolean).join('  ·  ') || null,
  ].filter(Boolean) as string[];
  const hasIdentity = !!(lh.full_name || lines.length);
  return (
    <View style={s.letterhead}>
      <View>
        {lh.full_name ? <Text style={s.letterheadName}>{lh.full_name}</Text> : null}
        {lines.map((l, i) => (
          <Text key={i} style={s.letterheadLine}>{l}</Text>
        ))}
        {!hasIdentity ? <Text style={s.letterheadLine}>Prepared with KOANO</Text> : null}
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

function Section({ section, s }: { section: RenderSection; s: Styles }) {
  return (
    <View style={s.section}>
      {section.verdict ? <VerdictHeadline v={section.verdict} s={s} /> : null}
      {section.heading ? (
        <Text style={s.heading} minPresenceAhead={40}>{section.heading}</Text>
      ) : null}
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

function KoanoPdf({ model }: { model: RenderModel }) {
  const s = makeStyles(!!model.compact);
  const generated = new Date(model.generatedAt).toISOString().slice(0, 10);
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

// Render a RenderModel to a PDF buffer. Node runtime only.
export async function renderPdf(model: RenderModel): Promise<Buffer> {
  registerPdfFonts();
  return renderToBuffer(<KoanoPdf model={model} />);
}
