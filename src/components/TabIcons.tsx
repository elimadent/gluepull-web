/*
 * Monochrome SVG tab icons — replace the colored emoji (🏠 📚 📅 💡 ℹ️) for
 * a more refined dark/luxury look. Stroke-only, inherits currentColor so the
 * existing tab active/inactive color logic Just Works (gold when active,
 * faint gray otherwise).
 */
import type { SVGProps } from 'react';

type Props = SVGProps<SVGSVGElement>;

const COMMON = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export function HomeTabIcon(props: Props) {
  return (
    <svg {...COMMON} {...props}>
      <path d="M3 11l9-8 9 8" />
      <path d="M5 10v10a1 1 0 001 1h4v-7h4v7h4a1 1 0 001-1V10" />
    </svg>
  );
}

export function LibraryTabIcon(props: Props) {
  return (
    <svg {...COMMON} {...props}>
      <rect x="4" y="4" width="3.2" height="16" rx="0.4" />
      <rect x="9" y="3" width="3.2" height="17" rx="0.4" />
      <rect x="14" y="5" width="3.2" height="15" rx="0.4" />
      <path d="M18.5 6l2.5 13.5-3.2.6-2.5-13.5z" />
    </svg>
  );
}

export function PlanTabIcon(props: Props) {
  return (
    <svg {...COMMON} {...props}>
      <rect x="3" y="5" width="18" height="16" rx="1.5" />
      <path d="M3 9.5h18" />
      <path d="M8 3v4M16 3v4" />
      <circle cx="8" cy="14" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="14" r="1" fill="currentColor" stroke="none" />
      <circle cx="16" cy="14" r="1" fill="currentColor" stroke="none" />
      <circle cx="8" cy="17.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="12" cy="17.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function TipsTabIcon(props: Props) {
  return (
    <svg {...COMMON} {...props}>
      {/* bulb */}
      <path d="M9 17.5h6" />
      <path d="M10 20.5h4" />
      <path d="M12 3a6 6 0 00-3.5 10.8c.6.5 1 1.2 1 2v1.7h5v-1.7c0-.8.4-1.5 1-2A6 6 0 0012 3z" />
      {/* filament */}
      <path d="M10 10.5l2 2 2-2" opacity="0.55" />
    </svg>
  );
}

export function AboutTabIcon(props: Props) {
  return (
    <svg {...COMMON} {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="8.2" r="0.9" fill="currentColor" stroke="none" />
      <path d="M11 11.5h1.2v5.5h1" />
    </svg>
  );
}
