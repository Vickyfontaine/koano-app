// Generate the two Portfolio documents (Monday Briefing PDF, Asset One-Pager)
// on real data, and verify the Portfolio Risk Report stays blocked.
// Usage: npx tsx scripts/gen-portfolio-docs.ts

import { loadEnv } from './_loadenv';
loadEnv();

import { writeFileSync } from 'fs';
import { runKoanoPipeline, breakdownFromSummaries } from '../lib/agents/synthesis';
import { generateBriefing, type BriefingProperty } from '../lib/agents/briefing';
import { assembleDocumentData } from '../lib/documents/assembler';
import { getDocumentType } from '../lib/documents/registry';
import { IMPLEMENTED_DOC_TYPE_SET } from '../lib/documents/implemented';
import { appendixWithVerdict } from '../lib/documents/disclaimer';
import { renderPdf } from '../lib/documents/render/pdf';
import type { Letterhead } from '../lib/documents/types';
import { buildMondayBriefingModel } from '../lib/documents/builders/monday-briefing';
import { extractOnePagerFacts, buildOnePagerModel } from '../lib/documents/builders/asset-one-pager';
import type { IcMemoVerdict } from '../lib/documents/builders/ic-memo';

const generatedAt = new Date().toISOString();
const LH: Letterhead = {
  full_name: 'Portfolio Analyst', company_name: 'KOANO Capital Partners', license_number: null,
  phone: null, contact_email: null, logo_url: null, headshot_url: null,
};

(async () => {
  console.log('Running the pipeline on 175 3rd Street for a real verdict (~60s)…');
  const { verdict: pv } = await runKoanoPipeline('175 3rd Street, Brooklyn, NY');
  console.log(`  verdict: ${pv.verdict.toUpperCase()} conf ${pv.confidence} risk ${pv.risk_score}`);

  const icVerdict: IcMemoVerdict = {
    verdict: pv.verdict, confidence: pv.confidence, risk_score: pv.risk_score,
    signal_window_months: pv.signal_window_months, headline: pv.headline,
    overall_provenance: pv.overall_provenance, reasoning_chain: pv.reasoning_chain,
    breakdown: breakdownFromSummaries(pv.agent_summaries, pv.verdict), verdictGeneratedAt: generatedAt,
  };

  // --- 1. Monday Briefing PDF (reuses generateBriefing verbatim) ---
  const portfolio: BriefingProperty[] = [
    {
      address: '175 3rd Street, Brooklyn, NY', bbl: '3009720058',
      latest_verdict: {
        verdict: pv.verdict, confidence: pv.confidence, risk_score: pv.risk_score,
        overall_provenance: pv.overall_provenance, headline: pv.headline, created_at: generatedAt,
      },
    },
    { address: '47-07 Vernon Blvd, Long Island City, NY', bbl: null, latest_verdict: null },
  ];
  const briefing = await generateBriefing(portfolio);
  const briefingModel = buildMondayBriefingModel({ result: briefing, portfolioSize: portfolio.length, letterhead: LH, generatedAt });
  const briefingPdf = await renderPdf(briefingModel);
  writeFileSync('koano-monday-briefing.pdf', briefingPdf);
  console.log(`\nmonday_briefing_pdf → ${briefingPdf.length}b | provenance=${briefing.overall_provenance} | sources=${briefing.source_provenance.length} | sections=${briefingModel.sections.length}`);

  // --- 2. Asset One-Pager (deterministic, strictly one page) ---
  const r = await assembleDocumentData('175 3rd Street, Brooklyn, NY', getDocumentType('asset_one_pager')!.requiredBlocks);
  if (!r.ok) throw new Error('assemble: ' + r.error);
  const ex = extractOnePagerFacts(r.data, icVerdict);
  if (!ex.ok) throw new Error('extract: ' + ex.error);
  const appendix = appendixWithVerdict(r.data, { verdict: { provenance: icVerdict.overall_provenance, generatedAt: icVerdict.verdictGeneratedAt } });
  const oneModel = buildOnePagerModel({ facts: ex.facts, letterhead: LH, appendix, generatedAt });
  const onePdf = await renderPdf(oneModel);
  writeFileSync('koano-asset-one-pager.pdf', onePdf);
  console.log(`asset_one_pager → ${onePdf.length}b | provenance=${appendix.overall}`);

  // --- 3. Verify the Portfolio Risk Report stays blocked ---
  const prr = getDocumentType('portfolio_risk_report')!;
  console.log(`\nportfolio_risk_report → status=${prr.status} | blockedOn=${prr.blockedOn} | implemented=${IMPLEMENTED_DOC_TYPE_SET.has('portfolio_risk_report')}`);
  // Replicate the route's blocked response (the route returns this BEFORE any build):
  if (prr.status === 'blocked') {
    console.log('  route would return HTTP 409:', JSON.stringify({
      error: `The ${prr.title} is not available yet — it depends on a data source (${prr.blockedOn}) that is representative until funded.`,
      blocked_on: prr.blockedOn,
    }));
  }

  console.log('\nWrote 2 PDFs to project root.');
})();
