// KOANO document engine — Portfolio Risk Report (Portfolio, Cluster 5).
// Was blocked on the representative premium-hazard mock; Phase 1 made every input
// live (FEMA NFHL flood, EPA Superfund/brownfield, USGS seismic, OpenFEMA disaster
// history, FBI/NYPD crime), so it now ships. Deterministic — a risk-exposure grid
// across the portfolio, no model call. Decision-support, not decision-making.
//
// NOTE: contamination is fetched live per property; a large portfolio can exceed
// the EPA FRS 12/min limit, in which case those rows degrade to a labeled
// representative value and the report's overall provenance reflects it (honest).

import type {
  FloodInfo, ContaminationInfo, SeismicInfo, DisasterHistoryInfo, CrimeStats,
} from '../../providers/types';
import type { DocumentData, Letterhead } from '../types';
import type { RenderModel, RenderSection } from '../render/model';

function fmtInt(n: number | null | undefined): string {
  return n == null || !Number.isFinite(n) ? '—' : Math.round(n).toLocaleString('en-US');
}

export interface PortfolioRiskRow {
  address: string;
  floodZone: string | null;
  inSfha: boolean;
  superfundWithin2mi: number | null;
  nearestSiteMi: number | null;
  seismicPga: number | null;
  disasters10yr: number | null;
  crimeTrend: string | null;
}

export function extractPortfolioRiskRow(data: DocumentData): PortfolioRiskRow {
  const flood = data.blocks.flood?.data as FloodInfo | null | undefined;
  const cont = data.blocks.contamination?.data as ContaminationInfo | null | undefined;
  const seis = data.blocks.seismic?.data as SeismicInfo | null | undefined;
  const dis = data.blocks.disaster_history?.data as DisasterHistoryInfo | null | undefined;
  const crime = data.blocks.crime?.data as CrimeStats | null | undefined;
  return {
    address: data.resolved_address.normalized || data.resolved_address.input,
    floodZone: flood?.flood_zone ?? null,
    inSfha: !!flood?.in_special_flood_hazard_area,
    superfundWithin2mi: cont?.superfund_sites_within_radius ?? null,
    nearestSiteMi: cont?.nearest_site_distance_mi ?? null,
    seismicPga: seis?.pga_g ?? null,
    disasters10yr: dis?.declarations_last_10yr ?? null,
    crimeTrend: crime?.trend ?? null,
  };
}

export function buildPortfolioRiskModel(args: {
  rows: PortfolioRiskRow[];
  portfolioSize: number;
  letterhead: Letterhead;
  appendix: RenderModel['appendix'];
  generatedAt: string;
}): RenderModel {
  const { rows, portfolioSize, letterhead, appendix, generatedAt } = args;

  const inSfha = rows.filter((r) => r.inSfha).length;
  const withSuperfund = rows.filter((r) => (r.superfundWithin2mi ?? 0) > 0).length;
  const withDisasters = rows.filter((r) => (r.disasters10yr ?? 0) > 0).length;
  const risingCrime = rows.filter((r) => r.crimeTrend === 'rising').length;

  const sections: RenderSection[] = [];

  // 1 — Exposure summary (headline counts across the portfolio).
  sections.push({
    heading: 'Risk Exposure',
    provenanceNote: { provenance: 'live', text: 'Live federal + city hazard data per property (FEMA flood, EPA Superfund/brownfield, USGS seismic, OpenFEMA disaster history, crime). Decision-support, not decision-making; every figure is traceable.' },
    highlight: {
      figures: [
        { label: 'Properties assessed', value: `${rows.length} of ${portfolioSize}`, emphasis: true },
        { label: 'In a Special Flood Hazard Area', value: fmtInt(inSfha) },
        { label: 'With a Superfund site ≤2 mi', value: fmtInt(withSuperfund) },
        { label: 'With a disaster declared (10 yr)', value: fmtInt(withDisasters) },
      ],
    },
    paragraphs: [
      `${inSfha} of ${rows.length} assessed properties sit in a FEMA Special Flood Hazard Area (mandatory-insurance zone); ${withSuperfund} have an EPA Superfund site within two miles; ${withDisasters} are in a county with a federally-declared disaster in the last ten years; ${risingCrime} sit where local crime is rising. These are exposure flags for prioritisation, not a verdict on any single asset.`,
    ],
  });

  // 2 — Per-property risk grid.
  sections.push({
    heading: 'Per-Property Risk',
    table: {
      columns: ['Property', 'FEMA flood', 'Superfund ≤2mi', 'Seismic PGA (g)', 'Disasters (10yr)', 'Crime trend'],
      rows: rows.map((r) => [
        r.address,
        r.floodZone ? `${r.floodZone}${r.inSfha ? ' · SFHA' : ''}` : '—',
        r.superfundWithin2mi != null ? `${r.superfundWithin2mi}${r.nearestSiteMi != null && r.superfundWithin2mi > 0 ? ` (nearest ${r.nearestSiteMi}mi)` : ''}` : '—',
        r.seismicPga != null ? String(r.seismicPga) : '—',
        fmtInt(r.disasters10yr),
        r.crimeTrend ?? '—',
      ]),
      caption: 'Flood zone is the current regulatory reality; disaster history is complementary (how often the county has actually been declared). Contamination is a 2-mile proximity count.',
    },
  });

  return { docTitle: 'Portfolio Risk Report', subtitle: `Portfolio (${portfolioSize} propert${portfolioSize === 1 ? 'y' : 'ies'})`, letterhead, sections, appendix, generatedAt };
}
