// KOANO document engine — Entitlement Risk Memo (Development).
// A standalone version of the entitlement section in the screening memo: the
// subject community district's DOB disposition record (approval ratio, mix,
// median timeline) plus the subject lot's own filing history. Framed honestly
// throughout as a DISPOSITION TRACK RECORD, not a prediction. One grounded
// narrative call; everything else deterministic. All-live NYC data.

import type {
  ZoningInfo,
  OpportunityZoneInfo,
  EntitlementSummary,
  DataPoint,
} from '../../providers/types';
import type { DocumentData, Letterhead } from '../types';
import type { RenderModel, RenderSection } from '../render/model';

const MAX_FILINGS = 25;

function fmtInt(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return Math.round(n).toLocaleString('en-US');
}
function fmtFar(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return n.toFixed(2);
}
function fmtPct(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return `${n}%`;
}

export interface EntitlementFacts {
  addressLabel: string;
  bbl: string | null;
  communityDistrict: string | null;
  zoningDistrict: string | null;
  builtFar: number | null;
  maxResFar: number | null;
  unusedFarPct: number | null;
  isOpportunityZone: boolean | null;
  // CD track record
  approvalRatioPct: number | null;
  cdApproved: number;
  cdDisapproved: number;
  cdWithdrawn: number;
  cdSuspended: number;
  cdInProcess: number;
  cdTotalFilings: number;
  medianTimelineDays: number | null;
  scopeNote: string | null;
  subjectFilingCount: number;
  subjectFilings: EntitlementSummary['subject_recent_items'];
}

export function extractEntitlementFacts(
  data: DocumentData,
): { ok: true; facts: EntitlementFacts } | { ok: false; error: string } {
  const zoning = data.blocks.zoning?.data as ZoningInfo | null | undefined;
  const ent = data.blocks.entitlement?.data as EntitlementSummary | null | undefined;
  if (!zoning) return { ok: false, error: 'Zoning/PLUTO data unavailable for this address.' };
  if (!ent) return { ok: false, error: 'Entitlement (DOB filings) data unavailable for this address.' };
  const oz = data.blocks.opportunity_zone?.data as OpportunityZoneInfo | null | undefined;
  return {
    ok: true,
    facts: {
      addressLabel: data.resolved_address.normalized || data.resolved_address.input,
      bbl: data.resolved_address.bbl,
      communityDistrict: ent.community_district ?? zoning.community_district,
      zoningDistrict: zoning.zoning_district,
      builtFar: zoning.built_far,
      maxResFar: zoning.max_residential_far,
      unusedFarPct: zoning.unused_far_pct,
      isOpportunityZone: oz?.is_opportunity_zone ?? null,
      approvalRatioPct: ent.cd_approval_ratio_pct,
      cdApproved: ent.cd_approved,
      cdDisapproved: ent.cd_disapproved,
      cdWithdrawn: ent.cd_withdrawn,
      cdSuspended: ent.cd_suspended,
      cdInProcess: ent.cd_in_process,
      cdTotalFilings: ent.cd_total_filings,
      medianTimelineDays: ent.cd_median_timeline_days,
      scopeNote: ent.scope_note,
      subjectFilingCount: ent.subject_filing_count,
      subjectFilings: ent.subject_recent_items,
    },
  };
}

export function entitlementDataPoints(f: EntitlementFacts): DataPoint[] {
  const dp = (label: string, value: string | number | null): DataPoint => ({
    label,
    value: value ?? '',
    provenance: 'live',
    source: 'entitlement memo figures',
  });
  return [
    dp('community district', f.communityDistrict),
    dp('zoning district', f.zoningDistrict),
    dp('built FAR', f.builtFar),
    dp('max residential FAR', f.maxResFar),
    dp('unused FAR percent', f.unusedFarPct),
    dp('community district approval ratio percent', f.approvalRatioPct),
    dp('approved filings', f.cdApproved),
    dp('disapproved filings', f.cdDisapproved),
    dp('withdrawn filings', f.cdWithdrawn),
    dp('suspended filings', f.cdSuspended),
    dp('in process filings', f.cdInProcess),
    dp('total filings', f.cdTotalFilings),
    dp('median filing timeline days', f.medianTimelineDays),
    dp('subject lot filing count', f.subjectFilingCount),
  ];
}

export function entitlementFactsForModel(f: EntitlementFacts) {
  return {
    subject_address: f.addressLabel,
    community_district: f.communityDistrict,
    zoning_district: f.zoningDistrict,
    unused_far_percent: f.unusedFarPct,
    cd_approval_ratio_percent: f.approvalRatioPct,
    cd_disposition_mix: {
      approved: f.cdApproved,
      disapproved: f.cdDisapproved,
      withdrawn: f.cdWithdrawn,
      suspended: f.cdSuspended,
      in_process: f.cdInProcess,
      total: f.cdTotalFilings,
    },
    cd_median_timeline_days: f.medianTimelineDays,
    subject_lot_filing_count: f.subjectFilingCount,
  };
}

export const ENTITLEMENT_SYSTEM_PROMPT = `You are KOANO's entitlement analyst. Write the "Risk Assessment" section of an Entitlement Risk Memo — 130-190 words, sober professional tone.

Rules:
- Use ONLY the figures in the JSON provided. Do NOT name a special district, program, statute, rezoning, or year that is not in the figures — the data gives you a community district number and DOB filing counts, not a rulebook.
- This is a DISPOSITION TRACK RECORD, not a prediction. Say plainly that a favorable or unfavorable community-district record is base-rate context for the approvals landscape, and that a specific project's outcome depends on its own merits and review, which this record does not forecast.
- Read the approval ratio, the disposition mix, the median timeline, and the subject lot's own filing count together — do not lean on one figure.
- No headings, no markdown, no preamble. Output the paragraphs only.`;

export function deterministicEntitlementNarrative(f: EntitlementFacts): string[] {
  const paras: string[] = [];
  paras.push(
    `Community district ${f.communityDistrict ?? '(unknown)'} shows an approval ratio of ${fmtPct(f.approvalRatioPct)} across ${fmtInt(f.cdTotalFilings)} DOB job filings: ${fmtInt(f.cdApproved)} approved, ${fmtInt(f.cdDisapproved)} disapproved, ${fmtInt(f.cdWithdrawn)} withdrawn, ${fmtInt(f.cdSuspended)} suspended, and ${fmtInt(f.cdInProcess)} in process. The median filing timeline is ${f.medianTimelineDays != null ? fmtInt(f.medianTimelineDays) + ' days' : 'not available'}.`,
  );
  paras.push(
    `The subject lot has ${fmtInt(f.subjectFilingCount)} filing(s) of its own on record. Read together, these are base-rate context for how the approvals landscape has behaved in this district. They are a disposition track record, not a prediction. A specific project's outcome turns on its own design, review, and merits, which this record does not forecast.`,
  );
  return paras;
}

export function buildEntitlementModel(args: {
  facts: EntitlementFacts;
  letterhead: Letterhead;
  narrative: string[];
  appendix: RenderModel['appendix'];
  generatedAt: string;
}): RenderModel {
  const { facts: f, letterhead, narrative, appendix, generatedAt } = args;
  const sections: RenderSection[] = [];

  // 1 — Zoning & entitlement context.
  sections.push({
    heading: 'Zoning & Entitlement Context',
    band: {
      items: [
        { label: 'Address', value: f.addressLabel },
        { label: 'BBL', value: f.bbl ?? '—' },
        { label: 'Community district', value: f.communityDistrict ?? '—' },
        { label: 'Zoning district', value: f.zoningDistrict ?? '—' },
        { label: 'Built / max res FAR', value: `${fmtFar(f.builtFar)} / ${fmtFar(f.maxResFar)}` },
        { label: 'Unused FAR (headroom)', value: f.unusedFarPct != null ? `${f.unusedFarPct}%` : '—' },
        { label: 'Opportunity Zone', value: f.isOpportunityZone == null ? '—' : f.isOpportunityZone ? 'Yes' : 'No' },
      ],
    },
  });

  // 2 — Community district disposition track record.
  sections.push({
    heading: 'Community District Track Record',
    provenanceNote: {
      provenance: 'live',
      text: 'A DISPOSITION TRACK RECORD from DOB Job Application Filings for the subject community district: how filings have historically resolved. It is not a prediction of any specific project.',
    },
    table: {
      columns: ['Measure', 'Value'],
      rows: [
        ['Approval ratio (approved / decided)', fmtPct(f.approvalRatioPct)],
        ['Approved', fmtInt(f.cdApproved)],
        ['Disapproved', fmtInt(f.cdDisapproved)],
        ['Withdrawn', fmtInt(f.cdWithdrawn)],
        ['Suspended', fmtInt(f.cdSuspended)],
        ['In process', fmtInt(f.cdInProcess)],
        ['Total filings in scope', fmtInt(f.cdTotalFilings)],
        ['Median filing timeline', f.medianTimelineDays != null ? `${fmtInt(f.medianTimelineDays)} days` : '—'],
      ],
      caption: f.scopeNote ?? undefined,
    },
  });

  // 3 — Subject-lot filing history.
  if (f.subjectFilings.length === 0) {
    sections.push({
      heading: 'Subject-Lot Filing History',
      paragraphs: [
        `No DOB job filings are on record for this lot (${fmtInt(f.subjectFilingCount)} on file). An absence of filings is a record fact, not a certification that no work has occurred.`,
      ],
    });
  } else {
    const shown = f.subjectFilings.slice(0, MAX_FILINGS);
    const filingSection: RenderSection = {
      heading: 'Subject-Lot Filing History',
      table: {
        columns: ['Job', 'Type', 'Status', 'Latest action'],
        rows: shown.map((r) => [r.job, r.job_type, r.status, r.latest_action_date ?? '—']),
        caption: `${fmtInt(f.subjectFilingCount)} filing(s) on record for this lot.`,
      },
    };
    if (f.subjectFilings.length > shown.length) {
      filingSection.trimNote = `Showing ${shown.length} of ${fmtInt(f.subjectFilings.length)} filings on this lot.`;
    }
    sections.push(filingSection);
  }

  // 4 — Risk assessment (grounded narrative).
  sections.push({ heading: 'Risk Assessment', paragraphs: narrative });

  return {
    docTitle: 'Entitlement Risk Memo',
    subtitle: f.addressLabel,
    letterhead,
    sections,
    appendix,
    generatedAt,
  };
}
