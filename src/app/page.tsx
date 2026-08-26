import Nav from "@/components/marketing/Nav";
import HeroSection from "@/components/marketing/HeroSection";
import AgentsSection from "@/components/marketing/AgentsSection";
import ProvenanceSection from "@/components/marketing/ProvenanceSection";
import ArchiveSection from "@/components/marketing/ArchiveSection";
import MonitoringSection from "@/components/marketing/MonitoringSection";
import ClustersSection from "@/components/marketing/ClustersSection";
import PromiseSection from "@/components/marketing/PromiseSection";
import DataTickerSection from "@/components/marketing/DataTickerSection";
import EarlyAccessSection from "@/components/marketing/EarlyAccessSection";
import Footer from "@/components/marketing/Footer";

export default function Home() {
  return (
    <>
      {/* NAV */}
      <Nav />

      {/* HERO */}
      <HeroSection />

      {/* 01 — THE ENGINE: five agents → one verdict, with its real arithmetic */}
      <AgentsSection />

      {/* 02 — PROVENANCE: every figure sourced (real ledger) */}
      <ProvenanceSection />

      {/* 03 — ARCHIVE: the compounding record */}
      <ArchiveSection />

      {/* 04 — MONITORING: the weekly watch */}
      <MonitoringSection />

      {/* 05 — CLUSTERS: four altitudes */}
      <ClustersSection />

      {/* PROMISE */}
      <PromiseSection />

      {/* DATA TICKER */}
      <DataTickerSection />

      {/* EARLY ACCESS CTA */}
      <EarlyAccessSection />

      {/* FOOTER */}
      <Footer />
    </>
  );
}
