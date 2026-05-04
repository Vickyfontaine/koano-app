import type { Metadata } from "next";
import Nav from "@/components/marketing/Nav";
import Footer from "@/components/marketing/Footer";
import AboutContent from "@/components/marketing/AboutContent";

export const metadata: Metadata = {
  title: "About — KOANO",
  description:
    "KOANO is a real estate reasoning engine — a new category. Not analytics, not listings, not data. A system that reasons about real estate and delivers a single, auditable verdict.",
};

export default function AboutPage() {
  return (
    <>
      <Nav />
      <div style={{ height: "64px" }} />
      <AboutContent />
      <Footer />
    </>
  );
}
