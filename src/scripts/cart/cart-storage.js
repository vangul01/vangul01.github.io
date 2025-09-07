// Handle cart storage operations in localStorage
export function loadCart() {
  const savedCart = localStorage.getItem("cartItems");
  return savedCart ? JSON.parse(savedCart) : [];
}

export function saveCart(cart) {
  localStorage.setItem("cartItems", JSON.stringify(cart));
}

export function clearStoredCart() {
  localStorage.removeItem("cartItems");
}

// I did not check this logic
export function updateCartCount(cart) {
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  document.querySelector("#cart-count").textContent = cartCount;
}
