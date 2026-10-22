import Stripe from "stripe";

const API_VERSION = "2025-02-24.acacia";

export function createStripeClient(secretKey) {
  return new Stripe(secretKey, { apiVersion: API_VERSION });
}