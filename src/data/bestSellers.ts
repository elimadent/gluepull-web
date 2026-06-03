/*
 * Curated best-seller fallback.
 *
 * The app prefers Anson's LIVE best sellers (Storefront API, see
 * services/bestSellers.ts). When that call can't be reached — token/CORS
 * issues, offline, or the build host's network policy — we fall back to this
 * hand-maintained, ordered list so the Paired Rig and "Dial In Your Pull"
 * carousels still lead with the products we want featured.
 *
 * Ordering = best seller first (index 0 wins ties). These are Anson product
 * handles (the slug in /products/<handle>). Edit freely; replace with Anson's
 * real best-seller order once confirmed.
 */
export const CURATED_BEST_SELLERS: string[] = [
  // Guns — Trifecta cordless leads the gun slot.
  'trifecta-ryobi-makita-bosch-dewalt-cordless-glue-gun',
];
