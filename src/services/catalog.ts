/*
 * Live catalog feed — pulls the Anson Shopify storefront's best-selling product
 * ranking so the Glue Library can be ordered by what's actually selling.
 *
 * Auth: a Shopify STOREFRONT API access token (browser-safe), supplied via the
 * `VITE_SHOPIFY_STOREFRONT_TOKEN` build env var OR a runtime `window
 * .GLUEIQ_SHOPIFY_TOKEN` injection — same convention as services/shopify.ts.
 *
 *   IMPORTANT: this must be the Storefront token (publishable), NOT an Admin
 *   API token/secret (`shpss_…` / `shpat_admin…`). Admin credentials are
 *   server-only, are blocked by CORS in the browser, and would leak if shipped
 *   in the widget. See GLUEIQ_BIBLE.md §5.
 *
 * Scope required on the custom app: `unauthenticated_read_product_listings`.
 *
 * No token / any failure → returns null and callers fall back to the static
 * glue order. The result is cached in localStorage for an hour so repeat loads
 * are instant and we don't hammer the API.
 */
import { BestSellerRanking } from '@/logic/bestSellers';

const STOREFRONT_API_VERSION = '2024-07';
const ANSON_HOST = 'ansonpdr.com';

/** Product tag that pins a glue to the top of the Library (see bible §4 R3). */
export const GLUE_FEATURED_TAG = 'glue-featured';

const CACHE_KEY = 'glueiq.bestsellers.v1';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
const MAX_PAGES = 10; // 250 × 10 = 2500 products, well above the catalog size

declare global {
  interface Window {
    GLUEIQ_SHOPIFY_TOKEN?: string;
  }
}

function storefrontToken(): string | undefined {
  const envToken =
    typeof import.meta !== 'undefined' &&
    (import.meta as ImportMeta & { env?: Record<string, string> }).env
      ?.VITE_SHOPIFY_STOREFRONT_TOKEN;
  const runtimeToken =
    typeof window !== 'undefined' ? window.GLUEIQ_SHOPIFY_TOKEN : undefined;
  return envToken || runtimeToken || undefined;
}

/** True when a Storefront token is configured — the live feed can be attempted. */
export function hasLiveCatalog(): boolean {
  return Boolean(storefrontToken());
}

interface CachePayload {
  at: number;
  ranking: BestSellerRanking;
}

function readCache(): BestSellerRanking | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const payload = JSON.parse(raw) as CachePayload;
    if (Date.now() - payload.at > CACHE_TTL_MS) return null;
    return payload.ranking;
  } catch {
    return null;
  }
}

function writeCache(ranking: BestSellerRanking): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ at: Date.now(), ranking } satisfies CachePayload)
    );
  } catch {
    /* Safari private mode etc. — non-fatal, we just refetch next time. */
  }
}

interface ProductNode {
  handle: string;
  tags: string[];
}

interface GraphQLResponse {
  data?: {
    products?: {
      edges: Array<{ node: ProductNode }>;
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
    };
  };
  errors?: Array<{ message: string }>;
}

const BEST_SELLERS_QUERY = `
query GlueIQBestSellers($cursor: String) {
  products(first: 250, sortKey: BEST_SELLING, after: $cursor) {
    edges { node { handle tags } }
    pageInfo { hasNextPage endCursor }
  }
}`;

async function fetchAllProducts(token: string): Promise<ProductNode[]> {
  const endpoint = `https://${ANSON_HOST}/api/${STOREFRONT_API_VERSION}/graphql.json`;
  const nodes: ProductNode[] = [];
  let cursor: string | null = null;

  for (let page = 0; page < MAX_PAGES; page++) {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'X-Shopify-Storefront-Access-Token': token,
      },
      body: JSON.stringify({
        query: BEST_SELLERS_QUERY,
        variables: { cursor },
      }),
    });
    if (!res.ok) throw new Error(`Storefront API responded ${res.status}`);

    const json = (await res.json()) as GraphQLResponse;
    if (json.errors?.length) throw new Error(json.errors[0].message);

    const conn = json.data?.products;
    if (!conn) break;
    nodes.push(...conn.edges.map((e) => e.node));

    if (!conn.pageInfo.hasNextPage || !conn.pageInfo.endCursor) break;
    cursor = conn.pageInfo.endCursor;
  }

  return nodes;
}

/**
 * Fetch the live best-selling ranking from the Anson storefront. Returns null
 * when no token is configured or the request fails — the caller then keeps the
 * static order. Successful results are cached in localStorage for an hour.
 */
export async function fetchBestSellerRanking(): Promise<BestSellerRanking | null> {
  const token = storefrontToken();
  if (!token) return null;

  const cached = readCache();
  if (cached) return cached;

  try {
    const products = await fetchAllProducts(token);
    const rankByHandle: Record<string, number> = {};
    const featuredHandles: string[] = [];

    products.forEach((p, index) => {
      rankByHandle[p.handle] = index; // products() came back already best-selling-sorted
      if (p.tags?.some((t) => t.trim().toLowerCase() === GLUE_FEATURED_TAG)) {
        featuredHandles.push(p.handle);
      }
    });

    const ranking: BestSellerRanking = { rankByHandle, featuredHandles };
    writeCache(ranking);
    return ranking;
  } catch (err) {
    console.warn(
      '[Glue IQ] best-seller feed unavailable, using static order:',
      err
    );
    return null;
  }
}
