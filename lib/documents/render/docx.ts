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
} from 'docx';
import { DOCUMENT_DISCLAIMER } from '../disclaimer';
import type { RenderModel, RenderSection, RenderTable } from './model';
import type { Letterhead } from '../types';

const INK = '0D2B3E';
const INK_MUTED = '5A7A8C';
const BRAND = '5A9BBE';
const GREEN = '22C55E';
const AMBER = 'F59E0B';

function provColor(p: 'live' | 'representative'): string {
  return p === 'live' ? GREEN : AMBER;
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
    rows: [headerRow, ...bodyRows],
  });
}

function sectionParagraphs(s: RenderSection): (Paragraph | Table)[] {
  const out: (Paragraph | Table)[] = [];
  out.push(new Paragraph({ text: s.heading, heading: HeadingLevel.HEADING_2 }));
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

// Render a RenderModel to a DOCX buffer. Node runtime only.
export async function renderDocx(model: RenderModel): Promise<Buffer> {
  const generated = new Date(model.generatedAt).toISOString().slice(0, 10);
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
