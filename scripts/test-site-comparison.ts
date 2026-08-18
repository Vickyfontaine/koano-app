// Slice 3 verification — Three-Site Comparison Brief.
// Assembles three real NYC sites, builds the comparison grid (deterministic
// reasoning, no model call), renders, and asserts ≤ 2 pages, disclaimer on
// every page, identical grid structure with sites as columns, and a ranking.
// Usage: npx tsx scripts/test-site-comparison.ts

import { writeFileSync, mkdirSync } from 'fs';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { assembleDocumentData } from '../lib/documents/assembler';
import { getDocumentType } from '../lib/documents/registry';
import { extractScreeningFacts, computeVerdict } from '../lib/documents/builders/site-screening';
import {
  buildComparisonModel,
  deterministicComparisonReasoning,
  type ComparisonSite,
} from '../lib/documents/builders/site-comparison';
import { renderPdf } from '../lib/documents/render/pdf';
import type { Letterhead } from '../lib/documents/types';

const OUT = process.env.SCRATCH ?? '/tmp';
mkdirSync(OUT, { recursive: true });

const ADDRESSES = [
  '175 3rd Street, Brooklyn, NY',
  '517 8th Avenue, Brooklyn, NY',
  '47-07 Vernon Boulevard, Long Island City, NY',
];
const LETTERHEAD: Letterhead = {
  full_name: null, company_name: 'KOANO', license_number: null, phone: null, contact_email: null, logo_url: null, headshot_url: null,
};

let failures = 0;
function check(name: string, cond: boolean, detail?: string) {
  console.log(`  ${cond ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`);
  if (!cond) failures++;
}

(async () => {
  const doc = getDocumentType('three_site_comparison_brief')!;
  const sites: ComparisonSite[] = [];
  for (const address of ADDRESSES) {
    const res = await assembleDocumentData(address, doc.requiredBlocks);
    if (!res.ok) { check(`assembly ${address}`, false, res.error); continue; }
    const ex = extractScreeningFacts(res.data);
    if (!ex.ok) { check(`facts ${address}`, false, ex.error); continue; }
    sites.push({ address, data: res.data, facts: ex.facts, verdict: computeVerdict(ex.facts) });
  }
  check('assembled all 3 sites', sites.length === 3, `${sites.length}`);

  const model = buildComparisonModel({
    sites,
    letterhead: LETTERHEAD,
    reasoning: deterministicComparisonReasoning(sites),
    generatedAt: '2026-01-01T00:00:00.000Z',
  });

  const pdf = await renderPdf(model);
  const pdoc = await getDocument({ data: new Uint8Array(pdf) }).promise;
  let disc = 0, text = '';
  for (let i = 1; i <= pdoc.numPages; i++) {
    const page = await pdoc.getPage(i);
    const t = (await page.getTextContent()).items.map((x) => ('str' in x ? (x as { str: string }).str : '')).join(' ');
    if (/nformational only/.test(t) && /appraisal advice/.test(t)) disc++;
    text += ' ' + t;
  }
  writeFileSync(`${OUT}/comparison-brief.pdf`, pdf);

  console.log('\nverdicts:', sites.map((s) => `${s.address.split(',')[0]}=${s.verdict.decision}/${s.verdict.confidence}`).join('  |  '));
  check('≤ 2 pages (hard ceiling)', pdoc.numPages <= 2, `${pdoc.numPages} pages`);
  check('disclaimer on EVERY page', disc === pdoc.numPages && pdoc.numPages > 0, `${disc}/${pdoc.numPages}`);
  check('comparison grid present', text.includes('Site Comparison'));
  check('verdict row present', text.includes('KOANO verdict'));
  check('rank row present', text.includes('Risk-adjusted rank') && /#1/.test(text));
  check('City of Yes affordable row present', text.includes('affordable max'));
  check('all 3 sites as columns', ADDRESSES.every((a) => text.includes(a.split(',')[0].slice(0, 18))));
  check('reasoning present', text.includes('Reasoning'));
  check('provenance resolved', ['live', 'representative'].includes(model.appendix.overall), model.appendix.overall);

  console.log(`\n${failures === 0 ? '✓ ALL COMPARISON CHECKS PASSED' : `✗ ${failures} CHECK(S) FAILED`}\n`);
  process.exit(failures === 0 ? 0 : 1);
})();
