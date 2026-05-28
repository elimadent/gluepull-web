/**
 * US states with a representative PDR-relevant metro per state for the trip
 * planner. Coordinates are the metro centroid — good enough for a daily
 * forecast lookup; not meant for street-level precision.
 *
 * Picked the biggest metro / known PDR market over the state capital where
 * they differ (TX → Dallas, NV → Las Vegas, FL → Orlando, etc.).
 */
export interface USState {
  code: string;
  name: string;
  city: string;
  lat: number;
  lon: number;
}

export const US_STATES: USState[] = [
  { code: 'AL', name: 'Alabama',        city: 'Birmingham',    lat: 33.518,  lon: -86.810 },
  { code: 'AK', name: 'Alaska',         city: 'Anchorage',     lat: 61.218,  lon: -149.900 },
  { code: 'AZ', name: 'Arizona',        city: 'Phoenix',       lat: 33.448,  lon: -112.074 },
  { code: 'AR', name: 'Arkansas',       city: 'Little Rock',   lat: 34.746,  lon: -92.289 },
  { code: 'CA', name: 'California',     city: 'Los Angeles',   lat: 34.052,  lon: -118.244 },
  { code: 'CO', name: 'Colorado',       city: 'Denver',        lat: 39.739,  lon: -104.990 },
  { code: 'CT', name: 'Connecticut',    city: 'Hartford',      lat: 41.764,  lon: -72.685 },
  { code: 'DE', name: 'Delaware',       city: 'Wilmington',    lat: 39.745,  lon: -75.547 },
  { code: 'DC', name: 'District of Columbia', city: 'Washington', lat: 38.907, lon: -77.037 },
  { code: 'FL', name: 'Florida',        city: 'Orlando',       lat: 28.538,  lon: -81.379 },
  { code: 'GA', name: 'Georgia',        city: 'Atlanta',       lat: 33.749,  lon: -84.388 },
  { code: 'HI', name: 'Hawaii',         city: 'Honolulu',      lat: 21.307,  lon: -157.858 },
  { code: 'ID', name: 'Idaho',          city: 'Boise',         lat: 43.615,  lon: -116.202 },
  { code: 'IL', name: 'Illinois',       city: 'Chicago',       lat: 41.878,  lon: -87.630 },
  { code: 'IN', name: 'Indiana',        city: 'Indianapolis',  lat: 39.768,  lon: -86.158 },
  { code: 'IA', name: 'Iowa',           city: 'Des Moines',    lat: 41.587,  lon: -93.625 },
  { code: 'KS', name: 'Kansas',         city: 'Wichita',       lat: 37.687,  lon: -97.330 },
  { code: 'KY', name: 'Kentucky',       city: 'Louisville',    lat: 38.253,  lon: -85.759 },
  { code: 'LA', name: 'Louisiana',      city: 'New Orleans',   lat: 29.951,  lon: -90.072 },
  { code: 'ME', name: 'Maine',          city: 'Portland',      lat: 43.661,  lon: -70.255 },
  { code: 'MD', name: 'Maryland',       city: 'Baltimore',     lat: 39.290,  lon: -76.612 },
  { code: 'MA', name: 'Massachusetts',  city: 'Boston',        lat: 42.361,  lon: -71.057 },
  { code: 'MI', name: 'Michigan',       city: 'Detroit',       lat: 42.331,  lon: -83.046 },
  { code: 'MN', name: 'Minnesota',      city: 'Minneapolis',   lat: 44.978,  lon: -93.265 },
  { code: 'MS', name: 'Mississippi',    city: 'Jackson',       lat: 32.299,  lon: -90.185 },
  { code: 'MO', name: 'Missouri',       city: 'Kansas City',   lat: 39.099,  lon: -94.578 },
  { code: 'MT', name: 'Montana',        city: 'Billings',      lat: 45.783,  lon: -108.500 },
  { code: 'NE', name: 'Nebraska',       city: 'Omaha',         lat: 41.257,  lon: -95.995 },
  { code: 'NV', name: 'Nevada',         city: 'Las Vegas',     lat: 36.169,  lon: -115.139 },
  { code: 'NH', name: 'New Hampshire',  city: 'Manchester',    lat: 42.995,  lon: -71.455 },
  { code: 'NJ', name: 'New Jersey',     city: 'Newark',        lat: 40.735,  lon: -74.172 },
  { code: 'NM', name: 'New Mexico',     city: 'Albuquerque',   lat: 35.084,  lon: -106.651 },
  { code: 'NY', name: 'New York',       city: 'New York City', lat: 40.713,  lon: -74.006 },
  { code: 'NC', name: 'North Carolina', city: 'Charlotte',     lat: 35.227,  lon: -80.843 },
  { code: 'ND', name: 'North Dakota',   city: 'Fargo',         lat: 46.877,  lon: -96.789 },
  { code: 'OH', name: 'Ohio',           city: 'Columbus',      lat: 39.962,  lon: -83.001 },
  { code: 'OK', name: 'Oklahoma',       city: 'Oklahoma City', lat: 35.467,  lon: -97.516 },
  { code: 'OR', name: 'Oregon',         city: 'Portland',      lat: 45.515,  lon: -122.679 },
  { code: 'PA', name: 'Pennsylvania',   city: 'Philadelphia',  lat: 39.953,  lon: -75.165 },
  { code: 'RI', name: 'Rhode Island',   city: 'Providence',    lat: 41.824,  lon: -71.413 },
  { code: 'SC', name: 'South Carolina', city: 'Charleston',    lat: 32.776,  lon: -79.931 },
  { code: 'SD', name: 'South Dakota',   city: 'Sioux Falls',   lat: 43.545,  lon: -96.731 },
  { code: 'TN', name: 'Tennessee',      city: 'Nashville',     lat: 36.163,  lon: -86.781 },
  { code: 'TX', name: 'Texas',          city: 'Dallas',        lat: 32.778,  lon: -96.795 },
  { code: 'UT', name: 'Utah',           city: 'Salt Lake City',lat: 40.760,  lon: -111.891 },
  { code: 'VT', name: 'Vermont',        city: 'Burlington',    lat: 44.476,  lon: -73.213 },
  { code: 'VA', name: 'Virginia',       city: 'Richmond',      lat: 37.541,  lon: -77.434 },
  { code: 'WA', name: 'Washington',     city: 'Seattle',       lat: 47.606,  lon: -122.332 },
  { code: 'WV', name: 'West Virginia',  city: 'Charleston',    lat: 38.336,  lon: -81.612 },
  { code: 'WI', name: 'Wisconsin',      city: 'Milwaukee',     lat: 43.038,  lon: -87.906 },
  { code: 'WY', name: 'Wyoming',        city: 'Cheyenne',      lat: 41.140,  lon: -104.820 },
];

export function getStateByCode(code: string): USState | undefined {
  return US_STATES.find((s) => s.code === code);
}
