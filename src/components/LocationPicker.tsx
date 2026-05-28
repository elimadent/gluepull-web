import { useEffect, useRef, useState } from 'react';
import { useWeather } from '@/context/WeatherContext';
import { US_STATES } from '@/data/usStates';
import { geocodeSearch, type GeocodeResult } from '@/services/weather';

/**
 * Global location picker, lives at the top of Home.
 *
 * Drives the app-wide `location` in WeatherContext, which Home AND Plan (and
 * anything else needing weather) read from. Three ways to set it:
 *   1. Auto-detect from the visitor's IP
 *   2. US state dropdown, picks the state's largest metro
 *   3. Free-text search, city, zip, or any international place name
 *      (debounced live autocomplete via Open-Meteo geocoding)
 *
 * Stays open while no location is set; collapses once one is. The user can
 * always tap the header to re-open it and change locations, or hit Clear.
 */
export function LocationPicker() {
  const { location, loading, error, setLocation, detectLocation, clearLocation } =
    useWeather();

  const [stateCode, setStateCode] = useState('TX');
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<GeocodeResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced live geocode search
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

  const pickFromState = async () => {
    const s = US_STATES.find((x) => x.code === stateCode);
    if (!s) return;
    await setLocation({
      latitude: s.lat,
      longitude: s.lon,
      label: `${s.city}, ${s.code}`,
    });
  };

  const pickFromGeocode = async (g: GeocodeResult) => {
    setSearch('');
    setResults([]);
    await setLocation({ latitude: g.latitude, longitude: g.longitude, label: g.label });
  };

  return (
    <details className="collapsible trip-panel" open={!location}>
      <summary>
        <span className="collapsible-eyebrow">Location</span>
        <span className="collapsible-title">
          {location?.label ?? 'Set your location'}
        </span>
        <span className="collapsible-chev" aria-hidden>▾</span>
      </summary>
      <div className="collapsible-body">
        <p className="trip-dek">
          Whatever you choose here drives every tab, Home picks, hourly
          timeline, and Plan all use this location.
        </p>

        {location ? (
          <p className="trip-status">
            ✓ Active: <strong>{location.label ?? 'Selected location'}</strong>
          </p>
        ) : null}

        {error ? <p className="inline-warn">{error}</p> : null}

        <button
          type="button"
          className="detect-btn"
          onClick={() => void detectLocation()}
          disabled={loading}
        >
          {loading ? 'Detecting…' : '📍 Auto-detect from my IP'}
        </button>

        <div className="trip-controls" style={{ marginTop: 'var(--gp-md)' }}>
          <label className="trip-field">
            <span className="trip-field-label">Or, US state</span>
            <div className="trip-state-row">
              <select
                className="trip-select"
                value={stateCode}
                onChange={(e) => setStateCode(e.target.value)}
                disabled={loading}
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
                onClick={() => void pickFromState()}
                disabled={loading}
              >
                Use
              </button>
            </div>
          </label>
        </div>

        <div className="trip-search">
          <label className="trip-field-label" htmlFor="gp-loc-search">
            Or, search city, zip, or any country
          </label>
          <input
            id="gp-loc-search"
            className="search"
            type="search"
            placeholder="e.g. 78641 · Dallas · Tokyo"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoComplete="off"
            disabled={loading}
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
                    onClick={() => void pickFromGeocode(r)}
                    disabled={loading}
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

        {location ? (
          <div className="trip-clear-row">
            <button
              type="button"
              className="ghost-btn"
              onClick={clearLocation}
              disabled={loading}
            >
              <span aria-hidden>↺</span>
              <span>Clear location</span>
            </button>
          </div>
        ) : null}
      </div>
    </details>
  );
}
