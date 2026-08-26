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
    title: "KOANO composite score",
    description:
      "Sites ranked by risk-adjusted opportunity. The single number tells you where to look first.",
  },
  {
    title: "Entitlement risk, from the facts",
    description:
      "An entitlement risk score computed from live PLUTO facts: FAR headroom, special-district and mixed-use constraints, with the model adjusting the number rather than pinning it to the middle.",
  },
  {
    title: "As-of-right envelope",
    description:
      "What the zoning actually allows on the lot, read from live MapPLUTO, so you see the buildable envelope before you commit.",
  },
  {
    title: "Permit and violation history",
    description:
      "The site's full DOB permit and job-filing record and its HPD and ECB violation history, pulled live.",
  },
  {
    title: "Opportunity Zone and incentive status",
    description:
      "Live Opportunity Zone designation and LIHTC eligibility from IRS and HUD, tied to the parcel's own geography.",
  },
  {
    title: "Multi-site comparison",
    description:
      "Compare up to three sites side by side, each run through all five agents, ranked by composite score with the reasoning attached.",
  },
];

const PRO_FORMA_FEATURES = [
  {
    title: "Land and construction benchmarks",
    description:
      "Representative benchmarks for the market today, labeled as representative on every figure. A CoStar or HouseCanary license turns them live.",
  },
  {
    title: "Pro forma inputs, sourced",
    description:
      "Every input the model uses carries its provenance, so a representative stand-in is never mistaken for a live number.",
  },
  {
    title: "What funding unlocks",
    description:
      "The upgrade is a one-line change in the provider registry. No rework, no re-architecture, the moment the data is funded.",
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
