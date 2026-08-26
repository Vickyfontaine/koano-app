import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "KOANO Dashboard",
  description: "The KOANO intelligence dashboard, from the real estate reasoning engine.",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
