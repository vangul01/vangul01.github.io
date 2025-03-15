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
  // Select elements
  const navToggle = document.querySelector(".nav-toggle");
  const navLinks = document.querySelector(".nav-links");
  const navOverlay = document.querySelector(".nav-overlay");
  const minWindowWidth = 768;

  // Function to close the sidenav
  function closeNav() {
    navLinks.classList.remove("show-nav-links");
    navToggle.classList.remove("vertical");
    navOverlay.classList.remove("visible", "no-scroll");
  }

  // Function to open the sidenav
  function openNav() {
    navLinks.classList.add("show-nav-links");
    navToggle.classList.add("vertical");
    navOverlay.classList.add("visible", "no-scroll");
  }

  // Only open the nav when the toggle is clicked
  navToggle?.addEventListener("click", () => {
    const isNavOpen = navLinks.classList.contains("show-nav-links");
    if (isNavOpen) {
      closeNav();
    } else {
      openNav();
    }
  });

  // Close the nav when a link is clicked
  document.querySelectorAll("#nav-link").forEach((link) => {
    link.addEventListener("click", closeNav);
  });

  //   Event listeners for closing the nav when clicking outside of it
  navOverlay?.addEventListener("click", closeNav);

  window.addEventListener("resize", () => {
    console.log("Window resized:", window.outerWidth);
    if (window.outerWidth > minWindowWidth) {
      console.log("Closing nav due to large window size");
      closeNav();
    } else {
      if (navLinks.classList.contains("show-nav-links")) {
        console.log("Keeping no-scroll because nav is open");
        navOverlay.classList.add("no-scroll");
      }
    }
  });
}
