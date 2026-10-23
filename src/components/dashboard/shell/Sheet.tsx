"use client";

// Sheet — the shell's one modal surface (UI sprint WS3): a bottom sheet on
// phones, a right-anchored panel from 768px. Focus moves in on open, Tab
// cycles inside, Escape and the backdrop close it, and focus returns to the
// control that opened it.

import React, { useEffect, useRef } from "react";
import { CloseIcon } from "./icons";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

interface SheetProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  id?: string;
}

export default function Sheet({ open, title, onClose, children, id }: SheetProps) {
  const ref = useRef<HTMLDivElement>(null);
  const opener = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    opener.current = document.activeElement as HTMLElement | null;
    const sheet = ref.current;
    // Focus the first control in the content, not the close button.
    const all = sheet ? Array.from(sheet.querySelectorAll<HTMLElement>(FOCUSABLE)) : [];
    (all.find((el) => !el.classList.contains("shell-sheet-close")) ?? all[0])?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !sheet) return;
      const items = Array.from(sheet.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
      if (items.length === 0) return;
      const i = items.indexOf(document.activeElement as HTMLElement);
      e.preventDefault();
      const next = i === -1 ? 0 : (i + (e.shiftKey ? -1 : 1) + items.length) % items.length;
      items[next].focus();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      opener.current?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <>
      <div className="shell-sheet-backdrop" onClick={onClose} aria-hidden="true" />
      <div ref={ref} id={id} className="shell-sheet" role="dialog" aria-modal="true" aria-label={title}>
        <div className="shell-sheet-head">
          <h2 className="shell-sheet-title">{title}</h2>
          <button type="button" className="shell-sheet-close" onClick={onClose} aria-label="Close">
            <CloseIcon size={18} />
          </button>
        </div>
        {children}
      </div>
    </>
  );
}
