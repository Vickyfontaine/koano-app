import Nav from "@/components/marketing/Nav";
import Footer from "@/components/marketing/Footer";
import ClusterLanding from "@/components/marketing/ClusterLanding";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "KOANO Development Intelligence",
  description:
    "Find your best site. Model your deal. Understand your entitlement risk. Before anyone else does.",
};

const FEATURES = [
  {
    title: "Development Site Screening Memo",
    description:
      "A single-site verdict with the as-of-right envelope, entitlement risk, an assemblage and air-rights read, a due-diligence gap register, and the reasoning behind the call. Live for NYC.",
  },
  {
    title: "Entitlement Risk Memo",
    description:
      "An entitlement risk read scored from live PLUTO facts, the community district's filing track record, and the subject lot's own filing history.",
  },
  {
    title: "Three-Site Comparison Brief",
    description:
      "Up to three sites run through all five agents and ranked by risk-adjusted composite score, with the reasoning that separates them.",
  },
  {
    title: "As-of-right and incentive read",
    description:
      "The buildable envelope from live MapPLUTO, plus Opportunity Zone and LIHTC eligibility from IRS and HUD, tied to the parcel's own geography.",
  },
  {
    title: "Weekly monitoring",
    description:
      "Watch up to 50 sites. KOANO diffs each one's public record week over week and sends what changed.",
  },
];

const NOT_BUILT_YET = [
  {
    title: "Pro forma feasibility",
    description:
      "Land and construction benchmarks are representative today, labeled as such on every figure, and they feed a Pro Forma Summary that KOANO will not ship as live until the data is funded. A CoStar or HouseCanary license turns it live with a one-line change and no rework.",
  },
  {
    title: "Approval odds and community-board opposition",
    description:
      "Forecasting a hearing outcome or an approval probability is a model KOANO has not built. It reports the district's actual filing and disposition record, not a prediction of your hearing.",
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
        headline="You already know the site. The question is what happens next to it."
        subhead="Five agents read the zoning, the permit history, and the development activity around a parcel. They converge on a single verdict, and the reasoning comes with it."
        users="CRE brokers, developers, and contractors"
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
