import { glues as allGlues } from '@/data/glues';
import { TIME_BLOCKS } from '@/data/timeBlocks';
import {
  AnsonWeatherTag,
  BlockRecommendation,
  ConditionGrade,
  DailyForecast,
  Glue,
  GlueScore,
  Range,
  TimeBlock,
  WeatherConditions,
} from '@/types';

/*
 * Scoring is anchored on Anson's OWN weather tags, the authoritative
 * classification per glue carried by every product page on ansonpdr.com.
 * That signal is much more reliable than third-party "optimal temperature
 * windows" we infer from prose. Temp/humidity windows still play a role,
 * but as a tiebreaker / fine-tuner rather than as primary scoring.
 *
 * Score breakdown (max 100):
 *
 *   Anson tag match (PRIMARY)   : up to 70
 *   Inferred temp-window fit    : up to 18
 *   Humidity-window fit         : up to 8
 *   Pressure cue                : up to 2
 *   Research A-D grade nudge    : ±2
 *
 * Manufacturer PSI numbers do NOT feed scoring, they're unpublished for
 * almost every stick. `pullForce` (third-party Gemini dynamometer data) is
 * surface-only display, not a scoring input.
 */

const TEMP_TOLERANCE_F = 24;
const HUMIDITY_TOLERANCE = 32;

const WEIGHT_ANSON_TAG = 70;
const WEIGHT_TEMP = 18;
const WEIGHT_HUMIDITY = 8;
const WEIGHT_PRESSURE = 2;

/** A score at or above this (0-100) is considered a viable pick. */
export const VIABLE_THRESHOLD = 55;

const clamp01 = (n: number): number => Math.max(0, Math.min(1, n));

/** 1.0 inside the range, decaying linearly to 0 across `tolerance` outside it. */
function rangeFit(value: number, range: Range, tolerance: number): number {
  if (value >= range.min && value <= range.max) return 1;
  const distance = value < range.min ? range.min - value : value - range.max;
  return clamp01(1 - distance / tolerance);
}

/**
 * Pressure cue: lower barometric pressure tracks damp/incoming weather.
 * Returns a small 0-1 factor (1 = neutral/high pressure, ~0.8 in deep lows).
 */
function pressureFactor(pressureHpa: number): number {
  if (pressureHpa >= 1013) return 1;
  return clamp01(1 - (1013 - pressureHpa) / 165);
}

// ============================================================================
// Anson weather-tag scoring (PRIMARY signal)
// ============================================================================

/** Which Anson weather tags are appropriate for the current temp+humidity.
 *  Returns each tag with a weight 0..1, the bigger the weight, the better
 *  this tag matches the conditions. */
function targetTagWeights(c: WeatherConditions): Partial<Record<AnsonWeatherTag, number>> {
  const t = c.temperatureF;
  const h = c.humidity;
  const out: Partial<Record<AnsonWeatherTag, number>> = {};

  // Temperature axis, bands overlap so transitions feel smooth.
  if (t < 50) out.Cold = 1;
  else if (t < 60) { out.Cold = 0.6; out.Cool = 1; }
  else if (t < 70) { out.Cool = 1; out.Moderate = 0.7; }
  else if (t < 80) { out.Moderate = 1; out.Hot = 0.4; }
  else if (t < 90) { out.Hot = 1; out.Moderate = 0.4; }
  else out.Hot = 1;

  // Humidity axis, only adds weight when humidity is high enough to matter.
  if (h >= 70) out.Humid = 1;
  else if (h >= 55) out.Humid = 0.6;
  // (No "dry" tag in the Anson taxonomy, Tequila Turquoise is the only
  //  explicitly low-humidity stick and its inferred humidity window catches it.)

  // Collision is never a weather match, it's a strength axis. The matcher
  // surfaces collision sticks when the user pivots to collision mode; in
  // weather scoring we keep them at zero so they don't crowd the daily picks.
  return out;
}

/** Anson-tag-match score, 0..1. Sums best-overlap contributions across the
 *  current target tags; partial overlaps count partially. */
function ansonTagFit(
  glueTags: AnsonWeatherTag[],
  target: Partial<Record<AnsonWeatherTag, number>>
): number {
  const targetEntries = Object.entries(target) as Array<[AnsonWeatherTag, number]>;
  if (!targetEntries.length || !glueTags.length) return 0.3; // soft baseline
  let bestSum = 0;
  let bestPossible = 0;
  for (const [tag, weight] of targetEntries) {
    bestPossible += weight;
    if (glueTags.includes(tag)) bestSum += weight;
  }
  if (bestPossible === 0) return 0.3;
  return clamp01(bestSum / bestPossible);
}

// ============================================================================
// Secondary nudges
// ============================================================================

type TempBand = 'cold' | 'mild' | 'hot';
function tempBandOf(tempF: number): TempBand {
  if (tempF < 55) return 'cold';
  if (tempF >= 85) return 'hot';
  return 'mild';
}

type HumidityBand = 'dry' | 'moderate' | 'humid';
function humidityBandOf(humidity: number): HumidityBand {
  if (humidity <= 30) return 'dry';
  if (humidity >= 65) return 'humid';
  return 'moderate';
}

function gradePoints(grade: ConditionGrade | undefined): number {
  switch (grade) {
    case 'A': return 1.5;
    case 'B': return 0.5;
    case 'C': return -0.5;
    case 'D': return -2;
    default:  return 0;
  }
}

/** Small ±2 nudge from the research A-D grades. */
function gradeBonus(glue: Glue, c: WeatherConditions): number {
  let bonus = 0;
  const tBand = tempBandOf(c.temperatureF);
  if (tBand === 'cold') bonus += gradePoints(glue.coldMorningGrade);
  else if (tBand === 'hot') bonus += gradePoints(glue.hotAfternoonGrade);
  const hBand = humidityBandOf(c.humidity);
  if (hBand === 'dry') bonus += gradePoints(glue.dryDesertGrade);
  else if (hBand === 'humid') bonus += gradePoints(glue.humidCoastalGrade);
  return Math.max(-2, Math.min(2, bonus));
}

// ============================================================================
// Public API
// ============================================================================

export function scoreGlue(glue: Glue, c: WeatherConditions): GlueScore {
  const target = targetTagWeights(c);
  const tagFit = ansonTagFit(glue.ansonWeatherTags, target);

  // Collision-only sticks fade out of daily weather scoring entirely, they
  // should appear via the matcher's "collision mode", not via daily ranking.
  const collisionOnly =
    glue.ansonWeatherTags.length === 1 && glue.ansonWeatherTags[0] === 'Collision';
  const tagComponent = collisionOnly ? 0.15 : tagFit;

  const tempWindow = glue.publishedTempRange ?? glue.optimalTemp;
  const tempFit = rangeFit(c.temperatureF, tempWindow, TEMP_TOLERANCE_F);
  const humidityFit = rangeFit(c.humidity, glue.optimalHumidity, HUMIDITY_TOLERANCE);
  const pressFit = pressureFactor(c.pressureHpa);

  const baseScore =
    tagComponent * WEIGHT_ANSON_TAG +
    tempFit * WEIGHT_TEMP +
    humidityFit * WEIGHT_HUMIDITY +
    pressFit * WEIGHT_PRESSURE;
  const score = Math.max(
    0,
    Math.min(100, Math.round(baseScore + gradeBonus(glue, c)))
  );

  const reasons: string[] = [];
  const warnings: string[] = [];
  const temp = Math.round(c.temperatureF);

  // Reason 1: Anson-tag match (primary axis)
  const matchedTags = glue.ansonWeatherTags.filter((t) => target[t]);
  if (matchedTags.length) {
    const labels = matchedTags.join(' + ');
    reasons.push(
      `Anson tags it ${labels.toLowerCase()}, matching today's conditions.`
    );
  } else if (collisionOnly) {
    reasons.push('Collision-grade adhesive, weather-agnostic.');
  } else {
    warnings.push(
      `Anson tags this for ${glue.ansonWeatherTags.join('/').toLowerCase() || 'general'} conditions, not today's.`
    );
  }

  // Reason 2: temp window
  if (tempFit === 1) {
    const rangeDesc = glue.publishedTempRange
      ? `maker-published ${tempWindow.min}–${tempWindow.max}°F`
      : `${tempWindow.min}–${tempWindow.max}°F window`;
    reasons.push(`Dialed in for ${temp}°F (${rangeDesc}).`);
  } else if (c.temperatureF < tempWindow.min) {
    warnings.push(
      `Cooler than ideal. Runs best ${tempWindow.min}–${tempWindow.max}°F. Preheat the panel.`
    );
  } else {
    warnings.push(
      `Hotter than ideal. Runs best ${tempWindow.min}–${tempWindow.max}°F. May release early.`
    );
  }

  // Reason 3: humidity
  if (humidityFit === 1) {
    reasons.push(`Handles ${Math.round(c.humidity)}% humidity well.`);
  } else if (c.humidity > glue.optimalHumidity.max) {
    warnings.push(
      `Humidity (${Math.round(c.humidity)}%) above its comfort zone. Clean and dry the panel.`
    );
  } else {
    warnings.push(`Drier than usual range. Adhesion should still be strong.`);
  }

  // Reason 4: strength + attributed pull-force (display only)
  if (glue.pullForce) {
    reasons.push(
      `${glue.pullForce.lbs} lbs static pull force per technical analysis.`
    );
  } else if (glue.strength === 'Super High') {
    reasons.push('Super-high strength, best for big high-tension dents.');
  } else if (glue.strength === 'High') {
    reasons.push('High strength, solid for medium-to-large dents.');
  } else {
    reasons.push('Medium strength, best for small dents and finish work.');
  }

  return { glue, score, reasons, warnings };
}

export function rankGlues(
  c: WeatherConditions,
  glues: Glue[] = allGlues
): GlueScore[] {
  return glues
    .map((g) => scoreGlue(g, c))
    .sort((a, b) => b.score - a.score || a.glue.name.localeCompare(b.glue.name));
}

export function topRecommendations(
  c: WeatherConditions,
  limit = 3,
  glues: Glue[] = allGlues
): GlueScore[] {
  const ranked = rankGlues(c, glues);
  const viable = ranked.filter((r) => r.score >= VIABLE_THRESHOLD);
  return (viable.length ? viable : ranked.slice(0, 1)).slice(0, limit);
}

const avg = (nums: number[]): number =>
  nums.length ? nums.reduce((s, n) => s + n, 0) / nums.length : 0;

export function conditionsForBlock(
  forecast: DailyForecast,
  block: TimeBlock
): WeatherConditions | null {
  const inBlock = forecast.hourly.filter(
    (h) => h.hour >= block.startHour && h.hour < block.endHour
  );
  if (!inBlock.length) return null;
  return {
    temperatureF: avg(inBlock.map((h) => h.temperatureF)),
    humidity: avg(inBlock.map((h) => h.humidity)),
    pressureHpa: avg(inBlock.map((h) => h.pressureHpa)),
  };
}

export function recommendForBlocks(
  forecast: DailyForecast
): BlockRecommendation[] {
  const out: BlockRecommendation[] = [];
  for (const block of TIME_BLOCKS) {
    const conditions = conditionsForBlock(forecast, block);
    if (!conditions) continue;
    out.push({ block, conditions, ranked: topRecommendations(conditions, 3) });
  }
  return out;
}

export function aggregateGluePicks(
  forecasts: DailyForecast[]
): { glue: Glue; days: number }[] {
  const counts = new Map<string, { glue: Glue; days: number }>();
  for (const forecast of forecasts) {
    const seen = new Set<string>();
    for (const block of recommendForBlocks(forecast)) {
      const top = block.ranked[0];
      if (!top || seen.has(top.glue.id)) continue;
      seen.add(top.glue.id);
      const entry = counts.get(top.glue.id);
      if (entry) entry.days += 1;
      else counts.set(top.glue.id, { glue: top.glue, days: 1 });
    }
  }
  return [...counts.values()].sort((a, b) => b.days - a.days);
}
