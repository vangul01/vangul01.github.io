import "dotenv/config";

import Stripe from "stripe";

const secretKey = process.env.SECRET_STRIPE_KEY;
const webhookSecret = process.env.SECRET_STRIPE_WEBHOOK_SECRET;
const brevoKey = process.env.SECRET_BREVO_API_KEY;
const adminEmail =
  process.env.BREVO_NOTIFICATION_EMAIL || "contact@vangular.com";
const brevoSenderEmail =
  process.env.BREVO_SENDER_EMAIL ||
  process.env.BREVO_NOTIFICATION_EMAIL ||
  "contact@vangular.com";

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

  // Netlify base64-encodes the request body by default. Stripe's signature
  // must be verified against the RAW UTF-8 request payload, so decode before
  // verification. See: https://answers.netlify.com/t/stripe-webhook-signature/53603
  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body, "base64").toString("utf-8")
    : event.body;

  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      rawBody,
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
          // Notify the store owner so fulfillment can begin
          await sendOrderNotification(session, lineItems.data);
          // Send the buyer a confirmation that their order was received
          await sendOrderConfirmation(session, lineItems.data);
        } else {
          console.log(
            "No Brevo API key set — skipping email notifications.",
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

function buildOrderHtml({ title, intro, session, items }) {
  const { customer_details, shipping_details, amount_total } = session;

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

  return {
    itemsHtml,
    total,
    html: `
    <h2>${title}</h2>
    <p>${intro}</p>

    <p><strong>Order Total:</strong> ${total}</p>

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
  `,
  };
}

async function sendOrderNotification(session, items) {
  const { payment_status } = session;
  const { html, total } = buildOrderHtml({
    title: "New Order Received!",
    intro:
      "A new purchase has been made on your store. Begin order fulfillment.",
    session,
    items,
  });

  const emailPayload = {
    sender: { name: "Vangular Orders", email: brevoSenderEmail },
    to: [{ email: adminEmail }],
    subject: `New Order — ${total}${session.customer_details?.name ? ` from ${session.customer_details.name}` : ""}`,
    htmlContent: html,
  };

  await sendBrevo(emailPayload, `Order notification (${payment_status})`);
}

async function sendOrderConfirmation(session, items) {
  const buyerEmail = session.customer_details?.email;
  if (!buyerEmail) {
    console.log("No buyer email — skipping confirmation email.");
    return;
  }

  const { html, total } = buildOrderHtml({
    title: "Order Confirmation — VANGULAR",
    intro:
      "Thank you for your order! Your purchase was received and our team has begun the fulfillment process. We'll send you tracking information once your items ship.",
    session,
    items,
  });

  const emailPayload = {
    sender: { name: "VANGULAR", email: brevoSenderEmail },
    to: [{ email: buyerEmail, name: session.customer_details?.name || undefined }],
    subject: `Your VANGULAR order is confirmed — ${total}`,
    htmlContent: html,
  };

  await sendBrevo(emailPayload, "Buyer order confirmation");
}

async function sendBrevo(emailPayload, label) {
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
    console.error(`Failed to send ${label} email:`, error);
  } else {
    console.log(`${label} email sent to`, emailPayload.to?.[0]?.email);
  }
}
