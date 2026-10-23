"use client";

// Trace (UI sprint WS5): pull any figure like a thread. Trace mode is toggled
// by the band's Trace button or the T key; in Trace mode, hovering or focusing
// any element that carries data-trace="<node>" shows that node's thread and
// highlights every node on it, dimming the rest to 35%. The graph is built
// from the complete payload only (see graph.ts).

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { SynthesisResult } from "../verdict";
import { buildThread, threadIds, type TraceNodeId, type TraceSegment } from "./graph";

interface TraceContextValue {
  on: boolean;
  toggle: () => void;
  setOn: (v: boolean) => void;
  focus: TraceNodeId | null;
  setFocus: (id: TraceNodeId | null) => void;
  /** The run the thread is built from (set by the shell once a result exists). */
  setResult: (r: SynthesisResult | null) => void;
  thread: TraceSegment[];
}

const TraceContext = createContext<TraceContextValue>({
  on: false,
  toggle: () => {},
  setOn: () => {},
  focus: null,
  setFocus: () => {},
  setResult: () => {},
  thread: [],
});

export function useTrace(): TraceContextValue {
  return useContext(TraceContext);
}

function isTypingTarget(el: EventTarget | null): boolean {
  const t = el as HTMLElement | null;
  if (!t) return false;
  const tag = t.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || t.isContentEditable;
}

export default function TraceProvider({ children }: { children: React.ReactNode }) {
  const [on, setOn] = useState(false);
  const [focus, setFocus] = useState<TraceNodeId | null>(null);
  const [result, setResult] = useState<SynthesisResult | null>(null);
  const toggle = useCallback(() => setOn((v) => !v), []);

  // T toggles Trace mode: never while typing, only with a result to trace,
  // and not while a sheet or drawer dialog is open (they own the keyboard).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "t" && !e.metaKey && !e.ctrlKey && !e.altKey && !isTypingTarget(e.target)) {
        const dialogOpen = !!document.querySelector('[role="dialog"]:not(#evidence-drawer)');
        if (!result || dialogOpen) return;
        e.preventDefault();
        setOn((v) => !v);
      }
      if (e.key === "Escape") setFocus(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [result]);
  // Trace turns off when the result goes away.
  useEffect(() => {
    if (!result) setOn(false);
  }, [result]);

  // One listener for every data-trace element: hover or focus sets the thread.
  useEffect(() => {
    if (!on) {
      setFocus(null);
      document.body.classList.remove("trace-on");
      return;
    }
    document.body.classList.add("trace-on");
    const pick = (e: Event) => {
      const el = (e.target as HTMLElement | null)?.closest?.("[data-trace]") as HTMLElement | null;
      if (el) setFocus(el.getAttribute("data-trace") as TraceNodeId);
    };
    document.addEventListener("mouseover", pick);
    document.addEventListener("focusin", pick);
    return () => {
      document.removeEventListener("mouseover", pick);
      document.removeEventListener("focusin", pick);
      document.body.classList.remove("trace-on");
    };
  }, [on]);

  const thread = useMemo(() => (on && focus && result ? buildThread(result, focus) : []), [on, focus, result]);

  // Highlight the nodes on the thread; dim the rest (CSS does the dimming).
  // Nodes mounted later (the drawer opening) are classified by the observer.
  useEffect(() => {
    const ids = threadIds(thread);
    const apply = () => {
      const all = Array.from(document.querySelectorAll<HTMLElement>("[data-trace]"));
      for (const el of all) el.classList.toggle("trace-hit", ids.has(el.getAttribute("data-trace") ?? ""));
      document.body.classList.toggle("trace-focused", ids.size > 0);
    };
    apply();
    const mo = typeof MutationObserver !== "undefined" ? new MutationObserver(() => apply()) : null;
    mo?.observe(document.body, { childList: true, subtree: true });
    return () => {
      mo?.disconnect();
      document.body.classList.remove("trace-focused");
    };
  }, [thread]);

  const value = useMemo(() => ({ on, toggle, setOn, focus, setFocus, setResult, thread }), [on, toggle, focus, thread]);
  return <TraceContext.Provider value={value}>{children}</TraceContext.Provider>;
}
