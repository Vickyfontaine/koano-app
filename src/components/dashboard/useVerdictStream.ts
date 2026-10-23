"use client";

// useVerdictStream — client state machine over /api/agents/stream.
// One instance = one site's pipeline run. Used by the single-address
// VerdictWorkbench and (three instances) by the Cluster 4 site comparison.
// Every progress update reflects a real pipeline event — never simulated.

import { useCallback, useState } from "react";
import type { AgentProgress, PipelinePhase } from "@/components/ui/LoadingState";
import type { AgentName, SynthesisResult } from "@/components/ui/verdict";
import type { WeightingBreakdown } from "../../../lib/agents/breakdown";
import { useUpgrade, isUpgradeRequired } from "./UpgradeProvider";
import type { RunPayload } from "./useAddressResolver";

export interface RunDegradation {
  degraded: boolean;
  timeouts: number;
  throttled: number;
  hosts: string[];
}

export interface StreamComplete {
  resolved_address: {
    input: string;
    normalized: string;
    bbl: string | null;
    tract_geoid: string | null;
    location_confidence: "confirmed" | "unconfirmed";
  };
  verdict: SynthesisResult;
  // Present when the run hit throttle/timeout degradation (a fixable condition).
  degradation?: RunDegradation;
  persisted: boolean;
  persist_error: string | null;
  /** The stored record's id (for the share link), when persisted. */
  verdict_id?: string | null;
}

type StreamEvent =
  | { type: "start"; agents: AgentName[] }
  | { type: "geocoded"; normalized: string; bbl: string | null }
  | {
      type: "agent_complete";
      agent: AgentName;
      verdict: AgentProgress["verdict"];
      confidence: number;
      overall_provenance: AgentProgress["overall_provenance"];
      contribution?: number;
      data_point_count?: number;
      live_count?: number;
    }
  | { type: "synthesis_start" }
  | ({ type: "decision" } & StreamDecision)
  | { type: "narration_start" }
  | ({ type: "complete" } & StreamComplete)
  | { type: "error"; error: string };

/** The computed decision, received before the narrator writes (WS5, the Bench). */
export interface StreamDecision {
  verdict: SynthesisResult["verdict"];
  confidence: number;
  risk_score: number;
  signal_window_months: number;
  overall_provenance: AgentProgress["overall_provenance"];
  breakdown: WeightingBreakdown;
}

export type VerdictStreamStatus = "idle" | "running" | "done" | "error";

export interface VerdictStream {
  status: VerdictStreamStatus;
  phase: PipelinePhase;
  agents: Partial<Record<AgentName, AgentProgress>>;
  normalized: string | null;
  startedAt: number;
  result: StreamComplete | null;
  error: string | null;
  decision: StreamDecision | null;
  // Accepts a raw address (geocoded server-side) OR a chosen disambiguation
  // candidate (BBL re-derived server-side from the selected point).
  run: (input: string | RunPayload) => Promise<void>;
  reset: () => void;
}

export function useVerdictStream(): VerdictStream {
  const { openUpgrade } = useUpgrade();
  const [status, setStatus] = useState<VerdictStreamStatus>("idle");
  const [phase, setPhase] = useState<PipelinePhase>("geocoding");
  const [agents, setAgents] = useState<Partial<Record<AgentName, AgentProgress>>>({});
  const [normalized, setNormalized] = useState<string | null>(null);
  const [startedAt, setStartedAt] = useState(0);
  const [result, setResult] = useState<StreamComplete | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [decision, setDecision] = useState<StreamDecision | null>(null);

  const reset = useCallback(() => {
    setStatus("idle");
    setPhase("geocoding");
    setAgents({});
    setNormalized(null);
    setResult(null);
    setError(null);
    setDecision(null);
  }, []);

  const run = useCallback(async (input: string | RunPayload) => {
    const payload: RunPayload = typeof input === "string" ? { address: input } : input;
    setStatus("running");
    setPhase("geocoding");
    setAgents({});
    setNormalized(null);
    setResult(null);
    setError(null);
    setDecision(null);
    setStartedAt(Date.now());

    const handleEvent = (event: StreamEvent) => {
      switch (event.type) {
        case "start":
          break;
        case "geocoded":
          setNormalized(event.normalized);
          setPhase("agents");
          break;
        case "agent_complete":
          setAgents((prev) => ({
            ...prev,
            [event.agent]: {
              state: "complete",
              verdict: event.verdict,
              confidence: event.confidence,
              overall_provenance: event.overall_provenance,
              contribution: event.contribution,
              data_point_count: event.data_point_count,
              live_count: event.live_count,
            },
          }));
          break;
        case "synthesis_start":
          setPhase("synthesis");
          break;
        case "decision":
          setDecision({
            verdict: event.verdict,
            confidence: event.confidence,
            risk_score: event.risk_score,
            signal_window_months: event.signal_window_months,
            overall_provenance: event.overall_provenance,
            breakdown: event.breakdown,
          });
          break;
        case "narration_start":
          setPhase("narration");
          break;
        case "complete":
          setResult(event);
          setStatus("done");
          break;
        case "error":
          setError(event.error);
          setStatus("error");
          break;
      }
    };

    try {
      const res = await fetch("/api/agents/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        // Free-tier limit → surface the upgrade screen, not a raw error.
        if (isUpgradeRequired(res.status, json)) {
          openUpgrade({ plan: json.plan, kind: json.kind, limit: json.limit });
          setStatus("idle");
          return;
        }
        throw new Error(json?.error || `Request failed (${res.status})`);
      }
      if (!res.body) throw new Error("No response stream");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let newlineIdx: number;
        while ((newlineIdx = buffer.indexOf("\n")) >= 0) {
          const line = buffer.slice(0, newlineIdx).trim();
          buffer = buffer.slice(newlineIdx + 1);
          if (line) handleEvent(JSON.parse(line) as StreamEvent);
        }
      }
      const tail = buffer.trim();
      if (tail) handleEvent(JSON.parse(tail) as StreamEvent);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
      setStatus("error");
    }
  }, [openUpgrade]);

  return { status, phase, agents, normalized, startedAt, result, error, decision, run, reset };
}
