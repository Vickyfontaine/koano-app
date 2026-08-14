"use client";

// Profile settings — populates the migration-005 letterhead fields that
// white-label generated documents. Text fields via PATCH /api/profile; logo /
// headshot via POST/DELETE /api/profile/asset (server-proxied uploads). Every
// field is optional and empty-safe: a blank field clears to null and the
// document letterhead simply omits that line.

import React, { useEffect, useRef, useState } from "react";

interface ProfileFields {
  full_name: string;
  company_name: string;
  license_number: string;
  phone: string;
  contact_email: string;
}
type FieldKey = keyof ProfileFields;

const EMPTY: ProfileFields = {
  full_name: "",
  company_name: "",
  license_number: "",
  phone: "",
  contact_email: "",
};

const LABELS: Record<FieldKey, string> = {
  full_name: "Full name",
  company_name: "Company",
  license_number: "License number",
  phone: "Phone",
  contact_email: "Contact email",
};

const MAX_LEN: Record<FieldKey, number> = {
  full_name: 120,
  company_name: 120,
  license_number: 60,
  phone: 40,
  contact_email: 160,
};

// Client validation mirrors the server (route rejects too — this is UX, not the gate).
function fieldError(key: FieldKey, v: string): string | null {
  const t = v.trim();
  if (t === "") return null; // empty is allowed
  if (t.length > MAX_LEN[key]) return `Must be ${MAX_LEN[key]} characters or fewer`;
  if (key === "contact_email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return "Enter a valid email address";
  if (key === "phone" && !/^[0-9+()\-.\s]+$/.test(t)) return "Only digits and + ( ) - . and spaces";
  return null;
}

const cardStyle: React.CSSProperties = {
  border: "1px solid var(--border)",
  borderRadius: "16px",
  padding: "24px",
  background: "var(--white)",
  display: "flex",
  flexDirection: "column",
  gap: "18px",
};

function AssetUpload({
  kind,
  label,
  url,
  onChange,
}: {
  kind: "logo" | "headshot";
  label: string;
  url: string | null;
  onChange: (url: string | null) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("kind", kind);
      fd.append("file", file);
      const res = await fetch("/api/profile/asset", { method: "POST", body: fd });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Upload failed (${res.status})`);
      onChange(json.url as string);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function remove() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/profile/asset", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Remove failed (${res.status})`);
      onChange(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Remove failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
      <div
        style={{
          width: "72px",
          height: "72px",
          borderRadius: "12px",
          border: "1px solid var(--border)",
          background: "var(--pale-wash)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          flexShrink: 0,
        }}
      >
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={label} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
        ) : (
          <span style={{ fontSize: "10px", color: "var(--ink-faint)" }}>None</span>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--ink-primary)" }}>{label}</span>
        <span style={{ fontSize: "11px", color: "var(--ink-muted)" }}>PNG, JPEG, or WebP · up to 2 MB</span>
        <div style={{ display: "flex", gap: "8px", marginTop: "2px" }}>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            disabled={busy}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void upload(f);
            }}
            style={{ fontSize: "12px", color: "var(--ink-secondary)" }}
          />
          {url && (
            <button
              type="button"
              onClick={() => void remove()}
              disabled={busy}
              style={{
                border: "1px solid var(--border)",
                background: "transparent",
                color: "var(--ink-muted)",
                borderRadius: "100px",
                padding: "2px 12px",
                fontSize: "12px",
                cursor: busy ? "default" : "pointer",
              }}
            >
              Remove
            </button>
          )}
        </div>
        {error && <span style={{ fontSize: "12px", color: "var(--signal-negative)" }}>{error}</span>}
      </div>
    </div>
  );
}

export default function ProfileSettingsForm() {
  const [fields, setFields] = useState<ProfileFields>(EMPTY);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [headshotUrl, setHeadshotUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/profile");
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || `Load failed (${res.status})`);
        const p = json.profile ?? {};
        setFields({
          full_name: p.full_name ?? "",
          company_name: p.company_name ?? "",
          license_number: p.license_number ?? "",
          phone: p.phone ?? "",
          contact_email: p.contact_email ?? "",
        });
        setLogoUrl(p.logo_url ?? null);
        setHeadshotUrl(p.headshot_url ?? null);
      } catch (e) {
        setLoadError(e instanceof Error ? e.message : "Failed to load profile");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const errors: Partial<Record<FieldKey, string>> = {};
  (Object.keys(fields) as FieldKey[]).forEach((k) => {
    const err = fieldError(k, fields[k]);
    if (err) errors[k] = err;
  });
  const hasErrors = Object.keys(errors).length > 0;

  async function save() {
    if (hasErrors) return;
    setSaving(true);
    setSaveMsg(null);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || `Save failed (${res.status})`);
      setSaveMsg({ ok: true, text: "Saved. These details fill your document letterheads." });
    } catch (e) {
      setSaveMsg({ ok: false, text: e instanceof Error ? e.message : "Save failed" });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <p style={{ color: "var(--ink-muted)", fontSize: "14px" }}>Loading your profile…</p>;
  }
  if (loadError) {
    return <p style={{ color: "var(--signal-negative)", fontSize: "14px" }}>{loadError}</p>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px", maxWidth: "640px" }}>
      <div style={cardStyle}>
        <div>
          <h2 style={{ fontSize: "18px", fontWeight: 500, color: "var(--ink-primary)", margin: "0 0 4px" }}>
            Preparer details
          </h2>
          <p style={{ fontSize: "13px", color: "var(--ink-muted)", margin: 0 }}>
            These populate the letterhead and signature block of documents you generate. All optional —
            leave anything blank and it is simply omitted.
          </p>
        </div>

        {(Object.keys(fields) as FieldKey[]).map((key) => (
          <label key={key} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <span style={{ fontSize: "13px", fontWeight: 500, color: "var(--ink-secondary)" }}>{LABELS[key]}</span>
            <input
              type={key === "contact_email" ? "email" : "text"}
              value={fields[key]}
              maxLength={MAX_LEN[key] + 20}
              onChange={(e) => setFields((f) => ({ ...f, [key]: e.target.value }))}
              style={{
                padding: "10px 12px",
                borderRadius: "10px",
                border: `1px solid ${errors[key] ? "var(--signal-negative)" : "var(--border)"}`,
                fontSize: "14px",
                fontFamily: "inherit",
                color: "var(--ink-primary)",
                background: "var(--white)",
              }}
            />
            {errors[key] && (
              <span style={{ fontSize: "12px", color: "var(--signal-negative)" }}>{errors[key]}</span>
            )}
          </label>
        ))}
      </div>

      <div style={cardStyle}>
        <div>
          <h2 style={{ fontSize: "18px", fontWeight: 500, color: "var(--ink-primary)", margin: "0 0 4px" }}>
            Branding
          </h2>
          <p style={{ fontSize: "13px", color: "var(--ink-muted)", margin: 0 }}>
            Logo and headshot for white-labeled documents. Stored privately to your profile.
          </p>
        </div>
        <AssetUpload kind="logo" label="Logo" url={logoUrl} onChange={setLogoUrl} />
        <AssetUpload kind="headshot" label="Headshot" url={headshotUrl} onChange={setHeadshotUrl} />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving || hasErrors}
          style={{
            border: "none",
            borderRadius: "100px",
            padding: "10px 24px",
            fontSize: "14px",
            fontWeight: 500,
            cursor: saving || hasErrors ? "default" : "pointer",
            background: saving || hasErrors ? "var(--sky)" : "var(--brand-blue)",
            color: "var(--near-black)",
            opacity: hasErrors ? 0.6 : 1,
          }}
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
        {saveMsg && (
          <span style={{ fontSize: "13px", color: saveMsg.ok ? "var(--signal-positive)" : "var(--signal-negative)" }}>
            {saveMsg.text}
          </span>
        )}
      </div>
    </div>
  );
}
