import React, { useEffect, useState } from "react";
import {
  loadCart,
  saveCart,
  calculateTotals,
} from "../scripts/cart/cart-storage";
import "../styles/global.css";

export default function CartIsland() {
  const [cart, setCart] = useState([]);

  useEffect(() => {
    setCart(loadCart());
  }, []);

  function updateQuantity(idx, delta) {
    const newCart = [...cart];
    newCart[idx].quantity = Math.max(1, newCart[idx].quantity + delta);
    setCart(newCart);
    saveCart(newCart);
  }

  function removeItem(idx) {
    const newCart = cart.filter((_, i) => i !== idx);
    setCart(newCart);
    saveCart(newCart);
  }

  function formatPrice(price) {
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  }

  if (!cart.length) {
    return (
      <div className="empty-cart">
        <p>Your cart is empty!</p>
        <a href="/merch" className="button button-primary">
          Continue Shopping
        </a>
      </div>
    );
  }

  const { price: finalPrice } = calculateTotals(cart);

  return (
    <>
      <div className="cart-container">
        <div className="cart-products-grid cart-titles">
          <div>Product</div>
          <div>Quantity</div>
          <div>Total</div>
        </div>
        {cart.map((item, idx) => (
          <div className="cart-products-grid cart-row" key={item.priceId}>
            {/* Column 1: Image, Name, Price per item */}
            <div className="cart-product-info">
              <a
                href={`products/${item.productUrl}`}
                className="cart-product-link"
              >
                <img
                  className="cart-product-thumbnail"
                  src={item.image || "/src/assets/images/web/logo.png"}
                  alt={item.name}
                />
              </a>
              <div className="cart-product-details">
                <p className="cart-item-name">{item.name}</p>
                <p className="cart-item-price">
                  ${item.price?.toFixed(2) || 0} per item
                </p>
              </div>
            </div>
            {/* Column 2: Quantity controls */}
            <div className="cart-product-quantity">
              <div className="quantity-controls">
                <button
                  className="quantity-btn minus"
                  aria-label="Decrease quantity"
                  onClick={() => updateQuantity(idx, -1)}
                >
                  -
                </button>
                <span className="quantity">{item.quantity}</span>
                <button
                  className="quantity-btn plus"
                  aria-label="Increase quantity"
                  onClick={() => updateQuantity(idx, 1)}
                >
                  +
                </button>
              </div>
              <button
                className="delete-btn"
                aria-label="Remove item"
                onClick={() => removeItem(idx)}
              >
                <i className="fa fa-trash"></i>
              </button>
            </div>
            {/* Column 3: Total price */}
            <div className="cart-product-total-price">
              <p className="cart-item-total">
                ${formatPrice(item.price * item.quantity)}
              </p>
            </div>
          </div>
        ))}

        <div className="all-products-total-price">
          <p className="cart-items-subtotal">
            Subtotal ${formatPrice(finalPrice)} USD
          </p>
          <p className="subtotal-disclaimer">
            Taxes and shipping calculated at checkout
          </p>
        </div>

        <div className="cart-buttons">
          <a href="/merch" className="link">
            Continue Shopping
          </a>

          <a
            href="/checkout"
            className="button button-primary"
            id="proceed-to-payment"
          >
            Proceed to Checkout
          </a>
        </div>
      </div>
    </>
  );
}
