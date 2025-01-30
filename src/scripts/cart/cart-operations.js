// Handles cart operations
// This is a separate file because it's used in multiple files
import { saveCart } from "./cart-storage.js";

export function addToCart(cart, product) {
  const existingProduct = cart.find((item) => item.id === product.id);

  if (existingProduct) {
    existingProduct.quantity += 1;
  } else {
    cart.push({
      ...product,
      quantity: 1,
    });
  }

  saveCart(cart);
  return [...cart];
}

export function removeFromCart(cart, productId) {
  const newCart = cart.filter((item) => item.id !== productId);
  saveCart(newCart);
  return newCart;
}

export function updateQuantity(cart, productId, newQuantity) {
  if (newQuantity <= 0) {
    alert("Choose a quantity greater than 0");
    return cart;
  }

  const newCart = cart.map((item) =>
    item.id === productId ? { ...item, quantity: newQuantity } : item
  );

  saveCart(newCart);
  return newCart;
}

export function calculateTotals(cart) {
  return cart.reduce(
    (totals, item) => ({
      price: totals.price + item.price * item.quantity,
      quantity: totals.quantity + item.quantity,
    }),
    { price: 0, quantity: 0 }
  );
}
