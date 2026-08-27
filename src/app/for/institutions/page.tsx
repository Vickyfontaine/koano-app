import Nav from "@/components/marketing/Nav";
import Footer from "@/components/marketing/Footer";
import ClusterLanding from "@/components/marketing/ClusterLanding";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "KOANO Portfolio Intelligence",
  description:
    "Monitor everything. Miss nothing. Make institutional decisions with intelligence infrastructure that was previously available only to the world's largest firms.",
};

const FEATURES = [
  {
    title: "Investment Committee Memo",
    description:
      "A full IC memo with recommendation, market and risk analysis, comparable sales, and exhibits, as a PDF and an editable Word file for an analyst to complete the financial sections. Built on the stored verdict, so its math reproduces.",
  },
  {
    title: "Monday Portfolio Briefing",
    description:
      "A weekly briefing on what moved across the assets you hold, what is at risk and why, grounded in the public record and traceable to a source.",
  },
  {
    title: "Portfolio Risk Report",
    description:
      "Flood, contamination, seismic, disaster history, and crime exposure across the whole book, from live federal and city sources.",
  },
  {
    title: "Asset One-Pager",
    description:
      "A per-holding one-pager with the verdict, the envelope, key market indicators, and top risks.",
  },
  {
    title: "Weekly monitoring",
    description:
      "Watch up to 500 assets. KOANO diffs each one's public record week over week and flags what changed.",
  },
  {
    title: "Immutable verdict record",
    description:
      "Every verdict is written append-only and cannot be edited or deleted after the fact, by anyone. Portfolio data is never used to train KOANO's models, and row-level security scopes every record to your account.",
  },
];

const NOT_BUILT_YET = [
  {
    title: "NAV, FFO and NOI tracking",
    description:
      "These need rent rolls and operating statements, which are private. KOANO works from the public record and does not model private financials, so it will not report a value it cannot source.",
  },
  {
    title: "Enterprise controls",
    description:
      "SOC 2 Type II, single sign-on, role-based access, and dedicated per-tenant isolation arrive with enterprise onboarding. The immutable audit trail that underpins them is already in production.",
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
        headline="A portfolio does not change on a reporting cycle."
        subhead="KOANO watches the assets and the markets you hold, and tells you what moved, what is at risk, and why. Every claim is traceable to a source."
        users="CEOs, CFOs, CIOs, REITs, and PE firms"
        featuresHeading="What you get today"
        features={FEATURES}
        secondaryFeatures={{
          title: "What is not built yet",
          items: NOT_BUILT_YET,
        }}
      />
      <Footer />
    </>
  );
}
