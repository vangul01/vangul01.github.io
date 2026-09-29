import "dotenv/config";

import { createStripeClient } from "./lib/stripe.js";
import { createSanityClient } from "./lib/sanity.js";

const secretKey = process.env.SECRET_STRIPE_KEY;
const webhookSecret = process.env.SECRET_STRIPE_PRODUCT_WEBHOOK_SECRET;
const projectId = process.env.PUBLIC_SANITY_PROJECT_ID;
const writeToken = process.env.SANITY_WRITE_TOKEN;
const productionDataset = process.env.SANITY_PRODUCTION_DATASET || "production";
const developmentDataset =
  process.env.SANITY_DEVELOPMENT_DATASET || "development";

if (!secretKey) {
  throw new Error("Missing Stripe secret key");
}
if (!webhookSecret) {
  throw new Error("Missing Stripe product webhook signing secret");
}
if (!projectId || !writeToken) {
  throw new Error("Missing Sanity project id or write token");
}

const stripe = createStripeClient(secretKey);

function getSanityClient(dataset) {
  return createSanityClient({ projectId, dataset, token: writeToken });
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

async function archiveProduct(client, productId, liveId, draftId, dataset) {
  const patch = { set: { archived: true, inStock: false } };
  await Promise.allSettled([
    client.patch(liveId, patch).commit(),
    client.patch(draftId, patch).commit(),
  ]);
  console.log(
    `Auto-archived ${productId} (${liveId}, ${draftId}) in dataset "${dataset}"`,
  );
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
  const dataset = product.livemode ? productionDataset : developmentDataset;
  const client = getSanityClient(dataset);
  const liveId = `product.${product.id}`;
  const draftId = `drafts.${liveId}`;

  try {
    switch (stripeEvent.type) {
      case "product.created":
      case "product.updated": {
        if (product.active === false) {
          // Deactivated in Stripe: hide it from the shop (same as delete).
          await archiveProduct(client, product.id, liveId, draftId, dataset);
          break;
        }
        // Provision (ensure-exists only) an unpublished Sanity draft so the
        // product is visible in Sanity Studio but NOT on the live site until
        // it is authored and published.
        await client.createIfNotExists({
          _id: draftId,
          _type: "product",
          stripeProductId: product.id,
          name: `${product.name || "Untitled product"} _DRAFT`,
          slug: { current: slugify(product.name) },
          inStock: false,
          archived: false,
          category: "misc",
        });
        console.log(
          `Provisioned Sanity draft ${draftId} in dataset "${dataset}"`,
        );
        break;
      }

      case "product.deleted": {
        // Auto-archive any matching live doc and/or draft so the item
        // disappears from the shop without deleting Sanity data.
        await archiveProduct(client, product.id, liveId, draftId, dataset);
        break;
      }

      default:
        console.log(`Unhandled Stripe event type: ${stripeEvent.type}`);
    }
  } catch (err) {
    console.error("Product provisioning error:", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ received: true }),
  };
}