/**
 * Decide whether an external link should open in the current tab or a new one.
 *
 * - On Anson's own Shopify storefront (ansonpdr.com), every Buy URL is
 *   same-origin → open in the SAME tab so the customer stays in the shopping
 *   flow (cart, checkout, etc).
 * - On the dev server (192.168.x.x) or any other host, the Anson URL is
 *   cross-origin → open in a NEW tab so we don't lose the test page.
 *
 * Same logic without us having to hardcode "ansonpdr.com" — just compare
 * hostnames of the link vs the page.
 */
export function linkTarget(url: string): '_self' | '_blank' {
  if (typeof window === 'undefined') return '_blank';
  try {
    const linkHost = new URL(url, window.location.href).hostname;
    return linkHost === window.location.hostname ? '_self' : '_blank';
  } catch {
    return '_blank';
  }
}
