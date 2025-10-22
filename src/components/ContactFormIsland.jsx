import { useState } from "react";
import "../styles/global.css";

export default function ContactFormIsland() {
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    const firstName = e.target["contact-first-name"].value;
    const lastName = e.target["contact-last-name"].value;
    const email = e.target["contact-email"].value;
    const message = e.target["contact-message"].value;
    setMessage("Sending Message...");
    try {
      const response = await fetch("/.netlify/functions/contact-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, email, message }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to subscribe");
      setMessage(
        data.message ||
          "Thanks htmlFor contacting us! We'll get back to you soon.",
      );
      e.target.reset();
    } catch (error) {
      setMessage(error.message || "Message failed to send. Please try again.");
      console.log("Contact form error:", error);
    }
  }

  return (
    <form className="contact-form" name="contact" onSubmit={handleSubmit}>
      <input type="hidden" name="form-name" value="contact" />
      <p className="hidden">
        <label>
          Don't fill this out if you're human: <input name="bot-field" />
        </label>
      </p>

      <div className="form-field">
        <input
          type="text"
          id="contact-first-name"
          name="first-name"
          placeholder=" "
          autoComplete="given-name"
          required
        />
        <label htmlFor="contact-first-name">First Name</label>
      </div>

      <div className="form-field">
        <input
          type="text"
          id="contact-last-name"
          name="last-name"
          placeholder=" "
          autoComplete="family-name"
          required
        />
        <label htmlFor="contact-last-name">Last Name</label>
      </div>

      <div className="form-field">
        <input
          className="email"
          type="email"
          id="contact-email"
          name="email"
          placeholder=" "
          autoComplete="email"
          required
        />
        <label htmlFor="contact-email">Email</label>
      </div>

      <div className="form-field">
        <textarea
          id="contact-message"
          name="message"
          placeholder=" "
          rows="5"
          cols="50"
          required
        ></textarea>
        <label htmlFor="contact-message">Message</label>
      </div>

      <button
        type="submit"
        className="button button-primary"
        aria-label="Submit Contact Form"
      >
        Submit
      </button>
      <div>{message}</div>
    </form>
  );
}
