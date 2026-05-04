import type { Metadata } from "next";
import Nav from "@/components/marketing/Nav";
import Footer from "@/components/marketing/Footer";
import CommunityContent from "@/components/marketing/CommunityContent";

export const metadata: Metadata = {
  title: "Community — KOANO",
  description:
    "Cluster 0 is KOANO's conscience. The same intelligence that serves institutional investors is made available free of charge to tenant advocacy organizations and community groups.",
};

export default function CommunityPage() {
  return (
    <>
      <Nav />
      <div style={{ height: "64px" }} />
      <CommunityContent />
      <Footer />
    </>
  );
}
