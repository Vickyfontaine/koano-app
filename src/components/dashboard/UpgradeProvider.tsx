"use client";

// UpgradeProvider — app-level home for the paywall UI, mounted inside
// DashboardShell so every cluster view can reach it.
//  - openUpgrade(detail): opens the UpgradeScreen modal when a spending fetch
//    returns 402 upgrade_required (called from useVerdictStream / the content
//    panels), so a free user hitting a limit sees the upgrade screen, not a
//    raw error.
//  - justUpgraded: on return from Stripe (/dashboard?upgraded=1), shows a
//    "Confirming your upgrade" overlay that polls the profile until the webhook
//    flips the plan — never showing a paying user as free.

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import UpgradeScreen, { type UpgradeDetail } from "./UpgradeScreen";

interface UpgradeContextValue {
  openUpgrade: (detail: UpgradeDetail) => void;
}

const UpgradeContext = createContext<UpgradeContextValue>({ openUpgrade: () => {} });

export function useUpgrade(): UpgradeContextValue {
  return useContext(UpgradeContext);
}

// Detects the guard's 402 upgrade_required body. Call from any spending fetch.
export function isUpgradeRequired(status: number, body: unknown): body is UpgradeDetail & { upgrade_required: true } {
  return (
    status === 402 &&
    typeof body === "object" &&
    body !== null &&
    (body as { upgrade_required?: unknown }).upgrade_required === true
  );
}

const POLL_MS = 2000;
const MAX_POLLS = 15; // ~30s

function ConfirmingUpgrade() {
  const router = useRouter();
  const [phase, setPhase] = useState<"confirming" | "done" | "timeout">("confirming");
  const [plan, setPlan] = useState<string | null>(null);

  useEffect(() => {
    let polls = 0;
    let cancelled = false;
    const tick = async () => {
      polls += 1;
      try {
        const res = await fetch("/api/profile");
        const json = await res.json();
        const p = json?.profile?.plan as string | undefined;
        if (!cancelled && p && p !== "free") {
          setPlan(p);
          setPhase("done");
          return;
        }
      } catch {
        /* keep polling */
      }
      if (cancelled) return;
      if (polls >= MAX_POLLS) {
        setPhase("timeout");
        return;
      }
      setTimeout(tick, POLL_MS);
    };
    const id = setTimeout(tick, POLL_MS);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, []);

  // On success, clear the ?upgraded param and refresh so the app re-reads state.
  useEffect(() => {
    if (phase !== "done") return;
    const t = setTimeout(() => {
      router.replace("/dashboard");
      router.refresh();
    }, 1600);
    return () => clearTimeout(t);
  }, [phase, router]);

  const dismiss = () => {
    router.replace("/dashboard");
    router.refresh();
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: "rgba(13, 43, 62, 0.35)",
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
          padding: "32px",
          maxWidth: "420px",
          width: "100%",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          gap: "14px",
        }}
      >
        {phase === "confirming" && (
          <>
            <span
              aria-hidden="true"
              className="koano-pulse"
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                background: "var(--mid-blue)",
                margin: "0 auto",
              }}
            />
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--ink-primary)", margin: 0 }}>
              Confirming your upgrade…
            </h2>
            <p style={{ fontSize: "14px", lineHeight: 1.6, color: "var(--ink-secondary)", margin: 0 }}>
              Payment received. We&apos;re activating your plan — this usually takes a few seconds.
            </p>
          </>
        )}
        {phase === "done" && (
          <>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--ink-primary)", margin: 0 }}>
              You&apos;re on the {plan} plan.
            </h2>
            <p style={{ fontSize: "14px", color: "var(--ink-secondary)", margin: 0 }}>
              Thanks for upgrading. Taking you to your dashboard…
            </p>
          </>
        )}
        {phase === "timeout" && (
          <>
            <h2 style={{ fontSize: "20px", fontWeight: 700, color: "var(--ink-primary)", margin: 0 }}>
              Payment received.
            </h2>
            <p style={{ fontSize: "14px", lineHeight: 1.6, color: "var(--ink-secondary)", margin: 0 }}>
              Your plan updates automatically once payment settles. If it hasn&apos;t appeared in a
              moment, refresh the page.
            </p>
            <button
              onClick={dismiss}
              className="btn-primary"
              style={{ alignSelf: "center", cursor: "pointer" }}
            >
              Go to dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export default function UpgradeProvider({
  justUpgraded = false,
  children,
}: {
  justUpgraded?: boolean;
  children: React.ReactNode;
}) {
  const [detail, setDetail] = useState<UpgradeDetail | null>(null);
  const openUpgrade = useCallback((d: UpgradeDetail) => setDetail(d), []);

  return (
    <UpgradeContext.Provider value={{ openUpgrade }}>
      {children}
      {detail && <UpgradeScreen detail={detail} onClose={() => setDetail(null)} />}
      {justUpgraded && <ConfirmingUpgrade />}
    </UpgradeContext.Provider>
  );
}
