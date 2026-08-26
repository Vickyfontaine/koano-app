// KOANO document engine — DOCX renderer (docx npm, pure JS).
// Consumes the same RenderModel as the PDF renderer. The disclaimer footer
// (a section default footer → repeats on EVERY page) and the provenance
// appendix are added structurally here, so a document type cannot omit either.
// Node runtime only. DOCX is offered only for cma & ic_memo (editable
// deliverables); the registry's `formats` gates that, not this module.

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  Footer,
  AlignmentType,
  TableOfContents,
  PageNumber,
  TabStopType,
  TabStopPosition,
  PageBreak,
} from 'docx';
import { DOCUMENT_DISCLAIMER } from '../disclaimer';
import type { RenderModel, RenderSection, RenderTable } from './model';
import type { Letterhead } from '../types';
import type { Provenance } from '../../providers/types';
import { isTrustedProvenance } from '../../providers/provenance';

const INK = '0D2B3E';
const INK_MUTED = '5A7A8C';
const INK_FAINT = '8AABB8';
const BRAND = '5A9BBE';
const GREEN = '22C55E';
const AMBER = 'F59E0B';
const BORDER = 'D6EBF7';

// Font family for the long-form (IC memo) DOCX. The PDF renders in Helvetica
// (built-in), so DOCX uses Arial — metrically Helvetica-compatible and present
// on effectively every Word install — so both formats read as the same
// document. (The brand face Neue Montreal is not embedded in either format; if
// it is licensed for embedding later, this is the one constant to change.)
const DOCX_FONT = 'Arial';

function provColor(p: Provenance): string {
  switch (p) {
    case 'live':
      return GREEN;
    case 'partner':
      return BRAND;
    case 'representative':
    case 'fetch_failed':
      return AMBER;
    case 'coverage_absent':
      return INK_MUTED;
  }
}

function letterheadParagraphs(lh: Letterhead): Paragraph[] {
  const out: Paragraph[] = [];
  out.push(
    new Paragraph({
      children: [new TextRun({ text: 'KOANO', bold: true, color: BRAND, size: 22 })],
    }),
  );
  const lines = [
    lh.full_name,
    lh.company_name,
    lh.license_number ? `License ${lh.license_number}` : null,
    [lh.phone, lh.contact_email].filter(Boolean).join('  ·  ') || null,
  ].filter(Boolean) as string[];
  if (lines.length === 0) lines.push('Prepared with KOANO');
  for (const l of lines) {
    out.push(new Paragraph({ children: [new TextRun({ text: l, size: 18, color: INK_MUTED })] }));
  }
  return out;
}

function tableToDocx(t: RenderTable): Table {
  const headerRow = new TableRow({
    tableHeader: true,
    children: t.columns.map(
      (c) =>
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: c, bold: true, size: 17, color: INK })] })],
        }),
    ),
  });
  const bodyRows = t.rows.map(
    (row) =>
      new TableRow({
        children: row.map(
          (cell) =>
            new TableCell({
              children: [new Paragraph({ children: [new TextRun({ text: cell, size: 17, color: INK_MUTED })] })],
            }),
        ),
      }),
  );
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    // Horizontal rules only — matches the PDF's clean, ledger-style tables
    // rather than Word's default full grid.
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: INK_FAINT },
      bottom: { style: BorderStyle.SINGLE, size: 2, color: BORDER },
      left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: BORDER },
      insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    },
    rows: [headerRow, ...bodyRows],
  });
}

// Long-form style set: match the PDF's family, heading weights, and spacing so
// PDF and DOCX read as the same document. Applied only to the IC memo.
function longFormStyles() {
  const heading = (size: number, before: number, underline: boolean) => ({
    run: { font: DOCX_FONT, size, bold: true, color: INK },
    paragraph: {
      spacing: { before, after: 80 },
      ...(underline
        ? { border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: BORDER, space: 2 } } }
        : {}),
    },
  });
  return {
    default: {
      document: { run: { font: DOCX_FONT, size: 20, color: INK } },
      title: { run: { font: DOCX_FONT, size: 60, bold: true, color: INK }, paragraph: { spacing: { after: 120 } } },
      heading1: heading(28, 260, true),
      heading2: heading(24, 220, true),
    },
  };
}

function sectionParagraphs(s: RenderSection): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  // Numbered long-form sections use HEADING_1 (so the TOC field picks them up)
  // and carry their number in the text; everything else is unchanged HEADING_2.
  const level = s.number ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2;
  const headingText = s.number ? `${s.number}.  ${s.heading}` : (s.heading ?? '');
  out.push(new Paragraph({ text: headingText, heading: level, pageBreakBefore: s.pageBreakBefore || undefined }));
  if (s.placeholder) {
    out.push(
      new Paragraph({
        border: {
          top: { style: BorderStyle.DASHED, size: 4, color: '8AABB8', space: 6 },
          bottom: { style: BorderStyle.DASHED, size: 4, color: '8AABB8', space: 6 },
          left: { style: BorderStyle.DASHED, size: 4, color: '8AABB8', space: 6 },
          right: { style: BorderStyle.DASHED, size: 4, color: '8AABB8', space: 6 },
        },
        children: [
          new TextRun({ text: 'To be completed by the analyst — ', bold: true, size: 18, color: INK_MUTED }),
          new TextRun({ text: s.placeholder.note, italics: true, size: 18, color: INK_MUTED }),
        ],
      }),
    );
  }
  if (s.provenanceNote) {
    out.push(
      new Paragraph({
        children: [new TextRun({ text: s.provenanceNote.text, size: 17, color: provColor(s.provenanceNote.provenance), italics: true })],
      }),
    );
  }
  for (const p of s.paragraphs ?? []) {
    out.push(new Paragraph({ children: [new TextRun({ text: p, size: 20, color: INK })] }));
  }
  if (s.table) {
    out.push(tableToDocx(s.table));
    if (s.table.caption) {
      out.push(new Paragraph({ children: [new TextRun({ text: s.table.caption, size: 15, color: INK_MUTED, italics: true })] }));
    }
  }
  return out;
}

function appendixParagraphs(model: RenderModel): (Paragraph | Table)[] {
  const a = model.appendix;
  const out: (Paragraph | Table)[] = [];
  out.push(new Paragraph({ text: 'Sources & Provenance', heading: HeadingLevel.HEADING_2 }));
  out.push(new Paragraph({ children: [new TextRun({ text: a.overall_note, size: 18, color: INK_MUTED })] }));
  const header = new TableRow({
    tableHeader: true,
    children: ['Data', 'Source', 'Provenance'].map(
      (c) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: c, bold: true, size: 17, color: INK })] })] }),
    ),
  });
  const rows = a.rows.map(
    (r) =>
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: r.block, size: 16, color: INK })] })] }),
          new TableCell({
            children: [
              new Paragraph({ children: [new TextRun({ text: r.source, size: 16, color: INK_MUTED })] }),
              ...(r.swap_note ? [new Paragraph({ children: [new TextRun({ text: r.swap_note, size: 14, color: INK_MUTED, italics: true })] })] : []),
              ...(r.fallback_note ? [new Paragraph({ children: [new TextRun({ text: r.fallback_note, size: 14, color: INK_MUTED, italics: true })] })] : []),
            ],
          }),
          new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: r.provenance, size: 16, color: provColor(r.provenance) })] })] }),
        ],
      }),
  );
  out.push(new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [header, ...rows] }));
  return out;
}

// The section default footer: disclaimer verbatim, repeats on EVERY page.
function disclaimerFooter(): Footer {
  return new Footer({
    children: [
      new Paragraph({
        alignment: AlignmentType.LEFT,
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: 'D6EBF7', space: 4 } },
        children: [new TextRun({ text: DOCUMENT_DISCLAIMER, size: 13, color: INK_MUTED })],
      }),
    ],
  });
}

// Long-form footer: the verbatim disclaimer (still on EVERY page) with a
// right-tabbed "Page X of Y" — Word computes the numbers, KOANO never asserts
// a page count it can't know.
function disclaimerFooterWithPageNumbers(): Footer {
  return new Footer({
    children: [
      new Paragraph({
        border: { top: { style: BorderStyle.SINGLE, size: 4, color: 'D6EBF7', space: 4 } },
        tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
        children: [
          new TextRun({ text: DOCUMENT_DISCLAIMER, size: 13, color: INK_MUTED }),
          new TextRun({ text: '\t', size: 13 }),
          new TextRun({ text: 'Page ', size: 13, color: INK_MUTED }),
          new TextRun({ children: [PageNumber.CURRENT], size: 13, color: INK_MUTED }),
          new TextRun({ text: ' of ', size: 13, color: INK_MUTED }),
          new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 13, color: INK_MUTED }),
        ],
      }),
    ],
  });
}

const TONE_DOCX: Record<'positive' | 'warning' | 'negative', string> = {
  positive: GREEN,
  warning: AMBER,
  negative: 'EF4444',
};

// Long-form title page + TOC front matter. Word fills the TOC page numbers on
// open (updateFields). The disclaimer still comes from the section footer.
function longFormFrontMatter(model: RenderModel): (Paragraph | TableOfContents)[] {
  const memoDate = new Date(model.generatedAt).toISOString().slice(0, 10);
  const vDate = model.verdictGeneratedAt ? new Date(model.verdictGeneratedAt).toISOString().slice(0, 10) : null;
  const out: (Paragraph | TableOfContents)[] = [];
  out.push(...letterheadParagraphs(model.letterhead));
  out.push(new Paragraph({ text: model.docTitle, heading: HeadingLevel.TITLE }));
  if (model.subtitle) {
    out.push(new Paragraph({ children: [new TextRun({ text: model.subtitle, size: 24, color: INK_MUTED })] }));
  }
  if (model.titleBanner) {
    out.push(new Paragraph({ spacing: { before: 240 }, children: [new TextRun({ text: 'KOANO RECOMMENDATION', size: 16, color: INK_MUTED })] }));
    out.push(
      new Paragraph({
        children: [new TextRun({ text: model.titleBanner.decision, bold: true, size: 44, color: TONE_DOCX[model.titleBanner.tone] })],
      }),
    );
    out.push(new Paragraph({ children: [new TextRun({ text: `Confidence ${model.titleBanner.confidence} / 100`, size: 20, color: INK_MUTED })] }));
  }
  if (vDate) out.push(new Paragraph({ spacing: { before: 160 }, children: [new TextRun({ text: `Verdict generated: ${vDate}`, size: 20, color: INK })] }));
  out.push(new Paragraph({ children: [new TextRun({ text: `Memo generated: ${memoDate}`, size: 20, color: INK })] }));
  if (model.stalenessBanner) {
    out.push(
      new Paragraph({
        spacing: { before: 160 },
        border: {
          top: { style: BorderStyle.SINGLE, size: 4, color: AMBER, space: 6 },
          bottom: { style: BorderStyle.SINGLE, size: 4, color: AMBER, space: 6 },
          left: { style: BorderStyle.SINGLE, size: 4, color: AMBER, space: 6 },
          right: { style: BorderStyle.SINGLE, size: 4, color: AMBER, space: 6 },
        },
        children: [new TextRun({ text: model.stalenessBanner, size: 19, color: 'B45309' })],
      }),
    );
  }
  if (model.documentProvenanceNote) {
    const rep = model.documentProvenance != null && !isTrustedProvenance(model.documentProvenance);
    out.push(
      new Paragraph({
        spacing: { before: 200 },
        ...(rep
          ? {
              border: {
                top: { style: BorderStyle.SINGLE, size: 4, color: AMBER, space: 6 },
                bottom: { style: BorderStyle.SINGLE, size: 4, color: AMBER, space: 6 },
                left: { style: BorderStyle.SINGLE, size: 4, color: AMBER, space: 6 },
                right: { style: BorderStyle.SINGLE, size: 4, color: AMBER, space: 6 },
              },
            }
          : {}),
        children: [new TextRun({ text: model.documentProvenanceNote, size: 18, color: rep ? 'B45309' : INK_MUTED })],
      }),
    );
  }
  out.push(new Paragraph({ spacing: { before: 300 }, children: [new TextRun({ text: 'CONFIDENTIAL — decision support, not a decision', size: 16, color: INK_MUTED })] }));
  // Page break → TOC on its own page.
  out.push(new Paragraph({ children: [new PageBreak()] }));
  // A plain styled label, NOT a heading — a heading here would list itself in
  // the TOC field it precedes.
  out.push(new Paragraph({ spacing: { after: 160 }, children: [new TextRun({ text: 'Table of Contents', bold: true, size: 30, color: INK })] }));
  out.push(new TableOfContents('Table of Contents', { hyperlink: true, headingStyleRange: '1-2' }));
  return out;
}

// Render a RenderModel to a DOCX buffer. Node runtime only. Long-form documents
// (the IC memo) get a title page, a native TOC field (Word fills the page
// numbers on open via updateFields), and page numbers in the footer; every
// other type renders exactly as before.
export async function renderDocx(model: RenderModel): Promise<Buffer> {
  const generated = new Date(model.generatedAt).toISOString().slice(0, 10);

  if (model.longForm) {
    const body: (Paragraph | Table | TableOfContents)[] = [
      ...longFormFrontMatter(model),
      ...model.sections.flatMap(sectionParagraphs),
      ...appendixParagraphs(model),
    ];
    const doc = new Document({
      creator: 'KOANO',
      title: model.docTitle,
      // Word updates the TOC page numbers on open.
      features: { updateFields: true },
      styles: longFormStyles(),
      sections: [{ footers: { default: disclaimerFooterWithPageNumbers() }, children: body }],
    });
    return Packer.toBuffer(doc);
  }

  const body: (Paragraph | Table)[] = [
    ...letterheadParagraphs(model.letterhead),
    new Paragraph({ text: model.docTitle, heading: HeadingLevel.TITLE }),
    new Paragraph({
      children: [
        new TextRun({
          text: model.subtitle ? `${model.subtitle}  ·  Generated ${generated}` : `Generated ${generated}`,
          size: 20,
          color: INK_MUTED,
        }),
      ],
    }),
    ...model.sections.flatMap(sectionParagraphs),
    ...appendixParagraphs(model),
  ];

  const doc = new Document({
    creator: 'KOANO',
    title: model.docTitle,
    sections: [{ footers: { default: disclaimerFooter() }, children: body }],
  });

  return Packer.toBuffer(doc);
}
