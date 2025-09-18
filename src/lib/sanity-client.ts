import { createClient } from "@sanity/client";
import imageUrlBuilder from "@sanity/image-url";
import type { Product, Collaboration } from "../types/sanity-schema";

console.log(
  "Initializing Sanity client with dataset:",
  import.meta.env.PUBLIC_SANITY_DATASET,
);

export const client = createClient({
  projectId: import.meta.env.PUBLIC_SANITY_PROJECT_ID,
  dataset: import.meta.env.PUBLIC_SANITY_DATASET,
  apiVersion: "2024-04-12",
  useCdn: false,
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
  const query = `*[_type == "product"]{
        _id,
        name,
        "slug": slug.current,
        "images": images[].asset->url
      }`;

  return await client.fetch(query);
}

export async function getCollabs(): Promise<Collaboration[]> {
  const query = `*[_type == "collab"]{
    _id,
    title,
    client,
    company,
    description,
    clientLink,
    clientReview,
    "images": images[].asset->url,
    link,
    tags,
    completedDate
  }`;

  return await client.fetch(query);
}
