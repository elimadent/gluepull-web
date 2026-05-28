import { useCart } from '@/context/CartContext';

/**
 * Floating gold pill that sits above the bottom tab bar and shows the
 * current Glue IQ cart count. Tapping it opens the full CartPanel for
 * review + checkout. Only renders when the cart has at least one line.
 */
export function CartPill() {
  const { totalItems, openCart } = useCart();
  return (
    <button
      type="button"
      className="cart-pill"
      onClick={openCart}
      aria-label={`Open cart, ${totalItems} item${totalItems === 1 ? '' : 's'}`}
    >
      <span className="cart-pill-icon" aria-hidden>🛒</span>
      <span className="cart-pill-count">{totalItems}</span>
      <span className="cart-pill-label">in cart</span>
    </button>
  );
}
