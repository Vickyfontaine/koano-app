// Completion memo — identical inputs give an identical decision.
//
// Why: the five specialists run at temperature 0, yet the model still varies
// run to run on identical inputs. The stored record for 425 6th St on
// 2026-10-23 (41 runs) shows Demand Sentiment flipping HOLD <-> WAIT, which moves
// agent agreement from 4 of 5 to 3 of 5 and the confidence from 79 to 69, plus
// a point of wobble from the conviction bands. Everything downstream of the
// completion text is already deterministic (the fixture proves it), so the fix
// is at the seam: the first completion for an exact request is kept and reused.
//
// The key is a SHA-256 of the full request: model, temperature, system prompt
// (with the response-format instructions) and messages. The agent prompt carries
// only each data point's label, value, provenance and source (no timestamps), so
// the same public record and the same code produce the same key; any change in
// the data, the prompt or the model produces a new one. Only temperature-0 calls
// are memoized (the five specialists); the narrator writes prose and decides
// nothing.
//
// Storage: an in-process map, backed by the durable Supabase table
// agent_completion_memo (migration-024) so every serverless instance shares it.
// Until the migration is applied the durable layer is skipped (one warning) and
// runs fall back to per-instance memoization. KOANO_COMPLETION_MEMO=off disables
// it. The fixture cassette sits OUTSIDE this seam, so replays are unaffected.

import crypto from 'node:crypto';
import { supabaseAdmin } from '../supabase/server';

export interface CompletionMemoStore {
  get(key: string): Promise<string | null>;
  set(key: string, completion: string, meta: { agent: string; model: string }): Promise<void>;
}

export interface CompletionRequest {
  agent: string;
  model: string;
  temperature: number;
  system: string;
  messages: unknown;
}

function stable(v: unknown): string {
  if (v === null || typeof v !== 'object') return JSON.stringify(v) ?? 'null';
  if (Array.isArray(v)) return '[' + v.map(stable).join(',') + ']';
  const o = v as Record<string, unknown>;
  return '{' + Object.keys(o).sort().map((k) => JSON.stringify(k) + ':' + stable(o[k])).join(',') + '}';
}

export function completionKey(req: CompletionRequest): string {
  const { model, temperature, system, messages } = req;
  return crypto.createHash('sha256').update(stable({ model, temperature, system, messages })).digest('hex');
}

const memory = new Map<string, string>();
let durable: CompletionMemoStore | null | undefined; // undefined = not yet resolved
let warned = false;

function supabaseStore(): CompletionMemoStore | null {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  const disable = (err: { message?: string } | null) => {
    if (!warned) {
      warned = true;
      console.warn(`[completion-memo] durable store unavailable (${err?.message ?? 'unknown'}); memoizing per instance only. Apply migration-024.`);
    }
    durable = null;
  };
  return {
    async get(key) {
      const { data, error } = await supabaseAdmin().from('agent_completion_memo').select('completion').eq('key', key).maybeSingle();
      if (error) {
        disable(error);
        return null;
      }
      return (data?.completion as string | undefined) ?? null;
    },
    async set(key, completion, meta) {
      const { error } = await supabaseAdmin()
        .from('agent_completion_memo')
        .upsert({ key, completion, agent: meta.agent, model: meta.model }, { onConflict: 'key', ignoreDuplicates: true });
      if (error) disable(error);
    },
  };
}

/** Tests and scripts: replace the durable store (null = none) and clear the in-process map. */
export function setCompletionMemoStore(store: CompletionMemoStore | null): void {
  durable = store;
  memory.clear();
}

/** Tests: forget the in-process map only (a fresh serverless instance). */
export function clearCompletionMemoryLayer(): void {
  memory.clear();
}

export async function memoizedCompletion(req: CompletionRequest, live: () => Promise<string>): Promise<string> {
  if (req.temperature !== 0 || process.env.KOANO_COMPLETION_MEMO === 'off') return live();
  const key = completionKey(req);
  const hit = memory.get(key);
  if (hit !== undefined) return hit;
  if (durable === undefined) durable = supabaseStore();
  if (durable) {
    try {
      const stored = await durable.get(key);
      if (stored != null) {
        memory.set(key, stored);
        return stored;
      }
    } catch {
      durable = null;
    }
  }
  const text = await live();
  memory.set(key, text);
  if (durable) {
    try {
      await durable.set(key, text, { agent: req.agent, model: req.model });
    } catch {
      durable = null;
    }
  }
  return text;
}
