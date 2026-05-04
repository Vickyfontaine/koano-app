import type { Metadata } from "next";
import Nav from "@/components/marketing/Nav";
import Footer from "@/components/marketing/Footer";
import PricingContent from "@/components/marketing/PricingContent";

export const metadata: Metadata = {
  title: "Pricing — KOANO",
  description:
    "The same intelligence engine at four altitudes. Property intelligence from $19/month. Transaction intelligence from $149/month. Development intelligence from $499/month. Portfolio intelligence from $1,499/month.",
};

export default function PricingPage() {
  return (
    <>
      <Nav />
      <div style={{ height: "64px" }} />
      <PricingContent />
      <Footer />
    </>
  );
}
