// Generate the 3 Transaction docs + the Entitlement memo on real addresses.
// Usage: npx tsx scripts/gen-transaction-docs.ts

import { loadEnv } from './_loadenv';
loadEnv();

import { writeFileSync } from 'fs';
import { assembleDocumentData } from '../lib/documents/assembler';
import { getDocumentType } from '../lib/documents/registry';
import { buildProvenanceAppendix, appendixWithVerdict } from '../lib/documents/disclaimer';
import { renderPdf } from '../lib/documents/render/pdf';
import { runGroundedNarrative } from '../lib/documents/narrative';
import type { Letterhead } from '../lib/documents/types';
import { extractPricingFacts, buildPricingModel } from '../lib/documents/builders/pricing-sheet';
import { extractNetSheetFacts, buildNetSheetModel } from '../lib/documents/builders/net-sheet';
import {
  extractNeighborhoodFacts, neighborhoodDataPoints, neighborhoodFactsForModel,
  deterministicNeighborhoodNarrative, buildNeighborhoodModel, NEIGHBORHOOD_SYSTEM_PROMPT,
} from '../lib/documents/builders/client-neighborhood';
import {
  extractEntitlementFacts, entitlementDataPoints, entitlementFactsForModel,
  deterministicEntitlementNarrative, buildEntitlementModel, ENTITLEMENT_SYSTEM_PROMPT,
} from '../lib/documents/builders/entitlement-memo';

const RESI = process.argv[2] ?? '369 6th Street, Brooklyn, NY';
const DEV = '175 3rd Street, Brooklyn, NY';
const generatedAt = new Date().toISOString();
const LH: Letterhead = {
  full_name: 'Jordan Rivera', company_name: 'Rivera Residential', license_number: 'NY-10401987',
  phone: '(718) 555-0199', contact_email: 'jordan@riverares.example', logo_url: null, headshot_url: null,
};

async function assemble(addr: string, docId: string) {
  const r = await assembleDocumentData(addr, getDocumentType(docId)!.requiredBlocks);
  if (!r.ok) throw new Error(`${docId} @ ${addr}: ${r.error}`);
  return r.data;
}

(async () => {
  // 1 — Client Neighborhood Report (fresh grounded narrative)
  {
    const data = await assemble(RESI, 'client_neighborhood_report');
    const ex = extractNeighborhoodFacts(data);
    if (!ex.ok) throw new Error('neighborhood: ' + ex.error);
    const narrative = await runGroundedNarrative({
      systemPrompt: NEIGHBORHOOD_SYSTEM_PROMPT, factsPayload: neighborhoodFactsForModel(ex.facts),
      allowedDataPoints: neighborhoodDataPoints(ex.facts), addressLabel: ex.facts.addressLabel,
      deterministicFallback: deterministicNeighborhoodNarrative(ex.facts),
    });
    const appendix = appendixWithVerdict(data, { dropDemographicsIfNotLive: true, demoLive: ex.facts.demoLive });
    const pdf = await renderPdf(buildNeighborhoodModel({ facts: ex.facts, letterhead: LH, narrative, appendix, generatedAt }));
    writeFileSync('koano-client-neighborhood.pdf', pdf);
    console.log(`client_neighborhood_report → ${pdf.length}b | ${RESI} | provenance=${appendix.overall} | demoLive=${ex.facts.demoLive} | narrative paras=${narrative.length}`);
  }
  // 2 — Pricing Recommendation Sheet
  {
    const data = await assemble(RESI, 'pricing_recommendation_sheet');
    const ex = extractPricingFacts(data);
    if (!ex.ok) throw new Error('pricing: ' + ex.error);
    const pdf = await renderPdf(buildPricingModel({ facts: ex.facts, letterhead: LH, appendix: buildProvenanceAppendix(data), generatedAt }));
    writeFileSync('koano-pricing-sheet.pdf', pdf);
    console.log(`pricing_recommendation_sheet → ${pdf.length}b | band $${Math.round(ex.facts.lowValue ?? 0).toLocaleString()}–$${Math.round(ex.facts.highValue ?? 0).toLocaleString()} | psf p25/med/p75 ${Math.round(ex.facts.p25Psf)}/${Math.round(ex.facts.medianPsf)}/${Math.round(ex.facts.p75Psf)}`);
  }
  // 3 — Buyer/Seller Net Sheet
  {
    const data = await assemble(RESI, 'buyer_seller_net_sheet');
    const ex = extractNetSheetFacts(data);
    if (!ex.ok) throw new Error('net: ' + ex.error);
    const pdf = await renderPdf(buildNetSheetModel({ facts: ex.facts, letterhead: LH, appendix: buildProvenanceAppendix(data), generatedAt }));
    writeFileSync('koano-net-sheet.pdf', pdf);
    console.log(`buyer_seller_net_sheet → ${pdf.length}b | indicative $${Math.round(ex.facts.indicativeValue ?? 0).toLocaleString()}`);
  }
  // 4 — Entitlement Risk Memo (fresh grounded narrative) on the dev site
  {
    const data = await assemble(DEV, 'entitlement_risk_memo');
    const ex = extractEntitlementFacts(data);
    if (!ex.ok) throw new Error('entitlement: ' + ex.error);
    const narrative = await runGroundedNarrative({
      systemPrompt: ENTITLEMENT_SYSTEM_PROMPT, factsPayload: entitlementFactsForModel(ex.facts),
      allowedDataPoints: entitlementDataPoints(ex.facts), addressLabel: ex.facts.addressLabel,
      deterministicFallback: deterministicEntitlementNarrative(ex.facts),
    });
    const pdf = await renderPdf(buildEntitlementModel({ facts: ex.facts, letterhead: { ...LH, company_name: 'Rivera Development' }, narrative, appendix: buildProvenanceAppendix(data), generatedAt }));
    writeFileSync('koano-entitlement-memo.pdf', pdf);
    const blob = (narrative.join(' ')).toLowerCase();
    console.log(`entitlement_risk_memo → ${pdf.length}b | ${DEV} | CD ${ex.facts.communityDistrict} ratio ${ex.facts.approvalRatioPct}% | subject filings=${ex.facts.subjectFilingCount} | narrative clean=${!['gowanus','superfund','inclusionary'].some(t=>blob.includes(t))}`);
  }
  console.log('\nWrote 4 PDFs to project root.');
})();
