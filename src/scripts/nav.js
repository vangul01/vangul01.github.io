/*
Logic:
Open nav:
    - when window < 768px
    - when nav-toggle is clicked
Close nav:
    - when window > 768px
    - when nav-overlay is clicked
    - when a nav-link is clicked

ISSUE:
scrolling when overlay is on top, not able to deacitvate it???
-affects global, contact form js and astro, nav js,
*/

// Navigation functionality
export function initNav() {
  const navToggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".nav-links");
  const navOverlay = document.querySelector(".nav-overlay");
  const desktopNav = window.matchMedia("(min-width: 768px)");
  if (!navToggle || !navLinks) return;

  function closeNav({ restoreFocus = false } = {}) {
    navLinks.classList.remove("show-nav-links");
    navToggle.classList.remove("vertical");
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-label", "Open navigation menu");
    navOverlay?.classList.remove("visible", "no-scroll");
    document.body.classList.remove("no-scroll");
    if (!desktopNav.matches) navLinks.setAttribute("aria-hidden", "true");
    if (restoreFocus) navToggle.focus();
  }

  function openNav() {
    navLinks.classList.add("show-nav-links");
    navLinks.removeAttribute("aria-hidden");
    navToggle.classList.add("vertical");
    navToggle.setAttribute("aria-expanded", "true");
    navToggle.setAttribute("aria-label", "Close navigation menu");
    navOverlay?.classList.add("visible", "no-scroll");
    document.body.classList.add("no-scroll");
  }

  navToggle.addEventListener("click", () => {
    navLinks.classList.contains("show-nav-links") ? closeNav() : openNav();
  });

  navLinks.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", () => closeNav());
  });

  navOverlay?.addEventListener("click", () => closeNav());
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && navLinks.classList.contains("show-nav-links")) {
      closeNav({ restoreFocus: true });
    }
  });

  function syncNavToViewport() {
    if (desktopNav.matches) {
      navLinks.removeAttribute("aria-hidden");
      navToggle.classList.remove("vertical");
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.setAttribute("aria-label", "Open navigation menu");
      navOverlay?.classList.remove("visible", "no-scroll");
      document.body.classList.remove("no-scroll");
      navLinks.classList.remove("show-nav-links");
      return;
    }
    if (!navLinks.classList.contains("show-nav-links")) {
      navLinks.setAttribute("aria-hidden", "true");
    }
  }

  desktopNav.addEventListener("change", syncNavToViewport);
  syncNavToViewport();
}
