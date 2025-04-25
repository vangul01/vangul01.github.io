import { stripe } from "../../src/lib/stripe.js";

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
