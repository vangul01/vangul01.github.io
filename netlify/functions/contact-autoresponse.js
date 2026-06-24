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

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        accept: "application/json",
        "api-key": process.env.SECRET_BREVO_API_KEY,
        "content-type": "application/json",
      },

      body: JSON.stringify({
        // sender: { name: "Vangular TEST!", email: "contact@vangular.com" }, //process.env.BREVO_SENDER_EMAIL
        to: [
          {
            email,
            // name: `${firstName} ${lastName}`.trim(),
          },
        ],

        templateId: Number(process.env.BREVO_CONTACT_AUTORESPONSE_TEMPLATE_ID),
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
      console.error("Brevo error (response not ok): ", data);
      throw new Error(
        data.message || "Message failed to send. Please try again.",
      );
    }

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
