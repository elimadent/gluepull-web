/**
 * Quick-pick metros where hail chasers actually work. Sourced from NOAA's
 * "Hail Alley" + insurance industry hail-claim heatmaps. Each entry is a
 * city + the US state code (used to look up lat/lon from usStates.ts when
 * needed) but with a city-specific lat/lon so we hit the right metro, not
 * the state default city.
 */
export interface HailHotspot {
  stateCode: string;
  city: string;
  label: string;
  lat: number;
  lon: number;
}

export const HAIL_HOTSPOTS: HailHotspot[] = [
  { stateCode: 'TX', city: 'Dallas',        label: 'Dallas, TX',     lat: 32.778,  lon: -96.795 },
  { stateCode: 'TX', city: 'Fort Worth',    label: 'Fort Worth, TX', lat: 32.756,  lon: -97.331 },
  { stateCode: 'TX', city: 'Austin',        label: 'Austin, TX',     lat: 30.267,  lon: -97.743 },
  { stateCode: 'TX', city: 'San Antonio',   label: 'San Antonio, TX',lat: 29.424,  lon: -98.494 },
  { stateCode: 'OK', city: 'Oklahoma City', label: 'OKC, OK',        lat: 35.467,  lon: -97.516 },
  { stateCode: 'OK', city: 'Tulsa',         label: 'Tulsa, OK',      lat: 36.154,  lon: -95.992 },
  { stateCode: 'KS', city: 'Wichita',       label: 'Wichita, KS',    lat: 37.687,  lon: -97.330 },
  { stateCode: 'CO', city: 'Denver',        label: 'Denver, CO',     lat: 39.739,  lon: -104.990 },
  { stateCode: 'CO', city: 'Colorado Springs', label: 'Colorado Spr., CO', lat: 38.834, lon: -104.821 },
  { stateCode: 'NE', city: 'Omaha',         label: 'Omaha, NE',      lat: 41.257,  lon: -95.995 },
  { stateCode: 'MO', city: 'Kansas City',   label: 'Kansas City, MO',lat: 39.099,  lon: -94.578 },
  { stateCode: 'MO', city: 'St. Louis',     label: 'St. Louis, MO',  lat: 38.627,  lon: -90.199 },
  { stateCode: 'MN', city: 'Minneapolis',   label: 'Minneapolis, MN',lat: 44.978,  lon: -93.265 },
  { stateCode: 'IL', city: 'Chicago',       label: 'Chicago, IL',    lat: 41.878,  lon: -87.630 },
  { stateCode: 'IA', city: 'Des Moines',    label: 'Des Moines, IA', lat: 41.587,  lon: -93.625 },
  { stateCode: 'GA', city: 'Atlanta',       label: 'Atlanta, GA',    lat: 33.749,  lon: -84.388 },
  { stateCode: 'FL', city: 'Orlando',       label: 'Orlando, FL',    lat: 28.538,  lon: -81.379 },
  { stateCode: 'AZ', city: 'Phoenix',       label: 'Phoenix, AZ',    lat: 33.448,  lon: -112.074 },
];
