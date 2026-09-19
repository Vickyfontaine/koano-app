/**
 * Shared hero text-block geometry — the single source of truth.
 *
 * Every hero render (a buildings image with a blank strip down the middle) was
 * authored to the text width of the /for/institutions hero. So every
 * render-backed hero MUST size its text block to these exact values, or the
 * copy overflows into the buildings.
 *
 * Do NOT inline these pixel values in a hero component again. Import from here.
 * If a render is ever re-authored to a different blank-strip width, change it
 * ONCE here and every hero moves with it.
 *
 * Reference: the /for/institutions hero (ClusterLanding) — a centered text
 * column, `HERO_CONTAINER_WIDTH` wide, with the headline and subhead capped
 * inside it at the values below.
 */
export const HERO_CONTAINER_WIDTH = 800; // the centered text column == the render's blank-strip width
export const HERO_HEADLINE_WIDTH = 760; // <h1> cap inside the column
export const HERO_SUBHEAD_WIDTH = 640; // subhead / tagline cap inside the column

export const HERO_CONTAINER_MAX = `${HERO_CONTAINER_WIDTH}px`;
export const HERO_HEADLINE_MAX = `${HERO_HEADLINE_WIDTH}px`;
export const HERO_SUBHEAD_MAX = `${HERO_SUBHEAD_WIDTH}px`;

/**
 * Hero text-block top offset.
 *
 * HERO_PADDING_TOP is the top padding that anchors the text block. It gives the
 * number a bit more breathing room from the nav than the number→headline gap
 * (an exact 1:1 read too tight at the top). Every hero anchors its text to the
 * top with this value, so the top rhythm is identical across all of them.
 * (Add ~6px to this value for the rendered nav→number gap — the number's
 * line-box adds ~7px of leading above the glyph, measured not guessed.)
 *
 * The images are bottom-anchored in their own components, so this only governs
 * the text; the bottom value is legacy and unused by the top-anchored text.
 */
export const HERO_PADDING_TOP = 34;
export const HERO_PADDING_SIDE = 32;
export const HERO_PADDING_BOTTOM = 210;
export const HERO_SECTION_PADDING = `${HERO_PADDING_TOP}px ${HERO_PADDING_SIDE}px ${HERO_PADDING_BOTTOM}px`;
