"use client";

// Sidebar (UI sprint WS3). Plain lens names, the lens's section links, then
// Watchlist, Documents, History and Settings. The same markup renders as the
// 240px sidebar at 1280 and up and as the 64px icon rail below it (shell.css
// hides the labels; every item keeps an aria-label and a title). Switching
// the lens changes the VIEW only, never the saved plan (the home lens carries
// a "your plan" note).

import React from "react";
import { CLUSTERS, CLUSTER_NAV, LENS_ORDER, type ClusterId } from "./clusters";
import {
  DevelopIcon,
  PriceIcon,
  AcquireIcon,
  PropertyIcon,
  WatchIcon,
  DocumentsIcon,
  HistoryIcon,
  SettingsIcon,
} from "./shell/icons";

const LENS_ICON: Record<ClusterId, (p: { size?: number }) => React.JSX.Element> = {
  cluster_4: DevelopIcon,
  cluster_5: AcquireIcon,
  cluster_2: PriceIcon,
  cluster_1: PropertyIcon,
};

interface SidebarProps {
  cluster: ClusterId;
  homeCluster: ClusterId;
  activeTarget: string | null;
  onClusterChange: (cluster: ClusterId) => void;
  onNavigate: (target: string) => void;
  onOpenWatch: () => void;
}

export default function Sidebar({
  cluster,
  homeCluster,
  activeTarget,
  onClusterChange,
  onNavigate,
  onOpenWatch,
}: SidebarProps) {
  const items = CLUSTER_NAV[cluster];
  return (
    <aside className="shell-side" aria-label="Lens and sections">
      <div className="shell-side-heading">Lens</div>
      {LENS_ORDER.map((id) => {
        const Icon = LENS_ICON[id];
        const meta = CLUSTERS[id];
        const active = id === cluster;
        return (
          <button
            key={id}
            type="button"
            className="shell-item"
            data-lens={id}
            aria-current={active ? "true" : undefined}
            aria-label={`${meta.lens} lens${id === homeCluster ? " (home lens)" : ""}`}
            title={`${meta.lens}: ${meta.label}`}
            onClick={() => onClusterChange(id)}
          >
            <Icon size={20} />
            <span className="shell-item-label">{meta.lens}</span>
            {id === homeCluster && <span className="shell-item-note">home</span>}
          </button>
        );
      })}

      <div className="shell-side-divider" />

      <div className="shell-side-sections">
        <div className="shell-side-heading">In this lens</div>
        {items.map((item) => (
          <button
            key={item.target}
            type="button"
            className="shell-item"
            aria-current={activeTarget === item.target ? "true" : undefined}
            onClick={() => onNavigate(item.target)}
          >
            <span className="shell-item-label">{item.label}</span>
          </button>
        ))}
      </div>

      <div className="shell-side-spacer" />
      <div className="shell-side-divider" />

      <button type="button" className="shell-item" onClick={onOpenWatch} aria-label="Watchlist" title="Watchlist">
        <WatchIcon size={20} />
        <span className="shell-item-label">Watchlist</span>
      </button>
      <button
        type="button"
        className="shell-item"
        onClick={() => onNavigate("documents")}
        aria-label="Documents"
        title="Documents"
      >
        <DocumentsIcon size={20} />
        <span className="shell-item-label">Documents</span>
      </button>
      <button
        type="button"
        className="shell-item"
        onClick={() => onNavigate("history")}
        aria-label="History"
        title="History"
      >
        <HistoryIcon size={20} />
        <span className="shell-item-label">History</span>
      </button>
      <a href="/dashboard/settings" className="shell-item" aria-label="Settings" title="Settings">
        <SettingsIcon size={20} />
        <span className="shell-item-label">Settings</span>
      </a>
    </aside>
  );
}
