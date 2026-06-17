// For product image zoom and thumbnail interactions
// Adding basic price fetching from Stripe for dynamic pricing display.

import { getStripePrice } from "../lib/stripe-client";

export async function initProductPage() {
  const priceElement = document.getElementById("product-price");
  const addToCartBtn = document.getElementById("add-to-cart");

  if (!priceElement || !addToCartBtn) return;

  const priceId = priceElement.dataset.priceId;
  if (!priceId) return;

  try {
    const price = await getStripePrice(priceId);

    // Success! Update price and enable button
    if (price) {
      priceElement.textContent = `$${price.amount} ${price.currency.toUpperCase()}`;
      addToCartBtn.dataset.price = String(price.amount);
      addToCartBtn.disabled = false;
      addToCartBtn.innerText = "Add to Cart";
      addToCartBtn.classList.remove("button-disable button-check");
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
