import { loadCart } from "../cart/cart-storage.js";

export async function handleCheckout() {
  try {
    const cartItems = loadCart();

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
            productId: item.productId || item.priceId,
            quantity: item.quantity,
          })),
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.status}`);
    }

    const { url } = await response.json();
    // Redirect to Stripe Checkout
    window.location.href = url;
  } catch (error) {
    console.error("Checkout error:", error);
    alert("There was a problem starting checkout. Please try again.");
  }
}
