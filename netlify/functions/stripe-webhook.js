import Stripe from "stripe";

const secretKey = process.env.SECRET_STRIPE_KEY;
const webhookSecret = process.env.SECRET_STRIPE_WEBHOOK_SECRET;

if (!secretKey) {
  throw new Error("Missing Stripe secret key");
}
if (!webhookSecret) {
  throw new Error("Missing Stripe webhook signing secret");
}

const stripe = new Stripe(secretKey, {
  apiVersion: "2025-02-24.acacia",
});

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const sig = event.headers["stripe-signature"];

  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      webhookSecret,
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  switch (stripeEvent.type) {
    case "checkout.session.completed": {
      const session = stripeEvent.data.object;
      console.log("Checkout session completed:", session.id);
      console.log("Customer email:", session.customer_details?.email);
      console.log("Payment status:", session.payment_status);
      console.log("Shipping details:", session.shipping_details);
      console.log("Line items URL:", session.url);
      break;
    }

    case "checkout.session.expired": {
      const expired = stripeEvent.data.object;
      console.log("Checkout session expired:", expired.id);
      break;
    }

    case "payment_intent.succeeded": {
      const paymentIntent = stripeEvent.data.object;
      console.log("Payment succeeded:", paymentIntent.id);
      break;
    }

    case "payment_intent.payment_failed": {
      const failed = stripeEvent.data.object;
      console.error("Payment failed:", failed.id, failed.last_payment_error);
      break;
    }

    default:
      console.log(`Unhandled event type: ${stripeEvent.type}`);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ received: true }),
  };
}
