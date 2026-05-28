/*
 * SVG icons for the Tech Tips section headers — each one shows the actual
 * thing it represents, not a generic emoji stand-in.
 *
 *   PanelPrepIcon  — wax/cleaner spray bottle + folded rag
 *   HeatGunIcon    — side profile of a PDR heat gun, with heat waves
 *   GlueSticksIcon — assortment of different-colored glue sticks (no packaging)
 *   MiniLifterIcon — T-handle PDR mini-lifter with feet + grabber hook
 *
 * All sized at 24×24 (viewBox), inherit currentColor for strokes so the
 * existing .tip-icon-wrap container can keep its gold-on-black framing.
 */

export function PanelPrepIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {/* Spray bottle body */}
      <path d="M5 14h7v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1z" />
      {/* Bottle neck */}
      <path d="M7 14v-3h3v-2h-1" />
      {/* Spray trigger / nozzle housing */}
      <path d="M10 11h5l-1 3" />
      <path d="M15 11v-1" />
      {/* Spray mist */}
      <path d="M17 8l2-1M17 10h2.5M17 12l2 1" opacity="0.65" />
      {/* Folded rag on the right */}
      <path d="M22 18l7 2-2 7-7-2z" />
      <path d="M22 20l6 1.6M22 22l5 1.5M22 24l4 1.2" opacity="0.55" />
    </svg>
  );
}

export function HeatGunIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {/* Main barrel */}
      <rect x="3" y="10" width="17" height="9" rx="2" />
      {/* Nozzle */}
      <path d="M20 12h4l2 2.5L24 17h-4" />
      {/* Handle */}
      <path d="M9 19v6a1 1 0 0 0 1 1h5a1 1 0 0 0 1-1v-6" />
      {/* Trigger */}
      <path d="M12 22h2" />
      {/* Heat waves */}
      <path
        d="M28 11c1 1 1 2 0 3M28 14c1 1 1 2 0 3"
        opacity="0.7"
      />
      <path d="M30 12c1 1.2 1 2.3 0 3.5" opacity="0.45" />
    </svg>
  );
}

export function GlueSticksIcon(props: React.SVGProps<SVGSVGElement>) {
  // Four glue sticks, no packaging, different colors — gold, red, blue, green.
  // Each is a rounded vertical rod offset at slightly different heights.
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {/* stick 1 — gold */}
      <rect x="4" y="6" width="4.5" height="22" rx="2.2" fill="#d4af37" />
      <rect x="4" y="6" width="4.5" height="22" rx="2.2" fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth="0.8" />
      {/* stick 2 — red */}
      <rect x="10" y="8" width="4.5" height="20" rx="2.2" fill="#e26a6a" />
      <rect x="10" y="8" width="4.5" height="20" rx="2.2" fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth="0.8" />
      {/* stick 3 — blue */}
      <rect x="16" y="5" width="4.5" height="23" rx="2.2" fill="#7fc8ff" />
      <rect x="16" y="5" width="4.5" height="23" rx="2.2" fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth="0.8" />
      {/* stick 4 — green */}
      <rect x="22" y="9" width="4.5" height="19" rx="2.2" fill="#6ed28b" />
      <rect x="22" y="9" width="4.5" height="19" rx="2.2" fill="none" stroke="rgba(0,0,0,0.35)" strokeWidth="0.8" />
    </svg>
  );
}

export function MiniLifterIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      {/* T-handle */}
      <path d="M10 4h12" />
      {/* Shaft from handle to body */}
      <path d="M16 4v6" />
      {/* Threaded body */}
      <rect x="13" y="10" width="6" height="9" rx="1" />
      <path d="M13 13h6M13 16h6" opacity="0.55" />
      {/* Cross-bar / leg spreader */}
      <path d="M6 22h20" />
      {/* Two feet down */}
      <path d="M6 22v4M26 22v4" />
      <path d="M6 26h3M23 26h3" />
      {/* Center pull rod going down to the grabber */}
      <path d="M16 19v8" />
      <path d="M13 27h6" />
    </svg>
  );
}
