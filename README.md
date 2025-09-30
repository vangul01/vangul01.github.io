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
