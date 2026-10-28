// DM Mono loaded from vendored local files for a deterministic render.
// DM Mono (Google, OFL) is the mono face koano.co actually serves; it is used
// for all data, labels, sources and section numbers. Headline and body use the
// site's `system-ui` stack (no file needed), matching koano.co exactly.
import { useEffect, useState } from "react";
import { continueRender, delayRender, staticFile } from "remotion";
import { loadFont } from "@remotion/fonts";

export const DM_MONO = "DM Mono";

export const loadKoanoFonts = () =>
  Promise.all([
    loadFont({ family: DM_MONO, url: staticFile("fonts/DMMono-400.woff2"), weight: "400" }),
    loadFont({ family: DM_MONO, url: staticFile("fonts/DMMono-500.woff2"), weight: "500" }),
  ]);

/** Gate a composition's render until DM Mono is ready (no fallback flash). */
export function useKoanoFonts(): void {
  const [handle] = useState(() => delayRender("koano-fonts"));
  useEffect(() => {
    loadKoanoFonts()
      .then(() => continueRender(handle))
      .catch(() => continueRender(handle));
  }, [handle]);
}
