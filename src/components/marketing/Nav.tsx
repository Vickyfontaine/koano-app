"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Button from "../ui/Button";

// Cluster links ordered by positioning priority (CLAUDE.md Section 01):
// professional and institutional first, homeowners last.
const NAV_LINKS = [
  { label: "How it works", href: "/intelligence" },
  { label: "For developers", href: "/for/developers" },
  { label: "For professionals", href: "/for/agents" },
  { label: "For institutions", href: "/for/institutions" },
  { label: "For communities", href: "/for/community" },
  { label: "Pricing", href: "/pricing" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 80);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      <nav
        id="main-nav"
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        style={{
          background: scrolled ? "rgba(255, 255, 255, 0.85)" : "var(--white)",
          backdropFilter: scrolled ? "blur(12px)" : "none",
          WebkitBackdropFilter: scrolled ? "blur(12px)" : "none",
          borderBottom: "1px solid var(--border-light)",
        }}
      >
        <div
          className="mx-auto flex items-center justify-between"
          style={{
            maxWidth: "1280px",
            padding: "0 32px",
            height: "64px",
          }}
        >
          {/* Logo */}
          <a
            href="/"
            id="nav-logo"
            className="flex items-center"
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

          {/* Center links — desktop */}
          <div
            className="hidden md:flex items-center"
            style={{ gap: "32px" }}
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                id={`nav-link-${link.href.replace(/\//g, "-").slice(1)}`}
                style={{
                  fontSize: "13px",
                  color: "var(--ink-muted)",
                  textDecoration: "none",
                  fontWeight: 400,
                  transition: "color 0.2s ease",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.color = "var(--ink-primary)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = "var(--ink-muted)")
                }
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Right — desktop CTAs */}
          <div
            className="hidden md:flex items-center"
            style={{ gap: "12px" }}
          >
            <Button variant="ghost" href="/login" id="nav-sign-in">
              Sign in
            </Button>
            <Button variant="primary" href="/early-access" id="nav-early-access">
              Get early access
            </Button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden flex flex-col items-center justify-center"
            id="nav-mobile-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            style={{
              width: "40px",
              height: "40px",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              gap: "5px",
              padding: 0,
            }}
          >
            <span
              style={{
                display: "block",
                width: "20px",
                height: "1.5px",
                background: "var(--near-black)",
                transition: "all 0.3s ease",
                transform: mobileOpen
                  ? "rotate(45deg) translateY(3.25px)"
                  : "none",
              }}
            />
            <span
              style={{
                display: "block",
                width: "20px",
                height: "1.5px",
                background: "var(--near-black)",
                transition: "all 0.3s ease",
                opacity: mobileOpen ? 0 : 1,
              }}
            />
            <span
              style={{
                display: "block",
                width: "20px",
                height: "1.5px",
                background: "var(--near-black)",
                transition: "all 0.3s ease",
                transform: mobileOpen
                  ? "rotate(-45deg) translateY(-3.25px)"
                  : "none",
              }}
            />
          </button>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            id="nav-mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 md:hidden"
            style={{
              background: "var(--white)",
              paddingTop: "80px",
            }}
          >
            <div
              className="flex flex-col items-center"
              style={{ gap: "32px", paddingTop: "40px" }}
            >
              {NAV_LINKS.map((link, i) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: i * 0.08,
                    duration: 0.5,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  onClick={() => setMobileOpen(false)}
                  style={{
                    fontSize: "20px",
                    color: "var(--ink-primary)",
                    textDecoration: "none",
                    fontWeight: 500,
                  }}
                >
                  {link.label}
                </motion.a>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: NAV_LINKS.length * 0.08,
                  duration: 0.5,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="flex flex-col items-center"
                style={{ gap: "16px", marginTop: "16px" }}
              >
                <Button variant="ghost" href="/login">
                  Sign in
                </Button>
                <Button variant="primary" href="/early-access">
                  Get early access
                </Button>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
