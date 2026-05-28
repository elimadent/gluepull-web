import { DailyForecast, LocationInfo, WeatherSnapshot } from '@/types';

/*
 * Web port of services/weather.ts.
 *
 * Two ways to resolve where the user is:
 *   1. IP geolocation (ipapi.co)  — no permission prompt, no HTTPS requirement
 *      for the page, city-level accuracy. The default path because for a
 *      glue-picker keyed to the local weather, city accuracy is plenty.
 *   2. Browser Geolocation API    — precise GPS, but only available on a
 *      secure context (HTTPS or localhost) and requires user permission.
 *      Used as an opt-in "refine my location" upgrade.
 *
 * The Open-Meteo fetch logic below is byte-identical to the RN version.
 */

const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';
const IP_LOCATION_URL = 'https://ipapi.co/json/';

interface OpenMeteoResponse {
  hourly?: {
    time: string[];
    temperature_2m: number[];
    relative_humidity_2m: number[];
    surface_pressure: number[];
  };
  timezone?: string;
}

interface IpapiResponse {
  latitude?: number;
  longitude?: number;
  city?: string;
  region_code?: string;
  region?: string;
  country_code?: string;
  error?: boolean;
  reason?: string;
}

const todayISO = (): string => new Date().toISOString().slice(0, 10);

/**
 * Whether the browser Geolocation API can actually be called here. Outside a
 * secure context (HTTPS, localhost) modern browsers either reject the prompt
 * or quietly fail — better to know upfront so the UI hides the GPS button.
 */
export function geolocationAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  if (!('geolocation' in navigator)) return false;
  const { protocol, hostname } = window.location;
  if (protocol === 'https:') return true;
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

/**
 * Look up the visitor's location from their IP. No permission prompt, works
 * on HTTP pages (the fetch is auto-upgraded to HTTPS by modern browsers).
 * Returns city + region as a friendly label.
 */
export async function getLocationFromIP(): Promise<LocationInfo> {
  const res = await fetch(IP_LOCATION_URL, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) {
    throw new Error('Could not look up your location. Try Manual Entry.');
  }
  const data: IpapiResponse = await res.json();
  if (
    data.error ||
    typeof data.latitude !== 'number' ||
    typeof data.longitude !== 'number'
  ) {
    throw new Error(data.reason || 'Could not look up your location. Try Manual Entry.');
  }
  return {
    latitude: data.latitude,
    longitude: data.longitude,
    label: [data.city, data.region_code || data.region].filter(Boolean).join(', '),
  };
}

/**
 * Request precise browser-level location (GPS). Only call this in a secure
 * context (use `geolocationAvailable()` to gate). Throws with a user-facing
 * message on denial or unavailability.
 */
export function getCurrentLocation(): Promise<LocationInfo> {
  return new Promise((resolve, reject) => {
    if (!geolocationAvailable()) {
      reject(
        new Error(
          'Precise location needs an HTTPS connection. Using approximate location instead.'
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
            ? 'Precise location denied. Using approximate location instead.'
            : 'Could not get your precise location.';
        reject(new Error(msg));
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 60_000 }
    );
  });
}

/**
 * Fetch a single day's hourly forecast (temperature °F, relative humidity %,
 * surface/barometric pressure hPa) for the given location via Open-Meteo.
 * Pass a future ISO date to forecast that day in advance (Open-Meteo supports
 * roughly 16 days ahead).
 */
export async function fetchDailyForecast(
  location: LocationInfo,
  date: string = todayISO()
): Promise<DailyForecast> {
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
