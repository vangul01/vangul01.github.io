// Handles the add to cart button
// This is a separate file because it's used in multiple files
import { loadCart } from "./cart-storage.js";
import { addToCart } from "./cart-operations.js";
import { initCartCount } from "./cart-count.js";

export function initAddToCart() {
  let cart = loadCart();
  const { updateCartCount } = initCartCount();

  document.querySelectorAll("#add-to-cart").forEach((button) => {
    button.addEventListener("click", function () {
      const product = {
        id: this.dataset.id,
        name: this.dataset.name,
        price: parseFloat(this.dataset.price),
      };

      cart = addToCart(cart, product);
      updateCartCount(cart);

      // Visual feedback
      this.textContent = "Added!";
      setTimeout(() => (this.textContent = "Add to Cart"), 1000);
    });
  });

  // Initial cart count
  updateCartCount(cart);
}
