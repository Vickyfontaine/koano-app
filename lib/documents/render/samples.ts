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

// One representative model per implemented document type.
export const SAMPLE_MODELS: Record<string, RenderModel> = {
  tax_appeal_packet: taxAppealSample(),
};
