import { loadCart, calculateTotals } from "./cart-storage.js";

// Update the number next to cart icon in header
export function updateCartCount() {
  const cartIconCount = document.getElementById("cart-icon-count");
  if (!cartIconCount) return;

  const cart = loadCart();
  const { quantity } = calculateTotals(cart);
  // Don't show 0 in the cart count
  cartIconCount.textContent = quantity || "";
}

// Listen for cart updates from anywhere
window.addEventListener("cartUpdate", updateCartCount);