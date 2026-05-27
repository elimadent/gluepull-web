import { accessories, getAccessoryById } from '@/data/accessories';
import { Accessory, Glue } from '@/types';

/** Always-needed prep items for any glue pull. */
const PREP_ESSENTIALS = ['alcohol', 'compound', 'rags', 'release-agent', 'heat-gun'];

const GUN_BY_TEMP: Record<Glue['gunTemp'], string> = {
  High: 'gun-high-temp',
  Medium: 'gun-dual-temp',
  Low: 'gun-low-temp',
};

/**
 * Build a recommended kit for a single glue: the right gun for its temp, the
 * pull tool(s) for its method, matching tabs, and the prep essentials.
 */
export function bundleForGlue(glue: Glue): Accessory[] {
  const ids: string[] = [GUN_BY_TEMP[glue.gunTemp]];

  if (glue.pullMethod === 'slide-hammer' || glue.pullMethod === 'both') {
    ids.push('slide-hammer', 'tabs-slide-hammer');
  }
  if (glue.pullMethod === 'mini-lifter' || glue.pullMethod === 'both') {
    ids.push('mini-lifter');
  }
  ids.push('tabs-variety', ...PREP_ESSENTIALS);

  const seen = new Set<string>();
  const out: Accessory[] = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    const acc = getAccessoryById(id);
    if (acc) out.push(acc);
  }
  return out;
}

/** Full kit covering a set of glues — for weekly/monthly pre-buy lists. */
export function bundleForGlues(glues: Glue[]): Accessory[] {
  const seen = new Set<string>();
  const out: Accessory[] = [];
  for (const glue of glues) {
    for (const acc of bundleForGlue(glue)) {
      if (seen.has(acc.id)) continue;
      seen.add(acc.id);
      out.push(acc);
    }
  }
  // Keep a stable, readable ordering by catalog position.
  return out.sort(
    (a, b) =>
      accessories.findIndex((x) => x.id === a.id) -
      accessories.findIndex((x) => x.id === b.id)
  );
}
