// Handles the cart UI
// This is a separate file because it's used in multiple files
import {
  removeFromCart,
  updateQuantity,
  calculateTotals,
} from "./cart-operations.js";

export function createCartUI(cart, setCart) {
  const elements = {
    cartItems: document.getElementById("checkout-cart-items"),
    totalPrice: document.getElementById("checkout-total-price"),
    totalQuantity: document.getElementById("checkout-total-quantity"),
  };

  function updateUI() {
    if (!elements.cartItems) return;

    // Clear and update cart items
    elements.cartItems.innerHTML = "";
    cart.forEach((item) => {
      elements.cartItems.appendChild(createCartItemElement(item));
    });

    // Update totals
    const totals = calculateTotals(cart);
    if (elements.totalPrice) {
      elements.totalPrice.textContent = `Total Amount: $${totals.price.toFixed(
        2
      )}`;
    }
    if (elements.totalQuantity) {
      elements.totalQuantity.textContent = `Items: ${totals.quantity}`;
    }
  }

  function createCartItemElement(item) {
    const listItem = document.createElement("li");
    listItem.id = `cart-item-${item.id}`;
    listItem.className = "cart-item";
    listItem.textContent = `${item.name} - $${item.price.toFixed(2)} x ${
      item.quantity
    }`;

    listItem.appendChild(
      createButton("Edit", () => createQuantityInput(listItem, item))
    );
    listItem.appendChild(
      createButton("Remove", () => {
        const newCart = removeFromCart(cart, item.id);
        setCart(newCart); // This will trigger the callback in main.js
        updateUI();
      })
    );

    return listItem;
  }

  function createButton(text, onClick) {
    const button = document.createElement("button");
    button.textContent = text;
    button.className = "cart-button";
    button.addEventListener("click", onClick);
    return button;
  }

  function createQuantityInput(listItem, item) {
    if (listItem.querySelector(".quantity-input")) return;

    const input = document.createElement("input");
    input.type = "number";
    input.min = "1";
    input.value = item.quantity;
    input.className = "quantity-input";

    input.addEventListener("change", (e) => {
      const newCart = updateQuantity(cart, item.id, parseInt(e.target.value));
      setCart(newCart);
      updateUI();
    });

    listItem.appendChild(input);
    input.focus();
  }

  return { updateUI };
}
