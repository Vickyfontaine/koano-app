// Cluster identity + approved verbatim copy (CLAUDE.md Sections 08 & 13).
// This is the single client-side source of truth for cluster metadata.
// There is no Cluster 0 and no cluster_3 ID: the internal cluster_id space is
// cluster_1/2/4/5 (DB, pricing, onboarding all key off it).
// NOTE: `badge` (C1–C4) is a DISPLAY index in KOANO's positioning order —
// C1 developers, C2 professionals, C3 institutions, C4 communities — and is
// intentionally DECOUPLED from the cluster_id. So cluster_4 (developers)
// carries badge "C1", and the display "C3" is institutions, not a cluster_3.
// `number` ("01".."05") still mirrors the cluster_id and is load-bearing for
// DOM ids (e.g. c4-history) — do not repoint it to the badge.

export type ClusterId = "cluster_1" | "cluster_2" | "cluster_4" | "cluster_5";

export const CLUSTER_IDS: ClusterId[] = [
  "cluster_1",
  "cluster_2",
  "cluster_4",
  "cluster_5",
];

export interface ClusterMeta {
  id: ClusterId;
  number: string; // DOM-id prefix only ("01".."05"); never shown to the user since WS3
  badge: string; // marketing display index C1–C4 (hero pages, pricing); never shown in the app
  label: string; // approved product name
  lens: string; // plain lens name shown in the app shell (UI sprint WS3)
  audience: string; // who it serves (Section 08)
  tagline: string; // approved verbatim card copy (Section 13)
  price: string; // approved price line (Section 13)
}

export const CLUSTERS: Record<ClusterId, ClusterMeta> = {
  cluster_1: {
    id: "cluster_1",
    lens: "Property",
    number: "01",
    badge: "C4",
    label: "Property intelligence",
    audience: "Homeowners, renters, neighbors",
    tagline:
      "Know what's happening to your property's value before your neighbors do, and know what to do about it.",
    price: "From 19 / month",
  },
  cluster_2: {
    id: "cluster_2",
    lens: "Price",
    number: "02",
    badge: "C2",
    label: "Transaction intelligence",
    audience: "Agents, brokers, mortgage officers",
    tagline:
      "Find opportunities before they hit the MLS. Make data-backed recommendations that close deals.",
    price: "From 149 / month",
  },
  cluster_4: {
    id: "cluster_4",
    lens: "Develop",
    number: "04",
    badge: "C1",
    label: "Development intelligence",
    audience: "Developers, CRE brokers, contractors",
    tagline:
      "Find your best site. Model your deal. Understand your entitlement risk. Before anyone else does.",
    price: "From 499 / month",
  },
  cluster_5: {
    id: "cluster_5",
    lens: "Acquire",
    number: "05",
    badge: "C3",
    label: "Portfolio intelligence",
    audience: "Institutional investors, C-suite, REITs",
    tagline:
      "Monitor everything. Miss nothing. Make institutional decisions with intelligence infrastructure that was previously available only to the world's largest firms.",
    price: "From 1,499 / month",
  },
};

// Lens order in the app shell (redesign spec §3): the wedge first.
export const LENS_ORDER: ClusterId[] = ["cluster_4", "cluster_5", "cluster_2", "cluster_1"];

// Plan tag shown in the shell (the plan is the pricing tier; the lens is the view).
export const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  community: "Community",
  transaction: "Transaction",
  development: "Development",
  portfolio: "Portfolio",
};

export function isClusterId(value: unknown): value is ClusterId {
  return (
    typeof value === "string" && (CLUSTER_IDS as string[]).includes(value)
  );
}

// Sidebar navigation — each item targets a real section id in the cluster's
// view (Cluster 4's c4-sites / c4-system switch tabs). No decorative items.
export interface ClusterNavItem {
  label: string;
  target: string; // DOM section id (or tab id for Cluster 4)
}

export const CLUSTER_NAV: Record<ClusterId, ClusterNavItem[]> = {
  cluster_1: [
    { label: "My property", target: "c1-property" },
    { label: "Valuation", target: "c1-valuation" },
    { label: "Permit history", target: "c1-permits" },
    { label: "Alerts", target: "c1-alerts" },
    { label: "History", target: "c1-history" },
  ],
  cluster_2: [
    { label: "Market velocity", target: "c2-velocity" },
    { label: "CMA builder", target: "c2-cma" },
    { label: "Narrative", target: "c2-narrative" },
    { label: "Pricing", target: "c2-pricing" },
    { label: "History", target: "c2-history" },
  ],
  cluster_4: [
    { label: "Site comparison", target: "c4-sites" },
    { label: "Entitlement risk", target: "c4-entitlement" },
    { label: "Pro forma", target: "c4-proforma" },
    { label: "History", target: "c4-history" },
  ],
  cluster_5: [
    { label: "Portfolio overview", target: "c5-portfolio" },
    { label: "Monday briefing", target: "c5-briefing" },
    { label: "Risk monitor", target: "c5-risk" },
    { label: "History", target: "c5-history" },
  ],
};
