import { getStripePrices } from "../lib/stripe-client";

export async function initShopPage() {
  const grid = document.querySelector("[data-shop-grid]");
  if (!grid) return;

  const cards = Array.from(grid.querySelectorAll("[data-shop-card]"));
  if (cards.length === 0) return;

  const ids = cards
    .map((card) => card.dataset.productId)
    .filter((id) => typeof id === "string" && id.startsWith("prod_"));

  try {
    const statuses = await getStripePrices(ids);

    for (const card of cards) {
      const id = card.dataset.productId;
      const status = statuses?.[id] || { state: "not_found" };
      const badgeEl = card.querySelector("[data-shop-badge]");

      card.classList.remove("is-loading");

      if (status.state === "inactive" || status.state === "not_found") {
        card.remove();
        continue;
      }

      if (status.state === "unavailable") {
        if (badgeEl) {
          badgeEl.hidden = false;
          badgeEl.textContent = "Unavailable";
        }
        card.classList.add("is-unavailable");
        continue;
      }

      card.classList.remove("is-unavailable");
    }
  } catch (err) {
    console.error("Shop status load failed:", err);
    for (const card of cards) {
      card.classList.remove("is-loading");
    }
  }
}
