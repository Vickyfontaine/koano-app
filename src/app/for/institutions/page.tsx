import Nav from "@/components/marketing/Nav";
import Footer from "@/components/marketing/Footer";
import ClusterLanding from "@/components/marketing/ClusterLanding";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portfolio Intelligence — KOANO",
  description:
    "Monitor everything. Miss nothing. Make billion-dollar decisions with the intelligence infrastructure that was previously only available to the world's largest financial institutions.",
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
    title: "Isolated data environment",
    description:
      "Fully isolated data environment. Your portfolio data never touches another client's context.",
  },
  {
    title: "SOC 2 Type II",
    description:
      "SOC 2 Type II compliant infrastructure. Enterprise-grade security for enterprise-grade decisions.",
  },
  {
    title: "SSO & role-based access",
    description:
      "Role-based access controls with single sign-on. Your team sees exactly what they need to.",
  },
  {
    title: "Complete audit log",
    description:
      "Every query, verdict, and API call logged. Full auditability for compliance and governance.",
  },
  {
    title: "Air-gapped data",
    description:
      "Your portfolio data is air-gapped — it cannot and will not train KOANO's models. Ever.",
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
        tagline="Monitor everything. Miss nothing. Make billion-dollar decisions with the intelligence infrastructure that was previously only available to the world's largest financial institutions."
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
