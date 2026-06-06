# GLUEPULL_BIBLE.md

Project bible for **Glue IQ** (repo `elimadent/gluepull-web`) — the weather-aware
PDR hot-glue recommender web app for Vince / Anson PDR. Append-only session log.

> Naming convention: `<PROJECT>_BIBLE.md`. This is the GluePull project bible.
> This is an **independent client project** (Anson PDR / Vince) — it is NOT part
> of the BlessUp / Anointed / peptide workstream. Do not cross-link or append to
> the BlessUp shared bibles (MAC_BIBLE.md, BLESSUP_PROJECT_BIBLE.md).

---

## Project snapshot

- **What:** "Glue IQ" — React + Vite + TypeScript single-page app. Pulls live
  weather (temp + humidity) for a chosen location, ranks Anson PDR hot-melt
  glues for today's conditions, recommends the paired rig (gun / pull tool /
  tab / prep+release), and builds a multi-day buy list. Has an in-app cart that
  syncs to ansonpdr.com at checkout.
- **Repo:** https://github.com/elimadent/gluepull-web
- **Deploy:** GitHub Pages via `.github/workflows/deploy-pages.yml` on push to
  `main`. Vite `base` = `/gluepull-web/` in production →
  live at **https://elimadent.github.io/gluepull-web/**.
- **Commands:** `npm run dev`, `npm run build`, `npm run typecheck`,
  `npm test` (vitest). Widget build: `npm run build:widget`.
- **No `.claude/` tooling, no CLAUDE.md, no hooks** in this repo (it's a plain
  Vite app). The standard session-start check's CLAUDE.md/.claude steps are N/A
  here.

---

## Session — 2026-06-03/04 (Claude Code web, account #1)

Big arc this session: built the **best-seller signal**, did a wide **theming
pass** (kill stray black, light cart drawer), fixed a real **matcher bug**, and
shipped a **glue catalog** doc. All work merged to `main` via squash PRs #6–#17.

### Shipped (merged to main)
- **#6** Paired Rig prefers best sellers among matching tools (matcher takes an
  optional `RankFn`; `chooseBest` breaks ties by best-seller rank).
- **#7** Best sellers via Anson **Storefront API** (`products sortKey:
  BEST_SELLING`) + SynergyStack "Dial In Your Pull" carousels lead with the
  best seller; carousel-arrow + floating-tab-bar fixes.
- **#8** **Matcher bug fix** — dual-temp guns now satisfy high-temp glues
  (capability match, not exact `gunTempClass` equality). This is why Trifecta
  (dual-temp) couldn't appear for high-temp glues before.
- **#9** `docs/glue-list.md` + `.csv` + `tools/gen-glue-list.mjs` (numbered
  glue list for Vince to verify).
- **#10** Carousel stops at last card (no blank overscroll); arrows + cart pill
  off black → gold/parchment; tab bar no longer floats on iOS scroll.
- **#11** "7 DAYS / 1 DAY" plan badges → gold.
- **#12** "THIS WEEK/THIS MONTH" selected toggle → gold (was dark "tuxedo").
- **#13** Curated best-seller **fallback** when live API empty.
- **#14** Hardened **light cart drawer** (`color-scheme: light` on the portaled
  `.drawer-overlay`, explicit dark text on `.drawer-panel`) + "✓ Added to cart"
  toast. NOTE: refined buy buttons + in-app add-to-cart + light drawer had
  ALREADY shipped earlier in **#4**; #14 just hardened + added the toast.
- **#15** Best-seller **editorial PINS** — `src/data/bestSellers.ts` handles
  ALWAYS lead the ranking (live fills the rest) + 4s `AbortController` fetch
  timeout. Pins Trifecta as the gun so it's suggested over Surebonder/Tec
  everywhere it's a valid candidate.
- **#16** Swapped to **Seth's new Headless Storefront token**
  (`e7ae3d3206b9f2a960ff326fbe1eac1d`) + bumped cache key `v1→v2`. Seth enabled
  the Headless API on the main store; the old token returned nothing because
  the API wasn't enabled.
- **#17** Location screen "Auto-detect from my IP" bar + state "Use" button →
  off black, cream/gold-outline.

### Key decisions / context
- **Best-seller architecture:** live = Storefront API `BEST_SELLING` (runs in
  the USER'S browser; the build/cloud sandbox can't reach ansonpdr.com —
  "Host not in allowlist"). `getBestSellerHandles()` returns
  `mergePinned([...live])` = **curated pins always first**, live/cached after,
  deduped. Graceful: offline/empty → pins only. Cache: in-mem + localStorage
  `glueiq.bestsellers.v2`, 12h TTL. Hook: `src/hooks/useBestSellers.ts` →
  stable `rankOf(handle)`.
- **Storefront token** is a 32-hex **public** access token — read-only,
  designed to ship in client JS (Shopify headless). James confirmed OK to
  commit. Lives in `src/data`/`services` as `DEFAULT_STOREFRONT_TOKEN`;
  overridable via `window.GLUEIQ_SHOPIFY_TOKEN` / `VITE_SHOPIFY_STOREFRONT_TOKEN`.
- **Gun class capability** (matcher): high-temp need → high-temp OR dual-temp;
  dual-temp need → dual-temp only; collision → collision only. `pickGun`
  orders exact-class first then compatible, so best-seller rank can surface a
  compatible gun (Trifecta) while the no-data fallback stays on-class.
- **Theming language:** warm parchment/cream + gold; the ONE filled commerce
  CTA is `CHECKOUT ON ANSON` (`.drawer-cta-primary`, gold). All other buttons =
  cream surface + thin gold outline + dark text. Intentionally-dark remaining:
  modal scrims, cart count pip, temperature-band ACTIVE segment (`.band.active`
  — dark for contrast against the colored band; James not yet asked to change).
- **Persistent gotcha:** iOS Safari hard-caches the bundle; many "still showing
  X" reports were stale cache, not code. Fix: `?v=` query, Private tab, or
  clear site data. Deploys verified via GitHub Actions "Deploy to GitHub Pages".

### Blockers needing James / Seth
- **Live best-seller feed unverified end-to-end.** Seth's new Headless token is
  wired (#16) but I can't test from the cloud sandbox. Needs a real-browser
  check (console snippet in the handoff doc). If it returns data, the carousels
  reflect real sales (Trifecta still pinned). If not → back to Seth re: token
  scope (`unauthenticated_read_product_listings`) / API version.
- **Real best-seller order** still not provided. Dispatch was asked to pull
  Anson's `?sort_by=best-selling` list (Option 2). Once we have it, pins/order
  can reflect real sales.

### Pending / nice-to-have
- Confirm live feed (above).
- Optionally pin more products (tab/lifter/prep) — one-line edits in
  `src/data/bestSellers.ts`.
- Temperature-band active state still dark — change if James wants.
- Optional: "new version available — tap to refresh" check to defeat the
  iOS stale-cache problem on future deploys.
- Optionally extend best-seller ordering to the "Buy these glues" plan cards
  (currently weather-driven only).

---

## Session — 2026-06-06 (Claude Code web, account #2)

Picked up from account #1. Ran the handoff-aware session-start check: working
tree clean, on branch `claude/tender-ptolemy-4zBAo`, fully synced with
`origin/main` at `38ca4dd` (#18). All dev work from account #1 (PRs #6–#18) is
merged — nothing unbuilt or unreconciled.

**James confirmed the project is complete — no pending dev work.** Reframed the
prior "blockers / pending" notes accordingly:

- **Live best-seller feed:** wired (#16); per James the app is complete and in
  use. Not a blocker either way — curated pins lead and the app degrades
  gracefully if the live API is ever unreachable.
- **Real best-seller dispatch order:** not required; the Trifecta pin stands.
  Reconciling against a real `?sort_by=best-selling` list is an *optional* future
  tweak (`src/data/bestSellers.ts`).
- **Temp-band ACTIVE segment** (`.band.active`, `styles.css`): dark by design for
  contrast — *optional* restyle only if James wants it.
- **iOS refresh nudge** and **more pins / "Buy these glues" ordering:** remain
  *optional* nice-to-haves, never required.

Net: GlueIQ is shipped and live at https://elimadent.github.io/gluepull-web/.
Updated `_HANDOFF_GLUEPULL.md` (state → complete, blockers cleared) to match.
Docs only — no code changes this session.
