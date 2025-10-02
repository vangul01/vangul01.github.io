import { loadCart } from "../cart/cart-storage.js";

export async function handleCheckout() {
  try {
    const cartItems = loadCart();
    const siteUrl = import.meta.env.PUBLIC_SITE_URL || "http://localhost:8888";

    if (!cartItems.length) {
      alert("Your cart is empty. Please add items before checking out.");
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
      throw new Error("Network response was not ok:", error);
    }

    const { url } = await response.json();
    // Redirect to Stripe Checkout
    window.location.href = url;
  } catch (error) {
    console.error("Checkout error:", error);
    alert("There was a problem starting checkout. Please try again.");
  }
}

export async function getStripePrice(priceId) {
  try {
    const response = await fetch("/.netlify/functions/get-stripe-prices", {
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
