// No em dashes in model-written prose (Phase 0). Unit cases for the guard, then
// the recorded run replayed offline: its narrator headline, every reasoning
// observation and every minority signal must carry no em dash.
//   npx tsx scripts/test-em-dash.ts
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadEnv } from './_loadenv';
loadEnv();
import { withoutEmDashes } from '../lib/agents/punctuation';
import { registry } from '../lib/providers/registry';
import { runKoanoPipeline } from '../lib/agents/synthesis';
import { installProviderCassette, beginReplay, replayMisses, stop } from '../lib/testing/cassette';

const CASES: [string, string][] = [
  ['Strong demand — permits are up', 'Strong demand, permits are up'],
  ['Strong demand—permits are up', 'Strong demand, permits are up'],
  ['Strong demand – permits are up', 'Strong demand, permits are up'],
  ['a 2–3 year window', 'a 2–3 year window'],
  ['— Market timing leads', 'Market timing leads'],
  ['the panel agrees —', 'the panel agrees.'],
  ['one — two — three.', 'one, two, three.'],
  ['ends with a dash —.', 'ends with a dash.'],
  ['no dash here', 'no dash here'],
];

let fail = 0;
for (const [input, want] of CASES) {
  const got = withoutEmDashes(input);
  if (got !== want) {
    fail++;
    console.log(`✗ ${JSON.stringify(input)} -> ${JSON.stringify(got)}, want ${JSON.stringify(want)}`);
  }
}
console.log(`unit: ${CASES.length - fail} of ${CASES.length} pass`);

(async () => {
  const fx = JSON.parse(readFileSync(join(process.cwd(), 'scripts', 'fixtures', 'nyc-175-3rd-st.json'), 'utf8'));
  installProviderCassette(registry as unknown as Record<string, unknown>);
  beginReplay(fx.records);
  const r = await runKoanoPipeline(fx.address);
  const misses = replayMisses();
  stop();
  if (misses.length) {
    console.log(`✗ replay missed ${misses.length} records`);
    process.exit(1);
  }
  const v = r.verdict as unknown as {
    headline: string;
    reasoning_chain: { conclusion?: string; evidence?: unknown }[];
    minority_signals: { dissent?: string; signal?: string }[];
  };
  const texts = [v.headline, ...v.reasoning_chain.map((s) => String(s.conclusion ?? '')), ...v.minority_signals.map((m) => String(m.dissent ?? m.signal ?? ''))];
  const bad = texts.filter((t) => /[—―]/.test(t));
  console.log(`replay: ${texts.length} narrator and agent sentences, ${bad.length} with an em dash`);
  for (const b of bad) console.log(`   ✗ ${b.slice(0, 120)}`);
  if (fail || bad.length) process.exit(1);
  console.log('✓ no em dashes');
})();
