import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";
import AuthShell from "@/components/ui/AuthShell";
import { koanoClerkAppearance } from "@/components/ui/clerkAppearance";

export const metadata: Metadata = {
  title: "Sign up — KOANO",
  description: "Create your KOANO account — the real estate reasoning engine.",
};

export default function SignupPage() {
  return (
    <AuthShell>
      <SignUp
        path="/signup"
        routing="path"
        signInUrl="/login"
        fallbackRedirectUrl="/onboarding"
        appearance={koanoClerkAppearance}
      />
    </AuthShell>
  );
}
