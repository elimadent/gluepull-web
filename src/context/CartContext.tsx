import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { CartPanel } from '@/components/CartPanel';
import { CartPill } from '@/components/CartPill';
import { ProductDrawer, type DrawerProductRef } from '@/components/ProductDrawer';
import { ansonProducts } from '@/data/products';
import { tools } from '@/data/tools';
import { resolveVariant } from '@/services/shopify';

/*
 * Cart context — owns BOTH the product drawer (slide-up sheet that opens on
 * any Anson product link tap) AND the local cart line-items collected from
 * those drawer Add-to-Cart taps.
 *
 * In-app Add-to-Cart works WITHOUT a Storefront API token by leaning on
 * Shopify's two public, cross-origin-open conventions:
 *   1. `/products/<handle>.js` returns the product with its variants — used
 *      to resolve a variant id at Add-to-Cart time. No auth needed.
 *   2. `/cart/<variant>:<qty>,<variant>:<qty>,...` is a cart permalink —
 *      visiting it adds those line items to the Anson cart and lands the
 *      user on the cart page. Used at checkout time to sync the local
 *      Glue IQ cart over to Anson in a single navigation.
 *
 * The user never leaves Glue IQ between opening the drawer and tapping
 * Checkout on Anson. Line items accumulate locally; the cart pill in the
 * corner reflects the count; tapping it opens the cart panel for review.
 */

interface CartLine {
  variantId: number;
  productHandle: string;
  productUrl: string;
  name: string;
  imageUrl: string | null;
  qty: number;
}

interface CartContextValue {
  // Drawer state (Buy-link interception)
  open: DrawerProductRef | null;
  openDrawer: (p: DrawerProductRef) => void;
  closeDrawer: () => void;

  // Cart state
  lines: CartLine[];
  totalItems: number;
  addToCart: (product: DrawerProductRef, qty: number) => Promise<void>;
  setLineQty: (variantId: number, qty: number) => void;
  removeLine: (variantId: number) => void;
  clearCart: () => void;

  // Cart panel state
  cartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const STORAGE_KEY_CART = 'glueiq.cart.v1';

function buildUrlIndex(): Map<string, DrawerProductRef> {
  const m = new Map<string, DrawerProductRef>();
  for (const [glueId, p] of Object.entries(ansonProducts)) {
    if (!p.matched) continue;
    const key = stripQueryHash(p.productUrl);
    m.set(key, {
      glueId,
      name: p.name,
      imageUrl: p.imageUrl,
      description: p.description,
      productUrl: p.productUrl,
    });
  }
  for (const t of tools) {
    const key = stripQueryHash(t.url);
    if (m.has(key)) continue; // glue takes precedence
    m.set(key, {
      name: t.name,
      imageUrl: null,
      description: t.notes || undefined,
      productUrl: t.url,
    });
  }
  return m;
}

function stripQueryHash(url: string): string {
  return url.split('?')[0].split('#')[0];
}

function fallbackFromUrl(url: string): DrawerProductRef {
  const clean = stripQueryHash(url);
  const handle = clean.match(/\/products\/([^/?#]+)/)?.[1] ?? '';
  const name = handle
    ? handle.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
    : 'Anson Product';
  return { name, imageUrl: null, productUrl: clean };
}

function loadStoredCart(): CartLine[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_CART);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (l): l is CartLine =>
        l &&
        typeof l.variantId === 'number' &&
        typeof l.productHandle === 'string' &&
        typeof l.qty === 'number' &&
        l.qty > 0
    );
  } catch {
    return [];
  }
}

function writeStoredCart(lines: CartLine[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY_CART, JSON.stringify(lines));
  } catch {
    /* Safari private mode etc. */
  }
}

function handleFromUrl(url: string): string {
  return stripQueryHash(url).match(/\/products\/([^/?#]+)/)?.[1] ?? '';
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState<DrawerProductRef | null>(null);
  const [lines, setLines] = useState<CartLine[]>(loadStoredCart);
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);

  const urlIndex = useMemo(buildUrlIndex, []);

  // Brief confirmation flash on add-to-cart (the floating pill badge updates
  // too, but the toast makes the "it went in the in-app cart, not Anson"
  // behavior unmistakable).
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 1800);
  }, []);

  // Persist cart on every change.
  useEffect(() => {
    writeStoredCart(lines);
  }, [lines]);

  // Global click interceptor — see top-of-file comment.
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (e.defaultPrevented) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (e.button !== 0) return;

      const target = e.target as HTMLElement | null;
      const anchor = target?.closest(
        'a[href*="ansonpdr.com/products/"]'
      ) as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.dataset.skipDrawer === 'true') return;

      e.preventDefault();
      const key = stripQueryHash(anchor.href);
      const ref = urlIndex.get(key) ?? fallbackFromUrl(anchor.href);
      setOpen(ref);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [urlIndex]);

  const openDrawer = useCallback((p: DrawerProductRef) => setOpen(p), []);
  const closeDrawer = useCallback(() => setOpen(null), []);

  /** Add to Glue IQ's local cart. Looks up the Shopify variant id (cached
   *  per session + persisted) so the cart permalink at checkout time has
   *  everything it needs. */
  const addToCart = useCallback(
    async (product: DrawerProductRef, qty: number) => {
      const variant = await resolveVariant(product.productUrl);
      const handle = handleFromUrl(product.productUrl);
      setLines((prev) => {
        const existing = prev.find((l) => l.variantId === variant.variantId);
        if (existing) {
          // Same variant already in cart — bump quantity.
          return prev.map((l) =>
            l.variantId === variant.variantId ? { ...l, qty: l.qty + qty } : l
          );
        }
        return [
          ...prev,
          {
            variantId: variant.variantId,
            productHandle: handle,
            productUrl: stripQueryHash(product.productUrl),
            name: product.name,
            imageUrl: product.imageUrl,
            qty,
          },
        ];
      });
      showToast('Added to cart');
    },
    [showToast]
  );

  const setLineQty = useCallback((variantId: number, qty: number) => {
    setLines((prev) =>
      qty <= 0
        ? prev.filter((l) => l.variantId !== variantId)
        : prev.map((l) => (l.variantId === variantId ? { ...l, qty } : l))
    );
  }, []);

  const removeLine = useCallback((variantId: number) => {
    setLines((prev) => prev.filter((l) => l.variantId !== variantId));
  }, []);

  const clearCart = useCallback(() => setLines([]), []);

  const openCart = useCallback(() => setCartOpen(true), []);
  const closeCart = useCallback(() => setCartOpen(false), []);

  const totalItems = useMemo(
    () => lines.reduce((sum, l) => sum + l.qty, 0),
    [lines]
  );

  const value = useMemo<CartContextValue>(
    () => ({
      open,
      openDrawer,
      closeDrawer,
      lines,
      totalItems,
      addToCart,
      setLineQty,
      removeLine,
      clearCart,
      cartOpen,
      openCart,
      closeCart,
    }),
    [
      open,
      openDrawer,
      closeDrawer,
      lines,
      totalItems,
      addToCart,
      setLineQty,
      removeLine,
      clearCart,
      cartOpen,
      openCart,
      closeCart,
    ]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
      {totalItems > 0 ? <CartPill /> : null}
      {open ? <ProductDrawer product={open} onClose={closeDrawer} /> : null}
      {cartOpen ? <CartPanel /> : null}
      <CartToast message={toast} />
    </CartContext.Provider>
  );
}

/** Small on-theme confirmation pill that floats above the tab bar when a
 *  product is added to the in-app cart. Portaled to <body> so it sits above
 *  every stacking context. */
function CartToast({ message }: { message: string | null }) {
  if (typeof document === 'undefined' || !message) return null;
  return createPortal(
    <div className="gp-toast" role="status" aria-live="polite">
      <span aria-hidden>✓</span>
      <span>{message}</span>
    </div>,
    document.body
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within a CartProvider');
  return ctx;
}

export type { CartLine };
