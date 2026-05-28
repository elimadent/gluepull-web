/*
 * Drop-in replacement for the 🔥 emoji that used to show on glue cards when
 * an Anson product photo isn't available (Gold Rush, Snowflake White,
 * GlueTraxx Teal). Renders three vertical glue sticks tinted to the glue's
 * actual `color` attribute — so even un-photographed sticks show meaningful
 * visual identity.
 */

const COLOR_MAP: Record<string, string> = {
  gold: '#d4af37',
  red: '#d23030',
  yellow: '#f0c040',
  nude: '#e8d4a8',
  purple: '#8855aa',
  pink: '#ee5599',
  orange: '#f08030',
  green: '#4caf50',
  brown: '#8b4513',
  black: '#181818',
  white: '#f0f0f0',
  teal: '#2aa1a1',
  blue: '#2255aa',
  grey: '#888888',
  gray: '#888888',
  turquoise: '#28b2b2',
};

function colorFor(name: string): string {
  if (!name) return '#a08a55';
  const lower = name.toLowerCase();
  // Exact match first ("blue").
  if (COLOR_MAP[lower]) return COLOR_MAP[lower];
  // Substring match — handles free-text from the live crawl like
  // "gold / yellow-gold (Brazilian)", "translucent purple", "root beer / dark brown".
  for (const [key, hex] of Object.entries(COLOR_MAP)) {
    if (lower.includes(key)) return hex;
  }
  return '#a08a55';
}

interface Props {
  /** The glue's `color` attribute, used to tint the sticks. */
  color: string;
  className?: string;
}

export function GlueStickPlaceholder({ color, className }: Props) {
  const fill = colorFor(color);
  // For very dark/black or pure-white glues, give a faint stroke so the
  // silhouette reads against the card background.
  const stroke = fill === '#181818' ? '#3a3a3a' : fill === '#f0f0f0' ? '#c8c8c8' : 'rgba(0,0,0,0.35)';
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role="img"
      aria-label={`${color} glue stick illustration`}
    >
      <defs>
        <linearGradient id={`gp-stick-${color.toLowerCase()}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={fill} stopOpacity="0.95" />
          <stop offset="100%" stopColor={fill} stopOpacity="0.7" />
        </linearGradient>
      </defs>
      {/* dark background like a product photo on dark surface */}
      <rect width="64" height="64" fill="#0c0c0c" />
      {/* three sticks at staggered heights */}
      <rect
        x="10" y="12" width="9" height="44" rx="4"
        fill={`url(#gp-stick-${color.toLowerCase()})`}
        stroke={stroke}
        strokeWidth="0.7"
      />
      <rect
        x="22" y="16" width="9" height="42" rx="4"
        fill={`url(#gp-stick-${color.toLowerCase()})`}
        stroke={stroke}
        strokeWidth="0.7"
      />
      <rect
        x="34" y="10" width="9" height="46" rx="4"
        fill={`url(#gp-stick-${color.toLowerCase()})`}
        stroke={stroke}
        strokeWidth="0.7"
      />
      <rect
        x="46" y="20" width="9" height="38" rx="4"
        fill={`url(#gp-stick-${color.toLowerCase()})`}
        stroke={stroke}
        strokeWidth="0.7"
      />
    </svg>
  );
}
