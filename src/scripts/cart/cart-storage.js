///////////////////////////// Core storage operations
export function loadCart() {
  if (typeof window === "undefined") return [];
  const savedCart = localStorage.getItem("cartItems");
  return savedCart ? JSON.parse(savedCart) : [];
}

export function saveCart(cart) {
  localStorage.setItem("cartItems", JSON.stringify(cart));
  // Dispatch event for UI updates
  window.dispatchEvent(new CustomEvent("cartUpdate", { detail: cart }));
}

export function clearCart() {
  localStorage.removeItem("cartItems");
  window.dispatchEvent(new CustomEvent("cartUpdate", { detail: [] }));
}

///////////////////////////// Cart operations
export function addToCart(product) {
  const cart = loadCart();
  const existingProduct = cart.find((item) => item.priceId === product.priceId);

  if (existingProduct) {
    existingProduct.quantity += product.quantity || 1;
  } else {
    cart.push({
      ...product,
      quantity: product.quantity || 1,
    });
  }

  saveCart(cart);
  return cart;
}

export function removeFromCart(productId) {
  const cart = loadCart();
  const newCart = cart.filter((item) => item.id !== productId);
  saveCart(newCart);
  return newCart;
}

export function updateQuantity(priceId, delta) {
  const cart = loadCart();
  const item = cart.find((item) => item.priceId === priceId);
  if (item) {
    item.quantity = Math.max(1, item.quantity + delta);
    saveCart(cart);
  }
  return cart;
}

///////////////////////////// Utility functions
export function calculateTotals(cart) {
  return cart.reduce(
    (totals, item) => ({
      price: totals.price + (item.price || 0) * item.quantity,
      quantity: totals.quantity + item.quantity,
    }),
    { price: 0, quantity: 0 }
  );
}
