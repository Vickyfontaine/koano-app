// KOANO documents API — the document engine's single endpoint.
// POST { docType, address, format?, buildSource?, verdictId? }
//   → generates a professional document and streams it as a file download.
//
// Runtime = nodejs (the pure-JS renderers need Node APIs; never Edge).
// Flow: auth → validate docType/format/status → guardDocument (tier + doc cap
// + content meter for fresh) → assemble live data → build model → render →
// log an append-only documents row (audit + cap counter) → stream the file.

import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase/server';
import { getDocumentType } from '../../../../lib/documents/registry';
import { IMPLEMENTED_DOC_TYPE_SET } from '../../../../lib/documents/implemented';
import { guardDocument } from '../../../../lib/documents/guard';
import { assembleDocumentData, getLetterhead } from '../../../../lib/documents/assembler';
import type { DocumentData } from '../../../../lib/documents/types';
import { buildProvenanceAppendix, appendixWithVerdict } from '../../../../lib/documents/disclaimer';
import { renderPdf } from '../../../../lib/documents/render/pdf';
import { renderDocx } from '../../../../lib/documents/render/docx';
import type { RenderModel } from '../../../../lib/documents/render/model';
import type { BuildSource, DocumentFormat } from '../../../../lib/documents/types';
import type { Provenance } from '../../../../lib/providers/types';
import {
  extractTaxAppealFacts,
  deterministicArgument,
  generateTaxAppealArgument,
  buildTaxAppealModel,
} from '../../../../lib/documents/builders/tax-appeal';
import {
  extractScreeningFacts,
  computeVerdict,
  deterministicReasoning,
  generateScreeningReasoning,
  buildScreeningModel,
} from '../../../../lib/documents/builders/site-screening';
import {
  buildComparisonModel,
  deterministicComparisonReasoning,
  generateComparisonReasoning,
  type ComparisonSite,
} from '../../../../lib/documents/builders/site-comparison';
import {
  extractPropertyIntelligenceFacts,
  deterministicTrajectory,
  generateTrajectory,
  buildPropertyIntelligenceModel,
  propertyIntelligenceAppendix,
} from '../../../../lib/documents/builders/property-intelligence';
import {
  extractViolationRecordFacts,
  buildViolationRecordModel,
} from '../../../../lib/documents/builders/violation-record';
import {
  extractPermitHistoryFacts,
  buildPermitHistoryModel,
} from '../../../../lib/documents/builders/permit-history';
import {
  extractIcMemoFacts,
  deterministicExecSummary,
  generateExecSummary,
  buildIcMemoModel,
  icMemoAppendix,
  type IcMemoVerdict,
} from '../../../../lib/documents/builders/ic-memo';
import { breakdownFromSummaries, type AgentSummary } from '../../../../lib/agents/synthesis';
import type { Verdict, ReasoningStep } from '../../../../lib/agents/shared';
import { extractOnePagerFacts, buildOnePagerModel } from '../../../../lib/documents/builders/asset-one-pager';
import { buildMondayBriefingModel } from '../../../../lib/documents/builders/monday-briefing';
import { generateBriefing, type BriefingProperty } from '../../../../lib/agents/briefing';
import { runGroundedNarrative } from '../../../../lib/documents/narrative';
import { appendixWithVerdict as sharedAppendix } from '../../../../lib/documents/disclaimer';
import { extractPricingFacts, buildPricingModel } from '../../../../lib/documents/builders/pricing-sheet';
import {
  extractCmaFacts, buildCmaModel, deterministicCmaNarrative, cmaDataPoints, cmaFactsForModel, CMA_SYSTEM_PROMPT,
} from '../../../../lib/documents/builders/cma';
import { extractPortfolioRiskRow, buildPortfolioRiskModel } from '../../../../lib/documents/builders/portfolio-risk-report';
import { extractNetSheetFacts, buildNetSheetModel } from '../../../../lib/documents/builders/net-sheet';
import {
  extractNeighborhoodFacts,
  neighborhoodDataPoints,
  neighborhoodFactsForModel,
  deterministicNeighborhoodNarrative,
  buildNeighborhoodModel,
  NEIGHBORHOOD_SYSTEM_PROMPT,
} from '../../../../lib/documents/builders/client-neighborhood';
import {
  extractEntitlementFacts,
  entitlementDataPoints,
  entitlementFactsForModel,
  deterministicEntitlementNarrative,
  buildEntitlementModel,
  ENTITLEMENT_SYSTEM_PROMPT,
} from '../../../../lib/documents/builders/entitlement-memo';

// Load the user's tracked portfolio (properties + each one's latest verdict),
// mirroring /api/briefing so the Monday Briefing PDF is the same briefing.
async function loadPortfolio(userId: string): Promise<BriefingProperty[]> {
  const db = supabaseAdmin();
  const [propsRes, verdictsRes] = await Promise.all([
    db.from('properties').select('address_normalized, address_input, bbl').eq('clerk_user_id', userId).order('created_at', { ascending: true }),
    db.from('verdicts').select('bbl, address_normalized, verdict, confidence, risk_score, overall_provenance, headline, created_at').eq('clerk_user_id', userId).order('created_at', { ascending: false }).limit(200),
  ]);
  const verdicts = verdictsRes.data ?? [];
  return (propsRes.data ?? []).map((p) => {
    const latest = verdicts.find(
      (v) => (p.bbl && v.bbl === p.bbl) || (p.address_normalized && v.address_normalized === p.address_normalized),
    );
    return {
      address: p.address_normalized ?? p.address_input,
      bbl: p.bbl,
      latest_verdict: latest
        ? {
            verdict: latest.verdict,
            confidence: latest.confidence,
            risk_score: latest.risk_score,
            overall_provenance: latest.overall_provenance,
            headline: latest.headline,
            created_at: latest.created_at,
          }
        : null,
    };
  });
}

// Load the user's most recent stored verdict for a resolved address (by BBL,
// falling back to the normalized string). The IC memo reuses this verdict — the
// committee sees exactly what the analyst brought forward — so a missing verdict
// is a clean 422, never a silently-run fresh analysis.
async function loadLatestVerdict(
  userId: string,
  bbl: string | null,
  addressNormalized: string | null,
): Promise<IcMemoVerdict | null> {
  const cols =
    'verdict, confidence, risk_score, signal_window_months, headline, overall_provenance, reasoning_chain, agent_summaries, created_at';
  const db = supabaseAdmin();
  let row: Record<string, unknown> | null = null;
  if (bbl) {
    const { data } = await db
      .from('verdicts')
      .select(cols)
      .eq('clerk_user_id', userId)
      .eq('bbl', bbl)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    row = data ?? null;
  }
  if (!row && addressNormalized) {
    const { data } = await db
      .from('verdicts')
      .select(cols)
      .eq('clerk_user_id', userId)
      .eq('address_normalized', addressNormalized)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    row = data ?? null;
  }
  if (!row) return null;

  const summaries = (row.agent_summaries as AgentSummary[]) ?? [];
  const verdict = row.verdict as Verdict;
  return {
    verdict,
    confidence: row.confidence as number,
    risk_score: row.risk_score as number,
    signal_window_months: row.signal_window_months as number,
    headline: (row.headline as string) ?? '',
    overall_provenance: row.overall_provenance as IcMemoVerdict['overall_provenance'],
    reasoning_chain: (row.reasoning_chain as ReasoningStep[]) ?? [],
    breakdown: breakdownFromSummaries(summaries, verdict),
    verdictGeneratedAt: row.created_at as string,
  };
}

// Deterministic documents (no model call) → always the verdict path, never a
// content charge. Evidentiary Community docs + the deterministic asset one-pager.
const DETERMINISTIC_DOC_TYPES = new Set([
  'violation_ownership_record',
  'permit_history_report',
  'asset_one_pager',
  'pricing_recommendation_sheet',
  'buyer_seller_net_sheet',
]);

// Always-generate documents: they inherently make one narrative call every time
// (no stored artifact to reuse), so force the fresh path so the guard meters the
// generation. The Monday Briefing PDF reruns generateBriefing each export.
const ALWAYS_GENERATE_DOC_TYPES = new Set(['monday_briefing_pdf']);

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

function filenameFor(docType: string, bbl: string | null, format: DocumentFormat): string {
  const slug = bbl ? bbl : 'property';
  return `koano-${docType.replace(/_/g, '-')}-${slug}.${format}`;
}

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: {
    docType?: unknown;
    address?: unknown;
    addresses?: unknown;
    format?: unknown;
    buildSource?: unknown;
    verdictId?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const docTypeId = typeof body.docType === 'string' ? body.docType : '';
  const address = typeof body.address === 'string' ? body.address.trim() : '';
  const addresses = Array.isArray(body.addresses)
    ? body.addresses.filter((a): a is string => typeof a === 'string' && a.trim().length > 0).map((a) => a.trim())
    : [];

  const doc = getDocumentType(docTypeId);
  if (!doc) return NextResponse.json({ error: `Unknown document type "${docTypeId}"` }, { status: 404 });

  // Address requirement is scope-aware: multi_site takes up to 3 addresses;
  // portfolio operates on the user's tracked properties and needs no address.
  if (doc.scope === 'multi_site') {
    if (addresses.length === 0) {
      return NextResponse.json({ error: '"addresses" (1–3) is required for this document' }, { status: 400 });
    }
  } else if (doc.scope === 'portfolio') {
    // no address required
  } else if (!address) {
    return NextResponse.json({ error: '"address" is required' }, { status: 400 });
  }

  // Blocked-by-design types never ship. Two reasons: a representative-provider
  // dependency (blockedOn set), or a not-yet-wired builder (blockedOn absent).
  if (doc.status === 'blocked') {
    return NextResponse.json(
      {
        error: doc.blockedOn
          ? `The ${doc.title} is not available yet — it depends on a data source (${doc.blockedOn}) that is representative until funded.`
          : `The ${doc.title} is not available yet.`,
        blocked_on: doc.blockedOn ?? null,
      },
      { status: 409 },
    );
  }
  if (!IMPLEMENTED_DOC_TYPE_SET.has(doc.id)) {
    return NextResponse.json(
      { error: `The ${doc.title} is declared but its renderer is not built yet.` },
      { status: 501 },
    );
  }

  const format: DocumentFormat = body.format === 'docx' ? 'docx' : 'pdf';
  if (!doc.formats.includes(format)) {
    return NextResponse.json(
      { error: `${doc.title} does not support ${format}. Supported: ${doc.formats.join(', ')}.` },
      { status: 400 },
    );
  }

  // Deterministic docs force the verdict path (no charge); always-generate docs
  // force fresh (so the one narrative call is metered); otherwise honor the body.
  const buildSource: BuildSource = DETERMINISTIC_DOC_TYPES.has(doc.id)
    ? 'verdict'
    : ALWAYS_GENERATE_DOC_TYPES.has(doc.id)
      ? 'fresh'
      : body.buildSource === 'verdict'
        ? 'verdict'
        : 'fresh';
  const verdictId = typeof body.verdictId === 'string' ? body.verdictId : null;

  // Guard: tier gate → doc cap → content meter (fresh only). Fails closed.
  const guard = await guardDocument({ userId, doc, buildSource, route: '/api/documents' });
  if (!guard.ok) return NextResponse.json(guard.body, { status: guard.status });

  const letterhead = await getLetterhead(userId);
  const generatedAt = new Date().toISOString();

  // Per-type build → a RenderModel plus the audit fields. Every branch asserts
  // its own provenance (from the blocks it actually uses).
  let model: RenderModel;
  let addressInput: string;
  let bbl: string | null;
  let overallProvenance: Provenance;

  try {
    if (doc.id === 'three_site_comparison_brief') {
      const sites: ComparisonSite[] = [];
      for (const a of addresses.slice(0, 3)) {
        const r = await assembleDocumentData(a, doc.requiredBlocks);
        if (!r.ok) return NextResponse.json({ error: `${a}: ${r.error}` }, { status: r.status });
        const ex = extractScreeningFacts(r.data);
        if (!ex.ok) return NextResponse.json({ error: `${a}: ${ex.error}` }, { status: 422 });
        sites.push({ address: a, data: r.data, facts: ex.facts, verdict: computeVerdict(ex.facts) });
      }
      const reasoning =
        buildSource === 'fresh' ? await generateComparisonReasoning(sites) : deterministicComparisonReasoning(sites);
      model = buildComparisonModel({ sites, letterhead, reasoning, generatedAt });
      addressInput = sites.map((s) => s.address).join(' | ');
      bbl = sites[0].facts.bbl;
      overallProvenance = model.appendix.overall;
    } else if (doc.id === 'site_screening_memo') {
      const r = await assembleDocumentData(address, doc.requiredBlocks);
      if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
      const ex = extractScreeningFacts(r.data);
      if (!ex.ok) return NextResponse.json({ error: ex.error }, { status: 422 });
      const verdict = computeVerdict(ex.facts);
      const reasoning =
        buildSource === 'fresh' ? await generateScreeningReasoning(ex.facts, verdict) : deterministicReasoning(ex.facts, verdict);
      model = buildScreeningModel({ data: r.data, facts: ex.facts, verdict, letterhead, reasoning, generatedAt });
      addressInput = r.data.resolved_address.input;
      bbl = r.data.resolved_address.bbl;
      overallProvenance = model.appendix.overall;
    } else if (doc.id === 'property_intelligence_report') {
      const r = await assembleDocumentData(address, doc.requiredBlocks);
      if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
      const ex = extractPropertyIntelligenceFacts(r.data);
      if (!ex.ok) return NextResponse.json({ error: ex.error }, { status: 422 });
      const trajectory =
        buildSource === 'fresh' ? await generateTrajectory(ex.facts) : deterministicTrajectory(ex.facts);
      const appendix = propertyIntelligenceAppendix(r.data, ex.facts.demoLive);
      model = buildPropertyIntelligenceModel({
        facts: ex.facts,
        letterhead,
        trajectory,
        appendix,
        generatedAt,
      });
      addressInput = r.data.resolved_address.input;
      bbl = r.data.resolved_address.bbl;
      overallProvenance = appendix.overall;
    } else if (doc.id === 'violation_ownership_record') {
      const r = await assembleDocumentData(address, doc.requiredBlocks);
      if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
      const ex = extractViolationRecordFacts(r.data);
      if (!ex.ok) return NextResponse.json({ error: ex.error }, { status: 422 });
      model = buildViolationRecordModel({
        facts: ex.facts,
        letterhead,
        appendix: buildProvenanceAppendix(r.data),
        generatedAt,
      });
      addressInput = r.data.resolved_address.input;
      bbl = r.data.resolved_address.bbl;
      overallProvenance = r.data.overall_provenance;
    } else if (doc.id === 'ic_memo') {
      const r = await assembleDocumentData(address, doc.requiredBlocks);
      if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
      const storedVerdict = await loadLatestVerdict(
        userId,
        r.data.resolved_address.bbl,
        r.data.resolved_address.normalized,
      );
      if (!storedVerdict) {
        return NextResponse.json(
          {
            error:
              'This memo is built from a completed KOANO analysis, and none exists for this property yet. Run the analysis first, then generate the memo.',
          },
          { status: 422 },
        );
      }
      const ex = extractIcMemoFacts(r.data, storedVerdict);
      if (!ex.ok) return NextResponse.json({ error: ex.error }, { status: 422 });
      const execSummary =
        buildSource === 'fresh' ? await generateExecSummary(ex.facts) : deterministicExecSummary(ex.facts);
      const appendix = icMemoAppendix(
        r.data,
        ex.facts.demoLive,
        storedVerdict.overall_provenance,
        storedVerdict.verdictGeneratedAt,
      );
      model = buildIcMemoModel({ facts: ex.facts, letterhead, execSummary, appendix, generatedAt });
      addressInput = r.data.resolved_address.input;
      bbl = r.data.resolved_address.bbl;
      overallProvenance = appendix.overall;
    } else if (doc.id === 'monday_briefing_pdf') {
      const portfolio = await loadPortfolio(userId);
      if (portfolio.length === 0) {
        return NextResponse.json(
          { error: 'No properties in your portfolio yet. Add properties first.' },
          { status: 422 },
        );
      }
      const result = await generateBriefing(portfolio); // the single narrative call
      model = buildMondayBriefingModel({ result, portfolioSize: portfolio.length, letterhead, generatedAt });
      addressInput = `Portfolio (${portfolio.length} propert${portfolio.length === 1 ? 'y' : 'ies'})`;
      bbl = null;
      overallProvenance = result.overall_provenance;
    } else if (doc.id === 'portfolio_risk_report') {
      const portfolio = await loadPortfolio(userId);
      if (portfolio.length === 0) {
        return NextResponse.json({ error: 'No properties in your portfolio yet. Add properties first.' }, { status: 422 });
      }
      // Deterministic risk grid across the portfolio. Cap the request-time fan-out
      // (each property fetches 5 hazard blocks incl. EPA, which is rate-limited).
      const rows = [];
      let appendixData: DocumentData | null = null;
      let weakest: Provenance = 'live';
      for (const p of portfolio.slice(0, 15)) {
        const r = await assembleDocumentData(p.address, doc.requiredBlocks);
        if (!r.ok) continue;
        rows.push(extractPortfolioRiskRow(r.data));
        appendixData = appendixData ?? r.data;
        if (r.data.overall_provenance === 'representative') weakest = 'representative';
      }
      if (rows.length === 0 || !appendixData) {
        return NextResponse.json({ error: 'None of your portfolio addresses could be resolved for a risk read.' }, { status: 422 });
      }
      const appendix = { ...buildProvenanceAppendix(appendixData), overall: weakest };
      model = buildPortfolioRiskModel({ rows, portfolioSize: portfolio.length, letterhead, appendix, generatedAt });
      addressInput = `Portfolio (${portfolio.length} propert${portfolio.length === 1 ? 'y' : 'ies'})`;
      bbl = null;
      overallProvenance = weakest;
    } else if (doc.id === 'asset_one_pager') {
      const r = await assembleDocumentData(address, doc.requiredBlocks);
      if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
      const storedVerdict = await loadLatestVerdict(
        userId,
        r.data.resolved_address.bbl,
        r.data.resolved_address.normalized,
      );
      if (!storedVerdict) {
        return NextResponse.json(
          {
            error:
              'The one-pager is built from a completed KOANO analysis, and none exists for this property yet. Run the analysis first, then generate the one-pager.',
          },
          { status: 422 },
        );
      }
      const ex = extractOnePagerFacts(r.data, storedVerdict);
      if (!ex.ok) return NextResponse.json({ error: ex.error }, { status: 422 });
      const appendix = appendixWithVerdict(r.data, {
        verdict: { provenance: storedVerdict.overall_provenance, generatedAt: storedVerdict.verdictGeneratedAt },
      });
      model = buildOnePagerModel({ facts: ex.facts, letterhead, appendix, generatedAt });
      addressInput = r.data.resolved_address.input;
      bbl = r.data.resolved_address.bbl;
      overallProvenance = appendix.overall;
    } else if (doc.id === 'permit_history_report') {
      const r = await assembleDocumentData(address, doc.requiredBlocks);
      if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
      const ex = extractPermitHistoryFacts(r.data);
      if (!ex.ok) return NextResponse.json({ error: ex.error }, { status: 422 });
      model = buildPermitHistoryModel({
        facts: ex.facts,
        letterhead,
        appendix: buildProvenanceAppendix(r.data),
        generatedAt,
      });
      addressInput = r.data.resolved_address.input;
      bbl = r.data.resolved_address.bbl;
      overallProvenance = r.data.overall_provenance;
    } else if (doc.id === 'pricing_recommendation_sheet') {
      const r = await assembleDocumentData(address, doc.requiredBlocks);
      if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
      const ex = extractPricingFacts(r.data);
      if (!ex.ok) return NextResponse.json({ error: ex.error }, { status: 422 });
      model = buildPricingModel({ facts: ex.facts, letterhead, appendix: buildProvenanceAppendix(r.data), generatedAt });
      addressInput = r.data.resolved_address.input;
      bbl = r.data.resolved_address.bbl;
      overallProvenance = r.data.overall_provenance;
    } else if (doc.id === 'cma') {
      const r = await assembleDocumentData(address, doc.requiredBlocks);
      if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
      const ex = extractCmaFacts(r.data);
      if (!ex.ok) return NextResponse.json({ error: ex.error }, { status: 422 });
      const narrative =
        buildSource === 'fresh'
          ? await runGroundedNarrative({
              systemPrompt: CMA_SYSTEM_PROMPT,
              factsPayload: cmaFactsForModel(ex.facts),
              allowedDataPoints: cmaDataPoints(ex.facts),
              addressLabel: ex.facts.addressLabel,
              deterministicFallback: deterministicCmaNarrative(ex.facts),
            })
          : deterministicCmaNarrative(ex.facts);
      model = buildCmaModel({ facts: ex.facts, letterhead, narrative, appendix: buildProvenanceAppendix(r.data), generatedAt });
      addressInput = r.data.resolved_address.input;
      bbl = r.data.resolved_address.bbl;
      overallProvenance = r.data.overall_provenance;
    } else if (doc.id === 'buyer_seller_net_sheet') {
      const r = await assembleDocumentData(address, doc.requiredBlocks);
      if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
      const ex = extractNetSheetFacts(r.data);
      if (!ex.ok) return NextResponse.json({ error: ex.error }, { status: 422 });
      model = buildNetSheetModel({ facts: ex.facts, letterhead, appendix: buildProvenanceAppendix(r.data), generatedAt });
      addressInput = r.data.resolved_address.input;
      bbl = r.data.resolved_address.bbl;
      overallProvenance = r.data.overall_provenance;
    } else if (doc.id === 'client_neighborhood_report') {
      const r = await assembleDocumentData(address, doc.requiredBlocks);
      if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
      const ex = extractNeighborhoodFacts(r.data);
      if (!ex.ok) return NextResponse.json({ error: ex.error }, { status: 422 });
      const narrative =
        buildSource === 'fresh'
          ? await runGroundedNarrative({
              systemPrompt: NEIGHBORHOOD_SYSTEM_PROMPT,
              factsPayload: neighborhoodFactsForModel(ex.facts),
              allowedDataPoints: neighborhoodDataPoints(ex.facts),
              addressLabel: ex.facts.addressLabel,
              deterministicFallback: deterministicNeighborhoodNarrative(ex.facts),
            })
          : deterministicNeighborhoodNarrative(ex.facts);
      const appendix = sharedAppendix(r.data, { dropDemographicsIfNotLive: true, demoLive: ex.facts.demoLive });
      model = buildNeighborhoodModel({ facts: ex.facts, letterhead, narrative, appendix, generatedAt });
      addressInput = r.data.resolved_address.input;
      bbl = r.data.resolved_address.bbl;
      overallProvenance = appendix.overall;
    } else if (doc.id === 'entitlement_risk_memo') {
      const r = await assembleDocumentData(address, doc.requiredBlocks);
      if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
      const ex = extractEntitlementFacts(r.data);
      if (!ex.ok) return NextResponse.json({ error: ex.error }, { status: 422 });
      const narrative =
        buildSource === 'fresh'
          ? await runGroundedNarrative({
              systemPrompt: ENTITLEMENT_SYSTEM_PROMPT,
              factsPayload: entitlementFactsForModel(ex.facts),
              allowedDataPoints: entitlementDataPoints(ex.facts),
              addressLabel: ex.facts.addressLabel,
              deterministicFallback: deterministicEntitlementNarrative(ex.facts),
            })
          : deterministicEntitlementNarrative(ex.facts);
      model = buildEntitlementModel({ facts: ex.facts, letterhead, narrative, appendix: buildProvenanceAppendix(r.data), generatedAt });
      addressInput = r.data.resolved_address.input;
      bbl = r.data.resolved_address.bbl;
      overallProvenance = r.data.overall_provenance;
    } else {
      // tax_appeal_packet
      const r = await assembleDocumentData(address, doc.requiredBlocks);
      if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
      const ex = extractTaxAppealFacts(r.data);
      if (!ex.ok) return NextResponse.json({ error: ex.error }, { status: 422 });
      const argument =
        buildSource === 'fresh' ? await generateTaxAppealArgument(ex.facts) : deterministicArgument(ex.facts);
      model = buildTaxAppealModel({
        data: r.data,
        facts: ex.facts,
        letterhead,
        argument,
        appendix: buildProvenanceAppendix(r.data),
        generatedAt,
      });
      addressInput = r.data.resolved_address.input;
      bbl = r.data.resolved_address.bbl;
      overallProvenance = r.data.overall_provenance;
    }
  } catch (e) {
    return NextResponse.json(
      { error: `Build failed: ${e instanceof Error ? e.message : String(e)}` },
      { status: 502 },
    );
  }

  let buffer: Buffer;
  try {
    buffer = format === 'docx' ? await renderDocx(model) : await renderPdf(model);
  } catch (e) {
    return NextResponse.json(
      { error: `Render failed: ${e instanceof Error ? e.message : String(e)}` },
      { status: 500 },
    );
  }

  // Append-only audit row (also the doc-cap counter). A failure to log must not
  // deny the user the document they just generated — log the error and proceed.
  try {
    await supabaseAdmin()
      .from('documents')
      .insert({
        clerk_user_id: userId,
        property_id: null,
        verdict_id: verdictId,
        doc_type: doc.id,
        tier: doc.homeTier,
        format,
        build_source: buildSource,
        title: doc.title,
        address_input: addressInput,
        overall_provenance: overallProvenance,
      });
  } catch (e) {
    console.error('[documents] audit insert failed:', e instanceof Error ? e.message : String(e));
  }

  const contentType =
    format === 'docx'
      ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      : 'application/pdf';

  return new Response(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${filenameFor(doc.id, bbl, format)}"`,
      'X-KOANO-Provenance': overallProvenance,
      'Cache-Control': 'no-store',
    },
  });
}
