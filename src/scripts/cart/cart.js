import { loadCart, saveCart, clearStoredCart } from "./cart-storage.js";

const elements = {
  cartItems: document.getElementById("checkout-cart-items"),
  totalPrice: document.getElementById("checkout-total-price"),
  totalQuantity: document.getElementById("checkout-total-quantity"),
  cartCount: document.getElementById("cart-count"),
};

let cart = loadCart();

function updateCartCount() {
  if (!elements.cartCount) return;
  const { quantity } = calculateTotals();

  //   Don't show 0 in the cart count
  if (quantity === 0) {
    elements.cartCount.textContent = "";
  } else {
    elements.cartCount.textContent = quantity;
  }
}

function updateUI() {
  if (!elements.cartItems) return;

  // Clear and update cart items
  elements.cartItems.innerHTML = "";
  cart.forEach((item) => {
    elements.cartItems.appendChild(createCartItemElement(item));
  });

  // Update totals
  const totals = calculateTotals();
  if (elements.totalPrice) {
    elements.totalPrice.textContent = `Total Amount: $${totals.price.toFixed(2)}`;
  }
  if (elements.totalQuantity) {
    elements.totalQuantity.textContent = `Items: ${totals.quantity}`;
  }
}

function calculateTotals() {
  return cart.reduce(
    (totals, item) => ({
      price: totals.price + item.price * item.quantity,
      quantity: totals.quantity + item.quantity,
    }),
    { price: 0, quantity: 0 },
  );
}

function createCartItemElement(item) {
  const listItem = document.createElement("li");
  listItem.id = `cart-item-${item.id}`;
  listItem.className = "cart-item";
  listItem.textContent = `${item.name} - $${item.price.toFixed(2)} x ${item.quantity}`;
  return listItem;
}

function addToCart(product) {
  const existingProduct = cart.find((item) => item.id === product.id);

  if (existingProduct) {
    existingProduct.quantity += 1;
  } else {
    cart.push({
      ...product,
      priceId: product.priceId,
      quantity: 1,
    });
  }

  saveCart(cart);
  updateUI();
  updateCartCount();
}

function removeFromCart(productId) {
  cart = cart.filter((item) => item.id !== productId);
  saveCart(cart);
  updateUI();
  updateCartCount();
}

function clearCart() {
  cart = [];
  clearStoredCart();
  updateUI();
  updateCartCount();
}

export { addToCart, removeFromCart, clearCart, updateUI, updateCartCount };
