import { loadCart } from "../cart/cart-storage.js";

export async function handleCheckout(itemsOverride) {
  try {
    const cartItems = Array.isArray(itemsOverride) ? itemsOverride : loadCart();

    if (!cartItems.length) {
      return { ok: false, error: "Your cart is empty." };
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
      const isServerError = response.status >= 500;
      return {
        ok: false,
        status: response.status,
        error: isServerError
          ? "Checkout is temporarily unavailable. Please try again in a moment."
          : data?.error ||
            `Checkout failed (${response.status} ${response.statusText})`,
        skipped: data?.skipped || [],
      };
    }

    if (data?.url) {
      window.location.href = data.url;
    }
    return { ok: true, ...data };
  } catch (error) {
    console.error("Checkout error:", error);
    return {
      ok: false,
      error: "There was a problem starting checkout. Please try again.",
    };
  }
}
