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
      "See the fastest-changing neighborhoods at a glance, where recorded sale prices are moving first.",
  },
  {
    title: "Absorption analysis",
    description:
      "Sales velocity by micro-market, drawn from live NYC recorded sales, so you know which neighborhoods are soaking up inventory.",
  },
  {
    title: "Price trend detection",
    description:
      "Where recorded sale prices are climbing or softening across a submarket, read from live DOF sales.",
  },
  {
    title: "Distance-ranked comps",
    description:
      "Recorded sales joined to their parcel centroids and ranked by true distance from the subject, then time-adjusted to today.",
  },
  {
    title: "CMA builder",
    description:
      "Comparative market analysis with KOANO's early-signal overlay, every comp sourced and dated.",
  },
  {
    title: "Pricing recommendation",
    description:
      "A pricing recommendation with the comps, the price trend, and the reasoning shown alongside it.",
  },
];

const CLIENT_TOOLS = [
  {
    title: "Client neighborhood report",
    description:
      "A polished, client-ready report that turns the live record into a narrative you can hand over, with every figure sourced.",
  },
  {
    title: "Pricing recommendation sheet",
    description:
      "The recommended price, the comps behind it, and the price trend, laid out for a listing conversation.",
  },
  {
    title: "Buyer and seller net sheets",
    description:
      "The numbers a client needs to decide, generated from the analysis and labeled with where each figure came from.",
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
        headline="The MLS tells you what already happened."
        subhead="KOANO reads the signals that move first. Permit filings, price momentum, and lending activity, the things that show up in the public record before they show up in a comp."
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
