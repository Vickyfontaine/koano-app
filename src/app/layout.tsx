import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "KOANO — The Real Estate Reasoning Engine",
  description:
    "KOANO deploys five specialist AI agents that ingest dozens of data sources, reason autonomously, and deliver a single verdict, with every step of the thinking visible and auditable.",
  keywords: [
    "real estate",
    "AI",
    "reasoning engine",
    "property intelligence",
    "investment",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      signInUrl="/login"
      signUpUrl="/signup"
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/onboarding"
      afterSignOutUrl="/"
    >
      <html lang="en">
        <head>
          {/* Neue Montreal — KOANO's primary typeface */}
          <link
            href="https://api.fontshare.com/v2/css?f[]=neue-montreal@400,500,700&display=swap"
            rel="stylesheet"
          />
          {/* DM Mono — monospace for data labels, section numbers, stats */}
          <link
            href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&display=swap"
            rel="stylesheet"
          />
        </head>
        <body className="antialiased">{children}</body>
      </html>
    </ClerkProvider>
  );
}
