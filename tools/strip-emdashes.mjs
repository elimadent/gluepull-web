#!/usr/bin/env node
/* One-shot: strip user-facing em-dashes (—) from source strings, replace
 * with ", " (most natural for dependent clauses) and lone "-" elsewhere.
 * Only user-facing files — comments in unrelated files are untouched. */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const FILES = [
  'src/data/glues.ts',
  'src/data/products.ts',
  'src/data/accessories.ts',
  'src/screens/HomeScreen.tsx',
  'src/screens/PlanScreen.tsx',
  'src/screens/AboutScreen.tsx',
  'src/screens/GlueLibraryScreen.tsx',
  'src/screens/TipsScreen.tsx',
  'src/components/LocationPicker.tsx',
  'src/components/GlueCard.tsx',
  'src/components/PairedRig.tsx',
  'src/components/AccessoryRow.tsx',
  'src/components/SynergyStack.tsx',
  'src/utils/gunTemp.ts',
  'src/logic/recommendation.ts',
  'src/services/weather.ts',
];

const EM = '—'; // em dash
const PATTERN_SPACED = new RegExp(' ' + EM + ' ', 'g');
const PATTERN_BARE = new RegExp(EM, 'g');

let total = 0;
for (const rel of FILES) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) continue;
  let s = fs.readFileSync(p, 'utf8');
  const before = (s.match(PATTERN_BARE) || []).length;
  if (!before) continue;
  // " — " (space em-dash space) -> ", " — preserves spacing, natural reading
  s = s.replace(PATTERN_SPACED, ', ');
  // any remaining em-dashes (e.g. between numbers) -> "-"
  s = s.replace(PATTERN_BARE, '-');
  fs.writeFileSync(p, s);
  console.log(`${rel.padEnd(46)} -${before}`);
  total += before;
}
console.log(`Total em-dashes stripped: ${total}`);
