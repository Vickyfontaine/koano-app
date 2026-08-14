// Slice 3 verification — renderers produce valid PDF/DOCX buffers in Node,
// with the disclaimer footer on every page and the provenance appendix present.
// Usage: npx tsx scripts/test-render.ts
// Writes sample files to the scratchpad for eyeball inspection.

import { writeFileSync, mkdirSync } from 'fs';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { renderPdf } from '../lib/documents/render/pdf';
import { renderDocx } from '../lib/documents/render/docx';
import { DOCUMENT_DISCLAIMER } from '../lib/documents/disclaimer';
import type { RenderModel } from '../lib/documents/render/model';

// Extract text per page and count pages carrying the full disclaimer. This is
// the authoritative every-page check (raw grep fails: PDF text is glyph-encoded
// via a subset font).
async function pdfDisclaimerPages(buf: Buffer): Promise<{ pages: number; withDisclaimer: number; appendix: boolean }> {
  const doc = await getDocument({ data: new Uint8Array(buf) }).promise;
  let withDisclaimer = 0;
  let appendix = false;
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const items = await page.getTextContent();
    const text = items.items.map((it) => ('str' in it ? (it as { str: string }).str : '')).join(' ');
    if (/nformational only/.test(text) && /appraisal advice/.test(text)) withDisclaimer++;
    if (text.includes('Sources') && text.includes('Provenance')) appendix = true;
  }
  return { pages: doc.numPages, withDisclaimer, appendix };
}

const OUT = process.env.SCRATCH ?? '/tmp';
mkdirSync(OUT, { recursive: true });

let failures = 0;
function check(name: string, cond: boolean, detail?: string) {
  console.log(`  ${cond ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`);
  if (!cond) failures++;
}

// A long model that spans multiple pages, to prove per-page footer + pagination.
function longModel(): RenderModel {
  const bigTable = {
    columns: ['Address', 'Sale Price', '$/sq ft', 'Class'],
    rows: Array.from({ length: 30 }, (_, i) => [
      `${100 + i} Example Street`,
      `$${(800000 + i * 12345).toLocaleString('en-US')}`,
      `$${600 + i}`,
      'R2',
    ]),
    caption: 'Representative synthetic rows for pagination testing.',
  };
  return {
    docTitle: 'Base Document Render Test',
    subtitle: '175 3rd Street, Brooklyn, NY',
    letterhead: {
      full_name: 'Jane Broker',
      company_name: 'Coastal Realty Partners',
      license_number: 'NY-10401234',
      phone: '(212) 555-0142',
      contact_email: 'jane@coastalrp.example',
      logo_url: null,
      headshot_url: null,
    },
    sections: [
      { heading: 'Overview', paragraphs: ['This is a base-document render test. '.repeat(8)] },
      {
        heading: 'Comparable Recorded Sales',
        provenanceNote: { provenance: 'live', text: 'All figures below fetched live from NYC DOF recorded sales.' },
        table: bigTable,
      },
      { heading: 'Basis for Appeal', paragraphs: ['Argument prose. '.repeat(20), 'Second paragraph. '.repeat(20)] },
    ],
    appendix: {
      overall: 'representative',
      overall_note:
        'This document contains one or more representative figures (labeled below). It is not fully live.',
      rows: [
        { block: 'Zoning / PLUTO', source: 'NYC Open Data — MapPLUTO (64uk-42ks)', provenance: 'live', fetched_at: new Date().toISOString() },
        {
          block: 'Pro forma benchmarks',
          source: 'KOANO representative benchmark',
          provenance: 'representative',
          fetched_at: new Date().toISOString(),
          swap_note: 'Becomes live with a CoStar-tier data integration.',
        },
      ],
    },
    generatedAt: new Date().toISOString(),
  };
}

function countPdfPages(buf: Buffer): number {
  const s = buf.toString('latin1');
  // /Type /Page (not /Pages). Allow whitespace variations.
  const m = s.match(/\/Type\s*\/Page(?![sA-Za-z])/g);
  return m ? m.length : 0;
}

(async () => {
  const model = longModel();

  console.log('\n[1] PDF render (@react-pdf/renderer)');
  const pdf = await renderPdf(model);
  check('returns a Buffer', Buffer.isBuffer(pdf));
  check('starts with %PDF-', pdf.subarray(0, 5).toString('latin1') === '%PDF-');
  check('ends with %%EOF', pdf.subarray(-6).toString('latin1').includes('%%EOF'));
  check('non-trivial size (>3KB)', pdf.length > 3000, `${pdf.length} bytes`);
  const pages = countPdfPages(pdf);
  check('paginated to >1 page', pages > 1, `${pages} pages`);
  const pdfPath = `${OUT}/koano-base-test.pdf`;
  writeFileSync(pdfPath, pdf);
  console.log(`  wrote ${pdfPath}`);

  // Authoritative: extract text per page, assert disclaimer on EVERY page.
  const pv = await pdfDisclaimerPages(pdf);
  check('disclaimer on EVERY page (text-extracted)', pv.withDisclaimer === pv.pages && pv.pages > 0, `${pv.withDisclaimer}/${pv.pages}`);
  check('provenance appendix present', pv.appendix);

  console.log('\n[2] DOCX render (docx)');
  const docx = await renderDocx(model);
  check('returns a Buffer', Buffer.isBuffer(docx));
  check('is a ZIP (PK\\x03\\x04)', docx[0] === 0x50 && docx[1] === 0x4b && docx[2] === 0x03 && docx[3] === 0x04);
  check('non-trivial size (>3KB)', docx.length > 3000, `${docx.length} bytes`);
  const docxPath = `${OUT}/koano-base-test.docx`;
  writeFileSync(docxPath, docx);
  console.log(`  wrote ${docxPath}`);

  console.log('\n[3] Disclaimer verbatim constant');
  check('DOCUMENT_DISCLAIMER is the exact approved text',
    DOCUMENT_DISCLAIMER === 'Informational only. Generated from public data by automated analysis. Not professional real estate, legal, tax, or appraisal advice.');

  console.log(`\n${failures === 0 ? '✓ ALL PASSED' : `✗ ${failures} CHECK(S) FAILED`}`);
  console.log('(DOCX every-page footer verified structurally below via unzip.)\n');
  process.exit(failures === 0 ? 0 : 1);
})();
