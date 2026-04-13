import Nav from "@/components/marketing/Nav";
import Footer from "@/components/marketing/Footer";
import ClusterLanding from "@/components/marketing/ClusterLanding";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Property Intelligence — KOANO",
  description:
    "Know what's happening to your property's value before your neighbors do — and know what to do about it.",
};

const FEATURES = [
  {
    title: "Automated valuation model",
    description:
      "Real-time AVM with velocity indicator showing whether your property value is accelerating or decelerating.",
  },
  {
    title: "Equity position & projections",
    description:
      "Current equity position and 12-month projection with confidence interval, updated daily.",
  },
  {
    title: "Neighborhood signal feed",
    description:
      "Permits, zoning changes, and infrastructure projects within 2 miles — the signals that move your value.",
  },
  {
    title: "KOANO verdict",
    description:
      "Hold, prepare to sell, or sell now — with a timing window and full reasoning chain you can audit.",
  },
  {
    title: "Scenario modeling",
    description:
      "\"What if this infrastructure project completes?\" Model the impact of nearby developments on your property.",
  },
  {
    title: "Alert feed",
    description:
      "Push notifications for significant nearby signals — never miss a change that affects your property.",
  },
];

const LANDLORD_FEATURES = [
  {
    title: "Cap rate & NOI calculations",
    description:
      "Automated cap rate and net operating income calculations updated in real time.",
  },
  {
    title: "ARV modeling",
    description:
      "After-repair value modeling with rehab cost benchmarks broken down by zip code.",
  },
  {
    title: "Vacancy rate trends",
    description:
      "Vacancy rate trends and rent momentum — see where rents are heading before they get there.",
  },
  {
    title: "Cash-on-cash projections",
    description:
      "Cash-on-cash return projections that factor in KOANO's early signals for a more accurate forecast.",
  },
];

export default function HomeownersPage() {
  return (
    <>
      <Nav />
      <div style={{ height: "64px" }} />
      <ClusterLanding
        clusterNumber="C1"
        clusterName="Property intelligence"
        tagline="Know what's happening to your property's value before your neighbors do — and know what to do about it."
        price="From $19 / month"
        priceRange="$19–$49 / month"
        headlinePlaceholder="[COPY TBD — cluster landing page H1: Cluster 1]"
        users="homeowners, landlords, and house flippers"
        features={FEATURES}
        secondaryFeatures={{
          title: "Landlord & flipper tools",
          price: "$49 / month",
          items: LANDLORD_FEATURES,
        }}
      />
      <Footer />
    </>
  );
}
