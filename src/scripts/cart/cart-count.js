// Handles the cart count UI in the navigation
// This is a separate file because it's used in multiple files
import { calculateTotals } from "./cart-operations.js";

export function initCartCount() {
  const cartCountElement = document.querySelector("#cart-count");

  function updateCartCount(cart) {
    if (!cartCountElement) return;
    const { quantity } = calculateTotals(cart);
    cartCountElement.textContent = quantity;
  }

  return { updateCartCount };
}
