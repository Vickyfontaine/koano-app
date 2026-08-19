// KOANO document engine — Monday Portfolio Briefing PDF (Cluster 5).
// The PDF export of the existing Cluster 5 briefing feature. It REUSES
// generateBriefing() verbatim (that is the single narrative call) and only
// renders its output: the four fixed sections are parsed deterministically into
// a formatted PDF, with a provenance appendix built from the briefing's own
// per-source rollup (which already includes the verdict as a source).
//
// NOTE (gap, for a separate decision): the current generateBriefing covers
// verdicts, permits, flood, and metro HPI — NOT new violations, verdict deltas,
// or a materiality ranking. This exporter reuses it exactly as shipped; adding
// those would change a live Cluster 5 feature and is out of scope here.

import type { Provenance } from '../../providers/types';
import type { Letterhead } from '../types';
import type { RenderModel, RenderSection } from '../render/model';
import type { ProvenanceAppendix } from '../disclaimer';
import type { BriefingResult } from '../../agents/briefing';

// The four headers generateBriefing emits, mapped to display titles.
const BRIEFING_SECTIONS: { key: string; title: string }[] = [
  { key: 'PORTFOLIO SUMMARY', title: 'Portfolio Summary' },
  { key: 'PROPERTY NOTES', title: 'Property Notes' },
  { key: 'RISK WATCH', title: 'Risk Watch' },
  { key: 'THE WEEK AHEAD', title: 'The Week Ahead' },
];

// Split the briefing text into its four sections. If any header is missing
// (model deviation), fall back to rendering the ENTIRE text as one section —
// content is never silently dropped.
export function parseBriefingSections(text: string): RenderSection[] {
  const found = BRIEFING_SECTIONS.map((s) => ({ ...s, i: text.indexOf(s.key) }));
  if (found.some((f) => f.i === -1)) {
    return [{ heading: 'Portfolio Briefing', paragraphs: splitParagraphs(text) }];
  }
  const sections: RenderSection[] = [];
  for (let k = 0; k < found.length; k++) {
    const start = found[k].i + found[k].key.length;
    const end = k + 1 < found.length ? found[k + 1].i : text.length;
    const body = text.slice(start, end).trim();
    sections.push({ heading: found[k].title, paragraphs: splitParagraphs(body) });
  }
  return sections;
}

function splitParagraphs(s: string): string[] {
  return s
    .split(/\n+/)
    .map((p) => p.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

// Provenance appendix from the briefing's own per-source rollup. The verdict is
// already one of these sources ("KOANO verdict audit trail"), so the overall is
// the weakest of data AND verdict — no separate accounting needed.
export function briefingAppendix(result: BriefingResult): ProvenanceAppendix {
  const overall: Provenance = result.overall_provenance;
  const overall_note =
    overall === 'live'
      ? 'Every input to this briefing was fetched live from an authoritative public source at generation time.'
      : 'This briefing draws on one or more representative inputs (labeled below) — a plausible stand-in for a paid source not yet integrated. It is not fully live.';
  return {
    overall,
    overall_note,
    rows: result.source_provenance.map((sp) => ({
      block: sp.source,
      source: sp.source,
      provenance: sp.provenance,
      fetched_at: result.generated_at,
    })),
  };
}

export function buildMondayBriefingModel(args: {
  result: BriefingResult;
  portfolioSize: number;
  letterhead: Letterhead;
  generatedAt: string;
}): RenderModel {
  const { result, portfolioSize, letterhead, generatedAt } = args;
  const covered = result.properties_covered;
  const subtitle =
    covered < portfolioSize
      ? `Portfolio of ${portfolioSize} properties (briefing covers the first ${covered})`
      : `Portfolio of ${portfolioSize} propert${portfolioSize === 1 ? 'y' : 'ies'}`;

  return {
    docTitle: 'Monday Portfolio Briefing',
    subtitle,
    letterhead,
    compactProvenance: true, // text-heavy doc; a condensed source list reads better
    sections: parseBriefingSections(result.briefing),
    appendix: briefingAppendix(result),
    generatedAt,
  };
}
