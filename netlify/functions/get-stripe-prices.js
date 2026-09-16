import "dotenv/config";

// Import Stripe using secret key from environment variables to authenticate with the Stripe API.
import Stripe from "stripe";
import { resolveDefaultPrice } from "./lib/resolve-default-price.js";

const secretKey = process.env.SECRET_STRIPE_KEY;
if (!secretKey) {
  throw new Error("Missing Stripe secret key");
}
const stripe = new Stripe(secretKey, {
  apiVersion: "2025-02-24.acacia",
});

// The handler function processes incoming requests to retrieve current Stripe
// prices. Identifiers may be product ids (prod_...) or explicit price ids
// (price_...); either resolves to the price the store actually charges.
export async function handler(event) {
  try {
    const { priceIds } = JSON.parse(event.body);

    if (!Array.isArray(priceIds)) {
      throw new Error("priceIds must be an array");
    }

    const resolved = await Promise.all(
      priceIds.map((id) => resolveDefaultPrice(stripe, id)),
    );

    const formattedPrices = priceIds.reduce(
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
