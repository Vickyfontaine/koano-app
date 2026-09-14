import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const SITE_TITLE = "KOANO: The Real Estate Reasoning Engine";
const SITE_DESCRIPTION =
  "KOANO deploys five specialist AI agents that ingest the public record, reason autonomously, and deliver a single verdict, with every step of the thinking visible and auditable.";
const SITE_URL = "https://www.koano.co";

// Icons and the social preview image are wired via Next's file conventions in
// src/app/ (favicon.ico, icon.png, apple-icon.png, opengraph-image.png,
// twitter-image.png). metadataBase makes those image URLs absolute so Slack /
// LinkedIn / X can fetch them.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  keywords: [
    "real estate",
    "AI",
    "reasoning engine",
    "property intelligence",
    "investment",
  ],
  openGraph: {
    type: "website",
    siteName: "KOANO",
    url: SITE_URL,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
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
