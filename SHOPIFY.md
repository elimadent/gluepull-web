# GluePull → Shopify install guide

Two ways to put GluePull on an Anson PDR product page. Pick one.

| | **A. Widget snippet** | **B. Iframe** |
|---|---|---|
| **Best when** | Native look, lives inside the product page column | You want full isolation, or don't want to host anything yourself |
| **Hosting** | Upload **one JS file** to Shopify Files | Host the whole `dist/` folder anywhere (Shopify Files, Pages, GitHub Pages, Netlify, your own server) |
| **Page weight** | 153 KB gzipped (one file) | 62 KB gzipped (split across 3 files) |
| **CSS isolation** | Shadow DOM — perfect | Iframe — perfect |
| **Inherits storefront theme?** | No (and it can't pollute the theme either) | No |

---

## Option A — Widget snippet (recommended)

### 1. Upload the widget file to Shopify

1. Shopify admin → **Settings** → **Files**.
2. Click **Upload files** → choose `dist-widget/gluepull-widget.iife.js`.
3. After upload, click the file row's **copy URL** button. The URL looks like:
   `https://cdn.shopify.com/s/files/1/0000/0000/files/gluepull-widget.iife.js?v=…`
4. Keep the URL on your clipboard — you'll paste it in step 3.

### 2. Decide where on the product page it goes

Open the theme editor: **Online Store** → **Themes** → next to your live theme click **Customize**.

Navigate to the product template (top dropdown → **Products** → **Default product**).

In the left sidebar, find a logical place under the product info — most themes have an **Add block** or **Add section** option. Pick:

- **Custom Liquid** block (Dawn, Sense, Studio, Crave and most modern Shopify 2.0 themes all have this)
- Or a **Custom HTML** section if your theme only offers that

Add it in the column where you want the picker to appear.

### 3. Paste the snippet

In the Custom Liquid / Custom HTML editor on the right, paste:

```html
<div data-gluepull-widget></div>
<script
  src="REPLACE_WITH_FILE_URL_FROM_STEP_1"
  defer></script>
```

Replace `REPLACE_WITH_FILE_URL_FROM_STEP_1` with the URL you copied. Save the section, then **Save** the theme.

That's it. Reload the product page and the picker is there.

### Mounting more than once on a page

The widget auto-mounts every `<div data-gluepull-widget>` it finds on page load. If you need a different selector (for example you're injecting it into a tab that loads after page-ready), set this **before** the script tag:

```html
<script>
  window.GluePullConfig = { selector: '#my-custom-target' };
</script>
<div id="my-custom-target"></div>
<script src="…/gluepull-widget.iife.js" defer></script>
```

You can also mount imperatively after page load:

```html
<script>
  window.GluePull.mount('#some-element');
  // or
  window.GluePull.mount(document.getElementById('some-element'));
</script>
```

### What it looks like

The widget renders in a Shadow DOM, so your Shopify theme's CSS can't reach inside and the widget's CSS can't leak out. It fills 100% of the container width and grows as tall as it needs. It's mobile-first and works in narrow product columns.

---

## Option B — Iframe embed

Use this if you'd rather host the whole built site somewhere else and reference it.

### 1. Host `dist/`

Upload the entire contents of the `dist/` folder (created by `npm run build`) to any static host. Pick one:

- **Shopify Files**: drag each file in via Settings → Files. The 3 files need to land at the same logical path — Shopify gives them unrelated URLs, so this is awkward. Better suited to one of the options below.
- **GitHub Pages**: push `dist/` to a `gh-pages` branch on a public repo. Free.
- **Cloudflare Pages / Netlify / Vercel**: connect this repo, set the build command to `npm run build` and the output dir to `dist`. Free for small sites.
- **Your own server / S3 bucket**: any static-file host works. The site is fully client-side; no backend needed.

You'll end up with a URL like `https://gluepull.your-domain.com/` or `https://elimadent.github.io/gluepull-web/`.

### 2. Embed it

Same Shopify path as above: theme editor → product template → add a **Custom Liquid** block. Paste:

```html
<iframe
  src="https://YOUR-HOSTED-URL/"
  title="GluePull — weather-aware glue picker"
  loading="lazy"
  allow="geolocation"
  style="
    width: 100%;
    max-width: 560px;
    min-height: 720px;
    border: 0;
    border-radius: 16px;
    background: #0e0f12;
  ">
</iframe>
```

Adjust `min-height` to whatever fits — the widget grows but the iframe doesn't auto-resize. 720 px is a safe minimum for the home screen + a recommended glue.

### Notes for iframe mode

- The `allow="geolocation"` attribute is **required** for the auto-location feature to work in the iframe.
- The page hosting the iframe must be **HTTPS** for the geolocation prompt to fire (your live Shopify storefront is HTTPS, so that's fine).
- If you'd prefer the iframe height to auto-grow with content, that needs a small `postMessage` shim — ping us and we'll add it.

---

## Local preview of the widget (before pasting into Shopify)

Want to see the widget render before going near your theme? After running `npm run build:widget`, open:

```
dist-widget/test.html
```

…in any browser. It's a fake Shopify product page with intentionally aggressive theme CSS (hot pink buttons, dashed red inputs, purple headings) — proof that the widget renders cleanly inside its Shadow DOM no matter what the surrounding page is doing.

---

## Rolling back

The widget and iframe are both inert if removed. Delete the Custom Liquid block from the theme editor and the picker is gone — no leftover assets in the page.
