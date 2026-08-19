// KOANO document engine — Asset One-Pager (Cluster 5).
// A single property at a glance for someone who needs the summary without the
// full IC memo: the verdict + confidence, property identity and envelope, key
// market indicators, top risks, and current status. STRICTLY one page, fully
// deterministic (zero narrative calls). Reuses the stored verdict (422 if none),
// same posture as the IC memo. The provenance appendix (blocks + verdict) is
// rendered in the condensed inline form (compactProvenance) so the mandatory
// appendix fits on the page WITHOUT ever trimming content.

import type {
  ZoningInfo,
  MlsCompsSummary,
  HpiTrend,
  FloodInfo,
  BuildingViolationsSummary,
  OpportunityZoneInfo,
} from '../../providers/types';
import type { DocumentData, Letterhead } from '../types';
import type { RenderModel, RenderSection } from '../render/model';
import type { IcMemoVerdict } from './ic-memo';

function fmtMoney(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return `$${Math.round(n).toLocaleString('en-US')}`;
}
function fmtInt(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return Math.round(n).toLocaleString('en-US');
}
function fmtPct(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return `${n > 0 ? '+' : ''}${n.toFixed(1)}%`;
}
function fmtFar(n: number | null | undefined): string {
  if (n == null || !Number.isFinite(n)) return '—';
  return n.toFixed(2);
}

const VERDICT_TONE: Record<string, { word: string; tone: 'positive' | 'warning' | 'negative' }> = {
  buy: { word: 'BUY', tone: 'positive' },
  hold: { word: 'HOLD', tone: 'warning' },
  wait: { word: 'WAIT', tone: 'warning' },
  sell: { word: 'SELL', tone: 'negative' },
  drop: { word: 'PASS', tone: 'negative' },
};

export interface OnePagerFacts {
  addressLabel: string;
  bbl: string | null;
  borough: string | null;
  verdict: IcMemoVerdict;
  zoning: ZoningInfo | null;
  comps: MlsCompsSummary | null;
  hpi: HpiTrend | null;
  flood: FloodInfo | null;
  violations: BuildingViolationsSummary | null;
  oz: OpportunityZoneInfo | null;
}

export function extractOnePagerFacts(
  data: DocumentData,
  verdict: IcMemoVerdict,
): { ok: true; facts: OnePagerFacts } | { ok: false; error: string } {
  const zoning = data.blocks.zoning?.data as ZoningInfo | null | undefined;
  if (!zoning) return { ok: false, error: 'Zoning/PLUTO data unavailable — cannot build the property snapshot.' };
  return {
    ok: true,
    facts: {
      addressLabel: data.resolved_address.normalized || data.resolved_address.input,
      bbl: data.resolved_address.bbl,
      borough: data.resolved_address.borough,
      verdict,
      zoning,
      comps: (data.blocks.mls_comps?.data as MlsCompsSummary) ?? null,
      hpi: (data.blocks.hpi?.data as HpiTrend) ?? null,
      flood: (data.blocks.flood?.data as FloodInfo) ?? null,
      violations: (data.blocks.building_violations?.data as BuildingViolationsSummary) ?? null,
      oz: (data.blocks.opportunity_zone?.data as OpportunityZoneInfo) ?? null,
    },
  };
}

// Whole days between two ISO timestamps (pure).
function daysBetween(fromIso: string, toIso: string): number {
  return Math.max(0, Math.floor((new Date(toIso).getTime() - new Date(fromIso).getTime()) / 86_400_000));
}

export function buildOnePagerModel(args: {
  facts: OnePagerFacts;
  letterhead: Letterhead;
  appendix: RenderModel['appendix'];
  generatedAt: string;
}): RenderModel {
  const { facts: f, letterhead, appendix, generatedAt } = args;
  const v = f.verdict;
  const z = f.zoning;
  const pres = VERDICT_TONE[v.verdict] ?? { word: v.verdict.toUpperCase(), tone: 'warning' as const };
  const ageDays = daysBetween(v.verdictGeneratedAt, generatedAt);
  const sections: RenderSection[] = [];

  // 1 — Verdict headline (the conclusion, up top).
  sections.push({
    verdict: { decision: pres.word, tone: pres.tone, confidence: v.confidence, rationale: v.headline || `KOANO verdict: ${v.verdict}` },
  });

  // 2 — Identity & envelope.
  sections.push({
    heading: 'Property & Envelope',
    band: {
      items: [
        { label: 'Address', value: f.addressLabel },
        { label: 'BBL', value: f.bbl ?? '—' },
        { label: 'Class / year', value: `${z?.building_class ?? '—'} / ${z?.year_built ?? '—'}` },
        { label: 'Residential units', value: fmtInt(z?.residential_units) },
        { label: 'Zoning', value: z?.zoning_district ?? '—' },
        { label: 'Lot / building area', value: `${fmtInt(z?.lot_area_sqft)} / ${fmtInt(z?.building_area_sqft)} sq ft` },
        { label: 'Built / max res FAR', value: `${fmtFar(z?.built_far)} / ${fmtFar(z?.max_residential_far)}` },
        { label: 'Opportunity Zone', value: f.oz ? (f.oz.is_opportunity_zone ? 'Yes' : 'No') : '—' },
      ],
    },
  });

  // 3 — Key market indicators.
  sections.push({
    heading: 'Key Market Indicators',
    table: {
      columns: ['Indicator', 'Reading'],
      rows: [
        ['House Price Index (YoY / 5-yr)', `${fmtPct(f.hpi?.yoy_change_pct)} / ${fmtPct(f.hpi?.five_yr_change_pct)}${f.hpi?.region ? ` — ${f.hpi.region}` : ''}`],
        ['Recorded sale $/sq ft (median)', fmtMoney(f.comps?.median_price_per_sqft)],
        ['Recorded sales in scope / trend', f.comps && f.comps.sales_count > 0 ? `${fmtInt(f.comps.sales_count)} / ${f.comps.price_trend}` : '—'],
      ],
      caption: 'Recorded residential sales (NYC DOF) — not institutional CRE transactions.',
    },
  });

  // 4 — Top risks (fixed set — always shown in full, never trimmed).
  const openViol = (f.violations?.hpd.open ?? 0) + (f.violations?.ecb.active ?? 0) + (f.violations?.dob_complaints.active ?? 0);
  sections.push({
    heading: 'Top Risks',
    table: {
      columns: ['Risk', 'Reading'],
      rows: [
        ['KOANO risk score', `${v.risk_score} / 100`],
        ['FEMA flood zone', f.flood?.flood_zone ? `${f.flood.flood_zone}${f.flood.in_special_flood_hazard_area ? ' — Special Flood Hazard Area' : ' (outside SFHA)'}` : '—'],
        ['Open violations (HPD / ECB / DOB)', f.violations ? `${fmtInt(f.violations.hpd.open)} / ${fmtInt(f.violations.ecb.active)} / ${fmtInt(f.violations.dob_complaints.active)}${!f.violations.hpd_registered ? ' — not HPD-registered (coverage note)' : ''}` : '—'],
      ],
      caption: openViol > 0 ? 'Open records warrant diligence before acquisition.' : undefined,
    },
  });

  // 5 — Current status.
  sections.push({
    heading: 'Current Status',
    paragraphs: [
      `KOANO verdict ${v.verdict.toUpperCase()} at confidence ${v.confidence}/100, generated ${v.verdictGeneratedAt.slice(0, 10)} (${ageDays} day${ageDays === 1 ? '' : 's'} ago)${ageDays > 30 ? ' — verdict is over 30 days old; re-run the analysis before acting.' : '.'} Decision support built on public record, not a decision.`,
    ],
  });

  return {
    docTitle: 'Asset One-Pager',
    subtitle: f.addressLabel,
    letterhead,
    compact: true,
    compactProvenance: true, // keep the mandatory appendix on-page without trimming content
    sections,
    appendix,
    generatedAt,
  };
}
