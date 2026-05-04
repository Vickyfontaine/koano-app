import type { Metadata } from "next";
import Nav from "@/components/marketing/Nav";
import Footer from "@/components/marketing/Footer";
import EarlyAccessContent from "@/components/marketing/EarlyAccessContent";

export const metadata: Metadata = {
  title: "Early Access — KOANO",
  description:
    "Join the KOANO early access waitlist. We're onboarding users cluster by cluster — pick your cluster and we'll notify you when you're ready.",
};

export default function EarlyAccessPage() {
  return (
    <>
      <Nav />
      <div style={{ height: "64px" }} />
      <EarlyAccessContent />
      <Footer />
    </>
  );
}
