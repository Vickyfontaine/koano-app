// Shared layout for /login and /signup — pale-wash page, KOANO wordmark,
// centered Clerk card. White/pale backgrounds only (Section 10).

import Link from "next/link";

export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--pale-wash)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <header style={{ padding: "28px 40px" }}>
        <Link
          href="/"
          style={{
            fontWeight: 500,
            fontSize: "15px",
            color: "var(--near-black)",
            letterSpacing: "2px",
            textDecoration: "none",
          }}
        >
          KOANO
        </Link>
      </header>

      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          gap: "28px",
        }}
      >
        <p
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "11px",
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            color: "var(--ink-muted)",
            margin: 0,
          }}
        >
          The real estate reasoning engine
        </p>
        <div style={{ width: "100%", maxWidth: "420px" }}>{children}</div>
      </main>

      <footer style={{ padding: "24px 40px", textAlign: "center" }}>
        <span style={{ fontSize: "12px", color: "var(--ink-faint)" }}>
          © 2026 KOANO Inc. All rights reserved.
        </span>
      </footer>
    </div>
  );
}
