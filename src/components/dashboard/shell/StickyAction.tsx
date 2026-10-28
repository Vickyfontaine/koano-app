"use client";

// StickyAction (UI sprint WS4): the one action a lens keeps within reach on a
// phone (Documents, Generate briefing). Sticky above the bottom tabs; hidden
// from 768px where the sidebar carries it. Scrolls to a section or runs a
// handler; never a second copy of the data. It steps aside (fades out, not
// focusable) while a map opened on a phone lies under it, so it never covers
// the map's bottom edge or its controls.

import React, { useEffect, useRef, useState } from "react";

function overlapsOpenMap(el: HTMLElement): boolean {
  const r = el.getBoundingClientRect();
  return Array.from(document.querySelectorAll<HTMLElement>('.map-frame[data-map-open="true"]')).some((m) => {
    const mr = m.getBoundingClientRect();
    return mr.bottom > r.top && mr.top < r.bottom;
  });
}

interface StickyActionProps {
  label: string;
  targetId?: string;
  onClick?: () => void;
  hint?: string;
}

export default function StickyAction({ label, targetId, onClick, hint }: StickyActionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [away, setAway] = useState(false);

  useEffect(() => {
    let frame = 0;
    const check = () => {
      frame = 0;
      if (ref.current) setAway(overlapsOpenMap(ref.current));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(check);
    };
    // A map opening or closing changes the layout without a scroll.
    const mo = new MutationObserver(schedule);
    mo.observe(document.body, { subtree: true, attributes: true, attributeFilter: ["data-map-open"], childList: true });
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    schedule();
    return () => {
      if (frame) cancelAnimationFrame(frame);
      mo.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, []);

  return (
    <div ref={ref} className={away ? "sticky-action sticky-action-away" : "sticky-action"} aria-hidden={away || undefined}>
      <button
        type="button"
        tabIndex={away ? -1 : undefined}
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
