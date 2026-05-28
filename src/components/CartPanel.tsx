import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useCart, type CartLine } from '@/context/CartContext';
import { buildCartPermalink } from '@/services/shopify';

/**
 * Cart review panel — slide-up sheet showing every line the user has added
 * inside Glue IQ. Each line has its own qty stepper / remove. At the
 * bottom: "Checkout on Anson" (primary, builds a cart permalink and
 * same-window-navigates so everything lands in the Anson cart in one go)
 * and "Keep Shopping" (closes the panel).
 *
 * The panel reuses the .drawer-* CSS so the look is consistent with the
 * single-product Add-to-Cart drawer.
 */
export function CartPanel() {
  const { lines, totalItems, setLineQty, removeLine, clearCart, closeCart } = useCart();

  // Esc closes; iOS-safe scroll-lock pattern (same as the lightbox + drawer).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCart();
    };
    window.addEventListener('keydown', onKey);
    const scrollY = window.scrollY;
    const prev = {
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
      overflow: document.body.style.overflow,
    };
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.position = prev.position;
      document.body.style.top = prev.top;
      document.body.style.width = prev.width;
      document.body.style.overflow = prev.overflow;
      window.scrollTo(0, scrollY);
    };
  }, [closeCart]);

  const checkout = () => {
    const url = buildCartPermalink(
      lines.map((l) => ({ variantId: l.variantId, qty: l.qty }))
    );
    if (typeof window !== 'undefined') {
      window.location.href = url;
    }
  };

  if (typeof document === 'undefined') return null;
  return createPortal(
    <div
      className="drawer-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Your cart"
      onClick={closeCart}
    >
      <div className="drawer-panel cart-panel" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="drawer-close"
          onClick={closeCart}
          aria-label="Close cart"
        >
          ×
        </button>
        <div className="drawer-grip" aria-hidden />

        <div className="cart-panel-head">
          <h3 className="cart-panel-title">Your cart</h3>
          <p className="cart-panel-sub">
            {totalItems} item{totalItems === 1 ? '' : 's'} ready to send to your
            Anson cart.
          </p>
        </div>

        {lines.length === 0 ? (
          <p className="cart-panel-empty">
            Nothing here yet. Tap any Buy button to add a glue.
          </p>
        ) : (
          <ul className="cart-line-list">
            {lines.map((line) => (
              <CartLineRow
                key={line.variantId}
                line={line}
                onQty={(q) => setLineQty(line.variantId, q)}
                onRemove={() => removeLine(line.variantId)}
              />
            ))}
          </ul>
        )}

        <div className="drawer-actions">
          <button
            type="button"
            className="drawer-cta drawer-cta-primary"
            onClick={checkout}
            disabled={lines.length === 0}
          >
            <span aria-hidden>🛒</span>
            <span>Checkout on Anson</span>
          </button>
          <button
            type="button"
            className="drawer-cta drawer-cta-secondary"
            onClick={closeCart}
          >
            Keep shopping in Glue IQ
          </button>
          {lines.length > 0 ? (
            <button
              type="button"
              className="drawer-cta drawer-cta-tertiary"
              onClick={() => {
                if (window.confirm('Clear all items from your Glue IQ cart?')) {
                  clearCart();
                }
              }}
            >
              Clear cart
            </button>
          ) : null}
        </div>
      </div>
    </div>,
    document.body
  );
}

function CartLineRow({
  line,
  onQty,
  onRemove,
}: {
  line: CartLine;
  onQty: (q: number) => void;
  onRemove: () => void;
}) {
  return (
    <li className="cart-line">
      {line.imageUrl ? (
        <img
          src={line.imageUrl}
          alt=""
          className="cart-line-img"
          loading="lazy"
        />
      ) : (
        <div className="cart-line-img cart-line-img-empty" aria-hidden />
      )}
      <div className="cart-line-body">
        <p className="cart-line-name">{line.name}</p>
        <div className="cart-line-controls">
          <div className="drawer-stepper" role="group" aria-label="Line quantity">
            <button
              type="button"
              className="drawer-stepper-btn"
              onClick={() => onQty(line.qty - 1)}
              aria-label="Decrease quantity"
            >
              −
            </button>
            <span className="drawer-stepper-value">{line.qty}</span>
            <button
              type="button"
              className="drawer-stepper-btn"
              onClick={() => onQty(line.qty + 1)}
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
          <button
            type="button"
            className="cart-line-remove"
            onClick={onRemove}
            aria-label={`Remove ${line.name} from cart`}
          >
            Remove
          </button>
        </div>
      </div>
    </li>
  );
}
