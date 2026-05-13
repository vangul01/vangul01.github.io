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
      addToCartBtn.classList.remove("button-disable");
    } else {
      console.error("Stripe price unfetcheded, add-to-cart button disabled.");
    }
  } catch (err) {
    console.error("Error loading price:", err);
    priceElement.textContent = "Price currently unavailable";

    // Disable add to cart button if price fetch fails
    addToCartBtn.disabled = true;
    addToCartBtn.innerText = "Unavailable";
    addToCartBtn.classList.add("button-disable");
  }
}

// export function initZoom() {
//   const container = document.querySelector(".zoom-container");
//   const image = document.getElementById("main-product-image");

//   if (container && image) {
//     container.addEventListener("mousemove", (e) => {
//       const bounds = container.getBoundingClientRect();
//       // Calculate mouse position as percentages
//       const x = (e.clientX - bounds.left) / bounds.width;
//       const y = (e.clientY - bounds.top) / bounds.height;

//       // Update image position
//       image.style.transformOrigin = `${x * 100}% ${y * 100}%`;
//       image.style.transform = "scale(2)";
//     });

//     container.addEventListener("mouseleave", () => {
//       image.style.transformOrigin = "center center";
//       image.style.transform = "scale(1)";
//     });
//   }
// }

// export function initThumbnails() {
//   const mainImage = document.getElementById("main-product-image");
//   const thumbnails = document.querySelectorAll(".thumbnail");

//   // Set first thumbnail as active by default
//   thumbnails[0]?.classList.add("active");

//   thumbnails.forEach((thumb) => {
//     thumb.addEventListener("click", () => {
//       // Update main image with fade effect
//       mainImage.style.opacity = "0";
//       const newImageUrl = thumb.getAttribute("data-image-url");

//       if (newImageUrl && mainImage) {
//         setTimeout(() => {
//           mainImage.src = newImageUrl;
//           mainImage.style.opacity = "1";
//         }, 200);
//       }

//       // Update active thumbnail state
//       thumbnails.forEach((t) => t.classList.remove("active"));
//       thumb.classList.add("active");
//     });
//   });
// }

// // Optional: Keyboard navigation
// export function initKeyboardNav() {
//   document.addEventListener("keydown", (e) => {
//     const active = document.querySelector(".thumbnail.active");
//     if (!active) return;

//     const currentIndex = parseInt(active.getAttribute("data-index") || "0");
//     let nextIndex;

//     if (e.key === "ArrowLeft") {
//       nextIndex = currentIndex - 1;
//     } else if (e.key === "ArrowRight") {
//       nextIndex = currentIndex + 1;
//     } else {
//       return;
//     }

//     const nextThumb = document.querySelector(`[data-index="${nextIndex}"]`);
//     if (nextThumb) nextThumb.click();
//   });
// }
