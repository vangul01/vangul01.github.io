import "dotenv/config";

import { sendBrevoEmail } from "./lib/brevo.js";

/*
Logic:
- Contact form submits to this function
- Send autoresponse email via Brevo API
*/

export async function handler(event) {
  try {
    const { firstName, lastName, email, message } = JSON.parse(event.body);

    if (!email || typeof email !== "string") {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Invalid email address." }),
        headers: { "Content-Type": "application/json" },
      };
    }

    const data = await sendBrevoEmail({
      to: [{ email }],
      templateId: Number(process.env.BREVO_CONTACT_AUTORESPONSE_TEMPLATE_ID),
      params: {
        FIRST_NAME: firstName || "",
        LAST_NAME: lastName || "",
        MESSAGE: message || "",
      },
    });

    console.log("Brevo email sent successfully:", data);
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Thanks for contacting us! We'll get back to you soon.",
      }),
    };
  } catch (error) {
    console.error("Brevo error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Message failed to send. Please try again.",
      }),
    };
  }
}