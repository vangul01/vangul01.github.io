export type ProductAvailabilityState =
  | "available"
  | "unavailable"
  | "inactive"
  | "not_found";

export interface ProductStatus {
  state: ProductAvailabilityState;
  id?: string;
  amount?: number;
  currency?: string;
}

export type ProductStatusMap = Record<string, ProductStatus>;

export async function getStripePrices(
  productIds: string[],
): Promise<ProductStatusMap> {
  const url = "/.netlify/functions/get-stripe-prices";

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ productIds }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to fetch prices: ${response.status} ${errorText}`);
  }
  return await response.json();
}

export async function getStripePrice(productId: string): Promise<ProductStatus> {
  const prices = await getStripePrices([productId]);
  return prices[productId] || { state: "not_found" };
}
