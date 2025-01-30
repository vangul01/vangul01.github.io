import { initContactForm } from "./contact-form.js";
import { initNav } from "./nav.js";
import { updateCopyrightYear } from "./footer.js";
import { loadCart, clearStoredCart } from "./cart/cart-storage.js";
import { createCartUI } from "./cart/cart-ui.js";
import { initAddToCart } from "./cart/add-to-cart.js";
import { initCartCount } from "./cart/cart-count.js";

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    // Initialize global features
    initNav();
    initContactForm();
    updateCopyrightYear();
    initAddToCart();

    // Initialize checkout page features if applicable
    const checkoutContainer = document.getElementById("checkout-container");
    if (checkoutContainer) {
      let cart = loadCart();
      const { updateCartCount } = initCartCount();

      const { updateUI } = createCartUI(cart, (newCart) => {
        cart = newCart;
        updateCartCount(cart);
      });

      // Initial UI update
      updateUI();
      updateCartCount(cart);

      // Clear cart button
      document.querySelector("#clear-cart")?.addEventListener("click", () => {
        cart = [];
        clearStoredCart();
        updateUI();
        updateCartCount(cart);
      });

      // Optional: Add proceed to payment handler
      document
        .querySelector("#proceed-to-payment")
        ?.addEventListener("click", () => {
          if (cart.length === 0) {
            alert("Your cart is empty!");
            return;
          }

          // Add your payment logic here
          console.log("Proceeding to payment with cart:", cart);
        });
    }
  });
}
