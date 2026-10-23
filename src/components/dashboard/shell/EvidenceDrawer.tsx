"use client";

// EvidenceDrawer (UI sprint WS3, slice 2). The verdict's evidence, out of the
// scroll: Math, Reasoning, Sources and Coverage as tabs in a right-anchored
// panel (a full-screen sheet below 768px), collapsed by default, deep-linkable
// by hash, focus-trapped, closed by Escape.

import React, { useEffect, useRef } from "react";
import VerdictMathPanel from "@/components/ui/VerdictMathPanel";
import ReasoningChain from "@/components/ui/ReasoningChain";
import ProvenanceLedger from "@/components/ui/ProvenanceLedger";
import CoverageMap from "@/components/ui/CoverageMap";
import { CloseIcon } from "./icons";
import { useSubject, DRAWER_TABS, type DrawerTab } from "./SubjectProvider";

const LABEL: Record<DrawerTab, string> = { math: "Math", reasoning: "Reasoning", sources: "Sources", coverage: "Coverage" };
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function EvidenceDrawer() {
  const { run, drawer, openDrawer, closeDrawer } = useSubject();
  const ref = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const open = drawer !== null && run?.status === "done" && !!run.result;

  useEffect(() => {
    if (!open) return;
    opener.current = document.activeElement as HTMLElement | null;
    const el = ref.current;
    el?.querySelector<HTMLElement>('[role="tab"][aria-selected="true"]')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeDrawer();
        return;
      }
      if (e.key !== "Tab" || !el) return;
      const items = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((x) => x.offsetParent !== null);
      if (items.length === 0) return;
      const i = items.indexOf(document.activeElement as HTMLElement);
      e.preventDefault();
      items[i === -1 ? 0 : (i + (e.shiftKey ? -1 : 1) + items.length) % items.length].focus();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    if (window.innerWidth < 768) document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      opener.current?.focus();
    };
  }, [open, closeDrawer]);

  if (!open || !run?.result) return null;
  const r = run.result;
  const tab = drawer as DrawerTab;

  return (
    <>
      <div className="drawer-backdrop" onClick={closeDrawer} aria-hidden="true" />
      <aside ref={ref} className="evidence-drawer" role="dialog" aria-modal="true" aria-label="Verdict evidence" id="evidence-drawer">
        <div className="drawer-head">
          <div>
            <div className="band-eyebrow">Evidence</div>
            <p className="drawer-address">{r.resolved_address.normalized}</p>
          </div>
          <button type="button" className="shell-sheet-close" onClick={closeDrawer} aria-label="Close evidence">
            <CloseIcon size={18} />
          </button>
        </div>
        <div className="drawer-tabs" role="tablist" aria-label="Evidence sections">
          {DRAWER_TABS.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              id={`drawer-tab-${t}`}
              aria-selected={t === tab}
              aria-controls={`drawer-panel-${t}`}
              className="drawer-tab"
              onClick={() => openDrawer(t)}
            >
              {LABEL[t]}
            </button>
          ))}
        </div>
        <div className="drawer-body" role="tabpanel" id={`drawer-panel-${tab}`} aria-labelledby={`drawer-tab-${tab}`}>
          {tab === "math" && <VerdictMathPanel verdict={r.verdict} />}
          {tab === "reasoning" && (
            <ReasoningChain
              reasoningChain={r.verdict.reasoning_chain}
              minoritySignals={r.verdict.minority_signals}
              agentSummaries={r.verdict.agent_summaries}
            />
          )}
          {tab === "sources" && (
            <ProvenanceLedger
              dataPoints={r.verdict.data_points}
              locationConfidence={r.resolved_address.location_confidence}
              address={r.resolved_address.normalized}
              defaultOpen
              collapsible={false}
            />
          )}
          {tab === "coverage" && <CoverageMap dataPoints={r.verdict.data_points} defaultOpen collapsible={false} />}
        </div>
      </aside>
    </>
  );
}
