import { DailyForecast, LocationInfo, WeatherSnapshot } from '@/types';

/*
 * Web port of services/weather.ts. The Open-Meteo fetch logic is byte-identical
 * with the RN version; the location call swaps expo-location for the browser
 * Geolocation API (no permission popup outside an HTTPS / localhost context —
 * on a LAN IP iOS Safari still allows it on first request).
 */

const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';

interface OpenMeteoResponse {
  hourly?: {
    time: string[];
    temperature_2m: number[];
    relative_humidity_2m: number[];
    surface_pressure: number[];
  };
  timezone?: string;
}

const todayISO = (): string => new Date().toISOString().slice(0, 10);

/**
 * Request browser geolocation and return the device coordinates.
 * Throws with a user-facing message if permission is denied or unavailable.
 */
export function getCurrentLocation(): Promise<LocationInfo> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(
        new Error(
          'This browser does not support geolocation. Use Manual Entry.'
        )
      );
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (err) => {
        const msg =
          err.code === err.PERMISSION_DENIED
            ? 'Location permission denied. Allow it in your browser or use Manual Entry.'
            : 'Could not get your location. Try Manual Entry.';
        reject(new Error(msg));
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 60_000 }
    );
  });
}

/**
 * Fetch today's hourly forecast (temperature °F, relative humidity %,
 * surface/barometric pressure hPa) for the given location via Open-Meteo.
 */
export async function fetchDailyForecast(
  location: LocationInfo
): Promise<DailyForecast> {
  const date = todayISO();
  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    hourly: 'temperature_2m,relative_humidity_2m,surface_pressure',
    temperature_unit: 'fahrenheit',
    timezone: 'auto',
    start_date: date,
    end_date: date,
  });

  const res = await fetch(`${OPEN_METEO_URL}?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Weather request failed (${res.status}). Try Manual Entry.`);
  }
  const data: OpenMeteoResponse = await res.json();
  if (!data.hourly || !data.hourly.time?.length) {
    throw new Error('No forecast data returned. Try Manual Entry.');
  }

  const { time, temperature_2m, relative_humidity_2m, surface_pressure } =
    data.hourly;

  const hourly: WeatherSnapshot[] = time.map((iso, i) => ({
    hour: new Date(iso).getHours(),
    temperatureF: temperature_2m[i],
    humidity: relative_humidity_2m[i],
    pressureHpa: surface_pressure[i],
  }));

  return { location, hourly, date, source: 'forecast' };
}

/** Convenience: resolve location and fetch the forecast in one call. */
export async function getForecastForCurrentLocation(): Promise<DailyForecast> {
  const location = await getCurrentLocation();
  return fetchDailyForecast(location);
}

/**
 * Fetch a multi-day hourly forecast and split it into one DailyForecast per
 * day. Open-Meteo supports up to 16 forecast days. Powers weekly/monthly
 * pre-buy planning.
 */
export async function fetchMultiDayForecast(
  location: LocationInfo,
  days: number
): Promise<DailyForecast[]> {
  const forecastDays = Math.max(1, Math.min(16, Math.round(days)));
  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    hourly: 'temperature_2m,relative_humidity_2m,surface_pressure',
    temperature_unit: 'fahrenheit',
    timezone: 'auto',
    forecast_days: String(forecastDays),
  });

  const res = await fetch(`${OPEN_METEO_URL}?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Weather request failed (${res.status}). Try Manual Entry.`);
  }
  const data: OpenMeteoResponse = await res.json();
  if (!data.hourly || !data.hourly.time?.length) {
    throw new Error('No forecast data returned. Try Manual Entry.');
  }

  const { time, temperature_2m, relative_humidity_2m, surface_pressure } =
    data.hourly;

  const byDate = new Map<string, WeatherSnapshot[]>();
  time.forEach((iso, i) => {
    const date = iso.slice(0, 10);
    const snap: WeatherSnapshot = {
      hour: new Date(iso).getHours(),
      temperatureF: temperature_2m[i],
      humidity: relative_humidity_2m[i],
      pressureHpa: surface_pressure[i],
    };
    const list = byDate.get(date);
    if (list) list.push(snap);
    else byDate.set(date, [snap]);
  });

  return [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, hourly]) => ({ location, hourly, date, source: 'forecast' as const }));
}
