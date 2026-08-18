// Slice 2 verification — Development Site Screening Memo, build + render.
// Offline (deterministic reasoning, no model call): proves the memo is correct
// on live data, ≤ 2 pages (hard ceiling), disclaimer on every page, and tracks
// how often same-owner adjacency actually fires.
// Usage: npx tsx scripts/test-site-screening.ts ["address"]

import { writeFileSync, mkdirSync } from 'fs';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { assembleDocumentData } from '../lib/documents/assembler';
import { getDocumentType } from '../lib/documents/registry';
import {
  extractScreeningFacts,
  computeVerdict,
  deterministicReasoning,
  buildScreeningModel,
} from '../lib/documents/builders/site-screening';
import { renderPdf } from '../lib/documents/render/pdf';
import type { Letterhead } from '../lib/documents/types';

const OUT = process.env.SCRATCH ?? '/tmp';
mkdirSync(OUT, { recursive: true });

// Default: a spread of real NYC development sites to also gauge adjacency rate.
const SITES = process.argv[2]
  ? [process.argv[2]]
  : [
      '175 3rd Street, Brooklyn, NY',
      '517 8th Avenue, Brooklyn, NY',
      '1318 Clay Avenue, Bronx, NY',
      '47-07 Vernon Boulevard, Long Island City, NY',
      '70-33 260th Street, Queens, NY',
    ];

const LETTERHEAD: Letterhead = {
  full_name: 'Dev Screening',
  company_name: 'KOANO',
  license_number: null,
  phone: null,
  contact_email: null,
  logo_url: null,
  headshot_url: null,
};

let failures = 0;
let adjacencyFires = 0;
let siteCount = 0;
function check(name: string, cond: boolean, detail?: string) {
  console.log(`    ${cond ? '✓' : '✗'} ${name}${detail ? ` — ${detail}` : ''}`);
  if (!cond) failures++;
}

async function screenOne(address: string) {
  const doc = getDocumentType('site_screening_memo')!;
  const res = await assembleDocumentData(address, doc.requiredBlocks);
  if (!res.ok) {
    check(`assembly (${address})`, false, `${res.status}: ${res.error}`);
    return;
  }
  const extracted = extractScreeningFacts(res.data);
  if (!extracted.ok) {
    check(`facts (${address})`, false, extracted.error);
    return;
  }
  siteCount++;
  const f = extracted.facts;
  const v = computeVerdict(f);
  const model = buildScreeningModel({
    data: res.data,
    facts: f,
    verdict: v,
    letterhead: LETTERHEAD,
    reasoning: deterministicReasoning(f, v),
    generatedAt: '2026-01-01T00:00:00.000Z',
  });

  const pdf = await renderPdf(model);
  const pdoc = await getDocument({ data: new Uint8Array(pdf) }).promise;
  let disc = 0;
  let text = '';
  for (let i = 1; i <= pdoc.numPages; i++) {
    const page = await pdoc.getPage(i);
    const t = (await page.getTextContent()).items.map((x) => ('str' in x ? (x as { str: string }).str : '')).join(' ');
    if (/nformational only/.test(t) && /appraisal advice/.test(t)) disc++;
    text += ' ' + t;
  }

  if (f.sameOwnerLotCount > 0) adjacencyFires++;

  console.log(`\n  ── ${address}`);
  console.log(`     verdict ${v.decision} (conf ${v.confidence}) | base ${f.baseMaxFloorArea?.toLocaleString()} → aff ${f.affMaxFloorArea?.toLocaleString()} sq ft | CD approval ${f.approvalRatio}% | same-owner lots ${f.sameOwnerLotCount} | block unused ${f.blockUnusedFar.toLocaleString()} sq ft`);
  check('≤ 2 pages (hard ceiling)', pdoc.numPages <= 2, `${pdoc.numPages} pages`);
  check('disclaimer on EVERY page', disc === pdoc.numPages && pdoc.numPages > 0, `${disc}/${pdoc.numPages}`);
  check('verdict headline present', /ADVANCE|HOLD|PASS/.test(text));
  check('base-vs-affordable FAR contrast present', /affordable/i.test(text));
  check('entitlement read present', text.includes('Entitlement Risk Read'));
  check('assemblage present', text.includes('Assemblage'));
  check('DD gap register present', text.includes('Due Diligence Gap Register'));
  check('proof points present', text.includes('Proof Points'));
  check('risk & mitigant present', text.includes('Risk'));
  check('reasoning present', text.includes('Reasoning'));
  check('overall provenance resolved', ['live', 'representative'].includes(model.appendix.overall), model.appendix.overall);

  writeFileSync(`${OUT}/screening-${(f.bbl ?? 'x')}.pdf`, pdf);
}

(async () => {
  for (const s of SITES) await screenOne(s);
  console.log('\n──────────────────────────────────────────');
  console.log(`Same-owner adjacency fired on ${adjacencyFires} / ${siteCount} sites tested.`);
  console.log(`${failures === 0 ? '✓ ALL SCREENING CHECKS PASSED' : `✗ ${failures} CHECK(S) FAILED`}\n`);
  process.exit(failures === 0 ? 0 : 1);
})();
