import type { Metadata } from "next";
import Nav from "@/components/marketing/Nav";
import Footer from "@/components/marketing/Footer";
import VisionContent from "@/components/marketing/VisionContent";

export const metadata: Metadata = {
  title: "KOANO vision: concept previews",
  description:
    "Concept previews of where the KOANO reasoning engine is going: radar, sentence-to-building, the ownership graph and the track record. Not in the product today.",
  robots: { index: false, follow: true },
};

export default function VisionPage() {
  return (
    <>
      <Nav />
      <div style={{ height: "var(--nav-h)" }} />
      <VisionContent />
      <Footer />
    </>
  );
}
