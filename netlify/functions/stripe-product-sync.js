import "dotenv/config";

import { createStripeClient } from "./lib/stripe.js";
import { createSanityClient } from "./lib/sanity.js";
import { requireEnv } from "./lib/env.js";
import { productDocId, productDraftId } from "./lib/sanity-ids.js";

const secretKey = requireEnv("STRIPE_KEY");
const webhookSecret = requireEnv("STRIPE_PRODUCT_WEBHOOK_SECRET");
const projectId = requireEnv("PUBLIC_SANITY_PROJECT_ID");
const writeToken = requireEnv("SANITY_WRITE_TOKEN");
const dataset = requireEnv("SANITY_DATASET");

const stripe = createStripeClient(secretKey);

function getSanityClient(d) {
  return createSanityClient({ projectId, dataset: d, token: writeToken });
}

function slugify(name) {
  const slug = String(name || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 200);
  return slug || `product-${Date.now()}`;
}

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const sig = event.headers["stripe-signature"];

  // Netlify base64-encodes the request body by default. Stripe's signature
  // must be verified against the RAW UTF-8 request payload, so decode before
  // verification.
  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body, "base64").toString("utf-8")
    : event.body;

  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error("Product webhook signature verification failed:", err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  const product = stripeEvent.data.object;

  if (stripeEvent.type !== "product.created") {
    console.log(`Ignoring Stripe event type: ${stripeEvent.type}`);
    return {
      statusCode: 200,
      body: JSON.stringify({ received: true, ignored: stripeEvent.type }),
    };
  }

  const client = getSanityClient(dataset);
  const stripeProductId = product.id;
  const docId = productDocId(stripeProductId);
  const draftId = productDraftId(stripeProductId);

  try {
    // Creation is Stripe-first only. Provision an unpublished Sanity draft with
    // bare Stripe product ID as _id (drafts.prod_X). No stripeProductId field.
    const existing = await client.fetch(
      `*[_id in [$id, $draftId]]{_id}`,
      { id: docId, draftId },
    );
    if (existing && existing.length > 0) {
      console.log(
        `duplicate: Sanity doc already exists for ${stripeProductId} (${existing[0]._id})`,
      );
      return {
        statusCode: 200,
        body: JSON.stringify({ received: true }),
      };
    }

    // #LEGACY CODE CHECK CAN BE DELETED AFTER MIGRATION - looks for a legacy product doc
    // (UUID/_id != prod_X) that has stripeProductId matching this Stripe product. Used only
    // to warn during the _id -> Stripe ID migration. Remove once all docs use bare prod_X _ids.
    const legacyDoc = await client.fetch(
      `*[_type == "product" && stripeProductId == $id && _id != $id && _id != $draftId][0]{_id}`,
      { id: stripeProductId, draftId },
    );
    if (legacyDoc) {
      console.log(
        `warning: legacy doc ${legacyDoc._id} has stripeProductId == ${stripeProductId} under a different _id`,
      );
    }

    await client.createIfNotExists({
      _id: draftId,
      _type: "product",
      name: product.name || "Untitled product",
      slug: { current: slugify(product.name) },
      category: "misc",
    });
    console.log(`Provisioned Sanity draft ${draftId} in dataset "${dataset}"`);
  } catch (err) {
    console.error("Product provisioning error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ received: true }),
  };
}