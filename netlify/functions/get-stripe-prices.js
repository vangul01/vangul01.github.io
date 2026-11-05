import "dotenv/config";

import { createStripeClient } from "./lib/stripe.js";
import { requireEnv } from "./lib/env.js";
import { getProductStatus } from "./lib/get-product-status.js";

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

    const uniqueIds = [...new Set(productIds.filter(Boolean))];
    const results = await Promise.allSettled(
      uniqueIds.map(async (id) => [id, await getProductStatus(stripe, id)]),
    );

    const statuses = {};
    for (let i = 0; i < results.length; i++) {
      const res = results[i];
      const id = uniqueIds[i];
      if (res.status === "fulfilled") {
        statuses[res.value[0]] = res.value[1];
      } else {
        console.error("get-stripe-prices item error:", id, res.reason?.message || res.reason);
        statuses[id] = { state: "not_found" };
      }
    }

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
