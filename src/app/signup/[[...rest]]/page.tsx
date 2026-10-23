import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";
import AuthShell from "@/components/ui/AuthShell";
import { koanoClerkAppearance } from "@/components/ui/clerkAppearance";

export const metadata: Metadata = {
  title: "Sign up for KOANO",
  description: "Create your account for KOANO, the real estate reasoning engine.",
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
      <p
        style={{
          marginTop: "var(--space-5)",
          textAlign: "center",
          fontSize: "var(--text-data)",
          lineHeight: 1.6,
          color: "var(--ink-muted)",
        }}
      >
        The free plan includes a limited number of analyses; a subscription is
        required to continue.
      </p>
    </AuthShell>
  );
}
