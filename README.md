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
PUBLIC_SANITY_PROJECT_ID="your_project_id"
PUBLIC_SANITY_DATASET="development"
PUBLIC_STRIPE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
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
- `stripePriceId` (`price_...`) is optional and currently unused as an override —
  a placeholder for a future "special/variant price" feature. It only takes
  effect if deliberately passed as an override.
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
PUBLIC_SITE_URL="https://your-ngrok-url.ngrok-free.app"
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
   unset PUBLIC_SITE_URL PUBLIC_STRIPE_KEY SECRET_STRIPE_KEY PUBLIC_SANITY_PROJECT_ID PUBLIC_SANITY_DATASET
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
