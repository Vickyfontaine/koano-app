"use client";

// GlobalSearch (UI sprint WS3, slice 3). One address control for the whole
// app, in the top bar (and as a sheet on phones). It resolves through
// /api/resolve-address (the same disambiguation path the lenses used), lists
// recent subjects from the verdict history, and hands the settled subject to
// the active lens through the SubjectProvider. The BBL is never supplied by
// the browser: a confident match is passed as the raw address, a chosen
// candidate as the candidate, and the endpoints re-derive the lot.

import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import type { AddressCandidate } from "@/components/ui/verdict";
import { useUpgrade, isUpgradeRequired } from "../UpgradeProvider";
import { useSubject } from "./SubjectProvider";
import { SearchIcon } from "./icons";

interface GlobalSearchProps {
  variant: "bar" | "sheet";
  /** Called after a subject is dispatched (the sheet closes itself). */
  onDone?: () => void;
  autoFocus?: boolean;
}

type Phase =
  | { kind: "idle" }
  | { kind: "resolving" }
  | { kind: "ambiguous"; candidates: AddressCandidate[] }
  | { kind: "none"; error: string };

interface Recent {
  address: string;
  verdict: string;
  when: string;
}

export default function GlobalSearch({ variant, onDone, autoFocus = false }: GlobalSearchProps) {
  const id = useId();
  const { openUpgrade } = useUpgrade();
  const { dispatchSubject, setSearching } = useSubject();
  const [value, setValue] = useState("");
  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [open, setOpen] = useState(false);
  const [recents, setRecents] = useState<Recent[] | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // ⌘K / Ctrl+K focuses the bar.
  useEffect(() => {
    if (variant !== "bar") return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setOpen(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [variant]);

  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  // Close the dropdown on an outside click.
  useEffect(() => {
    if (!open || variant !== "bar") return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, variant]);

  const loadRecents = useCallback(async () => {
    if (recents !== null) return;
    try {
      const res = await fetch("/api/verdicts?limit=12");
      const json = await res.json();
      if (!res.ok) throw new Error();
      const seen = new Set<string>();
      const rows: Recent[] = [];
      for (const v of (json.verdicts ?? []) as { address_normalized: string | null; address_input: string; verdict: string; created_at: string; hidden: boolean }[]) {
        const a = v.address_normalized ?? v.address_input;
        if (v.hidden || seen.has(a)) continue;
        seen.add(a);
        rows.push({ address: a, verdict: v.verdict, when: new Date(v.created_at).toLocaleDateString() });
        if (rows.length >= 5) break;
      }
      setRecents(rows);
    } catch {
      setRecents([]);
    }
  }, [recents]);

  function settle(payload: { address: string } | { candidate: AddressCandidate }, label: string) {
    setPhase({ kind: "idle" });
    setOpen(false);
    setValue("");
    dispatchSubject(payload, label);
    onDone?.();
  }

  async function resolve(address: string) {
    const q = address.trim();
    if (!q) return;
    setPhase({ kind: "resolving" });
    setSearching(true);
    try {
      const res = await fetch("/api/resolve-address", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: q }),
      });
      const json = await res.json().catch(() => null);
      if (isUpgradeRequired(res.status, json)) {
        openUpgrade({ plan: json.plan, kind: json.kind, limit: json.limit });
        setPhase({ kind: "idle" });
        return;
      }
      if (!res.ok) {
        setPhase({ kind: "none", error: json?.error || `Request failed (${res.status})` });
        return;
      }
      if (json?.status === "ambiguous" && Array.isArray(json.candidates) && json.candidates.length > 0) {
        setPhase({ kind: "ambiguous", candidates: json.candidates as AddressCandidate[] });
        setOpen(true);
        return;
      }
      if (json?.status === "resolved") {
        settle({ address: q }, (json.address?.normalized as string) ?? q);
        return;
      }
      setPhase({ kind: "none", error: "No lot matched that address. Try adding the borough or ZIP." });
      setOpen(true);
    } catch (e) {
      setPhase({ kind: "none", error: e instanceof Error ? e.message : "Could not resolve the address" });
      setOpen(true);
    } finally {
      setSearching(false);
    }
  }

  const listId = `${id}-list`;
  const showList = open || variant === "sheet";

  return (
    <div ref={rootRef} className={`gsearch gsearch-${variant}`} data-shell-search>
      <form
        role="search"
        aria-label="Search an address"
        onSubmit={(e) => {
          e.preventDefault();
          void resolve(value);
        }}
      >
        <label htmlFor={`${id}-input`} className="sr-only">
          Address, BBL or lot
        </label>
        <div className="gsearch-field">
          <SearchIcon size={18} />
          <input
            ref={inputRef}
            id={`${id}-input`}
            className="gsearch-input"
            type="text"
            autoComplete="street-address"
            enterKeyHint="search"
            placeholder="Search an address or BBL"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onFocus={() => {
              setOpen(true);
              void loadRecents();
            }}
            aria-describedby={listId}
            aria-busy={phase.kind === "resolving"}
          />
          {variant === "bar" && (
            <kbd className="gsearch-kbd" aria-hidden="true">
              ⌘K
            </kbd>
          )}
          {variant === "sheet" && (
            <button type="submit" className="btn-primary gsearch-go" disabled={phase.kind === "resolving"}>
              Run
            </button>
          )}
        </div>
      </form>

      {showList && (
        <div className={`gsearch-panel gsearch-panel-${variant}`} id={listId}>
          {phase.kind === "resolving" && (
            <div className="gsearch-row gsearch-quiet">
              <span className="band-pulse" aria-hidden="true" />
              Resolving the address
            </div>
          )}
          {phase.kind === "none" && (
            <div className="gsearch-row gsearch-quiet" role="status">
              {phase.error}
            </div>
          )}
          {phase.kind === "ambiguous" && (
            <div className="gsearch-group">
              <div className="gsearch-heading">More than one building matches. Choose the one you meant.</div>
              {phase.candidates.map((c, i) => (
                <button
                  key={c.id}
                  type="button"
                  className="gsearch-row gsearch-option"
                  onClick={() => settle({ candidate: c }, c.label)}
                >
                  <span className="gsearch-row-main">{c.label}</span>
                  <span className="gsearch-row-meta">
                    {i === 0 && c.match_reason === "Exact street match" ? "best match · " : ""}
                    {[c.borough, c.zip].filter(Boolean).join(" · ")}
                  </span>
                </button>
              ))}
            </div>
          )}
          {phase.kind === "idle" && (
            <div className="gsearch-group">
              <div className="gsearch-heading">Recent subjects</div>
              {recents === null && (
                <div className="gsearch-row gsearch-quiet" aria-busy="true">
                  <span className="band-pulse" aria-hidden="true" />
                  Loading your history
                </div>
              )}
              {recents && recents.length === 0 && (
                <div className="gsearch-row gsearch-quiet">No runs yet. Type an address and press Enter.</div>
              )}
              {recents?.map((r) => (
                <button
                  key={r.address}
                  type="button"
                  className="gsearch-row gsearch-option"
                  onClick={() => settle({ address: r.address }, r.address)}
                >
                  <span className="gsearch-row-main">{r.address}</span>
                  <span className="gsearch-row-meta">
                    {r.verdict.toUpperCase()} · {r.when}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
