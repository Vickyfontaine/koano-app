import Nav from "@/components/marketing/Nav";
import Footer from "@/components/marketing/Footer";
import ClusterLanding from "@/components/marketing/ClusterLanding";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Development Intelligence — KOANO",
  description:
    "Find your best site. Model your deal. Understand your entitlement risk. Before anyone else does.",
};

const FEATURES = [
  {
    title: "KOANO composite score",
    description:
      "Sites ranked by risk-adjusted opportunity — the single number that tells you where to look first.",
  },
  {
    title: "Zoning & entitlement risk",
    description:
      "Zoning and entitlement risk breakdown per site, including variance history and approval likelihood.",
  },
  {
    title: "BSA approval rate history",
    description:
      "Board of Standards and Appeals approval rate history by submarket — know your odds before you apply.",
  },
  {
    title: "Community board sentiment",
    description:
      "Predicted opposition level from community boards, based on historical patterns and current sentiment.",
  },
  {
    title: "Permitting timeline benchmarks",
    description:
      "Permitting timeline benchmarks by jurisdiction — plan your schedule with data, not guesswork.",
  },
  {
    title: "Multi-site comparison",
    description:
      "Compare multiple development sites side-by-side with KOANO's composite scoring across all risk factors.",
  },
];

const PRO_FORMA_FEATURES = [
  {
    title: "Land cost benchmarks",
    description:
      "Land cost benchmarks by micro-market and zoning class — know what you should be paying.",
  },
  {
    title: "Construction cost per SF",
    description:
      "Construction cost per square foot benchmarks updated with real permit data from Shovels.ai.",
  },
  {
    title: "Absorption projection",
    description:
      "How fast will your units sell or lease? Projections based on real-time demand signals.",
  },
  {
    title: "Exit cap rate estimate",
    description:
      "Exit cap rate estimates informed by KOANO's 5 agents — not just historical averages.",
  },
  {
    title: "IRR projection",
    description:
      "Internal rate of return projection with sensitivity table across market scenarios.",
  },
];

export default function DevelopersPage() {
  return (
    <>
      <Nav />
      <div style={{ height: "64px" }} />
      <ClusterLanding
        clusterNumber="C4"
        clusterName="Development intelligence"
        tagline="Find your best site. Model your deal. Understand your entitlement risk. Before anyone else does."
        price="From $499 / month"
        priceRange="$499–$1,499 / month"
        headlinePlaceholder="[COPY TBD — cluster landing page H1: Cluster 4]"
        users="CRE brokers, developers, and contractors"
        features={FEATURES}
        secondaryFeatures={{
          title: "Pro forma intelligence",
          items: PRO_FORMA_FEATURES,
        }}
      />
      <Footer />
    </>
  );
}
