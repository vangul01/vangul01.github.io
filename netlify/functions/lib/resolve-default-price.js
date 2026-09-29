/**
 * Resolve a Stripe product id (prod_...) to the price that should be charged.
 *
 * Always returns the product's current default price from Stripe so checkout
 * charges a live price, never a client-supplied value or a stale Sanity
 * reference. Explicit price ids (price_...) are rejected — the store prices
 * by product only.
 */
export async function resolveDefaultPrice(stripe, identifier) {
  if (!identifier || !identifier.startsWith("prod_")) {
    throw new Error("Invalid Stripe product id");
  }

  const product = await stripe.products.retrieve(identifier);
  if (!product.default_price) {
    throw new Error(
      `Product ${identifier} has no default price set in Stripe`,
    );
  }

  const priceId =
    typeof product.default_price === "string"
      ? product.default_price
      : product.default_price.id;

  const price = await stripe.prices.retrieve(priceId);

  return {
    id: price.id,
    unitAmount: price.unit_amount,
    amount: price.unit_amount / 100,
    currency: price.currency,
  };
}