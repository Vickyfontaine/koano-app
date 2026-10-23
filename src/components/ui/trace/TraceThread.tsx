"use client";

// TraceThread: the thread as a labeled list, top (the figure) to bottom (its
// sources), each segment's line styled by provenance: solid live, dotted
// partner, hatched representative, dashed fetch_failed, cut coverage_absent.

import React from "react";
import { PROVENANCE_META } from "../verdict";
import { useTrace } from "./TraceProvider";

export default function TraceThread() {
  const { on, thread, focus } = useTrace();
  if (!on) return null;
  return (
    <div className="trace-thread" aria-live="polite" aria-atomic="true">
      {thread.length === 0 ? (
        <p className="trace-hint">
          Trace is on. Hover or focus the verdict, a figure, a vote or a source row to follow its thread. Press T to leave.
        </p>
      ) : (
        <ol className="trace-list" aria-label={`Thread for ${focus}`}>
          {thread.map((s, i) => (
            <li key={`${s.id}-${i}`} className={`trace-seg trace-seg-${s.provenance ?? "none"}`}>
              <span className="trace-line" aria-hidden="true" />
              <span className="trace-seg-body">
                <span className="trace-seg-label">{s.label}</span>
                {s.op && <span className="trace-seg-op">{s.op}</span>}
                {s.provenance && s.provenance !== "live" && (
                  <span className="trace-seg-prov" style={{ color: PROVENANCE_META[s.provenance].color }}>
                    {PROVENANCE_META[s.provenance].label}: {PROVENANCE_META[s.provenance].note}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
