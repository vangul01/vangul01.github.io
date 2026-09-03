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
const orderConfirmationTemplateId = Number(
  process.env.BREVO_ORDER_CONFIRMATION_TEMPLATE_ID,
);
const orderNotificationTemplateId = Number(
  process.env.BREVO_ORDER_NOTIFICATION_TEMPLATE_ID,
);

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

    case "charge.succeeded": {
      const charge = stripeEvent.data.object;
      console.log(
        "Charge succeeded:",
        charge.id,
        "amount ",
        charge.amount ? charge.amount / 100 : charge.amount,
        charge.currency,
      );
      break;
    }

    case "charge.updated": {
      const charge = stripeEvent.data.object;
      console.log(
        "Charge updated:",
        charge.id,
        "status",
        charge.status,
        charge.refunded ? "(refunded)" : "",
      );
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

function buildOrderParams(session, items) {
  const { customer_details, shipping_details, amount_total } = session;

  const total = amount_total ? `$${(amount_total / 100).toFixed(2)}` : "N/A";
  const firstName =
    (customer_details?.name &&
      customer_details.name.split(" ")[0].replace(/[^a-zA-Z0-9 ]/g, "")) ||
    "there";
  const address = shipping_details?.address
    ? [
        shipping_details.address.line1,
        shipping_details.address.city,
        shipping_details.address.state,
        shipping_details.address.postal_code,
      ]
        .filter(Boolean)
        .join(", ") || "Not provided"
    : "Not provided";

  const itemsHtml = items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #eee;color:rgb(55,47,73);">${item.description || "Item"} &times; ${item.quantity ?? 1}</td>
          <td align="right" style="padding:8px 0;border-bottom:1px solid #eee;color:rgb(55,47,73);white-space:nowrap;">$${((item.amount_total || 0) / 100).toFixed(2)}</td>
        </tr>`,
    )
    .join("");

  return {
    ORDER_TOTAL: total,
    ORDER_SUBTOTAL: total,
    CUSTOMER_FIRST_NAME: firstName,
    CUSTOMER_NAME: customer_details?.name || "Not provided",
    CUSTOMER_EMAIL: customer_details?.email || "Not provided",
    SHIPPING_ADDRESS: address,
    SITE_LINK: process.env.PUBLIC_SITE_URL || "https://www.vangular.com",
    CONTACT_LINK: `${process.env.PUBLIC_SITE_URL || "https://www.vangular.com"}/info/contact`,
    ITEMS_HTML: itemsHtml,
  };
}

async function sendOrderNotification(session, items) {
  const { payment_status } = session;
  const total = session.amount_total
    ? `$${(session.amount_total / 100).toFixed(2)}`
    : "N/A";

  const emailPayload = {
    sender: { name: "Vangular Orders", email: brevoSenderEmail },
    to: [{ email: adminEmail }],
    subject: `New Order — ${total}${session.customer_details?.name ? ` from ${session.customer_details.name}` : ""}`,
    templateId: orderNotificationTemplateId,
    params: buildOrderParams(session, items),
  };

  await sendBrevo(emailPayload, `Order notification (${payment_status})`);
}

async function sendOrderConfirmation(session, items) {
  const buyerEmail = session.customer_details?.email;
  if (!buyerEmail) {
    console.log("No buyer email — skipping confirmation email.");
    return;
  }

  const total = session.amount_total
    ? `$${(session.amount_total / 100).toFixed(2)}`
    : "N/A";

  const emailPayload = {
    sender: { name: "VANGULAR", email: brevoSenderEmail },
    to: [{ email: buyerEmail, name: session.customer_details?.name || undefined }],
    subject: `Your VANGULAR order is confirmed — ${total}`,
    templateId: orderConfirmationTemplateId,
    params: buildOrderParams(session, items),
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
