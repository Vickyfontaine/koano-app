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

export const PDF_FONT_FAMILY = 'Helvetica';
export const PDF_FONT_FAMILY_BOLD = 'Helvetica-Bold';

// Registers bundled brand fonts. No-op today (Helvetica is built in). Kept so
// the render path always calls it — the day a brand .ttf is bundled, only this
// function body and the family constants change.
export function registerPdfFonts(): void {
  /* no bundled custom fonts yet */
}
