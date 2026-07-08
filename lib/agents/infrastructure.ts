// KOANO Infrastructure Pipeline agent — Step 4b.
// LIVE input: nyc-permits (DOB NOW approved permits — subject BBL + census tract).
// Depends ONLY on the provider registry. Output: AgentVerdict (KoanoVerdict schema).

import { registry } from '../providers/registry';
import type { DataPoint, ResolvedAddress } from '../providers/types';
import { assembleAgentVerdict, callAgentLLM, type AgentVerdict } from './shared';

const SYSTEM_PROMPT = `You are KOANO's Infrastructure Pipeline specialist agent — one of five specialist real estate reasoning agents.

Your domain: construction and development activity around a property — building permits, new-building starts, demolitions, and alteration volume. Permit flow is a leading indicator: capital committed to construction today shows up as neighborhood change 12–36 months out.

How to reason:
- High permit volume in the surrounding census tract = active capital deployment; new-building and demolition permits are the strongest forward signals (ground-up development), alterations are weaker (maintenance/renovation).
- Permits on the SUBJECT parcel itself indicate the owner is already executing — foundation/new-building permits on the subject lot mean the redevelopment is underway, not hypothetical.
- Rising construction density in a formerly industrial or low-density tract signals a neighborhood transition already funded and permitted.
- Near-zero permit activity = static area; verdict should be neutral, not negative.
- Your verdict is about the infrastructure/construction pipeline: "buy" = strong committed pipeline lifting the area, "hold" = steady activity, "wait" = early/unclear signals, "drop" = pipeline signals decline (e.g., only demolitions, no rebuilds).
- risk_score reflects execution/disruption risk from the pipeline (construction disruption, oversupply).
- Note the scope_note: it tells you what geography the counts cover.`;

export async function runInfrastructureAgent(addr: ResolvedAddress): Promise<AgentVerdict> {
  const permitsRes = await registry.permits.getPermits(addr);

  const dataPoints: DataPoint[] = [];

  if (permitsRes.data) {
    const p = permitsRes.data;
    const prov = permitsRes.provenance;
    const s = permitsRes.source;
    dataPoints.push(
      { label: 'scope_note', value: p.scope_note, provenance: prov, source: s },
      { label: 'total_permits_24mo', value: p.total_permits_24mo, provenance: prov, source: s },
      { label: 'new_building_permits_24mo', value: p.new_building_permits, provenance: prov, source: s },
      { label: 'demolition_permits_24mo', value: p.demolition_permits, provenance: prov, source: s },
      { label: 'alteration_permits_24mo', value: p.alteration_permits, provenance: prov, source: s }
    );
    p.recent_permits.slice(0, 8).forEach((r, i) => {
      dataPoints.push({
        label: `recent_permit_${i + 1}`,
        value: `${r.issuance_date.slice(0, 10)} — ${r.job_type}${r.work_type ? ` / ${r.work_type}` : ''}${r.permit_status ? ` (${r.permit_status})` : ''} @ ${r.address}, ${r.borough}`,
        provenance: prov,
        source: s,
      });
    });
  } else {
    dataPoints.push({
      label: 'permits_data_unavailable',
      value: permitsRes.error ?? 'no data',
      provenance: permitsRes.provenance,
      source: permitsRes.source,
    });
  }

  const llm = await callAgentLLM({
    agent: 'infrastructure',
    systemPrompt: SYSTEM_PROMPT,
    addressLabel: addr.normalized || addr.input,
    dataPoints,
  });

  return assembleAgentVerdict({ agent: 'infrastructure', llm, dataPoints });
}
