import { DailyForecast, LocationInfo, WeatherSnapshot } from '@/types';

/*
 * Web port of services/weather.ts.
 *
 * Two ways to resolve where the user is:
 *   1. IP geolocation (ipapi.co) , no permission prompt, no HTTPS requirement
 *      for the page, city-level accuracy. The default path because for a
 *      glue-picker keyed to the local weather, city accuracy is plenty.
 *   2. Browser Geolocation API   , precise GPS, but only available on a
 *      secure context (HTTPS or localhost) and requires user permission.
 *      Used as an opt-in "refine my location" upgrade.
 *
 * The Open-Meteo fetch logic below is byte-identical to the RN version.
 */

const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';
const IP_LOCATION_URL = 'https://ipapi.co/json/';
const GEOCODING_URL = 'https://geocoding-api.open-meteo.com/v1/search';

export interface GeocodeResult {
  /** Display name (city / village / town etc.) */
  name: string;
  /** Country (e.g. "United States"). */
  country: string;
  /** Country code (e.g. "US"). */
  countryCode: string;
  /** First-order administrative area (state / province / region). */
  region?: string;
  /** Postal code if the match is keyed off a zip. */
  postcode?: string;
  latitude: number;
  longitude: number;
  /** Best-effort one-line label for UI. */
  label: string;
}

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
 * or quietly fail, better to know upfront so the UI hides the GPS button.
 */
export function geolocationAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  if (!('geolocation' in navigator)) return false;
  const { protocol, hostname } = window.location;
  if (protocol === 'https:') return true;
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

/**
 * Free-text location search via Open-Meteo's geocoding API. Accepts city
 * names, US states, postal/zip codes, and international locations in one
 * query. Returns up to `limit` matches for the user to disambiguate.
 *
 * Examples:
 *   "78641"          → Leander, TX, US
 *   "Dallas"         → Dallas, Texas, US (+ other Dallases)
 *   "Texas"          → Austin / Dallas / Houston etc.
 *   "Tokyo"          → Tokyo, Japan
 *   "Cali"           → Cali, Colombia
 */
export async function geocodeSearch(
  query: string,
  limit = 8
): Promise<GeocodeResult[]> {
  const q = query.trim();
  if (!q) return [];
  const params = new URLSearchParams({
    name: q,
    count: String(limit),
    language: 'en',
    format: 'json',
  });
  const res = await fetch(`${GEOCODING_URL}?${params.toString()}`);
  if (!res.ok) throw new Error(`Location search failed (${res.status}).`);
  const data: {
    results?: Array<{
      name: string;
      country?: string;
      country_code?: string;
      admin1?: string;
      admin2?: string;
      postcodes?: string[];
      latitude: number;
      longitude: number;
    }>;
  } = await res.json();
  if (!data.results?.length) return [];
  return data.results.map((r) => {
    const region = r.admin1;
    const country = r.country ?? '';
    const code = r.country_code ?? '';
    const postcode = r.postcodes?.[0];
    const labelParts = [r.name, region, code === 'US' ? code : country].filter(Boolean);
    return {
      name: r.name,
      country,
      countryCode: code,
      region,
      postcode,
      latitude: r.latitude,
      longitude: r.longitude,
      label: labelParts.join(', '),
    };
  });
}

interface IpwhoResponse {
  success?: boolean;
  message?: string;
  latitude?: number;
  longitude?: number;
  city?: string;
  region?: string;
  region_code?: string;
  country?: string;
  country_code?: string;
}

interface FreeIpApiResponse {
  latitude?: number;
  longitude?: number;
  cityName?: string;
  regionName?: string;
  countryCode?: string;
}

interface IpinfoResponse {
  loc?: string; // "lat,lon"
  city?: string;
  region?: string;
  country?: string;
}

/** 6-second hard timeout, keeps the auto-detect button responsive when a
 *  provider hangs at the network layer (the failure mode the user was hitting). */
async function fetchWithTimeout(url: string, ms = 6000): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(t);
  }
}

async function tryFreeIpApi(): Promise<LocationInfo> {
  const res = await fetchWithTimeout('https://freeipapi.com/api/json/');
  if (!res.ok) throw new Error(`freeipapi ${res.status}`);
  const data: FreeIpApiResponse = await res.json();
  if (typeof data.latitude !== 'number' || typeof data.longitude !== 'number') {
    throw new Error('freeipapi empty');
  }
  // freeipapi returns 0/0 for unknowns, reject that, it's not a real fix.
  if (data.latitude === 0 && data.longitude === 0) throw new Error('freeipapi 0/0');
  return {
    latitude: data.latitude,
    longitude: data.longitude,
    label: [data.cityName, data.regionName].filter(Boolean).join(', '),
  };
}

async function tryIpinfo(): Promise<LocationInfo> {
  const res = await fetchWithTimeout('https://ipinfo.io/json');
  if (!res.ok) throw new Error(`ipinfo ${res.status}`);
  const data: IpinfoResponse = await res.json();
  if (!data.loc) throw new Error('ipinfo empty');
  const [latS, lonS] = data.loc.split(',');
  const lat = Number(latS);
  const lon = Number(lonS);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    throw new Error('ipinfo bad loc');
  }
  return {
    latitude: lat,
    longitude: lon,
    label: [data.city, data.region].filter(Boolean).join(', '),
  };
}

async function tryIpapi(): Promise<LocationInfo> {
  const res = await fetchWithTimeout(IP_LOCATION_URL);
  if (!res.ok) throw new Error(`ipapi.co ${res.status}`);
  const data: IpapiResponse = await res.json();
  if (data.error || typeof data.latitude !== 'number' || typeof data.longitude !== 'number') {
    throw new Error(data.reason || 'ipapi.co empty');
  }
  return {
    latitude: data.latitude,
    longitude: data.longitude,
    label: [data.city, data.region_code || data.region].filter(Boolean).join(', '),
  };
}

async function tryIpwho(): Promise<LocationInfo> {
  const res = await fetchWithTimeout('https://ipwho.is/');
  if (!res.ok) throw new Error(`ipwho.is ${res.status}`);
  const data: IpwhoResponse = await res.json();
  if (data.success === false || typeof data.latitude !== 'number' || typeof data.longitude !== 'number') {
    throw new Error(data.message || 'ipwho.is empty');
  }
  return {
    latitude: data.latitude,
    longitude: data.longitude,
    label: [data.city, data.region_code || data.region].filter(Boolean).join(', '),
  };
}

/**
 * Look up the visitor's location from their IP. No permission prompt, works
 * on HTTP pages (the fetch is auto-upgraded to HTTPS by modern browsers).
 *
 * Races four free, no-key, HTTPS providers in parallel and returns the FIRST
 * one that answers. Each provider sits on a different ASN/CDN, so a network
 * that blocks one (we've seen Verizon block ipapi.co and ipwho.is return 403
 * for some mobile ASNs) very rarely blocks all four. Falls through to a clean
 * "set it manually" error only if every provider fails.
 */
export async function getLocationFromIP(): Promise<LocationInfo> {
  const providers: Array<{ name: string; run: () => Promise<LocationInfo> }> = [
    { name: 'freeipapi', run: tryFreeIpApi },
    { name: 'ipinfo', run: tryIpinfo },
    { name: 'ipapi.co', run: tryIpapi },
    { name: 'ipwho.is', run: tryIpwho },
  ];

  // Race them: resolve with the first fulfilled, only reject if ALL fail.
  // (Hand-rolled instead of Promise.any so we stay compatible with this
  // project's tsconfig lib target.)
  return new Promise<LocationInfo>((resolve, reject) => {
    const errors: string[] = [];
    let remaining = providers.length;
    let settled = false;
    providers.forEach((p) => {
      p.run().then(
        (loc) => {
          if (settled) return;
          settled = true;
          resolve(loc);
        },
        (err: unknown) => {
          const msg = err instanceof Error ? err.message : String(err);
          errors.push(`${p.name}: ${msg}`);
          remaining -= 1;
          if (remaining === 0 && !settled) {
            reject(
              new Error(
                `Auto-detect couldn't reach a location service (${errors.join(' / ')}). Set your location manually with the state picker or search instead.`
              )
            );
          }
        }
      );
    });
  });
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
 * day. Open-Meteo's free forecast endpoint caps at 16 days, so for longer
 * horizons (e.g. "This Month" = 30 days) we PAD the back half by cycling
 * the 16-day pattern as a climatology proxy. Padded days are flagged
 * `source: 'projected'` so the UI can distinguish them if needed; the
 * aggregation logic treats them the same as forecast days so the buy list
 * reflects a full 30-day stocking horizon.
 */
export async function fetchMultiDayForecast(
  location: LocationInfo,
  days: number
): Promise<DailyForecast[]> {
  const requested = Math.max(1, Math.round(days));
  const forecastDays = Math.min(16, requested);
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

  const forecastDaysList: DailyForecast[] = [...byDate.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, hourly]) => ({
      location,
      hourly,
      date,
      source: 'forecast' as const,
    }));

  if (requested <= forecastDaysList.length || forecastDaysList.length === 0) {
    return forecastDaysList.slice(0, requested);
  }

  // Need to pad beyond Open-Meteo's 16-day window. Cycle the forecast pattern
  // forward as a climatology proxy, the buy-list aggregator counts each day
  // equally, so days 17..N still influence the "how many sticks" math.
  const padded: DailyForecast[] = [...forecastDaysList];
  const lastDate = new Date(`${forecastDaysList[forecastDaysList.length - 1].date}T12:00:00Z`);
  const needed = requested - forecastDaysList.length;
  for (let i = 0; i < needed; i++) {
    const src = forecastDaysList[i % forecastDaysList.length];
    const projDate = new Date(lastDate);
    projDate.setUTCDate(projDate.getUTCDate() + i + 1);
    padded.push({
      location,
      hourly: src.hourly,
      date: projDate.toISOString().slice(0, 10),
      source: 'projected' as const,
    });
  }
  return padded;
}
