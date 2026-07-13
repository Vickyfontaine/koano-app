"use client";

import React from "react";

const COLUMN_1 = [
  { label: "How it works", href: "/intelligence" },
  { label: "Pricing", href: "/pricing" },
  { label: "Community", href: "/community" },
  { label: "Data", href: "/data" },
];

// Ordered by positioning priority (CLAUDE.md Section 01):
// professional and institutional first, homeowners last.
const COLUMN_2 = [
  { label: "For developers", href: "/for/developers" },
  { label: "For agents", href: "/for/agents" },
  { label: "For institutions", href: "/for/institutions" },
  { label: "For homeowners", href: "/for/homeowners" },
];

export default function Footer() {
  return (
    <footer
      id="site-footer"
      style={{
        background: "var(--white)",
        borderTop: "1px solid var(--border)",
      }}
    >
      <div
        className="mx-auto flex flex-col md:flex-row items-start justify-between"
        style={{
          maxWidth: "1280px",
          padding: "48px 32px",
          gap: "48px",
        }}
      >
        {/* Left — logo and copyright */}
        <div className="flex flex-col" style={{ gap: "12px" }}>
          <a
            href="/"
            id="footer-logo"
            style={{
              fontWeight: 500,
              fontSize: "15px",
              color: "var(--near-black)",
              letterSpacing: "2px",
              textDecoration: "none",
            }}
          >
            KOANO
          </a>
          <span
            style={{
              fontSize: "13px",
              color: "var(--ink-faint)",
              fontWeight: 400,
            }}
          >
            © 2026 KOANO Inc. All rights reserved.
          </span>
        </div>

        {/* Right — link columns */}
        <div className="flex" style={{ gap: "80px" }}>
          {/* Column 1 */}
          <div className="flex flex-col" style={{ gap: "14px" }}>
            {COLUMN_1.map((link) => (
              <a
                key={link.href}
                href={link.href}
                id={`footer-link-${link.href.replace(/\//g, "-").slice(1)}`}
                style={{
                  fontSize: "14px",
                  color: "var(--ink-muted)",
                  textDecoration: "none",
                  fontWeight: 400,
                  transition: "color 0.2s ease",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "var(--brand-blue)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "var(--ink-muted)")
                }
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Column 2 */}
          <div className="flex flex-col" style={{ gap: "14px" }}>
            {COLUMN_2.map((link) => (
              <a
                key={link.href}
                href={link.href}
                id={`footer-link-${link.href.replace(/\//g, "-").slice(1)}`}
                style={{
                  fontSize: "14px",
                  color: "var(--ink-muted)",
                  textDecoration: "none",
                  fontWeight: 400,
                  transition: "color 0.2s ease",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "var(--brand-blue)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "var(--ink-muted)")
                }
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
