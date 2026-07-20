import type { Metadata } from "next";
import Nav from "@/components/marketing/Nav";
import Footer from "@/components/marketing/Footer";
import CommunityContent from "@/components/marketing/CommunityContent";

export const metadata: Metadata = {
  title: "Community — KOANO",
  description:
    "KOANO's community commitment, stated honestly: no partnerships yet, a specific intent to serve tenant advocates with the same engine, and no pretending it is a program until it is one.",
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
