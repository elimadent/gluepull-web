#!/usr/bin/env node
/*
 * Code-gen: turn the live Anson research CSVs into the project's TS data
 * modules. Run once after the CSVs are refreshed.
 *
 *   node tools/build-anson-data.mjs
 *
 * Inputs (paths fixed for this host):
 *   anson_glue_database.csv    — 41 carried hot-melt sticks, full crawl
 *   anson_tools_database.csv   — 44 tools (guns, hammers, lifters, tabs, etc.)
 *
 * Outputs (overwrite):
 *   src/data/glues.ts          — Glue[] with anson_weather_tags + recommended tool/tab
 *   src/data/products.ts       — Anson product map (preserves rich image+desc for the
 *                                originally-scraped 22, links the new entries by URL only)
 *   src/data/tools.ts          — Tool[] with category, gun-temp class, tab shape
 *
 * Gemini pull-force numbers (from gemini_pdr_glue_science.txt dynamometer
 * testing) are hard-coded below by anson_handle — manufacturers don't publish
 * PSI, so we surface these with explicit attribution.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, '..');

const CSV_GLUES = 'C:/Users/james/AppData/Roaming/Claude/local-agent-mode-sessions/00ba3a31-f8aa-4054-b5b8-470068797b89/711d0367-8ddb-4a0b-8d23-1406e09cd7e7/local_b16f00a8-d6b6-4f91-b5b7-e65187566755/outputs/anson_glue_database.csv';
const CSV_TOOLS = 'C:/Users/james/AppData/Roaming/Claude/local-agent-mode-sessions/00ba3a31-f8aa-4054-b5b8-470068797b89/711d0367-8ddb-4a0b-8d23-1406e09cd7e7/local_b16f00a8-d6b6-4f91-b5b7-e65187566755/outputs/anson_tools_database.csv';

const OUT_GLUES = path.join(PROJECT_ROOT, 'src/data/glues.ts');
const OUT_PRODUCTS = path.join(PROJECT_ROOT, 'src/data/products.ts');
const OUT_TOOLS = path.join(PROJECT_ROOT, 'src/data/tools.ts');

// ============================================================================
// Gemini dynamometer pull-force, keyed by anson_handle.
// Source: gemini_pdr_glue_science.txt (third-party dynamometer testing).
// NOT manufacturer-published. Always surface with "per technical analysis"
// attribution — never as a manufacturer spec.
// ============================================================================
const PULL_FORCE_BY_HANDLE = {
  'root-beer-pdr-glue':                            600,
  'pdr-glue-traxx':                                540,
  'tequila-pdr-tools-ice-glue':                    540,
  'orange-fire-pdr-glue-systems':                  520,
  'tab-weld-pdr-glue':                             480,
  'hawg-pdr-glue-daniel-gromm':                    470,
  'burro-pink-pdr-glue':                           450,
  'carbon-tech-slime-pdr-glue-by-anson-pdr':       350,
  'swiss-blue-pdr-glue-plain-jane':                300,
};

// ============================================================================
// Rich product data (image + description) preserved from the earlier
// products.json scrape. Keyed by anson_handle (= new id).
// New CSV entries get matched: true with no image/description until a
// fresh re-scrape — the UI degrades gracefully.
// ============================================================================
const RICH_PRODUCTS = {
  'red-chile-pdr-glue-systems': {
    name: 'Red Chile PDR Hot Melt Glue Sticks - PDR Glue Systems',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0499/2545/6040/files/anson-pdr-red-chile-pdr-hot-glue-sticks-a1b2c3d4.jpg',
    description: 'PDR Glue Systems Red Chile dent removal glue is a high strength hot weather glue that is an imported European formula. These dent repair glue sticks have been used overseas by dent removal technicians for years and only recently PDR Glue Systems has imported this great dent glue and made it available to technicians in the USA. The Red Chile PDR glue sticks have a quick set time in the heat of the summer and give a strong pull.',
  },
  'yellow-jacket-pdr-glue-systems': {
    name: 'Yellow Jacket Hot Melt PDR Glue - PDR Glue Systems',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0499/2545/6040/files/anson-pdr-yellow-jacket-pdr-glue-warm-weather-f1a2b3c4.jpg',
    description: 'Unleash the power of Yellow Jacket Hot PDR Glue for superior paintless dent repair. This high-performance glue is designed for professionals seeking reliable and effective dent removal solutions. Its unique formula ensures a strong bond for pulling dents, while its hot application provides optimal working time. Experience efficient and clean dent repair with Yellow Jacket, a trusted name in PDR glue systems. Get the results you need with this essential tool for any PDR technician.',
  },
  'tequila-pdr-fire-glue': {
    name: 'Tequila Fire Hot Melt Glue',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0499/2545/6040/files/anson-pdr-tequila-fire-glue-hot-weather-skull-design-a1b2c3d4.jpg',
    description: 'Designed for durability and a strong bond, these glue sticks are perfect for warmer temperature. Whether you\'re working with hail or large damage Tequila Fire provides a reliable hold. Proudly made in the USA, these high-quality glue sticks ensure your tabs stay bonded.',
  },
  'xtreme-purple-pdr-glue-plain-jane': {
    name: 'Xtreme Purple Hot PDR Glue - Plain Jane PDR',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0499/2545/6040/files/anson-pdr-Plain-Jane-xtreme-purple-pdr-glue-sticks-a1b2c3d4.jpg',
    description: 'Plain Jane Xtreme Purple - The Plain Jane Xtreme Purple glue is a high strength all weather dent removal glue. The purple PDR glue is working best in warm to cool weather and is best when used with a high-temperature glue gun. This dent repair glue gives you a great strong glue pull and is removed easily with 91% isopropyl alcohol.',
  },
  'collision-glue-hard-pull-hot': {
    name: 'Collision Hard Pull Hot Melt Glue',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0499/2545/6040/files/anson-pdr-collision-hard-pull-glue-dent-repair-a1b2c3d4.jpg',
    description: 'The Anson Collision Hard Pull Glue Hot is designed for professional auto body repair. This specialized glue is formulated to provide a strong, reliable bond for dent pulling applications, ensuring efficient and effective repairs. Its high-tack formula grips firmly, allowing for precise manipulation and removal of dents. Ideal for collision repair technicians seeking dependable tools for restoring vehicle surfaces to their original condition. Trust Anson Collision for quality repair solutions.',
  },
  'dentout-red-pdr-glue': {
    name: 'DentOut Red Hot Melt PDR Glue - High Temp & Humidity',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0499/2545/6040/files/anson-pdr-dentout-red-hot-pdr-glue-sticks-a1b2c3d4.jpg',
    description: 'Introducing DentOut Red Hot Melt PDR Glue Sticks, engineered for superior performance in challenging conditions. These high-temperature glue sticks are specifically formulated to maintain their integrity and adhesion in both high heat and high humidity environments, ensuring reliable paintless dent repair (PDR) results. Their vibrant red color makes them easy to spot and manage during your repair process. DentOut deliver consistent, effective dent removal, even when the weather is working against you. Ideal for auto body professionals and DIY enthusiasts seeking dependable PDR solutions.',
  },
  'pink-snapper-pdr-glue-by-dead-on-dent-tools': {
    name: 'Dead Dent Tools Pink Snapper PDR Glue',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0499/2545/6040/products/image_9a45b1b1-835d-4cbb-bdc3-1d9f664bd49a.png',
    description: 'High humidity, warm temp adhesive designed specifically for hail techs.',
  },
  'orange-fire-pdr-glue-systems': {
    name: 'Orange Fire - Hot Melt Glue - PDR Glue Systems',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0499/2545/6040/files/anson-pdr-orange-fire-glue-sticks-dent-repair-a1b2c3.jpg',
    description: 'Introducing Orange Fire PDR Glue Sticks, One of our best selling hot weather glue, engineered for superior performance in paintless dent repair. These vibrant orange glue sticks offer exceptional adhesion and a fast set time, ensuring efficient and effective dent removal. Made in the USA, Orange Fire glue sticks are designed to work seamlessly with PDR glue systems, providing a reliable bond that won\'t damage your vehicle\'s finish. Experience the power and precision of Orange Fire for professional-grade results on every repair.',
  },
  'carbon-tech-slime-pdr-glue-by-anson-pdr': {
    name: 'Carbon Tech Slime PDR Glue',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0499/2545/6040/products/img_2148.jpg',
    description: 'High humidity, warm temp adhesive designed specifically for hail techs.',
  },
  'hawg-pdr-glue-daniel-gromm': {
    name: 'Hawg Hot Melt PDR Glue - Just Orange',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0499/2545/6040/files/anson-pdr-hawg-hot-pdr-glue-orange-sticks-a1b2c3d4.jpg',
    description: 'Introducing Hawg Hot Melt PDR Glue - Just Orange, the ultimate solution for all-around temperature paintless dent repair. Developed by DG, this specially formulated orange glue provides a strong, reliable bond for thicker metal, tanks, and roof rails. Its unique composition ensures optimal performance in various conditions, making it a go-to choice for PDR professionals. Proudly made in the USA, Hawg Glue delivers exceptional strength and durability, helping you achieve flawless repairs every time. Trust Hawg Glue for your most demanding PDR jobs.',
  },
  'root-beer-pdr-glue': {
    name: 'Root Beer Hot PDR Glue',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0499/2545/6040/files/anson-pdr-root-beer-hot-pdr-glue-sticks-a1b2c3d4.jpg',
    description: 'This Super Premium PDR Dent Removal Adhesive is destined to be the choice of professional Dent Repair techs in "Hot Weather" and "Big Dent" removal. Anson PDR, is proud to be the industry leader in PDR Glue Adhesives. For technicians that purge glues, Root Beer glue purges well with Xtreme Purple in warm weather and Anson White in cooler temperatures. Enjoy the NEW Root Beer Super Premium formula!',
  },
  'purple-perfection-pdr-glue-by-dent-reaper': {
    name: 'Purpull Perfection PDR Hot Melt Glue by Dent Reaper',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0499/2545/6040/files/anson-pdr-Dent-Reaper-purpull-perfection-pdr-glue-sticks-a1b2c3d4.jpg',
    description: 'PurPull Perfection was formulated to be the best all around all weather PDR glue available, as a hybrid PDR Tech I wanted a glue that would perform in as many scenarios as possible. I think we did just that! Premium hot glue temperature rated around 60° to 90° Fahrenheit. Excellent Hail rail glue. Will exceed your expectations on large collision damage as well. Translucent Purple in color.',
  },
  'black-burro-pdr-glue': {
    name: 'Burro Black Widow Hot Melt PDR Glue',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0499/2545/6040/files/anson-pdr-Burro-black-widow-pdr-glue-a1b2c3d4.jpg',
    description: 'Introducing the Burro Black Widow Hot Melt PDR Glue, engineered for superior performance in Paintless Dent Repair. This premium PDR glue offers exceptional adhesion and a strong bond, ensuring efficient and effective dent removal. Its specialized formula is designed to work seamlessly with PDR tools, providing the reliability professionals demand. Proudly made in the all weather good.',
  },
  'green-pdr-glue-sticks-burro': {
    name: 'Burro Cactus Green - Hot Melt PDR glue',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0499/2545/6040/files/ansonpdr-cactus-green-pdr-glue-sticks-a1b2c3d4_5011737b-056d-40db-8335-9a9920897700.jpg',
    description: 'Burro Cactus Green - these PDR glue sticks have been the tried and true all-weather dent removal glue sticks trusted by paintless dent repair technicians for years. If you are in need of a just one kind of PDR glue stick that will work in almost all climates this is the one for you. The Burro Cactus Green dent removal glue sticks are the classic original green PDR glue that has been trusted by the professional PDR industry for many years.',
  },
  'pdr-glue-traxx': {
    name: 'Glue Traxx -  Hot MeltPDR glue',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0499/2545/6040/files/anson-pdr-glue-traxx-hot-pdr-glue-sticks-teal-a1b2c3d4.jpg',
    description: 'Introducing Glue Traxx Hot Melt PDR Glue Sticks, your go-to solution for professional Paintless Dent Repair. Engineered for optimal adhesion and controlled set times, these glue sticks ensure a strong bond without damaging your vehicle\'s finish. The unique formula provides excellent pulling power, making dent removal efficient and effective. Proudly made in the USA, Glue Traxx offers the reliability and performance that auto body professionals demand. Get the job done right with our premium PDR glue sticks.',
  },
  'tequila-pdr-glue': {
    name: 'Tequila Turquoise PDR Glue',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0499/2545/6040/products/tequila_bag_v3ar-1.jpg',
    description: 'Tequila Turquoise hot glue is ideal for every day mid temperature weather, low humidity.',
  },
  'tab-weld-pdr-glue': {
    name: 'Tab Weld Hot Melt PDR Glue',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0499/2545/6040/files/ansonpdr-tabweld-pdr-glue-sticks-a1b2c3.jpg',
    description: 'Tab Weld Hot Melt PDR Glue sticks are expertly formulated for superior adhesion and performance in Paintless Dent Repair (PDR). These high-quality glue sticks ensure a strong, reliable bond to effectively pull dents without damaging your vehicle\'s paint. Designed for professional use, they offer consistent results and easy application with any standard PDR glue gun. Proudly made in the USA, Tab Weld PDR glue sticks are the trusted choice for auto body technicians seeking efficiency and precision in their repair work. Achieve flawless finishes and restore your vehicle\'s appearance with confidence.',
  },
  'burro-pink-pdr-glue': {
    name: 'Pink Hot PDR Glue  - Burro Bubble Gum',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0499/2545/6040/files/anson-pdr-pink-pdr-Bubble-Gum-glue-sticks-a1b2c3d4.jpg',
    description: 'Burro Bubble Gum Pink PDR Glue - This PDR glue has quickly risen to become a favorite among dent removal technicians. This dent removal glue performs best during warm to hot weather but can be used during the cooler months. Don\'t let the pink color fool you these dent removal glue sticks pack a punch. The Pink PDR glue sticks from Burro give a strong pull and drips and runs out of your glue gun less than normal PDR glues. The Burro Bubble Gum Pink glue come in re-usable heavy duty bags with 10 pieces of 10-inch glue sticks.',
  },
  'anson-pdr-black-glue': {
    name: 'Anson Black Hot Melt PDR Glue',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0499/2545/6040/files/anson-pdr-black-hot-pdr-glue-silver-foil-pouch-a1b2c3.jpg',
    description: 'Anson Black Hot Melt PDR Glue is a premium quality adhesive designed for Paintless Dent Repair (PDR) professionals. This specialized black glue offers superior adhesion and a strong bond, ensuring efficient and effective dent removal without damaging the vehicle\'s paint. Its hot melt formula provides a quick set time, allowing for faster workflow and increased productivity. Proudly made in the USA, Anson PDR Glue is formulated for durability and reliability, making it an essential tool for achieving flawless repairs on all types of vehicles. Trust Anson for your PDR needs.',
  },
  'white-pdr-glue-sticks-anson': {
    name: 'White hot PDR Glue - Anson PDR',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0499/2545/6040/files/anson-pdr-white-hot-pdr-glue-sticks-a1b2c3d4.jpg',
    description: 'White Anson PDR Glue - We are now carrying ansonpdr.com brand high-strength PDR glue. These glue sticks are white and give a high-strength, strong glue pull. We had several professional PDR companies test the ansonpdr.com white glue sticks. Each of the technicians have stated that this glue gives one of the strongest pulls when compared to other glues on the market. This is an all-weather glue; however, we have seen this glue perform at its best during moderate to cool temps.',
  },
  'tequila-pdr-tools-ice-glue': {
    name: 'Tequila Ice Glue',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0499/2545/6040/products/teq-cold.png',
    description: 'Tequila Ice Glue - Cold Weather Hot glue',
  },
  'swiss-blue-pdr-glue-plain-jane': {
    name: 'Swiss Blue Hot Melt PDR Glue - Plain Jane',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0499/2545/6040/files/anson-pdr-Plain-Janes-wiss-blue-pdr-glue-a1b2c3d4.jpg',
    description: 'Introducing the Swiss Blue Hot PDR Glue from Plain Jane, your go-to solution for professional Paintless Dent Repair. This high-performance glue is formulated for optimal adhesion and easy removal, ensuring a clean finish every time. Its vibrant Swiss Blue color makes it easy to track during application. Designed for use with PDR slide hammers and glue systems, this glue provides the strong bond needed to pull dents effectively without damaging the surrounding paint. Mainly a cold weather glue that deliver exceptional results, making your repair process smoother and more efficient.',
  },
  'dentout-yellow-pdr-glue': {
    name: 'DentOut Yellow Hot Melt PDR Glue - Cold Weather',
    imageUrl: 'https://cdn.shopify.com/s/files/1/0499/2545/6040/files/anson-pdr-Dent-Out-yellow-hot-pdr-glue-sticks-cold-weather-f8a3b1c2.jpg',
    description: 'Ensure effective paintless dent repair, even in colder temperatures, with Dent Out Yellow Hot Melt PDR Glue. This specially formulated glue provides a strong, reliable bond for PDR tools, allowing for precise pulling and lifting of dents without damaging the vehicle\'s finish. Its vibrant yellow color ensures visibility during application. Designed for seamless repairs in various weather conditions, shines in cold weather.',
  },
};

// ============================================================================
// Minimal CSV parser — handles double-quoted fields with embedded commas
// and escaped double-quotes. Returns array of row objects keyed by header.
// ============================================================================
function parseCSV(raw) {
  // Strip BOM if present
  if (raw.charCodeAt(0) === 0xFEFF) raw = raw.slice(1);
  const rows = [];
  let row = [];
  let cur = '';
  let inQ = false;
  let i = 0;
  while (i < raw.length) {
    const c = raw[i];
    if (inQ) {
      if (c === '"' && raw[i + 1] === '"') { cur += '"'; i += 2; continue; }
      if (c === '"') { inQ = false; i++; continue; }
      cur += c; i++; continue;
    }
    if (c === '"') { inQ = true; i++; continue; }
    if (c === ',') { row.push(cur); cur = ''; i++; continue; }
    if (c === '\n' || c === '\r') {
      // \r\n → consume just one newline pair
      row.push(cur); cur = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
      if (c === '\r' && raw[i + 1] === '\n') i += 2; else i++;
      continue;
    }
    cur += c; i++;
  }
  if (cur.length || row.length) { row.push(cur); rows.push(row); }
  if (!rows.length) return [];
  const headers = rows[0];
  return rows.slice(1).map((r) => {
    const o = {};
    for (let j = 0; j < headers.length; j++) o[headers[j]] = (r[j] ?? '').trim();
    return o;
  });
}

// ============================================================================
// Glue transform — CSV row → Glue object
// ============================================================================

/** Parse Anson weather tags from the comma-separated CSV value. Strips the
 *  "Weather-" prefix; ignores marketing flags like "Gold Rush". If the column
 *  contains only narrative text ("none (descriptor: …)"), derive defaults
 *  from the temp_band column so every glue still gets at least one tag. */
function parseWeatherTags(raw, tempBand) {
  const known = ['Cold', 'Cool', 'Moderate', 'Hot', 'Humid', 'Collision'];
  const parsed = !raw
    ? []
    : raw
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)
        .map((t) => t.replace(/^Weather-/, ''))
        .filter((t) => known.includes(t));
  if (parsed.length) return parsed;

  // No explicit Anson tags — derive from the human-written temp_band so
  // these (rare) rows still score and don't get dropped by emit filters.
  const band = (tempBand || '').toLowerCase();
  const derived = [];
  if (/cold/.test(band)) derived.push('Cold');
  if (/cool/.test(band)) derived.push('Cool');
  if (/moderate|all-season|all-weather/.test(band)) derived.push('Moderate');
  if (/warm|hot/.test(band)) derived.push('Hot');
  if (/humid/.test(band)) derived.push('Humid');
  if (/collision/.test(band)) derived.push('Collision');
  return derived.length ? derived : ['Moderate']; // safe default
}

/** Map free-text temp band ↔ inferred {min, max} window in °F.
 *  Used when the CSV doesn't have an explicit number range. */
function inferTempRange(tags, tempBand, panelTempRaw) {
  // Prefer explicit numeric in `optimal_panel_temp_f` like "60-90", "40-70", "70-100+"
  if (panelTempRaw && panelTempRaw !== 'unverified') {
    const m = panelTempRaw.match(/(\d+)\s*[-–]\s*(\d+)/);
    if (m) return { min: Number(m[1]), max: Number(m[2]) };
    const lo = panelTempRaw.match(/(\d+)\s*\+/);
    if (lo) return { min: Number(lo[1]), max: 110 };
    const ge = panelTempRaw.match(/^>=?\s*(\d+)/);
    if (ge) return { min: Number(ge[1]), max: 110 };
  }
  // Otherwise derive from tags + the temp_band hint
  const has = (t) => tags.includes(t);
  if (has('Collision') && !has('Cool') && !has('Cold')) return { min: 60, max: 105 };
  if (has('Hot') && has('Humid')) return { min: 70, max: 100 };
  if (has('Hot') && has('Cool')) return { min: 50, max: 100 };
  if (has('Hot')) return { min: 75, max: 105 };
  if (has('Moderate') && has('Humid')) return { min: 60, max: 90 };
  if (has('Moderate') && has('Cool')) return { min: 55, max: 85 };
  if (has('Moderate')) return { min: 60, max: 90 };
  if (has('Cool') && has('Cold')) return { min: 35, max: 70 };
  if (has('Cool')) return { min: 50, max: 80 };
  if (has('Cold')) return { min: 35, max: 65 };
  return { min: 60, max: 90 }; // safe all-weather default
}

function inferHumidity(tags) {
  if (tags.includes('Humid')) return { min: 40, max: 95 };
  // Tequila Turquoise is the only Anson-tagged low-humidity stick — keyed by
  // signature low-humidity copy in the CSV row, not by tag. Default mid.
  return { min: 20, max: 80 };
}

/** "high (super-premium)" → "High"; "medium" → "Medium"; "Super-high" → "Super High" */
function normalizeStrength(raw) {
  const s = (raw || '').toLowerCase();
  if (/super|extreme|hard\s*pull|collision|ultra/.test(s)) return 'Super High';
  if (s.startsWith('medium-low') || s.startsWith('low')) return 'Medium';
  if (s.startsWith('medium')) return 'Medium';
  if (s.startsWith('high') || /strong/.test(s)) return 'High';
  return 'High'; // most are high; safer default than Medium
}

/** Map the CSV gun-temp category to our Low/Medium/High legacy enum.
 *  "dual-temp gun (run cooler) or high-temp" → Medium (variable, run cooler) */
function normalizeGunTemp(rec) {
  const s = (rec || '').toLowerCase();
  if (s.includes('dual-temp') || s.includes('variable') || s.includes('run cooler')) return 'Medium';
  if (s.includes('high-capacity') || s.includes('collision gun')) return 'High';
  if (s.includes('low')) return 'Low';
  return 'High';
}

function normalizePullMethod(rec) {
  const s = (rec || '').toLowerCase();
  if (s.includes('mini-lifter') && s.includes('slide')) return 'both';
  if (s.includes('mini-lifter')) return 'both'; // crate lists both; treat as both
  if (s.includes('slide')) return 'slide-hammer';
  return 'both';
}

/** Use the CSV cold_morning_grade — formatted "A (maker: ...)" etc. */
function parseGrade(raw) {
  if (!raw || raw === 'unverified') return null;
  const m = raw.match(/^([ABCD])/);
  return m ? m[1] : null;
}

/** Pull "60–105°F" / "60-90F" / "(70-100+°F)" published range out of the
 *  thermal_notes column. */
function parsePublishedTemp(thermalNotes, panelTempRaw) {
  const sources = [panelTempRaw, thermalNotes].filter(Boolean);
  for (const src of sources) {
    if (!src || src === 'unverified') continue;
    const explicit = src.match(/(\d+)\s*[-–]\s*(\d+)\s*\+?\s*°?\s*F/i);
    if (explicit) {
      return {
        min: Number(explicit[1]),
        max: Number(explicit[2]),
        note: src.length < 80 ? src : 'maker-published',
      };
    }
    const plus = src.match(/(\d+)\s*\+\s*°?\s*F/);
    if (plus) {
      return { min: Number(plus[1]), max: 110, note: 'maker-published lower bound' };
    }
  }
  return undefined;
}

function splitList(raw) {
  if (!raw) return [];
  return raw
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean);
}

function transformGlue(row) {
  const handle = row.anson_handle;
  const tags = parseWeatherTags(row.anson_weather_tags, row.temp_band);
  const optimalTemp = inferTempRange(tags, row.temp_band, row.optimal_panel_temp_f);
  const optimalHumidity = inferHumidity(tags);
  const published = parsePublishedTemp(row.thermal_notes, row.optimal_panel_temp_f);
  const pullForceLbs = PULL_FORCE_BY_HANDLE[handle];

  // Tequila Turquoise — only stick Anson explicitly tags for LOW humidity
  if (handle === 'tequila-pdr-glue') {
    optimalHumidity.min = 10;
    optimalHumidity.max = 50;
  }

  return {
    id: handle,
    ansonHandle: handle,
    brand: row.brand,
    name: row.product_name,
    color: row.color_visual && row.color_visual !== 'unverified' ? row.color_visual : 'unverified',
    ansonWeatherTags: tags,
    optimalTemp,
    optimalHumidity,
    publishedTempRange: published,
    strength: normalizeStrength(row.strength_category),
    pullForce: pullForceLbs ? { lbs: pullForceLbs, source: 'gemini-analysis' } : undefined,
    pullMethod: normalizePullMethod(row.recommended_pull_tool || row.best_pull_method),
    gunTemp: normalizeGunTemp(row.recommended_gun_temp || row.gun_temp_category),
    recommendedGunTemp: row.recommended_gun_temp || undefined,
    recommendedPullTool: row.recommended_pull_tool || undefined,
    recommendedTabShape: row.recommended_tab_shape || undefined,
    dentSuitability: row.dent_suitability || undefined,
    purchaseLink: row.anson_url,
    chartConditions: (row.temp_band || '').replace(/\b\w/g, (c) => c.toUpperCase()),
    bestFor: row.signature_use_case || row.tech_preferred_conditions || row.thermal_notes || '',
    pros: splitList(row.pros).slice(0, 4),
    cons: splitList(row.cons).slice(0, 4),
    coldMorningGrade: parseGrade(row.cold_morning_grade),
    hotAfternoonGrade: parseGrade(row.hot_afternoon_grade),
    dryDesertGrade: parseGrade(row.dry_desert_grade),
    humidCoastalGrade: parseGrade(row.humid_coastal_grade),
    signatureUseCase: row.signature_use_case || undefined,
    techPreferredConditions: row.tech_preferred_conditions || undefined,
    notableQuirks: row.notable_quirks || undefined,
    sourceConfidence: parseSourceConfidence(row.source_confidence),
  };
}

function parseSourceConfidence(raw) {
  if (!raw) return undefined;
  const s = raw.toLowerCase();
  if (s.startsWith('high')) return 'high';
  if (s.startsWith('medium-high')) return 'medium-high';
  if (s.startsWith('medium-low')) return 'medium-low';
  if (s.startsWith('medium')) return 'medium';
  if (s.startsWith('low')) return 'low';
  return 'medium';
}

// ============================================================================
// Tool transform — CSV row → Tool object
// ============================================================================
function handleFromUrl(url) {
  if (!url) return '';
  const m = url.match(/\/(products|collections)\/([^/?]+)/);
  return m ? m[2] : '';
}

function gunTempClass(name, subtype) {
  const blob = `${name} ${subtype}`.toLowerCase();
  if (blob.includes('dual-temp') || blob.includes('variable')) return 'dual-temp';
  if (blob.includes('high-capacity') || blob.includes('collision') || blob.includes('250w') || blob.includes('820')) return 'high-capacity-collision';
  return 'high-temp';
}

function tabShapeClass(rec) {
  const s = (rec || '').toLowerCase();
  if (s.includes('blade')) return 'blade';
  if (s.includes('crease')) return 'crease';
  if (s.includes('round')) return 'round';
  if (s.includes('hex')) return 'hex';
  if (s.includes('oval')) return 'oval';
  if (s.includes('square')) return 'square';
  if (s.includes('smooth')) return 'smooth';
  if (s.includes('flat') || s.includes('micro')) return 'flat';
  if (s.includes('steel') || s.includes('aluminum')) return 'collision-metal';
  return undefined;
}

function categorize(catRaw) {
  const c = (catRaw || '').toLowerCase();
  if (c.includes('glue gun')) return 'glue-gun';
  if (c.includes('slide hammer')) return 'slide-hammer';
  if (c.includes('mini-lifter') || c.includes('lifter')) return 'mini-lifter';
  if (c.includes('tab')) return 'glue-tab';
  if (c.includes('kit')) return 'kit';
  if (c.includes('release') || c.includes('cleanup') || c.includes('cactus')) return 'release-agent';
  if (c.includes('knockdown') || c.includes('blending')) return 'knockdown';
  return 'glue-gun';
}

function transformTool(row) {
  const cat = categorize(row.category);
  return {
    id: handleFromUrl(row.anson_url) || row.tool_name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    name: row.tool_name,
    url: row.anson_url,
    category: cat,
    subtype: row.subtype || '',
    gunTempClass: cat === 'glue-gun' ? gunTempClass(row.tool_name, row.subtype) : undefined,
    tabShape: cat === 'glue-tab' ? tabShapeClass(row.tab_shape) : undefined,
    tabMaterial: cat === 'glue-tab' ? (row.tab_material || undefined) : undefined,
    dentTypes: row.dent_types || '',
    pullMethod: row.pull_method || '',
    notes: row.notes || '',
  };
}

// ============================================================================
// TypeScript emit helpers
// ============================================================================
/** Strip em-dashes from emitted strings — James prefers plainer punctuation
 *  across the UI, so we normalize at the source instead of fighting CSV
 *  copy that may use em-dashes. */
function stripEmDash(s) {
  // " — " (space + em-dash + space) → ", " — preserves clause flow
  // any remaining lone em-dash → "-"
  return s.replace(/ — /g, ', ').replace(/—/g, '-');
}

function literal(v) {
  if (v === undefined) return 'undefined';
  if (v === null) return 'null';
  if (typeof v === 'number') return String(v);
  if (typeof v === 'boolean') return String(v);
  if (typeof v === 'string') return JSON.stringify(stripEmDash(v));
  if (Array.isArray(v)) return `[${v.map(literal).join(', ')}]`;
  if (typeof v === 'object') {
    const parts = Object.entries(v)
      .filter(([, val]) => val !== undefined)
      .map(([k, val]) => `${k}: ${literal(val)}`);
    return `{ ${parts.join(', ')} }`;
  }
  return JSON.stringify(v);
}

function emitGlue(g) {
  // Order fields for readability
  const ordered = [
    ['id', g.id],
    ['ansonHandle', g.ansonHandle],
    ['brand', g.brand],
    ['name', g.name],
    ['color', g.color],
    ['ansonWeatherTags', g.ansonWeatherTags],
    ['optimalTemp', g.optimalTemp],
    ['optimalHumidity', g.optimalHumidity],
    ['publishedTempRange', g.publishedTempRange],
    ['strength', g.strength],
    ['pullForce', g.pullForce],
    ['pullMethod', g.pullMethod],
    ['gunTemp', g.gunTemp],
    ['recommendedGunTemp', g.recommendedGunTemp],
    ['recommendedPullTool', g.recommendedPullTool],
    ['recommendedTabShape', g.recommendedTabShape],
    ['dentSuitability', g.dentSuitability],
    ['purchaseLink', g.purchaseLink],
    ['chartConditions', g.chartConditions],
    ['bestFor', g.bestFor],
    ['pros', g.pros],
    ['cons', g.cons],
    ['coldMorningGrade', g.coldMorningGrade],
    ['hotAfternoonGrade', g.hotAfternoonGrade],
    ['dryDesertGrade', g.dryDesertGrade],
    ['humidCoastalGrade', g.humidCoastalGrade],
    ['signatureUseCase', g.signatureUseCase],
    ['techPreferredConditions', g.techPreferredConditions],
    ['notableQuirks', g.notableQuirks],
    ['sourceConfidence', g.sourceConfidence],
  ];
  const inner = ordered
    .filter(([, v]) => v !== undefined && !(Array.isArray(v) && v.length === 0))
    .map(([k, v]) => `    ${k}: ${literal(v)},`)
    .join('\n');
  return `  {\n${inner}\n  },`;
}

function emitGluesFile(glues) {
  const counts = glues.reduce((acc, g) => {
    g.ansonWeatherTags.forEach((t) => (acc[t] = (acc[t] || 0) + 1));
    return acc;
  }, {});
  const tagSummary = Object.entries(counts)
    .sort()
    .map(([k, v]) => `${k}=${v}`)
    .join(', ');
  return `import { Glue } from '@/types';

/**
 * Anson PDR hot-melt glue catalog — rebuilt from the live ansonpdr.com crawl.
 *
 *   Source: tools/build-anson-data.mjs (re-run after refreshing the CSV).
 *   Input:  anson_glue_database.csv — 41 carried hot-melt sticks.
 *   Tag distribution: ${tagSummary}.
 *
 * SCORING NOTE: \`ansonWeatherTags\` is the PRIMARY scoring signal — it's
 * Anson's own Shopify classification per glue, the authoritative answer to
 * "what conditions is this for". \`optimalTemp\` / \`optimalHumidity\` are
 * display windows + a secondary tiebreaker, NOT primary scoring inputs.
 *
 * PULL-FORCE NOTE: \`pullForce\` is third-party dynamometer data from the
 * Gemini technical analysis (gemini_pdr_glue_science.txt). Manufacturers
 * do NOT publish PSI. Always render with explicit attribution ("per
 * technical analysis") — never present as a manufacturer spec.
 */
export const glues: Glue[] = [
${glues.map(emitGlue).join('\n')}
];

export const getGlueById = (id: string): Glue | undefined =>
  glues.find((g) => g.id === id);
`;
}

function emitProductsFile(glues) {
  const entries = glues.map((g) => {
    const rich = RICH_PRODUCTS[g.ansonHandle];
    const inner = [
      `    matched: true`,
      `    name: ${JSON.stringify(rich?.name || g.name)}`,
      `    imageUrl: ${rich?.imageUrl ? JSON.stringify(rich.imageUrl) : 'null'}`,
      ...(rich?.description ? [`    description: ${JSON.stringify(rich.description)}`] : []),
      `    productUrl: ${JSON.stringify(g.purchaseLink)}`,
    ].join(',\n');
    return `  ${JSON.stringify(g.id)}: {\n${inner},\n  },`;
  }).join('\n');

  return `/*
 * Real ansonpdr.com product data, keyed by anson product handle (= glue id).
 *
 * Generated by tools/build-anson-data.mjs — re-run to refresh.
 *
 * Rich entries (image + description) come from the original products.json
 * scrape; entries newly added by the live catalog crawl link by URL only
 * until the next re-scrape. The UI degrades gracefully — GlueCard hides the
 * "Product details" toggle when description is missing and falls back to a
 * tinted placeholder when imageUrl is null.
 */

export interface AnsonProduct {
  matched: true;
  /** Real product title from ansonpdr.com. */
  name: string;
  /** Primary product image URL (no version query string). null when we know
   *  the product exists on Anson but haven't captured its image yet. */
  imageUrl: string | null;
  /** Optional plain-text product description. The card hides the details
   *  toggle when missing. */
  description?: string;
  /** Canonical product page on ansonpdr.com. */
  productUrl: string;
}

export interface UnmatchedProduct {
  matched: false;
}

export type GlueProduct = AnsonProduct | UnmatchedProduct;

export const ansonProducts: Record<string, GlueProduct> = {
${entries}
};

export function getAnsonProduct(glueId: string): GlueProduct | undefined {
  return ansonProducts[glueId];
}
`;
}

function emitTool(t) {
  const ordered = [
    ['id', t.id],
    ['name', t.name],
    ['url', t.url],
    ['category', t.category],
    ['subtype', t.subtype],
    ['gunTempClass', t.gunTempClass],
    ['tabShape', t.tabShape],
    ['tabMaterial', t.tabMaterial],
    ['dentTypes', t.dentTypes],
    ['pullMethod', t.pullMethod],
    ['notes', t.notes],
  ];
  const inner = ordered
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `    ${k}: ${literal(v)},`)
    .join('\n');
  return `  {\n${inner}\n  },`;
}

function emitToolsFile(tools) {
  return `import { Tool } from '@/types';

/**
 * Anson PDR tool catalog — guns, slide hammers, mini-lifters, glue tabs,
 * kits, release agents.
 *
 *   Source: tools/build-anson-data.mjs (re-run to refresh).
 *   Input:  anson_tools_database.csv — ${tools.length} entries.
 *
 * Used by the glue→tool matcher to recommend a paired rig (gun + puller +
 * tab + release agent) per top glue pick.
 */
export const tools: Tool[] = [
${tools.map(emitTool).join('\n')}
];

export const getToolById = (id: string): Tool | undefined =>
  tools.find((t) => t.id === id);

export const toolsByCategory = (category: Tool['category']): Tool[] =>
  tools.filter((t) => t.category === category);
`;
}

// ============================================================================
// Main
// ============================================================================
function main() {
  console.log('Reading glue CSV…');
  const glueRaw = fs.readFileSync(CSV_GLUES, 'utf8');
  const glueRows = parseCSV(glueRaw);
  console.log(`  ${glueRows.length} rows`);

  console.log('Reading tools CSV…');
  const toolRaw = fs.readFileSync(CSV_TOOLS, 'utf8');
  const toolRows = parseCSV(toolRaw);
  console.log(`  ${toolRows.length} rows`);

  console.log('Transforming…');
  const glues = glueRows.map(transformGlue);
  const tools = toolRows.map(transformTool);

  // Sanity: dedupe by handle (CSV shouldn't have dupes; guard anyway)
  const seen = new Set();
  const dedup = [];
  for (const g of glues) {
    if (seen.has(g.id)) { console.warn(`  dup glue id: ${g.id}`); continue; }
    seen.add(g.id);
    dedup.push(g);
  }

  console.log('Writing src/data/glues.ts…');
  fs.writeFileSync(OUT_GLUES, emitGluesFile(dedup));
  console.log('Writing src/data/products.ts…');
  fs.writeFileSync(OUT_PRODUCTS, emitProductsFile(dedup));
  console.log('Writing src/data/tools.ts…');
  fs.writeFileSync(OUT_TOOLS, emitToolsFile(tools));

  console.log('\nDone.');
  console.log(`  ${dedup.length} glues emitted (${dedup.filter((g) => g.pullForce).length} with pull-force)`);
  console.log(`  ${tools.length} tools emitted`);
  const tagCount = dedup.reduce((acc, g) => {
    g.ansonWeatherTags.forEach((t) => (acc[t] = (acc[t] || 0) + 1));
    return acc;
  }, {});
  console.log(`  weather tags:`, tagCount);
}

main();
