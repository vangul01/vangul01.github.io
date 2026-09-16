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

///////////////////////////// Cart operations
// Existing carts saved before the productId switch still carry priceId; fall
// back to it so old cart items keep working through migration.
function getItemKey(item) {
  return item.productId || item.priceId;
}

export function addToCart(product) {
  const cart = loadCart();
  const existingProduct = cart.find(
    (item) => getItemKey(item) === getItemKey(product),
  );

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
