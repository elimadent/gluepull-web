import { useMemo, useState } from 'react';
import { GlueCard } from '@/components/GlueCard';
import { Screen } from '@/components/Screen';
import { glues } from '@/data/glues';
import { useBestSellerOrder } from '@/hooks/useBestSellerOrder';
import { orderGluesByBestSeller } from '@/logic/bestSellers';
import { Glue } from '@/types';

type Band = 'All' | 'Hot' | 'Warm' | 'Moderate' | 'Cool' | 'Cold';
const BANDS: Band[] = ['All', 'Hot', 'Warm', 'Moderate', 'Cool', 'Cold'];

/** How the list is ordered. Best-selling is the store owner's preferred default;
 *  it needs the live Shopify feed and falls back to temp order without it. */
type SortMode = 'best-selling' | 'temp';

function bandFor(glue: Glue): Band {
  const mid = (glue.optimalTemp.min + glue.optimalTemp.max) / 2;
  if (mid >= 90) return 'Hot';
  if (mid >= 80) return 'Warm';
  if (mid >= 70) return 'Moderate';
  if (mid >= 60) return 'Cool';
  return 'Cold';
}

/** Coldest → hottest by midpoint, then by name — the original static order. */
function byTemp(a: Glue, b: Glue): number {
  const am = (a.optimalTemp.min + a.optimalTemp.max) / 2;
  const bm = (b.optimalTemp.min + b.optimalTemp.max) / 2;
  return am - bm || a.name.localeCompare(b.name);
}

/**
 * Static catalog of every glue in the dataset. Intentionally does NOT score
 * against current weather, that's the Home screen's job. This view is a
 * browseable reference: search + filter by temperature band, ordered either by
 * live best-selling rank (from the Anson Shopify storefront) or temp range.
 */
export function GlueLibraryScreen() {
  const [query, setQuery] = useState('');
  const [band, setBand] = useState<Band>('All');
  const [sort, setSort] = useState<SortMode>('best-selling');

  // Live best-selling ranking from Shopify. Resolves to `static` with no token.
  const { ranking, status } = useBestSellerOrder();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = glues
      .filter((g) => band === 'All' || bandFor(g) === band)
      .filter(
        (g) =>
          !q ||
          g.name.toLowerCase().includes(q) ||
          g.color.toLowerCase().includes(q) ||
          g.brand.toLowerCase().includes(q) ||
          g.chartConditions.toLowerCase().includes(q)
      );

    // Best-selling order needs the live feed; without it, fall back to temp.
    if (sort === 'best-selling' && ranking) {
      return orderGluesByBestSeller(base, ranking, { pinFeatured: true });
    }
    return [...base].sort(byTemp);
  }, [query, band, sort, ranking]);

  // Honest about ordering: live popularity, loading, or temp-range fallback.
  const liveBestSelling = sort === 'best-selling' && status === 'live';
  const orderNote =
    sort === 'temp'
      ? 'sorted by temperature range'
      : status === 'live'
        ? 'sorted by best sellers (live)'
        : status === 'loading'
          ? 'loading best sellers…'
          : 'sorted by temperature range';

  return (
    <Screen
      title="Glue Library"
      subtitle={`${glues.length} glues · ${orderNote}.`}
    >
      <div className="controls">
        <input
          className="search"
          type="search"
          placeholder="Search name, brand, color, conditions…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoCorrect="off"
        />
        <div className="bands">
          <button
            type="button"
            className={`band${sort === 'best-selling' ? ' active' : ''}`}
            onClick={() => setSort('best-selling')}
            title={
              status === 'live'
                ? 'Ordered by live Shopify sales'
                : 'Best-selling order activates when the live feed is configured'
            }
          >
            Best selling
          </button>
          <button
            type="button"
            className={`band${sort === 'temp' ? ' active' : ''}`}
            onClick={() => setSort('temp')}
          >
            Temp range
          </button>
        </div>
        <div className="bands">
          {BANDS.map((b) => (
            <button
              key={b}
              type="button"
              className={`band${band === b ? ' active' : ''}`}
              onClick={() => setBand(b)}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      <div className="list-pad">
        {filtered.length ? (
          filtered.map((g, i) => (
            <GlueCard
              key={g.id}
              glue={g}
              badge={
                liveBestSelling && ranking?.featuredHandles.includes(g.ansonHandle)
                  ? 'Featured'
                  : liveBestSelling && i === 0
                    ? '#1 best seller'
                    : undefined
              }
            />
          ))
        ) : (
          <div className="empty">No glues match that search.</div>
        )}
      </div>
    </Screen>
  );
}
