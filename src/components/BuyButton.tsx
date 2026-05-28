import { linkTarget } from '@/utils/link';

interface BuyButtonProps {
  url: string;
  label?: string;
  /** Smaller variant for use inside dense lists. */
  compact?: boolean;
}

export function BuyButton({ url, label = 'Buy Now', compact }: BuyButtonProps) {
  return (
    <a
      className={`buy${compact ? ' compact' : ''}`}
      href={url}
      target={linkTarget(url)}
      rel="noopener noreferrer"
      aria-label={`${label} on Anson PDR`}
    >
      <span aria-hidden>🛒</span>
      <span>{label}</span>
    </a>
  );
}
