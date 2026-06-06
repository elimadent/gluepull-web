# _HANDOFF_GLUEPULL.md

Cross-account handoff for **Glue IQ** (`elimadent/gluepull-web`).

> ⚠️ Intended destination was
> `D:\Dropbox\# Peptides\BlessUp LLC\_Handoff & Ops\_OPS\_HANDOFF_GLUEPULL.md`,
> but this session ran in a **cloud Linux container** with no access to the
> Windows `D:` drive. So this doc is committed **into the repo** instead (most
> reliable place for the next account, which clones the repo). James: copy this
> file to the Dropbox OPS path if you want it there too.
>
> Note: GluePull is an **independent client project** (Anson PDR / Vince), NOT
> part of BlessUp. No BlessUp shared bibles were touched.

---

## 1. Project identity
- **What:** "Glue IQ" — React + Vite + TypeScript SPA. Live weather (temp +
  humidity) → ranks Anson PDR hot-melt glues for current conditions →
  recommends paired rig (gun/pull-tool/tab/prep) → multi-day buy list →
  in-app cart that syncs to ansonpdr.com at checkout.
- **Repo:** https://github.com/elimadent/gluepull-web
- **Live:** https://elimadent.github.io/gluepull-web/ (GitHub Pages, auto-deploy
  on push to `main` via `.github/workflows/deploy-pages.yml`).
- **Local path this session:** `/home/user/gluepull-web` (ephemeral container).

## 2. Project bible (READ THIS TOO)
- **`GLUEPULL_BIBLE.md`** at repo root →
  https://github.com/elimadent/gluepull-web/blob/main/GLUEPULL_BIBLE.md
  Full session log, decisions, blockers. The new account should read BOTH this
  handoff and the bible.

## 3. Current state
- **Done & merged to `main`:** PRs **#6–#17** (best-seller signal, theming pass,
  matcher dual-temp fix, glue catalog doc, light cart drawer + toast, editorial
  pins, Seth's new Headless token, location-button theming). `main` @ `eb98c82`.
- **In progress / unverified:** Live best-seller feed via Seth's new Headless
  token (#16) — wired but NOT confirmed in a real browser (sandbox can't reach
  ansonpdr.com).
- **Blocked:** Real Anson best-seller order (waiting on dispatch list and/or
  feed verification).

## 4. Outstanding tasks (priority order)
1. **Verify the live best-seller feed** in a real browser (see §7). If empty →
   loop back to Seth on token scope / API version.
2. **Get the real best-seller order** (dispatch's `?sort_by=best-selling` list,
   or once the live feed works it's automatic) and reconcile the editorial pins.
3. (Optional) Temperature-band ACTIVE segment is still dark — restyle if James
   wants full "no black."
4. (Optional) Add a "new version available" refresh nudge to defeat iOS
   stale-cache (root cause of many "still showing X" reports).
5. (Optional) Pin more products (tab/lifter/prep) — one-line edits in
   `src/data/bestSellers.ts`. Extend best-seller ordering to "Buy these glues".

## 5. Key decisions + context
- **Best sellers:** live = Storefront API `products(sortKey: BEST_SELLING)`,
  runs in the user's browser. `getBestSellerHandles()` returns
  `mergePinned(live)` = **curated pins always lead**, live/cached fill the rest.
  Pins live in `src/data/bestSellers.ts` (currently just the Trifecta gun).
  Service: `src/services/bestSellers.ts` (token, fetch+4s timeout, cache
  `glueiq.bestsellers.v2`). Hook: `src/hooks/useBestSellers.ts` → `rankOf`.
- **Storefront token** = `e7ae3d3206b9f2a960ff326fbe1eac1d` (Seth's Headless,
  public read-only token, OK to commit; James approved). Override via
  `window.GLUEIQ_SHOPIFY_TOKEN` or `VITE_SHOPIFY_STOREFRONT_TOKEN`.
- **Matcher** (`src/logic/matcher.ts`): gun matching is capability-based —
  dual-temp guns satisfy high-temp glues; collision glues keep the high-output
  collision gun. `chooseBest` prefers best-seller rank among valid candidates.
- **Theme:** warm cream/parchment + gold. ONE filled CTA = `CHECKOUT ON ANSON`.
  Everything else = cream + thin gold outline + dark text. Vars on `:root`;
  `color-scheme: light` on html/body/meta + `.drawer-overlay` so body-mounted
  React portals (cart drawer, product drawer, lightbox) stay light on iOS dark.
- **Workflow this session:** every change = own branch → squash PR → merge to
  `main`. No direct pushes to main. Deploys verified via GitHub Actions.

## 6. Open blockers requiring James input
- **Confirm the live feed** (run §7 console snippet, report FEED vs ERR).
- **Provide / confirm the real best-seller order** (dispatch list) so pins match
  actual sales.
- Decide on the temperature-band dark active state (keep vs gold).

## 7. How to resume (plain-language next steps)
1. Sync: `git fetch origin main` then ensure local `main` matches.
2. **Verify the feed** — in desktop Chrome/Safari ON the live page
   (https://elimadent.github.io/gluepull-web/), open DevTools console and run:
   ```js
   fetch('https://ansonpdr.com/api/2024-04/graphql.json',{method:'POST',
     headers:{'Content-Type':'application/json','X-Shopify-Storefront-Access-Token':'e7ae3d3206b9f2a960ff326fbe1eac1d'},
     body:JSON.stringify({query:'{products(first:5,sortKey:BEST_SELLING){edges{node{handle}}}}'})})
     .then(r=>r.json()).then(d=>console.log('FEED',d)).catch(e=>console.log('ERR',e))
   ```
   - `FEED` w/ handles → feed works; carousels reflect real sales (Trifecta
     pinned). Then chase the real ordering / confirm with James.
   - `ERR`/empty/403 → token scope or API not enabled → back to Seth.
3. To feature a product: add its handle to `CURATED_BEST_SELLERS` in
   `src/data/bestSellers.ts` (top = highest priority). Build, PR, merge.
4. Remember the **iOS stale-cache** gotcha when James says "still showing X" —
   confirm the GitHub Actions "Deploy to GitHub Pages" run succeeded first, then
   have him use `?v=` / Private tab before assuming a code bug.

## 8. Uncommitted code state
At handoff: working tree **clean**, all app code merged to `origin/main`
(`eb98c82`). The only new files are this handoff doc + `GLUEPULL_BIBLE.md`,
added on branch `docs/handoff-bible` (PR pending/merged separately). `git status`
after sync showed clean before creating these docs.

## 9. Important file pointers
- `src/data/bestSellers.ts` — editorial PINS (featured products). **Edit here.**
- `src/services/bestSellers.ts` — live feed fetch, token, cache, mergePinned.
- `src/hooks/useBestSellers.ts` — `rankOf` hook.
- `src/logic/matcher.ts` — glue→rig matcher (gun/tab/puller/release + rank).
- `src/components/PairedRig.tsx` — Paired Rig (gun/pull/tab/prep rows).
- `src/components/SynergyStack.tsx` — "Dial In Your Pull" carousels.
- `src/components/CartPanel.tsx` / `CartPill.tsx` / `context/CartContext.tsx` —
  cart drawer + pill + add-to-cart + toast.
- `src/components/LocationPicker.tsx` — location screen (detect/apply buttons).
- `src/data/glues.ts` / `tools.ts` / `synergyStack.ts` — product data.
- `src/styles.css` — ALL styling (single file). Theme tokens at top on `:root`.
- `docs/glue-list.md` / `.csv` + `tools/gen-glue-list.mjs` — glue catalog.
- `.github/workflows/deploy-pages.yml` — deploy.

---

## READY-TO-PASTE PROMPT FOR THE NEW ACCOUNT

```
You are picking up the Glue IQ project (repo elimadent/gluepull-web) from another Claude account.

FIRST, read both of these before any work:
- Handoff doc:   _HANDOFF_GLUEPULL.md  (repo root)
- Project bible: GLUEPULL_BIBLE.md     (repo root)
(Their intended Dropbox copy is D:\Dropbox\# Peptides\BlessUp LLC\_Handoff & Ops\_OPS\_HANDOFF_GLUEPULL.md, but the canonical copies live in the repo.)

PROJECT CONTEXT (1 paragraph): Glue IQ is a React + Vite + TypeScript SPA (deployed to GitHub Pages at https://elimadent.github.io/gluepull-web/) for Vince at Anson PDR. It pulls live weather for a location, ranks Anson hot-melt glues for current conditions, recommends the paired rig (gun/pull-tool/tab/prep), builds a multi-day buy list, and has an in-app cart that syncs to ansonpdr.com at checkout. It surfaces "best sellers" via the Anson Storefront API (BEST_SELLING) with an editorial pin list (src/data/bestSellers.ts) that always leads. This is an INDEPENDENT client project — NOT part of BlessUp; do not touch BlessUp shared bibles. Workflow: every change on its own branch → squash PR → merge to main (no direct pushes). Watch for iOS Safari stale-cache when verifying ("still showing X" is usually cache, not code).

Session start check - account handoff aware. Before any work:

1. Run: git status
2. Run: git fetch origin main
3. Run: git status
4. Run: git log --oneline -10
5. Run: git log HEAD..origin/main --oneline
6. Run: ls -la .claude/*.sh
7. Run: head -50 CLAUDE.md
8. Run: wc -l CLAUDE.md
9. Run: cat .claude/settings.json | python3 -m json.tool > /dev/null && echo "settings.json valid" || echo "settings.json BROKEN"
10. Run: grep -A 30 "Active Fix Queue" .claude/PENDING_TASKS.md
11. Run: ls -la "D:\Dropbox\# Peptides\BlessUp LLC\_Handoff & Ops\_OPS\_HANDOFF_"*.md
12. Run: ls -la | grep -iE "BIBLE\.md$|CLAUDE\.md$"
13. Run: ls -la "D:\Dropbox\# Peptides\BlessUp LLC\_Handoff & Ops\_OPS\_secrets\"

Tell me:
- Working tree clean before any sync operations?
- After fetch, am I behind origin/main? If yes, how many commits and what are they?
- Recent commits including any new ones from the other account
- All hook scripts present?
- "STOP - READ BEFORE EVERY EDIT" section at top of CLAUDE.md?
- CLAUDE.md line count
- settings.json valid?
- Top items in Active Fix Queue?
- All handoff docs visible at the OPS path?
- Project's own BIBLE found? (Confirm it follows <PROJECT>_BIBLE.md convention.)
- Secrets folder visible at the _OPS\_secrets\ path?

If I am behind origin/main, ASK BEFORE PULLING. Other account may have been working.

If I am ahead of origin/main with uncommitted work or unmerged commits, STOP and tell me — we may have parallel work to reconcile.

If everything is clean and synced, say "System verified, ready for task" and wait for my request.

NOTE for this repo specifically: it has NO .claude/ dir, NO CLAUDE.md, NO PENDING_TASKS.md, and runs in a cloud Linux container with no D:\ drive — so steps 6–11 and 13 will return "no such file"/N/A. That is EXPECTED here; treat them as N/A rather than failures. The project context lives in GLUEPULL_BIBLE.md + _HANDOFF_GLUEPULL.md (step 12 should find GLUEPULL_BIBLE.md).

After running the check, confirm "System verified, ready for task" before doing any work.
```
