// Import Stripe using secret key from environment variables to authenticate with the Stripe API.
import Stripe from "stripe";

const secretKey = process.env.SECRET_STRIPE_KEY;
if (!secretKey) {
  throw new Error("Missing Stripe secret key");
}
const stripe = new Stripe(secretKey, {
  apiVersion: "2025-02-24.acacia",
});

// The handler function processes incoming requests to retrieve Stripe prices.
export async function handler(event) {
  try {
    const { priceIds } = JSON.parse(event.body);

    if (!Array.isArray(priceIds)) {
      throw new Error("priceIds must be an array");
    }

    const prices = await Promise.all(
      priceIds.map((id) => stripe.prices.retrieve(id)),
    );

    const formattedPrices = prices.reduce(
      (acc, price) => ({
        ...acc,
        [price.id]: {
          amount: price.unit_amount / 100,
          currency: price.currency,
        },
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
