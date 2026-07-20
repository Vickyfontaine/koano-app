import Nav from "@/components/marketing/Nav";
import Footer from "@/components/marketing/Footer";
import ClusterLanding from "@/components/marketing/ClusterLanding";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Property Intelligence — KOANO",
  description:
    "KOANO reads the violations, the ownership, the permits, and the risk data tied to an address, whether you own the place or rent it, and tells you what it means.",
};

// "What this reads today" — approved copy, verbatim. All four are live
// provider capabilities (violations, ownership, permits/zoning, risk blocks).
const FEATURES = [
  {
    title: "Violation history",
    description:
      "Every HPD housing maintenance violation on the building, by class, open or closed, with the trend across the last two years against the two before it. Plus ECB violations by severity and active DOB complaints. HPD violations apply to buildings with three or more units, so a small building returning nothing is a coverage fact, not a clean record.",
  },
  {
    title: "Who owns it",
    description:
      "The registered owner and managing agent from HPD records, the other buildings held under the same entity, and the violation volume across that portfolio. Ownership held through separate LLCs per building will undercount, and KOANO says so rather than presenting a portfolio as complete.",
  },
  {
    title: "What is being built nearby",
    description:
      "Approved DOB permits around the address, and what the zoning allows on the lots next to you.",
  },
  {
    title: "What the ground is doing",
    description:
      "FEMA flood exposure, neighborhood demographic change, price movement, crime trend, and whether the tract is a designated Opportunity Zone.",
  },
];

// "What is not built yet" — approved copy, verbatim. Named capabilities that
// are NOT built, with the reason each one waits.
const NOT_BUILT_YET = [
  {
    title: "Displacement risk scoring",
    description:
      "The inputs are live. The model is not. Building this properly means publishing how it is weighted rather than handing you a number and asking you to trust it, and that is a different piece of work than wiring up a data source.",
  },
  {
    title: "Affordable housing lottery listings",
    description:
      "There is no public feed for open lotteries, income limits, and deadlines. Doing this means scraping Housing Connect, which is fragile enough that it would break quietly. It waits.",
  },
  {
    title: "Eviction filings and harassment records",
    description:
      "Housing court data is not public in the way permit data is. KOANO reads ownership and violation patterns, which is real and useful, and it does not claim to read the court record, because it cannot.",
  },
];

export default function CommunityPage() {
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
        headline="The record on your building is public. Reading it is the hard part."
        subhead="KOANO reads the violations, the ownership, the permits, and the risk data tied to an address, whether you own the place or rent it, and tells you what it means."
        stanceLine="Not a tool for gentrification."
        featuresHeading="What this reads today"
        users="homeowners, renters, and neighbors"
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
