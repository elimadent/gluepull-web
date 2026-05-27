import { glues as allGlues } from '@/data/glues';
import { TIME_BLOCKS } from '@/data/timeBlocks';
import {
  BlockRecommendation,
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

export function scoreGlue(glue: Glue, c: WeatherConditions): GlueScore {
  const tempFit = rangeFit(c.temperatureF, glue.optimalTemp, TEMP_TOLERANCE_F);
  const humidityFit = rangeFit(c.humidity, glue.optimalHumidity, HUMIDITY_TOLERANCE);
  const pressFit = pressureFactor(c.pressureHpa);

  const raw =
    tempFit * WEIGHT_TEMP +
    humidityFit * WEIGHT_HUMIDITY +
    pressFit * WEIGHT_PRESSURE;
  const score = Math.round(raw * 100);

  const reasons: string[] = [];
  const warnings: string[] = [];
  const temp = Math.round(c.temperatureF);

  if (tempFit === 1) {
    reasons.push(
      `Dialed in for ${temp}°F (optimal ${glue.optimalTemp.min}–${glue.optimalTemp.max}°F).`
    );
  } else if (c.temperatureF < glue.optimalTemp.min) {
    warnings.push(
      `Cooler than ideal — runs best ${glue.optimalTemp.min}–${glue.optimalTemp.max}°F. Preheat the panel.`
    );
  } else {
    warnings.push(
      `Hotter than ideal — runs best ${glue.optimalTemp.min}–${glue.optimalTemp.max}°F. May release early.`
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
