// KOANO document engine — Permit History Report (Community).
// A chronological record of the DOB permits filed on the subject building:
// what work, when, what job type, and what status — with OPEN and EXPIRED
// permits flagged explicitly, because an open or expired permit can hold up a
// closing and can be a sign of unpermitted or unfinished work. All-live NYC
// data, zero model calls (fully deterministic).
//
// The subject history merges DOB NOW (2021+) and the legacy DOB Permit Issuance
// dataset (older permits), so it is genuinely all-time within DOB's records.
// A short or empty history is a coverage fact (stated in the report), never
// silently presented as "no work ever done."

import type { ZoningInfo, PermitsSummary, PermitRecord } from '../../providers/types';
import type { DocumentData, Letterhead } from '../types';
import type { RenderModel, RenderSection } from '../render/model';

const MAX_PERMIT_ROWS = 200; // safety valve; provider already caps all_permits at 300

function fmtInt(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return Math.round(n).toLocaleString('en-US');
}

export interface PermitHistoryFacts {
  addressLabel: string;
  bbl: string | null;
  bin: string | null;
  buildingClass: string | null;
  yearBuilt: number | null;
  neighborhoodTotal24mo: number;
  newBuilding24mo: number;
  demolition24mo: number;
  alteration24mo: number;
  neighborhoodScopeNote: string;
  allPermits: PermitRecord[];
  coverageNote: string;
}

export function extractPermitHistoryFacts(
  data: DocumentData,
): { ok: true; facts: PermitHistoryFacts } | { ok: false; error: string } {
  const permits = data.blocks.permits?.data as PermitsSummary | null | undefined;
  const zoning = data.blocks.zoning?.data as ZoningInfo | null | undefined;

  if (!permits) return { ok: false, error: 'Permit data unavailable for this address.' };

  return {
    ok: true,
    facts: {
      addressLabel: data.resolved_address.normalized || data.resolved_address.input,
      bbl: data.resolved_address.bbl,
      bin: permits.bin,
      buildingClass: zoning?.building_class ?? null,
      yearBuilt: zoning?.year_built ?? null,
      neighborhoodTotal24mo: permits.total_permits_24mo,
      newBuilding24mo: permits.new_building_permits,
      demolition24mo: permits.demolition_permits,
      alteration24mo: permits.alteration_permits,
      neighborhoodScopeNote: permits.scope_note,
      allPermits: permits.all_permits,
      coverageNote: permits.all_permits_note,
    },
  };
}

// Derive a display status for a permit, flagging EXPIRED and OPEN explicitly.
// `todayIso` is the generation date (passed in, never Date.now() in a pure fn).
function permitFlag(p: PermitRecord, todayIso: string): { flag: string; expiry: string } {
  const status = (p.permit_status ?? '').toUpperCase();
  const exp = p.expiration_date || '';
  const expired = !!exp && exp < todayIso;
  let flag: string;
  if (expired) {
    flag = 'EXPIRED';
  } else if (exp && exp >= todayIso) {
    flag = 'OPEN (active permit)';
  } else if (status.includes('ISSUED') || status.includes('IN PROCESS') || status.includes('APPROVED')) {
    flag = status.charAt(0) + status.slice(1).toLowerCase();
  } else {
    flag = p.permit_status ?? '—';
  }
  return { flag, expiry: exp || '—' };
}

export function buildPermitHistoryModel(args: {
  facts: PermitHistoryFacts;
  letterhead: Letterhead;
  appendix: RenderModel['appendix'];
  generatedAt: string;
}): RenderModel {
  const { facts: f, letterhead, appendix, generatedAt } = args;
  const todayIso = generatedAt.slice(0, 10);
  const sections: RenderSection[] = [];

  // 1 — Building identity.
  sections.push({
    heading: 'Building Identity',
    band: {
      items: [
        { label: 'Address', value: f.addressLabel },
        { label: 'BBL', value: f.bbl ?? '—' },
        { label: 'BIN', value: f.bin ?? '—' },
        { label: 'Building class', value: f.buildingClass ?? '—' },
        { label: 'Year built', value: f.yearBuilt ? String(f.yearBuilt) : '—' },
      ],
    },
  });

  // Flag tally over the full history.
  const flags = f.allPermits.map((p) => permitFlag(p, todayIso));
  const expiredCount = flags.filter((x) => x.flag === 'EXPIRED').length;
  const openCount = flags.filter((x) => x.flag.startsWith('OPEN')).length;

  // 2 — Subject building permit history (the core of the report).
  if (f.allPermits.length === 0) {
    sections.push({
      heading: 'Subject Building Permit History',
      provenanceNote: { provenance: 'live', text: 'Queried live from NYC DOB records at generation time.' },
      paragraphs: [
        'No DOB permits were found on record for this specific building in either the DOB NOW or the legacy DOB Permit Issuance dataset.',
        f.coverageNote,
      ],
    });
  } else {
    const shown = f.allPermits.slice(0, MAX_PERMIT_ROWS);
    const shownFlags = flags.slice(0, MAX_PERMIT_ROWS);
    const historySection: RenderSection = {
      heading: 'Subject Building Permit History',
      provenanceNote: { provenance: 'live', text: 'Queried live from NYC DOB records at generation time.' },
      table: {
        columns: ['Issued', 'Job / work type', 'Status', 'Expires', 'Source'],
        rows: shown.map((p, i) => [
          p.issuance_date || '—',
          [p.job_type, p.work_type].filter(Boolean).join(' / ') || '—',
          shownFlags[i].flag,
          shownFlags[i].expiry,
          p.dataset ?? '—',
        ]),
        caption: `All DOB permits on record for this building, newest first (${fmtInt(f.allPermits.length)} permit${f.allPermits.length === 1 ? '' : 's'}).`,
      },
    };
    if (f.allPermits.length > shown.length) {
      historySection.trimNote = `SAFETY-VALVE TRIM: showing the ${shown.length} most recent of ${fmtInt(f.allPermits.length)} permits; the remainder are omitted for length only.`;
    }
    sections.push(historySection);
  }

  // 3 — Open / expired flag callout (why it matters).
  const flagParas: string[] = [];
  if (expiredCount > 0 || openCount > 0) {
    flagParas.push(
      `This building has ${fmtInt(openCount)} open (active) permit${openCount === 1 ? '' : 's'} and ${fmtInt(expiredCount)} expired permit${expiredCount === 1 ? '' : 's'} on record.`,
    );
    flagParas.push(
      'An EXPIRED permit means DOB-authorized work was not signed off before the permit lapsed. An OPEN permit means work is authorized and not yet closed out. Either can delay a sale or refinance and can indicate work that was started, not finished, or not properly closed — a title company or expeditor should reconcile these against the actual condition of the building.',
    );
  } else {
    flagParas.push('No open or expired permits were identified in the records retrieved.');
  }
  flagParas.push(f.coverageNote);
  sections.push({ heading: 'Open & Expired Permits — Why It Matters', paragraphs: flagParas });

  // 4 — Neighborhood permit activity (live context, clearly scoped as NOT the
  // subject building so the two are never conflated).
  sections.push({
    heading: 'Neighborhood Permit Activity (last 24 months)',
    table: {
      columns: ['Metric', 'Count'],
      rows: [
        ['Total permits issued in the area', fmtInt(f.neighborhoodTotal24mo)],
        ['New-building permits', fmtInt(f.newBuilding24mo)],
        ['Demolition permits', fmtInt(f.demolition24mo)],
        ['Alteration / construction permits', fmtInt(f.alteration24mo)],
      ],
      caption: `Area context, not this building: ${f.neighborhoodScopeNote}`,
    },
  });

  return {
    docTitle: 'Permit History Report',
    subtitle: f.addressLabel,
    letterhead,
    compact: true,
    sections,
    appendix,
    generatedAt,
  };
}
