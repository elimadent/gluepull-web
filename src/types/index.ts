export type PullMethod = 'slide-hammer' | 'mini-lifter' | 'both';
export type GunTemp = 'Low' | 'Medium' | 'High';
/** Bond strength category, from the Anson PDR glue chart. */
export type GlueStrength = 'Medium' | 'High' | 'Super High';

export interface Range {
  min: number;
  max: number;
}

export interface Glue {
  id: string;
  name: string;
  color: string;
  /** Optimal ambient/panel temperature window in °F. */
  optimalTemp: Range;
  /** Optimal relative humidity window in %. */
  optimalHumidity: Range;
  pullMethod: PullMethod;
  gunTemp: GunTemp;
  /** Bond strength category from the Anson chart. */
  strength: GlueStrength;
  /** Exact "Temp Conditions" wording from the Anson chart, for reference. */
  chartConditions: string;
  bestFor: string;
  pros: string[];
  cons: string[];
  purchaseLink: string;
}

/** A related product that pairs with a glue for a complete pull kit. */
export type AccessoryCategory =
  | 'glue-gun'
  | 'slide-hammer'
  | 'mini-lifter'
  | 'tab'
  | 'alcohol'
  | 'compound'
  | 'rag'
  | 'tool';

export interface Accessory {
  id: string;
  name: string;
  category: AccessoryCategory;
  description: string;
  purchaseLink: string;
}

/** A single point-in-time weather reading used to score glues. */
export interface WeatherConditions {
  /** Temperature in °F. */
  temperatureF: number;
  /** Relative humidity in %. */
  humidity: number;
  /** Barometric pressure in hPa (millibars). */
  pressureHpa: number;
}

export interface WeatherSnapshot extends WeatherConditions {
  /** Hour of day, 0-23, this reading applies to. */
  hour: number;
}

export interface LocationInfo {
  latitude: number;
  longitude: number;
  label?: string;
}

export interface DailyForecast {
  location: LocationInfo;
  /** Hourly readings for the full day (typically 24 entries). */
  hourly: WeatherSnapshot[];
  /** ISO date the forecast covers, e.g. "2026-05-27". */
  date: string;
  /** Where the data came from. */
  source: 'forecast' | 'manual';
}

export type TimeBlockId = 'morning' | 'midday' | 'afternoon' | 'evening';

export interface TimeBlock {
  id: TimeBlockId;
  label: string;
  /** Inclusive start hour. */
  startHour: number;
  /** Exclusive end hour. */
  endHour: number;
}

/** A glue scored against a specific set of conditions. */
export interface GlueScore {
  glue: Glue;
  /** 0-100, higher is a better match. */
  score: number;
  /** Human-readable reasons supporting the ranking. */
  reasons: string[];
  /** Warnings about why conditions are less than ideal. */
  warnings: string[];
}

export interface BlockRecommendation {
  block: TimeBlock;
  /** Representative conditions for the block (block average). */
  conditions: WeatherConditions;
  /** Glues ranked best-first for this block. */
  ranked: GlueScore[];
}
