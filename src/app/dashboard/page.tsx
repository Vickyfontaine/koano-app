// Cluster-aware dashboard root — Checkpoint 1 (Phase B).
// Server component: reads the user's cluster from the profiles table.
// No profile / no cluster yet → /onboarding. Middleware already guarantees auth.

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "../../../lib/supabase/server";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { isClusterId } from "@/components/dashboard/clusters";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  let cluster: unknown = null;
  try {
    const { data } = await supabaseAdmin()
      .from("profiles")
      .select("cluster")
      .eq("clerk_user_id", userId)
      .maybeSingle();
    cluster = data?.cluster ?? null;
  } catch {
    cluster = null;
  }

  if (!isClusterId(cluster)) redirect("/onboarding");

  return <DashboardShell initialCluster={cluster} />;
}
