// Slice 2 verification — document engine core (no rendering).
// Proves in isolation: registry integrity, the monotonic tier gate, live data
// assembly with provenance flowing through, and the provenance appendix.
// Usage: npx tsx scripts/test-document-engine.ts ["address"]

import { DOCUMENT_TYPES, getDocumentType } from '../lib/documents/registry';
import { allowedPlansFor } from '../lib/documents/guard';
import { assembleDocumentData } from '../lib/documents/assembler';
import { buildProvenanceAppendix, DOCUMENT_DISCLAIMER } from '../lib/documents/disclaimer';
import { VALID_BLOCKS } from '../lib/providers/blocks';
import { TIER_LADDER, type Tier } from '../lib/documents/types';

const address = process.argv[2] ?? '175 3rd Street, Brooklyn, NY';

let failures = 0;
function check(name: string, cond: boolean, detail?: string) {
  const mark = cond ? '✓' : '✗';
  console.log(`  ${mark} ${name}${detail ? ` — ${detail}` : ''}`);
  if (!cond) failures++;
}

// Simulate the tier gate the way guardDocument does (free is below the ladder).
function canGenerate(plan: 'free' | Tier, homeTier: Tier): boolean {
  if (!(TIER_LADDER as readonly string[]).includes(plan)) return false;
  return allowedPlansFor(homeTier).includes(plan as Tier);
}

(async () => {
  // -----------------------------------------------------------------------
  console.log('\n[1] Registry integrity');
  const entries = Object.entries(DOCUMENT_TYPES);
  check('16 document types declared', entries.length === 16, `${entries.length}`);
  for (const [id, doc] of entries) {
    check(`${id}: id matches key`, doc.id === id);
    check(`${id}: requiredBlocks all valid`, doc.requiredBlocks.every((b) => (VALID_BLOCKS as string[]).includes(b)));
    check(`${id}: pdf format present`, doc.formats.includes('pdf'));
    check(`${id}: blocked ⇔ blockedOn`, (doc.status === 'blocked') === (doc.blockedOn != null));
    check(`${id}: has ≥1 section`, doc.sections.length > 0);
  }
  // DOCX is added only for cma & ic_memo.
  const docxTypes = entries.filter(([, d]) => d.formats.includes('docx')).map(([id]) => id).sort();
  check('DOCX only on cma & ic_memo', JSON.stringify(docxTypes) === JSON.stringify(['cma', 'ic_memo']), docxTypes.join(', '));
  // Exactly one representative-dependent type stays blocked: pro_forma_summary
  // (on paid CoStar). portfolio_risk_report was built in Phase 3, and the two
  // declared-but-unbuilt duplicates were deleted, so the count is 16, not 18.
  const blocked = entries.filter(([, d]) => d.status === 'blocked').map(([id]) => id).sort();
  check('blocked = pro_forma_summary',
    JSON.stringify(blocked) === JSON.stringify(['pro_forma_summary']), blocked.join(', '));

  // -----------------------------------------------------------------------
  console.log('\n[2] Monotonic tier gate');
  check('free generates nothing (tax_appeal)', canGenerate('free', 'community') === false);
  check('free generates nothing (ic_memo)', canGenerate('free', 'portfolio') === false);
  check('community CAN generate tax_appeal (community-home)', canGenerate('community', 'community') === true);
  check('community CANNOT generate ic_memo (portfolio-home)', canGenerate('community', 'portfolio') === false);
  check('portfolio CAN generate ic_memo', canGenerate('portfolio', 'portfolio') === true);
  check('portfolio CAN generate tax_appeal (home & above)', canGenerate('portfolio', 'community') === true);
  check('transaction CANNOT generate development-home doc', canGenerate('transaction', 'development') === false);
  check('development CAN generate transaction-home doc', canGenerate('development', 'transaction') === true);
  // allowedPlansFor is exactly home-and-above.
  check('allowedPlansFor(community) = all 4', allowedPlansFor('community').length === 4);
  check('allowedPlansFor(portfolio) = [portfolio]',
    JSON.stringify(allowedPlansFor('portfolio')) === JSON.stringify(['portfolio']));

  // -----------------------------------------------------------------------
  console.log('\n[3] Live assembly — tax_appeal_packet');
  const taxDoc = getDocumentType('tax_appeal_packet')!;
  const res = await assembleDocumentData(address, taxDoc.requiredBlocks);
  if (!res.ok) {
    check('assembly succeeded', false, `${res.status}: ${res.error}`);
  } else {
    const d = res.data;
    console.log(`  resolved: ${d.resolved_address.normalized} | bbl ${d.resolved_address.bbl}`);
    check('required blocks all present', taxDoc.requiredBlocks.every((b) => d.blocks[b] != null));
    for (const b of taxDoc.requiredBlocks) {
      const blk = d.blocks[b]!;
      console.log(`    · ${b}: provenance=${blk.provenance} ok=${blk.ok} source="${blk.source}"`);
      check(`  ${b}: carries a source string`, !!blk.source);
    }
    check('overall_provenance is live or representative', ['live', 'representative'].includes(d.overall_provenance), d.overall_provenance);

    // Provenance appendix
    const appendix = buildProvenanceAppendix(d);
    check('appendix has one row per fetched block', appendix.rows.length === Object.keys(d.blocks).length);
    check('appendix.overall matches data.overall', appendix.overall === d.overall_provenance);
    check('every appendix row has source + provenance', appendix.rows.every((r) => r.source && r.provenance));
    console.log(`  appendix.overall_note: ${appendix.overall_note.slice(0, 80)}...`);
  }

  // -----------------------------------------------------------------------
  console.log('\n[4] Non-bypassable disclaimer');
  check('disclaimer verbatim', DOCUMENT_DISCLAIMER ===
    'Informational only. Generated from public data by automated analysis. Not professional real estate, legal, tax, or appraisal advice.');

  console.log(`\n${failures === 0 ? '✓ ALL PASSED' : `✗ ${failures} CHECK(S) FAILED`}\n`);
  process.exit(failures === 0 ? 0 : 1);
})();
