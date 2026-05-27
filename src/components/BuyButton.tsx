interface BuyButtonProps {
  url: string;
  label?: string;
  /** Smaller variant for use inside dense lists. */
  compact?: boolean;
}

/** Open an external link in a new tab. Kept as a named export so screens
 *  can fire it without instantiating a button (matches the RN module shape). */
export function openLink(url: string): void {
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function BuyButton({ url, label = 'Buy Now', compact }: BuyButtonProps) {
  return (
    <a
      className={`buy${compact ? ' compact' : ''}`}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${label} on ansonpdr.com`}
    >
      <span aria-hidden>🛒</span>
      <span>{label}</span>
    </a>
  );
}
