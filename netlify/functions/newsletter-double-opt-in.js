import "dotenv/config";

/*
Logic:
1. Validate input
2. Check if the email is already a member of the confirmed newsletter list
3. If not, send the Double Opt-In email via Brevo API. On confirmation,
   Brevo adds the contact directly to the confirmed list.
*/
export async function handler(event) {
  console.log(
    "BREVO_KEY_PREFIX:",
    process.env.SECRET_BREVO_API_KEY?.slice(0, 12),
  );
  console.log("BREVO_KEY_EXISTS:", !!process.env.SECRET_BREVO_API_KEY);
  console.log(
    "BREVO_LIST_ID:",
    process.env.BREVO_CONFIRMED_SUBSCRIBERS_LIST_ID,
  );
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
    const confirmedListId = Number(
      process.env.BREVO_CONFIRMED_SUBSCRIBERS_LIST_ID,
    );

    const checkSubscribed = await fetch(
      `https://api.brevo.com/v3/contacts/${encodeURIComponent(email)}`,
      {
        method: "GET",
        headers: {
          "api-key": process.env.SECRET_BREVO_API_KEY,
        },
      },
    );

    // If contact exists and is already in the confirmed list
    if (checkSubscribed.ok) {
      const contact = await checkSubscribed.json();
      const listIds = contact.listIds || [];

      if (listIds.includes(confirmedListId)) {
        return {
          statusCode: 200,
          body: JSON.stringify({ message: "You're already subscribed!" }),
          headers: { "Content-Type": "application/json" },
        };
      }
    }

    // --- 4. Send Double Opt-In email ---
    const subscribeBody = {
      email,
      includeListIds: [confirmedListId],
      templateId: Number(process.env.BREVO_DEFAULT_DOUBLE_OPT_IN_TEMPLATE_ID),
      redirectionUrl: `${process.env.PUBLIC_SITE_URL}/status/success-newsletter`,
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

    // --- 5. Handle Brevo response ---
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