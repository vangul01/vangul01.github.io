import { createClient } from "@sanity/client";
import type { Product, Collaboration } from "../types/sanity-schema";

console.log(
  "Initializing Sanity client with dataset:",
  import.meta.env.DEV ? "development" : import.meta.env.PUBLIC_SANITY_DATASET,
);

export const client = createClient({
  projectId: process.env.SANITY_PROJECT_ID,
  dataset: import.meta.env.DEV
    ? "development"
    : import.meta.env.PUBLIC_SANITY_DATASET,
  apiVersion: "2024-04-12",
  useCdn: false,
});

// Create safe sanity fetch for offline testing - do I have to disable this in production?
export async function safeSanityFetch(query: string) {
  try {
    return await client.fetch(query);
  } catch (error) {
    console.warn("Sanity is offline, returning empty data", error);
    return [];
  }
}

export async function getAllProducts(): Promise<Product[]> {
  const query = `*[_type == "product" && coalesce(archived, false) != true]{
        _id,
        name,
        "slug": slug.current,
        description,
        category,
        featured,
        "images": images[].asset->url,
        stripeProductId,
        materials,
        inStock,
        "archived": coalesce(archived, false)
      }`;

  const products = await safeSanityFetch(query);
  // TypeScript knows the return type from the function signature
  return products;
}

export function getOptimizedImageUrl(
  url: string,
  width = 600,
  quality = 80,
): string {
  if (!url || !url.includes("sanity")) return url;
  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}auto=format&w=${width}&q=${quality}&fit=max`;
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const query = `*[_type == "product" && coalesce(archived, false) != true]{
        _id,
        name,
        "slug": slug.current,
        "images": images[].asset->url,
        "archived": coalesce(archived, false)
      }`;

  return await safeSanityFetch(query);
}

export async function getCollabs(): Promise<Collaboration[]> {
  const query = `*[_type == "collab"]{
    _id,
    title,
    client,
    company,
    services,
    sector,
    completionYear,
    description,
    clientLink,
    clientReview,
    "images": images[].asset->url,
    link,
    tags,
    completedDate
  }`;

  return await safeSanityFetch(query);
}
