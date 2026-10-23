"use client";

// VerdictBand (UI sprint WS3, slice 2; A6). The verdict's one home: the first
// block of the workspace in every lens, at most 40vh. It shows the engine's
// actual state, never a placeholder verdict: empty, resolving, the five
// agents reporting in, the verdict with its figures and a provenance summary
// counted from the verdict's own data points, or the error.

import React, { useEffect, useState } from "react";
import { VERDICT_COLORS, PROVENANCE_META, type Provenance } from "@/components/ui/verdict";
import ProvenanceBadge from "@/components/ui/ProvenanceBadge";
import RunDegradationNote from "@/components/ui/RunDegradationNote";
import Bench from "./Bench";
import { useTrace } from "@/components/ui/trace/TraceProvider";
import TraceThread from "@/components/ui/trace/TraceThread";
import { useSubject, type DrawerTab } from "./SubjectProvider";

function riskInk(score: number): string {
  return score >= 67 ? "var(--signal-negative-ink)" : score >= 34 ? "var(--signal-warning-ink)" : "var(--signal-positive-ink)";
}
function riskFill(score: number): string {
  return score >= 67 ? "var(--signal-negative)" : score >= 34 ? "var(--signal-warning)" : "var(--signal-positive)";
}

const SUMMARY_LABEL: Record<Provenance, string> = {
  live: "live",
  partner: "partner",
  representative: "representative",
  fetch_failed: "failed to fetch",
  coverage_absent: "not covered",
};

export function provenanceSummary(points: { provenance: Provenance }[]): { state: Provenance; n: number }[] {
  const order: Provenance[] = ["live", "partner", "representative", "fetch_failed", "coverage_absent"];
  const counts = new Map<Provenance, number>();
  for (const p of points) counts.set(p.provenance, (counts.get(p.provenance) ?? 0) + 1);
  return order.filter((s) => counts.has(s)).map((s) => ({ state: s, n: counts.get(s)! }));
}

const TABS: { id: DrawerTab; label: string }[] = [
  { id: "math", label: "Math" },
  { id: "reasoning", label: "Reasoning" },
  { id: "sources", label: "Sources" },
  { id: "coverage", label: "Coverage" },
];

function ShareButton({ verdictId }: { verdictId: string }) {
  const [state, setState] = useState<"idle" | "busy" | "copied" | "shown" | "error">("idle");
  const [url, setUrl] = useState<string | null>(null);
  async function share() {
    setState("busy");
    try {
      const res = await fetch(`/api/verdicts/${verdictId}/share`);
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "Could not make a link");
      setUrl(json.url);
      try {
        await navigator.clipboard.writeText(json.url);
        setState("copied");
      } catch {
        setState("shown");
      }
    } catch {
      setState("error");
    }
  }
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "var(--space-2)", flexWrap: "wrap" }}>
      <button type="button" className="btn-ghost band-btn" onClick={share} disabled={state === "busy"}>
        {state === "copied" ? "Link copied" : state === "error" ? "Link failed" : "Share link"}
      </button>
      {(state === "shown" || state === "copied") && url && (
        <a href={url} className="band-mono" style={{ color: "var(--mid-blue-ink)" }}>
          Open the record
        </a>
      )}
    </span>
  );
}

export default function VerdictBand({ compactOnPhone = false }: { compactOnPhone?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const { run, openDrawer, searching } = useSubject();
  const trace = useTrace();
  const traceSetResult = trace.setResult;
  const resultVerdict = run?.status === "done" ? (run.result?.verdict ?? null) : null;
  useEffect(() => {
    traceSetResult(resultVerdict);
  }, [traceSetResult, resultVerdict]);
  const status = searching && (!run || run.status === "idle" || run.status === "done" || run.status === "error") ? "resolving" : (run?.status ?? "idle");
  // One short announcement per phase change (never the ticking timer).
  const announcement =
    status === "resolving"
      ? "Resolving the address"
      : status === "running"
        ? run?.phase === "synthesis"
          ? "Synthesizing the verdict"
          : "Five agents reading the record"
        : status === "done" && run?.result
          ? `Verdict ready: ${run.result.verdict.verdict}, confidence ${run.result.verdict.confidence}`
          : status === "error"
            ? "The run did not complete"
            : "";

  return (
    <section
      className={`verdict-band verdict-band-${status}${compactOnPhone && !expanded ? " verdict-band-compact" : ""}`}
      aria-label="Verdict"
      id="verdict-band"
    >
      <p className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </p>
      {status === "idle" && (
        <div className="band-row">
          <div>
            <div className="band-eyebrow">Verdict</div>
            <p className="band-title">No subject yet.</p>
            <p className="band-copy">
              <span className="band-wide-only">Search an address above. </span>
              <span className="band-narrow-only">Search an address from the Search tab below. </span>
              The five agents read its public record and the verdict lands here, in the same place in every lens.
            </p>
          </div>
        </div>
      )}

      {status === "resolving" && (
        <div className="band-row">
          <div>
            <div className="band-eyebrow">Verdict</div>
            <p className="band-title">
              <span className="band-pulse" aria-hidden="true" />
              Resolving the address
            </p>
            {!searching && run?.subject && <p className="band-copy band-mono">{run.subject}</p>}
            {searching && <p className="band-copy">Matching it to a lot in the public record.</p>}
          </div>
        </div>
      )}

      {status === "running" && run && <Bench run={run} />}

      {status === "error" && run && (
        <div className="band-row">
          <div>
            <div className="band-eyebrow">Verdict</div>
            <p className="band-title" style={{ color: "var(--signal-negative-ink)" }}>
              The run did not complete.
            </p>
            <p className="band-copy">{run.error}</p>
            <p className="band-copy band-mono">Live NYC data is deepest. Try a New York City street address.</p>
          </div>
        </div>
      )}

      {status === "done" && run?.result && (
        <>
          {/* One-line form on phones for lenses whose hero is another figure (Price). */}
          {compactOnPhone && (
            <div className="band-compact-row">
              <span className="band-compact-word" style={{ color: VERDICT_COLORS[run.result.verdict.verdict] }}>
                {run.result.verdict.verdict}
              </span>
              <span className="band-mono">
                conf {run.result.verdict.confidence} · risk {run.result.verdict.risk_score} · {run.result.verdict.signal_window_months} mo
              </span>
              <button type="button" className="btn-ghost band-btn" aria-expanded={expanded} onClick={() => setExpanded((v) => !v)}>
                {expanded ? "Less" : "More"}
              </button>
            </div>
          )}
          <div className="band-row band-row-done">
            <div className="band-main">
              <div className="band-eyebrow">
                Verdict
                <ProvenanceBadge provenance={run.result.verdict.overall_provenance} />
              </div>
              <div
                className="band-word"
                style={{ color: VERDICT_COLORS[run.result.verdict.verdict] }}
                data-trace="verdict"
                tabIndex={trace.on ? 0 : undefined}
              >
                {run.result.verdict.verdict}
              </div>
              <p className="band-address">{run.result.resolved_address.normalized}</p>
              <p className="band-headline">{run.result.verdict.headline}</p>
            </div>
            <dl className="band-metrics" data-trace="score" tabIndex={trace.on ? 0 : undefined}>
              <div>
                <dt>Confidence</dt>
                <dd>{run.result.verdict.confidence}</dd>
                <span className="band-meter" aria-hidden="true">
                  <span style={{ width: `${run.result.verdict.confidence}%`, background: "var(--mid-blue)" }} />
                </span>
              </div>
              <div>
                <dt>Risk</dt>
                <dd style={{ color: riskInk(run.result.verdict.risk_score) }}>{run.result.verdict.risk_score}</dd>
                <span className="band-meter" aria-hidden="true">
                  <span
                    style={{ width: `${run.result.verdict.risk_score}%`, background: riskFill(run.result.verdict.risk_score) }}
                  />
                </span>
              </div>
              <div>
                <dt>Window</dt>
                <dd>
                  {run.result.verdict.signal_window_months}
                  <span className="band-unit">mo</span>
                </dd>
              </div>
            </dl>
          </div>
          <div className="band-foot">
            <p className="band-summary band-mono">
              {provenanceSummary(run.result.verdict.data_points ?? []).map(({ state, n }, i) => (
                <span key={state}>
                  {i > 0 && " · "}
                  <span style={{ color: PROVENANCE_META[state].color }}>
                    {n} {SUMMARY_LABEL[state]}
                  </span>
                </span>
              ))}
              {run.result.resolved_address.location_confidence === "unconfirmed" && (
                <span style={{ color: "var(--signal-warning-ink)" }}> · location unconfirmed</span>
              )}
              {" · "}
              {run.result.persisted ? "recorded to your history" : `not recorded: ${run.result.persist_error ?? "persistence unavailable"}`}
            </p>
            <div className="band-actions">
              {TABS.map((t) => (
                <button key={t.id} type="button" className="btn-ghost band-btn" onClick={() => openDrawer(t.id)}>
                  {t.label}
                </button>
              ))}
              {run.result.persisted && run.result.verdict_id && (
                <ShareButton verdictId={run.result.verdict_id} />
              )}
              <button
                type="button"
                className="btn-ghost band-btn"
                aria-pressed={trace.on}
                onClick={trace.toggle}
                title="Follow any figure to its sources (T)"
                style={trace.on ? { background: "var(--deep-navy)", color: "var(--white)", borderColor: "var(--deep-navy)" } : undefined}
              >
                Trace
              </button>
            </div>
          </div>
          <TraceThread />
          <RunDegradationNote degradation={run.result.degradation} />
        </>
      )}
    </section>
  );
}
