import { loadCart } from "../cart/cart-storage.js";

export async function handleCheckout(itemsOverride) {
  try {
    const cartItems = Array.isArray(itemsOverride) ? itemsOverride : loadCart();

    if (!cartItems.length) {
      alert("Your cart is empty. Please add items before checking out.");
      return { ok: false };
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
            productId: item.productId,
            quantity: item.quantity,
          })),
        }),
      },
    );

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (data?.skipped?.length) {
        alert(
          "Some items in your cart are no longer available. Please review your cart.",
        );
      }
      throw new Error(data?.error || `Network response was not ok: ${response.status}`);
    }

    if (data?.skipped?.length) {
      console.warn("Skipped unavailable items at checkout:", data.skipped);
    }

    if (data?.url) {
      window.location.href = data.url;
    }
    return { ok: true, ...data };
  } catch (error) {
    console.error("Checkout error:", error);
    alert("There was a problem starting checkout. Please try again.");
    return { ok: false, error: error.message };
  }
}
