// KOANO PDF fonts — the single swap point for the document typeface.
//
// VERCEL CONSTRAINT (why this is its own module): @react-pdf/renderer needs any
// custom font as a BUNDLED .ttf/.otf buffer registered before render. Fetching
// a font at render time (e.g. the Fontshare CDN the marketing site uses) fails
// in serverless — the same CSP/egress wall that blocks any runtime asset fetch.
//
// The brand font, Neue Montreal, is not in the repo as a .ttf (only the
// Fontshare <link> exists). Until a NeueMontreal-*.ttf is placed under
// lib/documents/render/assets/ and registered here, KOANO PDFs render in the
// built-in Helvetica — registration-free and guaranteed available in any Node
// runtime. Swapping to the brand font is then localized to this file:
//   import NeueMontrealRegular from './assets/NeueMontreal-Regular.ttf';  // as buffer
//   Font.register({ family: 'NeueMontreal', fonts: [{ src: buffer, fontWeight: 400 }, ...] });
//   export const PDF_FONT_FAMILY = 'NeueMontreal';

import { Font } from '@react-pdf/renderer';

export const PDF_FONT_FAMILY = 'Helvetica';
export const PDF_FONT_FAMILY_BOLD = 'Helvetica-Bold';

// Registers bundled brand fonts. No-op today (Helvetica is built in). Kept so
// the render path always calls it — the day a brand .ttf is bundled, only this
// function body and the family constants change.
let hyphenationOff = false;
export function registerPdfFonts(): void {
  /* no bundled custom fonts yet */
  // Hyphenation OFF (UI sprint A19): react-pdf's default callback split labels
  // and street names mid-word ("PROPERTIES AS-SESSED", "VER-NON BOULE-VARD").
  // Words wrap whole; long cells wrap at spaces only.
  // A long unbroken token (a URL, a slashed source id) may still break after a
  // "/" or "-", which is where a typesetter would break it.
  if (!hyphenationOff) {
    Font.registerHyphenationCallback((word) => (word.length > 24 ? word.split(/(?<=[/-])/) : [word]));
    hyphenationOff = true;
  }
}
