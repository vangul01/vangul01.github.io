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
    navToggle.classList.remove("active");
    navOverlay.classList.remove("visible");
    document.body.classList.remove("no-scroll");
  }

  // Only open the nav when the toggle is clicked
  navToggle?.addEventListener("click", () => {
    navLinks.classList.toggle("show-nav-links");
    navToggle.classList.toggle("active");
    navOverlay.classList.toggle("visible");
    document.body.classList.toggle("no-scroll");
  });

  // Close the nav when a link is clicked
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.addEventListener("click", closeNav);
  });

  // Event listeners for closing the nav when clicking outside of it
  navOverlay?.addEventListener("click", closeNav);

  // Close the nav when the window is resized
  window.onresize = function () {
    if (window.outerWidth > minWindowWidth) {
      closeNav();
    }
  };
}
