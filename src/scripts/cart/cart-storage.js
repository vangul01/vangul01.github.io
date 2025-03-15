// Handle cart storage operations in localStorage
export function loadCart() {
  const savedCart = localStorage.getItem("cart");
  return savedCart ? JSON.parse(savedCart) : [];
}

export function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

export function clearStoredCart() {
  localStorage.removeItem("cart");
}
