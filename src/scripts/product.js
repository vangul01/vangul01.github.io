import {
  formatPrice,
  MAX_QUANTITY,
  MIN_QUANTITY,
} from "../lib/commerce-config";
import { getStripePrice } from "../lib/stripe-client";

function initBackLink() {
  const backLink = document.querySelector("[data-back-link]");
  backLink?.addEventListener("click", (event) => {
    event.preventDefault();
    window.history.back();
  });
}

function initThumbnails() {
  const mainImage = document.getElementById("main-product-image");
  const thumbnails = Array.from(document.querySelectorAll(".thumbnail-button"));

  if (!mainImage || thumbnails.length === 0) return;

  function showImage(index) {
    const thumbnail = thumbnails[index];
    if (!thumbnail) return;

    const image = thumbnail.querySelector("img");
    const imageUrl = image?.dataset.imageUrl;
    if (imageUrl && mainImage.getAttribute("src") !== imageUrl) {
      mainImage.classList.remove("is-loaded", "is-error");
      mainImage.removeAttribute("data-fallback-tried");
      mainImage.src = imageUrl;
    }

    thumbnails.forEach((thumb) => {
      const isActive = thumb === thumbnail;
      thumb.classList.toggle("active", isActive);
      thumb.setAttribute("aria-pressed", String(isActive));
    });
  }

  thumbnails.forEach((thumbnail, index) => {
    thumbnail.addEventListener("click", () => showImage(index));
  });

  document.addEventListener("keydown", (event) => {
    const tag = document.activeElement?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

    const activeIndex = thumbnails.findIndex((thumb) =>
      thumb.classList.contains("active"),
    );
    if (activeIndex === -1) return;

    if (event.key === "ArrowRight") {
      showImage((activeIndex + 1) % thumbnails.length);
    } else if (event.key === "ArrowLeft") {
      showImage((activeIndex - 1 + thumbnails.length) % thumbnails.length);
    }
  });
}

function clampQuantity(value) {
  const parsed = Math.round(Number(value)) || MIN_QUANTITY;
  return Math.max(MIN_QUANTITY, Math.min(parsed, MAX_QUANTITY));
}

function initQuantityControls() {
  const wrapper = document.querySelector("[data-product-quantity]");
  const input = document.querySelector("[data-quantity-input]");
  if (!wrapper || !input) return null;

  const buttons = Array.from(
    wrapper.querySelectorAll("[data-quantity-change]"),
  );
  let enabled = false;

  function syncButtons() {
    const value = clampQuantity(input.value);
    buttons.forEach((button) => {
      const delta = Number(button.dataset.quantityChange);
      button.disabled =
        !enabled ||
        (delta < 0 && value <= MIN_QUANTITY) ||
        (delta > 0 && value >= MAX_QUANTITY);
    });
  }

  function setQuantity(value) {
    input.value = String(clampQuantity(value));
    syncButtons();
  }

  buttons.forEach((button) => {
    button.addEventListener("click", () => {
      const delta = Number(button.dataset.quantityChange) || 0;
      setQuantity(Number(input.value) + delta);
    });
  });

  input.addEventListener("change", () => setQuantity(input.value));
  syncButtons();

  return {
    setEnabled(isEnabled) {
      enabled = isEnabled;
      input.disabled = !enabled;
      syncButtons();
    },
  };
}

function showUnavailableProduct(root, announce) {
  root?.classList.remove("is-loading");
  if (root) root.hidden = true;
  const fallback = document.querySelector("[data-product-unavailable]");
  if (fallback) fallback.hidden = false;
  announce("This piece is no longer available.");
}

export async function initProductPage() {
  initBackLink();
  initThumbnails();

  const root = document.querySelector("[data-product-root]");
  const priceElement = document.getElementById("product-price");
  const addToCartBtn = document.getElementById("add-to-cart");
  const statusEl = document.querySelector("[data-availability-status]");
  const feedback = document.querySelector("[data-product-feedback]");
  const quantityControls = initQuantityControls();

  if (!root || !priceElement || !addToCartBtn) return;

  function announce(message) {
    if (feedback) feedback.textContent = message;
  }

  const productId = root.dataset.productId || priceElement.dataset.productId;
  if (!productId) {
    showUnavailableProduct(root, announce);
    return;
  }

  try {
    const status = await getStripePrice(productId);
    root.classList.remove("is-loading");
    priceElement.classList.remove("skeleton-text");
    priceElement.removeAttribute("aria-busy");
    addToCartBtn.classList.remove("skeleton-button");
    addToCartBtn.removeAttribute("aria-busy");

    if (
      !status ||
      status.state === "not_found" ||
      status.state === "inactive"
    ) {
      showUnavailableProduct(root, announce);
      return;
    }

    if (status.state === "unavailable") {
      priceElement.textContent = "";
      if (statusEl) {
        statusEl.hidden = false;
        statusEl.textContent = "Currently unavailable";
      }
      addToCartBtn.disabled = true;
      addToCartBtn.classList.remove("button-primary", "button-check");
      addToCartBtn.classList.add("button-disable");
      addToCartBtn.querySelector(".button-label").textContent = "Unavailable";
      quantityControls?.setEnabled(false);
      announce("Currently unavailable.");
      return;
    }

    if (
      status.state === "available" &&
      status.amount != null &&
      status.currency
    ) {
      const price = formatPrice(status.amount, status.currency);
      priceElement.textContent = price;
      addToCartBtn.dataset.price = String(status.amount);
      addToCartBtn.disabled = false;
      addToCartBtn.classList.remove("button-disable", "button-check");
      addToCartBtn.classList.add("button-primary");
      addToCartBtn.querySelector(".button-label").textContent = "Add to Cart";
      quantityControls?.setEnabled(true);
      announce(`Price ${price}. Available to add to cart.`);
      return;
    }

    if (statusEl) {
      statusEl.hidden = false;
      statusEl.textContent = "Currently unavailable";
    }
    addToCartBtn.disabled = true;
    addToCartBtn.querySelector(".button-label").textContent = "Unavailable";
    quantityControls?.setEnabled(false);
    announce("Currently unavailable.");
  } catch (err) {
    console.error("Error loading price/status:", err);
    root.classList.remove("is-loading");
    priceElement.classList.remove("skeleton-text");
    addToCartBtn.classList.remove("skeleton-button");
    if (statusEl) {
      statusEl.hidden = false;
      statusEl.textContent = "Currently unavailable";
    }
    addToCartBtn.disabled = true;
    addToCartBtn.querySelector(".button-label").textContent = "Unavailable";
    quantityControls?.setEnabled(false);
    announce("Price and availability could not be loaded.");
  }
}
