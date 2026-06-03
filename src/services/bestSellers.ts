/*
 * Best-sellers signal, sourced from the live Anson "Best Sellers" Shopify
 * collection.
 *
 * The standalone build host can't crawl ansonpdr.com (it isn't allowlisted),
 * but the USER'S BROWSER already talks to ansonpdr.com for cart + product
 * data — so we fetch the collection client-side, cache it, and expose an
 * ordered list of product handles (best seller first).
 *
 * The Paired-Rig matcher uses this to PREFER best-selling products among the
 * tools that already fit the glue + dent: relevance first, popularity as the
 * tiebreak. Every failure path (wrong handle, offline, CORS, empty) degrades
 * silently to the prior rules-based pick.
 *
 * Shopify serves `/collections/<handle>/products.json` publicly with open
 * CORS (same as the `/products/<handle>.js` endpoint the cart already uses).
 * Products come back in the collection's configured sort order, so a
 * "best selling"-sorted collection yields popularity order directly.
 */

declare global {
  interface Window {
    /** Override the collection handle if Anson's isn't one of the defaults. */
    GLUEIQ_BESTSELLERS_COLLECTION?: string;
  }
}

/** Handles we'll probe, in order, until one returns products. */
const CANDIDATE_HANDLES = [
  'best-sellers',
  'bestsellers',
  'best-selling',
  'top-sellers',
  'popular',
];

const STORAGE_KEY = 'glueiq.bestsellers.v1';
const TTL_MS = 12 * 60 * 60 * 1000; // 12h — popularity drifts slowly.

interface CachedBestSellers {
  handles: string[];
  ts: number;
}

let inflight: Promise<string[]> | null = null;

function collectionUrl(handle: string): string {
  return `https://ansonpdr.com/collections/${handle}/products.json?limit=250`;
}

function readCache(): CachedBestSellers | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as CachedBestSellers;
    if (!Array.isArray(c.handles) || typeof c.ts !== 'number') return null;
    return c;
  } catch {
    return null;
  }
}

function writeCache(handles: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ handles, ts: Date.now() } satisfies CachedBestSellers)
    );
  } catch {
    /* Safari private mode etc. */
  }
}

async function fetchCollectionHandles(): Promise<string[]> {
  const configured =
    typeof window !== 'undefined' ? window.GLUEIQ_BESTSELLERS_COLLECTION : undefined;
  const candidates = configured
    ? [configured, ...CANDIDATE_HANDLES]
    : CANDIDATE_HANDLES;

  for (const handle of candidates) {
    try {
      const res = await fetch(collectionUrl(handle), {
        headers: { Accept: 'application/json' },
      });
      if (!res.ok) continue;
      const data = (await res.json()) as { products?: Array<{ handle?: string }> };
      const handles = (data.products ?? [])
        .map((p) => p.handle)
        .filter((h): h is string => typeof h === 'string' && h.length > 0);
      if (handles.length) return handles;
    } catch {
      /* try the next candidate handle */
    }
  }
  return [];
}

/**
 * Ordered best-seller product handles (best seller first). Cached in-memory
 * (shared across all callers via a single in-flight promise) and in
 * localStorage with a TTL. Returns a stale cache or [] on any failure.
 */
export async function getBestSellerHandles(): Promise<string[]> {
  const cached = readCache();
  if (cached && Date.now() - cached.ts < TTL_MS) return cached.handles;
  if (inflight) return inflight;

  inflight = fetchCollectionHandles()
    .then((handles) => {
      if (handles.length) {
        writeCache(handles);
        return handles;
      }
      // Nothing fetched — fall back to any stale cache so a transient miss
      // doesn't wipe a previously-good list.
      return cached?.handles ?? [];
    })
    .catch(() => cached?.handles ?? [])
    .finally(() => {
      inflight = null;
    });

  return inflight;
}
