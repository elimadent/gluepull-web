/**
 * Decide whether an external link should open in the current tab or a new one.
 *
 * For Anson PRODUCT links specifically (`ansonpdr.com/products/...`) the
 * global CartProvider click interceptor opens an in-app drawer regardless of
 * what this returns — so we now default product links to `_self` everywhere
 * to keep behavior consistent if a user opts out of the interceptor via
 * a modifier-click. New-tab is only used for non-product Anson URLs (e.g.
 * `/collections/all`) when accessed from a different host.
 */
export function linkTarget(url: string): '_self' | '_blank' {
  if (typeof window === 'undefined') return '_self';
  try {
    const u = new URL(url, window.location.href);
    const linkHost = u.hostname;
    const isProduct = u.pathname.includes('/products/');
    // Product links always stay in-tab — drawer intercepts them anyway.
    if (isProduct) return '_self';
    // Non-product cross-origin links open in a new tab so the dev/widget host stays.
    return linkHost === window.location.hostname ? '_self' : '_blank';
  } catch {
    return '_self';
  }
}
