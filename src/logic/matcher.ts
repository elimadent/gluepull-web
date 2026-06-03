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

/** Best-seller rank lookup: lower = better seller, undefined = not a best
 *  seller. Supplied by the live Anson "Best Sellers" collection; absent when
 *  that data hasn't loaded (or failed), in which case picks fall back to the
 *  data-file order exactly as before. */
export type RankFn = (handle: string | undefined) => number | undefined;

/** From a pool of equally-valid candidates, PREFER the best seller: pick the
 *  lowest defined rank; if none are best sellers, keep the first (the prior
 *  rules-based winner). Relevance is already decided by the caller's filter —
 *  this only breaks ties by popularity. */
function chooseBest(pool: Tool[], rankOf?: RankFn): Tool {
  if (!rankOf || pool.length <= 1) return pool[0];
  let best = pool[0];
  let bestRank = rankOf(best.id);
  for (let i = 1; i < pool.length; i++) {
    const r = rankOf(pool[i].id);
    if (r !== undefined && (bestRank === undefined || r < bestRank)) {
      best = pool[i];
      bestRank = r;
    }
  }
  return best;
}

/** Pick the most-relevant tool in a category for a given filter, preferring
 *  best sellers among the matches. Falls back to "first tool of that
 *  category" so a real Anson URL always comes back. */
function pickTool(
  category: Tool['category'],
  pred?: (t: Tool) => boolean,
  rankOf?: RankFn
): Tool {
  const inCategory = tools.filter((t) => t.category === category);
  const filtered = pred ? inCategory.filter(pred) : inCategory;
  return chooseBest(filtered.length ? filtered : inCategory, rankOf);
}

function pickGun(klass: GunTempClass, rankOf?: RankFn): Tool {
  return pickTool('glue-gun', (t) => t.gunTempClass === klass, rankOf);
}

function pickPuller(
  want: 'mini-lifter' | 'slide-hammer',
  dent: DentGeometry,
  rankOf?: RankFn
): Tool {
  if (want === 'slide-hammer') {
    if (dent === 'collision') {
      // Heavy collision-grade slides — Pullmaster/band-slide/storm class.
      const heavy = tools.filter(
        (t) => t.category === 'slide-hammer' && /pullmaster|band-slide|storm/i.test(t.name)
      );
      if (heavy.length) return chooseBest(heavy, rankOf);
    }
    if (dent === 'sharp-crease') {
      const passthru = tools.filter(
        (t) => t.category === 'slide-hammer' && /pass-through/i.test(t.name)
      );
      if (passthru.length) return chooseBest(passthru, rankOf);
    }
    return pickTool('slide-hammer', undefined, rankOf);
  }
  if (dent === 'sharp-crease') {
    const crease = tools.filter((t) => t.category === 'kit' && /crease/i.test(t.name));
    if (crease.length) return chooseBest(crease, rankOf);
  }
  if (dent === 'large-soft') {
    const plate = tools.filter(
      (t) => t.category === 'mini-lifter' && /pulling plate/i.test(t.name)
    );
    if (plate.length) return chooseBest(plate, rankOf);
  }
  return pickTool('mini-lifter', undefined, rankOf);
}

function pickTab(shape: TabShapeClass, rankOf?: RankFn): Tool {
  return pickTool('glue-tab', (t) => t.tabShape === shape, rankOf);
}

/** Cactus Juice helps grip in marginal (cold/humid) conditions; the standard
 *  Glue Pull Panel Prep is the all-rounder. Best seller breaks ties. */
function pickRelease(tags: AnsonWeatherTag[], rankOf?: RankFn): Tool {
  const marginal = tags.includes('Cold') || tags.includes('Humid');
  const cactus = tools.filter(
    (t) => t.category === 'release-agent' && /cactus juice/i.test(t.name)
  );
  if (marginal && cactus.length) return chooseBest(cactus, rankOf);
  return pickTool('release-agent', undefined, rankOf);
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

export function recommendRig(
  glue: Glue,
  dent: DentGeometry = 'small-ding',
  rankOf?: RankFn
): ToolRecommendation {
  const klass = gunClassFor(glue);
  const shape = tabShapeFor(glue, dent);
  const pullerCat = pullerCategoryFor(glue, dent);
  const gun = pickGun(klass, rankOf);
  const puller = pickPuller(pullerCat, dent, rankOf);
  const tab = pickTab(shape, rankOf);
  const release = pickRelease(glue.ansonWeatherTags, rankOf);
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
