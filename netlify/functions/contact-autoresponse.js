// import fetch from "node-fetch";

export async function handler(event) {
  try {
    const { firstName, lastName, email, message } = JSON.parse(event.body);

    // Add validation
    if (!email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Email is required" }),
      };
    }

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": process.env.SECRET_BREVO_API_KEY,
        "content-type": "application/json",
      },

      body: JSON.stringify({
        sender: { name: "Vangular TEST!", email: "contact@vangular.com" }, //process.env.BREVO_SENDER_EMAIL
        to: [
          {
            email,
            name: `${firstName} ${lastName}`.trim(),
          },
        ],

        // templateId: parseInt(process.env.BREVO_TEMPLATE_ID), // Get from env var
        templateId: 6, // <-- replace this with your Brevo template ID
        // params: {
        //   // optional dynamic variables from your template
        //   FIRST_NAME: firstName || "",
        //   LAST_NAME: lastName || "",
        //   MESSAGE: message || "",
        // },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Brevo error:", data);
      throw new Error(data.message || "Failed to send email");
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Thanks for your message! Check your email for confirmation.",
      }),
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Failed to send confirmation email." }),
    };
  }
}
