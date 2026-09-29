import "dotenv/config";

import { createStripeClient } from "./lib/stripe.js";
import { resolveDefaultPrice } from "./lib/resolve-default-price.js";

const secretKey = process.env.SECRET_STRIPE_KEY;
if (!secretKey) {
  throw new Error("Missing Stripe secret key");
}
const stripe = createStripeClient(secretKey);

// The handler function processes incoming requests to retrieve current Stripe
// prices. Identifiers are Stripe product ids (prod_...); each resolves to the
// product's current default price — the price the store actually charges.
export async function handler(event) {
  try {
    const { productIds } = JSON.parse(event.body);

    if (!Array.isArray(productIds)) {
      throw new Error("productIds must be an array");
    }

    const resolved = await Promise.all(
      productIds.map((id) => resolveDefaultPrice(stripe, id)),
    );

    const formattedPrices = productIds.reduce(
      (acc, id, index) => ({
        ...acc,
        [id]: resolved[index],
      }),
      {},
    );

    return {
      statusCode: 200,
      body: JSON.stringify(formattedPrices),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
