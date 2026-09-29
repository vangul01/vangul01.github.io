import "dotenv/config";

// Import Stripe using secret key from environment variables to authenticate with the Stripe API.
import { createStripeClient } from "./lib/stripe.js";
import { resolveDefaultPrice } from "./lib/resolve-default-price.js";

const secretKey = process.env.SECRET_STRIPE_KEY;
if (!secretKey) {
  throw new Error("Missing Stripe secret key");
}
const stripe = createStripeClient(secretKey);

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

    // Trust only the Stripe product id and a sane quantity. Prices are always
    // re-pulled from Stripe's current default price for the product, so any
    // client-supplied price or explicit price id is ignored.
    const sanitizedItems = items.map((item, index) => {
      const productId =
        typeof item?.productId === "string" ? item.productId.trim() : "";
      if (!productId.startsWith("prod_")) {
        throw new Error(`Invalid product id for item ${index + 1}`);
      }
      const quantity = Math.max(
        1,
        Math.min(Math.round(Number(item?.quantity)) || 1, 10),
      );
      return { productId, quantity };
    });

    // Resolve each item to its current chargeable price (product id -> the
    // product's current default price) so checkout never uses stale prices.
    const prices = await Promise.all(
      sanitizedItems.map((item) =>
        resolveDefaultPrice(stripe, item.productId),
      ),
    );
    const subtotal = prices.reduce(
      (sum, price, index) =>
        sum + (price.unitAmount ?? 0) * sanitizedItems[index].quantity,
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
      line_items: sanitizedItems.map((item, index) => ({
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
      success_url: `${process.env.SITE_URL}/status/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.SITE_URL}/status/cancel`,
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
