import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  fetchDailyForecast,
  getLocationFromIP,
} from '@/services/weather';
import { DailyForecast, LocationInfo, WeatherConditions } from '@/types';

/*
 * Single source of truth for what the rest of the app sees:
 *   - `conditions` drives every recommendation calculation
 *   - `location`   drives anywhere that fetches weather (Plan's multi-day,
 *                  Home's hourly timeline, etc.)
 *
 * Everything is set from Home. Other tabs READ from this context — they
 * never have their own location/condition state any more.
 *
 * Persistence rules (matches the user's mental model):
 *   - `conditions` and `location` survive a hard refresh — both are mirrored
 *     to localStorage on every change and re-hydrated on mount.
 *   - On refresh-hydrate we re-fetch the hourly forecast for the stored
 *     location IN THE BACKGROUND, but we DO NOT touch `conditions`. So a
 *     manually-typed temp/humidity stays put across refreshes.
 *   - The three things that change `conditions` are:
 *       1. The user dragging/typing on the slider/stepper.
 *       2. `clearLocation` — resets to factory defaults.
 *       3. `setLocation` / `detectLocation` — populates with the picked
 *          location's current-hour live forecast.
 */

const DEFAULT_CONDITIONS: WeatherConditions = {
  temperatureF: 75,
  humidity: 50,
  pressureHpa: 1013,
};

const TEMP_MIN = -20;
const TEMP_MAX = 140;
const HUM_MIN = 0;
const HUM_MAX = 100;

const STORAGE_KEY_CONDITIONS = 'glueiq.conditions.v1';
const STORAGE_KEY_LOCATION = 'glueiq.location.v1';

const clampTemp = (n: number) =>
  Number.isFinite(n) ? Math.max(TEMP_MIN, Math.min(TEMP_MAX, n)) : 75;
const clampHumidity = (n: number) =>
  Number.isFinite(n) ? Math.max(HUM_MIN, Math.min(HUM_MAX, n)) : 50;

function loadStoredConditions(): WeatherConditions {
  if (typeof window === 'undefined') return DEFAULT_CONDITIONS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_CONDITIONS);
    if (!raw) return DEFAULT_CONDITIONS;
    const parsed = JSON.parse(raw) as Partial<WeatherConditions> | null;
    if (
      parsed &&
      typeof parsed.temperatureF === 'number' &&
      typeof parsed.humidity === 'number'
    ) {
      return {
        temperatureF: clampTemp(parsed.temperatureF),
        humidity: clampHumidity(parsed.humidity),
        pressureHpa:
          typeof parsed.pressureHpa === 'number'
            ? parsed.pressureHpa
            : DEFAULT_CONDITIONS.pressureHpa,
      };
    }
  } catch {
    /* corrupt JSON / localStorage disabled — fall through */
  }
  return DEFAULT_CONDITIONS;
}

function loadStoredLocation(): LocationInfo | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY_LOCATION);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<LocationInfo> | null;
    if (
      parsed &&
      typeof parsed.latitude === 'number' &&
      typeof parsed.longitude === 'number' &&
      Number.isFinite(parsed.latitude) &&
      Number.isFinite(parsed.longitude)
    ) {
      return {
        latitude: parsed.latitude,
        longitude: parsed.longitude,
        label: typeof parsed.label === 'string' ? parsed.label : undefined,
      };
    }
  } catch {
    /* fall through */
  }
  return null;
}

function writeStored(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  try {
    if (value === null || value === undefined) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, JSON.stringify(value));
    }
  } catch {
    /* Safari private mode etc. — silently skip persistence. */
  }
}

interface WeatherContextValue {
  conditions: WeatherConditions;
  /** Last-loaded hourly forecast — drives Home's time-block timeline.
   *  null when no location has been set yet, or until the silent re-fetch
   *  after a refresh-hydrate completes. */
  forecast: DailyForecast | null;
  /** Active location set from Home's picker. null = no location selected. */
  location: LocationInfo | null;
  loading: boolean;
  error: string | null;

  setTemperature: (f: number) => void;
  setHumidity: (pct: number) => void;
  /** Pick a specific location (state dropdown, geocoding search). */
  setLocation: (loc: LocationInfo) => Promise<void>;
  /** IP-based auto-detect — sets location + conditions in one go. */
  detectLocation: () => Promise<void>;
  /** Drop the location, forecast, AND reset conditions to defaults. */
  clearLocation: () => void;
}

const WeatherContext = createContext<WeatherContextValue | undefined>(undefined);

function currentHourFromForecast(forecast: DailyForecast): WeatherConditions {
  const hour = new Date().getHours();
  const exact = forecast.hourly.find((h) => h.hour === hour);
  const snap = exact ?? forecast.hourly[0];
  return {
    temperatureF: snap.temperatureF,
    humidity: snap.humidity,
    pressureHpa: snap.pressureHpa,
  };
}

export function WeatherProvider({ children }: { children: ReactNode }) {
  // Lazy init from localStorage — runs once on first mount, survives refresh.
  const [conditions, setConditions] = useState<WeatherConditions>(loadStoredConditions);
  const [forecast, setForecast] = useState<DailyForecast | null>(null);
  const [location, setLocationState] = useState<LocationInfo | null>(loadStoredLocation);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Persist conditions to localStorage on every change. */
  useEffect(() => {
    writeStored(STORAGE_KEY_CONDITIONS, conditions);
  }, [conditions]);

  /** Persist location to localStorage on every change (null clears the key). */
  useEffect(() => {
    writeStored(STORAGE_KEY_LOCATION, location);
  }, [location]);

  // Defense in depth — every temp/humidity write goes through the clamp.
  const setTemperature = useCallback((f: number) => {
    setConditions((c) => ({ ...c, temperatureF: clampTemp(f) }));
  }, []);

  const setHumidity = useCallback((pct: number) => {
    setConditions((c) => ({ ...c, humidity: clampHumidity(pct) }));
  }, []);

  /** Load the forecast for a specific location and sync conditions to the
   *  current hour. Shared by both `setLocation` and `detectLocation`. */
  const loadForLocation = useCallback(async (loc: LocationInfo) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDailyForecast(loc);
      setForecast(data);
      setLocationState(loc);
      const live = currentHourFromForecast(data);
      setConditions({
        temperatureF: clampTemp(live.temperatureF),
        humidity: clampHumidity(live.humidity),
        pressureHpa: live.pressureHpa,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load this location.');
    } finally {
      setLoading(false);
    }
  }, []);

  const setLocation = useCallback(
    async (loc: LocationInfo) => {
      await loadForLocation(loc);
    },
    [loadForLocation]
  );

  const detectLocation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const loc = await getLocationFromIP();
      await loadForLocation(loc);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not detect location.');
      setLoading(false);
    }
  }, [loadForLocation]);

  const clearLocation = useCallback(() => {
    setLocationState(null);
    setForecast(null);
    setError(null);
    // Per the user's spec: clearing the location resets conditions too. The
    // three things that change conditions are manual edit, clear, or pick.
    setConditions(DEFAULT_CONDITIONS);
  }, []);

  /** Refresh hydrate: when the provider mounts and the stored `location` is
   *  non-null, silently re-fetch the hourly forecast so "Today by the hour"
   *  is populated. CRUCIALLY this path does NOT touch `conditions` — manually
   *  typed temp/humidity values survive the refresh. */
  const didHydrateRef = useRef(false);
  useEffect(() => {
    if (didHydrateRef.current) return;
    didHydrateRef.current = true;
    if (!location) return;
    void fetchDailyForecast(location)
      .then((data) => setForecast(data))
      .catch(() => {
        /* Silent — the stored conditions still work for Home's "top picks".
         * Only "Today by the hour" stays empty until the user retries. */
      });
    // Run once at mount only; subsequent location changes go through
    // setLocation / detectLocation / clearLocation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<WeatherContextValue>(
    () => ({
      conditions,
      forecast,
      location,
      loading,
      error,
      setTemperature,
      setHumidity,
      setLocation,
      detectLocation,
      clearLocation,
    }),
    [
      conditions,
      forecast,
      location,
      loading,
      error,
      setTemperature,
      setHumidity,
      setLocation,
      detectLocation,
      clearLocation,
    ]
  );

  return <WeatherContext.Provider value={value}>{children}</WeatherContext.Provider>;
}

export function useWeather(): WeatherContextValue {
  const ctx = useContext(WeatherContext);
  if (!ctx) throw new Error('useWeather must be used within a WeatherProvider');
  return ctx;
}
