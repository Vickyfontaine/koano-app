// Generate the Portfolio IC Memo (PDF + DOCX) on a real address (pre-commit
// verification). Runs the real KOANO pipeline to obtain a genuine verdict, then
// reconstructs the weighting breakdown from agent_summaries via the SAME helper
// the route uses (breakdownFromSummaries) — proving that path — and builds the
// memo. Also renders a backdated variant to show the staleness banner.
// Usage: npx tsx scripts/gen-ic-memo.ts ["175 3rd Street, Brooklyn, NY"]

import { loadEnv } from './_loadenv';
loadEnv();

import { writeFileSync } from 'fs';
import { runKoanoPipeline, breakdownFromSummaries } from '../lib/agents/synthesis';
import { assembleDocumentData } from '../lib/documents/assembler';
import { getDocumentType } from '../lib/documents/registry';
import { renderPdf } from '../lib/documents/render/pdf';
import { renderDocx } from '../lib/documents/render/docx';
import type { Letterhead } from '../lib/documents/types';
import {
  extractIcMemoFacts,
  generateExecSummary,
  buildIcMemoModel,
  icMemoAppendix,
  type IcMemoVerdict,
} from '../lib/documents/builders/ic-memo';

const ADDRESS = process.argv[2] ?? '175 3rd Street, Brooklyn, NY';
const generatedAt = new Date().toISOString();
const LH: Letterhead = {
  full_name: 'Analyst Name', company_name: 'KOANO Capital Partners', license_number: null,
  phone: null, contact_email: null, logo_url: null, headshot_url: null,
};

function icVerdictFrom(pipeVerdict: Awaited<ReturnType<typeof runKoanoPipeline>>['verdict'], verdictGeneratedAt: string): IcMemoVerdict {
  // Reconstruct the breakdown from agent_summaries — the exact path the route
  // takes on a STORED verdict (which does not persist weighting_breakdown).
  const breakdown = breakdownFromSummaries(pipeVerdict.agent_summaries, pipeVerdict.verdict);
  // Sanity: reconstruction must match the live-computed breakdown.
  if (breakdown.aggregate_score !== pipeVerdict.weighting_breakdown.aggregate_score) {
    throw new Error(`reconstruction mismatch: ${breakdown.aggregate_score} vs ${pipeVerdict.weighting_breakdown.aggregate_score}`);
  }
  return {
    verdict: pipeVerdict.verdict,
    confidence: pipeVerdict.confidence,
    risk_score: pipeVerdict.risk_score,
    signal_window_months: pipeVerdict.signal_window_months,
    headline: pipeVerdict.headline,
    overall_provenance: pipeVerdict.overall_provenance,
    reasoning_chain: pipeVerdict.reasoning_chain,
    breakdown,
    verdictGeneratedAt,
  };
}

(async () => {
  console.log(`Running the KOANO pipeline on ${ADDRESS} (…~60s)…`);
  const { verdict: pipeVerdict } = await runKoanoPipeline(ADDRESS);
  console.log(`  verdict: ${pipeVerdict.verdict.toUpperCase()} conf ${pipeVerdict.confidence} risk ${pipeVerdict.risk_score} | score ${pipeVerdict.weighting_breakdown.aggregate_score}`);

  const doc = getDocumentType('ic_memo')!;
  const r = await assembleDocumentData(ADDRESS, doc.requiredBlocks);
  if (!r.ok) throw new Error('assemble: ' + r.error);

  // --- Primary memo: fresh verdict (age 0) ---
  const icVerdict = icVerdictFrom(pipeVerdict, generatedAt);
  const ex = extractIcMemoFacts(r.data, icVerdict);
  if (!ex.ok) throw new Error('extract: ' + ex.error);
  const execSummary = await generateExecSummary(ex.facts);
  const appendix = icMemoAppendix(r.data, ex.facts.demoLive, icVerdict.overall_provenance, icVerdict.verdictGeneratedAt);
  const model = buildIcMemoModel({ facts: ex.facts, letterhead: LH, execSummary, appendix, generatedAt });
  const pdf = await renderPdf(model);
  const docx = await renderDocx(model);
  writeFileSync('koano-ic-memo-175-3rd.pdf', pdf);
  writeFileSync('koano-ic-memo-175-3rd.docx', docx);
  console.log(`\nic_memo (fresh verdict) → PDF ${pdf.length}b, DOCX ${docx.length}b | provenance=${appendix.overall} | demoLive=${ex.facts.demoLive} | sections=${model.sections.length}`);
  console.log('  exec summary words:', execSummary.join(' ').split(/\s+/).length);

  // --- Staleness variant: backdate the verdict 40 days to trigger the banner ---
  const stale = new Date(new Date(generatedAt).getTime() - 40 * 86_400_000).toISOString();
  const staleVerdict = icVerdictFrom(pipeVerdict, stale);
  const exS = extractIcMemoFacts(r.data, staleVerdict);
  if (!exS.ok) throw new Error('stale extract: ' + exS.error);
  const staleModel = buildIcMemoModel({ facts: exS.facts, letterhead: LH, execSummary, appendix, generatedAt });
  writeFileSync('koano-ic-memo-175-3rd-STALE.pdf', await renderPdf(staleModel));
  console.log(`ic_memo (40-day-old verdict) → wrote STALE variant | banner=${staleModel.stalenessBanner ? 'shown' : 'none'}`);

  console.log('\nWrote PDF + DOCX (+ stale PDF) to project root.');
})();
