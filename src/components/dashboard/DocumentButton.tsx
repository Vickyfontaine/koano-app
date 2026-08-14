"use client";

// KOANO DocumentButton — shared download control for the document engine.
// Mounted in a cluster view once an address has been analyzed. Offers the
// build-source choice (reuse the last analysis = no new generation, vs a fresh
// model-tailored document = one generation), POSTs /api/documents, and streams
// the returned file to a download. Guard denials (402/403/429/409) surface as
// a plain message — the button never fabricates a document.

import React, { useState } from "react";

// Client-local copies of the engine's tiny string unions — kept here so this
// client component never imports the server-side documents module graph.
// Mirror of lib/documents/types.ts (BuildSource, DocumentFormat).
type BuildSource = "verdict" | "fresh";
type DocumentFormat = "pdf" | "docx";

interface DocumentButtonProps {
  docType: string;
  title: string; // human label, e.g. "Tax Appeal Evidence Packet"
  address: string; // the analyzed subject address
  formats?: DocumentFormat[]; // default ['pdf']
  hasRecentVerdict?: boolean; // when true, default to reusing the last analysis
  id?: string;
}

function filenameFromDisposition(header: string | null, fallback: string): string {
  if (!header) return fallback;
  const m = /filename="?([^"]+)"?/.exec(header);
  return m ? m[1] : fallback;
}

export default function DocumentButton({
  docType,
  title,
  address,
  formats = ["pdf"],
  hasRecentVerdict = false,
  id,
}: DocumentButtonProps) {
  const [source, setSource] = useState<BuildSource>(hasRecentVerdict ? "verdict" : "fresh");
  const [format, setFormat] = useState<DocumentFormat>(formats[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function generate() {
    setBusy(true);
    setError(null);
    setDone(false);
    try {
      const res = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docType, address, format, buildSource: source }),
      });
      if (!res.ok) {
        // Errors come back as JSON; surface the guard/validation message.
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || `Generation failed (${res.status})`);
      }
      const blob = await res.blob();
      const filename = filenameFromDisposition(
        res.headers.get("Content-Disposition"),
        `koano-${docType.replace(/_/g, "-")}.${format}`,
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setBusy(false);
    }
  }

  const radioLabel: React.CSSProperties = {
    display: "flex",
    alignItems: "flex-start",
    gap: "8px",
    fontSize: "13px",
    color: "var(--ink-secondary)",
    cursor: "pointer",
  };

  return (
    <div
      id={id}
      style={{
        border: "1px solid var(--border)",
        borderRadius: "16px",
        padding: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        background: "var(--white)",
      }}
    >
      <div>
        <h3 style={{ fontSize: "16px", fontWeight: 500, color: "var(--ink-primary)", margin: "0 0 4px" }}>
          {title}
        </h3>
        <p style={{ fontSize: "12px", color: "var(--ink-muted)", margin: 0 }}>
          A professional, provenance-labeled document for the analyzed address. Every figure carries its
          source; the disclaimer footer is on every page.
        </p>
      </div>

      {/* Source selector */}
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        <label style={radioLabel}>
          <input
            type="radio"
            name={`src-${id ?? docType}`}
            checked={source === "verdict"}
            onChange={() => setSource("verdict")}
            style={{ marginTop: "2px" }}
          />
          <span>
            <strong style={{ fontWeight: 500, color: "var(--ink-primary)" }}>
              Build from my last analysis
            </strong>
            <br />
            Reuses the analysis you just ran. No new generation used.
            {!hasRecentVerdict && (
              <span style={{ color: "var(--ink-faint)" }}> Run an analysis first to enable.</span>
            )}
          </span>
        </label>
        <label style={radioLabel}>
          <input
            type="radio"
            name={`src-${id ?? docType}`}
            checked={source === "fresh"}
            onChange={() => setSource("fresh")}
            style={{ marginTop: "2px" }}
          />
          <span>
            <strong style={{ fontWeight: 500, color: "var(--ink-primary)" }}>Fresh</strong>
            <br />
            Writes a new, model-tailored document. Uses one generation.
          </span>
        </label>
      </div>

      {/* Format selector (only when more than one) */}
      {formats.length > 1 && (
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <span
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "10px",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--ink-faint)",
            }}
          >
            Format
          </span>
          {formats.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFormat(f)}
              style={{
                border: `1px solid ${format === f ? "var(--mid-blue)" : "var(--border)"}`,
                background: format === f ? "var(--pale-wash)" : "transparent",
                color: format === f ? "var(--deep-navy)" : "var(--ink-muted)",
                borderRadius: "100px",
                padding: "4px 12px",
                fontSize: "12px",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              {f}
            </button>
          ))}
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={generate}
          disabled={busy || (source === "verdict" && !hasRecentVerdict)}
          style={{
            border: "none",
            borderRadius: "100px",
            padding: "10px 20px",
            fontSize: "14px",
            fontWeight: 500,
            cursor: busy ? "default" : "pointer",
            background: busy ? "var(--sky)" : "var(--brand-blue)",
            color: "var(--near-black)",
            opacity: source === "verdict" && !hasRecentVerdict ? 0.5 : 1,
          }}
        >
          {busy ? "Generating…" : `Generate ${format.toUpperCase()}  ↗`}
        </button>
        {done && !error && (
          <span style={{ fontSize: "13px", color: "var(--signal-positive)" }}>Downloaded.</span>
        )}
      </div>

      {error && (
        <p
          style={{
            fontSize: "13px",
            color: "var(--signal-negative)",
            margin: 0,
            borderLeft: "3px solid var(--signal-negative)",
            paddingLeft: "10px",
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}
