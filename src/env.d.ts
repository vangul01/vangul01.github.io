/// <reference types="astro/client" />

// Tells TypeScript that these modules exist
declare module '@sanity/client';
declare module '@sanity/image-url';

// Add type information for environment variables
interface ImportMetaEnv {
  PUBLIC_SANITY_PROJECT_ID: string;
  PUBLIC_SANITY_DATASET: string;
  PUBLIC_STRIPE_KEY: string;
}
