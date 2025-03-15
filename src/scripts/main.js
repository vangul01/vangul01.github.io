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

import {
  addToCart,
  clearCart,
  updateUI,
  updateCartCount,
} from "./cart/cart.js";
import { loadCart } from "./cart/cart-storage.js";
import { initNav } from "./nav.js";
import { initContactForm } from "./contact-form.js";

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    // Initialize global features
    initNav();
    initContactForm();

    // Initialize cart UI
    updateUI();
    updateCartCount();

    // Clear cart button
    document.querySelector("#clear-cart")?.addEventListener("click", () => {
      clearCart();
      console.log("Cart cleared successfully");
    });

    // Add to cart buttons
    document.querySelectorAll("#add-to-cart").forEach((button) => {
      button.addEventListener("click", function () {
        const product = {
          id: this.dataset.id,
          name: this.dataset.name,
          price: parseFloat(this.dataset.price),
        };

        addToCart(product);

        // Visual feedback
        this.textContent = "Added!";
        setTimeout(() => (this.textContent = "Add to Cart"), 1000);
      });
    });

    // Proceed to payment button
    document
      .querySelector("#proceed-to-payment")
      ?.addEventListener("click", () => {
        const cart = loadCart();
        if (cart.length === 0) {
          alert("Your cart is empty!");
          return;
        }

        console.log("Proceeding to payment with cart:", cart);
      });
  });
}
