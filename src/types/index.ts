export type PullMethod = 'slide-hammer' | 'mini-lifter' | 'both';
export type GunTemp = 'Low' | 'Medium' | 'High';
/** Bond strength category, from the Anson PDR glue chart. */
export type GlueStrength = 'Medium' | 'High' | 'Super High';

/** A-D condition grade from the research dataset. `null` = unverified / not stated. */
export type ConditionGrade = 'A' | 'B' | 'C' | 'D' | null;

/** Source confidence rating from the research dataset. */
export type SourceConfidence = 'low' | 'medium' | 'medium-high' | 'medium-low' | 'high';

/** Anson's own Shopify weather tag — the AUTHORITATIVE classification per glue,
 *  carried by every product page on ansonpdr.com. This is the primary scoring
 *  signal because it's how Anson itself files the product. */
export type AnsonWeatherTag =
  | 'Cold'
  | 'Cool'
  | 'Moderate'
  | 'Hot'
  | 'Humid'
  | 'Collision';

/** Static pull-force value with attribution. PSI/lbs are NOT manufacturer-
 *  published for any of these sticks — they come from third-party dynamometer
 *  testing in the Gemini technical analysis. We surface them with explicit
 *  attribution ("per technical analysis"), never as manufacturer specs. */
export interface PullForce {
  /** Static load-to-failure in pounds. */
  lbs: number;
  /** Where the number came from. Required so the UI can attribute it. */
  source: 'gemini-analysis';
}

export interface Range {
  min: number;
  max: number;
}

/** A panel-temperature range the maker or distributor actually published.
 *  Higher confidence than the inferred optimalTemp window. */
export interface PublishedTempRange extends Range {
  /** Short attribution string for the published range. */
  note?: string;
}

export interface Glue {
  /** Stable id — same as Anson Shopify product handle (no leading slash). */
  id: string;
  /** Manufacturer / line (Plain Jane PDR, Anson PDR, Tequila PDR, etc.) */
  brand: string;
  name: string;
  color: string;

  // ---- PRIMARY scoring signal -------------------------------------------

  /** Anson's own weather tag(s) — the authoritative condition classification
   *  per the live ansonpdr.com catalog. The first tag is the most strongly
   *  associated. Empty array means Anson hasn't tagged it (rare). */
  ansonWeatherTags: AnsonWeatherTag[];

  // ---- Display windows (NOT primary scoring) ----------------------------

  /** Inferred optimal panel-temperature window in °F. Used for display
   *  ("Panel temp 60–90°F"), and as a secondary scoring tiebreaker. */
  optimalTemp: Range;
  /** Inferred optimal relative humidity window in %. */
  optimalHumidity: Range;
  /** Maker/distributor-published panel temp range, when one exists. */
  publishedTempRange?: PublishedTempRange;

  // ---- Strength axis ----------------------------------------------------

  /** Bond strength tier (Medium / High / Super High). */
  strength: GlueStrength;
  /** Attributed static pull-force in lbs (per Gemini technical analysis).
   *  Surface as "per technical analysis", never as a manufacturer spec.
   *  Only ~9 of the 41 carried sticks have a measured number. */
  pullForce?: PullForce;

  // ---- Tool / tab matching ---------------------------------------------

  pullMethod: PullMethod;
  gunTemp: GunTemp;
  /** Recommended gun-temp class (free-text from the Anson dataset).
   *  e.g. "high-temp gun", "dual-temp gun (run cooler) or high-temp". */
  recommendedGunTemp?: string;
  /** Recommended pull tool family (free-text). e.g. "mini-lifter or slide
   *  hammer", "heavy slide hammer + large tabs". */
  recommendedPullTool?: string;
  /** Recommended tab shape (free-text). e.g. "round/hex (dings, hail)",
   *  "large square/round (collision)". */
  recommendedTabShape?: string;
  /** What dent geometries this glue is best at (free-text from the
   *  authoritative crawl). e.g. "hail, large damage". */
  dentSuitability?: string;

  // ---- Catalog reference -----------------------------------------------

  /** Anson Shopify product handle (matches `id` by convention). */
  ansonHandle: string;
  /** Canonical ansonpdr.com product URL. */
  purchaseLink: string;

  // ---- Display copy ----------------------------------------------------

  /** Free-text condition descriptor for the spec card. */
  chartConditions: string;
  /** Short tagline used as the secondary line on cards. */
  bestFor: string;
  pros: string[];
  cons: string[];

  // ---- Research-derived secondary signals (kept for nuance) -------------

  coldMorningGrade?: ConditionGrade;
  hotAfternoonGrade?: ConditionGrade;
  dryDesertGrade?: ConditionGrade;
  humidCoastalGrade?: ConditionGrade;
  signatureUseCase?: string;
  techPreferredConditions?: string;
  notableQuirks?: string;
  sourceConfidence?: SourceConfidence;
}

// ============================================================================
// Tools — guns / slide hammers / mini-lifters / tabs / kits / release agents
// ============================================================================

export type ToolCategory =
  | 'glue-gun'
  | 'slide-hammer'
  | 'mini-lifter'
  | 'glue-tab'
  | 'kit'
  | 'release-agent'
  | 'knockdown';

/** A high-level gun-temperature class used to match a gun to a glue. */
export type GunTempClass =
  | 'high-temp'           // standard PDR gun
  | 'dual-temp'           // variable / dual-temp (runs cooler for cold/thin)
  | 'high-capacity-collision'; // high-output for collision sticks

/** A high-level tab shape used to match a tab to a dent geometry. */
export type TabShapeClass =
  | 'round'
  | 'hex'
  | 'oval'
  | 'crease'
  | 'blade'
  | 'smooth'
  | 'flat'
  | 'square'
  | 'collision-metal';

export interface Tool {
  /** Slug-style id (anson handle of the URL). */
  id: string;
  name: string;
  url: string;
  category: ToolCategory;
  /** Free-text subtype detail from the crawl (e.g. "cordless, dual-temperature, Ryobi 18V"). */
  subtype: string;
  /** Gun-temp class (only for category === 'glue-gun'). */
  gunTempClass?: GunTempClass;
  /** Tab shape class (only for category === 'glue-tab'). */
  tabShape?: TabShapeClass;
  /** Tab material (only for category === 'glue-tab'). e.g. "plastic", "steel/aluminum". */
  tabMaterial?: string;
  /** Free-text dent-types this tool is best for (from the matching guide). */
  dentTypes: string;
  /** Pull-method free-text, for display. */
  pullMethod: string;
  /** Short notes / "why pick this one" sentence. */
  notes: string;
}

/** Output of the glue→tool matcher: the four-piece rig the widget recommends. */
export interface ToolRecommendation {
  /** The glue this rig was built for. */
  glueId: string;
  /** Recommended primary glue gun. */
  gun: Tool;
  /** Recommended pull tool (slide hammer OR mini-lifter). */
  puller: Tool;
  /** Recommended tab to pair with the dent geometry. */
  tab: Tool;
  /** Recommended release / cleanup agent. */
  release: Tool;
  /** One-line rationale string for why this rig fits. */
  rationale: string;
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
  /** Where the data came from.
   *  - `forecast`: from Open-Meteo (next ≤ 16 days)
   *  - `projected`: synthesized beyond the 16-day window by cycling the
   *    forecast pattern as a climatology proxy (used for "This Month")
   *  - `manual`: hand-entered conditions */
  source: 'forecast' | 'projected' | 'manual';
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
