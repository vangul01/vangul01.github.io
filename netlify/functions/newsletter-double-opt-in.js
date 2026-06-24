/*
Logic:
1. Make sure input is valid
2. Check if email is already in Double Opt-In Subscribers list
3. If not, send Double Opt-In email via Brevo API
*/
export async function handler(event) {
  try {
    // --- 1. Method guard ---
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ message: "Method Not Allowed" }),
        headers: { "Content-Type": "application/json" },
      };
    }

    // --- 2. Parse and validate body ---
    let email;
    try {
      const body = JSON.parse(event.body);
      email = body.email;
    } catch (err) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Invalid request body" }),
        headers: { "Content-Type": "application/json" },
      };
    }

    if (!email || typeof email !== "string") {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Invalid email address." }),
        headers: { "Content-Type": "application/json" },
      };
    }

    // --- 3. Check if already subscribed ---
    const checkSubscribed = await fetch(
      `https://api.brevo.com/v3/contacts/${encodeURIComponent(email)}`,
      {
        method: "GET",
        headers: {
          "api-key": process.env.SECRET_BREVO_API_KEY,
        },
      },
    );

    // If contact exists (200) and is already opted in
    if (checkSubscribed.ok) {
      const contact = await checkSubscribed.json();
      const optIn = contact.attributes?.["DOUBLE_OPT-IN"] || "0";

      if (optIn === "1") {
        return {
          statusCode: 200,
          body: JSON.stringify({ message: "You're already subscribed!" }),
          headers: { "Content-Type": "application/json" },
        };
      }
    }

    // --- 3. Send Double Opt-In email ---
    const subscribeBody = {
      email,
      includeListIds: [Number(process.env.BREVO_PENDING_SUBSCRIBERS_LIST_ID)],
      templateId: Number(process.env.BREVO_DEFAULT_DOUBLE_OPT_IN_TEMPLATE_ID),
      redirectionUrl: `${process.env.PUBLIC_SITE_URL}/success-newsletter`,
      //   redirectionUrl: `${process.env.PUBLIC_SITE_URL}/.netlify/functions/newsletter-welcome-email?email={{params.email}}`,
    };

    const response = await fetch(
      "https://api.brevo.com/v3/contacts/doubleOptinConfirmation",
      {
        method: "POST",
        headers: {
          "api-key": process.env.SECRET_BREVO_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(subscribeBody),
      },
    );

    // --- 6. Handle Brevo response ---
    if (response.ok) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          message: "Success! Please check your email to confirm subscription!",
        }),
        headers: { "Content-Type": "application/json" },
      };
    }

    // Handle error from Brevo
    const errorData = await response.text();
    console.error("Brevo error:", errorData);

    return {
      statusCode: response.status,
      body: JSON.stringify({
        message: "Subscription failed. Please try again later.",
      }),
      headers: { "Content-Type": "application/json" },
    };
  } catch (error) {
    console.error("Newsletter subscription error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Internal server error. Please try again later.",
      }),
      headers: { "Content-Type": "application/json" },
    };
  }
}
