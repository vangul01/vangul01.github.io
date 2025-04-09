import { stripe } from "../../src/lib/stripe.js";

export async function handler(event) {
  try {
    // Parse the request body to get the items array
    const { items } = JSON.parse(event.body);
    console.log("Items received:", items);

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
    });

    console.log("Stripe Checkout session created:", session);
    console.log(
      "return_url:",
      `${process.env.PUBLIC_SITE_URL}/return?session_id={CHECKOUT_SESSION_ID}`,
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        sessionId: session.id,
        publishableKey: process.env.PUBLIC_STRIPE_KEY,
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
