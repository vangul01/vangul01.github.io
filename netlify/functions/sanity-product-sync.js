import "dotenv/config";

import { isValidSignature } from "@sanity/webhook";
import { createStripeClient } from "./lib/stripe.js";
import { createSanityClient } from "./lib/sanity.js";
import { requireEnv } from "./lib/env.js";

const projectId = requireEnv("PUBLIC_SANITY_PROJECT_ID");
const webhookSecret = requireEnv("SECRET_SANITY_WEBHOOK_KEY");
const datasetEnv = requireEnv("SANITY_DATASET");
const stripeKey = requireEnv("STRIPE_KEY");

function getSanityClient(dataset) {
  return createSanityClient({ projectId, dataset });
}

function buildDescription(doc) {
  const parts = [];
  if (doc.materials) parts.push(`Materials: ${doc.materials}`);
  if (doc.dimensions) parts.push(`Dimensions: ${doc.dimensions}`);
  return parts.join(" | ") || null;
}

function transformImageUrl(url) {
  if (typeof url !== "string" || url.length === 0) return url;
  try {
    const u = new URL(url);
    u.searchParams.set("w", "1200");
    u.searchParams.set("fit", "max");
    u.searchParams.set("fm", "jpg");
    u.searchParams.set("q", "80");
    return u.toString();
  } catch {
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}w=1200&fit=max&fm=jpg&q=80`;
  }
}

function triggerRebuild() {
  const shouldRebuild =
    Boolean(process.env.NETLIFY_BUILD_HOOK) &&
    process.env.SANITY_REBUILD_ON_PUBLISH !== "false";
  if (shouldRebuild && process.env.NETLIFY_BUILD_HOOK) {
    fetch(process.env.NETLIFY_BUILD_HOOK, { method: "POST" })
      .then((res) => {
        console.log(
          `Netlify rebuild triggered (${res.status} ${res.statusText})`,
        );
      })
      .catch((err) => {
        console.error("Netlify build hook failed:", err.message);
      });
    return;
  }
  console.log("Automatic rebuild disabled (missing hook or flag off)");
}

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const dataset = event.headers["sanity-dataset"];
  const signature = event.headers["sanity-webhook-signature"];
  const sanityOperation = event.headers["sanity-operation"];

  if (!dataset) {
    console.log("Missing sanity-dataset header; skipping");
    return { statusCode: 200, body: JSON.stringify({ sync: "skipped" }) };
  }

  if (dataset !== datasetEnv) {
    console.log(
      `sanity-dataset mismatch (got ${dataset}, expected ${datasetEnv}); skipping`,
    );
    return { statusCode: 200, body: JSON.stringify({ sync: "skipped" }) };
  }

  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body, "base64").toString("utf-8")
    : event.body;

  let valid;
  try {
    valid = await isValidSignature(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("Sanity signature verification failed:", err.message);
    return { statusCode: 400, body: "Invalid signature" };
  }
  if (!valid) {
    return { statusCode: 401, body: "Signature mismatch" };
  }

  if (sanityOperation === "delete") {
    console.log("delete payload", rawBody);
    triggerRebuild();
    return { statusCode: 200, body: JSON.stringify({ sync: "skipped" }) };
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch (err) {
    return { statusCode: 400, body: "Invalid JSON body" };
  }

  if (payload._type !== "product" || String(payload._id || "").startsWith("drafts.")) {
    return { statusCode: 200, body: JSON.stringify({ sync: "skipped" }) };
  }

  const client = getSanityClient(dataset);

  const doc = await client.fetch(
    `*[_id == $id][0]{
      _id,
      name,
      stripeProductId,
      materials,
      dimensions,
      "images": images[].asset->url
    }`,
    { id: payload._id },
  );

  if (!doc || !doc.stripeProductId) {
    console.log(`Nothing to sync to Stripe for ${payload._id}`);
    return { statusCode: 200, body: JSON.stringify({ sync: "skipped" }) };
  }

  const stripe = createStripeClient(stripeKey);

  const update = {};
  if (typeof doc.name === "string" && doc.name.trim() !== "") {
    update.name = doc.name;
  }

  const description = buildDescription(doc);
  if (description) {
    update.description = description;
  } else {
    update.description = "";
  }

  if (Array.isArray(doc.images) && doc.images.length > 0 && doc.images[0]) {
    update.images = [transformImageUrl(doc.images[0])];
  } else {
    update.images = "";
  }

  try {
    await stripe.products.update(doc.stripeProductId, update);
    console.log(`Synced Stripe product ${doc.stripeProductId}`);
  } catch (err) {
    console.error("Stripe product update failed:", err.message);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }

  triggerRebuild();

  return {
    statusCode: 200,
    body: JSON.stringify({ sync: "ok" }),
  };
}