import { loadCart } from "./cart/cart-storage.js";
export async function initializeCheckout(stripePublicKey) {
  const stripe = Stripe(stripePublicKey);

  document.addEventListener("DOMContentLoaded", async () => {
    try {
      // Load cart items from localStorage
      const cartItems = loadCart();
      console.log("Cart items from localStorage:", cartItems);

      // If cartItems is empty, show an error
      if (!cartItems.length) {
        console.error(
          "Cart is empty or invalid. Please add items to the cart.",
        );
        alert("Your cart is empty. Please add items before checking out.");
      }

      // Prepare items for Stripe Checkout
      const stripeItems = cartItems.map((item) => ({
        price: item.priceId,
        quantity: item.quantity,
      }));
      console.log("Stripe items:", stripeItems);

      // Fetch Checkout Session and retrieve the client secret
      const fetchClientSecret = async () => {
        const response = await fetch(
          "/.netlify/functions/create-checkout-session",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: stripeItems }),
          },
        );

        if (!response.ok) {
          throw new Error("Failed to fetch client secret");
        }

        const { clientSecret } = await response.json();
        return clientSecret;
      };

      // Initialize Embedded Checkout
      const checkout = await stripe.initEmbeddedCheckout({
        fetchClientSecret,
      });

      // Mount Checkout to the container
      checkout.mount("#checkout-container");
    } catch (error) {
      console.error("Error initializing Stripe Checkout:", error);
      alert("There was an issue loading the payment form. Please try again.");
    }
  });
}
