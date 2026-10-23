// Profile settings page — populates the letterhead fields used by white-label
// documents. Under /dashboard, so middleware guarantees auth. Standalone route
// (not part of the cluster SPA); a back link returns to the dashboard.

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import ProfileSettingsForm from "@/components/dashboard/ProfileSettingsForm";
import MonitoringSettings from "@/components/dashboard/MonitoringSettings";
import SimpleTopBar from "@/components/dashboard/shell/SimpleTopBar";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  return (
    <div style={{ minHeight: "100vh", background: "var(--white)" }}>
      <SimpleTopBar />
      <div style={{ maxWidth: "var(--content-prose)", margin: "0 auto", padding: "var(--space-6) var(--space-4) var(--space-8)" }}>
        <h1
          style={{
            fontSize: "32px",
            fontWeight: 700,
            letterSpacing: "-0.02em",
            color: "var(--ink-primary)",
            margin: "0 0 var(--space-5)",
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
