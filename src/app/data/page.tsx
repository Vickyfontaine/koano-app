import type { Metadata } from "next";
import Nav from "@/components/marketing/Nav";
import Footer from "@/components/marketing/Footer";
import DataContent from "@/components/marketing/DataContent";

export const metadata: Metadata = {
  title: "KOANO Data",
  description:
    "The exact data sources behind every KOANO verdict, generated from the live provider registry so the list can never drift. Most are public sources queried in real time. The rest are labeled stand-ins for licensed data not yet funded.",
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
