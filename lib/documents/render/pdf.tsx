// KOANO document engine — PDF renderer (@react-pdf/renderer, pure JS).
// Consumes a format-agnostic RenderModel and produces a PDF buffer. The
// disclaimer footer (fixed on EVERY page) and the provenance appendix are added
// here structurally — a document type supplies only body sections and therefore
// cannot omit either. Runs in the Node runtime only (the route sets
// runtime='nodejs'); never on Edge.

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

const styles = StyleSheet.create({
  page: {
    fontFamily: PDF_FONT_FAMILY,
    fontSize: 10,
    color: INK,
    paddingTop: 54,
    paddingHorizontal: 48,
    paddingBottom: 64, // room for the fixed footer
    // NOTE: do NOT set lineHeight here. A page-level lineHeight combined with a
    // `fixed` footer that contains a `render`-prop (dynamic page-number) Text
    // makes @react-pdf silently DROP the entire fixed footer — which would
    // remove the mandatory disclaimer. lineHeight lives on the body text styles
    // below instead. (Verified: page lineHeight + render-prop footer = no footer.)
  },
  letterhead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingBottom: 10,
    marginBottom: 20,
  },
  letterheadName: { fontFamily: PDF_FONT_FAMILY_BOLD, fontSize: 12, color: INK },
  letterheadLine: { fontSize: 9, color: INK_MUTED },
  brandMark: { fontFamily: PDF_FONT_FAMILY_BOLD, fontSize: 11, color: BRAND, letterSpacing: 1 },
  docTitle: { fontFamily: PDF_FONT_FAMILY_BOLD, fontSize: 22, color: INK, marginBottom: 4 },
  subtitle: { fontSize: 11, color: INK_SECONDARY, marginBottom: 18, lineHeight: 1.4 },
  section: { marginBottom: 16 },
  heading: {
    fontFamily: PDF_FONT_FAMILY_BOLD,
    fontSize: 13,
    color: INK,
    marginBottom: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: BORDER,
    paddingBottom: 3,
  },
  paragraph: { fontSize: 10, color: INK_SECONDARY, marginBottom: 6, lineHeight: 1.5 },
  provNote: { fontSize: 8.5, marginBottom: 6, padding: 5, borderRadius: 3 },
  // table
  tRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: BORDER },
  tHeadRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: INK_FAINT },
  tCell: { flex: 1, fontSize: 9, color: INK_SECONDARY, paddingVertical: 3, paddingRight: 6 },
  tHeadCell: { flex: 1, fontSize: 8.5, fontFamily: PDF_FONT_FAMILY_BOLD, color: INK, paddingVertical: 3, paddingRight: 6 },
  caption: { fontSize: 8, color: INK_FAINT, marginTop: 3 },
  // appendix
  appRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: BORDER, paddingVertical: 3 },
  appBlock: { flex: 1.2, fontSize: 8.5, color: INK },
  appSource: { flex: 2, fontSize: 8.5, color: INK_MUTED },
  appProv: { flex: 0.8, fontSize: 8.5 },
  appNote: { fontSize: 8.5, color: INK_SECONDARY, marginTop: 8, marginBottom: 4, lineHeight: 1.4 },
  swapNote: { fontSize: 7.5, color: INK_FAINT, marginTop: 1 },
  // footer (fixed on every page)
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 48,
    right: 48,
    borderTopWidth: 0.5,
    borderTopColor: BORDER,
    paddingTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  disclaimer: { flex: 1, fontSize: 7, color: INK_MUTED, paddingRight: 12 },
  pageNo: { fontSize: 7, color: INK_FAINT },
});

function provColor(p: 'live' | 'representative'): string {
  return p === 'live' ? '#22C55E' : '#F59E0B';
}

function LetterheadBlock({ lh }: { lh: Letterhead }) {
  const lines = [
    lh.company_name,
    lh.license_number ? `License ${lh.license_number}` : null,
    [lh.phone, lh.contact_email].filter(Boolean).join('  ·  ') || null,
  ].filter(Boolean) as string[];
  const hasIdentity = !!(lh.full_name || lines.length);
  return (
    <View style={styles.letterhead}>
      <View>
        {lh.full_name ? <Text style={styles.letterheadName}>{lh.full_name}</Text> : null}
        {lines.map((l, i) => (
          <Text key={i} style={styles.letterheadLine}>{l}</Text>
        ))}
        {!hasIdentity ? <Text style={styles.letterheadLine}>Prepared with KOANO</Text> : null}
      </View>
      <Text style={styles.brandMark}>KOANO</Text>
    </View>
  );
}

function Table({ table }: { table: RenderTable }) {
  return (
    <View>
      <View style={styles.tHeadRow}>
        {table.columns.map((c, i) => (
          <Text key={i} style={styles.tHeadCell}>{c}</Text>
        ))}
      </View>
      {table.rows.map((row, ri) => (
        <View key={ri} style={styles.tRow} wrap={false}>
          {row.map((cell, ci) => (
            <Text key={ci} style={styles.tCell}>{cell}</Text>
          ))}
        </View>
      ))}
      {table.caption ? <Text style={styles.caption}>{table.caption}</Text> : null}
    </View>
  );
}

function Section({ section }: { section: RenderSection }) {
  // Sections may span pages (long tables/prose); only individual table rows are
  // kept unbroken (wrap={false} on each row). The heading uses minPresenceAhead
  // so it never orphans at the very bottom of a page.
  return (
    <View style={styles.section}>
      <Text style={styles.heading} minPresenceAhead={40}>{section.heading}</Text>
      {section.provenanceNote ? (
        <Text
          style={{
            ...styles.provNote,
            backgroundColor: section.provenanceNote.provenance === 'live' ? '#F0FDF4' : '#FFFBEB',
            color: provColor(section.provenanceNote.provenance),
          }}
        >
          {section.provenanceNote.text}
        </Text>
      ) : null}
      {(section.paragraphs ?? []).map((p, i) => (
        <Text key={i} style={styles.paragraph}>{p}</Text>
      ))}
      {section.table ? <Table table={section.table} /> : null}
    </View>
  );
}

function ProvenanceAppendixSection({ model }: { model: RenderModel }) {
  const a = model.appendix;
  return (
    <View style={styles.section}>
      <Text style={styles.heading}>Sources & Provenance</Text>
      <Text style={styles.appNote}>{a.overall_note}</Text>
      <View style={styles.tHeadRow}>
        <Text style={{ ...styles.tHeadCell, flex: 1.2 }}>Data</Text>
        <Text style={{ ...styles.tHeadCell, flex: 2 }}>Source</Text>
        <Text style={{ ...styles.tHeadCell, flex: 0.8 }}>Provenance</Text>
      </View>
      {a.rows.map((r, i) => (
        <View key={i} style={styles.appRow} wrap={false}>
          <Text style={styles.appBlock}>{r.block}</Text>
          <View style={styles.appSource}>
            <Text>{r.source}</Text>
            {r.swap_note ? <Text style={styles.swapNote}>{r.swap_note}</Text> : null}
            {r.fallback_note ? <Text style={styles.swapNote}>{r.fallback_note}</Text> : null}
          </View>
          <Text style={{ ...styles.appProv, color: provColor(r.provenance) }}>{r.provenance}</Text>
        </View>
      ))}
    </View>
  );
}

// The fixed footer: disclaimer verbatim on EVERY page + page numbers.
function Footer() {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.disclaimer}>{DOCUMENT_DISCLAIMER}</Text>
      <Text
        style={styles.pageNo}
        render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
      />
    </View>
  );
}

function KoanoPdf({ model }: { model: RenderModel }) {
  const generated = new Date(model.generatedAt).toISOString().slice(0, 10);
  return (
    <Document title={model.docTitle} author="KOANO">
      <Page size="A4" style={styles.page}>
        <LetterheadBlock lh={model.letterhead} />
        <Text style={styles.docTitle}>{model.docTitle}</Text>
        {model.subtitle ? (
          <Text style={styles.subtitle}>{model.subtitle}  ·  Generated {generated}</Text>
        ) : (
          <Text style={styles.subtitle}>Generated {generated}</Text>
        )}
        {model.sections.map((s, i) => (
          <Section key={i} section={s} />
        ))}
        <ProvenanceAppendixSection model={model} />
        <Footer />
      </Page>
    </Document>
  );
}

// Render a RenderModel to a PDF buffer. Node runtime only.
export async function renderPdf(model: RenderModel): Promise<Buffer> {
  registerPdfFonts();
  return renderToBuffer(<KoanoPdf model={model} />);
}
