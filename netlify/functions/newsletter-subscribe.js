const fetch = require("node-fetch");

exports.handler = async (event) => {
  const { email } = JSON.parse(event.body);

  // Call Brevo API to add contact
  const response = await fetch("https://api.brevo.com/v3/contacts", {
    method: "POST",
    headers: {
      "api-key": process.env.SECRET_BREVO_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email }),
  });

  if (response.ok) {
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Subscription successful!" }),
    };
  } else {
    const error = await response.json();
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: error.message || "Subscription failed.",
      }),
    };
  }
};
