import type { Metadata } from "next";
import Nav from "@/components/marketing/Nav";
import Footer from "@/components/marketing/Footer";
import DataContent from "@/components/marketing/DataContent";

export const metadata: Metadata = {
  title: "Data — KOANO",
  description:
    "Full transparency on the 50+ data sources powering every KOANO verdict. 25+ free public datasets ingested continuously. 20+ licensed commercial providers called on-demand.",
};

export default function DataPage() {
  return (
    <>
      <Nav />
      <div style={{ height: "64px" }} />
      <DataContent />
      <Footer />
    </>
  );
}
