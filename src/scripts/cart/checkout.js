/*
This is the checkout script for the embedded Stripe Checkout.
It initializes the Stripe Checkout with the provided public key,
fetches the cart items, and creates a checkout session.

It handles errors gracefully and provides user feedback.
It also includes a function to fetch Stripe price details.
It is designed to be used in a web application where users can add items to their cart
and proceed to checkout.

It is important to ensure that the cart is not empty before proceeding to checkout.
It is also important to handle errors gracefully and provide user feedback.
It is crucial to never use innerHTML for user inputs to prevent XSS attacks.
*/

import { loadCart } from "../cart/cart-storage.js";
export async function initializeCheckout(stripePublicKey) {
  if (!stripePublicKey) {
    console.error("Stripe public key is required");
    return;
  }

  const stripe = Stripe(stripePublicKey);

  try {
    const cartItems = loadCart();
    console.log("Cart items:", cartItems);

    if (!cartItems.length) {
      alert("Your cart is empty. Please add items before checking out.");
      window.location.href = "/cart";
      return;
    }

    const response = await fetch(
      "/.netlify/functions/create-checkout-session",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: cartItems.map((item) => ({
            priceId: item.priceId,
            quantity: item.quantity,
          })),
        }),
      },
    );

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const { clientSecret } = await response.json();

    if (!clientSecret) {
      throw new Error("No client secret received");
    }

    const checkout = await stripe.initEmbeddedCheckout({
      clientSecret,
    });

    // Mount Checkout
    checkout.mount("#checkout-container");
  } catch (error) {
    console.error("Checkout Error:", error);
    const errorContainer = document.getElementById("checkout-container");

    // More specific error messages
    const errorMessage =
      error.message === "Network response was not ok"
        ? "Unable to connect to checkout. Please check your internet connection."
        : "There was a problem loading the checkout form. Please try again.";

    // NEVER USE INNERHTML FOR USER INPUTS!!!!
    errorContainer.innerHTML = `<p class="error">${errorMessage}</p>`;

    // Optional: Add a retry button
    // NEVER USE INNERHTML FOR USER INPUTS!!!!

    errorContainer.innerHTML += `
      <button class="button button-secondary" onclick="window.location.reload()">
        Try Again
      </button>
    `;
  }
}

export async function getStripePrice(priceId) {
  try {
    const response = await fetch("/.netlify/functions/get-stripe-price", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ priceId }),
    });

    if (!response.ok) throw new Error("Failed to fetch price");
    return await response.json();
  } catch (error) {
    console.error("Error fetching price:", error);
    throw error;
  }
}
