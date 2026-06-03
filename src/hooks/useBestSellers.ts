import { useCallback, useEffect, useMemo, useState } from 'react';
import { getBestSellerHandles } from '@/services/bestSellers';

/** Lower rank = better seller. `undefined` = not in the best-sellers list. */
export type RankFn = (handle: string | null | undefined) => number | undefined;

export interface BestSellerRanker {
  /** Best-seller rank for a product handle, or undefined if not a best seller. */
  rankOf: RankFn;
  /** True once the fetch has resolved (success OR failure). */
  ready: boolean;
}

/**
 * Loads the Anson best-sellers list once and exposes a stable `rankOf`
 * lookup. `rankOf` only changes identity when the underlying data changes,
 * so callers can safely list it in a useMemo/useEffect dependency array.
 */
export function useBestSellers(): BestSellerRanker {
  const [handles, setHandles] = useState<string[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    getBestSellerHandles()
      .then((h) => {
        if (!cancelled) setHandles(h);
      })
      .catch(() => {
        if (!cancelled) setHandles([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const rankMap = useMemo(() => {
    const m = new Map<string, number>();
    (handles ?? []).forEach((h, i) => {
      if (!m.has(h)) m.set(h, i);
    });
    return m;
  }, [handles]);

  const rankOf = useCallback<RankFn>(
    (handle) => (handle ? rankMap.get(handle) : undefined),
    [rankMap]
  );

  return { rankOf, ready: handles !== null };
}
