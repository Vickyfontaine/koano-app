import type { Metadata } from "next";
import Nav from "@/components/marketing/Nav";
import Footer from "@/components/marketing/Footer";
import DataContent from "@/components/marketing/DataContent";

export const metadata: Metadata = {
  title: "Data — KOANO",
  description:
    "Full transparency on the dozens of data sources behind every KOANO verdict — free public datasets live today, and the commercial providers that come online as they are licensed.",
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
