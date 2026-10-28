// Remotion config for the KOANO product-demo film.
// - Tailwind v3 is enabled so imported app components style correctly.
// - The `@/*` alias is wired to the repo's ../src so we can import real
//   KOANO components (VerdictMathPanel, charts, panels, ...) directly.
// Run from the repo root, e.g. `npx remotion studio video/src/index.ts`.
import path from "node:path";
import { Config } from "@remotion/cli/config";
import { enableTailwind } from "@remotion/tailwind";

Config.setVideoImageFormat("jpeg");
Config.setConcurrency(1);
// Static assets (staticFile: vendored DM Mono, the near-black logo, later the
// map stills and rasterized PDF pages) live in video/public, not the app's
// /public. The npm scripts pass `--public-dir=video/public` so staticFile(...)
// resolves regardless of the launch cwd.

Config.overrideWebpackConfig((currentConfiguration) => {
  const withTailwind = enableTailwind(currentConfiguration);
  return {
    ...withTailwind,
    resolve: {
      ...withTailwind.resolve,
      alias: {
        ...(withTailwind.resolve?.alias ?? {}),
        // Resolve against the repo root (the npm scripts always run from there),
        // never __dirname (Remotion bundles the config, so __dirname is the CLI).
        "@": path.resolve(process.cwd(), "src"),
      },
    },
  };
});
