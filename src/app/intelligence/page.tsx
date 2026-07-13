import type { Metadata } from "next";
import Nav from "@/components/marketing/Nav";
import Footer from "@/components/marketing/Footer";
import IntelligenceContent from "@/components/marketing/IntelligenceContent";

export const metadata: Metadata = {
  title: "How It Works — KOANO",
  description:
    "Five specialist AI agents that ingest dozens of data sources, reason independently, and converge on a single auditable verdict. The Russian doll architecture behind every KOANO decision.",
};

export default function IntelligencePage() {
  return (
    <>
      <Nav />
      <div style={{ height: "64px" }} />
      <IntelligenceContent />
      <Footer />
    </>
  );
}
