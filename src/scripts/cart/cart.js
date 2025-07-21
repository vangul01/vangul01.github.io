import { loadCart, calculateTotals } from "./cart-storage.js";

const elements = {
  cartItemsList: document.getElementById("cart-items-list"),
  totalPrice: document.getElementById("cart-total-price"),
  totalQuantity: document.getElementById("cart-total-quantity"),
  cartIconCount: document.getElementById("cart-icon-count"),
};

// Update the number next to cart icon in header
export function updateCartCount() {
  if (!elements.cartIconCount) return;

  const cart = loadCart();
  const { quantity } = calculateTotals(cart);
  // Don't show 0 in the cart count
  elements.cartIconCount.textContent = quantity || "";
}

// Update cart items and totals in cart.astro UI
export function updateUI() {
  const cart = loadCart();

  if (!elements.cartItemsList) return;
  // Clear and update cart items
  elements.cartItemsList.innerHTML = "";
  cart.forEach((item) => {
    elements.cartItemsList.appendChild(createCartItemElement(item));
  });

  // Update totals
  const totals = calculateTotals(cart);
  if (elements.totalPrice) {
    elements.totalPrice.textContent = `Total Amount: $${totals.price.toFixed(2)}`;
  }
  if (elements.totalQuantity) {
    elements.totalQuantity.textContent = `Items: ${totals.quantity}`;
  }
}

// Listen for cart updates from anywhere
window.addEventListener("cartUpdate", () => {
  updateUI();
  updateCartCount();
});
