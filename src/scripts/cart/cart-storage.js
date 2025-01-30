// Handle cart storage operations in localStorage
// This is a separate file because it's used in multiple files
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
