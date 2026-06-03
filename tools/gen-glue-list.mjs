#!/usr/bin/env node
/*
 * Generate docs/glue-list.{md,csv} from src/data/glues.ts — the canonical,
 * human-shareable list of every glue carried in the Glue IQ app, in app order.
 * Re-run after editing the glue data:  node tools/gen-glue-list.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = fs.readFileSync(path.join(ROOT, 'src/data/glues.ts'), 'utf8');

// Pull a double-quoted TS string value for `key:` out of a glue object block,
// honoring backslash escapes, then unescape to the real text.
function get(block, key) {
  const m = block.match(new RegExp(`${key}:\\s*"((?:[^"\\\\]|\\\\.)*)"`));
  if (!m) return '';
  return m[1].replace(/\\(.)/g, '$1'); // \" -> ", \\ -> \, etc.
}

const glues = [];
const seen = new Set();
for (const part of src.split(/\n\s*\{/)) {
  if (!/id:\s*"/.test(part) || !/name:\s*"/.test(part)) continue;
  const id = get(part, 'id');
  if (!id || seen.has(id)) continue;
  seen.add(id);
  glues.push({ id, brand: get(part, 'brand'), name: get(part, 'name'), strength: get(part, 'strength') });
}

const url = (g) => `https://ansonpdr.com/products/${g.id}`;
const date = new Date().toISOString().slice(0, 10);

let md = `# Glue IQ — Glues in App

Every glue used in the Glue IQ app, in app/data order. Generated from \`src/data/glues.ts\` by \`tools/gen-glue-list.mjs\`.

- **Total:** ${glues.length} glues
- **Generated:** ${date}
- **Order:** matches the app data file (not weather-ranked)
- **Strength:** app tier (Medium / High / Super High), not a manufacturer PSI

| # | Glue | Brand | Strength | Anson product URL |
|---|------|-------|----------|-------------------|
`;
glues.forEach((g, i) => {
  md += `| ${i + 1} | ${g.name} | ${g.brand} | ${g.strength} | ${url(g)} |\n`;
});
md += `\n> Note: "Brazilian Green" appears twice — different products (Anson Fast-PDR formula vs. Elimadent).\n`;
fs.writeFileSync(path.join(ROOT, 'docs/glue-list.md'), md);

const csvEsc = (s) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
let csv = 'number,name,brand,strength,anson_handle,anson_url\n';
glues.forEach((g, i) => {
  csv += [i + 1, csvEsc(g.name), csvEsc(g.brand), csvEsc(g.strength), csvEsc(g.id), csvEsc(url(g))].join(',') + '\n';
});
fs.writeFileSync(path.join(ROOT, 'docs/glue-list.csv'), csv);

console.log(`Wrote docs/glue-list.md and docs/glue-list.csv — ${glues.length} glues`);
