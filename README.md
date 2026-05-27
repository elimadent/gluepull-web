# GluePull — web

Weather-aware hot glue picker for PDR and auto body technicians, packaged for
embedding on the Anson PDR Shopify storefront.

This is the web/Shopify build. The original React Native app lives at
[elimadent/gluepull](https://github.com/elimadent/gluepull).

## What it does

GluePull reads the current/forecasted weather, then ranks the best Anson PDR
hot glue sticks for dent pulling — broken down by time of day, with matching
tools and direct links to buy on ansonpdr.com.

- **Auto weather** — geolocation + Open-Meteo hourly forecast (no API key)
- **Manual entry** — type in temp/humidity/pressure for any conditions
- **Ranked picks** — top 3 glues per condition, scored 0–100 with pros/cons/warnings
- **Daily timeline** — Morning / Midday / Afternoon / Evening, each with its own best glue
- **Smart bundles** — every glue suggests a matching kit (gun, slide hammer, tabs, prep)
- **Job planner** — 7-day and 16-day pre-buy lists for whole-job stocking
- **Tech tips** — panel prep, beating moisture, glue choice, pull technique
- **Rugged dark UI** — high contrast, large touch targets, mobile-first

The glue dataset (26 sticks from the Anson PDR weather-range chart) and the
scoring/ranking logic are ported byte-for-byte from the RN app and protected
by the same 7 logic tests.

## Stack

- **Vite** + **React 18** + **TypeScript**
- Browser Geolocation + [Open-Meteo](https://open-meteo.com/) hourly forecast
- **Vitest** (7 logic tests, same fixtures as the RN app)
- Two build targets:
  - `dist/` — standalone site (for iframe embed or its own URL)
  - `dist-widget/gluepull-widget.iife.js` — single-file Shadow-DOM widget for
    pasting into a Shopify Custom Liquid block

## Layout

```
src/
  types/                      Shared TypeScript types         (byte-for-byte from RN)
  data/                       26-glue dataset + accessories   (byte-for-byte from RN)
  logic/                      Scoring, ranking, bundling      (byte-for-byte from RN)
  logic/__tests__/            7 logic tests                   (byte-for-byte from RN)
  theme/theme.ts              Design tokens                   (byte-for-byte from RN)
  services/weather.ts         Browser Geolocation + Open-Meteo (web adaptation of RN)
  context/WeatherContext.tsx  Shared forecast/manual state
  components/                 Reusable UI (GlueCard, BuyButton, …)
  screens/                    Home, Library, Plan, Manual, Tips
  widget/entry.tsx            Shadow-DOM bootstrap for the widget build
  App.tsx                     Tab nav (standalone or `embedded`)
  main.tsx                    Standalone entry
  styles.css                  All styling — mirrors theme.ts
```

## Develop

Requires Node 20+.

```bash
npm install
npm run dev          # http://localhost:5173/  (also exposed on LAN)
npm run typecheck    # tsc --noEmit
npm test             # vitest, 7 tests
```

`npm run dev` binds to `0.0.0.0:5173` so you can open it from a phone on the
same Wi-Fi (e.g. `http://192.168.1.89:5173`).

## Build

```bash
npm run build         # standalone site → dist/
npm run build:widget  # single-file Shopify widget → dist-widget/
npm run build:all     # both
```

Build outputs:

- `dist/index.html` + `dist/assets/index-*.{js,css}` — a regular SPA. Drop the
  folder on any static host. Used for the **iframe** install path.
- `dist-widget/gluepull-widget.iife.js` — one self-contained ~153 KB gzipped
  file. React, app code, and CSS all inlined. Auto-mounts into any
  `<div data-gluepull-widget>` on the page, inside a Shadow DOM. Used for the
  **widget snippet** install path.
- `dist-widget/test.html` — a fake Shopify product page that loads the widget
  next to deliberately aggressive theme CSS, for local verification.

## Shopify install

See [`SHOPIFY.md`](./SHOPIFY.md) for copy-paste instructions covering both
install paths.

## Data note

The glue database is transcribed from the official **AnsonPDR "General Weather
Ranges for Professional PDR"** chart (11/28/21). Numeric °F windows are derived
from the chart's thermometer scale (Cold ≈ 55°, Cool ≈ 65°, Moderate ≈ 75°,
Warm ≈ 85°, Hot ≈ 95°+); humidity windows are inferred. The `purchaseLink`
slugs are realistic placeholders — verify them against ansonpdr.com before
shipping to production.
