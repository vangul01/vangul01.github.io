/// <reference types="astro/client" />

// Tells TypeScript that these modules exist
declare module '@sanity/client';
declare module '@sanity/image-url';

// Add type information for environment variables
interface ImportMetaEnv {
  PUBLIC_SANITY_DATASET: string;
  PUBLIC_STRIPE_KEY: string;
}

// Server-only environment variables
declare namespace NodeJS {
  interface ProcessEnv {
    SANITY_PROJECT_ID: string;
    SANITY_WRITE_TOKEN: string;
    SANITY_PRODUCTION_DATASET: string;
    SANITY_DEVELOPMENT_DATASET: string;
    SITE_URL: string;
    CLOUDFLARE_TOKEN: string;
    SECRET_STRIPE_PRODUCT_WEBHOOK_SECRET: string;
    SECRET_SANITY_WEBHOOK_KEY: string;
    SECRET_STRIPE_TEST_KEY: string;
    SECRET_STRIPE_LIVE_KEY: string;
    NETLIFY_BUILD_HOOK?: string;
    NETLIFY_AUTO_REBUILD?: string;
  }
}
