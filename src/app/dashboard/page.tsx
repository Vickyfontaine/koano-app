// Cluster-aware dashboard root — tier-based access (Phase 2 + 4).
// Server component: reads the user's cluster from the profiles table. No
// profile / no cluster yet → /onboarding. Any signed-in user reaches the
// dashboard and uses their plan's allotment immediately; per-request spend
// limits are enforced server-side in lib/koano-guard.ts, not here. On return
// from Stripe checkout (?upgraded=1) the shell shows a "confirming your
// upgrade" overlay while the webhook flips the plan. Middleware guarantees auth.

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { supabaseAdmin } from "../../../lib/supabase/server";
import DashboardShell from "@/components/dashboard/DashboardShell";
import { isClusterId } from "@/components/dashboard/clusters";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { upgraded?: string };
}) {
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

  return (
    <DashboardShell initialCluster={cluster} justUpgraded={searchParams.upgraded === "1"} />
  );
}
