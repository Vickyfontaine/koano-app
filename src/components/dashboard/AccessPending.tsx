"use client";

// AccessPending — shown at /dashboard to signed-in users who are not yet
// approved (Phase B lockdown). Honest about the state: KOANO is a private
// demo, access is by request, and here is your place in the queue. No
// promises the system can't keep (there is no notification email yet).

import React from "react";
import { UserButton } from "@clerk/nextjs";

interface AccessPendingProps {
  status: "pending" | "denied";
  queuePosition: number | null; // pending only
  email: string | null;
}

export default function AccessPending({ status, queuePosition, email }: AccessPendingProps) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--pale-wash)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <header
        style={{
          padding: "28px 40px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <a
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
        </a>
        <UserButton />
      </header>

      <main
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
        }}
      >
        <div
          style={{
            background: "var(--white)",
            border: "1px solid var(--border)",
            borderRadius: "20px",
            padding: "40px",
            maxWidth: "480px",
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <span
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: "11px",
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              color: "var(--brand-blue)",
            }}
          >
            Private demo
          </span>

          <h1
            style={{
              fontSize: "26px",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "var(--ink-primary)",
              margin: 0,
            }}
          >
            Access is by request
          </h1>

          {status === "pending" ? (
            <>
              <p style={{ fontSize: "15px", lineHeight: 1.6, color: "var(--ink-secondary)", margin: 0 }}>
                KOANO is in private demo. Your account is created and your access request is in
                the queue — every account is approved by hand while the demo runs on a limited
                budget.
              </p>
              {queuePosition !== null && (
                <p
                  style={{
                    fontFamily: "'DM Mono', monospace",
                    fontSize: "13px",
                    color: "var(--ink-primary)",
                    margin: 0,
                  }}
                >
                  Queue position: {queuePosition}
                </p>
              )}
              <p style={{ fontSize: "13px", color: "var(--ink-muted)", margin: 0 }}>
                Check back here — this page unlocks the moment your account is approved.
              </p>
            </>
          ) : (
            <p style={{ fontSize: "15px", lineHeight: 1.6, color: "var(--ink-secondary)", margin: 0 }}>
              Your access request was not approved for the current demo.
            </p>
          )}

          {email && (
            <p
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "11px",
                color: "var(--ink-faint)",
                margin: 0,
                borderTop: "1px solid var(--border-light)",
                paddingTop: "14px",
              }}
            >
              Signed in as {email}
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
