import fetch from "node-fetch";

export async function handler(event) {
  try {
    const { firstName, lastName, email, message } = JSON.parse(event.body);

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": process.env.BREVO_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: "Vangular", email: "contact@vangular.com" },
        to: [{ email, name }],
        templateId: 6, // <-- replace this with your Brevo template ID
        params: {
          // optional dynamic variables from your template
          FIRST_NAME: firstName,
          LAST_NAME: lastName,
          MESSAGE: message,
        },
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Brevo API error: ${text}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Autoresponse sent successfully!" }),
    };
  } catch (error) {
    console.error("Error sending autoresponse:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to send autoresponse." }),
    };
  }
}
