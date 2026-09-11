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
 * Hero section padding, composed against the renders' blank strip.
 *
 * Top + bottom are asymmetric on purpose: they sum to the same 280px as the
 * original 160/120, so the section's total height is unchanged and nothing
 * below the hero shifts, while the text block sits 90px higher to land in the
 * blank strip. Do NOT rebalance top/bottom without re-checking the render
 * overlay — these values are composed against the images.
 *
 * NOTE: these are fixed pixels (not responsive). The renders are fixed-aspect
 * and scale with viewport width; this offset is only verified at desktop
 * width. A mobile breakpoint may be needed — see the hero components.
 */
export const HERO_PADDING_TOP = 70;
export const HERO_PADDING_SIDE = 32;
export const HERO_PADDING_BOTTOM = 210;
export const HERO_SECTION_PADDING = `${HERO_PADDING_TOP}px ${HERO_PADDING_SIDE}px ${HERO_PADDING_BOTTOM}px`;
