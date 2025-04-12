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
