// Branded 404 (UI sprint WS5 review): the one denied state a public link can
// land on. No search, no guesses: the page says it is not here and offers the
// way back.

import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--pale-wash)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--space-6) var(--space-4)",
        textAlign: "center",
        gap: "var(--space-4)",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.png" alt="KOANO" width={48} height={48} style={{ height: "48px", width: "auto" }} />
      <p
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: "var(--text-micro)",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "var(--ink-muted)",
          margin: 0,
        }}
      >
        Not found
      </p>
      <h1 style={{ fontSize: "var(--text-h1)", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--ink-primary)", margin: 0 }}>
        This page is not here.
      </h1>
      <p style={{ fontSize: "var(--text-lead)", lineHeight: 1.6, color: "var(--ink-secondary)", margin: 0, maxWidth: "440px" }}>
        The link may be incomplete, or the record it names is not shared. Nothing is guessed in its place.
      </p>
      <Link href="/" className="btn-ghost" style={{ marginTop: "var(--space-2)" }}>
        Back to KOANO
      </Link>
    </div>
  );
}
