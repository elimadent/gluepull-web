import { useEffect, useRef, useState } from 'react';
import { US_STATES } from '@/data/usStates';
import { geocodeSearch, type GeocodeResult } from '@/services/weather';
import type { LocationInfo } from '@/types';

interface TripPlannerProps {
  /** Called with the chosen location. */
  onPick: (location: LocationInfo) => void;
  /** Optional label of the currently active trip location, for display. */
  activeLabel?: string | null;
  disabled?: boolean;
}

/**
 * Three ways to pick a trip location, all in one component:
 *   1. Quick US state dropdown — defaults to the state's largest metro
 *   2. Free-text search — city, zip code, or any international location
 *      (debounced live autocomplete via Open-Meteo geocoding)
 *   3. (Clear / reset handled by parent)
 *
 * Goal: make trip-planning fast without ditching the international /
 * zip-code flexibility power users want.
 */
export function TripPlanner({ onPick, activeLabel, disabled }: TripPlannerProps) {
  const [stateCode, setStateCode] = useState('TX');
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced live search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = search.trim();
    if (q.length < 2) {
      setResults([]);
      setSearchError(null);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      setSearchError(null);
      try {
        const hits = await geocodeSearch(q, 8);
        setResults(hits);
      } catch (e) {
        setSearchError(e instanceof Error ? e.message : 'Search failed.');
        setResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search]);

  const pickFromState = () => {
    const s = US_STATES.find((x) => x.code === stateCode);
    if (!s) return;
    onPick({
      latitude: s.lat,
      longitude: s.lon,
      label: `${s.city}, ${s.code}`,
    });
  };

  const pickFromGeocode = (g: GeocodeResult) => {
    onPick({ latitude: g.latitude, longitude: g.longitude, label: g.label });
    setSearch('');
    setResults([]);
  };

  return (
    <details className="collapsible trip-panel">
      <summary>
        <span className="collapsible-eyebrow">Trip Planner</span>
        <span className="collapsible-title">Working somewhere else?</span>
        <span className="collapsible-chev" aria-hidden>▾</span>
      </summary>
      <div className="collapsible-body">
        <p className="trip-dek">
          Override the location so the plan reflects where you'll actually be
          working. Pick a US state, or type any city, zip, or international
          place name.
        </p>

        {activeLabel ? (
          <p className="trip-status">
            ✓ Trip active: <strong>{activeLabel}</strong>
          </p>
        ) : null}

        <div className="trip-controls">
          <label className="trip-field">
            <span className="trip-field-label">Quick — US state</span>
            <div className="trip-state-row">
              <select
                className="trip-select"
                value={stateCode}
                onChange={(e) => setStateCode(e.target.value)}
                disabled={disabled}
              >
                {US_STATES.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name} ({s.city})
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="apply trip-use-state"
                onClick={pickFromState}
                disabled={disabled}
              >
                Use
              </button>
            </div>
          </label>
        </div>

        <div className="trip-search">
          <label className="trip-field-label" htmlFor="gp-trip-search">
            Or — search city, zip, or any country
          </label>
          <input
            id="gp-trip-search"
            className="search"
            type="search"
            placeholder="e.g. 78641 · Dallas · Tokyo"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoComplete="off"
            disabled={disabled}
          />
          {searchLoading ? (
            <p className="trip-search-hint">Searching…</p>
          ) : searchError ? (
            <p className="inline-warn">{searchError}</p>
          ) : search.trim().length >= 2 && results.length === 0 ? (
            <p className="trip-search-hint">No matches.</p>
          ) : null}
          {results.length > 0 ? (
            <ul className="trip-results" role="listbox">
              {results.map((r) => (
                <li key={`${r.label}-${r.latitude}-${r.longitude}`}>
                  <button
                    type="button"
                    className="trip-result-btn"
                    onClick={() => pickFromGeocode(r)}
                    disabled={disabled}
                  >
                    <span className="trip-result-name">{r.label}</span>
                    {r.postcode ? (
                      <span className="trip-result-zip">{r.postcode}</span>
                    ) : null}
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </details>
  );
}
