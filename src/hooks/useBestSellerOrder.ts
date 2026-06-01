import { useEffect, useState } from 'react';
import { BestSellerRanking } from '@/logic/bestSellers';
import { fetchBestSellerRanking, hasLiveCatalog } from '@/services/catalog';

/**
 * Where the current ordering data comes from:
 *  - `static`  : no Storefront token, or the feed failed → static order.
 *  - `loading` : a token is configured and the feed is in flight.
 *  - `live`    : the Shopify best-selling ranking is in hand.
 */
export type CatalogStatus = 'static' | 'loading' | 'live';

export interface BestSellerState {
  ranking: BestSellerRanking | null;
  status: CatalogStatus;
}

/**
 * Loads the live best-selling ranking once on mount. Safe with no token: it
 * stays in `static` and never fetches. Any failure resolves to `static` too,
 * so consumers can always fall back to whatever order they already have.
 */
export function useBestSellerOrder(): BestSellerState {
  const [ranking, setRanking] = useState<BestSellerRanking | null>(null);
  const [status, setStatus] = useState<CatalogStatus>(
    hasLiveCatalog() ? 'loading' : 'static'
  );

  useEffect(() => {
    if (!hasLiveCatalog()) return;
    let alive = true;

    fetchBestSellerRanking().then((result) => {
      if (!alive) return;
      if (result) {
        setRanking(result);
        setStatus('live');
      } else {
        setStatus('static');
      }
    });

    return () => {
      alive = false;
    };
  }, []);

  return { ranking, status };
}
