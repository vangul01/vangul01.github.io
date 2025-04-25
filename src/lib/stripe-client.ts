interface StripePrice {
  amount: number;
  currency: string;
}

/**
 * Fetch a single price from Stripe
 */
export async function getStripePrice(priceId: string): Promise<StripePrice> {
  const response = await fetch("/.netlify/functions/get-stripe-prices", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ priceId }),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch price from Stripe");
  }

  return response.json();
}

/**
 * Fetch multiple prices from Stripe in one call
 */
export async function getStripePrices(
  priceIds: string[],
): Promise<Record<string, StripePrice>> {
  const response = await fetch("/.netlify/functions/get-stripe-prices-batch", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ priceIds }),
  });

  if (!response.ok) {
    throw new Error("Failed to fetch prices from Stripe");
  }

  return response.json();
}
