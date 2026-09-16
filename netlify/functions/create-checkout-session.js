import "dotenv/config";

// Import Stripe using secret key from environment variables to authenticate with the Stripe API.
import Stripe from "stripe";
import { resolveDefaultPrice } from "./lib/resolve-default-price.js";

const secretKey = process.env.SECRET_STRIPE_KEY;
if (!secretKey) {
  throw new Error("Missing Stripe secret key");
}
const stripe = new Stripe(secretKey, {
  apiVersion: "2025-02-24.acacia",
});

// Shipping rates are created in the Stripe Dashboard and referenced by ID.
const standardShippingRate = process.env.STRIPE_SHIPPING_RATE_STANDARD;
const freeShippingRate = process.env.STRIPE_SHIPPING_RATE_FREE;
const FREE_SHIPPING_THRESHOLD = 7500; // $75.00 in cents

if (!standardShippingRate || !freeShippingRate) {
  throw new Error("Missing Stripe shipping rate env vars");
}

// This function will be called when the client requests to create a checkout session.
export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    // Parse the request body to get the items array
    const { items } = JSON.parse(event.body);
    console.log("Items received:", items);

    if (!Array.isArray(items) || items.length === 0) {
      throw new Error("No items provided");
    }

    // Resolve each item to its current chargeable price (product id -> default
    // price, or explicit price override) so checkout never uses stale prices.
    const prices = await Promise.all(
      items.map((item) =>
        resolveDefaultPrice(stripe, item.productId ?? item.priceId),
      ),
    );
    const subtotal = prices.reduce(
      (sum, price, index) =>
        sum + (price.unitAmount ?? 0) * items[index].quantity,
      0,
    );

    // Free standard shipping on orders over $75, otherwise a flat rate
    const shippingOptions = [
      {
        shipping_rate:
          subtotal >= FREE_SHIPPING_THRESHOLD
            ? freeShippingRate
            : standardShippingRate,
      },
    ];

    // Create a Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: items.map((item, index) => ({
        price: prices[index].id,
        quantity: item.quantity,
        // adjustable_quantity: {
        //   enabled: true,
        //   minimum: 1,
        //   maximum: 10,
        // },
      })),
      mode: "payment",
      automatic_tax: { enabled: true },
      shipping_options: shippingOptions,
      success_url: `${process.env.PUBLIC_SITE_URL}/status/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.PUBLIC_SITE_URL}/status/cancel`,
      shipping_address_collection: {
        allowed_countries: ["US"],
      },
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        url: session.url, // Return the redirect URL
      }),
    };
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
