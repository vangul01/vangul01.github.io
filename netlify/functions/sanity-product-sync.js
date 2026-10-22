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

function stripDraftSuffix(name) {
  if (typeof name === "string" && name.endsWith(" _DRAFT")) {
    return name.slice(0, -" _DRAFT".length);
  }
  return name;
}

function buildDescription(doc) {
  const parts = [];
  if (doc.materials) parts.push(`Materials: ${doc.materials}`);
  if (doc.dimensions) parts.push(`Dimensions: ${doc.dimensions}`);
  return parts.join(" | ") || null;
}

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const dataset = event.headers["sanity-dataset"];
  const signature = event.headers["sanity-webhook-signature"];

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
  // 1. Ensure it's a Sanity webhook signature
  try {
    valid = await isValidSignature(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error("Sanity signature verification failed:", err.message);
    return { statusCode: 400, body: "Invalid signature" };
  }
  if (!valid) {
    return { statusCode: 401, body: "Signature mismatch" };
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch (err) {
    return { statusCode: 400, body: "Invalid JSON body" };
  }

  // 2. Skip deletes (Sanity sends the operation as the sanity-operation
  //    header, never in the payload body), and only sync published product
  //    docs (filter set on the Sanity webhook, but guard against drafts).
  if (event.headers["sanity-operation"] === "delete") {
    console.log("Skipping deleted Sanity document");
    return { statusCode: 200, body: JSON.stringify({ sync: "skipped" }) };
  }
  if (payload._type !== "product" || String(payload._id || "").startsWith("drafts.")) {
    return { statusCode: 200, body: JSON.stringify({ sync: "skipped" }) };
  }

  const client = getSanityClient(dataset);

  // 3. Fetch the freshly published doc with resolved image URLs
  const doc = await client.fetch(
    `*[_id == $id][0]{
      _id,
      name,
      stripeProductId,
      materials,
      dimensions,
      inStock,
      archived,
      "images": images[].asset->url
    }`,
    { id: payload._id },
  );

  if (!doc || !doc.stripeProductId) {
    console.log(`Nothing to sync to Stripe for ${payload._id}`);
    return { statusCode: 200, body: JSON.stringify({ sync: "skipped" }) };
  }

  const stripe = createStripeClient(stripeKey);

  // 5. Update the Stripe product: name (minus _DRAFT), description,
  //    first image, and archive state matching Sanity. Description is always
  //    sent so that removing materials/dimensions in Sanity also clears the
  //    stale text in Stripe (null resets it Stripe-side).
  const update = {
    name: stripDraftSuffix(doc.name),
    active: !doc.archived,
    description: buildDescription(doc) || null,
  };
  if (doc.images && doc.images.length > 0) {
    update.images = [doc.images[0]];
  }

  try {
    await stripe.products.update(doc.stripeProductId, update);
    console.log(`Synced Stripe product ${doc.stripeProductId}`);
  } catch (err) {
    console.error("Stripe product update failed:", err.message);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }

  // 6. Trigger a Netlify rebuild (production dataset only) so the static
  //    site reflects the freshly published Sanity content. Disabled when
  //    SANITY_REBUILD_ON_PUBLISH === "false" or NETLIFY_BUILD_HOOK is unset.
  const isProduction = process.env.SANITY_DATASET === "production";
  if (isProduction && process.env.SANITY_REBUILD_ON_PUBLISH !== "false") {
    if (process.env.NETLIFY_BUILD_HOOK) {
      try {
        const res = await fetch(process.env.NETLIFY_BUILD_HOOK, {
          method: "POST",
        });
        console.log(
          `Netlify rebuild triggered (${res.status} ${res.statusText})`,
        );
      } catch (err) {
        console.error("Netlify build hook failed:", err.message);
      }
    } else {
      console.log(
        "NETLIFY_BUILD_HOOK not set; skipping automatic rebuild",
      );
    }
  } else {
    console.log("Automatic rebuild disabled (non-production or flag off)");
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ sync: "ok" }),
  };
}