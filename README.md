# Vangular E-commerce

An e-commerce webstore with JAMstack architecture for art and design products.

## 🛠️ Tech Stack

- **Astro**: Static site generator for SEO and performance optimization
- **Sanity**: Headless CMS for product management
- **Stripe**: Payment processing with embedded checkout
- **Netlify**: Hosting and serverless functions
- **ngrok**: Local development tunneling

## 📁 Project Structure

```text
/
├── public/
│   ├── favicon.svg
│   ├── sw.js                # Service Worker for PWA
│   └── manifest.json        # PWA manifest
├── src/
│   ├── assets/             # Images and static assets
│   ├── components/         # Reusable UI components
│   ├── layouts/
│   │   └── BaseLayout.astro # Main layout wrapper
│   ├── lib/                # Utility functions
│   │   ├── sanity-client.ts
│   │   └── stripe-client.ts
│   ├── pages/             # Route components
│   ├── scripts/           # Client-side JavaScript
│   │   └── cart/          # Cart functionality
│   ├── styles/            # Global styles
│   └── types/             # TypeScript definitions
├── netlify/
│   └── functions/         # Serverless functions
└── sanity/               # Sanity CMS configuration
```

## 🚀 Getting Started

1. Install dependencies:

```bash
npm install
```

2. Set up environment variables:

```bash
# .env.development
SANITY_PROJECT_ID="your_project_id"
PUBLIC_SANITY_DATASET="development"
PUBLIC_STRIPE_KEY="pk_test_..."
SECRET_STRIPE_KEY="sk_test_..."
SITE_URL="http://localhost:4321"
```

## 🇺🇸 Shipping & Tax (US/MVP)

- **Shipping**: checkout charges a flat rate (default `$9.95`) via a Stripe
  shipping rate, and switches to a `$0` free-shipping rate when the order
  subtotal is `$75` or more. The dollar amounts live in the Stripe Dashboard,
  and the rate IDs are referenced by env vars:
  `STRIPE_SHIPPING_RATE_STANDARD` / `STRIPE_SHIPPING_RATE_FREE`.
- **Tax**: Stripe Tax (Tax Basic) is enabled with `automatic_tax` on the
  Checkout Session, so US sales tax is calculated from the shipping address.
  Only orders shipped to a registered jurisdiction (currently NY) are taxed;
  others are charged `$0`. Filing is done manually from Stripe's Location
  reports.
- Checkout is restricted to US addresses (`allowed_countries: ["US"]`).

## 💳 Pricing Model (MVP: 1 price per product)

- Each Sanity product has exactly **one price**, controlled entirely in Stripe.
- `stripeProductId` (`prod_...`) is the required Sanity↔Stripe primary key.
- Stripe's **default price** on that product is the single source of truth for
  pricing. It is resolved live at render/checkout time and never stored in
  Sanity, so repointing the default (or editing a price) in the Dashboard
  updates the store immediately.
- **Do not create multiple prices per product yet** — the store only sells the
  product's default price. Add variant support before relying on multi-price
  products.

3. Start development server:

```bash
npm run dev
```

## 🔒 Testing Stripe Checkout

1. Start Netlify development server:

```bash
netlify dev
```

> `netlify.toml` sets `framework = "#static"`, so `netlify dev` serves the
> prebuilt `dist/` and never rebuilds. After changing source, run
> `npm run build` first (dist is compiled at build time — see Troubleshooting).

2. In a new terminal, start ngrok tunnel:

```bash
# For randomly generated site: ngrok http 8888
ngrok http --url=raccoon-allowed-wahoo.ngrok-free.app 8888
```

3. Copy the ngrok URL and update your environment:

```bash
# .env.development
SITE_URL="https://your-ngrok-url.ngrok-free.app"
```

4. Update Stripe webhook endpoints in Stripe Dashboard with new ngrok URL

### Local Stripe webhook testing (no ngrok needed)

Use the Stripe CLI to forward webhook events to your local functions without
managing a permanent webhook endpoint or ngrok tunnel:

```bash
# 1. Serve the site + Netlify functions locally on port 8888
netlify dev --port=8888

# 2. In another terminal, forward Stripe test events to the local webhook
stripe listen --forward-to localhost:8888/.netlify/functions/stripe-webhook

# 3. `stripe listen` prints a signing secret like:
#    whsec_xxxxxxxxxxxx
# Copy that value into your local .env as SECRET_STRIPE_WEBHOOK_SECRET for this
# session (it changes each time you run `stripe listen`).
```

Then trigger the webhook locally with `stripe trigger checkout.session.completed`
or by completing a real (test-mode) checkout.

> Never put a `stripe listen` (CLI) signing secret into a deployed Netlify site's
> environment variables. Only the secret revealed on the endpoint's page in the
> Stripe Dashboard (`w: Developers > Webhooks > your endpoint > Reveal secret`)
> belongs there. The CLI secret and the Dashboard secret both start with `whsec_`
> but are different — mixing them up makes every delivery fail with a `400`.

### Local testing of the product-provisioning webhook (Stripe CLI)

The Stripe CLI forwards Stripe events to your local machine, letting you run the
exact code that's deployed (`stripe-product-sync.js`) with no dashboard webhook:

```bash
# 1. Serve the site + Netlify functions locally on port 8888
netlify dev --port=8888

# 2. In another terminal, forward Stripe test events to the local function
stripe listen --forward-to localhost:8888/.netlify/functions/stripe-product-sync

# 3. `stripe listen` prints a signing secret (whsec_...) that changes every run.
#    Copy it into local .env as SECRET_STRIPE_PRODUCT_WEBHOOK_SECRET for THIS
#    session, then restart `netlify dev` (functions only read env at startup).

# 4. Trigger provisioning in a third terminal
stripe trigger product.created
```

- `stripe trigger product.created` creates a Sanity **draft** `drafts.product.<id>`
  in the **development** dataset — visible in Studio as "_DRAFT", invisible to
  the site until you publish it.
- For `product.updated` / `product.deleted`: `stripe trigger` may not accept
  those literals — instead edit / (hard) delete the test product in the Stripe
  Dashboard **in test mode** while `stripe listen` is running.
- The CLI secret is ephemeral and **local-only**; the **Netlify** secret must be
  the live endpoint's Dashboard secret. Mixing them up fails every delivery.
- This exercises the same function code as production, but is **not** a test of
  the deployed endpoint or live-mode delivery (drafts land in `development`).

### Local Stripe webhook testing with ngrok (public HTTPS URL)

Use this when you need a public HTTPS URL for a real webhook endpoint (e.g. to
point a Stripe Dashboard webhook at your machine):

```bash
# 1. Serve the site + Netlify functions locally on port 8888
netlify dev --port=8888

# 2. Tunnel localhost to a public URL
ngrok http 8888            # or: ngrok http --url=your-name.ngrok-free.app 8888

# 3. Stripe Dashboard > Developers > Webhooks (test mode) > Add endpoint
#    URL: https://<your-ngrok-url>.ngrok-free.app/.netlify/functions/stripe-webhook
#    Select the checkout.session.completed event type, then Reveal secret and
#    copy that whsec_... into local .env as SECRET_STRIPE_WEBHOOK_SECRET
```

Each webhook endpoint has its own signing secret. Keep this ngrok endpoint's
secret in local `.env` and rely on `stripe listen` (above) otherwise.

## 💾 Sanity CMS

1. Start Sanity studio:

```bash
cd sanity
npm run dev
```

2. Access studio at `http://localhost:3333`

Note: Sanity files of interest for schema updates:

- src/types/sanity-schema.ts
- src/lib/sanity-client.ts

## 🔄 Catalog Sync (Stripe ↔ Sanity)

Sanity owns all storefront content; Stripe owns identity, pricing and checkout.
Two serverless webhooks keep them in sync, using `stripeProductId` (`prod_...`)
as the primary key.

### 1. Stripe → Sanity (provisioning drafts)

`netlify/functions/stripe-product-sync.js` listens for Stripe `product.created`,
`product.updated` and `product.deleted` events.

- **Mode routes to a dataset**: live-mode Stripe events → `SANITY_PRODUCTION_DATASET`
  (default `production`); test-mode → `SANITY_DEVELOPMENT_DATASET`
  (default `development`). Test products can never leak into the live site.
- `product.created` / `product.updated` calls `createIfNotExists` on
  `drafts.product.<prodId>` with name `"<Stripe name> _DRAFT"` (slug from the
  clean name), `inStock: false`, `archived: false`, `category: "misc"`.
  Ensure-exists only — it never overwrites authored content, so it cannot
  create an update loop. The draft is invisible to the site until published.
- `product.deleted` auto-archives the matching Sanity doc (live + draft) so a
  Stripe-side delete removes the item from the shop without losing Sanity data.

### 2. Sanity → Stripe (publish sync + rebuild)

`netlify/functions/sanity-product-sync.js` is triggered by Sanity webhooks on
**published** product documents (filter:
`_type == "product" && !(_id in path("drafts.**"))`), one webhook per dataset.

- The dataset the webhook is applied to is sent as the `sanity-dataset` header.
  Development-dataset webhooks use `SECRET_STRIPE_TEST_KEY`; production-dataset
  webhooks use `SECRET_STRIPE_LIVE_KEY` (no query param needed).
- Updates the Stripe product: name (trailing ` _DRAFT` stripped), description
  built from `Materials`/`Dimensions` (e.g. `Materials: X | Dimensions: Y`),
  the first image, and `active` mirrored from Sanity `archived`.
- `inStock` stays a **manual** Sanity decision — never auto-set on publish.

### Automatic Netlify rebuild

After a **production** publish, the webhook fires a Netlify Build Hook so the
static site reflects the freshly published Sanity content. Development
publishes never rebuild.

- `NETLIFY_BUILD_HOOK` — the Netlify Build Hook URL. Unset = no auto-rebuild
  (changes appear on the next manual deploy).
- `NETLIFY_AUTO_REBUILD` — set to `"false"` to suspend automatic rebuilds while
  still syncing Stripe (e.g. during bulk edits). Unset = enabled. When disabled,
  publishing still updates Stripe, but the site keeps its last built Sanity
  snapshot until a rebuild happens some other way.

### Webhook registration

| Webhook | Endpoint | Events | Signing secret |
|---|---|---|---|
| Stripe → Sanity | `/.netlify/functions/stripe-product-sync` | `product.created`, `product.updated`, `product.deleted` | `SECRET_STRIPE_PRODUCT_WEBHOOK_SECRET` (from the Stripe Dashboard endpoint) |
| Sanity dev (applied to `development` dataset) | `/.netlify/functions/sanity-product-sync` | publish of product documents | `SECRET_SANITY_WEBHOOK_KEY` |
| Sanity prod (applied to `production` dataset) | `/.netlify/functions/sanity-product-sync` | publish of product documents | `SECRET_SANITY_WEBHOOK_KEY` (same secret for both) |

### Catalog sync environment variables

| Variable | Purpose |
|---|---|
| `SANITY_PROJECT_ID` | Sanity project id (renamed from `PUBLIC_SANITY_PROJECT_ID`) |
| `SANITY_WRITE_TOKEN` | Sanity write token (Stripe→Sanity provisioning) |
| `SANITY_PRODUCTION_DATASET` | Live-mode Stripe events → this dataset (default `production`) |
| `SANITY_DEVELOPMENT_DATASET` | Test-mode Stripe events → this dataset (default `development`) |
| `SECRET_STRIPE_PRODUCT_WEBHOOK_SECRET` | Stripe product webhook signing secret |
| `SECRET_SANITY_WEBHOOK_KEY` | Sanity webhook signing secret (used by both dataset webhooks) |
| `SECRET_STRIPE_TEST_KEY` | Stripe test key, used for dev-dataset publish sync |
| `SECRET_STRIPE_LIVE_KEY` | Stripe live key, used for prod-dataset publish sync |
| `NETLIFY_BUILD_HOOK` | Netlify build hook URL for auto-rebuild |
| `NETLIFY_AUTO_REBUILD` | `"false"` disables auto-rebuild (unset = enabled) |

### Production Netlify environment checklist

In Netlify's **production context**, the sync pipeline needs these new vars
(your existing checkout/Brevo/shipping vars stay unchanged):

| Variable | Value |
|---|---|
| `SECRET_STRIPE_LIVE_KEY` | `sk_live_...` — live Stripe key for the production-dataset sync |
| `SECRET_STRIPE_TEST_KEY` | `sk_test_...` — so a development-dataset publish never 500s in the prod deploy |
| `SECRET_STRIPE_PRODUCT_WEBHOOK_SECRET` | signing secret from your live `stripe-product-sync` endpoint |
| `SECRET_SANITY_WEBHOOK_KEY` | the shared secret from both Sanity webhooks |
| `SANITY_WRITE_TOKEN` | Sanity write token |
| `NETLIFY_BUILD_HOOK` | the build hook URL (e.g. `sanity-publish-rebuild`) |
| `NETLIFY_AUTO_REBUILD` | unset (enabled); set `"false"` only during bulk edits |

Renamed vars to keep current: `SITE_URL=https://www.vangular.com`,
`SANITY_PROJECT_ID`, `CLOUDFLARE_TOKEN`.

Gotchas:
- `PUBLIC_SANITY_DATASET` must be `production` in the production context — the
  built site reads it.
- In production, `SECRET_STRIPE_KEY` (checkout) and `SECRET_STRIPE_LIVE_KEY`
  (dataset sync) are both the live key — different vars, separate purposes.
- The live key never goes in local `.env`; it lives only in Netlify production.

## 📦 Building for Production

1. Build the site:

```bash
npm run build
```

2. Preview the build:

```bash
npm run preview
```

## 🔄 Development Workflow

1. Use development dataset in Sanity for testing
2. Test payments with Stripe test mode
3. Use ngrok for local checkout testing
4. Deploy to Netlify for production

## 🛠️ Troubleshooting

### Sanity shows "production" when .env says "development"

Two known causes, in order of likelihood:

1. **Stale `dist/` build.** With `framework = "#static"` in `netlify.toml`,
   `netlify dev` serves whatever was last built — it never rebuilds. The
   dataset is compiled INTO the built JS at build time, so if you built while
   the env was wrong, the old value stays until you rebuild (the price-fetch
   code used to log `Sanity Dataset: <baked value>` to make this visible).

   Fix:

   ```bash
   unset SITE_URL PUBLIC_STRIPE_KEY SECRET_STRIPE_KEY SANITY_PROJECT_ID PUBLIC_SANITY_DATASET
   npm run build
   netlify dev --port=8888
   ```

2. **A shell session exporting the env var overrides `.env`.** Vite/Astro let an
   existing process env var beat the `.env` file, so a manual
   `export PUBLIC_SANITY_DATASET=production` left in a terminal session wins.
   `netlify dev` reveals this in its startup log — "Ignored .env file env var:
   PUBLIC_SANITY_DATASET (defined in process)" is bad; "Injected .env file env
   vars: ... `PUBLIC_SANITY_DATASET`" is good. It usually comes from an export
   in a long-lived session or the one that launched the dev server, and
   unsetting it in a different terminal does nothing.

   Diagnose:

   ```bash
   printenv PUBLIC_SANITY_DATASET   # empty is good
   ```

   Fix: unset the vars in the same shell that runs netlify dev, or open a fresh
   terminal window before starting it.

### Orphaned Astro dev server (port 4321) / `netlify dev` crash: `read ECONNRESET`

- Known netlify-cli proxy bug on macOS + Node 22/24. `netlify dev` proxies
  8888 → 4321; when it crashes with `read ECONNRESET`, the Astro child it
  spawned can survive as an orphan that keeps listening on 4321 and breaks the
  next `netlify dev` run.
- Astro ≥ 7 auto-backgrounds `astro dev` when it detects an AI agent
  (`OPENCODE`/`AGENT` env vars) and writes a `.astro/dev.json` lock file.

  Recover:

  ```bash
  lsof -ti :4321 | xargs kill   # kill orphaned astro
  rm -rf .astro                 # clear stale lock file
  netlify dev --port=8888
  ```

- In proxy mode (`framework = "astro"`, `targetPort = 4321`), prepend
  `ASTRO_DEV_BACKGROUND=0` to the dev command so the Astro child stays
  foregrounded and netlify can stop it cleanly. Static mode
  (`framework = "#static"`) avoids the orphan entirely but requires
  `npm run build` after source changes (no HMR).

## 🎨 Design Assets

- Primary Font: Russo One
- Icons: Font Awesome 4.7.0
- Images: [Add sources for my images]

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

MIT © [Valerie Angulo](https://github.com/vangul01)
