// /v/[id]: the sealed record of one verdict (UI sprint WS5). Read-only and
// shareable: the owner sees it signed in; anyone with the signed link sees it
// without an account. It shows exactly what the append-only verdicts table
// stores (verdict, figures, headline, agent summaries, reasoning chain,
// minority signals, the persisted math when migration-023 is applied) and
// says what is not stored. It never re-runs anything.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { supabaseAdmin } from "../../../../lib/supabase/server";
import { verifyShareToken } from "../../../../lib/share";
import type { WeightingBreakdown, AgentSummary } from "../../../../lib/agents/breakdown";
import SealedVerdict from "@/components/ui/SealedVerdict";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "KOANO verdict record",
  description: "A sealed KOANO verdict record.",
  robots: { index: false, follow: false },
};

interface Row {
  id: string;
  clerk_user_id: string;
  address_input: string;
  address_normalized: string | null;
  bbl: string | null;
  verdict: string;
  confidence: number;
  risk_score: number;
  signal_window_months: number;
  headline: string;
  overall_provenance: string;
  reasoning_chain: unknown;
  minority_signals: unknown;
  agent_summaries: AgentSummary[];
  created_at: string;
  weighting_breakdown?: WeightingBreakdown | null;
}

const BASE =
  "id, clerk_user_id, address_input, address_normalized, bbl, verdict, confidence, risk_score, signal_window_months, headline, overall_provenance, reasoning_chain, minority_signals, agent_summaries, created_at";

export default async function SealedVerdictPage({ params, searchParams }: { params: { id: string }; searchParams: { t?: string } }) {
  const id = params.id;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  let row: Row | null = null;
  const withMath = await supabaseAdmin().from("verdicts").select(`${BASE}, weighting_breakdown`).eq("id", id).maybeSingle();
  if (withMath.error && /weighting_breakdown/.test(withMath.error.message)) {
    const plain = await supabaseAdmin().from("verdicts").select(BASE).eq("id", id).maybeSingle();
    row = (plain.data as Row | null) ?? null;
  } else {
    row = (withMath.data as Row | null) ?? null;
  }
  if (!row) notFound();

  // The owner, or anyone holding the signed link.
  const { userId } = await auth();
  const owner = !!userId && userId === row.clerk_user_id;
  if (!owner && !verifyShareToken(id, searchParams.t)) notFound();

  const when = new Date(row.created_at);
  const recordedLabel = `${when.toLocaleDateString("en-US", { timeZone: "UTC", year: "numeric", month: "short", day: "numeric" })} ${when.toLocaleTimeString("en-US", { timeZone: "UTC", hour: "2-digit", minute: "2-digit" })} UTC`;
  return <SealedVerdict row={{ ...row, weighting_breakdown: row.weighting_breakdown ?? null }} owner={owner} recordedLabel={recordedLabel} />;
}
