// Cluster-aware dashboard root — Checkpoints 1–4 + Phase B lockdown.
// Server component: reads the user's cluster AND access_status from the
// profiles table. No profile / no cluster yet → /onboarding. Signed in but
// not approved → honest AccessPending screen (access is by request while
// the demo runs on a limited budget). Middleware already guarantees auth.

import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "../../../lib/supabase/server";
import DashboardShell from "@/components/dashboard/DashboardShell";
import AccessPending from "@/components/dashboard/AccessPending";
import { isClusterId } from "@/components/dashboard/clusters";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  let cluster: unknown = null;
  let accessStatus = "pending";
  let createdAt: string | null = null;
  try {
    const { data } = await supabaseAdmin()
      .from("profiles")
      .select("cluster, access_status, created_at")
      .eq("clerk_user_id", userId)
      .maybeSingle();
    cluster = data?.cluster ?? null;
    accessStatus = (data?.access_status as string | undefined) ?? "pending";
    createdAt = (data?.created_at as string | undefined) ?? null;
  } catch {
    cluster = null;
    accessStatus = "pending"; // fail closed
  }

  if (!isClusterId(cluster)) redirect("/onboarding");

  if (accessStatus !== "approved") {
    // Queue position among pending requests, oldest first.
    let queuePosition: number | null = null;
    if (accessStatus === "pending" && createdAt) {
      try {
        const { count } = await supabaseAdmin()
          .from("profiles")
          .select("id", { count: "exact", head: true })
          .eq("access_status", "pending")
          .lte("created_at", createdAt);
        queuePosition = count ?? null;
      } catch {
        queuePosition = null;
      }
    }
    const user = await currentUser();
    return (
      <AccessPending
        status={accessStatus === "denied" ? "denied" : "pending"}
        queuePosition={queuePosition}
        email={user?.primaryEmailAddress?.emailAddress ?? null}
      />
    );
  }

  return <DashboardShell initialCluster={cluster} />;
}
