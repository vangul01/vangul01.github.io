import { useState } from "react";
import "../styles/global.css";

export default function NewsletterIsland() {
  const [message, setMessage] = useState("");
  // const [color, setColor] = useState("black");

  async function handleSubmit(e) {
    e.preventDefault();
    const email = e.target.email.value;
    setMessage("Subscribing...");
    // setColor("black");
    try {
      const response = await fetch("/.netlify/functions/newsletter-subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to subscribe");
      setMessage(data.message || "Subscription successful!");
      // setColor("green");
      e.target.reset();
    } catch (error) {
      setMessage(error.message || "Subscription failed. Please try again.");
      // setColor("red");
    }
  }

  return (
    <form className="newsletter-form" onSubmit={handleSubmit}>
      <input type="hidden" name="form-name" value="newsletter" />
      <p className="hidden">
        <label>
          Don't fill this out if you're human: <input name="bot-field" />
        </label>
      </p>

      <input
        type="email"
        name="email"
        placeholder="Enter your email"
        className="newsletter-input"
        aria-label="Email for newsletter"
        autoComplete="email"
        required
      />
      <br />
      <button
        type="submit"
        className="button button-primary"
        aria-label="Subscribe to newsletter"
      >
        Subscribe
      </button>
      <div>{message}</div>
    </form>
  );
}
