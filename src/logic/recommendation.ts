import { glues as allGlues } from '@/data/glues';
import { TIME_BLOCKS } from '@/data/timeBlocks';
import {
  BlockRecommendation,
  ConditionGrade,
  DailyForecast,
  Glue,
  GlueScore,
  Range,
  TimeBlock,
  WeatherConditions,
} from '@/types';

const TEMP_TOLERANCE_F = 22;
const HUMIDITY_TOLERANCE = 32;

const WEIGHT_TEMP = 0.65;
const WEIGHT_HUMIDITY = 0.3;
const WEIGHT_PRESSURE = 0.05;

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
 * Pressure cue: lower barometric pressure tends to track damp/incoming weather.
 * Returns a small 0-1 factor (1 = neutral/high pressure, ~0.8 in deep lows).
 * Deliberately a weak signal compared to temp and humidity.
 */
function pressureFactor(pressureHpa: number): number {
  if (pressureHpa >= 1013) return 1;
  // ~1013 hPa is standard; 980 hPa (a strong low) lands near 0.8.
  return clamp01(1 - (1013 - pressureHpa) / 165);
}

/**
 * Classify the current temperature into a coarse band so we know which of the
 * research dataset's A-D grades to consult.
 *   <55°F → cold morning grade
 *   ≥85°F → hot afternoon grade
 *   55-85°F → neither (use a mild blend of both grades if both exist)
 */
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

/** Convert a research A-D grade to a small additive bonus on the 0-100 score. */
function gradePoints(grade: ConditionGrade | undefined): number {
  switch (grade) {
    case 'A': return 6;
    case 'B': return 2;
    case 'C': return -2;
    case 'D': return -8;
    default:  return 0; // unverified / null
  }
}

/**
 * Combine the per-band A-D grades from the research dataset into a single
 * additive nudge on the final 0-100 score. Caps at ±10 so it never
 * dominates the maker-stated range / chart-derived window — it just breaks
 * ties between glues whose raw ranges score similarly.
 */
function gradeBonus(glue: Glue, c: WeatherConditions): number {
  let bonus = 0;
  const tBand = tempBandOf(c.temperatureF);
  if (tBand === 'cold') bonus += gradePoints(glue.coldMorningGrade);
  else if (tBand === 'hot') bonus += gradePoints(glue.hotAfternoonGrade);
  else {
    // Mild: blend the two if both are stated, otherwise use whichever exists
    const cold = glue.coldMorningGrade ? gradePoints(glue.coldMorningGrade) : 0;
    const hot = glue.hotAfternoonGrade ? gradePoints(glue.hotAfternoonGrade) : 0;
    const present = (glue.coldMorningGrade ? 1 : 0) + (glue.hotAfternoonGrade ? 1 : 0);
    bonus += present ? (cold + hot) / 2 : 0;
  }
  const hBand = humidityBandOf(c.humidity);
  if (hBand === 'dry') bonus += gradePoints(glue.dryDesertGrade);
  else if (hBand === 'humid') bonus += gradePoints(glue.humidCoastalGrade);
  return Math.max(-10, Math.min(10, bonus));
}

export function scoreGlue(glue: Glue, c: WeatherConditions): GlueScore {
  // Prefer the maker/distributor-published range (research dataset, where one
  // exists) over the chart-inferred optimalTemp window. Published numbers
  // are higher-confidence — there are only ~5 of them across the lineup.
  const tempWindow = glue.publishedTempRange ?? glue.optimalTemp;
  const tempFit = rangeFit(c.temperatureF, tempWindow, TEMP_TOLERANCE_F);
  const humidityFit = rangeFit(c.humidity, glue.optimalHumidity, HUMIDITY_TOLERANCE);
  const pressFit = pressureFactor(c.pressureHpa);

  const raw =
    tempFit * WEIGHT_TEMP +
    humidityFit * WEIGHT_HUMIDITY +
    pressFit * WEIGHT_PRESSURE;
  const baseScore = raw * 100;
  const score = Math.max(0, Math.min(100, Math.round(baseScore + gradeBonus(glue, c))));

  const reasons: string[] = [];
  const warnings: string[] = [];
  const temp = Math.round(c.temperatureF);

  if (tempFit === 1) {
    const rangeDesc = glue.publishedTempRange
      ? `maker-published ${tempWindow.min}–${tempWindow.max}°F`
      : `optimal ${tempWindow.min}–${tempWindow.max}°F`;
    reasons.push(`Dialed in for ${temp}°F (${rangeDesc}).`);
  } else if (c.temperatureF < tempWindow.min) {
    warnings.push(
      `Cooler than ideal — runs best ${tempWindow.min}–${tempWindow.max}°F. Preheat the panel.`
    );
  } else {
    warnings.push(
      `Hotter than ideal — runs best ${tempWindow.min}–${tempWindow.max}°F. May release early.`
    );
  }

  if (humidityFit === 1) {
    reasons.push(`Handles ${Math.round(c.humidity)}% humidity well.`);
  } else if (c.humidity > glue.optimalHumidity.max) {
    warnings.push(
      `Humidity (${Math.round(c.humidity)}%) above its comfort zone — clean and dry the panel thoroughly.`
    );
  } else {
    warnings.push(`Drier than its usual range — adhesion should still be strong.`);
  }

  if (glue.strength === 'Super High') {
    reasons.push('Super-high strength — best for big, high-tension dents.');
  } else if (glue.strength === 'High') {
    reasons.push('High strength — solid for medium-to-large dents.');
  } else {
    reasons.push('Medium strength — best for small dents and finish work.');
  }

  return { glue, score, reasons, warnings };
}

/** All glues scored against the conditions, ranked best-first. */
export function rankGlues(
  c: WeatherConditions,
  glues: Glue[] = allGlues
): GlueScore[] {
  return glues
    .map((g) => scoreGlue(g, c))
    .sort((a, b) => b.score - a.score || a.glue.name.localeCompare(b.glue.name));
}

/** The viable picks (score ≥ threshold), capped at `limit`. */
export function topRecommendations(
  c: WeatherConditions,
  limit = 3,
  glues: Glue[] = allGlues
): GlueScore[] {
  const ranked = rankGlues(c, glues);
  const viable = ranked.filter((r) => r.score >= VIABLE_THRESHOLD);
  // Always return at least the single best, even if nothing clears the bar.
  return (viable.length ? viable : ranked.slice(0, 1)).slice(0, limit);
}

const avg = (nums: number[]): number =>
  nums.length ? nums.reduce((s, n) => s + n, 0) / nums.length : 0;

/** Average the hourly readings that fall inside a time block. */
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

/** Best glues for each of the four daily time blocks. */
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

/**
 * De-duplicated set of glues recommended across a span of forecasts —
 * powers the weekly/monthly "pre-buy everything" lists.
 */
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
