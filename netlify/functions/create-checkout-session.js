import "dotenv/config";

import { createStripeClient } from "./lib/stripe.js";
import { requireEnv } from "./lib/env.js";
import { getProductStatuses } from "./lib/get-product-status.js";

const secretKey = requireEnv("STRIPE_KEY");
const siteUrl = requireEnv("SITE_URL");
const stripe = createStripeClient(secretKey);

const standardShippingRate = requireEnv("STRIPE_SHIPPING_RATE_STANDARD");
const freeShippingRate = requireEnv("STRIPE_SHIPPING_RATE_FREE");
const FREE_SHIPPING_THRESHOLD = 7500;

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { items } = JSON.parse(event.body || "{}");

    if (!Array.isArray(items) || items.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "No items provided", skipped: [] }),
      };
    }

    const sanitizedItems = items.map((item, index) => {
      const productId =
        typeof item?.productId === "string" ? item.productId.trim() : "";
      if (!productId.startsWith("prod_")) {
        return { invalid: true, productId, index };
      }
      const quantity = Math.max(
        1,
        Math.min(Math.round(Number(item?.quantity)) || 1, 10),
      );
      return { productId, quantity };
    });

    const statusMap = await getProductStatuses(
      stripe,
      sanitizedItems.filter((item) => !item.invalid).map((item) => item.productId),
    );

    const checked = sanitizedItems.map((item) => ({
      item,
      status: item.invalid
        ? { state: "not_found" }
        : statusMap[item.productId] || { state: "not_found" },
    }));

    const available = [];
    const skipped = [];
    for (const { item, status } of checked) {
      if (status.state === "available" && status.id) {
        available.push({
          ...item,
          priceId: status.id,
          amount: status.amount || 0,
        });
      } else {
        skipped.push({
          productId: item.productId || null,
          state: status.state || "not_found",
        });
      }
    }

    if (available.length === 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "No available items to checkout",
          skipped,
        }),
      };
    }

    const subtotal = available.reduce(
      (sum, item) => sum + Math.round((item.amount || 0) * 100) * item.quantity,
      0,
    );

    const shippingOptions = [
      {
        shipping_rate:
          subtotal >= FREE_SHIPPING_THRESHOLD
            ? freeShippingRate
            : standardShippingRate,
      },
    ];

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: available.map((item) => ({
        price: item.priceId,
        quantity: item.quantity,
      })),
      mode: "payment",
      automatic_tax: { enabled: true },
      shipping_options: shippingOptions,
      success_url: `${siteUrl}/status/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/status/cancel`,
      shipping_address_collection: {
        allowed_countries: ["US"],
      },
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        url: session.url,
        skipped,
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
