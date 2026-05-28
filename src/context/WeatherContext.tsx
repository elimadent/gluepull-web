import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  fetchDailyForecast,
  getLocationFromIP,
} from '@/services/weather';
import { DailyForecast, WeatherConditions } from '@/types';

/*
 * Simplified state model (per "remove the complicated picking…"):
 *   - `conditions` is the single source of truth for what the scorer sees.
 *     It starts at a sensible default (75°F / 50%RH / 1013 hPa) so the picker
 *     shows useful recommendations on first paint.
 *   - The user can `setTemperature` / `setHumidity` from inline inputs on
 *     Home (sliders + number fields). Those write to `conditions` directly.
 *   - `detectLocation` is the explicit auto-detect button. It runs IP
 *     geolocation, fetches today's hourly forecast, and updates BOTH
 *     `conditions` (set to the current-hour reading) AND `forecast` (kept
 *     around so Home can render the time-block timeline).
 *   - Nothing auto-fires on mount any more.
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

const clampTemp = (n: number) =>
  Number.isFinite(n) ? Math.max(TEMP_MIN, Math.min(TEMP_MAX, n)) : 75;
const clampHumidity = (n: number) =>
  Number.isFinite(n) ? Math.max(HUM_MIN, Math.min(HUM_MAX, n)) : 50;

interface WeatherContextValue {
  conditions: WeatherConditions;
  /** Populated only by detectLocation — drives the time-block timeline. */
  forecast: DailyForecast | null;
  loading: boolean;
  error: string | null;
  locationLabel: string | null;

  setTemperature: (f: number) => void;
  setHumidity: (pct: number) => void;
  detectLocation: () => Promise<void>;
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
  const [conditions, setConditions] = useState<WeatherConditions>(DEFAULT_CONDITIONS);
  const [forecast, setForecast] = useState<DailyForecast | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationLabel, setLocationLabel] = useState<string | null>(null);

  // All temp / humidity writes get clamped at the context boundary — defense
  // in depth so neither a buggy input, a hot-reload state ghost, nor a
  // future code path can ever land conditions outside the picker's valid
  // range.
  const setTemperature = useCallback((f: number) => {
    setConditions((c) => ({ ...c, temperatureF: clampTemp(f) }));
  }, []);

  const setHumidity = useCallback((pct: number) => {
    setConditions((c) => ({ ...c, humidity: clampHumidity(pct) }));
  }, []);

  const detectLocation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const location = await getLocationFromIP();
      const data = await fetchDailyForecast(location);
      setForecast(data);
      setLocationLabel(location.label ?? null);
      const live = currentHourFromForecast(data);
      // Re-use the clamping setters via setConditions, but the values from
      // a live forecast are safe — just guard against weird API outputs.
      setConditions({
        temperatureF: clampTemp(live.temperatureF),
        humidity: clampHumidity(live.humidity),
        pressureHpa: live.pressureHpa,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not detect location.');
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo<WeatherContextValue>(
    () => ({
      conditions,
      forecast,
      loading,
      error,
      locationLabel,
      setTemperature,
      setHumidity,
      detectLocation,
    }),
    [conditions, forecast, loading, error, locationLabel, setTemperature, setHumidity, detectLocation]
  );

  return <WeatherContext.Provider value={value}>{children}</WeatherContext.Provider>;
}

export function useWeather(): WeatherContextValue {
  const ctx = useContext(WeatherContext);
  if (!ctx) throw new Error('useWeather must be used within a WeatherProvider');
  return ctx;
}
