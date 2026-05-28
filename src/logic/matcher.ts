import { tools } from '@/data/tools';
import {
  AnsonWeatherTag,
  Glue,
  GunTempClass,
  TabShapeClass,
  Tool,
  ToolRecommendation,
} from '@/types';

/*
 * Glue → tool/tab matcher. Encodes the worked examples from the Anson
 * matching guide (condition + dent → glue → gun + puller + tab + release).
 *
 *   Inputs:
 *     - a Glue (drives gun-temp class + puller intensity)
 *     - an optional dent geometry (drives tab shape + puller scale)
 *
 *   Output:
 *     ToolRecommendation = { gun, puller, tab, release, rationale }
 *
 * Tools come from the live ansonpdr.com crawl (src/data/tools.ts). When a
 * specific tool isn't carried at the moment, we fall back to a category
 * lead — the user always gets a real Anson URL.
 */

export type DentGeometry =
  | 'small-ding'        // hail dimple, tiny dings
  | 'large-soft'        // hood waves, large body dents
  | 'sharp-crease'      // body line / hard edge
  | 'collision'         // big smash / GPDR collision
  | 'shallow-bodyline'; // gentle shallow near body line

// ============================================================================
// Inference: classify the glue
// ============================================================================

/** Map a glue's Anson tags + strength to the gun-temp class to recommend. */
function gunClassFor(glue: Glue): GunTempClass {
  if (glue.strength === 'Super High' || glue.ansonWeatherTags.includes('Collision')) {
    return 'high-capacity-collision';
  }
  if (glue.ansonWeatherTags.includes('Cold') || glue.ansonWeatherTags.includes('Cool')) {
    return 'dual-temp';
  }
  return 'high-temp';
}

/** Derive the most appropriate tab shape if the caller didn't pin a dent. */
function tabShapeFor(glue: Glue, dent: DentGeometry): TabShapeClass {
  if (dent === 'sharp-crease') {
    // Heavy collision glues with creases → blade/lateral-tension; otherwise crease tab.
    return glue.strength === 'Super High' ? 'blade' : 'crease';
  }
  if (dent === 'collision') {
    return 'collision-metal';
  }
  if (dent === 'large-soft') {
    return 'square';
  }
  if (dent === 'shallow-bodyline') {
    return 'smooth';
  }
  // Default small-ding: round (the workhorse).
  return 'round';
}

/** Pull-tool category: collisions get heavy slide hammer; small/medium get
 *  mini-lifter; mid-range can do either. */
function pullerCategoryFor(glue: Glue, dent: DentGeometry): 'mini-lifter' | 'slide-hammer' {
  if (dent === 'collision' || dent === 'large-soft') return 'slide-hammer';
  if (dent === 'sharp-crease' && glue.strength === 'Super High') return 'slide-hammer';
  return 'mini-lifter';
}

// ============================================================================
// Tool lookup
// ============================================================================

/** Pick the most-relevant tool in a category for a given filter. Falls back
 *  to "first tool of that category" so a real Anson URL always comes back. */
function pickTool(
  category: Tool['category'],
  pred?: (t: Tool) => boolean
): Tool {
  const inCategory = tools.filter((t) => t.category === category);
  if (pred) {
    const filtered = inCategory.filter(pred);
    if (filtered.length) return filtered[0];
  }
  return inCategory[0];
}

function pickGun(klass: GunTempClass): Tool {
  return pickTool('glue-gun', (t) => t.gunTempClass === klass);
}

function pickPuller(want: 'mini-lifter' | 'slide-hammer', dent: DentGeometry): Tool {
  if (want === 'slide-hammer') {
    if (dent === 'collision') {
      // Heavy collision-grade slide — Pullmaster is the heavy hitter in the catalog.
      const heavy = tools.find(
        (t) => t.category === 'slide-hammer' && /pullmaster|band-slide|storm/i.test(t.name)
      );
      if (heavy) return heavy;
    }
    if (dent === 'sharp-crease') {
      const passthru = tools.find(
        (t) => t.category === 'slide-hammer' && /pass-through/i.test(t.name)
      );
      if (passthru) return passthru;
    }
    return pickTool('slide-hammer');
  }
  if (dent === 'sharp-crease') {
    const crease = tools.find((t) => t.category === 'kit' && /crease/i.test(t.name));
    if (crease) return crease;
  }
  if (dent === 'large-soft') {
    const plate = tools.find(
      (t) => t.category === 'mini-lifter' && /pulling plate/i.test(t.name)
    );
    if (plate) return plate;
  }
  return pickTool('mini-lifter');
}

function pickTab(shape: TabShapeClass): Tool {
  return pickTool('glue-tab', (t) => t.tabShape === shape);
}

/** Cactus Juice helps grip in marginal (cold/humid) conditions; the standard
 *  Glue Pull Panel Prep is the all-rounder. */
function pickRelease(tags: AnsonWeatherTag[]): Tool {
  const marginal = tags.includes('Cold') || tags.includes('Humid');
  const cactus = tools.find(
    (t) => t.category === 'release-agent' && /cactus juice/i.test(t.name)
  );
  if (marginal && cactus) return cactus;
  return pickTool('release-agent');
}

// ============================================================================
// Rationale text
// ============================================================================

function rationaleFor(glue: Glue, dent: DentGeometry, klass: GunTempClass): string {
  const dentLabel = {
    'small-ding': 'small dings & hail dimples',
    'large-soft': 'large soft dents',
    'sharp-crease': 'sharp creases / body lines',
    collision: 'collision / big smash',
    'shallow-bodyline': 'shallow near-body-line dents',
  }[dent];

  const tagLabel = glue.ansonWeatherTags.length
    ? glue.ansonWeatherTags.join('/').toLowerCase()
    : 'general';

  const gunBlurb =
    klass === 'high-capacity-collision'
      ? 'paired with a high-capacity collision gun for the flow rate this stick needs'
      : klass === 'dual-temp'
      ? 'paired with a dual-temp gun (run cooler) for cool-weather flow'
      : 'paired with a high-temp gun for standard hot-melt flow';

  return `For ${dentLabel} on ${tagLabel} days — ${gunBlurb}.`;
}

// ============================================================================
// Public API
// ============================================================================

export function recommendRig(glue: Glue, dent: DentGeometry = 'small-ding'): ToolRecommendation {
  const klass = gunClassFor(glue);
  const shape = tabShapeFor(glue, dent);
  const pullerCat = pullerCategoryFor(glue, dent);
  const gun = pickGun(klass);
  const puller = pickPuller(pullerCat, dent);
  const tab = pickTab(shape);
  const release = pickRelease(glue.ansonWeatherTags);
  return {
    glueId: glue.id,
    gun,
    puller,
    tab,
    release,
    rationale: rationaleFor(glue, dent, klass),
  };
}

/** Best dent-geometry guess from a glue alone — used when the UI shows a
 *  default rig without asking the user what they're working on. */
export function inferredDentFor(glue: Glue): DentGeometry {
  if (glue.ansonWeatherTags.includes('Collision') || glue.strength === 'Super High') {
    return 'collision';
  }
  const desc = (glue.dentSuitability || glue.signatureUseCase || '').toLowerCase();
  if (/crease|body[ -]line|rail/.test(desc)) return 'sharp-crease';
  if (/large|big[ -]dent|smash/.test(desc)) return 'large-soft';
  return 'small-ding';
}
