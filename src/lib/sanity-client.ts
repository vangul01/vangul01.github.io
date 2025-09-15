import { createClient, type ClientConfig } from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";
import type { Product, SanityProduct } from "../types/sanity-schema";

export const client = createClient({
  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID,
  dataset: import.meta.env.PUBLIC_SANITY_DATASET,
  apiVersion: "2024-04-12",
  useCdn: true,
});

const builder = imageUrlBuilder(client);

export function getSanityImageURL(source: any) {
  return builder.image(source);
}

export async function getAllProducts(): Promise<Product[]> {
  const query = `*[_type == "product"]{
        _id,
        name,
        "slug": slug.current,
        description,
        category,
        featured,
        "images": images[].asset->url,
        stripePriceId,
        materials,
        quantity
      }`;

  const products = await client.fetch(query);
  // TypeScript knows the return type from the function signature
  return products;
}

export async function getFeaturedProducts(): Promise<Product[]> {
  const query = `*[_type == "product" && featured == true]{
        _id,
        name,
        "slug": slug.current,
        "images": images[].asset->url
      }`;

  return await client.fetch(query);
}

export async function getCollabProducts(): Promise<Product[]> {
  const query = `*[_type == "product" && category == "collaboration"]{
    _id,
    name,
    "slug": slug.current,
    "images": images[].asset->url
  }`;

  return await client.fetch(query);
}
