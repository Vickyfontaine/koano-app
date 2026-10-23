"use client";

// MapFrame (UI sprint WS4, A9/A3): the frame every dashboard map sits in. A
// sentence-case title with an optional one-line summary, and on phones a
// "Show map" toggle (collapsed by default, the summary says what the map
// holds) so a 440px canvas never leads a phone screen. From 768px the map is
// always open and the toggle is hidden.

import React, { useEffect, useState } from "react";
import { panelHeading } from "@/components/dashboard/panels";

interface MapFrameProps {
  title: string;
  summary?: string;
  children: React.ReactNode;
  id?: string;
}

function phoneQuery(): MediaQueryList | null {
  return typeof window !== "undefined" && typeof window.matchMedia === "function" ? window.matchMedia("(max-width: 767px)") : null;
}

export default function MapFrame({ title, summary, children, id }: MapFrameProps) {
  const [phone, setPhone] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const mq = phoneQuery();
    if (!mq) return;
    const apply = () => setPhone(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const show = !phone || open;
  return (
    <section id={id} className="map-frame" style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--space-3)" }}>
        <div style={{ minWidth: 0 }}>
          <h3 style={{ ...panelHeading, margin: 0 }}>{title}</h3>
          {summary && (
            <p style={{ fontSize: "var(--text-data)", color: "var(--ink-muted)", lineHeight: 1.5, margin: "2px 0 0" }}>{summary}</p>
          )}
        </div>
        {phone && (
          <button
            type="button"
            className="btn-ghost"
            style={{ padding: "var(--space-2) var(--space-4)", minHeight: "44px", flex: "none" }}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? "Hide map" : "Show map"}
          </button>
        )}
      </div>
      {show && children}
    </section>
  );
}
