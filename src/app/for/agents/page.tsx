import Nav from "@/components/marketing/Nav";
import Footer from "@/components/marketing/Footer";
import ClusterLanding from "@/components/marketing/ClusterLanding";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Transaction Intelligence — KOANO",
  description:
    "Find opportunities before they hit the MLS. Make data-backed recommendations that close deals.",
};

const FEATURES = [
  {
    title: "Velocity heatmap",
    description:
      "See the fastest-changing neighborhoods at a glance — where prices are moving before anyone notices.",
  },
  {
    title: "Absorption rate analysis",
    description:
      "Absorption rate by micro-market, so you know which neighborhoods are soaking up inventory.",
  },
  {
    title: "DOM trend detection",
    description:
      "Where days-on-market is compressing — the early signal that a market is about to heat up.",
  },
  {
    title: "Price reduction patterns",
    description:
      "Detect price reduction patterns before they become trends. Spot motivated sellers early.",
  },
  {
    title: "CMA builder",
    description:
      "Comparative market analysis builder with KOANO's early-signal overlay for more accurate comps.",
  },
  {
    title: "Pricing recommendation engine",
    description:
      "AI-powered pricing recommendations that factor in signals your competitors don't have access to.",
  },
];

const CLIENT_TOOLS = [
  {
    title: "Client-ready PDF reports",
    description:
      "Generate polished, branded PDF reports with KOANO intelligence that make you look like the smartest agent in the room.",
  },
  {
    title: "Neighborhood narrative generator",
    description:
      "AI-written neighborhood narratives that turn data into compelling stories for your clients.",
  },
  {
    title: "Lead generation signals",
    description:
      "Identify likely sellers from infrastructure signals, price pattern detection, and ownership tenure analysis.",
  },
];

export default function AgentsPage() {
  return (
    <>
      <Nav />
      <div style={{ height: "64px" }} />
      <ClusterLanding
        clusterNumber="C2"
        clusterName="Transaction intelligence"
        tagline="Find opportunities before they hit the MLS. Make data-backed recommendations that close deals."
        price="From $149 / month"
        priceRange="$149–$299 / month"
        headlinePlaceholder="[COPY TBD — cluster landing page H1: Cluster 2]"
        users="agents, brokers, and mortgage officers"
        features={FEATURES}
        secondaryFeatures={{
          title: "Client tools",
          items: CLIENT_TOOLS,
        }}
      />
      <Footer />
    </>
  );
}
