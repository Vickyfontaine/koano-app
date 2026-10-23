"use client";

// Homepage address box (UI sprint WS2, slice 2). A visitor types an address and
// KOANO resolves it against the same geocoder the product uses, through the
// public, rate-limited /api/public/resolve route. It shows the lot it found and
// invites the visitor to create an account to run the five agents on it. It
// never runs an agent and never shows a verdict for an arbitrary address: the
// one address with a result on this page is the recorded example, and for that
// one the box points at the recorded run further down the page.

import React, { useId, useRef, useState } from "react";
import { EXAMPLE_VERDICT_ADDRESS } from "./exampleVerdict";

type Candidate = { id: string; label: string; borough?: string | null; zip?: string | null };

type Result =
  | { status: "idle" }
  | { status: "loading" }
  | {
      status: "resolved";
      normalized: string;
      bbl: string | null;
      borough: string | null;
      nyc: boolean;
      example: boolean;
    }
  | { status: "ambiguous"; candidates: Candidate[] }
  | { status: "none"; error: string };

const RECORDED_RUN_ANCHOR = "#agents-section";

export default function HeroAddressBox() {
  const inputId = useId();
  const [value, setValue] = useState("");
  const [result, setResult] = useState<Result>({ status: "idle" });
  const inflight = useRef<AbortController | null>(null);

  async function check(address: string) {
    const q = address.trim();
    if (q.length < 5) {
      setResult({ status: "none", error: "Enter a street address, with the borough or ZIP if you have it." });
      return;
    }
    inflight.current?.abort();
    const ctl = new AbortController();
    inflight.current = ctl;
    setResult({ status: "loading" });
    try {
      const res = await fetch("/api/public/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address: q }),
        signal: ctl.signal,
      });
      const data = (await res.json()) as Record<string, unknown>;
      if (ctl.signal.aborted) return;
      if (data.status === "resolved") {
        setResult({
          status: "resolved",
          normalized: String(data.normalized ?? q),
          bbl: (data.bbl as string | null) ?? null,
          borough: (data.borough as string | null) ?? null,
          nyc: data.nyc === true,
          example: data.example === true,
        });
      } else if (data.status === "ambiguous" && Array.isArray(data.candidates)) {
        setResult({ status: "ambiguous", candidates: data.candidates as Candidate[] });
      } else {
        setResult({
          status: "none",
          error: typeof data.error === "string" && data.error ? data.error : "No lot matched that address. Try adding the borough or ZIP.",
        });
      }
    } catch (e) {
      if ((e as { name?: string }).name === "AbortError") return;
      setResult({ status: "none", error: "The address check did not complete. Try again in a moment." });
    }
  }

  return (
    <form
      className="hero-address"
      role="search"
      aria-label="Check an address"
      onSubmit={(e) => {
        e.preventDefault();
        void check(value);
      }}
    >
      <label htmlFor={inputId} className="sr-only">
        Street address
      </label>
      <div className="hero-address-field">
        <input
          id={inputId}
          className="hero-address-input"
          type="text"
          inputMode="text"
          autoComplete="street-address"
          enterKeyHint="search"
          placeholder="Enter a New York City address"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-describedby={`${inputId}-result`}
        />
        <button type="submit" className="btn-primary hero-address-btn" disabled={result.status === "loading"}>
          Check the record
          <span aria-hidden="true" className="btn-arrow">
            ↗
          </span>
        </button>
      </div>
      <div className="hero-address-hint">
        Try the recorded example:{" "}
        <button
          type="button"
          className="hero-address-example"
          onClick={() => {
            setValue(EXAMPLE_VERDICT_ADDRESS);
            void check(EXAMPLE_VERDICT_ADDRESS);
          }}
        >
          {EXAMPLE_VERDICT_ADDRESS}
        </button>
      </div>

      <div id={`${inputId}-result`} aria-live="polite" aria-atomic="true">
        {result.status === "loading" && (
          <div className="hero-address-card hero-address-card-quiet">
            <span className="hero-address-pulse" aria-hidden="true" />
            Checking the public record for this address
          </div>
        )}

        {result.status === "resolved" && (
          <div className="hero-address-card">
            <div className="hero-address-found">{result.normalized}</div>
            {result.bbl && (
              <div className="hero-address-meta">
                BBL {result.bbl}
                {result.borough ? ` · ${result.borough}` : ""}
              </div>
            )}
            {result.example ? (
              <>
                <p className="hero-address-copy">
                  This is the recorded example run shown on this page. The five agents, their figures and the synthesis are laid out below.
                </p>
                <a href={RECORDED_RUN_ANCHOR} className="btn-ghost hero-address-cta">
                  See the recorded run
                </a>
              </>
            ) : result.nyc ? (
              <>
                <p className="hero-address-copy">
                  Found in the city record. Create an account to run the five agents on this lot and read every figure they used.
                </p>
                <a href="/signup" className="btn-primary hero-address-cta">
                  Create an account
                  <span aria-hidden="true" className="btn-arrow">
                    ↗
                  </span>
                </a>
              </>
            ) : (
              <>
                <p className="hero-address-copy">
                  Outside New York City. The federal layers (prices, lending, hazards, employment) run here today. Permits, zoning and
                  violations cover New York City.
                </p>
                <a href="/signup" className="btn-primary hero-address-cta">
                  Create an account
                  <span aria-hidden="true" className="btn-arrow">
                    ↗
                  </span>
                </a>
              </>
            )}
          </div>
        )}

        {result.status === "ambiguous" && (
          <div className="hero-address-card">
            <div className="hero-address-found">Which one did you mean?</div>
            <ul className="hero-address-candidates">
              {result.candidates.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    className="hero-address-candidate"
                    onClick={() => {
                      setValue(c.label);
                      void check(c.label);
                    }}
                  >
                    <span>{c.label}</span>
                    {(c.borough || c.zip) && (
                      <span className="hero-address-meta">{[c.borough, c.zip].filter(Boolean).join(" · ")}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {result.status === "none" && (
          <div className="hero-address-card hero-address-card-quiet" role="status">
            {result.error}
          </div>
        )}
      </div>

      <style jsx>{`
        .hero-address {
          width: 100%;
          max-width: 520px;
          margin-bottom: 28px;
        }
        .hero-address-field {
          display: flex;
          align-items: stretch;
          gap: 8px;
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: var(--radius-pill);
          padding: 6px 6px 6px 20px;
          box-shadow: var(--shadow-hover);
        }
        .hero-address-input {
          flex: 1 1 auto;
          min-width: 0;
          border: 0;
          background: transparent;
          font: inherit;
          font-size: 15px;
          color: var(--ink-primary);
          min-height: 44px;
        }
        .hero-address-input::placeholder {
          color: var(--ink-muted);
        }
        .hero-address-input:focus-visible {
          outline: none;
        }
        .hero-address-field:focus-within {
          outline: 2px solid var(--white);
          outline-offset: 2px;
        }
        .hero-address-field :global(.hero-address-btn) {
          white-space: nowrap;
          padding: 11px 22px;
          min-height: 44px;
        }
        .hero-address-hint {
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.04em;
          color: rgba(255, 255, 255, 0.85);
          margin-top: 10px;
        }
        .hero-address-example {
          font: inherit;
          background: transparent;
          border: 0;
          padding: 10px 0;
          min-height: 44px;
          color: var(--white);
          text-decoration: underline;
          text-underline-offset: 3px;
          cursor: pointer;
        }
        .hero-address-example:focus-visible {
          outline-color: var(--white);
        }
        .hero-address-card {
          margin-top: 12px;
          background: var(--white);
          border: 1px solid var(--border);
          border-radius: var(--radius-inner);
          padding: 14px 16px;
          color: var(--ink-primary);
          font-size: 14px;
          line-height: 1.5;
        }
        .hero-address-card-quiet {
          display: flex;
          align-items: center;
          gap: 10px;
          color: var(--ink-secondary);
        }
        .hero-address-pulse {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--mid-blue);
          animation: hero-address-pulse 1.1s ease-in-out infinite;
          flex: none;
        }
        @keyframes hero-address-pulse {
          0%,
          100% {
            opacity: 0.35;
          }
          50% {
            opacity: 1;
          }
        }
        .hero-address-found {
          font-weight: 500;
          font-size: 15px;
        }
        .hero-address-meta {
          font-family: var(--font-mono);
          font-size: 11px;
          letter-spacing: 0.06em;
          color: var(--ink-muted);
          margin-top: 2px;
        }
        .hero-address-copy {
          margin: 8px 0 12px;
          color: var(--ink-secondary);
        }
        .hero-address-card :global(.hero-address-cta) {
          padding: 10px 20px;
          min-height: 44px;
        }
        .hero-address-candidates {
          list-style: none;
          margin: 8px 0 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .hero-address-candidate {
          width: 100%;
          text-align: left;
          font: inherit;
          font-size: 14px;
          color: var(--ink-primary);
          background: var(--pale-wash);
          border: 1px solid var(--border);
          border-radius: var(--radius-chip);
          padding: 10px 12px;
          min-height: 44px;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .hero-address-candidate:hover {
          border-color: var(--mid-blue);
        }
        @media (max-width: 767px) {
          .hero-address-field {
            flex-direction: column;
            border-radius: var(--radius-card);
            padding: 8px;
            gap: 6px;
          }
          .hero-address-input {
            padding: 0 12px;
          }
          .hero-address-field :global(.hero-address-btn) {
            width: 100%;
          }
        }
      `}</style>
    </form>
  );
}
