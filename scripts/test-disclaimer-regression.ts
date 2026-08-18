// Disclaimer regression harness — the durable guard for a legally load-bearing
// element. The lineHeight bug dropped the entire footer with NO error; a code
// comment cannot protect the disclaimer across fifteen more document types, so
// this does:
//   1. COVERAGE — every IMPLEMENTED_DOC_TYPES entry must have a sample model.
//      A new type with no sample fails here (it cannot ship untested).
//   2. PER-TYPE — each type's PDF carries the disclaimer on EVERY page (pdfjs
//      text extraction, the authoritative method); DOCX types carry it in the
//      footer XML.
//   3. STRESS — a multi-page, page-spanning-table document proves the footer
//      survives pagination (the exact shape that surfaced the bug).
// Usage: npm run test:disclaimer   (or: npx tsx scripts/test-disclaimer-regression.ts)

import { writeFileSync, mkdirSync } from 'fs';
import { execSync } from 'child_process';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { IMPLEMENTED_DOC_TYPES } from '../lib/documents/implemented';
import { SAMPLE_MODELS, STRESS_MODEL } from '../lib/documents/render/samples';
import { getDocumentType } from '../lib/documents/registry';
import { renderPdf } from '../lib/documents/render/pdf';
import { renderDocx } from '../lib/documents/render/docx';
import type { RenderModel } from '../lib/documents/render/model';

const OUT = process.env.SCRATCH ?? '/tmp';
mkdirSync(OUT, { recursive: true });

let failures = 0;
function check(name: string, cond: boolean, detail?: string) {
  console.log(`  ${cond ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`);
  if (!cond) failures++;
}

// Disclaimer on EVERY page of a PDF (glyph-encoded → must extract text, not grep).
async function pdfDisclaimerCoverage(buf: Buffer): Promise<{ pages: number; withDisclaimer: number }> {
  const doc = await getDocument({ data: new Uint8Array(buf) }).promise;
  let withDisclaimer = 0;
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const t = (await page.getTextContent()).items.map((x) => ('str' in x ? (x as { str: string }).str : '')).join(' ');
    if (/nformational only/.test(t) && /appraisal advice/.test(t)) withDisclaimer++;
  }
  return { pages: doc.numPages, withDisclaimer };
}

// Disclaimer in the DOCX footer XML (plain text in the zip — extract footer parts).
function docxFooterText(buf: Buffer, tag: string): string {
  const tmp = `${OUT}/_regression-${tag}.docx`;
  writeFileSync(tmp, buf);
  const list = execSync(`unzip -Z1 "${tmp}"`, { encoding: 'utf8' });
  const footers = list.split('\n').map((s) => s.trim()).filter((n) => /^word\/footer\d*\.xml$/.test(n));
  let text = '';
  for (const f of footers) text += execSync(`unzip -p "${tmp}" "${f}"`, { encoding: 'utf8' });
  return text;
}

async function assertPdfEveryPage(label: string, model: RenderModel, opts?: { minPages?: number }) {
  const buf = await renderPdf(model);
  const cov = await pdfDisclaimerCoverage(buf);
  if (opts?.minPages) check(`${label}: PDF is multi-page (>${opts.minPages - 1})`, cov.pages >= opts.minPages, `${cov.pages} pages`);
  check(`${label}: disclaimer on EVERY PDF page`, cov.withDisclaimer === cov.pages && cov.pages > 0, `${cov.withDisclaimer}/${cov.pages}`);
}

async function assertDocxFooter(label: string, model: RenderModel, tag: string) {
  const buf = await renderDocx(model);
  const footer = docxFooterText(buf, tag);
  check(
    `${label}: disclaimer in DOCX footer XML`,
    /Informational only/.test(footer) && /appraisal advice/.test(footer),
  );
}

(async () => {
  console.log('\n[1] Coverage — every implemented type has a sample model');
  for (const type of IMPLEMENTED_DOC_TYPES) {
    check(`sample model exists for "${type}"`, !!SAMPLE_MODELS[type], SAMPLE_MODELS[type] ? '' : 'MISSING — add to samples.ts');
  }

  console.log('\n[2] Per-type disclaimer coverage');
  for (const type of IMPLEMENTED_DOC_TYPES) {
    const model = SAMPLE_MODELS[type];
    if (!model) continue; // already flagged in [1]
    const doc = getDocumentType(type);
    // multi_site samples MUST span ≥2 pages so the page-2 footer is actually
    // tested for that type (a 1-page sample silently skips the pagination path).
    const minPages = doc?.scope === 'multi_site' ? 2 : undefined;
    await assertPdfEveryPage(type, model, minPages ? { minPages } : undefined);
    if (doc && doc.formats.includes('docx')) {
      await assertDocxFooter(type, model, type);
    }
  }

  console.log('\n[3] Stress — pagination + page-spanning table (PDF & DOCX)');
  await assertPdfEveryPage('stress', STRESS_MODEL, { minPages: 2 });
  await assertDocxFooter('stress', STRESS_MODEL, 'stress');

  console.log(`\n${failures === 0 ? '✓ ALL DISCLAIMER CHECKS PASSED' : `✗ ${failures} CHECK(S) FAILED`}\n`);
  process.exit(failures === 0 ? 0 : 1);
})();
