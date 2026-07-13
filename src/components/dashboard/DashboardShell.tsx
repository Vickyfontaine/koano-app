"use client";

// Dashboard shell — Checkpoints 1–4 (Phase B).
// Holds the active cluster view and routes sidebar navigation to real
// sections. The initial cluster comes from the user's profile (server-side);
// the Sidebar switcher flips the VIEW on the fly for demos and multi-hat
// users without changing the saved profile cluster.

import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import ClusterPlaceholderView from "./ClusterPlaceholderView";
import Cluster1Dashboard from "./cluster1/Cluster1Dashboard";
import Cluster2Dashboard from "./cluster2/Cluster2Dashboard";
import Cluster4Dashboard from "./cluster4/Cluster4Dashboard";
import Cluster5Dashboard from "./cluster5/Cluster5Dashboard";
import type { ClusterId } from "./clusters";

export interface NavTarget {
  id: string;
  ts: number; // repeat clicks on the same item still navigate
}

export default function DashboardShell({
  initialCluster,
}: {
  initialCluster: ClusterId;
}) {
  const [cluster, setCluster] = useState<ClusterId>(initialCluster);
  const [navTarget, setNavTarget] = useState<NavTarget | null>(null);

  // Generic scroll navigation. Cluster 4 handles its own targets (tabs).
  useEffect(() => {
    if (!navTarget || cluster === "cluster_4") return;
    document.getElementById(navTarget.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [navTarget, cluster]);

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--white)" }}>
      <Sidebar
        key={cluster}
        cluster={cluster}
        homeCluster={initialCluster}
        onClusterChange={(c) => {
          setCluster(c);
          setNavTarget(null);
        }}
        onNavigate={(id) => setNavTarget({ id, ts: Date.now() })}
      />

      <main
        style={{
          marginLeft: "240px",
          flex: 1,
          padding: "32px 40px",
          maxWidth: "calc(100vw - 240px)",
        }}
      >
        {cluster === "cluster_1" ? (
          <Cluster1Dashboard />
        ) : cluster === "cluster_2" ? (
          <Cluster2Dashboard />
        ) : cluster === "cluster_4" ? (
          <Cluster4Dashboard navTarget={navTarget} />
        ) : cluster === "cluster_5" ? (
          <Cluster5Dashboard />
        ) : (
          <ClusterPlaceholderView cluster={cluster} />
        )}
      </main>
    </div>
  );
}
