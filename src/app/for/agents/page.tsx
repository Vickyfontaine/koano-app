import Nav from "@/components/marketing/Nav";
import Footer from "@/components/marketing/Footer";
import ClusterLanding from "@/components/marketing/ClusterLanding";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "KOANO Transaction Intelligence",
  description:
    "Find opportunities before they hit the MLS. Make data-backed recommendations that close deals.",
};

const FEATURES = [
  {
    title: "Comparative Market Analysis",
    description:
      "A full CMA built on live NYC recorded sales, ranked by true distance from the subject and time-adjusted to today. Delivered as a PDF and an editable Word file, so you can adjust it before it reaches a client.",
  },
  {
    title: "Pricing Recommendation Sheet",
    description:
      "A recommended price band with the comparable sales and the recorded price trend that produced it, laid out for a listing conversation.",
  },
  {
    title: "Client Neighborhood Report",
    description:
      "A client-ready read on the neighborhood: prices, permits, demographics, and flood exposure, written as a narrative with every figure sourced.",
  },
  {
    title: "Buyer and Seller Net Sheet",
    description:
      "The closing math a client needs to decide, generated from the analysis with each figure labeled by where it came from.",
  },
  {
    title: "Weekly monitoring",
    description:
      "Watch up to 20 properties. KOANO diffs each one's public record week over week and sends what changed, in the app and in a Monday digest.",
  },
];

const NOT_BUILT_YET = [
  {
    title: "MLS-grade comp detail",
    description:
      "Beds, baths, condition, days-on-market, and active listings come from the MLS, which is licensed and gated. KOANO's comps are recorded sales, which are public and real. A CMA today carries price and distance. Beds, baths, and days-on-market arrive when the MLS feed is funded.",
  },
  {
    title: "Likely-seller lead lists",
    description:
      "Predicting who is about to sell from ownership tenure and permit patterns is a model KOANO has not built. It reads the record today and does not yet forecast the seller.",
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
