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
  const thumbnails = Array.from(document.querySelectorAll(".thumbnail"));

  if (!mainImage || thumbnails.length === 0) return;

  function showImage(index) {
    const thumbnail = thumbnails[index];
    if (!thumbnail) return;

    const imageUrl = thumbnail.dataset.imageUrl;
    if (imageUrl && mainImage.getAttribute("src") !== imageUrl) {
      mainImage.classList.remove("is-loaded", "is-error");
      mainImage.removeAttribute("data-fallback-tried");
      mainImage.src = imageUrl;
    }

    thumbnails.forEach((thumb) => thumb.classList.remove("active"));
    thumbnail.classList.add("active");
  }

  thumbnails.forEach((thumbnail, index) => {
    thumbnail.addEventListener("click", () => showImage(index));
  });

  document.addEventListener("keydown", (event) => {
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

function showUnavailableProduct(root) {
  root?.classList.remove("is-loading");
  if (root) root.hidden = true;
  const fallback = document.querySelector("[data-product-unavailable]");
  if (fallback) fallback.hidden = false;
}

export async function initProductPage() {
  initBackLink();
  initThumbnails();

  const root = document.querySelector("[data-product-root]");
  const priceElement = document.getElementById("product-price");
  const addToCartBtn = document.getElementById("add-to-cart");
  const statusEl = document.querySelector("[data-availability-status]");
  if (!root || !priceElement || !addToCartBtn) return;

  const productId = root.dataset.productId || priceElement.dataset.productId;
  if (!productId) {
    showUnavailableProduct(root);
    return;
  }

  try {
    const status = await getStripePrice(productId);
    root.classList.remove("is-loading");
    priceElement.classList.remove("skeleton-text");
    priceElement.removeAttribute("aria-busy");
    addToCartBtn.classList.remove("skeleton-button");
    addToCartBtn.removeAttribute("aria-busy");

    if (!status || status.state === "not_found" || status.state === "inactive") {
      showUnavailableProduct(root);
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
      return;
    }

    if (status.state === "available" && status.amount != null && status.currency) {
      priceElement.textContent = `$${status.amount} ${String(status.currency).toUpperCase()}`;
      addToCartBtn.dataset.price = String(status.amount);
      addToCartBtn.disabled = false;
      addToCartBtn.classList.remove("button-disable", "button-check");
      addToCartBtn.classList.add("button-primary");
      addToCartBtn.querySelector(".button-label").textContent = "Add to Cart";
      return;
    }

    if (statusEl) {
      statusEl.hidden = false;
      statusEl.textContent = "Currently unavailable";
    }
    addToCartBtn.disabled = true;
    addToCartBtn.querySelector(".button-label").textContent = "Unavailable";
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
  }
}
