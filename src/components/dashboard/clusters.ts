// Cluster identity + approved verbatim copy (CLAUDE.md Sections 08 & 13).
// This is the single client-side source of truth for cluster metadata.
// There is no Cluster 0 and no Cluster 3.

export type ClusterId = "cluster_1" | "cluster_2" | "cluster_4" | "cluster_5";

export const CLUSTER_IDS: ClusterId[] = [
  "cluster_1",
  "cluster_2",
  "cluster_4",
  "cluster_5",
];

export interface ClusterMeta {
  id: ClusterId;
  number: string; // section-number eyebrow, e.g. "01"
  badge: string; // short badge, e.g. "C1"
  label: string; // approved product name
  audience: string; // who it serves (Section 08)
  tagline: string; // approved verbatim card copy (Section 13)
  price: string; // approved price line (Section 13)
}

export const CLUSTERS: Record<ClusterId, ClusterMeta> = {
  cluster_1: {
    id: "cluster_1",
    number: "01",
    badge: "C1",
    label: "Property intelligence",
    audience: "Homeowners, renters, neighbors",
    tagline:
      "Know what's happening to your property's value before your neighbors do, and know what to do about it.",
    price: "From 19 / month",
  },
  cluster_2: {
    id: "cluster_2",
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
    number: "04",
    badge: "C4",
    label: "Development intelligence",
    audience: "Developers, CRE brokers, contractors",
    tagline:
      "Find your best site. Model your deal. Understand your entitlement risk. Before anyone else does.",
    price: "From 499 / month",
  },
  cluster_5: {
    id: "cluster_5",
    number: "05",
    badge: "C5",
    label: "Portfolio intelligence",
    audience: "Institutional investors, C-suite, REITs",
    tagline:
      "Monitor everything. Miss nothing. Make institutional decisions with intelligence infrastructure that was previously available only to the world's largest firms.",
    price: "From 1,499 / month",
  },
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
    { label: "System view", target: "c4-system" },
    { label: "History", target: "c4-history" },
  ],
  cluster_5: [
    { label: "Portfolio overview", target: "c5-portfolio" },
    { label: "Monday briefing", target: "c5-briefing" },
    { label: "Risk monitor", target: "c5-risk" },
    { label: "History", target: "c5-history" },
  ],
};
