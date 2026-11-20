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

import { MAX_QUANTITY, MIN_QUANTITY } from "../lib/commerce-config";
import { updateCartCount } from "./cart/cart.js";
import { addToCart } from "./cart/cart-storage.js";
import { initNav } from "./nav.js";
import { initContactForm, initNewsletterForm } from "./form-submission.js";
import { initProductPage } from "./product.js";
import { initCarousels } from "./carousel.js";
import { initShopPage } from "./shop.js";
import "./image-handling.js";

function initStatusSuccess() {
  if (
    window.location.pathname.includes("/status/success") &&
    window.location.search.includes("session_id")
  ) {
    localStorage.removeItem("cartItems");
  }
}

function initOfflineRetry() {
  const retryButton = document.getElementById("retry-offline");
  retryButton?.addEventListener("click", () => location.reload());
}

if (typeof document !== "undefined") {
  document.addEventListener("DOMContentLoaded", () => {
    // Initialize global features
    initNav();

    // Initialize forms
    initNewsletterForm();
    initContactForm();

    // Initialize cart UI
    updateCartCount();

    initProductPage();
    initCarousels();
    initShopPage();
    initStatusSuccess();
    initOfflineRetry();

    document.querySelectorAll("#add-to-cart").forEach((button) => {
      button.addEventListener("click", function () {
        const price = parseFloat(this.dataset.price);

        if (!price || price <= 0 || this.disabled) {
          console.error("Cannot add to cart: price not available");
          return;
        }

        const quantityInput = document.querySelector("[data-quantity-input]");
        const requested =
          Math.round(Number(quantityInput?.value)) || MIN_QUANTITY;
        const quantity = Math.max(
          MIN_QUANTITY,
          Math.min(requested, MAX_QUANTITY),
        );

        const product = {
          productId: this.dataset.productId, // For Stripe Checkout
          name: this.dataset.name,
          price: price,
          image: this.dataset.image,
          quantity,
          productUrl: this.dataset.productUrl,
        };

        addToCart(product);

        const label = this.querySelector(".button-label");
        const feedback = document.querySelector("[data-product-feedback]");
        if (label) label.textContent = "Item Added!";
        if (feedback) feedback.textContent = `${quantity} added to cart.`;
        setTimeout(() => {
          if (label) label.textContent = "Add to Cart";
        }, 1000);
      });
    });
  });

  // Register service worker only on the production domain so testing
  // deploys always load the newest assets.
  const isProductionHost =
    location.hostname === "vangular.com" ||
    location.hostname === "www.vangular.com";

  if ("serviceWorker" in navigator && isProductionHost) {
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
