import React, { useEffect, useMemo, useState } from "react";
import {
  loadCart,
  saveCart,
  calculateTotals,
} from "../scripts/cart/cart-storage";
import { handleCheckout } from "../scripts/cart/checkout.js";
import { getStripePrices } from "../lib/stripe-client.ts";
import "../styles/global.css";

function statusNote(state) {
  if (state === "unavailable")
    return "Currently unavailable and excluded from checkout.";
  if (state === "inactive" || state === "not_found")
    return "No longer available and excluded from checkout.";
  return "";
}

export default function CartIsland({ fallbackImage = "" }) {
  const [cart, setCart] = useState([]);
  const [statuses, setStatuses] = useState({});
  const [checking, setChecking] = useState(true);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setCart(loadCart());
  }, []);

  async function fetchStatuses(items) {
    if (!items.length) return {};
    const ids = [...new Set(items.map((i) => i.productId).filter(Boolean))];
    return await getStripePrices(ids);
  }

  useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!cart.length) {
        setStatuses({});
        setChecking(false);
        return;
      }
      setChecking(true);
      try {
        const res = await fetchStatuses(cart);
        if (!cancelled) setStatuses(res || {});
      } catch (err) {
        console.error("Cart status check failed:", err);
        if (!cancelled) setStatuses({});
      } finally {
        if (!cancelled) setChecking(false);
      }
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [cart]);

  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState !== "visible" || !cart.length) return;
      fetchStatuses(cart)
        .then((res) => setStatuses(res || {}))
        .catch((err) => console.error("Cart status recheck failed:", err));
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [cart]);

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

  const enriched = useMemo(
    () =>
      cart.map((item) => {
        const status = statuses[item.productId] || { state: "not_found" };
        const purchasable = status.state === "available";
        const price =
          purchasable && status.amount != null ? status.amount : item.price || 0;
        return { item, status, purchasable, price };
      }),
    [cart, statuses],
  );

  const purchasableItems = enriched.filter((e) => e.purchasable);
  const { price: finalPrice } = calculateTotals(
    purchasableItems.map(({ item, price }) => ({ ...item, price })),
  );

  async function onCheckout() {
    setNotice("");
    setChecking(true);
    try {
      const fresh = await fetchStatuses(cart);
      setStatuses(fresh || {});
      const available = cart.filter(
        (item) => fresh?.[item.productId]?.state === "available",
      );

      if (!available.length) {
        setNotice("None of the items in your cart are currently available.");
        return;
      }

      const result = await handleCheckout(available);
      if (!result.ok) {
        setNotice(
          result.skipped?.length
            ? "Some items were removed from checkout because they are no longer available."
            : result.error || "Unable to start checkout. Please try again.",
        );
        return;
      }

      if (result.skipped?.length) {
        setNotice(
          "Some items were removed from checkout because they are no longer available.",
        );
      }
    } catch (err) {
      console.error("Checkout status check failed:", err);
      setNotice("Unable to check availability. Please try again.");
    } finally {
      setChecking(false);
    }
  }

  if (!cart.length) {
    return (
      <div className="container empty-cart">
        <h4>Your cart is empty!</h4>
        <div className="button-group">
          <a href="/shop" className="button button-primary">
            Continue Shopping
          </a>
        </div>
      </div>
    );
  }

  const allUnavailable =
    !checking && cart.length > 0 && purchasableItems.length === 0;
  const displayNotice =
    notice ||
    (allUnavailable
      ? "None of the items in your cart are currently available."
      : "");

  return (
    <>
      <div className="container">
        <div className="cart-products-grid cart-titles">
          <div>Product</div>
          <div>Quantity</div>
          <div>Total</div>
        </div>

        {enriched.map(({ item, status, purchasable, price }, idx) => (
          <div
            className={`cart-products-grid ${purchasable ? "" : "cart-item-unavailable"}`}
            key={item.productId}
          >
            <div className="cart-product-info">
              <a
                href={`/products/${item.productUrl}`}
                className="cart-product-link"
              >
                <img
                  className="cart-product-thumbnail"
                  src={item.image || fallbackImage}
                  alt={item.name}
                  loading="lazy"
                />
              </a>
              <div className="cart-product-details">
                <p className="cart-item-name">{item.name}</p>
                <p className="cart-item-price">
                  {checking
                    ? "Checking availability..."
                    : `$${formatPrice(price)} per item`}
                </p>
                {!checking && !purchasable && (
                  <p className="cart-item-note">{statusNote(status.state)}</p>
                )}
              </div>
            </div>
            <div className="cart-product-quantity">
              <div className="quantity-controls">
                <button
                  className="quantity-btn"
                  aria-label="Decrease quantity"
                  onClick={() => updateQuantity(idx, -1)}
                  disabled={!purchasable}
                >
                  −
                </button>
                <span className="quantity">{item.quantity}</span>
                <button
                  className="quantity-btn"
                  aria-label="Increase quantity"
                  onClick={() => updateQuantity(idx, 1)}
                  disabled={!purchasable}
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
            <div className="cart-product-total-price">
              <p>
                {purchasable ? `$${formatPrice(price * item.quantity)}` : "—"}
              </p>
            </div>
          </div>
        ))}

        <div className="all-products-total-price">
          <p>Subtotal ${formatPrice(finalPrice)} USD</p>
          {displayNotice && <p className="disclaimer">{displayNotice}</p>}
          <p className="disclaimer">
            Taxes and shipping calculated at checkout
          </p>
        </div>

        <div className="button-group">
          <a href="/shop" className="button button-secondary">
            <span className="button-label">Continue Shopping</span>
          </a>

          <button
            className="button button-primary"
            onClick={onCheckout}
            id="proceed-to-payment"
            disabled={checking || purchasableItems.length === 0}
          >
            <span className="button-label">
              {!checking && purchasableItems.length === 0
                ? "No Available Items"
                : "Proceed to Checkout"}
            </span>
          </button>
        </div>
      </div>
    </>
  );
}
