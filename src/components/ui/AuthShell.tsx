// AuthShell (UI sprint WS3, A15): the shared layout for /login and /signup.
// The original blue logo, a KOANO panel with the approved tagline and the
// three promises beside the form at 1024 and up, stacked on phones. The Clerk
// card inside is restyled through koanoClerkAppearance. White and pale-wash
// only (§10); no copy invented beyond the approved lines.

import Link from "next/link";

const PROMISES = [
  { lead: "Every figure", rest: "data-sourced" },
  { lead: "Every verdict", rest: "reproducible" },
  { lead: "Every step", rest: "auditable" },
];

export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-shell">
      <header className="auth-head">
        <Link href="/" className="auth-logo" aria-label="KOANO home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="KOANO" width={44} height={44} />
        </Link>
        <Link href="/" className="auth-back">
          Back to the site
        </Link>
      </header>

      <main className="auth-main">
        <section className="auth-brand" aria-label="About KOANO">
          <p className="auth-eyebrow">The real estate reasoning engine</p>
          <h1 className="auth-title">
            Smart data.
            <br />
            Smarter real estate decisions.
          </h1>
          <ul className="auth-promises">
            {PROMISES.map((p) => (
              <li key={p.lead}>
                <span className="auth-promise-lead">{p.lead}</span> {p.rest}
              </li>
            ))}
          </ul>
        </section>

        <section className="auth-form" aria-label="Account">
          {children}
        </section>
      </main>

      <footer className="auth-foot">© 2026 KOANO Inc. All rights reserved.</footer>

      <style>{`
        .auth-shell {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          background: var(--pale-wash);
        }
        .auth-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--space-3) var(--space-6);
          min-height: var(--nav-h);
        }
        .auth-logo {
          display: inline-flex;
          align-items: center;
          min-height: 44px;
          border-radius: var(--radius-chip);
        }
        .auth-logo img {
          height: 44px;
          width: auto;
          display: block;
        }
        .auth-back {
          display: inline-flex;
          align-items: center;
          min-height: 44px;
          font-size: var(--text-body);
          color: var(--ink-muted);
          text-decoration: none;
          border-radius: var(--radius-chip);
        }
        .auth-back:hover {
          color: var(--ink-primary);
        }
        .auth-main {
          flex: 1 1 auto;
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          align-items: center;
          gap: var(--space-8);
          max-width: var(--content-max);
          width: 100%;
          margin: 0 auto;
          padding: var(--space-6) var(--space-6) var(--space-8);
        }
        .auth-brand {
          max-width: 480px;
        }
        .auth-eyebrow {
          font-family: var(--font-mono);
          font-size: var(--text-micro);
          letter-spacing: 1.5px;
          text-transform: uppercase;
          color: var(--ink-muted);
          margin: 0 0 var(--space-4);
        }
        .auth-title {
          font-size: var(--text-h1);
          font-weight: 700;
          letter-spacing: -0.02em;
          line-height: 1.1;
          color: var(--ink-primary);
          margin: 0 0 var(--space-5);
        }
        .auth-promises {
          list-style: none;
          margin: 0;
          padding: 0;
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
          font-family: var(--font-mono);
          font-size: var(--text-data);
          letter-spacing: 0.04em;
          color: var(--ink-muted);
        }
        .auth-promise-lead {
          font-weight: 700;
          color: var(--ink-primary);
        }
        .auth-form {
          width: 100%;
          max-width: 440px;
          justify-self: center;
        }
        .auth-foot {
          padding: var(--space-5) var(--space-6);
          text-align: center;
          font-size: var(--text-caption);
          color: var(--ink-muted);
        }
        @media (max-width: 1023px) {
          .auth-main {
            grid-template-columns: minmax(0, 1fr);
            align-items: start;
            gap: var(--space-6);
            padding: var(--space-5) var(--space-4) var(--space-7);
          }
          .auth-brand {
            max-width: 560px;
          }
          .auth-title {
            font-size: var(--text-h2);
          }
          .auth-form {
            justify-self: stretch;
            max-width: none;
          }
          .auth-head {
            padding: var(--space-2) var(--space-4);
          }
        }
      `}</style>
    </div>
  );
}
