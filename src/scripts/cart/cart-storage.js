// Handle cart storage operations in localStorage
export function loadCart() {
  if (typeof window === "undefined") return [];
  const savedCart = localStorage.getItem("cartItems");
  return savedCart ? JSON.parse(savedCart) : [];
}

export function saveCart(cart) {
  localStorage.setItem("cartItems", JSON.stringify(cart));
}

export function clearStoredCart() {
  localStorage.removeItem("cartItems");
}

// Add shared utility functions
export function calculateTotals(cart) {
  return cart.reduce(
    (totals, item) => ({
      price: totals.price + item.price * item.quantity,
      quantity: totals.quantity + item.quantity,
    }),
    { price: 0, quantity: 0 }
  );
}
