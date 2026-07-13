"use client";

// AddressInput — takes an address and hands it to the caller (which runs the
// /api/agents pipeline). Live data is deepest for NYC (Section 07), so the
// placeholder is a real NYC address.

import React, { useState } from "react";

interface AddressInputProps {
  onSubmit: (address: string) => void;
  busy?: boolean;
}

export default function AddressInput({ onSubmit, busy = false }: AddressInputProps) {
  const [value, setValue] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const address = value.trim();
    if (!address || busy) return;
    onSubmit(address);
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}
    >
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="175 3rd Street, Brooklyn, NY"
        disabled={busy}
        aria-label="Property address"
        style={{
          flex: 1,
          minWidth: "280px",
          padding: "13px 18px",
          borderRadius: "100px",
          border: "1px solid var(--border)",
          background: "var(--white)",
          fontFamily: "inherit",
          fontSize: "15px",
          color: "var(--ink-primary)",
          outline: "none",
        }}
      />
      <button
        type="submit"
        className="btn-primary"
        disabled={busy || !value.trim()}
        style={{ opacity: busy || !value.trim() ? 0.55 : 1, cursor: busy ? "wait" : "pointer" }}
      >
        {busy ? "Running analysis…" : "Run analysis"}
        {!busy && <span aria-hidden="true">↗</span>}
      </button>
    </form>
  );
}
