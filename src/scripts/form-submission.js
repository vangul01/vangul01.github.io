// document.addEventListener("DOMContentLoaded", () => {

// Separate contact form initialization
function initContactForm() {
  // Contact form handler
  const contactForm = document.querySelector("#contact-form");
  const contactMsg = document.querySelector("#contact-submit-message");

  if (contactForm) {
    contactForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      contactMsg.textContent = "Sending message...";

      const formData = new FormData(contactForm);
      const payload = Object.fromEntries(formData.entries());

      try {
        // Send Brevo autoresponse to form submitter
        const response = await fetch(
          "/.netlify/functions/contact-autoresponse",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );

        const json = await response.json();

        if (!response.ok)
          throw new Error(json.message || "Message failed to send");
        contactMsg.textContent =
          json.message ||
          "Thanks for contacting us! We'll get back to you soon.";
        contactForm.reset();
      } catch (error) {
        console.error("Contact form error:", error);
        contactMsg.textContent =
          error.message || "Message failed to send. Please try again.";
      }
    });
  }
}

// Separate newsletter form initialization

export function initNewsletterForm() {
  // Newsletter form handler
  const newsletterForm = document.querySelector("#newsletter-form");
  const newsletterMsg = document.querySelector("#newsletter-submit-message");

  if (!newsletterForm || !newsletterMsg) {
    console.warn("Newsletter form elements not found");
    return;
  }

  if (newsletterForm) {
    newsletterForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      newsletterMsg.textContent = "Subscribing...";

      const email = newsletterForm.email.value;

      try {
        const response = await fetch(
          "/.netlify/functions/newsletter-subscribe",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          }
        );

        const data = await response.json();
        if (!response.ok)
          throw new Error(data.message || "Failed to subscribe");

        newsletterMsg.textContent = data.message || "Subscription successful!";
        newsletterForm.reset();
      } catch (error) {
        newsletterMsg.textContent =
          error.message || "Subscription failed. Please try again.";
      }
    });
  }
}

// Initialize forms when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  initContactForm();
  // initNewsletterForm();
});
