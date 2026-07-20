"use client";

// VerdictWorkbench — Checkpoint 2 (Phase B).
// AddressInput → useVerdictStream (/api/agents/stream) → LoadingState (real
// agent-by-agent progress) → VerdictCard + ReasoningChain. Shared by clusters
// without a specialized dashboard yet.

import React from "react";
import AddressInput from "@/components/ui/AddressInput";
import LoadingState from "@/components/ui/LoadingState";
import VerdictCard from "@/components/ui/VerdictCard";
import ReasoningChain from "@/components/ui/ReasoningChain";
import { useVerdictStream } from "./useVerdictStream";

export default function VerdictWorkbench() {
  const stream = useVerdictStream();
  const { status, result } = stream;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <AddressInput onSubmit={stream.run} busy={status === "running"} />

      {status === "idle" && (
        /* Empty state — approved copy (KOANO_COPY.md) */
        <div style={{ maxWidth: "620px" }}>
          <h3 style={{ fontSize: "18px", fontWeight: 500, color: "var(--ink-primary)", margin: "0 0 8px" }}>
            Enter an address to begin.
          </h3>
          <p style={{ fontSize: "14px", lineHeight: 1.6, color: "var(--ink-muted)", margin: 0 }}>
            KOANO runs five agents against it and returns a single verdict with
            the reasoning attached.
          </p>
        </div>
      )}

      {status === "running" && (
        <LoadingState
          phase={stream.phase}
          agents={stream.agents}
          startedAt={stream.startedAt}
          normalizedAddress={stream.normalized}
        />
      )}

      {status === "error" && (
        <div
          style={{
            border: "1px solid var(--border)",
            borderLeft: "3px solid var(--signal-negative)",
            borderRadius: "0 12px 12px 0",
            padding: "16px 20px",
            maxWidth: "620px",
          }}
        >
          <p style={{ fontSize: "14px", color: "var(--ink-secondary)", margin: 0 }}>
            Analysis failed: {stream.error}
          </p>
          <p style={{ fontSize: "12px", color: "var(--ink-faint)", margin: "6px 0 0" }}>
            Live NYC data is deepest — try a New York City street address.
          </p>
        </div>
      )}

      {status === "done" && result && (
        <>
          <VerdictCard verdict={result.verdict} address={result.resolved_address.normalized} />
          <ReasoningChain
            reasoningChain={result.verdict.reasoning_chain}
            minoritySignals={result.verdict.minority_signals}
            agentSummaries={result.verdict.agent_summaries}
          />
          <p
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "11px",
              color: "var(--ink-faint)",
              margin: 0,
            }}
          >
            {result.persisted
              ? "Recorded to your verdict history (append-only audit trail)"
              : `Not recorded: ${result.persist_error ?? "persistence unavailable"}`}
          </p>
        </>
      )}
    </div>
  );
}
