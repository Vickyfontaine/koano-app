// Determinism proof (Phase 0): identical inputs give an identical decision.
//
// Runs the full pipeline OFFLINE on the frozen provider data of the 175 3rd St
// fixture, with a stand-in model that is deliberately NON-deterministic: every
// call cycles its verdict and conviction band, the way the real model wobbles
// at temperature 0 (Demand Sentiment HOLD <-> WAIT on 425 6th St, 69 vs 79).
//   A. memo OFF: two runs on identical inputs must DIFFER (the stand-in really
//      wobbles, so the proof is not vacuous).
//   B. memo ON: five runs, plus a run after the in-process layer is cleared (a
//      fresh serverless instance reading the shared store), must give a
//      byte-identical decision surface.
// Exit 1 on any failure.   npx tsx scripts/test-determinism.ts
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadEnv } from './_loadenv';
loadEnv();
import type Anthropic from '@anthropic-ai/sdk';
import { registry } from '../lib/providers/registry';
import { runKoanoPipeline } from '../lib/agents/synthesis';
import { setAnthropicClientForTests } from '../lib/agents/shared';
import { installProviderCassette, beginReplayThenRecord, stop } from '../lib/testing/cassette';
import { setCompletionMemoStore, clearCompletionMemoryLayer, type CompletionMemoStore } from '../lib/agents/completion-memo';
import { decisionSurface, canonical, diffPaths } from './lib/decision-surface';

const fx = JSON.parse(readFileSync(join(process.cwd(), 'scripts', 'fixtures', 'nyc-175-3rd-st.json'), 'utf8')) as {
  address: string;
  records: { key: string; value: unknown }[];
};
// Provider records only: the LLM layer goes to the stand-in model.
const providerRecords = fx.records.filter((r) => !r.key.startsWith('llm'));

const VERDICTS = ['hold', 'wait', 'buy', 'hold', 'sell'];
const BANDS = ['medium', 'high', 'low'];
let calls = 0;
const wobblyModel = {
  messages: {
    async create(params: { messages: { role: string; content: unknown }[] }) {
      const n = calls++;
      const first = params.messages[0]?.content;
      let dp: { label: string; value: unknown; source: string } = { label: 'subject', value: 'n/a', source: 'n/a' };
      try {
        const payload = JSON.parse(String(first)) as { data_points?: { label: string; value: unknown; source: string }[] };
        dp = payload.data_points?.find((d) => typeof d.value === 'number') ?? payload.data_points?.[0] ?? dp;
      } catch {
        /* the narrator's payload has a different shape; the generic reply still parses */
      }
      const obs = `${dp.label} is ${String(dp.value)}`;
      const reply = {
        verdict: VERDICTS[n % VERDICTS.length],
        conviction: BANDS[n % BANDS.length],
        risk_band: 'moderate',
        window_band: 'medium',
        headline: obs,
        reasoning: [{ observation: obs, sources: [dp.source] }],
        minority_signals: [],
      };
      return { content: [{ type: 'text', text: JSON.stringify(reply) }] };
    },
  },
} as unknown as Anthropic;

const sharedStore = new Map<string, string>();
const store: CompletionMemoStore = {
  async get(k) {
    return sharedStore.get(k) ?? null;
  },
  async set(k, v) {
    sharedStore.set(k, v);
  },
};

async function run(): Promise<string> {
  beginReplayThenRecord(providerRecords as never);
  const r = await runKoanoPipeline(fx.address);
  stop();
  return canonical(decisionSurface(r));
}

(async () => {
  installProviderCassette(registry as unknown as Record<string, unknown>);
  setAnthropicClientForTests(wobblyModel);

  process.env.KOANO_COMPLETION_MEMO = 'off';
  const a1 = await run();
  const a2 = await run();
  const aDiffers = a1 !== a2;
  console.log(`A. memo off: two runs on identical inputs ${aDiffers ? 'DIFFER' : 'match'} (${diffPaths(JSON.parse(a1), JSON.parse(a2)).length} fields)`);

  delete process.env.KOANO_COMPLETION_MEMO;
  setCompletionMemoStore(store);
  const b: string[] = [];
  for (let i = 0; i < 5; i++) b.push(await run());
  clearCompletionMemoryLayer();
  b.push(await run());
  const bSame = b.every((x) => x === b[0]);
  console.log(`B. memo on: ${b.length} runs (the last after clearing the in-process layer) ${bSame ? 'BYTE-IDENTICAL' : 'DIFFER'}`);
  if (!bSame) for (let i = 1; i < b.length; i++) if (b[i] !== b[0]) console.log(`   run ${i + 1}: ${diffPaths(JSON.parse(b[0]), JSON.parse(b[i])).slice(0, 6).join(', ')}`);
  const s = JSON.parse(b[0]) as { verdict: string; confidence: number };
  console.log(`   decision: ${s.verdict} at confidence ${s.confidence}; stand-in model calls ${calls}; memo entries ${sharedStore.size}`);

  if (!aDiffers) {
    console.log('✗ the stand-in model did not wobble; the proof would be vacuous');
    process.exit(1);
  }
  if (!bSame) {
    console.log('✗ identical inputs gave different decisions with the memo on');
    process.exit(1);
  }
  console.log('✓ identical inputs give an identical decision');
})();
