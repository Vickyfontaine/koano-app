// Phase 0 acceptance runs (KOANO_BUILD_SPEC.md, Phase 0):
//   coop     a co-op prints "no unit-comparable valuation available" (no model
//            call: the real pricing-sheet path on the live public record).
//   chicago  a Chicago address saves its verdict (ONE live analysis): the full
//            pipeline, persistVerdict under the test user, then the stored row
//            is read back.
// Evidence goes to build-log/phase-0/.
//   npx tsx scripts/acceptance-phase0.ts coop|chicago
import { writeFileSync } from 'node:fs';
import { loadEnv } from './_loadenv';
loadEnv();
import { getDocumentType } from '../lib/documents/registry';
import { assembleDocumentData } from '../lib/documents/assembler';
import { extractPricingFacts, buildPricingModel } from '../lib/documents/builders/pricing-sheet';
import { buildProvenanceAppendix } from '../lib/documents/disclaimer';
import { renderPdf } from '../lib/documents/render/pdf';
import { runKoanoPipeline } from '../lib/agents/synthesis';
import { persistVerdict } from '../lib/supabase/verdicts';
import { supabaseAdmin } from '../lib/supabase/server';

const which = process.argv[2];

async function coop() {
  const address = '78 8th Avenue, Brooklyn, NY 11215'; // DOF building class D4 (elevator co-op), 58 units
  const doc = getDocumentType('pricing_recommendation_sheet')!;
  const r = await assembleDocumentData(address, doc.requiredBlocks);
  if (!r.ok) throw new Error(r.error);
  const ex = extractPricingFacts(r.data);
  if (!ex.ok) throw new Error(ex.error);
  const model = buildPricingModel({
    facts: ex.facts,
    letterhead: { full_name: null, company_name: null, license_number: null, phone: null, contact_email: null, logo_url: null, headshot_url: null },
    appendix: buildProvenanceAppendix(r.data),
    generatedAt: new Date().toISOString(),
  });
  const text = JSON.stringify(model);
  const found = /No unit-comparable valuation available/.test(text);
  const pdf = await renderPdf(model);
  writeFileSync('build-log/phase-0/coop-78-8th-ave-pricing-sheet.pdf', pdf);
  console.log(`co-op ${address}: building class ${ex.facts.buildingClass ?? '?'}; reason printed: ${found ? 'YES' : 'NO'}`);
  console.log(`   "${(ex.facts.valuationBlockedReason ?? '').slice(0, 160)}"`);
  if (!found) process.exit(1);
}

async function chicago() {
  const address = '233 S Wacker Dr, Chicago, IL 60606';
  const sb = supabaseAdmin();
  const { data: prof, error } = await sb.from('profiles').select('clerk_user_id').ilike('email', 'ui.sprint+clerk_test@koano.co').maybeSingle();
  if (error || !prof) throw new Error(`test user not found: ${error?.message ?? 'no row'}`);
  const t0 = Date.now();
  const { resolved_address, verdict } = await runKoanoPipeline(address);
  const saved = await persistVerdict({ clerkUserId: prof.clerk_user_id as string, addressInput: address, resolvedAddress: resolved_address, verdict });
  const row = saved.verdict_id
    ? await sb.from('verdicts').select('id, verdict, confidence, overall_provenance, bbl, address_normalized, created_at').eq('id', saved.verdict_id).maybeSingle()
    : null;
  const out = { address, seconds: Math.round((Date.now() - t0) / 1000), persisted: saved.persisted, persist_error: saved.persist_error ?? null, row: row?.data ?? null, row_error: row?.error?.message ?? null };
  writeFileSync('build-log/phase-0/chicago-verdict.json', JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
  if (!saved.persisted || !row?.data) process.exit(1);
}

(which === 'coop' ? coop() : which === 'chicago' ? chicago() : Promise.reject(new Error('usage: coop | chicago'))).catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
