/*
 * Editorial best-seller PINS.
 *
 * These handles ALWAYS lead the best-seller ranking, ahead of Anson's live
 * Storefront best sellers (which fill in the rest). That guarantees the
 * products we want featured win the pick everywhere they're a valid candidate
 * — the Paired Rig rows AND the "Dial In Your Pull" carousels — regardless of
 * whether the live API is reachable or how it happens to rank things.
 *
 * Ordering = highest priority first. These are Anson product handles (the slug
 * in /products/<handle>). Edit freely.
 */
export const CURATED_BEST_SELLERS: string[] = [
  // Gun: always suggest the Trifecta cordless over the Surebonder/Tec guns.
  'trifecta-ryobi-makita-bosch-dewalt-cordless-glue-gun',
];
