import { Glue } from '@/types';

/**
 * Live best-selling ranking pulled from the Anson Shopify storefront.
 * Produced by src/services/catalog.ts; consumed by the Glue Library so the
 * list can be ordered by what's actually selling, with optional "featured"
 * glues pinned to the top.
 *
 * This module is intentionally pure (no fetch, no React) so it's unit-testable
 * and reusable from any screen.
 */
export interface BestSellerRanking {
  /** Shopify product handle → 0-based best-selling rank (lower = sells more). */
  rankByHandle: Record<string, number>;
  /** Handles carrying the configured `glue-featured` tag. */
  featuredHandles: string[];
}

export interface OrderOptions {
  /** Lift featured glues to the very top (in their own best-selling order) and
   *  remove them from the ranked remainder below. Defaults to true. */
  pinFeatured?: boolean;
}

/** Glues missing from the live ranking sort after every ranked glue. */
const UNRANKED = Number.MAX_SAFE_INTEGER;

/**
 * Order `glues` by Shopify best-selling rank.
 *
 * - Glues absent from the ranking sink to the bottom, preserving their input
 *   order (stable) so the list never loses or shuffles unknown products.
 * - With `pinFeatured` (default), any glue tagged `glue-featured` is lifted to
 *   the top — ordered among themselves by best-selling rank — and excluded from
 *   the ranked remainder, matching the store owner's spec.
 * - A null ranking (no token / feed unavailable) returns the input untouched so
 *   callers degrade gracefully to whatever order they passed in.
 */
export function orderGluesByBestSeller(
  glues: Glue[],
  ranking: BestSellerRanking | null,
  options: OrderOptions = {}
): Glue[] {
  if (!ranking) return glues;

  const pin = options.pinFeatured ?? true;
  const featured = new Set(pin ? ranking.featuredHandles : []);

  const rankOf = (g: Glue): number => {
    const r = ranking.rankByHandle[g.ansonHandle];
    return typeof r === 'number' ? r : UNRANKED;
  };

  // Decorate-sort-undecorate, keeping original index as the stable tiebreaker.
  const decorated = glues.map((g, i) => ({ g, i }));
  const byRank = (
    a: { g: Glue; i: number },
    b: { g: Glue; i: number }
  ): number => rankOf(a.g) - rankOf(b.g) || a.i - b.i;

  const top = decorated
    .filter((x) => featured.has(x.g.ansonHandle))
    .sort(byRank);
  const rest = decorated
    .filter((x) => !featured.has(x.g.ansonHandle))
    .sort(byRank);

  return [...top, ...rest].map((x) => x.g);
}
