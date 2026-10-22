import { createClient } from "@sanity/client";

export function createSanityClient({ projectId, dataset, token }) {
  return createClient({
    projectId,
    dataset,
    ...(token ? { token } : {}),
    apiVersion: "2024-04-12",
    useCdn: false,
  });
}