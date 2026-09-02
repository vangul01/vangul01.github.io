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

export function initCarousels() {
  document.querySelectorAll(".carousel").forEach((el) => new Carousel(el));
}
