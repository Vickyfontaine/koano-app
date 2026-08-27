// SURGICAL re-record: for a decision-code change that alters ONLY a downstream
// call (e.g. rewording the structural-driver string, which feeds only the
// synthesis narrator), re-record just that call. The upstream specialists replay
// from the existing fixture byte-for-byte, so their bands and the confidence they
// feed do NOT resample — the fixture diff is exactly what changed, with none of a
// full re-record's run-to-run temp-0 wobble.
//
// Use ONLY when the change provably cannot affect the replayed calls (here: the
// driver text is fed to the narrator, never to the five specialists). For any
// change that could move an upstream call, use record-fixture.ts (full re-record).
// Usage: npx tsx scripts/rerecord-surgical.ts
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { loadEnv } from './_loadenv';
loadEnv();
import { registry } from '../lib/providers/registry';
import { runKoanoPipeline } from '../lib/agents/synthesis';
import {
  installProviderCassette,
  beginReplayThenRecord,
  dumpUsedRecords,
  replayMisses,
  stop,
} from '../lib/testing/cassette';
import { decisionSurface } from './lib/decision-surface';

const ADDRESS = '175 3rd Street, Brooklyn, NY';
const FIXTURE_PATH = join(process.cwd(), 'scripts', 'fixtures', 'nyc-175-3rd-st.json');

(async () => {
  let git = 'unknown';
  try {
    git = execSync('git rev-parse HEAD').toString().trim();
  } catch {
    /* not fatal */
  }

  const prior = JSON.parse(readFileSync(FIXTURE_PATH, 'utf8')) as {
    records: { key: string; value: unknown }[];
  };

  installProviderCassette(registry as unknown as Record<string, unknown>);
  beginReplayThenRecord(prior.records);
  const result = await runKoanoPipeline(ADDRESS);
  const records = dumpUsedRecords();
  const recorded = replayMisses();
  stop();

  const expected = decisionSurface(result);
  const providerRecs = records.filter((r) => r.key.startsWith('provider:')).length;
  const llmRecs = records.filter((r) => r.key.startsWith('llm#')).length;

  writeFileSync(
    FIXTURE_PATH,
    JSON.stringify(
      {
        note: 'KOANO Phase 5 regression fixture. Frozen provider results + raw LLM completions + the expected DECISION SURFACE. Replayed offline by scripts/test-fixture.ts. Re-record only on an intended decision change or a model change; never hand-edit.',
        address: ADDRESS,
        recorded_at: new Date().toISOString(),
        git_commit: git,
        record_counts: { providers: providerRecs, llm: llmRecs, total: records.length },
        expected,
        records,
      },
      null,
      2,
    ),
  );

  console.log(`\n✓ Surgically re-recorded fixture → ${FIXTURE_PATH}`);
  console.log(`  git ${git.slice(0, 12)} | ${providerRecs} provider records, ${llmRecs} LLM records`);
  console.log(`  live-recorded ${recorded.length} call(s) (the rest replayed frozen): ${recorded.join(', ') || 'none'}`);
  console.log(
    `  decision: ${expected.verdict.toUpperCase()} conf ${expected.confidence} risk ${expected.risk_score} ` +
      `prov ${expected.overall_provenance} | agent-score ${expected.breakdown.aggregate_score} ` +
      `+ nudge ${expected.breakdown.structural_nudge} = ${expected.breakdown.final_score}`,
  );
  console.log(
    `  agents: ${expected.agents.map((a) => `${a.agent.slice(0, 4)}:${a.verdict}/${a.confidence}/r${a.risk_score}`).join('  ')}\n`,
  );
  process.exit(0);
})();
