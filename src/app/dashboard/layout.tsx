import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard — KOANO",
  description: "KOANO intelligence dashboard — real estate reasoning engine.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
