// Representative RenderModels for the disclaimer regression harness.
// One entry per implemented document type, plus a STRESS model that forces
// multi-page output and a page-spanning table — the exact shape that surfaced
// the lineHeight footer-drop bug.
//
// CONTRACT: every IMPLEMENTED_DOC_TYPES entry MUST have a SAMPLE_MODELS entry.
// The harness fails otherwise, so no document type can ship without
// disclaimer-on-every-page coverage. When you build a new type, add its sample
// here (deterministic — no live data, no model call).

import type { RenderModel } from './model';
import type { Letterhead } from '../types';

// Fixed timestamp so renders are deterministic (no Date.now()).
const GENERATED_AT = '2026-01-01T00:00:00.000Z';

const NAMED_LETTERHEAD: Letterhead = {
  full_name: 'Jane Homeowner',
  company_name: 'Coastal Realty Partners',
  license_number: 'NY-10401234',
  phone: '(212) 555-0142',
  contact_email: 'jane@coastalrp.example',
  logo_url: null,
  headshot_url: null,
};

const EMPTY_LETTERHEAD: Letterhead = {
  full_name: null,
  company_name: null,
  license_number: null,
  phone: null,
  contact_email: null,
  logo_url: null,
  headshot_url: null,
};

// A representative tax appeal packet (all-live provenance).
function taxAppealSample(): RenderModel {
  const comps = Array.from({ length: 8 }, (_, i) => [
    `${100 + i} Example Street`,
    `2025-0${(i % 9) + 1}-15`,
    `$${(850000 + i * 15000).toLocaleString('en-US')}`,
    `$${(600 + i * 7).toLocaleString('en-US')}`,
    `${(1200 + i * 40).toLocaleString('en-US')}`,
  ]);
  return {
    docTitle: 'Property Tax Appeal Evidence Packet',
    subtitle: '175 3rd Street, Brooklyn, NY',
    letterhead: NAMED_LETTERHEAD,
    sections: [
      {
        heading: 'Assessment Summary',
        table: {
          columns: ['Field', 'Value'],
          rows: [
            ['DOF total assessed value', '$4,185,900'],
            ['Assessed land value', '$3,261,600'],
            ['Building area', '13,518 sq ft'],
            ['Building class', 'K4'],
            ['Year built', '1931'],
            ['BBL', '3009720058'],
          ],
          caption: 'Source: NYC DOF assessment roll via MapPLUTO (live).',
        },
      },
      {
        heading: 'Comparable Recorded Sales',
        provenanceNote: { provenance: 'live', text: 'Recorded sales pulled live from NYC DOF Rolling Sales.' },
        table: {
          columns: ['Address', 'Sale date', 'Sale price', '$/sq ft', 'Sq ft'],
          rows: comps,
          caption: '144 qualifying recorded sales in scope (showing 8). ZIP-keyed proximity.',
        },
      },
      {
        heading: 'Indicative Value vs. Assessment',
        paragraphs: [
          'Indicative market value from recorded comparable sales: $15,626,808 ($1,156/sq ft median × 13,518 sq ft).',
          'DOF total assessed value: $4,185,900. The assessed value is a class-dependent fraction of DOF market value; compare the indicative value against the market value on your DOF Notice of Property Value.',
        ],
      },
      {
        heading: 'Basis for Appeal',
        paragraphs: [
          'The recorded comparable sales indicate a market value that should be weighed against the market value the Department of Finance assigned on the Notice of Property Value. '.repeat(3),
        ],
      },
    ],
    appendix: {
      overall: 'live',
      overall_note:
        'Every figure in this document was fetched live from an authoritative public source at generation time.',
      rows: [
        { block: 'Zoning / PLUTO', source: 'NYC Open Data — MapPLUTO (64uk-42ks)', provenance: 'live', fetched_at: GENERATED_AT },
        { block: 'Comparable sales', source: 'NYC Open Data — DOF Rolling Sales (usep-8jbt)', provenance: 'live', fetched_at: GENERATED_AT },
      ],
    },
    generatedAt: GENERATED_AT,
  };
}

// A deliberately heavy model: empty letterhead, long prose, and a 40-row table
// that MUST span a page break — this is the pagination shape that dropped the
// fixed footer under a page-level lineHeight. If the footer is ever dropped on a
// continuation page, this catches it.
export const STRESS_MODEL: RenderModel = {
  docTitle: 'Disclaimer Regression Stress Document',
  subtitle: 'Multi-page pagination + page-spanning table',
  letterhead: EMPTY_LETTERHEAD,
  sections: [
    {
      heading: 'Long Prose',
      paragraphs: [
        'This paragraph is intentionally long to consume vertical space and force pagination. '.repeat(12),
        'A second long paragraph continues to push content past the first page boundary so the fixed disclaimer footer must render on multiple pages. '.repeat(12),
      ],
    },
    {
      heading: 'Page-Spanning Table',
      provenanceNote: { provenance: 'representative', text: 'Synthetic rows — representative, for pagination testing only.' },
      table: {
        columns: ['Index', 'Address', 'Amount', 'Rate', 'Class'],
        rows: Array.from({ length: 40 }, (_, i) => [
          String(i + 1),
          `${1000 + i} Pagination Avenue`,
          `$${(500000 + i * 9876).toLocaleString('en-US')}`,
          `${(3 + (i % 5) * 0.25).toFixed(2)}%`,
          'R2',
        ]),
        caption: 'Forty synthetic rows guaranteeing a page break.',
      },
    },
    {
      heading: 'Closing Prose',
      paragraphs: ['A closing block of prose after the table to add another page. '.repeat(16)],
    },
  ],
  appendix: {
    overall: 'representative',
    overall_note:
      'This document contains representative figures (labeled below). It is not fully live.',
    rows: [
      {
        block: 'Pro forma benchmarks',
        source: 'KOANO representative benchmark',
        provenance: 'representative',
        fetched_at: GENERATED_AT,
        swap_note: 'Becomes live with a CoStar-tier data integration.',
      },
      { block: 'Zoning / PLUTO', source: 'NYC Open Data — MapPLUTO (64uk-42ks)', provenance: 'live', fetched_at: GENERATED_AT },
    ],
  },
  generatedAt: GENERATED_AT,
};

// A representative Development Site Screening Memo — exercises the verdict
// headline, identity band, FAR-contrast highlight, two-column tables, a visible
// trim note, and compact density.
function siteScreeningSample(): RenderModel {
  return {
    docTitle: 'Development Site Screening Memo',
    subtitle: '175 3rd Street, Brooklyn, NY',
    letterhead: EMPTY_LETTERHEAD,
    compact: true,
    sections: [
      { verdict: { decision: 'ADVANCE', tone: 'positive', confidence: 87, rationale: 'Material unused FAR and a 95% CD approval rate, with no disqualifying flags.' } },
      {
        heading: 'Site Identity',
        band: {
          items: [
            { label: 'Address', value: '175 3rd Street, Brooklyn' },
            { label: 'BBL', value: '3009720058' },
            { label: 'Borough', value: 'Brooklyn' },
            { label: 'Lot area', value: '120,793 sq ft' },
            { label: 'Zoning', value: 'M1-4/R7-2' },
            { label: 'Opportunity Zone', value: 'No' },
          ],
        },
      },
      {
        heading: 'As-of-Right Envelope',
        highlight: {
          figures: [
            { label: 'Base as-of-right max floor area', value: '415,528 sq ft', sub: 'residential FAR 3.44' },
            { label: 'City of Yes affordable-housing max', value: '605,173 sq ft', sub: 'FAR 5.01 · +189,645 sq ft with affordability', emphasis: true },
          ],
        },
        table: {
          columns: ['Envelope', 'Value'],
          rows: [
            ['Zoning district', 'M1-4/R7-2'],
            ['Unused development rights (base)', '402,010 sq ft'],
            ['Year built / building class', '1973 / K4'],
          ],
        },
        paragraphs: ['Envelope covers FAR and floor area only, under current PLUTO (26v1, City of Yes-updated). Not height- or parking-complete.'],
      },
      {
        heading: 'Entitlement Risk Read',
        table: {
          columns: ['Community district track record', 'Value'],
          rows: [
            ['CD approval ratio', '95%'],
            ['Disapproved filings', '2,731'],
            ['Median filing timeline', '573 days'],
          ],
        },
      },
      {
        heading: 'Assemblage & Air Rights',
        table: { columns: ['Block-level', 'Value'], rows: [['Registered owner', 'GOWANUS 3RD STREET OWNER LLC'], ['Block unused development rights', '0 sq ft']] },
        paragraphs: ['Block-level unused development rights are the assemblage read here.'],
      },
      {
        heading: 'Due Diligence Gap Register',
        table: {
          columns: ['Item', 'Status'],
          rows: [
            ['Zoning verification', 'Verified — NYC MapPLUTO (26v1)'],
            ['Title examination', 'Open — requires a title company'],
            ['Environmental assessment', 'Open — requires a Phase I/II'],
          ],
        },
      },
      {
        heading: 'Proof Points',
        table: { columns: ['Signal', 'Reading'], rows: [['Permit activity (24mo)', '312 permits'], ['FEMA flood', 'Zone X · outside SFHA']] },
        trimNote: 'Showing 4 of 5 proof points; ACS demographic direction was unavailable this run.',
      },
      {
        heading: 'Risk & Mitigant',
        table: { columns: ['Risk', 'Mitigant / note'], rows: [['No disqualifying public-record flags on the lot', 'Screening only — open due-diligence items still apply.']] },
      },
      { heading: 'Reasoning', paragraphs: ['On the selection rule, this site is an ADVANCE at confidence 87. This is a screening read of public record, not a feasibility study.'] },
    ],
    appendix: {
      overall: 'live',
      overall_note: 'Every figure in this document was fetched live from an authoritative public source at generation time.',
      rows: [
        { block: 'Zoning / PLUTO', source: 'NYC Open Data — MapPLUTO (64uk-42ks)', provenance: 'live', fetched_at: GENERATED_AT },
        { block: 'Entitlement track record', source: 'NYC Open Data — DOB Job Application Filings (ic3t-wcy2)', provenance: 'live', fetched_at: GENERATED_AT },
      ],
    },
    generatedAt: GENERATED_AT,
  };
}

// A representative Three-Site Comparison Brief. DELIBERATELY sized to span TWO
// pages so the disclaimer harness exercises the multi-site type's page-2 footer
// — the exact failure class it must catch. (A 1-page sample never tested it.)
function comparisonSample(): RenderModel {
  const rows: string[][] = [
    ['KOANO verdict', 'ADVANCE (78)', 'ADVANCE (72)', 'HOLD (52)'],
    ['Risk-adjusted rank', '#1', '#2', '#3'],
    ['Zoning district', 'M1-4/R7-2', 'R6', 'R6B'],
    ['Base max floor area', '415,528 sf', '242,250 sf', '7,500 sf'],
    ['City of Yes affordable max', '605,173 sf', '323,000 sf', '9,750 sf'],
    ['Unused development rights', '402,010 sf', '167,793 sf', '0 · built out'],
    ['CD approval ratio', '95%', '95%', '95%'],
    ['Median filing timeline', '567 d', '362 d', '531 d'],
    ['Opportunity Zone', 'No', 'No', 'No'],
    ['Adjacent block unused FAR', '0 sf', '144,498 sf', '110,791 sf'],
    ['Flood (SFHA)', 'X', 'X', 'AE · SFHA'],
    ['Open HPD violations', '0', '3', '1'],
    ['Speculation watch', 'No', 'No', 'No'],
    ['Permit activity (24mo)', '312', '96', '41'],
    ['Recorded sales $/sf', '$1,156', '$743', '$612'],
  ];
  return {
    docTitle: 'Three-Site Comparison Brief',
    subtitle: '175 3rd Street  ·  70-33 260th Street  ·  47-07 Vernon Blvd',
    letterhead: EMPTY_LETTERHEAD,
    compact: true,
    sections: [
      {
        heading: 'Site Comparison',
        table: {
          columns: ['Metric', '175 3rd Street', '70-33 260th St', '47-07 Vernon Blvd'],
          rows,
          caption: 'Identical structure across all sites — every row is present for every site.',
        },
      },
      {
        // Deliberately long so this sample spans two pages — the harness then
        // verifies the disclaimer footer on the comparison type's SECOND page.
        heading: 'Reasoning',
        paragraphs: Array.from(
          { length: 10 },
          (_, i) =>
            `Reasoning paragraph ${i + 1}: applying the selection rule across the sites, 175 3rd Street leads on the magnitude of its development headroom and a favorable community-district entitlement record, weighed against a longer median filing timeline, while the remaining sites trade headroom against timeline and flood exposure. This is a screening comparison of public record, not a feasibility study, and carries no financial modelling.`,
        ),
      },
    ],
    appendix: {
      overall: 'live',
      overall_note: 'Every figure in this document was fetched live from an authoritative public source at generation time.',
      rows: [
        { block: 'Zoning / PLUTO', source: 'NYC Open Data — MapPLUTO (64uk-42ks)', provenance: 'live', fetched_at: GENERATED_AT },
        { block: 'Entitlement track record', source: 'NYC Open Data — DOB Job Application Filings (ic3t-wcy2)', provenance: 'live', fetched_at: GENERATED_AT },
        { block: 'Assemblage / air rights', source: 'NYC Open Data — MapPLUTO block-level ownership + unused FAR', provenance: 'live', fetched_at: GENERATED_AT },
        { block: 'Comparable sales', source: 'NYC Open Data — DOF Rolling Sales (usep-8jbt)', provenance: 'live', fetched_at: GENERATED_AT },
        { block: 'Flood zone', source: 'FEMA National Flood Hazard Layer', provenance: 'live', fetched_at: GENERATED_AT },
        { block: 'Building permits', source: 'NYC Open Data — DOB permit issuance', provenance: 'live', fetched_at: GENERATED_AT },
        { block: 'House Price Index', source: 'FHFA HPI', provenance: 'live', fetched_at: GENERATED_AT },
        { block: 'Opportunity Zone', source: 'IRS / CDFI Opportunity Zones', provenance: 'live', fetched_at: GENERATED_AT },
        { block: 'Building violations', source: 'NYC Open Data — HPD / ECB / DOB', provenance: 'live', fetched_at: GENERATED_AT },
        { block: 'Ownership / landlord portfolio', source: 'NYC Open Data — HPD registrations', provenance: 'live', fetched_at: GENERATED_AT },
      ],
    },
    generatedAt: GENERATED_AT,
  };
}

// One representative model per implemented document type.
export const SAMPLE_MODELS: Record<string, RenderModel> = {
  tax_appeal_packet: taxAppealSample(),
  site_screening_memo: siteScreeningSample(),
  three_site_comparison_brief: comparisonSample(),
};
