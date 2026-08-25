// Replay the Phase 5 regression fixture OFFLINE and assert the decision surface
// is byte-identical to the recorded one. No network, no LLM: every provider
// result and raw completion is served from the cassette, and all of KOANO's
// deterministic decision code runs live on top. A mismatch = a decision-code
// regression (model drift can't cause one — the completions are frozen).
// Usage: npx tsx scripts/test-fixture.ts
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadEnv } from './_loadenv';
loadEnv(); // harmless; replay needs no keys
import { registry } from '../lib/providers/registry';
import { runKoanoPipeline } from '../lib/agents/synthesis';
import { installProviderCassette, beginReplay, replayMisses, stop } from '../lib/testing/cassette';
import { decisionSurface, canonical, type DecisionSurface } from './lib/decision-surface';

const FIXTURE_PATH = join(process.cwd(), 'scripts', 'fixtures', 'nyc-175-3rd-st.json');

// Walk two decision surfaces and report the first differing leaf paths — so a RED
// is actionable ("breakdown.final_score: 1.25 → 0.66"), not just "not equal".
function diffPaths(a: unknown, b: unknown, path = ''): string[] {
  if (canonical(a) === canonical(b)) return [];
  if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') {
    return [`${path || '(root)'}: ${JSON.stringify(a)} → ${JSON.stringify(b)}`];
  }
  const keys = Array.from(new Set([...Object.keys(a as object), ...Object.keys(b as object)]));
  const out: string[] = [];
  for (const k of keys) {
    out.push(
      ...diffPaths((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k], path ? `${path}.${k}` : k),
    );
  }
  return out;
}

(async () => {
  const fx = JSON.parse(readFileSync(FIXTURE_PATH, 'utf8')) as {
    address: string;
    git_commit: string;
    record_counts: { providers: number; llm: number; total: number };
    expected: DecisionSurface;
    records: { key: string; value: unknown }[];
  };

  installProviderCassette(registry as unknown as Record<string, unknown>);
  beginReplay(fx.records);
  // A decision regression is caught one of two ways: (a) it changes an input to a
  // downstream LLM call, so replay can't find a matching frozen completion — a
  // REPLAY MISS (viaCassette throws); or (b) it only alters post-LLM math, so
  // replay completes but the decision surface diverges. Both are REDs. Catch the
  // throw so (a) is a clean failure, not a stack trace.
  let result: Awaited<ReturnType<typeof runKoanoPipeline>> | null = null;
  let threw: string | null = null;
  try {
    result = await runKoanoPipeline(fx.address); // fully offline
  } catch (e) {
    threw = e instanceof Error ? e.message : String(e);
  }
  const misses = replayMisses();
  stop();

  console.log(`\nReplay fixture — ${fx.address}`);
  console.log(`  recorded @ ${fx.git_commit.slice(0, 12)} | ${fx.record_counts.providers} provider + ${fx.record_counts.llm} LLM records (offline)`);
  const e0 = fx.expected;
  console.log(
    `  expected: ${e0.verdict.toUpperCase()} conf ${e0.confidence} risk ${e0.risk_score} prov ${e0.overall_provenance} ` +
      `| score ${e0.breakdown.aggregate_score} + nudge ${e0.breakdown.structural_nudge} = ${e0.breakdown.final_score}`,
  );

  if (threw || misses.length > 0) {
    console.log(
      `\n✗ REGRESSION — replay diverged before the decision could be reproduced ` +
        `(${misses.length} replay miss${misses.length === 1 ? '' : 'es'}): a decision-code change altered an ` +
        `input to a downstream call.\n    ${threw ?? ''}\n`,
    );
    process.exit(1);
  }

  const actual = decisionSurface(result!);
  const match = canonical(actual) === canonical(fx.expected);

  if (match) {
    console.log(`  ✓ decision surface BYTE-IDENTICAL on offline replay\n`);
    process.exit(0);
  }

  console.log(`\n✗ DECISION SURFACE DIVERGED from the fixture — a decision-code regression:\n`);
  for (const line of diffPaths(fx.expected, actual)) console.log(`    ${line}`);
  console.log('');
  process.exit(1);
})();
