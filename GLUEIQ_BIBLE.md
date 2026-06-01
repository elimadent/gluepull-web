# GlueIQ / GluePull — Project Bible

> **Single source of truth for the GluePull web app + the Anson PDR Shopify
> live-feed initiative.** Keep this file fully updated as decisions are made,
> work is done, and direction changes. Every working session should read this
> first and append to the Changelog at the bottom before finishing.
>
> **Never put live secrets/tokens in this file.** It is committed to the repo.
> Secrets live only in a gitignored `.env.local`.

Last updated: 2026-06-01

---

## 1. What this project is

GluePull (a.k.a. "Glue IQ") is a **weather-aware hot-glue recommender for
paintless dent repair (PDR) / auto-body technicians**, packaged for embedding
on the **Anson PDR Shopify storefront** (`ansonpdr.com`).

It reads current/forecast weather (temp, humidity, pressure) and ranks the best
Anson PDR hot-glue sticks for dent pulling — broken down by time of day, with
matching tools and direct buy links.

- Repo: `elimadent/gluepull-web` (this repo, the web/Shopify build)
- Sibling repo: `elimadent/gluepull` (original React Native app — logic ported from there)
- Live deploy: GitHub Pages → `https://elimadent.github.io/gluepull-web/`
- Business contact / store owner: **Seth Bruce**. Also on thread: **Vince D'Alessandro** (Anson PDR LLC).
- Developer: **James** (jamesl33t@gmail.com).

---

## 2. Tech stack & architecture

- **Vite + React 18 + TypeScript**, Vitest for tests.
- Two build targets:
  - `dist/` — standalone SPA (for iframe embed or its own URL).
  - `dist-widget/gluepull-widget.iife.js` — single-file **Shadow-DOM widget**
    (~153 KB gzipped, React + app + CSS inlined) that auto-mounts into any
    `<div data-gluepull-widget>` on a Shopify product page.
- **No backend.** The app is fully client-side. This is a hard architectural
  constraint and the crux of the credential discussion in §5.
- Weather data: browser Geolocation + Open-Meteo (no API key); IP fallback via ipapi.co.

### Scripts (`package.json`)
| Command | Purpose |
|---|---|
| `npm run dev` | Vite dev server on `0.0.0.0:5173` |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Vitest (logic tests) |
| `npm run build` | Standalone SPA → `dist/` |
| `npm run build:widget` | Widget → `dist-widget/` |
| `npm run build:all` | Both |

**CI (`.github/workflows/ci.yml`) runs on push + PR:** `typecheck`, `test`,
`build`, `build:widget`. All four must pass. Deploy workflow publishes `dist/`
to GitHub Pages on push to `main`.

---

## 3. Key files map

```
src/
  types/                      Shared TS types (Glue, WeatherConditions, …)
  data/glues.ts               THE glue catalog (currently ~41 sticks, static)
  data/products.ts            Anson product images/descriptions/links (static)
  data/tools.ts               PDR tools catalog
  data/accessories.ts         Tabs, prep kits, etc.
  data/synergyStack.ts        Grouped product recommendations per category
  logic/recommendation.ts     Scores glues 0–100 from Anson weather tags
  logic/bundles.ts            Matches glue → complementary tools/kits
  logic/__tests__/            Logic tests (ported byte-for-byte from RN app)
  services/weather.ts         Geolocation + Open-Meteo + IP fallback
  services/shopify.ts         Add-to-Cart engine + live per-product fetch  ← key for feed work
  context/WeatherContext.tsx  Shared forecast/manual state
  context/CartContext.tsx     Local cart line items + drawer + localStorage
  components/                 GlueCard, CartPanel, ProductDrawer, …
  screens/                    Home, Library, Plan, Tips, About
  theme/                      Design tokens
  widget/                     Shadow-DOM bootstrap for widget build
tools/build-anson-data.mjs    Build-time CSV → src/data/*.ts code generator
docs/SHOPIFY_STOREFRONT_TOKEN.md  Storefront token setup checklist
SHOPIFY.md                    Install guide (widget snippet vs iframe)
```

### Current Shopify integration state (`src/services/shopify.ts`)
- **Already live, no auth:** runtime fetch of per-product data from Shopify's
  public endpoint `ansonpdr.com/products/<handle>.js` (price, variants, image,
  availability, description). Cached in memory + localStorage.
- **Add-to-Cart** has 3 modes detected at runtime:
  1. `widget-ajax` — on ansonpdr.com, uses `/cart/add.js`. Works now.
  2. `storefront-api` — gated on a token; currently a **TODO placeholder** that
     falls through to navigation.
  3. `standalone-nav` — navigates to the PDP with `?quantity=N`. Works now.

---

## 4. Business direction (the Seth thread)

Chronology of what Seth asked for, newest understanding last:

1. **Initial ask:** "See what permissions it would need to pull a live feed.
   If we can sort by best selling, that would be awesome." (Also asked for
   James's GitHub profile — personal, not a code task.)
2. **Refined ask:** "Pull **all glue** and **sort by best selling** — that
   makes the most sense. Optionally add a **`glue-featured` tag** so a featured
   glue appears at the **top**, and is then **removed** from the
   best-seller-sorted list below it." Excited for "version 2."
3. Seth created a Shopify "read products" custom app and emailed credentials
   (see §5 — there's a problem with them).

### Product requirements (current)
- **R1.** Pull all glue products live from the Anson Shopify store.
- **R2.** Sort the list by **best selling**.
- **R3.** (Optional, behind a flag) Support a `glue-featured` product tag:
  tagged product(s) pinned to top, excluded from the best-seller remainder.
- **R4.** Static dataset (`src/data/glues.ts`) must remain a **graceful
  fallback** so the app never hard-fails when the feed is unavailable.
- **R5.** Weather-scoring metadata (temp/humidity tags, pull force) is NOT in
  Shopify — it lives in the static data. Open question (§7) whether the live
  feed fully replaces glues or only drives the Library list ordering.

---

## 5. Credentials & permissions analysis (IMPORTANT)

### What Seth sent
- API key / **Client ID**: `4e023763…` (public identifier — fine to know).
- A value labeled "Secret" starting with **`shpss_…`**.

### Two problems found
1. **`shpss_…` is the API _secret key_, not an access token.** In a Shopify
   custom app there are several distinct values:

   | Value | Prefix | Use |
   |---|---|---|
   | API key (Client ID) | `4e02…` | Public app identifier |
   | **API secret key** | **`shpss_`** ← what was sent | Webhook HMAC / OAuth handshake — **cannot** auth API reads |
   | Admin API access token | `shpat_` | Header `X-Shopify-Access-Token` to read via Admin API |
   | Storefront API token | `shpat_` / `b1…` | Public, browser-safe product reads |

   So `shpss_…` **will not read products.** We need the **Admin API access
   token (`shpat_…`)** or, better, a **Storefront token**.

2. **Admin credentials cannot live in the browser.** This app ships fully
   client-side (widget on ansonpdr.com, no backend). An Admin token in that
   bundle is publicly visible and blocked by CORS. The Admin API is server-only.

### Recommendation
- **Ask Seth for a Storefront API access token** with scope
  **`unauthenticated_read_product_listings`**. It is browser-safe and supports
  the `BEST_SELLING` sort key — exactly what R1–R3 need, no backend.
- If only an Admin token ever becomes available, do the **build-time** approach
  (§6, Approach B) so the secret never reaches the browser.
- **Security:** the `shpss_` secret has traveled through email + screenshots —
  have Seth **rotate/regenerate** it once the right token is in place.

### Token handling rules
- Real token goes only in a gitignored **`.env.local`** (`.gitignore` covers it
  via `*.local`). Never commit it. Never hardcode it. Never put it in this file.
- Env var names:
  - `VITE_SHOPIFY_STOREFRONT_TOKEN=...` (Storefront — bundled, browser-safe)
  - `SHOPIFY_ADMIN_TOKEN=...` (Admin — build-time only, never bundled)

---

## 6. Implementation approaches

### Approach A — live client-side feed  *(preferred; needs Storefront token)*
- New service e.g. `src/services/catalog.ts` querying Storefront GraphQL at
  `https://ansonpdr.com/api/2024-07/graphql.json` with header
  `X-Shopify-Storefront-Access-Token`.
- Fetch glue products (filter by product_type / tag / collection — confirm
  which the store uses, §7) with `sortKey: BEST_SELLING`.
- Drive the Library/recommendation UI from the live list; keep static data as
  fallback (R4). Implement `glue-featured` pinning (R3) behind a flag.

### Approach B — build-time feed  *(fallback; if only Admin token)*
- Extend `tools/build-anson-data.mjs` (or new `tools/fetch-live-catalog.mjs`)
  to call the Admin API at build time using `SHOPIFY_ADMIN_TOKEN`, pulling all
  glue products in best-selling order (easiest: read a Shopify collection whose
  admin sort order is "Best selling") and regenerate `src/data/*`.
- Token stays server-side at build; never bundled. Feed refreshes per deploy,
  not truly live.

### Zero-permission option (worth proposing to Seth)
- In Shopify admin, make a collection sorted by **Best selling**; the app reads
  `ansonpdr.com/collections/<handle>/products.json` publicly — live, no token.
  Simplest path of all if "live to the deploy" is acceptable.

---

## 7. Open questions (confirm before large changes)
- **Q1.** Which token type did we actually receive — Storefront or Admin?
- **Q2.** How are glue products identified in the store — `product_type`, a
  tag, or a specific collection handle?
- **Q3.** Should the live feed fully replace static glues, or only drive the
  Library list ordering (keeping curated weather scoring on static metadata)?
- **Q4.** Is "live as of each deploy" (build-time) acceptable, or must it be
  truly real-time in the browser?

---

## 8. Git workflow
- Feature branch: **`claude/github-profile-feed-permissions-OT4gE`**
  (create from `main` if absent).
- Clear commit messages. Push with `git push -u origin <branch>`.
- **Do NOT open a PR unless James explicitly asks.**
- Never commit secrets; confirm `.env.local` stays untracked.

## 9. Definition of done
- `npm run typecheck`, `npm test`, `npm run build`, `npm run build:widget` all pass.
- No secrets committed.
- Static dataset still works as a fallback (R4).
- This bible updated (Changelog below).

---

## 10. Changelog
- **2026-06-01** — Bible created. Captured project context, Shopify integration
  state, Seth's refined direction (pull all glue, sort by best selling, optional
  `glue-featured` tag), and the credential analysis: the `shpss_` value Seth sent
  is an API _secret key_ (can't auth reads) and Admin creds can't ship in the
  browser; recommended requesting a Storefront token w/
  `unauthenticated_read_product_listings`. No app code changed yet — awaiting the
  correct token and answers to Q1–Q4.
```

