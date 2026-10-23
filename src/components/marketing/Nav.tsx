"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useUser, UserButton } from "@clerk/nextjs";
import Button from "../ui/Button";

// Cluster links ordered by positioning priority (CLAUDE.md Section 01):
// professional and institutional first, homeowners last.
const NAV_LINKS = [
  { label: "About us", href: "/about" },
  { label: "How it works", href: "/intelligence" },
  { label: "For developers", href: "/for/developers" },
  { label: "For professionals", href: "/for/agents" },
  { label: "For institutions", href: "/for/institutions" },
  { label: "For communities", href: "/for/community" },
  { label: "Pricing", href: "/pricing" },
];

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  // Auth-aware (UI sprint WS2): a signed-in visitor sees "Dashboard" and the
  // account button instead of Sign in / Sign up. Until Clerk has loaded, the
  // signed-out pair renders (the common case), so nothing jumps for a visitor.
  const { isLoaded, isSignedIn } = useUser();
  const signedIn = isLoaded && isSignedIn === true;
  const sheetRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 80);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll when the phone sheet is open
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

  const close = useCallback(() => {
    setMobileOpen(false);
    // Return focus to the control that opened the sheet.
    requestAnimationFrame(() => toggleRef.current?.focus());
  }, []);

  // Phone sheet: move focus in, trap Tab inside, close on Escape.
  useEffect(() => {
    if (!mobileOpen) return;
    const sheet = sheetRef.current;
    const first = sheet?.querySelector<HTMLElement>(FOCUSABLE);
    first?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== "Tab" || !sheet) return;
      const items = Array.from(sheet.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
      // The hamburger (now a close button) stays in the cycle as the last stop.
      const cycle = toggleRef.current ? [...items, toggleRef.current] : items;
      if (cycle.length === 0) return;
      const i = cycle.indexOf(document.activeElement as HTMLElement);
      // Always move within the cycle (sheet links, buttons, then the close
      // control), so focus can never land on the page under the sheet.
      e.preventDefault();
      const next = i === -1 ? 0 : (i + (e.shiftKey ? -1 : 1) + cycle.length) % cycle.length;
      cycle[next].focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mobileOpen, close]);

  return (
    <>
      <nav
        id="main-nav"
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        aria-label="Main"
        style={{
          // Solid nav. Glass was retired: our palette is too light and the
          // heroes too sky-heavy for backdrop-filter to ever refract. The bar is
          // always solid white with the hairline border, and on scroll it lifts
          // off the content with a quiet navy-tinted shadow.
          background: "var(--white)",
          borderBottom: "1px solid var(--border-light)",
          boxShadow: scrolled ? "var(--shadow-raised)" : "none",
        }}
      >
        <div
          className="mx-auto flex items-center justify-between nav-inner"
          style={{
            maxWidth: "var(--content-marketing)",
            padding: "0 32px",
            height: "var(--nav-h)",
          }}
        >
          {/* Logo: the original blue mark, unchanged */}
          <a
            href="/"
            id="nav-logo"
            className="flex items-center"
            style={{ textDecoration: "none", minHeight: "44px" }}
            aria-label="KOANO home"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="KOANO"
              width={50}
              height={50}
              style={{ height: "50px", width: "auto", display: "block" }}
            />
          </a>

          {/* Center links, desktop */}
          <div className="hidden lg:flex items-center" style={{ gap: "var(--space-5)" }}>
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                id={`nav-link-${link.href.replace(/\//g, "-").slice(1)}`}
                className="nav-link"
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Right, desktop: auth-aware */}
          <div
            className="hidden lg:flex items-center"
            style={{ gap: "var(--space-3)", visibility: isLoaded ? "visible" : "hidden" }}
            aria-hidden={!isLoaded}
          >
            {signedIn ? (
              <>
                <Button variant="primary" href="/dashboard" id="nav-dashboard">
                  Dashboard
                </Button>
                <UserButton />
              </>
            ) : (
              <>
                <Button variant="ghost" href="/login" id="nav-sign-in">
                  Sign in
                </Button>
                <Button variant="primary" href="/signup" id="nav-sign-up">
                  Sign up
                </Button>
              </>
            )}
          </div>

          {/* Phone: hamburger (44px target) */}
          <button
            ref={toggleRef}
            className="lg:hidden flex flex-col items-center justify-center"
            id="nav-mobile-toggle"
            onClick={() => (mobileOpen ? close() : setMobileOpen(true))}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            aria-controls="nav-mobile-menu"
            style={{
              width: "44px",
              height: "44px",
              marginRight: "-8px",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              gap: "5px",
              padding: 0,
              borderRadius: "var(--radius-chip)",
            }}
          >
            <span
              style={{
                display: "block",
                width: "20px",
                height: "1.5px",
                background: "var(--near-black)",
                transition: "all 0.3s ease",
                transform: mobileOpen ? "rotate(45deg) translateY(3.25px)" : "none",
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
                transform: mobileOpen ? "rotate(-45deg) translateY(-3.25px)" : "none",
              }}
            />
          </button>
        </div>
      </nav>

      {/* Phone sheet */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            id="nav-mobile-menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 lg:hidden"
            style={{
              background: "var(--white)",
              paddingTop: "var(--nav-h)",
              overflowY: "auto",
            }}
          >
            {/* The ref lives on an inner element: AnimatePresence's direct child
                must not carry one (framer-motion 12 warns and drops it). */}
            <div
              ref={sheetRef}
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
              className="flex flex-col items-stretch"
              style={{ padding: "24px 32px 40px" }}
            >
              {NAV_LINKS.map((link, i) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  className="nav-sheet-link"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </motion.a>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: NAV_LINKS.length * 0.04, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="flex flex-col"
                style={{ gap: "12px", marginTop: "24px" }}
              >
                {signedIn ? (
                  <>
                    <Button variant="primary" href="/dashboard" className="nav-sheet-btn">
                      Dashboard
                    </Button>
                    <div className="flex items-center" style={{ gap: "12px", padding: "8px 0", color: "var(--ink-secondary)", fontSize: "14px" }}>
                      <UserButton />
                      <span>Account</span>
                    </div>
                  </>
                ) : (
                  <>
                    <Button variant="primary" href="/signup" className="nav-sheet-btn">
                      Sign up
                    </Button>
                    <Button variant="ghost" href="/login" className="nav-sheet-btn">
                      Sign in
                    </Button>
                  </>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .nav-link {
          display: inline-flex;
          align-items: center;
          min-height: 44px;
          font-size: var(--text-data);
          font-weight: 400;
          color: var(--ink-muted);
          text-decoration: none;
          transition: color var(--dur-2) var(--ease-out);
          border-radius: var(--radius-chip);
        }
        .nav-link:hover {
          color: var(--ink-primary);
        }
        .nav-sheet-link {
          display: flex;
          align-items: center;
          min-height: 52px;
          padding: var(--space-1) 0;
          font-size: var(--text-h2);
          font-weight: 500;
          color: var(--ink-primary);
          text-decoration: none;
          border-bottom: 1px solid var(--border-light);
          border-radius: var(--radius-chip);
        }
        .nav-sheet-btn {
          width: 100%;
          min-height: 48px;
        }
      `}</style>
    </>
  );
}
