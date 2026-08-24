"use client";

// useAddressResolver — the resolve-first step every address-entry dashboard runs
// BEFORE mounting panels or firing the verdict pipeline. It calls
// /api/resolve-address and either (a) resolves a confident single match, (b)
// surfaces disambiguation candidates, or (c) reports no match — as ONE state, so
// a resolution problem reads as one banner, never five panel errors.
//
// On success it hands the caller a RunPayload: a raw {address} for a confident
// match, or the chosen {candidate} for a disambiguated one. Downstream endpoints
// re-derive the BBL server-side from that payload — the client never supplies a
// resolved BBL.

import { useCallback, useRef, useState } from "react";
import type { AddressCandidate } from "@/components/ui/verdict";
import { useUpgrade, isUpgradeRequired } from "./UpgradeProvider";

export type RunPayload = { address: string } | { candidate: AddressCandidate };

export type ResolverState =
  | { phase: "idle" }
  | { phase: "resolving" }
  | { phase: "ambiguous"; candidates: AddressCandidate[] }
  | { phase: "none"; error: string };

export interface AddressResolver {
  state: ResolverState;
  resolve: (address: string) => Promise<void>;
  choose: (candidate: AddressCandidate) => void;
  reset: () => void;
}

export function useAddressResolver(onResolved: (payload: RunPayload) => void): AddressResolver {
  const { openUpgrade } = useUpgrade();
  const [state, setState] = useState<ResolverState>({ phase: "idle" });

  // Keep the latest callback without making resolve/choose change identity.
  const onResolvedRef = useRef(onResolved);
  onResolvedRef.current = onResolved;

  const resolve = useCallback(
    async (address: string) => {
      const trimmed = address.trim();
      if (!trimmed) return;
      setState({ phase: "resolving" });
      try {
        const res = await fetch("/api/resolve-address", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address: trimmed }),
        });
        const json = await res.json().catch(() => null);
        if (isUpgradeRequired(res.status, json)) {
          openUpgrade({ plan: json.plan, kind: json.kind, limit: json.limit });
          setState({ phase: "idle" });
          return;
        }
        if (!res.ok) {
          setState({ phase: "none", error: json?.error || `Request failed (${res.status})` });
          return;
        }
        if (json?.status === "ambiguous" && Array.isArray(json.candidates) && json.candidates.length > 0) {
          setState({ phase: "ambiguous", candidates: json.candidates as AddressCandidate[] });
          return;
        }
        if (json?.status === "resolved") {
          setState({ phase: "idle" });
          onResolvedRef.current({ address: trimmed });
          return;
        }
        setState({ phase: "none", error: json?.error || "We couldn't find that address." });
      } catch (e) {
        setState({ phase: "none", error: e instanceof Error ? e.message : "Could not resolve address" });
      }
    },
    [openUpgrade],
  );

  const choose = useCallback((candidate: AddressCandidate) => {
    setState({ phase: "idle" });
    onResolvedRef.current({ candidate });
  }, []);

  const reset = useCallback(() => setState({ phase: "idle" }), []);

  return { state, resolve, choose, reset };
}
