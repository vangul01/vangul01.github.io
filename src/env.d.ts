/// <reference types="astro/client" />

// Tells TypeScript that these modules exist
declare module '@sanity/client';
declare module '@sanity/image-url';

// Build-time and client-exposed environment variables
interface ImportMetaEnv {
  PUBLIC_SANITY_PROJECT_ID: string;
  PUBLIC_STRIPE_KEY: string;
  SANITY_DATASET?: string;
}

// Server-only environment variables
declare namespace NodeJS {
  interface ProcessEnv {
    SITE_URL?: string;
    PUBLIC_SANITY_PROJECT_ID?: string;
    SANITY_DATASET?: string;
    CLOUDFLARE_TOKEN?: string;
    STRIPE_KEY?: string;
    STRIPE_CHECKOUT_WEBHOOK_SECRET?: string;
    STRIPE_PRODUCT_WEBHOOK_SECRET?: string;
    SECRET_SANITY_WEBHOOK_KEY?: string;
    SANITY_WRITE_TOKEN?: string;
    SECRET_CATALOG_KEY?: string;
    NETLIFY_BUILD_HOOK?: string;
    SANITY_REBUILD_ON_PUBLISH?: string;
    STRIPE_SHIPPING_RATE_STANDARD?: string;
    STRIPE_SHIPPING_RATE_FREE?: string;
    SECRET_BREVO_API_KEY?: string;
    BREVO_CONFIRMED_SUBSCRIBERS_LIST_ID?: string;
    BREVO_DEFAULT_DOUBLE_OPT_IN_TEMPLATE_ID?: string;
    BREVO_CONTACT_AUTORESPONSE_TEMPLATE_ID?: string;
    BREVO_ORDER_CONFIRMATION_TEMPLATE_ID?: string;
    BREVO_ORDER_NOTIFICATION_TEMPLATE_ID?: string;
    BREVO_NOTIFICATION_EMAIL?: string;
    BREVO_SENDER_EMAIL?: string;
  }
}
