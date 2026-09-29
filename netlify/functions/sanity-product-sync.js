import "dotenv/config";

import { isValidSignature } from "@sanity/webhook";
import { createStripeClient } from "./lib/stripe.js";
import { createSanityClient } from "./lib/sanity.js";

const projectId = process.env.PUBLIC_SANITY_PROJECT_ID;
const webhookSecret = process.env.SECRET_SANITY_WEBHOOK_KEY;
const productionDataset =
  process.env.SANITY_PRODUCTION_DATASET || "production";

if (!projectId) {
  throw new Error("Missing Sanity project id");
}
if (!webhookSecret) {
  throw new Error("Missing Sanity webhook signing secret");
}

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

  const isProduction = dataset === productionDataset;
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

  // 4. Pick the right Stripe key: Sanity dev dataset -> test, prod -> live
  const stripeKey = isProduction
    ? process.env.SECRET_STRIPE_LIVE_KEY
    : process.env.SECRET_STRIPE_TEST_KEY;
  if (!stripeKey) {
    console.error(
      `Missing ${isProduction ? "SECRET_STRIPE_LIVE_KEY" : "SECRET_STRIPE_TEST_KEY"} for dataset "${dataset}"`,
    );
    return { statusCode: 500, body: "Missing Stripe key" };
  }

  const stripe = createStripeClient(stripeKey);

  // 5. Update the Stripe product: name (minus _DRAFT), description,
  //    first image, and archive state matching Sanity.
  const update = {
    name: stripDraftSuffix(doc.name),
    active: !doc.archived,
  };
  const description = buildDescription(doc);
  if (description) update.description = description;
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
  //    NETLIFY_AUTO_REBUILD === "false" (e.g. during bulk edits).
  if (isProduction && process.env.NETLIFY_AUTO_REBUILD !== "false") {
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
    console.log("Automatic rebuild disabled (dev dataset or flag off)");
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ sync: "ok" }),
  };
}