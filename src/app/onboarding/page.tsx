import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import OnboardingClusters from "@/components/dashboard/OnboardingClusters";

export const metadata: Metadata = {
  title: "Choose your cluster — KOANO",
  description: "Select the KOANO intelligence cluster that fits how you work.",
};

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  return <OnboardingClusters />;
}
