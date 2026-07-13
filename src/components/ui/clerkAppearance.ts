// KOANO appearance for Clerk components (Section 10 design system).
// Coastal Intelligence palette, Neue Montreal, pill buttons.

export const koanoClerkAppearance = {
  variables: {
    colorPrimary: "#A8C4D4",
    colorText: "#0D2B3E",
    colorTextSecondary: "#3D5A6E",
    colorTextOnPrimaryBackground: "#0D2B3E",
    colorBackground: "#FFFFFF",
    colorInputBackground: "#FFFFFF",
    colorInputText: "#0D2B3E",
    colorNeutral: "#0D2B3E",
    colorDanger: "#EF4444",
    colorSuccess: "#22C55E",
    colorWarning: "#F59E0B",
    borderRadius: "12px",
    fontFamily: "'Neue Montreal', 'DM Sans', system-ui, sans-serif",
    fontSize: "15px",
  },
  elements: {
    rootBox: { width: "100%" },
    cardBox: {
      boxShadow: "0 2px 16px rgba(13, 43, 62, 0.06)",
      border: "1px solid #D6EBF7",
      borderRadius: "20px",
      width: "100%",
    },
    card: { boxShadow: "none" },
    formButtonPrimary: {
      borderRadius: "100px",
      backgroundColor: "#A8C4D4",
      color: "#0D2B3E",
      fontWeight: 500,
      fontSize: "14px",
      textTransform: "none" as const,
      boxShadow: "none",
      border: "1px solid #A8C4D4",
      "&:hover": { backgroundColor: "#5A9BBE", borderColor: "#5A9BBE", color: "#FFFFFF" },
    },
    socialButtonsBlockButton: {
      borderRadius: "100px",
      border: "1px solid #D6EBF7",
      "&:hover": { backgroundColor: "#F0F7FC" },
    },
    formFieldInput: {
      borderRadius: "12px",
      border: "1px solid #D6EBF7",
      "&:focus": { borderColor: "#5A9BBE", boxShadow: "0 0 0 3px rgba(90, 155, 190, 0.12)" },
    },
    footerActionLink: { color: "#5A9BBE", "&:hover": { color: "#1A4F6E" } },
    headerTitle: { fontWeight: 700, letterSpacing: "-0.02em", color: "#0D2B3E" },
    headerSubtitle: { color: "#3D5A6E" },
  },
};
