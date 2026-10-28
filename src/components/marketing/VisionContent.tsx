"use client";

// /vision (UI sprint WS6): the only place a future feature appears. Every
// section is a CONCEPT PREVIEW on recorded sample data (the August 2026
// recorded run of 175 3rd Street and its ledger), drawn in HTML and CSS,
// labeled on the section, with no control that runs anything. Nothing here is
// in the product, and the page says so at the top and on every section.

import React from "react";
import SectionNumber from "../ui/SectionNumber";
import ProvenanceBadge from "../ui/ProvenanceBadge";
import { useReveal, fadeUp } from "./Reveal";
import { motion } from "framer-motion";
import { EXAMPLE_LEDGER, EXAMPLE_VERDICT, EXAMPLE_VERDICT_ADDRESS, EXAMPLE_VERDICT_LABEL } from "./exampleVerdict";
import { AGENT_LABELS, VERDICT_COLORS, type AgentName, type Verdict } from "../ui/verdict";

const CONCEPT = "Concept preview. Not in the product today.";
const SHORT: Record<string, string> = {
  "market-timing": "Market",
  infrastructure: "Pipeline",
  "demand-sentiment": "Demand",
  "risk-volatility": "Risk",
  "regulatory-policy": "Regulatory",
};

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: "var(--text-micro)",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: "var(--signal-warning-ink)",
        background: "var(--signal-warning-tint)",
        border: "1px solid var(--signal-warning)",
        borderRadius: "var(--radius-pill)",
        padding: "var(--space-1) var(--space-3)",
        display: "inline-block",
        margin: 0,
      }}
    >
      {children}
    </p>
  );
}

const card: React.CSSProperties = {
  background: "var(--white)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-card)",
  padding: "var(--space-5)",
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-4)",
};

// Radar: the five agents' confidence as spokes, the verdict word at each tip.
function Radar() {
  const agents = EXAMPLE_VERDICT.agent_summaries;
  const n = agents.length;
  const R = 110;
  const cx = 180;
  const cy = 165;
  const pts = agents.map((a, i) => {
    const ang = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    const r = (a.confidence / 100) * R;
    return { x: cx + r * Math.cos(ang), y: cy + r * Math.sin(ang), tx: cx + (R + 28) * Math.cos(ang), ty: cy + (R + 28) * Math.sin(ang), a };
  });
  const poly = pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  return (
    <svg viewBox="0 0 360 330" width="100%" style={{ maxWidth: "400px", display: "block", margin: "0 auto" }} role="img" aria-label="Radar of the five agents' confidence on the recorded run">
      {[0.25, 0.5, 0.75, 1].map((k) => (
        <circle key={k} cx={cx} cy={cy} r={R * k} fill="none" stroke="var(--border)" strokeWidth="1" />
      ))}
      {pts.map((p, i) => (
        <line key={i} x1={cx} y1={cy} x2={cx + R * Math.cos(-Math.PI / 2 + (i * 2 * Math.PI) / n)} y2={cy + R * Math.sin(-Math.PI / 2 + (i * 2 * Math.PI) / n)} stroke="var(--border-light)" strokeWidth="1" />
      ))}
      <polygon points={poly} fill="rgba(90,155,190,0.18)" stroke="var(--mid-blue)" strokeWidth="1.5" />
      {pts.map((p, i) => (
        <g key={`p-${i}`}>
          <circle cx={p.x} cy={p.y} r="4" fill={VERDICT_COLORS[p.a.verdict as Verdict]} />
          <text x={p.tx} y={p.ty} textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" fill="var(--ink-muted)">
            {SHORT[p.a.agent] ?? AGENT_LABELS[p.a.agent as AgentName]}
          </text>
          <text x={p.tx} y={p.ty + 13} textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" fontWeight="600" fill={VERDICT_COLORS[p.a.verdict as Verdict]}>
            {p.a.verdict.toUpperCase()} {p.a.confidence}
          </text>
        </g>
      ))}
    </svg>
  );
}

function OwnershipGraph() {
  // Counts only, from the recorded ledger: the lot, its registered owner, and
  // what the recorded run read about the portfolio.
  const nodes = [
    { x: 180, y: 50, label: EXAMPLE_VERDICT_ADDRESS, kind: "lot" },
    { x: 180, y: 140, label: "Registered owner", kind: "owner" },
    { x: 50, y: 230, label: "Other buildings", kind: "note" },
    { x: 180, y: 230, label: "HPD violations", kind: "note" },
    { x: 310, y: 230, label: "Watch list", kind: "note" },
  ];
  return (
    <svg viewBox="0 0 360 280" width="100%" style={{ maxWidth: "440px", display: "block", margin: "0 auto" }} role="img" aria-label="Ownership graph concept">
      <line x1="180" y1="50" x2="180" y2="140" stroke="var(--ink-faint)" strokeWidth="1.5" />
      {[50, 180, 310].map((x) => (
        <line key={x} x1="180" y1="140" x2={x} y2="230" stroke="var(--ink-faint)" strokeWidth="1.5" strokeDasharray="4 4" />
      ))}
      {nodes.map((nd) => (
        <g key={nd.label}>
          <circle cx={nd.x} cy={nd.y} r={nd.kind === "lot" ? 14 : nd.kind === "owner" ? 11 : 8} fill={nd.kind === "lot" ? "var(--deep-navy)" : nd.kind === "owner" ? "var(--mid-blue)" : "var(--white)"} stroke={nd.kind === "note" ? "var(--ink-faint)" : "none"} strokeWidth="1.5" />
          <text x={nd.x} y={nd.y + (nd.kind === "note" ? 24 : -20)} textAnchor="middle" fontSize="11" fontFamily="var(--font-mono)" fill="var(--ink-muted)">
            {nd.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

export default function VisionContent() {
  const heroRef = React.useRef<HTMLElement>(null);
  const show = useReveal(heroRef);
  const stamp = `${EXAMPLE_VERDICT_LABEL}`;
  const ledgerFor = (agent: AgentName) => EXAMPLE_LEDGER.filter((d) => d.agent === agent);

  return (
    <>
      <section ref={heroRef} className="mk-section hero-plain" style={{ background: "var(--white)", padding: "var(--space-8) var(--space-6)" }}>
        <div style={{ maxWidth: "var(--content-reading)", margin: "0 auto", textAlign: "center" }}>
          <motion.div initial={false} animate={show ? "visible" : "hidden"} variants={fadeUp} custom={0}>
            <Label>{CONCEPT}</Label>
          </motion.div>
          <motion.h1
            initial={false}
            animate={show ? "visible" : "hidden"}
            variants={fadeUp}
            custom={1}
            style={{ fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 700, letterSpacing: "-0.02em", lineHeight: 1.1, color: "var(--ink-primary)", margin: "var(--space-5) 0 var(--space-4)" }}
          >
            Where the reasoning engine goes next.
          </motion.h1>
          <motion.p initial={false} animate={show ? "visible" : "hidden"} variants={fadeUp} custom={2} style={{ fontSize: "var(--text-lead)", lineHeight: 1.6, color: "var(--ink-secondary)", margin: "0 auto", maxWidth: "var(--content-prose)" }}>
            Four concepts, drawn on the recorded sample run so the shapes are real even where the feature is not. Each one says
            what it is: a preview, not a capability. The live product on the dashboard claims only what it does today.
          </motion.p>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", letterSpacing: "0.04em", color: "var(--ink-muted)", marginTop: "var(--space-4)" }}>
            {stamp}
          </p>
        </div>
      </section>

      <section className="mk-section" style={{ background: "var(--pale-wash)", padding: "var(--space-8) var(--space-6)" }}>
        <div style={{ maxWidth: "var(--content-marketing)", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "var(--space-5)" }}>
          {/* 1. Radar */}
          <div className="mk-card" style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-3)", flexWrap: "wrap" }}>
              <SectionNumber number="01" label="Radar" />
              <Label>Concept preview</Label>
            </div>
            <h2 style={{ fontSize: "var(--text-h2)", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--ink-primary)", margin: 0 }}>Five signals at a glance.</h2>
            <p style={{ fontSize: "var(--text-body)", lineHeight: 1.6, color: "var(--ink-secondary)", margin: 0 }}>
              The five agents&apos; confidence as spokes, each tip in its verdict ink. The figures are the recorded run&apos;s; the chart is
              the concept.
            </p>
            <Radar />
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--ink-muted)", margin: 0 }}>{stamp}</p>
          </div>

          {/* 2. Sentence to building */}
          <div className="mk-card" style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-3)", flexWrap: "wrap" }}>
              <SectionNumber number="02" label="Sentence to building" />
              <Label>Concept preview</Label>
            </div>
            <h2 style={{ fontSize: "var(--text-h2)", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--ink-primary)", margin: 0 }}>Say what you want. Get the lot.</h2>
            <p style={{ fontSize: "var(--text-body)", lineHeight: 1.6, color: "var(--ink-secondary)", margin: 0 }}>
              A sentence resolves to a parcel and its record. Below, the sentence is a concept and the resolved record is the recorded run&apos;s.
            </p>
            <div style={{ border: "1px solid var(--border-input)", borderRadius: "var(--radius-pill)", padding: "var(--space-3) var(--space-4)", fontSize: "var(--text-ui)", color: "var(--ink-muted)", background: "var(--pale-wash)" }} aria-hidden="true">
              &ldquo;A Gowanus lot with unused FAR and no flood exposure&rdquo;
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
              <span style={{ fontSize: "var(--text-ui)", fontWeight: 500, color: "var(--ink-primary)" }}>{EXAMPLE_VERDICT_ADDRESS}</span>
              {[...ledgerFor("regulatory-policy").slice(0, 2), ...ledgerFor("risk-volatility").slice(0, 1)].map((d) => (
                <div key={d.label} style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-3)", fontSize: "var(--text-data)", fontFamily: "var(--font-mono)" }}>
                  <span style={{ color: "var(--ink-muted)" }}>{d.label}</span>
                  <span style={{ color: "var(--ink-primary)", display: "inline-flex", gap: "var(--space-2)", alignItems: "center" }}>
                    {String(d.value)} <ProvenanceBadge provenance={d.provenance} labelOverride="Recorded" noteOverride="Recorded from the August 2026 example run." />
                  </span>
                </div>
              ))}
            </div>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--ink-muted)", margin: 0 }}>{stamp} The sentence search is not built.</p>
          </div>

          {/* 3. Ownership graph */}
          <div className="mk-card" style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-3)", flexWrap: "wrap" }}>
              <SectionNumber number="03" label="Ownership graph" />
              <Label>Concept preview</Label>
            </div>
            <h2 style={{ fontSize: "var(--text-h2)", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--ink-primary)", margin: 0 }}>Who owns what, as a graph.</h2>
            <p style={{ fontSize: "var(--text-body)", lineHeight: 1.6, color: "var(--ink-secondary)", margin: 0 }}>
              The registered owner, the other buildings under the same registration, and the violations and watch-list flags the record
              carries. Today KOANO reads these as a list (the Property lens); the graph is the concept. No counts are shown here because
              the recorded sample did not store them.
            </p>
            <OwnershipGraph />
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--ink-muted)", margin: 0 }}>{stamp}</p>
          </div>

          {/* 4. Track record */}
          <div className="mk-card" style={card}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-3)", flexWrap: "wrap" }}>
              <SectionNumber number="04" label="Track record" />
              <Label>Concept preview</Label>
            </div>
            <h2 style={{ fontSize: "var(--text-h2)", fontWeight: 700, letterSpacing: "-0.02em", color: "var(--ink-primary)", margin: 0 }}>Every verdict, scored against what happened.</h2>
            <p style={{ fontSize: "var(--text-body)", lineHeight: 1.6, color: "var(--ink-secondary)", margin: 0 }}>
              KOANO records only publicly observable outcomes (a sale, a violation resolved, an ownership change, a permit disposition)
              against each verdict&apos;s direction. The archive and the outcome scanner exist; the scorecard does not, and nothing is
              measured yet.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "var(--space-3)" }}>
              {[
                { label: "Verdicts on record", value: "n/a", note: "your history" },
                { label: "Outcomes observed", value: "0", note: "not yet measured" },
                { label: "Directional hit rate", value: "n/a", note: "not yet measured" },
              ].map((t) => (
                <div key={t.label} style={{ border: "1px solid var(--border-light)", borderRadius: "var(--radius-inner)", padding: "var(--space-3)", minWidth: 0 }}>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-muted)", hyphens: "auto", overflowWrap: "anywhere" }} lang="en">{t.label}</div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-data-l)", fontWeight: 500, color: "var(--ink-primary)", marginTop: "var(--space-1)" }}>{t.value}</div>
                  <div style={{ fontSize: "var(--text-caption)", color: "var(--ink-muted)" }}>{t.note}</div>
                </div>
              ))}
            </div>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-micro)", color: "var(--ink-muted)", margin: 0 }}>Concept preview. The scorecard is not built; the figures above are placeholders that say so.</p>
          </div>
        </div>
      </section>

      <section className="mk-section" style={{ background: "var(--white)", padding: "var(--space-8) var(--space-6)" }}>
        <div style={{ maxWidth: "var(--content-prose)", margin: "0 auto", textAlign: "center" }}>
          <p style={{ fontSize: "var(--text-lead)", lineHeight: 1.6, color: "var(--ink-secondary)", margin: "0 0 var(--space-5)" }}>
            What is live today: five agents, one verdict, every figure sourced, on New York City addresses.
          </p>
          <a href="/intelligence" className="btn-ghost">
            See how the live engine works
          </a>
        </div>
      </section>
    </>
  );
}
