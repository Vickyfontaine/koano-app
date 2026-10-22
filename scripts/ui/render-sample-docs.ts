// Render the sample model of every implemented document type to PDF (white-label
// types rendered white-label, exactly as the route does) for a visual check of
// the document typography. Usage: npx tsx scripts/ui/render-sample-docs.ts <outdir>
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderPdf } from '../../lib/documents/render/pdf';
import { renderDocx } from '../../lib/documents/render/docx';
import { SAMPLE_MODELS } from '../../lib/documents/render/samples';

const WHITE_LABEL = new Set(['cma', 'client_neighborhood_report', 'pricing_recommendation_sheet', 'buyer_seller_net_sheet']);
const out = process.argv[2] ?? 'build-log/docs';
mkdirSync(out, { recursive: true });
(async () => {
  for (const [id, model] of Object.entries(SAMPLE_MODELS)) {
    const m = { ...model, whiteLabel: WHITE_LABEL.has(id) };
    const pdf = await renderPdf(m);
    writeFileSync(join(out, `${id}.pdf`), pdf);
    if (id === 'cma' || id === 'ic_memo') writeFileSync(join(out, `${id}.docx`), await renderDocx(m));
    console.log(`${id}: ${pdf.length} bytes${m.whiteLabel ? ' (white-label)' : ''}`);
  }
})();
