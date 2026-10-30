export function productDocId(stripeId) {
  return stripeId;
}

export function productDraftId(stripeId) {
  return `drafts.${stripeId}`;
}

export function isStripeProductId(id) {
  return typeof id === "string" && /^prod_/.test(id);
}
