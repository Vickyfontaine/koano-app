// End card (Act 3 close), 4s at 30fps. Full-bleed signature brand blue with
// the KOANO logo as the lead element, the category line, the CTA pill, and the
// URL. Text is --near-black on --brand-blue (about 8:1 contrast). The CTA pill
// inverts the site's primary button (near-black fill, white label) so it stays
// visible on the brand-blue field. Font stack matches koano.co exactly:
// system-ui for the headline, DM Mono for the URL.
import React from "react";
import { AbsoluteFill, Img, staticFile } from "remotion";
import { useFadeUp, usePushIn } from "../lib/motion";
import { useKoanoFonts } from "../fonts";

const SANS = "'Neue Montreal', 'DM Sans', system-ui, sans-serif";
const MONO = "'DM Mono', monospace";

export const EndCard: React.FC = () => {
  useKoanoFonts();

  const logo = useFadeUp(0, { dur: 18, dist: 24 });
  const logoScale = usePushIn(0, { dur: 26, from: 1.05, to: 1 });
  const line = useFadeUp(12);
  const cta = useFadeUp(20);
  const url = useFadeUp(28);

  return (
    <AbsoluteFill
      style={{ backgroundColor: "var(--brand-blue)", alignItems: "center", justifyContent: "center" }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Img
          src={staticFile("logo-nearblack@3x.png")}
          style={{
            height: 236,
            width: "auto",
            opacity: logo.opacity,
            transform: `${logo.transform} scale(${logoScale})`,
            transformOrigin: "center bottom",
          }}
        />
        <div
          style={{
            marginTop: 44,
            color: "var(--near-black)",
            fontFamily: SANS,
            fontWeight: 700,
            fontSize: 54,
            letterSpacing: "-0.02em",
            textAlign: "center",
            ...line,
          }}
        >
          The real estate reasoning engine.
        </div>
        <div style={{ marginTop: 40, ...cta }}>
          <div
            style={{
              backgroundColor: "var(--near-black)",
              color: "#FFFFFF",
              fontFamily: SANS,
              fontWeight: 500,
              fontSize: 23,
              padding: "17px 36px",
              borderRadius: 100,
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              boxShadow: "0 12px 34px rgba(13, 43, 62, 0.30)",
            }}
          >
            <span>Run your first verdict</span>
            <span>↗</span>
          </div>
        </div>
        <div
          style={{
            marginTop: 26,
            color: "var(--near-black)",
            fontFamily: MONO,
            fontSize: 17,
            letterSpacing: "0.08em",
            ...url,
          }}
        >
          koano.co
        </div>
      </div>
    </AbsoluteFill>
  );
};
