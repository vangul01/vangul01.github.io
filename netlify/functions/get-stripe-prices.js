import "dotenv/config";

import { createStripeClient } from "./lib/stripe.js";
import { requireEnv } from "./lib/env.js";
import { getProductStatuses } from "./lib/get-product-status.js";

const MAX_IDS = 50;

const secretKey = requireEnv("STRIPE_KEY");
const stripe = createStripeClient(secretKey);

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { productIds } = JSON.parse(event.body || "{}");

    if (!Array.isArray(productIds)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "productIds must be an array" }),
      };
    }

    if (productIds.length > MAX_IDS) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: `Too many productIds (max ${MAX_IDS})`,
        }),
      };
    }

    const statuses = await getProductStatuses(stripe, productIds);

    return {
      statusCode: 200,
      body: JSON.stringify(statuses),
    };
  } catch (error) {
    console.error("get-stripe-prices error:", error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
