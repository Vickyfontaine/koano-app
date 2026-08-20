// Profile settings page — populates the letterhead fields used by white-label
// documents. Under /dashboard, so middleware guarantees auth. Standalone route
// (not part of the cluster SPA); a back link returns to the dashboard.

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ProfileSettingsForm from "@/components/dashboard/ProfileSettingsForm";
import MonitoringSettings from "@/components/dashboard/MonitoringSettings";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  return (
    <div style={{ minHeight: "100vh", background: "var(--white)" }}>
      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "48px 32px" }}>
        <a
          href="/dashboard"
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "11px",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--ink-muted)",
            textDecoration: "none",
          }}
        >
          ← Back to dashboard
        </a>
        <h1
          style={{
            fontSize: "32px",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "var(--ink-primary)",
            margin: "16px 0 24px",
          }}
        >
          Settings
        </h1>
        <ProfileSettingsForm />
        <div style={{ marginTop: "32px" }}>
          <MonitoringSettings id="monitoring-settings" />
        </div>
      </div>
    </div>
  );
}
