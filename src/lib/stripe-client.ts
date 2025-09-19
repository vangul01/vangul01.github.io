interface StripePrice {
  amount: number;
  currency: string;
}

/**
 * Helper to get the correct Netlify function URL
 */
function getNetlifyFunctionUrl(path: string) {
  if (typeof window !== "undefined") {
    // Client-side: relative path works
    return path;
  }
  // Server-side: use environment variable or default to localhost
  const base =
    process.env.URL || process.env.DEPLOY_PRIME_URL || "http://localhost:8888";
  return `${base}${path}`;
}

/**
 * Fetch one or more Stripe prices from Netlify function
 */
export async function getStripePrices(
  priceIds: string[]
): Promise<Record<string, StripePrice>> {
  // Add debug logging
  console.log("Sanity Dataset:", import.meta.env.PUBLIC_SANITY_DATASET);
  console.log("Requesting price(s) for:", priceIds);

  const url = getNetlifyFunctionUrl("/.netlify/functions/get-stripe-prices");

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priceIds }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Stripe API Error:", errorText);

      throw new Error(
        `Failed to fetch prices: ${response.status} ${errorText}`,
      );
    }
    const data = await response.json();
    console.log("Stripe API Response:", data);
    return data;
  } catch (error) {
    console.error("Stripe Client Error:", error);
    throw error;
  }
}

/**
 * Fetch a single Stripe price by ID
 */
export async function getStripePrice(priceId: string): Promise<StripePrice> {
  const prices = await getStripePrices([priceId]);
  return prices[priceId];
}

/**
 * Fetch a single Stripe price by ID
 */
export async function getStripePrice(priceId: string): Promise<StripePrice> {
  const prices = await getStripePrices([priceId]);
  return prices[priceId];
}
