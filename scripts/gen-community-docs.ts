// Generate the three Community documents on a real NYC address (pre-commit
// verification). Mirrors the /api/documents dispatch minus auth/guard/db.
// Usage: npx tsx scripts/gen-community-docs.ts ["1318 Clay Avenue, Bronx, NY"]

import { loadEnv } from './_loadenv';
loadEnv();

import { writeFileSync } from 'fs';
import { assembleDocumentData } from '../lib/documents/assembler';
import { getDocumentType } from '../lib/documents/registry';
import { buildProvenanceAppendix } from '../lib/documents/disclaimer';
import { renderPdf } from '../lib/documents/render/pdf';
import type { Letterhead } from '../lib/documents/types';
import {
  extractPropertyIntelligenceFacts,
  generateTrajectory,
  buildPropertyIntelligenceModel,
  propertyIntelligenceAppendix,
} from '../lib/documents/builders/property-intelligence';
import { extractViolationRecordFacts, buildViolationRecordModel } from '../lib/documents/builders/violation-record';
import { extractPermitHistoryFacts, buildPermitHistoryModel } from '../lib/documents/builders/permit-history';

const ADDRESS = process.argv[2] ?? '1318 Clay Avenue, Bronx, NY';
const generatedAt = new Date().toISOString();
const LH: Letterhead = {
  full_name: null, company_name: null, license_number: null,
  phone: null, contact_email: null, logo_url: null, headshot_url: null,
};

(async () => {
  // 1 — Property Intelligence Report (FRESH — exercises the real synthesis call)
  {
    const doc = getDocumentType('property_intelligence_report')!;
    const r = await assembleDocumentData(ADDRESS, doc.requiredBlocks);
    if (!r.ok) throw new Error('PI assemble: ' + r.error);
    const ex = extractPropertyIntelligenceFacts(r.data);
    if (!ex.ok) throw new Error('PI extract: ' + ex.error);
    const trajectory = await generateTrajectory(ex.facts);
    const appendix = propertyIntelligenceAppendix(r.data, ex.facts.demoLive);
    const model = buildPropertyIntelligenceModel({ facts: ex.facts, letterhead: LH, trajectory, appendix, generatedAt });
    const pdf = await renderPdf(model);
    writeFileSync('koano-property-intelligence-clay.pdf', pdf);
    console.log(`property_intelligence  → ${pdf.length} bytes | provenance=${appendix.overall} | demoLive=${ex.facts.demoLive} | sections=${model.sections.length}`);
    console.log('  trajectory paras:', trajectory.length, '| ~words:', trajectory.join(' ').split(/\s+/).length);
  }

  // 2 — Violation & Ownership Record (deterministic)
  {
    const doc = getDocumentType('violation_ownership_record')!;
    const r = await assembleDocumentData(ADDRESS, doc.requiredBlocks);
    if (!r.ok) throw new Error('VR assemble: ' + r.error);
    const ex = extractViolationRecordFacts(r.data);
    if (!ex.ok) throw new Error('VR extract: ' + ex.error);
    const model = buildViolationRecordModel({ facts: ex.facts, letterhead: LH, appendix: buildProvenanceAppendix(r.data), generatedAt });
    const pdf = await renderPdf(model);
    writeFileSync('koano-violation-record-clay.pdf', pdf);
    console.log(`violation_record       → ${pdf.length} bytes | provenance=${r.data.overall_provenance} | violations listed=${ex.facts.allItems.length} | portfolio buildings=${ex.facts.buildings.length}`);
  }

  // 3 — Permit History Report (deterministic)
  {
    const doc = getDocumentType('permit_history_report')!;
    const r = await assembleDocumentData(ADDRESS, doc.requiredBlocks);
    if (!r.ok) throw new Error('PH assemble: ' + r.error);
    const ex = extractPermitHistoryFacts(r.data);
    if (!ex.ok) throw new Error('PH extract: ' + ex.error);
    const model = buildPermitHistoryModel({ facts: ex.facts, letterhead: LH, appendix: buildProvenanceAppendix(r.data), generatedAt });
    const pdf = await renderPdf(model);
    writeFileSync('koano-permit-history-clay.pdf', pdf);
    console.log(`permit_history         → ${pdf.length} bytes | provenance=${r.data.overall_provenance} | permits listed=${ex.facts.allPermits.length}`);
  }

  console.log('\nWrote 3 PDFs to project root.');
})();
