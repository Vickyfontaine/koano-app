import { readFileSync } from 'node:fs';
try { const e = readFileSync('.env.local','utf8'); for (const l of e.split('\n')){const m=l.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/); if(m&&!process.env[m[1]])process.env[m[1]]=m[2];} } catch {}
async function main(){
  const { supabaseAdmin } = await import('../lib/supabase/server');
  const cap = await import('../lib/archive/capture');
  const admin = supabaseAdmin();
  const runWeek = cap.isoWeekMonday(new Date());
  console.log(`EMERGENCY full capture — runWeek=${runWeek}\n`);
  const ins = await admin.from('archive_runs').insert({ run_week: runWeek, status:'running', capture_version:'manual-emergency@1' }).select('id').single();
  const runId = ins.data?.id;
  let total = 0;
  const run = async (name:string, fn:()=>Promise<number>) => { try { const n = await fn(); total += n; console.log(`  ${name.padEnd(18)} ${n} rows`); return n; } catch(e){ console.log(`  ${name.padEnd(18)} ERROR: ${e instanceof Error?e.message:e}`); return 0; } };
  await run('sales', () => cap.captureSales(admin, runWeek));
  await run('permits', () => cap.captureTractPermits(admin, runWeek));
  await run('entitlement_cd', () => cap.captureCdEntitlement(admin, runWeek));
  await run('hpi', () => cap.captureHpiIfChanged(admin, runWeek));
  const props = await cap.loadTrackedProperties(admin);
  console.log(`  (${props.length} tracked properties — capturing ALL, unsharded)`);
  try {
    const c = await cap.capturePropertySnapshots(admin, runWeek, props);
    for (const [k,v] of Object.entries(c)) { total += v as number; console.log(`  ${('prop:'+k).padEnd(18)} ${v} rows`); }
  } catch(e){ console.log(`  property snapshots ERROR: ${e instanceof Error?e.message:e}`); }
  if (runId) await admin.from('archive_runs').update({ finished_at:new Date().toISOString(), status:'succeeded', rows_written: total }).eq('id', runId);
  console.log(`\n  TOTAL rows written: ${total}`);
}
main().catch(e=>{console.error(e);process.exit(1);});
