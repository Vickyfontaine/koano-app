"use client";

// TopBar (UI sprint WS3): the blue logo, the global-search slot, the plan tag
// and the account button. On phones the search slot gives way to the lens
// button (the lens sheet) because the rail and sidebar are gone.

import React from "react";
import { UserButton } from "@clerk/nextjs";
import { CLUSTERS, PLAN_LABELS, type ClusterId } from "../clusters";
import { ChevronIcon } from "./icons";

interface TopBarProps {
  cluster: ClusterId;
  plan: string | null;
  onOpenLens: () => void;
  search?: React.ReactNode;
}

export default function TopBar({ cluster, plan, onOpenLens, search }: TopBarProps) {
  const planLabel = plan ? (PLAN_LABELS[plan] ?? plan) : null;
  return (
    <header className="shell-topbar">
      <a href="/" className="shell-topbar-logo" aria-label="KOANO home">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="KOANO" width={40} height={40} />
      </a>

      <div className="shell-topbar-search">{search}</div>

      <button
        type="button"
        className="shell-lens-btn"
        onClick={onOpenLens}
        aria-haspopup="dialog"
        aria-label={`Lens: ${CLUSTERS[cluster].lens}. Change lens`}
      >
        {CLUSTERS[cluster].lens}
        <ChevronIcon size={16} />
      </button>

      <div className="shell-topbar-right">
        {planLabel && (
          <span className="shell-plan-tag" title="Your plan">
            Plan: {planLabel}
          </span>
        )}
        <UserButton />
      </div>
    </header>
  );
}
