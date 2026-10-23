"use client";

// SimpleTopBar (UI sprint WS3): the shell's top bar for standalone routes
// under /dashboard (settings) that are not a lens: the logo, a way back, and
// the account button, so the page is never a bare form.

import React from "react";
import { UserButton } from "@clerk/nextjs";
import "./shell.css";

export default function SimpleTopBar({ backLabel = "Back to dashboard", backHref = "/dashboard" }: { backLabel?: string; backHref?: string }) {
  return (
    <header className="shell-topbar">
      <a href="/" className="shell-topbar-logo" aria-label="KOANO home">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="KOANO" width={40} height={40} />
      </a>
      <a href={backHref} className="shell-item" style={{ width: "auto" }}>
        {backLabel}
      </a>
      <div className="shell-topbar-right">
        <span className="shell-account">
          <UserButton appearance={{ elements: { avatarBox: { width: "36px", height: "36px" } } }} />
        </span>
      </div>
    </header>
  );
}
