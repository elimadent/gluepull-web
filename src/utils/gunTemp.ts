import type { Glue } from '@/types';

/*
 * `Glue.gunTemp` is a qualitative tier (Low / Medium / High) for the GLUE
 * GUN temperature setting, not the panel temperature, and not a product
 * size. "Medium gun" on its own reads ambiguously, so these helpers attach
 * the industry-standard °F band every PDR tech recognizes:
 *
 *   Low-temp gun     ≈ 285–325°F   (cold-weather glues, easy release)
 *   Medium-temp gun  ≈ 325–375°F   (all-weather generalists)
 *   High-temp gun    ≈ 375–425°F   (hot-weather, big collision dents)
 *
 * Bands are approximate / depend on the specific gun model, hence the "≈".
 *
 * Panel temperature (the SURFACE we're pulling on) is a separate field on
 * the Glue type, `optimalTemp` and `publishedTempRange`. Use
 * `panelTempRange()` to format that one, they should never be confused.
 */

const GUN_TEMP_RANGE: Record<Glue['gunTemp'], string> = {
  Low: '285–325°F',
  Medium: '325–375°F',
  High: '375–425°F',
};

/** "High-temp gun (≈ 375–425°F)", full label for the GUN setting. */
export function gunTempLabel(tier: Glue['gunTemp']): string {
  return `${tier}-temp gun (≈ ${GUN_TEMP_RANGE[tier]})`;
}

/** Compact form for the comparison-grid cards where vertical space is tight:
 *  "Med-temp gun · 325–375°F" */
export function gunTempCompact(tier: Glue['gunTemp']): string {
  const short = tier === 'Medium' ? 'Med' : tier;
  return `${short}-temp gun · ${GUN_TEMP_RANGE[tier]}`;
}

/** "60–90°F (maker-published)", formats the recommended PANEL temperature
 *  range, preferring a maker-published range when we have one. */
export function panelTempRange(glue: Glue): { range: string; note: string | null } {
  const r = glue.publishedTempRange ?? glue.optimalTemp;
  return {
    range: `${r.min}–${r.max}°F`,
    note: glue.publishedTempRange ? 'maker-published' : null,
  };
}
