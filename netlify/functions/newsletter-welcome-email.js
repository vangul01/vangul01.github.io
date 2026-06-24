import "dotenv/config";

export async function handler(event) {
  try {
    // Get email from query parameter
    const { email, hash } = event.queryStringParameters;

    if (!email || !hash) {
      return {
        statusCode: 400,
        body: "Missing email or verification hash",
      };
    }

    // 1. Update contact attributes in Brevo
    const updateResponse = await fetch(
      `https://api.brevo.com/v3/contacts/${encodeURIComponent(email)}`,
      {
        method: "PUT",
        headers: {
          "api-key": process.env.SECRET_BREVO_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          attributes: {
            "DOUBLE_OPT-IN": "1",
          },
          listIds: [Number(process.env.BREVO_CONFIRMED_SUBSCRIBERS_LIST_ID)],
          unlinkListIds: [Number(process.env.BREVO_PENDING_SUBSCRIBERS_LIST_ID)],
        }),
      },
    );

    if (!updateResponse.ok) {
      throw new Error("Failed to update contact");
    }

    // 2. Trigger welcome email
    const welcomeResponse = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "api-key": process.env.SECRET_BREVO_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        templateId: Number(process.env.BREVO_WELCOME_EMAIL_TEMPLATE_ID),
        to: [{ email }],
      }),
    });

    if (!welcomeResponse.ok) {
      console.error("Failed to send welcome email");
    }

    // 3. Redirect to success page
    return {
      statusCode: 302,
      headers: {
        Location: "/success-newsletter", // Your success page
      },
    };
  } catch (error) {
    console.error("Confirmation error:", error);
    return {
      statusCode: 302,
      headers: {
        Location: "/error-newsletter", // Your error page
      },
    };
  }
}
