export type PullMethod = 'slide-hammer' | 'mini-lifter' | 'both';
export type GunTemp = 'Low' | 'Medium' | 'High';
/** Bond strength category, from the Anson PDR glue chart. */
export type GlueStrength = 'Medium' | 'High' | 'Super High';

/** A-D condition grade from the research dataset. `null` = unverified / not stated. */
export type ConditionGrade = 'A' | 'B' | 'C' | 'D' | null;

/** Source confidence rating from the research dataset. */
export type SourceConfidence = 'low' | 'medium' | 'medium-high' | 'high';

export interface Range {
  min: number;
  max: number;
}

/** A panel-temperature range the maker or distributor actually published.
 *  Higher confidence than the inferred optimalTemp window — used as the
 *  primary scoring window when present. */
export interface PublishedTempRange extends Range {
  /** Short attribution string for the published range. */
  note?: string;
}

export interface Glue {
  id: string;
  /** Manufacturer / line (Plain Jane PDR, Anson PDR, Tequila PDR, etc.) */
  brand: string;
  name: string;
  color: string;
  /** Inferred optimal ambient/panel temperature window in °F (chart-derived). */
  optimalTemp: Range;
  /** Inferred optimal relative humidity window in %. */
  optimalHumidity: Range;
  /** Maker/distributor-published panel temp range, when one exists. Beats
   *  optimalTemp for scoring when set. */
  publishedTempRange?: PublishedTempRange;
  pullMethod: PullMethod;
  gunTemp: GunTemp;
  /** Bond strength tier (Medium / High / Super High). */
  strength: GlueStrength;
  /** Exact "Temp Conditions" wording from the Anson chart, for reference. */
  chartConditions: string;
  /** Short tagline used as the secondary line on cards. */
  bestFor: string;
  pros: string[];
  cons: string[];
  /** Canonical ansonpdr.com product URL (no /ko/, /en-ca/, /en-gb/ prefixes). */
  purchaseLink: string;

  // ---- Research-derived fields (PDR Glue Research, primary dataset) ----

  /** A-D grade for cool/cold-morning performance. */
  coldMorningGrade?: ConditionGrade;
  /** A-D grade for hot-afternoon performance. */
  hotAfternoonGrade?: ConditionGrade;
  /** A-D grade for dry / desert climate performance. */
  dryDesertGrade?: ConditionGrade;
  /** A-D grade for humid / coastal climate performance. */
  humidCoastalGrade?: ConditionGrade;
  /** One-line summary of when this glue is the right pick. */
  signatureUseCase?: string;
  /** Free-text on tech-preferred conditions per the research. */
  techPreferredConditions?: string;
  /** Anything quirky, conflicting, or worth flagging (id overlap, URL
   *  ambiguity, etc.). Visible to power users only. */
  notableQuirks?: string;
  /** How much to trust the research row for this glue. */
  sourceConfidence?: SourceConfidence;
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
