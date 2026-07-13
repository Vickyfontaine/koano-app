"use client";

// Dashboard sidebar — Checkpoint 1 (Phase B).
// Includes the CLUSTER SWITCHER: any user can flip between all four cluster
// views on the fly (demos, multi-hat users). Switching the view does NOT
// change the saved profile cluster — the "home" badge marks that one.

import React, { useState } from "react";
import { UserButton } from "@clerk/nextjs";
import { CLUSTERS, CLUSTER_IDS, CLUSTER_NAV, type ClusterId } from "./clusters";

interface SidebarProps {
  cluster: ClusterId;
  homeCluster: ClusterId;
  onClusterChange: (cluster: ClusterId) => void;
  onNavigate: (target: string) => void;
}

export default function Sidebar({
  cluster,
  homeCluster,
  onClusterChange,
  onNavigate,
}: SidebarProps) {
  const items = CLUSTER_NAV[cluster];
  const [activeTarget, setActiveTarget] = useState<string | null>(null);

  return (
    <aside
      style={{
        width: "240px",
        minHeight: "100vh",
        background: "var(--pale-wash)",
        borderRight: "1px solid var(--border)",
        padding: "24px 0",
        display: "flex",
        flexDirection: "column",
        position: "fixed",
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 20,
      }}
    >
      {/* Logo */}
      <a
        href="/"
        style={{
          padding: "0 24px 24px",
          fontWeight: 500,
          fontSize: "15px",
          color: "var(--near-black)",
          letterSpacing: "2px",
          textDecoration: "none",
          display: "block",
        }}
      >
        KOANO
      </a>

      {/* Cluster switcher */}
      <div style={{ padding: "0 16px 8px" }}>
        <label
          htmlFor="cluster-switcher"
          style={{
            display: "block",
            fontFamily: "'DM Mono', monospace",
            fontSize: "10px",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "var(--ink-faint)",
            padding: "0 4px 6px",
          }}
        >
          Cluster view
        </label>
        <select
          id="cluster-switcher"
          value={cluster}
          onChange={(e) => onClusterChange(e.target.value as ClusterId)}
          style={{
            width: "100%",
            padding: "10px 12px",
            borderRadius: "12px",
            border: "1px solid var(--border)",
            background: "var(--white)",
            fontFamily: "inherit",
            fontSize: "13px",
            fontWeight: 500,
            color: "var(--ink-primary)",
            cursor: "pointer",
          }}
        >
          {CLUSTER_IDS.map((id) => (
            <option key={id} value={id}>
              {CLUSTERS[id].badge} — {CLUSTERS[id].label}
              {id === homeCluster ? " (home)" : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Home-cluster note when viewing another cluster */}
      {cluster !== homeCluster && (
        <p
          style={{
            padding: "0 20px 8px",
            margin: 0,
            fontSize: "11px",
            color: "var(--ink-faint)",
            lineHeight: 1.5,
          }}
        >
          Viewing {CLUSTERS[cluster].badge} — your home cluster is {CLUSTERS[homeCluster].badge}
        </p>
      )}

      {/* Nav items — each targets a real section in the active cluster view */}
      <nav style={{ flex: 1, padding: "16px 12px 0" }}>
        {items.map((item) => {
          const active = activeTarget === item.target;
          return (
            <button
              key={item.target}
              onClick={() => {
                setActiveTarget(item.target);
                onNavigate(item.target);
              }}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "none",
                background: active ? "var(--white)" : "transparent",
                color: active ? "var(--ink-primary)" : "var(--ink-muted)",
                fontSize: "14px",
                fontWeight: active ? 500 : 400,
                fontFamily: "inherit",
                cursor: "pointer",
                marginBottom: "2px",
                boxShadow: active ? "0 1px 3px rgba(168,196,212,0.15)" : "none",
                transition: "background 0.15s ease",
              }}
            >
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Account */}
      <div
        style={{
          padding: "16px 24px",
          borderTop: "1px solid var(--border)",
          marginTop: "auto",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        <UserButton />
        <span
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: "10px",
            color: "var(--ink-faint)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          Account
        </span>
      </div>
    </aside>
  );
}
