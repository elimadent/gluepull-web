import { useMemo, useState } from 'react';
import { GlueCard } from '@/components/GlueCard';
import { Screen } from '@/components/Screen';
import { glues } from '@/data/glues';
import { Glue } from '@/types';

type Band = 'All' | 'Hot' | 'Warm' | 'Moderate' | 'Cool' | 'Cold';
const BANDS: Band[] = ['All', 'Hot', 'Warm', 'Moderate', 'Cool', 'Cold'];

function bandFor(glue: Glue): Band {
  const mid = (glue.optimalTemp.min + glue.optimalTemp.max) / 2;
  if (mid >= 90) return 'Hot';
  if (mid >= 80) return 'Warm';
  if (mid >= 70) return 'Moderate';
  if (mid >= 60) return 'Cool';
  return 'Cold';
}

/**
 * Static catalog of every glue in the dataset. Intentionally does NOT score
 * against current weather, that's the Home screen's job. This view is
 * purely a browseable reference: search + filter by temperature band.
 */
export function GlueLibraryScreen() {
  const [query, setQuery] = useState('');
  const [band, setBand] = useState<Band>('All');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return glues
      .filter((g) => band === 'All' || bandFor(g) === band)
      .filter(
        (g) =>
          !q ||
          g.name.toLowerCase().includes(q) ||
          g.color.toLowerCase().includes(q) ||
          g.brand.toLowerCase().includes(q) ||
          g.chartConditions.toLowerCase().includes(q)
      )
      // Sort coldest → hottest by midpoint within the band, then by name
      .sort((a, b) => {
        const am = (a.optimalTemp.min + a.optimalTemp.max) / 2;
        const bm = (b.optimalTemp.min + b.optimalTemp.max) / 2;
        return am - bm || a.name.localeCompare(b.name);
      });
  }, [query, band]);

  return (
    <Screen
      title="Glue Library"
      subtitle={`${glues.length} glues · browse the full Anson hot-melt PDR catalog.`}
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
          filtered.map((g) => <GlueCard key={g.id} glue={g} />)
        ) : (
          <div className="empty">No glues match that search.</div>
        )}
      </div>
    </Screen>
  );
}
