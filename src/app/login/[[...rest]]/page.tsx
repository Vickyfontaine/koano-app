import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";
import AuthShell from "@/components/ui/AuthShell";
import { koanoClerkAppearance } from "@/components/ui/clerkAppearance";

export const metadata: Metadata = {
  title: "Log in — KOANO",
  description: "Log in to KOANO — the real estate reasoning engine.",
};

export default function LoginPage() {
  return (
    <AuthShell>
      <SignIn
        path="/login"
        routing="path"
        signUpUrl="/signup"
        fallbackRedirectUrl="/dashboard"
        appearance={koanoClerkAppearance}
      />
    </AuthShell>
  );
}
