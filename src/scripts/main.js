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

import { updateUI, updateCartCount } from "./cart/cart.js";
import { clearCart, addToCart } from "./cart/cart-storage.js";
import { initNav } from "./nav.js";
import { initTheme } from "./color-theme.js";

// import { loadCart, saveCart, clearStoredCart } from "./cart/cart-storage.js";

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    // Initialize global features
    initTheme();
    initNav();

    // Initialize cart UI
    updateUI();
    updateCartCount();

    // EDIT THIS!
    // Add-to cart-button data send. Needs product data from stripe to work
    document.querySelectorAll("#add-to-cart").forEach((button) => {
      button.addEventListener("click", function () {
        const product = {
          priceId: this.dataset.priceId, // For Stripe Checkout
          name: this.dataset.name,
          price: parseFloat(this.dataset.price),
          image: this.dataset.image,
          quantity: parseInt(this.dataset.quantity) || 1,
          productUrl: this.dataset.productUrl,
        };

        addToCart(product);

        // Visual feedback
        this.textContent = "Added!";
        setTimeout(() => (this.textContent = "Add to Cart"), 1000);
      });
    });

    // // Theme toggle
    // const themeToggle = document.getElementById("theme-toggle");
    // if (themeToggle) {
    //   themeToggle.addEventListener("click", () => {
    //     const current =
    //       localStorage.getItem("theme") === "dark" ? "light" : "dark";
    //     setTheme(current);
    //   });
    // }

    // // On page load, set theme to user's saved preference, or system preference if not set
    // const savedTheme = localStorage.getItem("theme");
    // if (savedTheme) {
    //   setTheme(savedTheme);
    // } else {
    //   const prefersDark = window.matchMedia(
    //     "(prefers-color-scheme: dark)"
    //   ).matches;
    //   setTheme(prefersDark ? "dark" : "light");
    // }

    // document.getElementById("theme-toggle").addEventListener("click", () => {
    //   const current =
    //     localStorage.getItem("theme") === "dark" ? "light" : "dark";
    //   setTheme(current);
    // });
  });

  // Register service worker
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then(() => {
          console.log("Service Worker registered!");
        })
        .catch((error) => {
          console.log("Service Worker registration failed:", error);
        });
    });
  }
}
