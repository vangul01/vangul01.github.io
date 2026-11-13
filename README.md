# Vangular E-commerce

An e-commerce webstore with JAMstack architecture for art and design products.

## 🛠️ Tech Stack

- **Astro**: Static site generator for SEO and performance optimization
- **Sanity**: Headless CMS for product management
- **Stripe**: Payment processing with embedded checkout
- **Netlify**: Hosting and serverless functions

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

2. Set up environment variables from `.env.example`:

```bash
# Local .env (development)
SITE_URL="http://localhost:8888"
PUBLIC_SANITY_PROJECT_ID="your_project_id"
SANITY_DATASET="development"
PUBLIC_STRIPE_KEY="pk_test_..."
STRIPE_KEY="sk_test_..."
STRIPE_CHECKOUT_WEBHOOK_SECRET="whsec_..."
STRIPE_PRODUCT_WEBHOOK_SECRET="whsec_..."
SECRET_SANITY_WEBHOOK_KEY="your-sanity-webhook-secret"
# SANITY_WRITE_TOKEN is intentionally not set by default; add it only while
# testing Stripe -> Sanity provisioning or catalog repair.
```

`SITE_URL` is always `https://` without a trailing slash in deployed contexts.
The only exception is local development (`http://localhost:8888`). Never point
it at a tunnel URL.

Environment variables are scoped per Netlify deploy context. The full branch
model and per-context values are documented in
[Branch / deploy model](#-branch--deploy-model).

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
- The Sanity document `_id` (`prod_...`) is the Sanity↔Stripe primary key.
- Stripe's **default price** on that product is the single source of truth for
  pricing. It is resolved live at render/checkout time and never stored in
  Sanity, so repointing the default (or editing a price) in the Dashboard
  updates the store immediately. A product is unavailable if it has no default
  price, the default price is inactive, or the price data is invalid.
- Checkout accepts only Stripe product ids (`prod_...`) and re-pulls each
  product's current default price from Stripe — client-supplied prices and
  explicit price ids (`price_...`) are rejected. Quantities are clamped to
  1–10 server-side.
- **Do not create multiple prices per product yet** — the store only sells the
  product's default price. Add variant support before relying on multi-price
  products.
- Availability is re-checked live in the cart and again when the Checkout
  Session is created. Once Stripe's hosted checkout page is open, Stripe does
  not re-validate product availability on refresh; an existing session stays
  payable until it expires. Full enforcement would require a
  `checkout.session.completed` follow-up (cancel/refund) and is out of scope.

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

2. For local webhook testing, use the Stripe CLI (below). For public webhook
   endpoints, use the **testing** deploy — not your machine.

### Local Stripe webhook testing (Stripe CLI)

Use the Stripe CLI to forward webhook events to your local functions without
a public tunnel:

```bash
# 1. Serve the site + Netlify functions locally on port 8888
netlify dev --port=8888

# 2. Forward Stripe test events to the LOCAL function that owns them. A single
#    `stripe listen` forwards EVERY event to one URL, so give each function its
#    own listener — otherwise stripe-orders-webhook never sees arrivals and
#    stripe-product-sync drowns in payment events.

# Order emails — run this for stripe-orders-webhook:
stripe listen --forward-to localhost:8888/.netlify/functions/stripe-orders-webhook \
  --events checkout.session.completed

# Product provisioning — run a SECOND listener in another terminal (full
#    instructions in the product-provisioning section below):
stripe listen --forward-to localhost:8888/.netlify/functions/stripe-product-sync \
  --events product.created

# 3. EACH listener prints its own session signing secret (whsec_..., changes
#    every run). Copy the orders one into local .env as
#    STRIPE_CHECKOUT_WEBHOOK_SECRET and the product one into local .env as
#    STRIPE_PRODUCT_WEBHOOK_SECRET, then RESTART `netlify dev`
#    (functions only read env at startup). A secret mismatch returns a 400 on
#    every delivery.
```

To verify emails, complete a real (test-mode) checkout — `stripe trigger
checkout.session.completed` emits a fake session with no line items, so
`listLineItems` throws and no email is sent. Emails only fire when
`SECRET_BREVO_API_KEY` is set; otherwise the logs show "No Brevo API key set —
skipping email notifications."

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
#    Copy it into local .env as STRIPE_PRODUCT_WEBHOOK_SECRET for THIS
#    session, then restart `netlify dev` (functions only read env at startup).

# 4. Trigger provisioning in a third terminal
stripe trigger product.created
```

- `stripe trigger product.created` creates a Sanity **draft** `drafts.prod_<id>`
  in the **development** dataset — visible in Studio as "_DRAFT", invisible to
  the site until you publish it.
- Only `product.created` is handled; other Stripe product events are ignored.
- The CLI secret is ephemeral and **local-only**; the **Netlify** secret must be
  the live endpoint's Dashboard secret. Mixing them up fails every delivery.
- This exercises the same function code as production, but is **not** a test of
  the deployed endpoint or live-mode delivery (drafts land in `development`).

### Deployed webhook testing

Public webhook endpoints live on the **testing** deploy, not on a tunnel from
your machine. See [Branch / deploy model](#-branch--deploy-model) for the
testing URLs, signing secrets, and manual test flow.

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
Two serverless webhooks keep them in sync. The **Sanity document `_id` is the Stripe product ID** (`prod_...`; drafts as `drafts.prod_...`).

### 1. Stripe → Sanity (provisioning drafts)

`netlify/functions/stripe-product-sync.js` listens for Stripe `product.created`
events (Phase 2). 

- **One dataset per deploy**: `stripe-product-sync` writes to the deploy's
  `SANITY_DATASET`. The testing deploy uses `development`; production uses
  `production`. Stripe test webhooks point only at the testing deploy, so test
  products cannot leak into the live site.
- `product.created` provisions an unpublished Sanity draft with `_id` `drafts.prod_<prodId>`
  (bare Stripe product ID). If a doc already exists for that Stripe product, it
  logs and returns 200 (idempotent). Ensure-exists only — it never overwrites
  authored content.
- Deletes/deactivations are not handled by this webhook in the new flow.

### 2. Sanity → Stripe (publish sync + rebuild)

`netlify/functions/sanity-product-sync.js` is triggered by Sanity webhooks on
**published** product documents (filter:
`_type == "product" && !(_id in path("drafts.**"))`), one webhook per dataset.

- The dataset the webhook is applied to is sent as the `sanity-dataset` header.
  It must match the deploy's `SANITY_DATASET` (verified after signature check) or
  the function logs a mismatch and returns `200 { sync: "skipped" }` with no rebuild.
- Stripe updates use the deploy's single `STRIPE_KEY` (test on testing, live on
  production).
- Stripe product ID is resolved from `doc._id` when it starts with `prod_`.
  Non-Stripe docs are skipped with `skipped: not a Stripe product`.
- Updates the Stripe product: name (sent as-is), description built from
  `Materials`/`Dimensions` (e.g. `Materials: X | Dimensions: Y`), first image
  transformed to `w=1200&fit=max&fm=jpg&q=80`. Empty description/images are sent
  as `""` to clear stale values. No `active` or `metadata` is sent.
- Delete/unpublish events arrive via `sanity-operation: delete` header → no Stripe
  writes, rebuild still triggered if configured.

### Automatic Netlify rebuild

The webhook fires a Netlify Build Hook on publish and on unpublish/delete so the
static site reflects changes. Rebuild is controlled by:

- `NETLIFY_BUILD_HOOK` — the Netlify Build Hook URL for that context. Unset = no
  auto-rebuild (changes appear on the next manual deploy).
- `SANITY_REBUILD_ON_PUBLISH` — set to `"false"` to suspend automatic rebuilds
  while still syncing Stripe (e.g. during bulk edits). Unset = enabled. When
  disabled, publishing still updates Stripe, but the site keeps its last built
  Sanity snapshot until a rebuild happens some other way. Rebuild is awaited and
  failures are logged without throwing.

### 3. Canonical Sanity document ids

Sanity docs use the Stripe product ID as the document `_id`:

- Published: `prod_<prodId>` (e.g. `prod_T4etzqd3uVerhv`)
- Draft: `drafts.prod_<prodId>`

`stripe-product-sync` provisions drafts with bare IDs. `catalog-reconcile`
repair provisions drafts with bare IDs via the helpers. The site lists products
where `_id` matches `prod_*`. `sanity-product-sync` resolves the Stripe ID from
`_id` when it starts with `prod_`. Bare IDs avoid token-less read restrictions
in Sanity. Docs with a non-`prod_` `_id` are treated as non-Stripe and surfaced
by reconcile as `unlinked`.

### 4. Reconciling the catalog (backfill / drift)

Webhooks only react to *future* events: any Stripe product that existed before
the webhook endpoints were registered (or any one-sided change that missed a
webhook) stays permanently out of sync, silently. `catalog-reconcile` diffs the
two sides and repairs them:

```bash
# Report-only for the deploy's own SANITY_DATASET (Insomnia, GET request):
#   URL:  http://localhost:8888/api/catalog-reconcile?repair=false
#   Header: x-reconcile-key: <SECRET_CATALOG_KEY>

# Apply repairs (provision missing active drafts):
#   .../catalog-reconcile?repair=true
```

- The tool always uses the deploy's `SANITY_DATASET` + `STRIPE_KEY`; there is no
  dataset selector. `repair` defaults to `false` and the tool **never writes**
  otherwise.
- `SANITY_WRITE_TOKEN` is required only when `repair=true`; report-only audits
  work without it. It is not set on staging or in the local `.env` by default.
- Report buckets in the JSON response:
  - `missing` — Stripe product with no Sanity doc/draft → repair creates
    `drafts.prod_<prodId>` for active products. Stripe products with
    `active: false` are reported but never drafted.
  - `orphans` — **report-only.** Sanity doc whose base `_id`
    (`prod_<prodId>` or `drafts.prod_<prodId>`) no longer exists in Stripe.
    Unpublish the published doc manually if you want it gone from the site.
  - `deactivated` — **report-only.** Stripe `active: false` with a published
    Sanity doc. The site hides inactive products live; unpublish manually if
    you also want the Sanity doc removed.
  - `contentDrift` — **report-only; never writes either side.** Diff of the
    *published* doc against the Stripe product, using the same transform
    `sanity-product-sync` applies on publish: `name` and `description`
    (`Materials | Dimensions`). Sanity is authoritative on publish, so these
    rows are informational — they show what the next publish will write to
    Stripe (e.g. names edited directly in Stripe, or descriptions that were
    never pushed). Surfaces a missed webhook delivery that would otherwise
    swallow the change.
  - `noActiveDefaultPrice` — **report-only.** Active Stripe products whose
    default price is missing, inactive, or invalid (`unit_amount` absent). The
    store treats these as unavailable, so this usually indicates an accidental
    deactivation or bad default-price pointer. Each entry includes `reason`
    (`missing`, `inactive`, or `invalid`) and `defaultPrice`. Repoint the
    product to an active price in Stripe.
  - `unlinked` — **report-only; never writes.** Published docs whose `_id`
    doesn't start with `prod_` (can't be bought from the cart, which keys off
    it). Should be empty with the `_id`-based model, but surfaced rather than
    hidden.
- Useful for initial backfill and post-deploy audits; also prints a one-line
  summary into the function logs.

### Webhook registration

| Webhook | Endpoint | Events | Signing secret |
|---|---|---|---|
| Stripe → Sanity (testing deploy) | `/.netlify/functions/stripe-product-sync` | `product.created` | `STRIPE_PRODUCT_WEBHOOK_SECRET` (from the Stripe Dashboard endpoint) |
| Stripe checkout (testing deploy) | `/.netlify/functions/stripe-orders-webhook` | `checkout.session.completed` | `STRIPE_CHECKOUT_WEBHOOK_SECRET` |
| Sanity dev (testing deploy, `development` dataset) | `/.netlify/functions/sanity-product-sync` | create/update/delete of product documents (filter `_type == "product" && !(_id in path("drafts.**"))`) | `SECRET_SANITY_WEBHOOK_KEY` |
| Sanity prod (production deploy, `production` dataset) | `/.netlify/functions/sanity-product-sync` | create/update/delete of product documents (filter `_type == "product" && !(_id in path("drafts.**"))`) | `SECRET_SANITY_WEBHOOK_KEY` |

### Catalog sync environment variables

| Variable | Purpose |
|---|---|
| `PUBLIC_SANITY_PROJECT_ID` | Sanity project id (build + functions) |
| `SANITY_DATASET` | The single dataset for this deploy: `development` or `production` |
| `STRIPE_KEY` | Stripe key for this deploy: test on testing, live on production |
| `SANITY_WRITE_TOKEN` | Sanity write token (Stripe→Sanity provisioning + reconcile repair) |
| `STRIPE_PRODUCT_WEBHOOK_SECRET` | Stripe product webhook signing secret |
| `STRIPE_CHECKOUT_WEBHOOK_SECRET` | Stripe checkout webhook signing secret |
| `SECRET_SANITY_WEBHOOK_KEY` | Sanity webhook signing secret |
| `NETLIFY_BUILD_HOOK` | Netlify build hook URL for auto-rebuild |
| `SANITY_REBUILD_ON_PUBLISH` | `"false"` disables auto-rebuild (unset = enabled) |
| `SECRET_CATALOG_KEY` | Token for the `x-reconcile-key` header of `/api/catalog-reconcile` |

### 🌿 Branch / deploy model

| Branch | Purpose | Stripe | Sanity dataset | Webhooks | Build hook | Write token |
|---|---|---|---|---|---|---|
| `dev` | Local only (`netlify dev` + Stripe CLI) | test | `development` | local CLI | none | not set by default |
| `testing` | Stable test deploy | test `sk_test` | `development` | Stripe test + Sanity dev | testing hook | test value |
| `staging` | Browse-only production preview | restricted live `rk_live` | `production` | none | unset | unset |
| `main` | Production | live `sk_live` | `production` | Stripe live + Sanity prod | live hook | live value |

Merge order: `dev -> testing -> staging -> main`. Deploy Previews are not used.

### Per-context Netlify values

| Variable | production (`main`) | testing | staging |
|---|---|---|---|
| `SITE_URL` | `https://www.vangular.com` | `https://testing--voluble-mermaid-026727.netlify.app` | `https://staging--voluble-mermaid-026727.netlify.app` |
| `PUBLIC_SANITY_PROJECT_ID` | project id | project id | project id |
| `SANITY_DATASET` | `production` | `development` | `production` |
| `PUBLIC_STRIPE_KEY` | `pk_live` | `pk_test` | `pk_live` |
| `STRIPE_KEY` | live `sk_live` | test `sk_test` | restricted live `rk_live` |
| `NETLIFY_BUILD_HOOK` | live value | testing branch hook | unset |
| `SANITY_WRITE_TOKEN` | live value | test value | unset |
| `STRIPE_PRODUCT_WEBHOOK_SECRET` | live value | test value | unset |
| `STRIPE_CHECKOUT_WEBHOOK_SECRET` | live value | test value | unset |
| `SECRET_SANITY_WEBHOOK_KEY` | live value | test value | unset |
| `SECRET_CATALOG_KEY` | value | value | unset |
| `SANITY_REBUILD_ON_PUBLISH` | unset | unset | unset |

Shipping-rate, Brevo, and `CLOUDFLARE_TOKEN` values stay per context as
configured.

Config notes:
- `SITE_URL` is `https://` and has no trailing slash in every deployed context.
  Local development is `http://localhost:8888`.
- `staging` is intentionally browse-only: the restricted live key cannot create
  checkouts, and no webhook/build/write secrets are set.
- Env changes only apply after a new deploy. Function code changes must be
  merged to `testing` and built before testing.
- The `testing` branch must have a stable branch deploy URL enabled; do not use
  Deploy Previews.

### Testing-deploy webhook setup

Stripe **test mode** endpoints, both pointing at the testing deploy. Each has
its own signing secret.

1. `https://testing--voluble-mermaid-026727.netlify.app/.netlify/functions/stripe-product-sync`
   - Event: `product.created`
   - Secret → `STRIPE_PRODUCT_WEBHOOK_SECRET` on testing.
2. `https://testing--voluble-mermaid-026727.netlify.app/.netlify/functions/stripe-orders-webhook`
   - Event: `checkout.session.completed`
   - Secret → `STRIPE_CHECKOUT_WEBHOOK_SECRET` on testing.

Sanity **development** webhook:

- URL: `https://testing--voluble-mermaid-026727.netlify.app/.netlify/functions/sanity-product-sync`
- Dataset: `development`; header `sanity-dataset: development`.
- Secret must equal `SECRET_SANITY_WEBHOOK_KEY` on testing.
- Keep the current trigger/filter/projection settings unchanged for now.

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
3. Use the testing deploy for public webhook endpoints
4. Merge `dev -> testing -> staging -> main` for production

## 🛠️ Troubleshooting

### Sanity shows "production" when .env says "development"

Two known causes, in order of likelihood:

1. **Stale `dist/` build.** With `framework = "#static"` in `netlify.toml`,
   `netlify dev` serves whatever was last built — it never rebuilds. The
   dataset is compiled INTO the built JS at build time, so if you built while
   the env was wrong, the old value stays until you rebuild (the build log
   prints `Initializing Sanity client with dataset: <value>`).

   Fix:

   ```bash
   unset SITE_URL PUBLIC_STRIPE_KEY STRIPE_KEY PUBLIC_SANITY_PROJECT_ID SANITY_DATASET
   npm run build
   netlify dev --port=8888
   ```

2. **A shell session exporting the env var overrides `.env`.** Vite/Astro let an
   existing process env var beat the `.env` file, so a manual
   `export SANITY_DATASET=production` left in a terminal session wins.
   `netlify dev` reveals this in its startup log — "Ignored .env file env var:
   SANITY_DATASET (defined in process)" is bad; "Injected .env file env
   vars: ... `SANITY_DATASET`" is good. It usually comes from an export
   in a long-lived session or the one that launched the dev server, and
   unsetting it in a different terminal does nothing.

   Diagnose:

   ```bash
   printenv SANITY_DATASET   # empty is good
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
