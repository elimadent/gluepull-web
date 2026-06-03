import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import type { DrawerProductRef } from '@/components/ProductDrawer';

interface AddToCartButtonProps {
  /** Product to add — same shape the cart drawer reads from. */
  product: DrawerProductRef;
  /** Layout class for the call site: 'buy' | 'compare-buy' | 'mini-card-buy'.
   *  May include modifiers, e.g. 'buy compact'. */
  className?: string;
  /** Visible label in the idle state ('Buy', 'Buy on Anson PDR', …). */
  label?: string;
  /** When set, the button renders disabled with this text (e.g. product not
   *  linked on Anson yet). */
  disabledLabel?: string;
}

/** Small dark cart glyph that inherits the button's text color. */
function CartGlyph() {
  return (
    <svg
      className="buy-ico"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}

/**
 * Per-item "Buy" button. Adds the product to the in-app Glue IQ cart (the
 * floating cart drawer) — it does NOT navigate to Anson. The only button that
 * leaves for ansonpdr.com is "Checkout on Anson" inside the cart drawer, which
 * sends the whole aggregated cart in one trip.
 *
 * Confirmation: the floating cart pill's badge increments automatically (it
 * reads the same cart), and the button briefly flashes "✓ Added".
 */
export function AddToCartButton({
  product,
  className = 'buy',
  label = 'Buy',
  disabledLabel,
}: AddToCartButtonProps) {
  const { addToCart } = useCart();
  const [state, setState] = useState<'idle' | 'adding' | 'added'>('idle');

  if (disabledLabel) {
    return (
      <span className={`${className} disabled`} aria-disabled="true">
        {disabledLabel}
      </span>
    );
  }

  const handleClick = async () => {
    if (state !== 'idle') return;
    setState('adding');
    try {
      await addToCart(product, 1);
      setState('added');
      window.setTimeout(() => setState('idle'), 1600);
    } catch (e) {
      console.warn('[Glue IQ] add to cart failed:', e);
      setState('idle');
    }
  };

  return (
    <button
      type="button"
      className={`${className}${state === 'added' ? ' added' : ''}`}
      onClick={handleClick}
      disabled={state === 'adding'}
      aria-label={`Add ${product.name} to cart`}
    >
      {state === 'added' ? (
        <>
          <span aria-hidden>✓</span>
          <span>Added</span>
        </>
      ) : state === 'adding' ? (
        <span>Adding…</span>
      ) : (
        <>
          <CartGlyph />
          <span>{label}</span>
        </>
      )}
    </button>
  );
}
