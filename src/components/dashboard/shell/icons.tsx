// Shell icons (UI sprint WS3). Hand-drawn 20px line icons on a 24 grid, 1.5px
// strokes, currentColor, so they take the ink tokens and read on pale-wash and
// white. Decorative: every use carries its own text or aria-label.

import React from "react";

type IconProps = { size?: number; className?: string };

function Svg({ size = 20, className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
    >
      {children}
    </svg>
  );
}

export const HomeIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 10.5 12 4l8 6.5V20h-5.5v-5h-5v5H4z" />
  </Svg>
);
export const SearchIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-4.2-4.2" />
  </Svg>
);
export const WatchIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12s-3.5 6.5-9.5 6.5S2.5 12 2.5 12z" />
    <circle cx="12" cy="12" r="2.75" />
  </Svg>
);
export const DocumentsIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M7 3.5h7l4 4V20a.5.5 0 0 1-.5.5h-10A.5.5 0 0 1 7 20z" />
    <path d="M14 3.5v4h4M10 12h5M10 15.5h5" />
  </Svg>
);
export const HistoryIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1" />
    <path d="M3.5 4.5v4.2h4.2M12 8v4.5l3 1.8" />
  </Svg>
);
export const SettingsIcon = (p: IconProps) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6 6l1.6 1.6M16.4 16.4 18 18M6 18l1.6-1.6M16.4 7.6 18 6" />
  </Svg>
);
export const CompareIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3.5" y="5" width="7" height="14" rx="1" />
    <rect x="13.5" y="5" width="7" height="14" rx="1" />
  </Svg>
);
export const MenuIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Svg>
);
export const CloseIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m6 6 12 12M18 6 6 18" />
  </Svg>
);
export const ChevronIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="m9 6 6 6-6 6" />
  </Svg>
);

// Lens marks: a site plan (Develop), a price tag (Price), a book grid
// (Acquire), a house (Property).
export const DevelopIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M4 20h16M6 20V9l6-4 6 4v11" />
    <path d="M10 20v-5h4v5" />
  </Svg>
);
export const PriceIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.5 12.5V5a1.5 1.5 0 0 1 1.5-1.5h7.5L20.5 11.5l-8 8z" />
    <circle cx="8" cy="8" r="1.25" />
  </Svg>
);
export const AcquireIcon = (p: IconProps) => (
  <Svg {...p}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1" />
  </Svg>
);
export const PropertyIcon = (p: IconProps) => (
  <Svg {...p}>
    <path d="M3.5 11 12 4l8.5 7" />
    <path d="M6 9.5V20h12V9.5M10 20v-5.5h4V20" />
  </Svg>
);
