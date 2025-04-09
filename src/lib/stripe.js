import Stripe from "stripe";

// Use import.meta.env for Vite, process.env for Node.js used in netlify functions
const secretKey = process.env.SECRET_STRIPE_KEY;

if (!secretKey) {
  throw new Error("Missing Stripe secret key");
}

// "2025-02-24.acacia" "2025-03-31.basil"
export const stripe = new Stripe(secretKey, {
  apiVersion: "2025-02-24.acacia",
});
