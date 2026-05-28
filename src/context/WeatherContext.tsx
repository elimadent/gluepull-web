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
  geolocationAvailable,
  getCurrentLocation,
  getLocationFromIP,
} from '@/services/weather';
import { DailyForecast, WeatherConditions } from '@/types';

interface WeatherContextValue {
  forecast: DailyForecast | null;
  loading: boolean;
  error: string | null;
  /** True after the auto-IP lookup has fired (success or failure). */
  attempted: boolean;
  /** Whether precise GPS is available in this browser context. */
  canRefineWithGPS: boolean;
  /** Look up location by IP and fetch its forecast (default path). */
  refreshFromIP: () => Promise<void>;
  /** Upgrade to precise GPS coords + refetch. Only when canRefineWithGPS. */
  refineWithGPS: () => Promise<void>;
  /** Override forecast with hand-entered conditions. */
  setManualConditions: (c: WeatherConditions) => void;
}

const WeatherContext = createContext<WeatherContextValue | undefined>(undefined);

const todayISO = (): string => new Date().toISOString().slice(0, 10);

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
  const [attempted, setAttempted] = useState(false);
  const autoRanRef = useRef(false);

  const refreshFromIP = useCallback(async () => {
    setLoading(true);
    setError(null);
    setAttempted(true);
    try {
      const location = await getLocationFromIP();
      const data = await fetchDailyForecast(location);
      setForecast(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load weather.');
    } finally {
      setLoading(false);
    }
  }, []);

  const refineWithGPS = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const location = await getCurrentLocation();
      const data = await fetchDailyForecast(location);
      setForecast(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not refine location.');
    } finally {
      setLoading(false);
    }
  }, []);

  const setManualConditions = useCallback((c: WeatherConditions) => {
    setError(null);
    setForecast(manualForecast(c));
  }, []);

  // Auto-fetch IP location on mount once. Zero clicks for the user to see
  // ranked picks for their actual local weather.
  useEffect(() => {
    if (autoRanRef.current) return;
    autoRanRef.current = true;
    void refreshFromIP();
  }, [refreshFromIP]);

  const value = useMemo(
    () => ({
      forecast,
      loading,
      error,
      attempted,
      canRefineWithGPS: geolocationAvailable(),
      refreshFromIP,
      refineWithGPS,
      setManualConditions,
    }),
    [forecast, loading, error, attempted, refreshFromIP, refineWithGPS, setManualConditions]
  );

  return <WeatherContext.Provider value={value}>{children}</WeatherContext.Provider>;
}

export function useWeather(): WeatherContextValue {
  const ctx = useContext(WeatherContext);
  if (!ctx) throw new Error('useWeather must be used within a WeatherProvider');
  return ctx;
}
