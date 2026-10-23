"use client";

// StickyAction (UI sprint WS4): the one action a lens keeps within reach on a
// phone (Documents, Generate briefing). Sticky above the bottom tabs; hidden
// from 768px where the sidebar carries it. Scrolls to a section or runs a
// handler; never a second copy of the data.

import React from "react";

interface StickyActionProps {
  label: string;
  targetId?: string;
  onClick?: () => void;
  hint?: string;
}

export default function StickyAction({ label, targetId, onClick, hint }: StickyActionProps) {
  return (
    <div className="sticky-action">
      <button
        type="button"
        className="btn-primary"
        style={{ width: "100%", minHeight: "48px" }}
        onClick={() => {
          if (onClick) onClick();
          if (targetId) document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
      >
        {label}
        <span aria-hidden="true" className="btn-arrow">
          ↓
        </span>
      </button>
      {hint && <span className="sticky-action-hint">{hint}</span>}
    </div>
  );
}
