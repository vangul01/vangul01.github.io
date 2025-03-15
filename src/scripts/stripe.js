import { loadCart } from "./cart/cart-storage.js";

export async function proceedToPayment() {
  const stripe = Stripe(import.meta.env.PUBLIC_PUBLISHABLE_KEY);
  const cart = loadCart();

  if (cart.length === 0) {
    alert("Your cart is empty!");
    return;
  }

  try {
    // Redirect to Stripe Checkout
    const { error } = await stripe.redirectToCheckout({
      lineItems: cart.map((item) => ({
        price: item.priceId, // Replace with your Stripe Price ID
        quantity: item.quantity,
      })),
      mode: "payment",
      successUrl: "/success", // Local testing URL,
      cancelUrl: "/cancel", // Local testing URL,
    });

    if (error) {
      console.error("Stripe Checkout error:", error);
      alert("Failed to proceed to checkout.");
    }
  } catch (err) {
    console.error("Error:", err);
    alert("An error occurred while processing your payment.");
  }
}
