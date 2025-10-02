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

    // Call Brevo API to add contact
    const response = await fetch("https://api.brevo.com/v3/contacts", {
      method: "POST",
      headers: {
        "api-key": process.env.SECRET_BREVO_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

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
          message: data.message || "Subscription failed.",
        }),
        headers: { "Content-Type": "application/json" },
      };
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: error.message || "Subscription failed.",
      }),
      headers: { "Content-Type": "application/json" },
    };
  }
}
