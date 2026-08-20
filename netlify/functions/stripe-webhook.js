import "dotenv/config";

import Stripe from "stripe";

const secretKey = process.env.SECRET_STRIPE_KEY;
const webhookSecret = process.env.SECRET_STRIPE_WEBHOOK_SECRET;
const brevoKey = process.env.SECRET_BREVO_API_KEY;
const adminEmail = process.env.BREVO_NOTIFICATION_EMAIL || "contact@vangular.com";

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

      try {
        const lineItems = await stripe.checkout.sessions.listLineItems(
          session.id,
        );

        if (brevoKey) {
          await sendOrderNotification(session, lineItems.data);
        } else {
          console.log(
            "No Brevo API key set — skipping email notification.",
          );
        }
      } catch (err) {
        console.error("Failed to process completed session:", err);
      }
      break;
    }

    case "checkout.session.expired": {
      console.log("Checkout session expired:", stripeEvent.data.object.id);
      break;
    }

    case "payment_intent.succeeded": {
      console.log("Payment succeeded:", stripeEvent.data.object.id);
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

async function sendOrderNotification(session, items) {
  const { customer_details, shipping_details, payment_status, amount_total } =
    session;

  const itemsHtml = items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px;border-bottom:1px solid #ddd;">${item.description || "Item"}</td>
          <td style="padding:8px;border-bottom:1px solid #ddd;text-align:center;">${item.quantity}</td>
          <td style="padding:8px;border-bottom:1px solid #ddd;text-align:right;">$${((item.amount_total || 0) / 100).toFixed(2)}</td>
        </tr>`,
    )
    .join("");

  const total = amount_total ? `$${(amount_total / 100).toFixed(2)}` : "N/A";

  const name = customer_details?.name || "Not provided";
  const email = customer_details?.email || "Not provided";
  const address = shipping_details?.address
    ? `${shipping_details.address.line1 || ""}, ${shipping_details.address.city || ""}, ${shipping_details.address.state || ""} ${shipping_details.address.postal_code || ""}`
    : "Not provided";

  const html = `
    <h2>New Order Received!</h2>
    <p><strong>Payment Status:</strong> ${payment_status}</p>
    <p><strong>Total:</strong> ${total}</p>

    <h3>Customer</h3>
    <p><strong>Name:</strong> ${name}</p>
    <p><strong>Email:</strong> ${email}</p>

    <h3>Shipping Address</h3>
    <p>${address}</p>

    <h3>Items</h3>
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr style="background:#f5f5f5;">
          <th style="padding:8px;text-align:left;">Item</th>
          <th style="padding:8px;text-align:center;">Qty</th>
          <th style="padding:8px;text-align:right;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>
  `;

  const emailPayload = {
    sender: { name: "Vangular Orders", email: adminEmail },
    to: [{ email: adminEmail }],
    subject: `New Order — ${total} from ${name}`,
    htmlContent: html,
  };

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": brevoKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(emailPayload),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Failed to send order notification:", error);
  } else {
    console.log("Order notification sent to", adminEmail);
  }
}
