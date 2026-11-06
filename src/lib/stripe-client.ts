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

const MAX_IDS_PER_REQUEST = 50;

export async function getStripePrices(
  productIds: string[],
): Promise<ProductStatusMap> {
  const url = "/.netlify/functions/get-stripe-prices";
  const uniqueIds = [...new Set(productIds.filter(Boolean))];
  const merged: ProductStatusMap = {};

  for (let i = 0; i < uniqueIds.length; i += MAX_IDS_PER_REQUEST) {
    const chunk = uniqueIds.slice(i, i + MAX_IDS_PER_REQUEST);
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productIds: chunk }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch prices: ${response.status} ${errorText}`);
    }

    Object.assign(merged, await response.json());
  }

  return merged;
}

export async function getStripePrice(productId: string): Promise<ProductStatus> {
  const prices = await getStripePrices([productId]);
  return prices[productId] || { state: "not_found" };
}
