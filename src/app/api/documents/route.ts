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
import { guardDocument } from '../../../../lib/documents/guard';
import { assembleDocumentData, getLetterhead } from '../../../../lib/documents/assembler';
import { buildProvenanceAppendix } from '../../../../lib/documents/disclaimer';
import { renderPdf } from '../../../../lib/documents/render/pdf';
import { renderDocx } from '../../../../lib/documents/render/docx';
import type { BuildSource, DocumentFormat } from '../../../../lib/documents/types';
import {
  extractTaxAppealFacts,
  deterministicArgument,
  generateTaxAppealArgument,
  buildTaxAppealModel,
} from '../../../../lib/documents/builders/tax-appeal';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

// Document types with a renderer wired today. Others are declared in the
// registry but not yet implemented — the route refuses them cleanly (501)
// rather than pretending. (Slice 4 ships tax_appeal_packet only.)
const IMPLEMENTED = new Set(['tax_appeal_packet']);

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
  if (!address) return NextResponse.json({ error: '"address" is required' }, { status: 400 });

  const doc = getDocumentType(docTypeId);
  if (!doc) return NextResponse.json({ error: `Unknown document type "${docTypeId}"` }, { status: 404 });

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
  if (!IMPLEMENTED.has(doc.id)) {
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

  // Assemble live data through the shared block layer.
  const assembled = await assembleDocumentData(address, doc.requiredBlocks);
  if (!assembled.ok) return NextResponse.json({ error: assembled.error }, { status: assembled.status });
  const data = assembled.data;

  // Tax-appeal-specific build.
  const extracted = extractTaxAppealFacts(data);
  if (!extracted.ok) return NextResponse.json({ error: extracted.error }, { status: 422 });
  const facts = extracted.facts;

  let argument: string[];
  try {
    argument =
      buildSource === 'fresh' ? await generateTaxAppealArgument(facts) : deterministicArgument(facts);
  } catch (e) {
    return NextResponse.json(
      { error: `Argument generation failed: ${e instanceof Error ? e.message : String(e)}` },
      { status: 502 },
    );
  }

  const letterhead = await getLetterhead(userId);
  const appendix = buildProvenanceAppendix(data);
  const generatedAt = new Date().toISOString();
  const model = buildTaxAppealModel({ data, facts, letterhead, argument, appendix, generatedAt });

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
        address_input: data.resolved_address.input,
        overall_provenance: data.overall_provenance,
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
      'Content-Disposition': `attachment; filename="${filenameFor(doc.id, data.resolved_address.bbl, format)}"`,
      'X-KOANO-Provenance': data.overall_provenance,
      'Cache-Control': 'no-store',
    },
  });
}
