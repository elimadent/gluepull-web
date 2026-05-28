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
import { getStateByCode } from '@/data/usStates';
import { DailyForecast, WeatherConditions } from '@/types';

interface WeatherContextValue {
  forecast: DailyForecast | null;
  loading: boolean;
  error: string | null;
  /** True after the auto-IP lookup has fired (success or failure). */
  attempted: boolean;
  /** Whether precise GPS is available in this browser context. */
  canRefineWithGPS: boolean;
  /** Whether an explicit Trip Planner override is currently active. */
  tripActive: boolean;
  /** Look up location by IP and fetch its forecast (default path). */
  refreshFromIP: () => Promise<void>;
  /** Upgrade to precise GPS coords + refetch. Only when canRefineWithGPS. */
  refineWithGPS: () => Promise<void>;
  /** Override forecast with hand-entered conditions. */
  setManualConditions: (c: WeatherConditions) => void;
  /** Override the location: pick a US state + a day offset from today. */
  applyTrip: (stateCode: string, daysFromNow: number) => Promise<void>;
  /** Override the location to specific lat/lon (used by hail-hotspot chips). */
  applyTripToLocation: (
    label: string,
    lat: number,
    lon: number,
    daysFromNow: number
  ) => Promise<void>;
  /** Drop a trip override and go back to local IP weather. */
  clearTrip: () => Promise<void>;
}

const WeatherContext = createContext<WeatherContextValue | undefined>(undefined);

const dayISO = (offsetDays: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
};

function manualForecast(c: WeatherConditions): DailyForecast {
  return {
    location: { latitude: 0, longitude: 0, label: 'Manual entry' },
    date: dayISO(0),
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
  const [tripActive, setTripActive] = useState(false);
  const autoRanRef = useRef(false);

  const refreshFromIP = useCallback(async () => {
    setLoading(true);
    setError(null);
    setAttempted(true);
    setTripActive(false);
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
    setTripActive(false);
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

  const applyTrip = useCallback(async (stateCode: string, daysFromNow: number) => {
    const state = getStateByCode(stateCode);
    if (!state) {
      setError(`No data for state ${stateCode}.`);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDailyForecast(
        {
          latitude: state.lat,
          longitude: state.lon,
          label: `${state.city}, ${state.code}`,
        },
        dayISO(daysFromNow)
      );
      setForecast(data);
      setTripActive(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not fetch trip forecast.');
    } finally {
      setLoading(false);
    }
  }, []);

  const applyTripToLocation = useCallback(
    async (label: string, lat: number, lon: number, daysFromNow: number) => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchDailyForecast(
          { latitude: lat, longitude: lon, label },
          dayISO(daysFromNow)
        );
        setForecast(data);
        setTripActive(true);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not fetch trip forecast.');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const clearTrip = useCallback(async () => {
    setTripActive(false);
    await refreshFromIP();
  }, [refreshFromIP]);

  // Auto-fetch IP location on mount once.
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
      tripActive,
      refreshFromIP,
      refineWithGPS,
      setManualConditions,
      applyTrip,
      applyTripToLocation,
      clearTrip,
    }),
    [
      forecast,
      loading,
      error,
      attempted,
      tripActive,
      refreshFromIP,
      refineWithGPS,
      setManualConditions,
      applyTrip,
      applyTripToLocation,
      clearTrip,
    ]
  );

  return <WeatherContext.Provider value={value}>{children}</WeatherContext.Provider>;
}

export function useWeather(): WeatherContextValue {
  const ctx = useContext(WeatherContext);
  if (!ctx) throw new Error('useWeather must be used within a WeatherProvider');
  return ctx;
}
