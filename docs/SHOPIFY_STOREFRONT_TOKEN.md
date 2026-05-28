# Shopify Storefront API token — setup checklist

Glue IQ now opens an in-app drawer when a Buy / View link is tapped instead
of launching a new browser tab. From the drawer, "Add to Cart" behaves
differently depending on where the app is running:

| Runtime                                  | Add-to-Cart strategy                       | Status     |
|------------------------------------------|--------------------------------------------|------------|
| Widget mode (`ansonpdr.com/<page>`)      | Shopify Ajax cart (`/cart/add.js`)         | works now  |
| Standalone (any other domain)            | Same-window nav to PDP with `?quantity=N`  | works now  |
| Standalone with Storefront API token     | True cross-origin Add-to-Cart, no nav      | **needs token** |

The same code runs in all three modes — the drawer detects the environment
at runtime. The third mode is the polished option for the standalone host;
it's what flips "Add to Cart" from "navigate to Anson" to "add silently
right here in Glue IQ." Below is exactly how to mint the token and wire it
in.

## Step 1 — Create a custom app in Shopify admin

1. In Shopify admin: **Settings → Apps and sales channels → Develop apps**.
   (If the "Develop apps" link doesn't appear, hit **Allow custom app development** first.)
2. Click **Create an app**. Name it something like `Glue IQ Storefront`.
3. Open **Configuration → Storefront API**.
4. Enable these scopes:
   - `unauthenticated_read_product_listings`
   - `unauthenticated_write_checkouts`
   - `unauthenticated_read_checkouts`
   - `unauthenticated_write_customers` (only if you want logged-in carts)
5. **Save**, then **Install app**.
6. Open **API credentials**, scroll to **Storefront API access tokens**,
   copy the long token string.

## Step 2 — Add the token to Glue IQ

Two ways, pick one.

### A) Build-time env var (recommended)

In the project root, create a `.env.local` file (already gitignored):

```dotenv
VITE_SHOPIFY_STOREFRONT_TOKEN=shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Restart the dev server (or rebuild). Glue IQ picks it up automatically.

### B) Runtime injection (for the widget on Anson)

Add this above the widget script tag on `ansonpdr.com`:

```html
<script>
  window.GLUEIQ_SHOPIFY_TOKEN = 'shpat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
</script>
<script src="…/gluepull-widget.iife.js"></script>
```

The drawer's `currentAddToCartMode()` will start reporting `'storefront-api'`
and (once the API call is wired below) hit Shopify directly instead of
navigating away.

## Step 3 — Verify (no code change needed)

After step 2, open the browser console on the Glue IQ page and run:

```js
import { currentAddToCartMode } from '/src/services/shopify.ts';
currentAddToCartMode();
// → 'storefront-api'
```

If you see `'standalone-nav'`, the token isn't reaching the runtime. Double-
check `.env.local` is in the project root and the dev server has been
restarted.

## What's left to do (one-time wiring) when the token lands

In `src/services/shopify.ts`, the `'storefront-api'` branch is currently a
placeholder that falls through to the navigation path:

```ts
if (mode === 'storefront-api') {
  // TODO: wire Storefront API GraphQL cartLinesAdd when token lands.
  window.location.href = withQuantity(productUrl, qty);
  return { mode: 'standalone-nav', inPlace: false };
}
```

Once you've confirmed the token works, swap that branch for a Storefront API
GraphQL call against `https://ansonpdr.com/api/2024-07/graphql.json`. Two
mutations: `cartCreate` (first add) and `cartLinesAdd` (subsequent). Store
the resulting cart ID in `localStorage` so the cart persists across drawer
opens. The drawer's `inPlace: true` success path is already wired — set
that flag and the drawer auto-closes with a "✓ Added to cart" state.

## CORS gotcha

Shopify's Storefront API supports cross-origin requests by design — no CORS
config needed on the Anson side. If you ever see a CORS error, it's almost
certainly because you used the **Admin** API token (which is server-only)
instead of the **Storefront** token. Confirm the token starts with `shpat_`
or `b1...` (Storefront), not `shpss_` or `shpat_admin_` (Admin).
