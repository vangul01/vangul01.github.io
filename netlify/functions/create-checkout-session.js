import { stripe } from "../../src/lib/stripe.js";

export async function handler(event) {
  try {
    // Parse the request body to get the items array
    const { items } = JSON.parse(event.body);
    console.log("Items received:", items);

    if (!Array.isArray(items) || items.length === 0) {
      throw new Error("No items provided");
    }

    // Create a Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      ui_mode: "embedded",
      payment_method_types: ["card"],
      line_items: items.map((item) => ({
        price: item.priceId,
        quantity: item.quantity,
      })),
      mode: "payment",
      return_url: `${process.env.PUBLIC_SITE_URL}/return?session_id={CHECKOUT_SESSION_ID}`,
      shipping_address_collection: {
        allowed_countries: ["US"],
      },
    });

    console.log(
      "return_url:",
      `${process.env.PUBLIC_SITE_URL}/return?session_id={CHECKOUT_SESSION_ID}`,
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        clientSecret: session.client_secret,
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
