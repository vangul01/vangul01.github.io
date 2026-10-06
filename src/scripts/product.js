// For product image thumbnail interactions
// Adding basic price fetching from Stripe for dynamic pricing display.

import { getStripePrice } from "../lib/stripe-client";

function initThumbnails() {
  const mainImage = document.getElementById("main-product-image");
  const thumbnails = Array.from(document.querySelectorAll(".thumbnail"));

  if (!mainImage || thumbnails.length === 0) return;

  function showImage(index) {
    const thumbnail = thumbnails[index];
    if (!thumbnail) return;

    const imageUrl = thumbnail.dataset.imageUrl;
    if (imageUrl) {
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

export async function initProductPage() {
  initThumbnails();

  const priceElement = document.getElementById("product-price");
  const addToCartBtn = document.getElementById("add-to-cart");

  if (!priceElement || !addToCartBtn) return;

  // If the button is already rendered as "Unavailable" by the server,
  // skip the Stripe fetch entirely
  const isInStock = addToCartBtn.dataset.instock !== "false";
  if (!isInStock) return;

  const productId = priceElement.dataset.productId;
  if (!productId) return;

  try {
    const price = await getStripePrice(productId);

    // Success! Update price and enable button
    if (price) {
      priceElement.textContent = `$${price.amount} ${price.currency.toUpperCase()}`;
      addToCartBtn.dataset.price = String(price.amount);
      addToCartBtn.disabled = false;
      addToCartBtn.innerText = "Add to Cart";
      addToCartBtn.classList.remove("button-disable", "button-check");
      addToCartBtn.classList.add("button-primary");
    } else {
      console.error("Stripe price unfetcheded, add-to-cart button disabled.");
      // Just throw an error to automatically trigger the catch block logic below
      throw new Error("Price not found");
    }
  } catch (err) {
    console.error("Error loading price:", err);
    priceElement.textContent = "Price currently unavailable";
    // Disable add to cart button if price fetch fails
    addToCartBtn.disabled = true;
    addToCartBtn.innerText = "Unavailable";
    addToCartBtn.classList.remove("button-primary", "button-check");
    addToCartBtn.classList.add("button-disable");
  }
}
