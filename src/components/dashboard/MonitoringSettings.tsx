"use client";

// MonitoringSettings — Phase 2 Slice 6. Preferences + the watched-property list
// with active/paused status against the plan cap. Monitoring is a paid feature:
// free users see the surface DISABLED with an upgrade prompt (not hidden), so
// they learn the product can watch properties for them. Downgrades are
// non-destructive — over-cap properties show as paused, never unwatched.

import React, { useCallback, useEffect, useState } from "react";
import { panelStyle, PanelHeader } from "./panels";

interface PropRow { id: string; address: string; bbl: string | null; monitoring_enabled: boolean; active: boolean }
interface Prefs { email_enabled: boolean; inapp_enabled: boolean; frequency: string; muted_signal_types: string[]; min_severity: string }
interface State { plan: string; cap: number; active_count: number; watched_count: number; preferences: Prefs; properties: PropRow[] }

const SIGNAL_LABELS: Record<string, string> = {
  violation_new: "New violations", violation_resolved: "Resolved violations", ownership_change: "Ownership changes",
  permit: "New permits", contamination: "Contamination", disaster: "Disaster declarations", comp_price: "Comp price moves",
};
const SEVERITIES: [string, string][] = [["info", "Everything"], ["material", "Material & above"], ["high", "High only"]];

export default function MonitoringSettings({ id }: { id?: string }) {
  const [s, setS] = useState<State | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const r = await fetch("/api/monitoring");
    if (r.ok) setS(await r.json());
  }, []);
  useEffect(() => { void load(); }, [load]);

  const savePrefs = async (patch: Partial<Prefs>) => {
    if (!s) return;
    setS({ ...s, preferences: { ...s.preferences, ...patch } });
    setSaving(true);
    await fetch("/api/monitoring", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patch) });
    setSaving(false);
  };
  const toggleWatch = async (property_id: string, monitoring_enabled: boolean) => {
    await fetch("/api/monitoring", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ property_id, monitoring_enabled }) });
    await load();
  };

  if (!s) return <div style={panelStyle} id={id}><PanelHeader title="Monitoring" /><p style={{ fontSize: 13, color: "var(--ink-muted)" }}>Loading…</p></div>;

  const isFree = s.cap <= 0;
  const p = s.preferences;
  const muted = new Set(p.muted_signal_types);

  return (
    <div style={panelStyle} id={id}>
      <PanelHeader title="Monitoring" />

      {isFree ? (
        <div style={{ background: "var(--pale-wash)", border: "1px solid var(--border)", borderRadius: 12, padding: 20 }}>
          <p style={{ fontSize: 15, fontWeight: 500, color: "var(--ink-primary)", margin: "0 0 6px" }}>
            Monitoring watches your properties and tells you when something material changes.
          </p>
          <p style={{ fontSize: 13, color: "var(--ink-secondary)", lineHeight: 1.6, margin: "0 0 16px" }}>
            A new violation, an ownership change, a Superfund site nearby, comp price movement — diffed weekly against the archived
            record and pushed to your notifications and a weekly digest. Available on any paid plan.
          </p>
          <a href="/pricing" style={{ display: "inline-block", background: "var(--brand-blue)", color: "var(--near-black)", borderRadius: 100, padding: "10px 22px", fontSize: 14, fontWeight: 500, textDecoration: "none" }}>
            Upgrade to enable monitoring →
          </a>
        </div>
      ) : (
        <p style={{ fontSize: 13, color: "var(--ink-muted)", margin: 0 }}>
          {s.active_count} of {s.watched_count} watched {s.watched_count === 1 ? "property" : "properties"} actively monitored ·{" "}
          {s.plan} plan (up to {s.cap}){saving ? " · saving…" : ""}
        </p>
      )}

      {/* Preferences — disabled for free */}
      <fieldset disabled={isFree} style={{ border: "none", padding: 0, margin: "16px 0 0", opacity: isFree ? 0.5 : 1 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <label style={rowStyle}><span>Email digest (weekly)</span>
            <input type="checkbox" checked={p.email_enabled} onChange={(e) => savePrefs({ email_enabled: e.target.checked })} /></label>
          <label style={rowStyle}><span>In-app notifications</span>
            <input type="checkbox" checked={p.inapp_enabled} onChange={(e) => savePrefs({ inapp_enabled: e.target.checked })} /></label>
          <label style={rowStyle}><span>Notify me about</span>
            <select value={p.min_severity} onChange={(e) => savePrefs({ min_severity: e.target.value })} style={selectStyle}>
              {SEVERITIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select></label>
          <div>
            <span style={{ fontSize: 13, color: "var(--ink-secondary)" }}>Mute signal types</span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 8 }}>
              {Object.entries(SIGNAL_LABELS).map(([v, l]) => {
                const on = !muted.has(v);
                return (
                  <button key={v} type="button" onClick={() => {
                    const next = on ? [...p.muted_signal_types, v] : p.muted_signal_types.filter((x) => x !== v);
                    savePrefs({ muted_signal_types: next });
                  }} style={{ border: "1px solid var(--border)", background: on ? "var(--sky)" : "transparent", color: on ? "var(--deep-navy)" : "var(--ink-faint)", borderRadius: 100, padding: "4px 12px", fontSize: 12, cursor: "pointer" }}>
                    {l}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </fieldset>

      {/* Watched properties */}
      {s.properties.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <span style={{ fontSize: 11, color: "var(--ink-faint)", letterSpacing: "0.08em", textTransform: "uppercase" }}>Watched properties</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
            {s.properties.map((pr) => {
              const paused = pr.monitoring_enabled && !pr.active;
              return (
                <div key={pr.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, borderBottom: "1px solid var(--border-light)", paddingBottom: 8 }}>
                  <span style={{ fontSize: 13, color: "var(--ink-secondary)" }}>{pr.address}</span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                    {pr.active && <span style={badge("var(--signal-positive)")}>Active</span>}
                    {paused && <span style={badge("var(--signal-warning)")}>Paused — over {s.plan} limit</span>}
                    {!pr.monitoring_enabled && <span style={badge("var(--ink-faint)")}>Not watched</span>}
                    {!isFree && (
                      <button type="button" onClick={() => void toggleWatch(pr.id, !pr.monitoring_enabled)} style={{ border: "1px solid var(--border)", background: "transparent", borderRadius: 100, padding: "3px 12px", fontSize: 12, color: "var(--ink-muted)", cursor: "pointer" }}>
                        {pr.monitoring_enabled ? "Unwatch" : "Watch"}
                      </button>
                    )}
                  </span>
                </div>
              );
            })}
          </div>
          {s.watched_count > s.cap && !isFree && (
            <p style={{ fontSize: 11, color: "var(--ink-faint)", marginTop: 10 }}>
              You watch more than your plan monitors. The oldest {s.cap} stay active; unwatch one to activate another, or upgrade to monitor all.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

const rowStyle: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13, color: "var(--ink-secondary)" };
const selectStyle: React.CSSProperties = { border: "1px solid var(--border)", borderRadius: 8, padding: "4px 8px", fontSize: 13, fontFamily: "inherit" };
function badge(color: string): React.CSSProperties {
  return { fontSize: 10, fontWeight: 500, color, border: `1px solid ${color}`, borderRadius: 100, padding: "2px 8px", whiteSpace: "nowrap" };
}
