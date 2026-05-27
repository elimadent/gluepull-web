import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { fetchDailyForecast, getCurrentLocation } from '@/services/weather';
import { DailyForecast, WeatherConditions } from '@/types';

interface WeatherContextValue {
  forecast: DailyForecast | null;
  loading: boolean;
  error: string | null;
  /** True after the user has explicitly asked for a location-based forecast at
   *  least once this session. Drives the welcome/auto-prompt UX. */
  attemptedAutoLocation: boolean;
  refreshFromLocation: () => Promise<void>;
  setManualConditions: (c: WeatherConditions) => void;
}

const WeatherContext = createContext<WeatherContextValue | undefined>(undefined);

const todayISO = (): string => new Date().toISOString().slice(0, 10);

/** Build a flat 24-hour forecast from a single manual reading. */
function manualForecast(c: WeatherConditions): DailyForecast {
  return {
    location: { latitude: 0, longitude: 0, label: 'Manual entry' },
    date: todayISO(),
    source: 'manual',
    hourly: Array.from({ length: 24 }, (_, hour) => ({
      hour,
      temperatureF: c.temperatureF,
      humidity: c.humidity,
      pressureHpa: c.pressureHpa,
    })),
  };
}

export function WeatherProvider({ children }: { children: ReactNode }) {
  const [forecast, setForecast] = useState<DailyForecast | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attemptedAutoLocation, setAttempted] = useState(false);

  const refreshFromLocation = useCallback(async () => {
    setAttempted(true);
    setLoading(true);
    setError(null);
    try {
      const location = await getCurrentLocation();
      const data = await fetchDailyForecast(location);
      setForecast(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load weather.');
    } finally {
      setLoading(false);
    }
  }, []);

  const setManualConditions = useCallback((c: WeatherConditions) => {
    setError(null);
    setForecast(manualForecast(c));
  }, []);

  // Deliberately NOT auto-fetching on mount. A surprise geolocation prompt is
  // hostile in an embedded Shopify widget — the welcome card lets the user
  // opt in to location or jump straight to manual entry.

  const value = useMemo(
    () => ({
      forecast,
      loading,
      error,
      attemptedAutoLocation,
      refreshFromLocation,
      setManualConditions,
    }),
    [forecast, loading, error, attemptedAutoLocation, refreshFromLocation, setManualConditions]
  );

  return <WeatherContext.Provider value={value}>{children}</WeatherContext.Provider>;
}

export function useWeather(): WeatherContextValue {
  const ctx = useContext(WeatherContext);
  if (!ctx) throw new Error('useWeather must be used within a WeatherProvider');
  return ctx;
}
