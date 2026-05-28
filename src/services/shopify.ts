/*
 * Shopify Add-to-Cart engine. Detects the runtime environment and picks the
 * right strategy:
 *
 *   1. Widget mode (Glue IQ embedded on ansonpdr.com)
 *      → Shopify Ajax cart endpoint /cart/add.js — adds in place, no nav.
 *
 *   2. Storefront API mode (token configured)
 *      → Future: cross-origin Add-to-Cart via Storefront API GraphQL.
 *        Triggered by `window.GLUEIQ_SHOPIFY_TOKEN` being set OR a
 *        `VITE_SHOPIFY_STOREFRONT_TOKEN` env var.
 *
 *   3. Standalone fallback (separate domain, no token)
 *      → Navigate the current window to the Anson PDP with `?quantity=N` so
 *        the PDP loads with the right qty preselected. The user taps "Add
 *        to Cart" once on Anson, then their browser back returns them to
 *        Glue IQ on the exact card they were on (scroll position preserved
 *        by the App-level localStorage memory).
 */

declare global {
  interface Window {
    GLUEIQ_SHOPIFY_TOKEN?: string;
  }
}

/** Minimum-viable variant info we need for in-app cart construction. */
export interface ResolvedVariant {
  variantId: number;
  /** Variant title (e.g. "10 sticks", "30 sticks") when there are options. */
  variantTitle?: string;
  /** Price in shop currency. Optional — Shopify returns cents as a number. */
  priceCents?: number;
}

/** Product snapshot useful for the drawer (image + description) when the
 *  local data files don't have them yet (e.g. tools, or newly-listed glues). */
export interface ResolvedProduct extends ResolvedVariant {
  name: string;
  imageUrl: string | null;
  /** Plain-text product description, capped so it fits the drawer. */
  description?: string;
}

const variantCache = new Map<string, ResolvedProduct>();
const STORAGE_KEY_VARIANTS = 'glueiq.variants.v1';

function readVariantStorage(): Record<string, ResolvedProduct> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_VARIANTS);
    return raw ? (JSON.parse(raw) as Record<string, ResolvedProduct>) : {};
  } catch {
    return {};
  }
}

function writeVariantStorage(map: Record<string, ResolvedProduct>): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY_VARIANTS, JSON.stringify(map));
  } catch {
    /* Safari private mode etc. */
  }
}

function handleFromAnyUrl(productUrl: string): string | null {
  const m = productUrl.match(/\/products\/([^/?#]+)/);
  return m ? m[1] : null;
}

function ansonProductJsonUrl(handle: string): string {
  // Always hit the canonical Anson host so this works from the dev server too.
  return `https://ansonpdr.com/products/${handle}.js`;
}

function stripHtml(html: string): string {
  if (!html) return '';
  // Cheap-and-cheerful HTML → text. Good enough for the drawer descriptor.
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Strip any `?v=…` Shopify cache-buster off an image URL. */
function cleanImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.split('?')[0];
}

/**
 * Look up a product by URL. Returns the variant id (for cart construction),
 * the first product image (for the drawer when local data has none), name,
 * and a short description. Cached in-memory AND in localStorage so the
 * second open of any given product is instant.
 *
 * Throws if the URL can't be parsed or the product can't be fetched.
 */
export async function resolveProduct(productUrl: string): Promise<ResolvedProduct> {
  const handle = handleFromAnyUrl(productUrl);
  if (!handle) throw new Error('Could not parse Anson product handle from URL.');

  const memo = variantCache.get(handle);
  if (memo) return memo;

  const stored = readVariantStorage()[handle];
  if (stored) {
    variantCache.set(handle, stored);
    return stored;
  }

  const res = await fetch(ansonProductJsonUrl(handle), {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Anson product fetch failed (${res.status}).`);
  }
  const data: {
    title?: string;
    description?: string;
    featured_image?: string;
    images?: string[];
    variants?: Array<{
      id: number;
      title?: string;
      available?: boolean;
      price?: number;
    }>;
  } = await res.json();

  const variant =
    data.variants?.find((v) => v.available) ?? data.variants?.[0];
  if (!variant) throw new Error('No variants on the Anson product.');

  const resolved: ResolvedProduct = {
    variantId: variant.id,
    variantTitle: variant.title && variant.title !== 'Default Title' ? variant.title : undefined,
    priceCents: typeof variant.price === 'number' ? variant.price : undefined,
    name: data.title ?? handle,
    imageUrl: cleanImageUrl(data.featured_image ?? data.images?.[0] ?? null),
    description: data.description ? stripHtml(data.description).slice(0, 280) : undefined,
  };

  variantCache.set(handle, resolved);
  const stored2 = readVariantStorage();
  stored2[handle] = resolved;
  writeVariantStorage(stored2);

  return resolved;
}

/** Slim variant-only lookup. Same cache as resolveProduct. */
export async function resolveVariant(productUrl: string): Promise<ResolvedVariant> {
  return resolveProduct(productUrl);
}

/** Build a Shopify cart permalink that adds the given lines to the user's
 *  Anson cart in a single navigation. */
export function buildCartPermalink(
  lines: Array<{ variantId: number; qty: number }>
): string {
  if (!lines.length) return 'https://ansonpdr.com/cart';
  const segments = lines.map((l) => `${l.variantId}:${l.qty}`).join(',');
  return `https://ansonpdr.com/cart/${segments}`;
}

export type AddToCartMode = 'widget-ajax' | 'storefront-api' | 'standalone-nav';

export interface AddToCartResult {
  mode: AddToCartMode;
  /** True when the item went straight into the cart and the drawer can show
   *  a success state. False when we navigated away (the user is now on Anson). */
  inPlace: boolean;
}

const ANSON_HOST = 'ansonpdr.com';

function detectMode(): AddToCartMode {
  if (typeof window === 'undefined') return 'standalone-nav';
  const host = window.location.hostname.toLowerCase();
  if (host === ANSON_HOST || host.endsWith('.' + ANSON_HOST)) {
    return 'widget-ajax';
  }
  // Build-time token (Vite env var) OR runtime injection both light up the
  // Storefront API path. Token not yet configured → fall through to nav.
  const token =
    (typeof import.meta !== 'undefined' &&
      (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_SHOPIFY_STOREFRONT_TOKEN) ||
    window.GLUEIQ_SHOPIFY_TOKEN;
  if (token) return 'storefront-api';
  return 'standalone-nav';
}

/** Append/replace `?quantity=N` on a Shopify product URL. Anson's PDPs honor
 *  this query param and preselect the quantity in the qty field. */
function withQuantity(productUrl: string, qty: number): string {
  try {
    const u = new URL(productUrl);
    if (qty > 1) u.searchParams.set('quantity', String(qty));
    return u.toString();
  } catch {
    return productUrl;
  }
}

/** Extract a Shopify product handle from a `/products/<handle>` URL. */
function handleFromUrl(productUrl: string): string | null {
  const m = productUrl.match(/\/products\/([^/?#]+)/);
  return m ? m[1] : null;
}

async function widgetAjaxAddToCart(productUrl: string, qty: number): Promise<void> {
  const handle = handleFromUrl(productUrl);
  if (!handle) throw new Error('Could not parse product handle from URL');

  // Step 1: fetch product to get the first/default variant id
  const productRes = await fetch(`/products/${handle}.js`, {
    headers: { Accept: 'application/json' },
  });
  if (!productRes.ok) throw new Error(`Product fetch failed (${productRes.status})`);
  const product: { variants?: Array<{ id: number; available: boolean }> } = await productRes.json();
  const variant =
    product.variants?.find((v) => v.available) ?? product.variants?.[0];
  if (!variant) throw new Error('No variants found for product');

  // Step 2: POST to Shopify Ajax cart
  const cartRes = await fetch('/cart/add.js', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ id: variant.id, quantity: qty }),
  });
  if (!cartRes.ok) {
    const detail = await cartRes.text().catch(() => '');
    throw new Error(`Add to cart failed (${cartRes.status}): ${detail.slice(0, 80)}`);
  }
}

/**
 * Add a product to the user's Anson cart. Resolves with the mode used and
 * whether the add happened in-place or via navigation. Throws on widget-mode
 * Ajax failure so the drawer can surface the error and fall back.
 */
export async function addProductToCart(
  productUrl: string,
  qty: number
): Promise<AddToCartResult> {
  const mode = detectMode();

  if (mode === 'widget-ajax') {
    try {
      await widgetAjaxAddToCart(productUrl, qty);
      return { mode, inPlace: true };
    } catch (err) {
      // Ajax failed (auth, rate limit, etc.) — fall back to nav so the user
      // still gets a path to checkout.
      console.warn('[Glue IQ] Ajax cart add failed, navigating:', err);
      window.location.href = withQuantity(productUrl, qty);
      return { mode: 'standalone-nav', inPlace: false };
    }
  }

  if (mode === 'storefront-api') {
    // TODO: wire Storefront API GraphQL cartLinesAdd when token lands.
    // Placeholder for now — fall through to nav so behavior is correct.
    window.location.href = withQuantity(productUrl, qty);
    return { mode: 'standalone-nav', inPlace: false };
  }

  // Standalone fallback — same-window navigation with quantity preselected.
  window.location.href = withQuantity(productUrl, qty);
  return { mode: 'standalone-nav', inPlace: false };
}

/** Same-window nav to the product page (no quantity injection). Used by
 *  the "View on Anson" CTA. */
export function viewOnAnson(productUrl: string): void {
  if (typeof window !== 'undefined') {
    window.location.href = productUrl;
  }
}

/** Same-window nav to the Anson cart page — used when the user wants to
 *  finish shopping on Anson directly. */
export function viewAnsonCart(): void {
  if (typeof window !== 'undefined') {
    window.location.href = 'https://ansonpdr.com/cart';
  }
}

/** Public: which add-to-cart strategy will run right now? Useful for the
 *  drawer to label buttons accurately ("Add to Cart" vs "Add 3 on Anson"). */
export function currentAddToCartMode(): AddToCartMode {
  return detectMode();
}
