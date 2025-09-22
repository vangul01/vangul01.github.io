import { stripe } from "../../src/lib/stripe.js";

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

    // Create a Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      //   ui_mode: "embedded",
      payment_method_types: ["card"],
      line_items: items.map((item) => ({
        price: item.priceId,
        quantity: item.quantity,
      })),
      mode: "payment",
      success_url: `${process.env.PUBLIC_SITE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.PUBLIC_SITE_URL}/cancel`,
      shipping_address_collection: {
        allowed_countries: ["US"],
      },
    });

    return {
      statusCode: 200,
      body: JSON.stringify({
        url: session.url, // Return the redirect URL
      }),
      //   session.redirect(303, session.url);
    };
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
}
