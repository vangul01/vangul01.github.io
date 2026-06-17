// Should I import checkout.js into here??

import React, { useEffect, useState } from "react";
import {
  loadCart,
  saveCart,
  calculateTotals,
} from "../scripts/cart/cart-storage";
import { handleCheckout } from "../scripts/cart/checkout.js";
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
      <div className="container empty-cart">
        <h4>Your cart is empty!</h4>
        <a href="/merch" className="button button-primary">
          Continue Shopping
        </a>
      </div>
    );
  }

  const { price: finalPrice } = calculateTotals(cart);

  return (
    <>
      <div className="container">
        <div className="cart-products-grid cart-titles">
          <div>Product</div>
          <div>Quantity</div>
          <div>Total</div>
        </div>

        {cart.map((item, idx) => (
          <div className="cart-products-grid" key={item.priceId}>
            {/* Column 1: Image, Name, Price per item */}
            <div className="cart-product-info">
              <a
                href={`/products/${item.productUrl}`}
                className="cart-product-link"
              >
                <img
                  className="cart-product-thumbnail"
                  src={
                    item.image || "/images/logo_eyewhites.png"
                  }
                  alt={item.name}
                  loading="lazy"
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
                  className="quantity-btn"
                  aria-label="Decrease quantity"
                  onClick={() => updateQuantity(idx, -1)}
                >
                  −
                </button>
                <span className="quantity">{item.quantity}</span>
                <button
                  className="quantity-btn"
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
              <p>${formatPrice(item.price * item.quantity)}</p>
            </div>
          </div>
        ))}

        <div className="all-products-total-price">
          <p>Subtotal ${formatPrice(finalPrice)} USD</p>
          <p className="disclaimer">
            Taxes and shipping calculated at checkout
          </p>
          <p className="disclaimer">
            All payments will be processed by stripe.com, a secure third-party
            payment processor. We do not store any of your payment information
            on our servers.
          </p>
        </div>

        <div className="cart-buttons">
          <a href="/merch" className="link">
            Continue Shopping
          </a>

          <button
            className="button button-primary button-disable"
            // onClick={handleCheckout}
            id="proceed-to-payment"
          >
            <span className="button-label"> Proceed to Checkout</span>
          </button>
        </div>
      </div>
    </>
  );
}
