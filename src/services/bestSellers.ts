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
 * tiebreak. Every failure path (wrong handle, offline, CORS, empty) falls back
 * to the curated list in data/bestSellers.ts, then to the prior rules pick.
 *
 * Shopify serves `/collections/<handle>/products.json` publicly with open
 * CORS (same as the `/products/<handle>.js` endpoint the cart already uses).
 * Products come back in the collection's configured sort order, so a
 * "best selling"-sorted collection yields popularity order directly.
 */

import { CURATED_BEST_SELLERS } from '@/data/bestSellers';

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

const STORAGE_KEY = 'glueiq.bestsellers.v2';
const TTL_MS = 12 * 60 * 60 * 1000; // 12h — popularity drifts slowly.

/**
 * Anson Storefront API public access token. Storefront tokens are read-only
 * and designed by Shopify to ship in client-side JS (headless storefronts) —
 * unlike Admin tokens, which must never be exposed. Override at build time
 * with VITE_SHOPIFY_STOREFRONT_TOKEN or at runtime via window.GLUEIQ_SHOPIFY_TOKEN.
 */
const DEFAULT_STOREFRONT_TOKEN = 'e7ae3d3206b9f2a960ff326fbe1eac1d';
const STOREFRONT_API_VERSION = '2024-04';

interface CachedBestSellers {
  handles: string[];
  ts: number;
}

let inflight: Promise<string[]> | null = null;

function storefrontToken(): string | undefined {
  const fromEnv =
    typeof import.meta !== 'undefined'
      ? (import.meta as ImportMeta & { env?: Record<string, string> }).env
          ?.VITE_SHOPIFY_STOREFRONT_TOKEN
      : undefined;
  const fromWindow =
    typeof window !== 'undefined' ? window.GLUEIQ_SHOPIFY_TOKEN : undefined;
  return fromEnv || fromWindow || DEFAULT_STOREFRONT_TOKEN;
}

function collectionUrl(handle: string): string {
  return `https://ansonpdr.com/collections/${handle}/products.json?limit=250`;
}

const FETCH_TIMEOUT_MS = 4000;

/** fetch() that aborts after FETCH_TIMEOUT_MS so a hung Anson request can never
 *  block best-seller resolution (and thus the editorial pins) indefinitely. */
async function fetchWithTimeout(url: string, init?: RequestInit): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** Editorial pins always lead, in this order; live/cached best sellers fill in
 *  the rest (deduped). Lets us guarantee the featured gun (Trifecta) is
 *  suggested over Surebonder/Tec everywhere, regardless of the live API. */
function mergePinned(live: string[]): string[] {
  const pinned = new Set(CURATED_BEST_SELLERS);
  return [...CURATED_BEST_SELLERS, ...live.filter((h) => !pinned.has(h))];
}

/**
 * Authoritative path: ask the Storefront API for products sorted by
 * BEST_SELLING (store-wide). Returns handles in best-selling order.
 */
async function fetchBestSellingViaStorefront(): Promise<string[]> {
  const token = storefrontToken();
  if (!token) return [];
  const query =
    '{ products(first: 100, sortKey: BEST_SELLING) { edges { node { handle } } } }';
  try {
    const res = await fetchWithTimeout(
      `https://ansonpdr.com/api/${STOREFRONT_API_VERSION}/graphql.json`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-Shopify-Storefront-Access-Token': token,
        },
        body: JSON.stringify({ query }),
      }
    );
    if (!res.ok) return [];
    const json = (await res.json()) as {
      data?: { products?: { edges?: Array<{ node?: { handle?: string } }> } };
    };
    return (json.data?.products?.edges ?? [])
      .map((e) => e.node?.handle)
      .filter((h): h is string => typeof h === 'string' && h.length > 0);
  } catch {
    return [];
  }
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
      const res = await fetchWithTimeout(collectionUrl(handle), {
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
 * Ordered best-seller product handles (best seller first), with the editorial
 * pins (curated list) ALWAYS leading and live/cached Anson best sellers filling
 * in the rest. Cached in-memory (shared via a single in-flight promise) and in
 * localStorage with a TTL.
 */
export async function getBestSellerHandles(): Promise<string[]> {
  const cached = readCache();
  if (cached && Date.now() - cached.ts < TTL_MS) return mergePinned(cached.handles);
  if (inflight) return inflight;

  inflight = (async () => {
    // Storefront API (BEST_SELLING) is authoritative; the named-collection
    // probe is the fallback if no token / the API path fails.
    let live = await fetchBestSellingViaStorefront();
    if (!live.length) live = await fetchCollectionHandles();
    if (live.length) writeCache(live);
    else live = cached?.handles ?? []; // keep any stale (previously-good) list
    return mergePinned(live);
  })()
    .catch(() => mergePinned(cached?.handles ?? []))
    .finally(() => {
      inflight = null;
    });

  return inflight;
}
