import Nav from "@/components/marketing/Nav";
import Footer from "@/components/marketing/Footer";
import ClusterLanding from "@/components/marketing/ClusterLanding";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portfolio Intelligence — KOANO",
  description:
    "Monitor everything. Miss nothing. Make institutional decisions with intelligence infrastructure that was previously available only to the world's largest firms.",
};

const FEATURES = [
  {
    title: "Real-time NAV tracking",
    description:
      "Real-time net asset value tracking across your entire portfolio — every asset, every market, always current.",
  },
  {
    title: "FFO & NOI monitoring",
    description:
      "Funds from operations and net operating income monitoring by asset, market, and asset class.",
  },
  {
    title: "Portfolio risk score",
    description:
      "A single portfolio risk score powered by all 5 KOANO agents, updated continuously.",
  },
  {
    title: "Hold / sell / reposition analysis",
    description:
      "Per-asset hold, sell, or reposition analysis with full reasoning chain and confidence scoring.",
  },
  {
    title: "Monday morning briefing",
    description:
      "What changed overnight. What is at risk and why. What opportunities are emerging. Every Monday.",
  },
  {
    title: "Regulatory change alerts",
    description:
      "Regulatory changes affecting held assets — zoning updates, policy shifts, opportunity zone expirations.",
  },
];

const ENTERPRISE_FEATURES = [
  {
    title: "Immutable verdict record",
    description:
      "Every verdict is recorded append-only — it cannot be edited or deleted after the fact, by anyone. The audit trail is a product promise, live today.",
  },
  {
    title: "Your data stays yours",
    description:
      "Portfolio data is never used to train KOANO's models, and row-level security scopes every record to your account.",
  },
  {
    title: "SOC 2 Type II — enterprise roadmap",
    description:
      "SOC 2 Type II certification lands with enterprise onboarding. The immutable audit trail that underpins it is already in production.",
  },
  {
    title: "SSO & role-based access — enterprise roadmap",
    description:
      "Sign-in today is email and Google. Single sign-on and role-based access controls arrive with the enterprise tier.",
  },
  {
    title: "Dedicated data isolation — enterprise roadmap",
    description:
      "Row-level security isolates your records today; dedicated per-tenant environments arrive with enterprise onboarding.",
  },
  {
    title: "API access",
    description:
      "Direct API access for integration with your existing portfolio management and reporting systems.",
  },
];

export default function InstitutionsPage() {
  return (
    <>
      <Nav />
      <div style={{ height: "64px" }} />
      <ClusterLanding
        clusterNumber="C5"
        clusterName="Portfolio intelligence"
        tagline="Monitor everything. Miss nothing. Make institutional decisions with intelligence infrastructure that was previously available only to the world's largest firms."
        price="From $1,499 / month"
        priceRange="$1,499–$4,999 / month + custom"
        headlinePlaceholder="[COPY TBD — cluster landing page H1: Cluster 5]"
        users="CEOs, CFOs, CIOs, REITs, and PE firms"
        features={FEATURES}
        secondaryFeatures={{
          title: "Enterprise security",
          items: ENTERPRISE_FEATURES,
        }}
      />
      <Footer />
    </>
  );
}
