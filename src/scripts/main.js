/*
Listing out functionality needed:
Hamburger Menu
    - When screensize is adjusted, hamburger menu
Contact Form
    -
Update Year for copyright
    - All set :) Done in Footer.astro
Modal Contact form when link is clicked
    -
Cart Items
    - when i click an add-to-cart button or remove an item I want the cart icon to update
    - when I clear all items on checkout page I want cart to clear too
    - when i refresh the page I want cart items to remain
    - when i update a quantity, the cart icon updates
Checkout page
    - When I try to checkout on empty cart theres an alert
    - when i clear all items the checkout items update
    - when i proceed to payment the checkout items remain
    - when i update a quantity, the quantity updates
    - when i refresh the page the correct quantity remains

*/

import { loadCart, clearStoredCart } from "./cart/cart-storage.js";
import { initNav } from "./nav.js";
import { createCartUI } from "./cart/cart-ui.js";
import { initCartCount } from "./cart/cart-count.js";
import { initAddToCart } from "./cart/add-to-cart.js";
import { initContactForm } from "./contact-form.js";

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    // Preload cart data
    const cart = loadCart();

    // Initialize cart count UI
    const { updateCartCount } = initCartCount();
    updateCartCount(cart); // Update the cart count immediately

    // Initialize global features
    initNav();
    initAddToCart();
    initContactForm();

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
