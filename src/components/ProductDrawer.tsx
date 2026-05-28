import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { GlueStickPlaceholder } from '@/components/GlueStickPlaceholder';
import { useCart } from '@/context/CartContext';
import { resolveProduct, type ResolvedProduct } from '@/services/shopify';

export interface DrawerProductRef {
  /** Glue id if this is a known glue; undefined for tools or unknown links. */
  glueId?: string;
  name: string;
  imageUrl: string | null;
  description?: string;
  productUrl: string;
}

interface ProductDrawerProps {
  product: DrawerProductRef;
  onClose: () => void;
}

/**
 * In-app product drawer. Slides up from the bottom with the product's
 * image, name, short description, a quantity stepper, and three CTAs:
 *
 *   1. Add to Cart      → adds to Glue IQ's local cart (no nav). Image and
 *                          variant id are pulled from Shopify's public
 *                          `/products/<handle>.js` if we don't already
 *                          have them locally. The cart pill in the corner
 *                          updates instantly.
 *   2. View full page   → same-window nav to the Anson PDP for full info.
 *   3. Keep shopping    → close drawer; you stay on the screen you were on.
 *
 * The drawer NEVER opens a new tab on its own.
 */
export function ProductDrawer({ product, onClose }: ProductDrawerProps) {
  const { addToCart, openCart, totalItems } = useCart();
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetched product snapshot from Anson — only used when the local
   * data files didn't already give us an image / description (most tools,
   * a handful of newly-listed glues). Hidden from the user; just makes
   * the drawer feel "real" for every product on Anson.
   */
  const [fetched, setFetched] = useState<ResolvedProduct | null>(null);

  // Esc closes. Lock body scroll while open (iOS-safe pattern — same as
  // the image lightbox).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
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
  }, [onClose]);

  // Always look up the live product — gives us the variant id we need at
  // Add-to-Cart time, AND backfills image + description for tools that
  // aren't in the local data files.
  useEffect(() => {
    let cancelled = false;
    resolveProduct(product.productUrl)
      .then((r) => {
        if (!cancelled) setFetched(r);
      })
      .catch((e) => {
        // Don't surface this to the user yet — the drawer still works for
        // View/Keep Shopping. The error only matters if they try to add
        // to the cart, and handleAdd has its own error path.
        console.warn('[Glue IQ] resolveProduct failed:', e);
      });
    return () => {
      cancelled = true;
    };
  }, [product.productUrl]);

  // Merge: prefer the static local image (faster) but fall back to the
  // fetched one. Same for description.
  const displayImage = product.imageUrl ?? fetched?.imageUrl ?? null;
  const displayDesc = product.description ?? fetched?.description;
  const displayName = product.name || fetched?.name || 'Anson Product';

  const handleAdd = async () => {
    setAdding(true);
    setError(null);
    try {
      // addToCart resolves the variant id internally (cached). Image is
      // picked up here so the cart line shows the right photo.
      await addToCart(
        { ...product, imageUrl: displayImage, description: displayDesc, name: displayName },
        qty
      );
      setAdded(true);
      // Brief success, then close so the user sees the cart pill update.
      setTimeout(() => onClose(), 1200);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Add to cart failed.');
      setAdding(false);
    }
  };

  const viewOnAnson = () => {
    if (typeof window !== 'undefined') {
      window.location.href = product.productUrl;
    }
  };

  const goToCart = () => {
    onClose();
    openCart();
  };

  if (typeof document === 'undefined') return null;
  return createPortal(
    <div
      className="drawer-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={displayName}
      onClick={onClose}
    >
      <div className="drawer-panel" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="drawer-close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>
        <div className="drawer-grip" aria-hidden />

        <div className="drawer-head">
          {displayImage ? (
            <img
              src={displayImage}
              alt={displayName}
              className="drawer-img"
              loading="lazy"
            />
          ) : (
            <GlueStickPlaceholder
              color="gold"
              className="drawer-img drawer-img-placeholder"
            />
          )}
          <div className="drawer-head-text">
            <h3 className="drawer-name">{displayName}</h3>
            {displayDesc ? (
              <p className="drawer-desc">{displayDesc}</p>
            ) : null}
          </div>
        </div>

        <div className="drawer-qty">
          <span className="drawer-qty-label">Quantity</span>
          <div className="drawer-stepper" role="group" aria-label="Quantity">
            <button
              type="button"
              className="drawer-stepper-btn"
              onClick={() => setQty(Math.max(1, qty - 1))}
              aria-label="Decrease quantity"
              disabled={qty <= 1 || adding}
            >
              −
            </button>
            <span className="drawer-stepper-value" aria-live="polite">
              {qty}
            </span>
            <button
              type="button"
              className="drawer-stepper-btn"
              onClick={() => setQty(Math.min(20, qty + 1))}
              aria-label="Increase quantity"
              disabled={qty >= 20 || adding}
            >
              +
            </button>
          </div>
        </div>

        {error ? <p className="drawer-error">{error}</p> : null}

        <div className="drawer-actions">
          {added ? (
            <button
              type="button"
              className="drawer-cta drawer-cta-primary"
              onClick={goToCart}
            >
              <span aria-hidden>✓</span>
              <span>Added — view cart ({totalItems})</span>
            </button>
          ) : (
            <button
              type="button"
              className="drawer-cta drawer-cta-primary"
              onClick={() => void handleAdd()}
              disabled={adding}
            >
              {adding ? (
                <span>Adding…</span>
              ) : (
                <>
                  <span aria-hidden>🛒</span>
                  <span>
                    Add {qty > 1 ? `${qty} ` : ''}to cart
                  </span>
                </>
              )}
            </button>
          )}
          <button
            type="button"
            className="drawer-cta drawer-cta-secondary"
            onClick={viewOnAnson}
            disabled={adding}
          >
            View full page on Anson
          </button>
          <button
            type="button"
            className="drawer-cta drawer-cta-tertiary"
            onClick={onClose}
            disabled={adding}
          >
            Keep shopping in Glue IQ
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
