/**
 * Resolve a Stripe identifier to the price that should be charged.
 *
 * - `prod_...`  product id  -> the product's current default price (PK path)
 * - `price_...` price id    -> treated as an explicit override and returned as-is
 *
 * Always returns the resolved price object so checkout charges a live price,
 * never a stale Sanity-stored price reference.
 */
export async function resolveDefaultPrice(stripe, identifier) {
  if (!identifier) {
    throw new Error("Missing Stripe identifier");
  }

  let priceId = identifier;

  if (identifier.startsWith("prod_")) {
    const product = await stripe.products.retrieve(identifier);
    if (!product.default_price) {
      throw new Error(
        `Product ${identifier} has no default price set in Stripe`,
      );
    }
    priceId =
      typeof product.default_price === "string"
        ? product.default_price
        : product.default_price.id;
  }

  const price = await stripe.prices.retrieve(priceId);

  return {
    id: price.id,
    unitAmount: price.unit_amount,
    amount: price.unit_amount / 100,
    currency: price.currency,
  };
}