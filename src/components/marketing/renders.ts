// The marketing render slots (UI sprint WS2). One entry per delivered render:
// the desktop WebP, its intrinsic pixel size (explicit width/height prevent
// layout shift), and whether the founder has supplied the matching MOBILE
// render (4:5, diorama house style, buildings in the lower half, clean upper
// area for the headline) at `public/renders/mobile/<name>.webp`.
//
// Until a mobile render exists the hero uses the temporary layout the sprint
// specifies: the desktop render is placed BELOW the headline block at full
// width on phones, never hidden. Flip `mobile` to true when the file lands.
export interface RenderSlot {
  name: string;
  src: string;
  width: number;
  height: number;
  /** `public/renders/mobile/<name>.webp` exists (4:5, 2160px on the long edge). */
  mobile: boolean;
}

export const RENDERS = {
  "how-it-works": { name: "how-it-works", src: "/renders/how-it-works.webp", width: 4202, height: 2304, mobile: false },
  pricing: { name: "pricing", src: "/renders/pricing.webp", width: 4202, height: 2304, mobile: false },
  "for-developers": { name: "for-developers", src: "/renders/for-developers.webp", width: 4128, height: 2304, mobile: false },
  "for-professionals": { name: "for-professionals", src: "/renders/for-professionals.webp", width: 4128, height: 2304, mobile: false },
  "for-institutions": { name: "for-institutions", src: "/renders/for-institutions.webp", width: 4128, height: 2304, mobile: false },
  "for-community": { name: "for-community", src: "/renders/for-community.webp", width: 4128, height: 2304, mobile: false },
  about: { name: "about", src: "/renders/about.webp", width: 2066, height: 2000, mobile: false },
  cta: { name: "cta", src: "/renders/cta.webp", width: 3840, height: 1319, mobile: false },
  "menu-hero": { name: "menu-hero", src: "/renders/menu-hero.jpg", width: 2267, height: 1114, mobile: false },
} as const satisfies Record<string, RenderSlot>;

export type RenderName = keyof typeof RENDERS;

export function mobileSrc(slot: RenderSlot): string | null {
  return slot.mobile ? `/renders/mobile/${slot.name}.webp` : null;
}
