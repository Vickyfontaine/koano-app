"use client";

// SubjectProvider (UI sprint WS3, slice 2). The shell-level home for the
// active verdict run and the evidence drawer. Each lens registers the stream
// it is driving (Property and Price their one run, Acquire the property being
// analyzed, Develop the top-ranked site), and the shell renders the verdict
// band and the drawer from it, in the same place in every lens. Registering
// is a snapshot, so the lens stays the owner of its pipeline state.

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { AgentProgress, PipelinePhase } from "@/components/ui/LoadingState";
import type { AgentName } from "@/components/ui/verdict";
import type { StreamComplete, VerdictStream } from "../useVerdictStream";
import type { RunPayload } from "../useAddressResolver";

export type ShellRunStatus = "idle" | "resolving" | "running" | "done" | "error";

export interface ShellRun {
  status: ShellRunStatus;
  phase: PipelinePhase;
  agents: Partial<Record<AgentName, AgentProgress>>;
  startedAt: number;
  normalized: string | null;
  /** The address typed or chosen, before the geocoder has named the lot. */
  subject: string | null;
  result: StreamComplete | null;
  error: string | null;
}

export type DrawerTab = "math" | "reasoning" | "sources" | "coverage";
export const DRAWER_TABS: DrawerTab[] = ["math", "reasoning", "sources", "coverage"];

/** A subject settled by the global search, handed to the active lens. */
export interface PendingSubject {
  payload: RunPayload;
  label: string;
  ts: number;
}

interface SubjectContextValue {
  run: ShellRun | null;
  registerRun: (run: ShellRun | null) => void;
  drawer: DrawerTab | null;
  openDrawer: (tab: DrawerTab) => void;
  closeDrawer: () => void;
  /** True while the global search is resolving an address. */
  searching: boolean;
  setSearching: (v: boolean) => void;
  pending: PendingSubject | null;
  dispatchSubject: (payload: RunPayload, label: string) => void;
  /** The lens that handled a subject consumes it, so it never re-fires. */
  consumeSubject: (ts: number) => void;
}

const SubjectContext = createContext<SubjectContextValue>({
  run: null,
  registerRun: () => {},
  drawer: null,
  openDrawer: () => {},
  closeDrawer: () => {},
  searching: false,
  setSearching: () => {},
  pending: null,
  dispatchSubject: () => {},
  consumeSubject: () => {},
});

export function useSubject(): SubjectContextValue {
  return useContext(SubjectContext);
}

function isDrawerTab(v: string): v is DrawerTab {
  return (DRAWER_TABS as string[]).includes(v);
}

export default function SubjectProvider({ children }: { children: React.ReactNode }) {
  const [run, setRun] = useState<ShellRun | null>(null);
  const [drawer, setDrawer] = useState<DrawerTab | null>(null);

  const registerRun = useCallback((r: ShellRun | null) => setRun(r), []);

  // Deep links: #math, #reasoning, #sources, #coverage open the drawer once a
  // result exists (and the hash follows the drawer while it is open).
  const openDrawer = useCallback((tab: DrawerTab) => {
    setDrawer(tab);
    if (typeof window !== "undefined") window.history.replaceState(null, "", `#${tab}`);
  }, []);
  const closeDrawer = useCallback(() => {
    setDrawer(null);
    if (typeof window !== "undefined" && isDrawerTab(window.location.hash.slice(1))) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, []);
  useEffect(() => {
    if (run?.status !== "done") return;
    const h = window.location.hash.slice(1);
    if (isDrawerTab(h)) setDrawer(h);
  }, [run?.status]);

  const [searching, setSearching] = useState(false);
  const [pending, setPending] = useState<PendingSubject | null>(null);
  const dispatchSubject = useCallback((payload: RunPayload, label: string) => {
    setPending({ payload, label, ts: Date.now() });
  }, []);
  const consumeSubject = useCallback((ts: number) => {
    setPending((cur) => (cur && cur.ts === ts ? null : cur));
  }, []);

  const value = useMemo(
    () => ({ run, registerRun, drawer, openDrawer, closeDrawer, searching, setSearching, pending, dispatchSubject, consumeSubject }),
    [run, registerRun, drawer, openDrawer, closeDrawer, searching, pending, dispatchSubject, consumeSubject],
  );
  return <SubjectContext.Provider value={value}>{children}</SubjectContext.Provider>;
}

/**
 * Register a lens's verdict stream with the shell. `resolving` is the lens's
 * address-resolution step (before the stream starts); `subject` is the typed
 * or chosen address so the band can name it while the geocoder works.
 */
export function useRegisterRun(
  stream: VerdictStream | null,
  opts: { resolving?: boolean; subject?: string | null; enabled?: boolean } = {},
) {
  const { registerRun } = useSubject();
  const { resolving = false, subject = null, enabled = true } = opts;
  const status = stream?.status ?? "idle";
  const phase = stream?.phase ?? "geocoding";
  const agents = stream?.agents;
  const startedAt = stream?.startedAt ?? 0;
  const normalized = stream?.normalized ?? null;
  const result = stream?.result ?? null;
  const error = stream?.error ?? null;

  useEffect(() => {
    if (!enabled) return;
    registerRun({
      status: resolving ? "resolving" : status,
      phase,
      agents: agents ?? {},
      startedAt,
      normalized,
      subject,
      result,
      error,
    });
  }, [enabled, registerRun, resolving, status, phase, agents, startedAt, normalized, subject, result, error]);

  useEffect(() => {
    if (!enabled) return;
    return () => registerRun(null);
  }, [enabled, registerRun]);
}

/**
 * Run `onSubject` once for each subject the global search hands to the active
 * lens. The lens decides what the subject means (run it, fill a site slot,
 * add it to the book).
 */
export function usePendingSubject(onSubject: (payload: RunPayload, label: string) => void) {
  const { pending, consumeSubject } = useSubject();
  const handled = useRef<number>(0);
  const cb = useRef(onSubject);
  cb.current = onSubject;
  useEffect(() => {
    if (!pending || pending.ts === handled.current) return;
    handled.current = pending.ts;
    // Consumed in the provider as well, so a lens switch never re-runs it
    // (a run costs money and an Acquire add mutates the book).
    consumeSubject(pending.ts);
    cb.current(pending.payload, pending.label);
  }, [pending, consumeSubject]);
}
