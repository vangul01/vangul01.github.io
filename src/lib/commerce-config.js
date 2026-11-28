// To have consistent max products purchaseable. Used in cartIsland, product page and main js for the css quantity selectors.
// To format the prices with trailing zeros and always have $ in front. Used in shop, product, cart pages.

export const MIN_QUANTITY = 1;
export const MAX_QUANTITY = 20;

const amountFormatter = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatAmount(amount) {
  const value =
    typeof amount === "number" && Number.isFinite(amount) ? amount : 0;
  return `$${amountFormatter.format(value)}`;
}

export function formatPrice(amount, currency = "USD") {
  return `${formatAmount(amount)} ${String(currency).toUpperCase()}`;
}
