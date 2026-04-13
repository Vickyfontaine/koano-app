import Nav from "@/components/marketing/Nav";
import HeroSection from "@/components/marketing/HeroSection";
import ClustersSection from "@/components/marketing/ClustersSection";
import PromiseSection from "@/components/marketing/PromiseSection";
import AgentsSection from "@/components/marketing/AgentsSection";
import DataTickerSection from "@/components/marketing/DataTickerSection";
import EarlyAccessSection from "@/components/marketing/EarlyAccessSection";
import Footer from "@/components/marketing/Footer";

export default function Home() {
  return (
    <>
      {/* Section 1 — NAV */}
      <Nav />

      {/* Section 2 — HERO */}
      <HeroSection />

      {/* Section 3 — CLUSTERS */}
      <ClustersSection />

      {/* Section 4 — PROMISE */}
      <PromiseSection />

      {/* Section 5 — AGENTS (Russian doll flow) */}
      <AgentsSection />

      {/* Section 6 — DATA TICKER */}
      <DataTickerSection />

      {/* Section 7 — EARLY ACCESS CTA */}
      <EarlyAccessSection />

      {/* Section 8 — FOOTER */}
      <Footer />
    </>
  );
}
