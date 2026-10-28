// Write the stream events of the recorded 175 3rd St run as NDJSON, replayed
// OFFLINE through the real pipeline from the verdict-reproducibility fixture
// (frozen provider results and completions; KOANO's code runs live on top).
// A capture harness serves the file in place of /api/agents/stream when a live
// run is not possible (no Anthropic credit), so the band and its drawer render
// a real, frozen verdict. Never used by the product.
//   npx tsx scripts/ui/fixture-stream.ts <out.ndjson>
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadEnv } from '../_loadenv';
loadEnv();
import { registry } from '../../lib/providers/registry';
import { runKoanoPipeline } from '../../lib/agents/synthesis';
import { installProviderCassette, beginReplay, replayMisses, stop } from '../../lib/testing/cassette';

const out = process.argv[2] ?? 'fixture-stream.ndjson';
const fx = JSON.parse(readFileSync(join(process.cwd(), 'scripts', 'fixtures', 'nyc-175-3rd-st.json'), 'utf8')) as {
  address: string;
  records: { key: string; value: unknown }[];
};

(async () => {
  installProviderCassette(registry as unknown as Record<string, unknown>);
  beginReplay(fx.records);
  const events: object[] = [{ type: 'start', agents: ['market-timing', 'infrastructure', 'demand-sentiment', 'risk-volatility', 'regulatory-policy'] }];
  const { resolved_address, verdict, degradation } = await runKoanoPipeline(fx.address, (e: object) => events.push(e));
  const misses = replayMisses();
  stop();
  if (misses.length) throw new Error(`replay missed ${misses.length} records`);
  events.push({
    type: 'complete',
    resolved_address: {
      input: resolved_address.input,
      normalized: resolved_address.normalized,
      bbl: resolved_address.bbl,
      tract_geoid: resolved_address.tract_geoid,
      location_confidence: resolved_address.location_confidence,
    },
    verdict,
    degradation,
    persisted: false,
    persist_error: 'fixture replay, not recorded',
    verdict_id: null,
  });
  writeFileSync(out, events.map((e) => JSON.stringify(e)).join('\n') + '\n');
  console.log(`${events.length} events, ${verdict.verdict} conf ${verdict.confidence} -> ${out}`);
})();
