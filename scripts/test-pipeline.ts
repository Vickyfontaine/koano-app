// Full KOANO pipeline test — Step 5.
// Usage: npx tsx scripts/test-pipeline.ts ["address"]
// Geocode → 5 specialist agents (Promise.all) → synthesis → print full verdict JSON.

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

try {
  const env = readFileSync(join(process.cwd(), '.env.local'), 'utf8');
  for (const line of env.split('\n')) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
} catch {
  // rely on shell env
}

const DEFAULT_ADDRESS = '175 3rd Street, Brooklyn, NY 11215';

async function main() {
  const address = process.argv[2] ?? DEFAULT_ADDRESS;
  console.log(`\n=== KOANO full pipeline test ===`);
  console.log(`Address: ${address}\n`);

  const { runKoanoPipeline } = await import('../lib/agents/synthesis');

  const t0 = Date.now();
  const result = await runKoanoPipeline(address);
  const ms = Date.now() - t0;

  console.log('--- FULL UNIFIED VERDICT (KoanoVerdict JSON) ---');
  console.log(JSON.stringify(result.verdict, null, 2));

  console.log('\n--- specialist panel ---');
  for (const a of result.agents) {
    console.log(
      `  ${a.agent.padEnd(18)} ${a.verdict.toUpperCase().padEnd(5)} conf=${String(a.confidence).padStart(3)} risk=${String(a.risk_score).padStart(3)} prov=${a.overall_provenance.toUpperCase().padEnd(14)} live_dp=${a.data_points.filter((d) => d.provenance === 'live').length}/${a.data_points.length}`
    );
  }

  const v = result.verdict;
  console.log('\n--- synthesis summary ---');
  console.log(`verdict:             ${v.verdict.toUpperCase()} (confidence ${v.confidence}, risk ${v.risk_score}, window ${v.signal_window_months}mo)`);
  console.log(`headline:            ${v.headline}`);
  console.log(`overall_provenance:  ${v.overall_provenance.toUpperCase()} (weakest input rule)`);
  console.log(`reasoning steps:     ${v.reasoning_chain.length} total (${v.reasoning_chain.filter((r) => r.agent === 'synthesis').length} synthesis arbitration steps)`);
  console.log(`minority signals:    ${v.minority_signals.length}`);
  console.log(`data sources:        ${v.top_data_sources.length}`);
  console.log(`elapsed:             ${(ms / 1000).toFixed(1)}s`);
}

main().catch((e) => {
  console.error('Pipeline test failed:', e);
  process.exit(1);
});
