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
import { buildProvenanceAppendix } from '../../../../lib/documents/disclaimer';
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

  // Address requirement is scope-aware: multi_site takes up to 3 addresses.
  if (doc.scope === 'multi_site') {
    if (addresses.length === 0) {
      return NextResponse.json({ error: '"addresses" (1–3) is required for this document' }, { status: 400 });
    }
  } else if (!address) {
    return NextResponse.json({ error: '"address" is required' }, { status: 400 });
  }

  // Blocked-by-design types (representative-provider dependencies) never ship.
  if (doc.status === 'blocked') {
    return NextResponse.json(
      {
        error: `The ${doc.title} is not available yet — it depends on a data source (${doc.blockedOn}) that is representative until funded.`,
        blocked_on: doc.blockedOn,
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

  const buildSource: BuildSource = body.buildSource === 'verdict' ? 'verdict' : 'fresh';
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
