// I want this to be for the cart page only!! cart.astros javaScript file

import { loadCart, saveCart, clearStoredCart } from "./cart-storage.js";

const elements = {
  cartItemsList: document.getElementById("cart-items-list"),
  totalPrice: document.getElementById("cart-total-price"),
  totalQuantity: document.getElementById("cart-total-quantity"),
  cartIconCount: document.getElementById("cart-icon-count"),
};

let cart = loadCart();

// Update the number next to cart icon in header
function updateCartCount() {
  if (!elements.cartIconCount) return;
  const { quantity } = calculateTotals();

  //   Don't show 0 in the cart count
  if (quantity === 0) {
    elements.cartIconCount.textContent = "";
  } else {
    elements.cartIconCount.textContent = quantity;
  }
}

// Update cart items and totals in cart.astro UI
// [{ id: "1", name: "The Butts", price: 150, quantity: 1 }];
function updateUI() {
  if (!elements.cartItemsList) return;

  console.log("updateUI Cart:", cart); // Debug log

  // Clear and update cart items
  elements.cartItemsList.innerHTML = "";
  cart.forEach((item) => {
    console.log("updateUI Cart item:", item); // Debug log
    elements.cartItemsList.appendChild(createCartItemElement(item));
  });

  // Update totals
  const totals = calculateTotals();
  if (elements.totalPrice) {
    elements.totalPrice.textContent = `Total Amount: $${totals.price?.toFixed(2) || 0}`;
  }
  if (elements.totalQuantity) {
    elements.totalQuantity.textContent = `Items: ${totals.quantity}`;
  }
}

// Calculate total price and quantity to display in cart.astro UI
// [ { id: '1', name: 'The Butts', price: 150, quantity: 1 } ]
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
  listItem.id = `cart-item-${item.priceId}`;
  listItem.className = "cart-item";

  console.log("cart item", item);

  try {
    listItem.textContent = `${item.name} - $${item.price?.toFixed(2) || 0} x ${item.quantity}`;
  } catch (error) {
    console.error("Error creating cart item element:", error);
    listItem.textContent = `Error displaying item`;
  }
  return listItem;
}

//EDIT THIS!!! When I update Add to Cart to use Stripe product data,
// the product object will have a different structure.
function addToCart(product) {
  const existingProduct = cart.find((item) => item.priceId === product.priceId);

  if (existingProduct) {
    existingProduct.quantity += 1;
  } else {
    cart.push({
      //   id: product.id,
      name: product.name, // Ensure name is included
      price: product.price, // Ensure price is included
      priceId: product.priceId, // For Stripe Checkout
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

// Also clear cache after successful checkout
function handleCheckoutSuccess() {
  clearCart();
}

export { addToCart, removeFromCart, clearCart, updateUI, updateCartCount };
