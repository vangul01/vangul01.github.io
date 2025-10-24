export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ message: "Method Not Allowed" }),
        headers: { "Content-Type": "application/json" },
      };
    }

    const { email } = JSON.parse(event.body);

    if (!email || typeof email !== "string") {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Invalid email address." }),
        headers: { "Content-Type": "application/json" },
      };
    }

    const body = {
      email,
      // includeListIds: `${process.env.PUBLIC_NEWSLETTER_LIST_IDS}`, // "test emails" list ID
      includeListIds: [8],
      templateId: 1, // default double opt-in template ID
      redirectionUrl: `${process.env.PUBLIC_SITE_URL}/success`, // Replace with your actual redirection URL
    };

    // Call Brevo API to add contact
    const response = await fetch(
      "https://api.brevo.com/v3/contacts/doubleOptinConfirmation",
      {
        method: "POST",
        headers: {
          "api-key": process.env.SECRET_BREVO_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const data = await response.json();
    console.log("Brevo response:", data);

    if (response.ok) {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "Subscription successful!" }),
        headers: { "Content-Type": "application/json" },
      };
    } else {
      return {
        statusCode: response.status,
        body: JSON.stringify({
          message: "Subscription failed.",
        }),
        headers: { "Content-Type": "application/json" },
      };
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Subscription failed.",
      }),
      headers: { "Content-Type": "application/json" },
    };
  }
}
