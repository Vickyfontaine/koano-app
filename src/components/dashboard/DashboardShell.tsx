"use client";

// Dashboard shell (UI sprint WS3). One grid for every lens: a top bar (logo,
// search slot, plan tag, account), the lens navigation (full sidebar at 1280
// and up, a 64px icon rail from 768, a bottom tab bar below 768), and one
// content column at --content-max. The active lens comes from the user's
// profile; switching the lens flips the VIEW on the fly for demos and
// multi-hat users without changing the saved plan.

import React, { useCallback, useEffect, useState } from "react";
import "./shell/shell.css";
import Sidebar from "./Sidebar";
import TopBar from "./shell/TopBar";
import BottomTabs, { type ShellTab } from "./shell/BottomTabs";
import Sheet from "./shell/Sheet";
import WatchSheet from "./shell/WatchSheet";
import SubjectProvider from "./shell/SubjectProvider";
import VerdictBand from "./shell/VerdictBand";
import EvidenceDrawer from "./shell/EvidenceDrawer";
import GlobalSearch from "./shell/GlobalSearch";
import ClusterPlaceholderView from "./ClusterPlaceholderView";
import Cluster1Dashboard from "./cluster1/Cluster1Dashboard";
import Cluster2Dashboard from "./cluster2/Cluster2Dashboard";
import Cluster4Dashboard from "./cluster4/Cluster4Dashboard";
import Cluster5Dashboard from "./cluster5/Cluster5Dashboard";
import UpgradeProvider from "./UpgradeProvider";
import { CLUSTERS, LENS_ORDER, type ClusterId } from "./clusters";

export interface NavTarget {
  id: string;
  ts: number; // repeat clicks on the same item still navigate
}

// Shell-level targets resolve to whichever section the active lens exposes.
const SHELL_TARGETS: Record<string, string[]> = {
  documents: ["c1-documents", "c2-documents", "c4-comparison-brief", "c5-documents"],
  history: ["c1-history", "c2-history", "c4-history", "c5-history"],
};

function scrollToFirst(ids: string[]) {
  for (const id of ids) {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      return true;
    }
  }
  return false;
}

export default function DashboardShell({
  initialCluster,
  plan = null,
  justUpgraded = false,
}: {
  initialCluster: ClusterId;
  plan?: string | null;
  justUpgraded?: boolean;
}) {
  const [cluster, setCluster] = useState<ClusterId>(initialCluster);
  const [navTarget, setNavTarget] = useState<NavTarget | null>(null);
  const [activeTarget, setActiveTarget] = useState<string | null>(null);
  const [tab, setTab] = useState<ShellTab>("home");
  const [lensOpen, setLensOpen] = useState(false);
  const [watchOpen, setWatchOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const changeCluster = useCallback((c: ClusterId) => {
    setCluster(c);
    setNavTarget(null);
    setActiveTarget(null);
    setLensOpen(false);
    window.scrollTo({ top: 0 });
  }, []);

  // Scroll navigation for the section links. Cluster 4 handles its own targets.
  useEffect(() => {
    if (!navTarget) return;
    const shellIds = SHELL_TARGETS[navTarget.id];
    if (shellIds) {
      scrollToFirst(shellIds);
      return;
    }
    if (cluster === "cluster_4") return;
    document.getElementById(navTarget.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [navTarget, cluster]);

  const navigate = useCallback((id: string) => {
    setActiveTarget(id);
    setNavTarget({ id, ts: Date.now() });
  }, []);

  const selectTab = useCallback(
    (t: ShellTab) => {
      setTab(t);
      if (t === "home") {
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else if (t === "search") {
        setSearchOpen(true);
      } else if (t === "watch") {
        setWatchOpen(true);
      } else if (t === "documents") {
        scrollToFirst(SHELL_TARGETS.documents);
      }
    },
    [],
  );

  const closeWatch = useCallback(() => {
    setWatchOpen(false);
    setTab("home");
  }, []);
  const closeLens = useCallback(() => setLensOpen(false), []);
  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setTab("home");
  }, []);

  return (
    // UpgradeProvider wraps every lens so useUpgrade() resolves to the real
    // context (a 402 opens the upgrade modal) and the post-checkout
    // "confirming your upgrade" overlay mounts when justUpgraded is set.
    <UpgradeProvider justUpgraded={justUpgraded}>
      <SubjectProvider>
      <div className="koano-shell">
        <TopBar cluster={cluster} plan={plan} onOpenLens={() => setLensOpen(true)} search={<GlobalSearch variant="bar" />} />

        <Sidebar
          key={cluster}
          cluster={cluster}
          homeCluster={initialCluster}
          activeTarget={activeTarget}
          onClusterChange={changeCluster}
          onNavigate={navigate}
          onOpenWatch={() => setWatchOpen(true)}
        />

        <main className="shell-main" id="shell-main">
          <div className="shell-content">
            <VerdictBand />
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
          </div>
        </main>

        <BottomTabs active={tab} onSelect={selectTab} />

        {/* Phone lens picker */}
        <Sheet open={lensOpen} title="Lens" onClose={closeLens} id="shell-lens-sheet">
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
            {LENS_ORDER.map((id) => (
              <button
                key={id}
                type="button"
                className="shell-item"
                data-lens={id}
                aria-current={id === cluster ? "true" : undefined}
                onClick={() => changeCluster(id)}
                style={{ minHeight: "48px" }}
              >
                <span className="shell-item-label">
                  {CLUSTERS[id].lens}
                  <span style={{ color: "var(--ink-muted)", fontWeight: 400 }}> · {CLUSTERS[id].label}</span>
                </span>
                {id === initialCluster && <span className="shell-item-note">plan</span>}
              </button>
            ))}
          </div>
        </Sheet>

        <WatchSheet
          open={watchOpen}
          onClose={closeWatch}
          onGoToPortfolio={() => {
            closeWatch();
            changeCluster("cluster_5");
          }}
        />
        {/* Phone search sheet */}
        <Sheet open={searchOpen} title="Search" onClose={closeSearch} id="shell-search-sheet">
          <GlobalSearch variant="sheet" autoFocus onDone={closeSearch} />
        </Sheet>

        <EvidenceDrawer />
      </div>
      </SubjectProvider>
    </UpgradeProvider>
  );
}
