// Slice 4 verification — tax appeal packet, builder + render end-to-end.
// Offline (deterministic argument, no model call, no DB): proves the document
// content and structure are correct on real live NYC data. The route's
// auth/guard/DB path is verified live after migrations 005/006 are run.
// Usage: npx tsx scripts/test-tax-appeal.ts ["address"]

import { writeFileSync, mkdirSync } from 'fs';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { assembleDocumentData } from '../lib/documents/assembler';
import { buildProvenanceAppendix } from '../lib/documents/disclaimer';
import { getDocumentType } from '../lib/documents/registry';
import {
  extractTaxAppealFacts,
  deterministicArgument,
  buildTaxAppealModel,
} from '../lib/documents/builders/tax-appeal';
import { renderPdf } from '../lib/documents/render/pdf';
import type { Letterhead } from '../lib/documents/types';

const address = process.argv[2] ?? '175 3rd Street, Brooklyn, NY';
const OUT = process.env.SCRATCH ?? '/tmp';
mkdirSync(OUT, { recursive: true });

let failures = 0;
function check(name: string, cond: boolean, detail?: string) {
  console.log(`  ${cond ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`);
  if (!cond) failures++;
}

const LETTERHEAD: Letterhead = {
  full_name: 'Jane Homeowner',
  company_name: null,
  license_number: null,
  phone: null,
  contact_email: 'jane@example.com',
  logo_url: null,
  headshot_url: null,
};

(async () => {
  const doc = getDocumentType('tax_appeal_packet')!;
  console.log(`\nAssembling ${doc.title} for: ${address}`);
  const assembled = await assembleDocumentData(address, doc.requiredBlocks);
  if (!assembled.ok) {
    check('assembly succeeded', false, `${assembled.status}: ${assembled.error}`);
    process.exit(1);
  }
  const data = assembled.data;
  console.log(`resolved: ${data.resolved_address.normalized} | bbl ${data.resolved_address.bbl}`);
  console.log(`overall_provenance: ${data.overall_provenance}`);

  const extracted = extractTaxAppealFacts(data);
  if (!extracted.ok) {
    check('facts extracted', false, extracted.error);
    process.exit(1);
  }
  const f = extracted.facts;
  console.log(`assessed total: ${f.assessedTotal} | median psf: ${f.medianPsf} | bldg area: ${f.buildingAreaSqft} | indicative: ${Math.round(f.indicativeValue ?? 0)} | comps: ${f.salesCount}`);

  check('assessed value present (live PLUTO)', f.assessedTotal != null && f.assessedTotal > 0);
  check('building area present (live PLUTO)', f.buildingAreaSqft != null && f.buildingAreaSqft > 0);
  check('comps present (live DOF sales)', f.comps.length > 0 && f.salesCount > 0);
  check('indicative value computed', f.indicativeValue != null && f.indicativeValue > 0);
  check('overall provenance is live (all-live inputs)', data.overall_provenance === 'live', data.overall_provenance);

  const argument = deterministicArgument(f);
  check('deterministic argument has prose', argument.length >= 2 && argument.every((p) => p.length > 40));

  const appendix = buildProvenanceAppendix(data);
  const model = buildTaxAppealModel({
    data,
    facts: f,
    letterhead: LETTERHEAD,
    argument,
    appendix,
    generatedAt: new Date().toISOString(),
  });
  check('model has all 4 sections', model.sections.length === 4, `${model.sections.length}`);

  const pdf = await renderPdf(model);
  check('PDF valid', pdf.subarray(0, 5).toString('latin1') === '%PDF-' && pdf.subarray(-6).toString('latin1').includes('%%EOF'));
  const path = `${OUT}/koano-tax-appeal.pdf`;
  writeFileSync(path, pdf);
  console.log(`  wrote ${path}`);

  // Extract text per page: disclaimer on every page + key content present.
  const pdoc = await getDocument({ data: new Uint8Array(pdf) }).promise;
  let discPages = 0;
  let allText = '';
  for (let i = 1; i <= pdoc.numPages; i++) {
    const page = await pdoc.getPage(i);
    const t = (await page.getTextContent()).items.map((x) => ('str' in x ? (x as { str: string }).str : '')).join(' ');
    if (/nformational only/.test(t) && /appraisal advice/.test(t)) discPages++;
    allText += ' ' + t;
  }
  check('disclaimer on EVERY page', discPages === pdoc.numPages && pdoc.numPages > 0, `${discPages}/${pdoc.numPages}`);
  check('has Assessment Summary', allText.includes('Assessment Summary'));
  check('has Comparable Recorded Sales', allText.includes('Comparable Recorded Sales'));
  check('has Indicative Value vs. Assessment', allText.includes('Indicative Value'));
  check('has Basis for Appeal', allText.includes('Basis for Appeal'));
  check('has Sources & Provenance appendix', allText.includes('Sources') && allText.includes('Provenance'));
  check('assessed value figure rendered', allText.includes(`$${Math.round(f.assessedTotal!).toLocaleString('en-US')}`));

  console.log(`\n${failures === 0 ? '✓ ALL PASSED' : `✗ ${failures} CHECK(S) FAILED`}\n`);
  process.exit(failures === 0 ? 0 : 1);
})();
