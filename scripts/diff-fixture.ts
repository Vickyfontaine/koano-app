// Preview how the CURRENT code moves the verdict decision surface vs the committed
// fixture — WITHOUT re-recording. This is the "show me the diff before re-recording"
// tool: it does a LIVE run of the new pipeline, extracts the decision surface, and
// diffs it against the committed fixture's expected surface. Read the diff, decide
// whether the movement is intended and sensible, THEN run record-fixture.ts.
//
// NOTE on noise: a single live run carries the normal temp-0 band wobble (top-line
// confidence ±1-2 between independent runs — see CLAUDE.md §07C). Runs N times and
// flags which changed fields are STABLE across all runs (the real signal of the
// code change) vs which only appear in some (sampling wobble).
// Usage: npx tsx scripts/diff-fixture.ts [runs]
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { loadEnv } from './_loadenv';
loadEnv();
import { runKoanoPipeline } from '../lib/agents/synthesis';
import { decisionSurface, diffPaths, type DecisionSurface } from './lib/decision-surface';

const FIXTURE_PATH = join(process.cwd(), 'scripts', 'fixtures', 'nyc-175-3rd-st.json');
const RUNS = Number(process.argv[2] ?? 2);

(async () => {
  const fx = JSON.parse(readFileSync(FIXTURE_PATH, 'utf8')) as { address: string; expected: DecisionSurface };

  // Per-run diff lines vs the committed baseline, and a tally of how often each
  // leaf path changed — so stable (every-run) changes separate from wobble.
  const seen = new Map<string, number>();
  const perRun: string[][] = [];
  for (let i = 1; i <= RUNS; i++) {
    const result = await runKoanoPipeline(fx.address);
    const actual = decisionSurface(result);
    const lines = diffPaths(fx.expected, actual);
    perRun.push(lines);
    for (const l of lines) {
      const path = l.split(':')[0];
      seen.set(path, (seen.get(path) ?? 0) + 1);
    }
    console.log(`\n[run ${i}] ${actual.verdict.toUpperCase()} conf ${actual.confidence} risk ${actual.risk_score} prov ${actual.overall_provenance} | ${lines.length} changed field(s) vs baseline`);
    for (const l of lines) console.log(`    ${l}`);
  }

  const e = fx.expected;
  console.log(`\n──────── baseline (committed fixture): ${e.verdict.toUpperCase()} conf ${e.confidence} risk ${e.risk_score} prov ${e.overall_provenance} | era ${e.breakdown.inputs_era ?? '(none)'}`);
  console.log(`──────── change classification across ${RUNS} run(s):`);
  const paths = Array.from(seen.entries()).sort((a, b) => b[1] - a[1]);
  for (const [path, count] of paths) {
    const tag = count === RUNS ? 'STABLE (every run — code change)' : `wobble (${count}/${RUNS} runs — sampling noise)`;
    console.log(`    ${path}  —  ${tag}`);
  }
  console.log(`\nIf every STABLE change is intended and sensible, re-record: npx tsx scripts/record-fixture.ts\n`);
  process.exit(0);
})();
