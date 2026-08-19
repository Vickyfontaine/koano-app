// KOANO document engine — grounded narrative helper.
// Document narratives (unlike agent reasoning) make their own model calls, so
// they don't pass through callAgentLLM's grounding gate. This applies the SAME
// detector: a narrative may reference only the figures the document renders. On
// an ungrounded claim it re-prompts once, then withholds the offending paragraph
// with a VISIBLE note (never silently), and falls back to the deterministic
// version if the whole narrative fails.

import type { DataPoint } from '../providers/types';
import { getAnthropicClient, KOANO_RUNTIME_MODEL } from '../../lib/agents/shared';
import { buildAllowedTokens, groundObservation } from '../../lib/agents/grounding';

// Client-facing wording (distinct from the reasoning-chain WITHHELD_OBSERVATION):
// a sentence-level omission a layperson understands, honest that the chain is
// incomplete rather than wrong.
export const WITHHELD_NARRATIVE_SENTENCE =
  '[A statement was omitted here because it could not be traced to the figures in this report.]';

function splitParas(text: string): string[] {
  return text
    .split(/\n{2,}/)
    .map((p) => p.replace(/\*\*(.+?)\*\*/g, '$1').replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

export async function runGroundedNarrative(args: {
  systemPrompt: string;
  factsPayload: unknown;
  allowedDataPoints: DataPoint[];
  addressLabel: string;
  deterministicFallback: string[];
  maxTokens?: number;
}): Promise<string[]> {
  const { systemPrompt, factsPayload, allowedDataPoints, addressLabel, deterministicFallback, maxTokens = 520 } = args;
  const allowed = buildAllowedTokens(allowedDataPoints, addressLabel);

  const call = async (messages: { role: 'user' | 'assistant'; content: string }[]): Promise<string> => {
    const msg = await getAnthropicClient().messages.create({
      model: KOANO_RUNTIME_MODEL,
      max_tokens: maxTokens,
      system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral' } }],
      messages,
    });
    const block = msg.content.find((b) => b.type === 'text');
    return block && block.type === 'text' ? block.text.trim() : '';
  };

  const userPayload = JSON.stringify(factsPayload, null, 2);
  const firstText = await call([{ role: 'user', content: userPayload }]);
  const firstParas = splitParas(firstText);
  if (firstParas.length === 0) return deterministicFallback;

  const firstGround = firstParas.map((p) => groundObservation(p, allowed));
  if (firstGround.every((g) => g.grounded)) return firstParas;

  const terms = Array.from(new Set(firstGround.flatMap((g) => g.ungrounded)));
  console.warn(`[grounding] document narrative: untraceable ${JSON.stringify(terms)} — re-prompting once`);
  const correction =
    `Some statements could not be traced to the figures provided: ${terms
      .map((t) => `"${t}"`)
      .join(', ')}. These read as general knowledge, not sourced facts. Rewrite using ONLY the figures given — do not name a place, program, statute, year, or designation that is not in the figures. Return the narrative paragraphs only.`;
  const secondText = await call([
    { role: 'user', content: userPayload },
    { role: 'assistant', content: firstText },
    { role: 'user', content: correction },
  ]);
  const base = splitParas(secondText);
  const source = base.length > 0 ? base : firstParas;
  const cleaned = source.map((p) => (groundObservation(p, allowed).grounded ? p : WITHHELD_NARRATIVE_SENTENCE));

  // If nothing survived, the deterministic version is more useful than an
  // all-withheld narrative.
  if (cleaned.every((p) => p === WITHHELD_NARRATIVE_SENTENCE)) return deterministicFallback;
  return cleaned;
}
