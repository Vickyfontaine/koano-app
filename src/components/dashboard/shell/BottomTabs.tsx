"use client";

// BottomTabs (UI sprint WS3): the phone navigation. Home, Search, Watch,
// Documents, 48px targets, safe-area padding. Hidden from 768px up (shell.css).

import React from "react";
import { HomeIcon, SearchIcon, WatchIcon, DocumentsIcon } from "./icons";

export type ShellTab = "home" | "search" | "watch" | "documents";

interface BottomTabsProps {
  active: ShellTab;
  onSelect: (tab: ShellTab) => void;
}

const TABS: { id: ShellTab; label: string; Icon: (p: { size?: number }) => React.JSX.Element }[] = [
  { id: "home", label: "Home", Icon: HomeIcon },
  { id: "search", label: "Search", Icon: SearchIcon },
  { id: "watch", label: "Watch", Icon: WatchIcon },
  { id: "documents", label: "Documents", Icon: DocumentsIcon },
];

export default function BottomTabs({ active, onSelect }: BottomTabsProps) {
  return (
    <nav className="shell-tabs" aria-label="Primary">
      {TABS.map(({ id, label, Icon }) => (
        <button
          key={id}
          type="button"
          className="shell-tab"
          aria-current={active === id ? "true" : undefined}
          onClick={() => onSelect(id)}
          data-tab={id}
        >
          <Icon size={22} />
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
