import { getStripePrices } from "../lib/stripe-client";

class Carousel {
  constructor(el) {
    this.slides = el.querySelectorAll(".carousel-slide");
    this.dots = el.querySelectorAll(".carousel-dot");
    this.current = 0;
    this.interval = parseInt(el.dataset.interval || "", 10) || 5000;

    if (this.slides.length < 2) return;

    el.querySelector(".carousel-prev")?.addEventListener("click", () =>
      this.go(this.current - 1),
    );
    el.querySelector(".carousel-next")?.addEventListener("click", () =>
      this.go(this.current + 1),
    );

    this.dots.forEach((dot) => {
      const index = parseInt(dot.dataset.index || "", 10);
      if (!Number.isNaN(index)) {
        dot.addEventListener("click", () => this.go(index));
      }
    });

    el.addEventListener("mouseenter", () => this.stop());
    el.addEventListener("mouseleave", () => this.start());

    this.start();
  }

  go(index) {
    const next =
      ((index % this.slides.length) + this.slides.length) % this.slides.length;

    this.slides[this.current].classList.remove("active");
    this.slides[next].classList.add("active");

    this.dots.forEach((dot, i) => {
      dot.classList.toggle("active", i === next);
      dot.setAttribute("aria-selected", String(i === next));
    });

    this.current = next;
  }

  start() {
    this.stop();
    this.timer = setInterval(() => this.go(this.current + 1), this.interval);
  }

  stop() {
    clearInterval(this.timer);
  }
}

function rebuildDots(el, slides) {
  const dots = el.querySelector(".carousel-dots");
  if (!dots) return;

  dots.innerHTML = "";
  slides.forEach((_, i) => {
    const dot = document.createElement("button");
    dot.className = `carousel-dot${i === 0 ? " active" : ""}`;
    dot.dataset.index = String(i);
    dot.setAttribute("role", "tab");
    dot.setAttribute("aria-label", `Go to slide ${i + 1}`);
    dot.setAttribute("aria-selected", String(i === 0));
    dots.appendChild(dot);
  });
}

async function filterInactiveSlides(el) {
  const slides = Array.from(
    el.querySelectorAll(".carousel-slide[data-product-id]"),
  );
  if (slides.length === 0) return;

  const ids = slides
    .map((slide) => slide.dataset.productId)
    .filter((id) => typeof id === "string" && id.startsWith("prod_"));
  if (ids.length === 0) return;

  let statuses;
  try {
    statuses = await getStripePrices(ids);
  } catch (err) {
    console.error("Carousel status load failed:", err);
    return;
  }

  for (const slide of slides) {
    const id = slide.dataset.productId;
    const state = statuses?.[id]?.state || "not_found";
    if (state === "inactive" || state === "not_found") {
      slide.remove();
    }
  }

  const remaining = Array.from(el.querySelectorAll(".carousel-slide"));
  if (remaining.length === 0) {
    el.dataset.slides = "0";
    el.classList.add("is-empty");
    return;
  }

  el.dataset.slides = String(remaining.length);
  remaining.forEach((slide, i) => {
    slide.classList.toggle("active", i === 0);
  });

  if (remaining.length < 2) {
    el.querySelectorAll(".carousel-btn, .carousel-dots").forEach((node) => {
      node.remove();
    });
    return;
  }

  rebuildDots(el, remaining);
}

export async function initCarousels() {
  const carousels = Array.from(document.querySelectorAll(".carousel"));

  try {
    await Promise.all(carousels.map(filterInactiveSlides));
  } catch (err) {
    console.error("Carousel initialization failed:", err);
  } finally {
    carousels.forEach((el) => el.removeAttribute("data-status-pending"));
  }

  carousels.forEach((el) => new Carousel(el));
}
