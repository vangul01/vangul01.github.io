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

3. Start development server:

```bash
npm run dev
```

## 🔒 Testing Stripe Checkout

1. Start Netlify development server:

```bash
netlify dev
```

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

## 🎨 Design Assets

- Primary Font: Russo One
- Icons: Font Awesome 4.7.0
- Images: [Add sources for my images]

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

MIT © [Valerie Angulo](https://github.com/vangul01)
