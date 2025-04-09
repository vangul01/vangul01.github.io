import Stripe from "stripe";

// Use import.meta.env for Vite, process.env for Node.js used in netlify functions
const secretKey = process.env.SECRET_STRIPE_KEY;

if (!secretKey) {
  throw new Error("Missing Stripe secret key");
}

export const stripe = new Stripe(secretKey, {
  apiVersion: "2025-02-24.acacia",
});
