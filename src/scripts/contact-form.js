// Contact Modal functionality
export function initContactForm() {
  // Selecting Elements
  const contactLink = document.querySelector(".contact-link");
  //   const contactModal = document.querySelector("#contact-modal");
  const contactModal = document.querySelector(".contact-container");
  const closeButton = document.querySelector(".button-modal-close");
  const navOverlay = document.querySelector(".nav-overlay");

  function openModal() {
    // contactModal.style.display = "flex";
    contactModal.classList.add("visible");
    navOverlay.classList.add("visible");
    navOverlay.classList.add("no-scroll");
  }

  function closeModal() {
    // contactModal.style.display = "none";
    contactModal.classList.remove("visible");
    navOverlay.classList.remove("visible");
    navOverlay.classList.remove("no-scroll");
  }

  // Prevent scrolling when the modal is open, even on resize
  //   function maintainScroll() {
  //     if (contactModal.style.display === "flex") {
  //       navOverlay.classList.add("no-scroll");
  //     } else {
  //       navOverlay.classList.remove("no-scroll");
  //     }
  //   }

  // Event listeners
  // When the window is resized, maintain the scroll state
  //   window.addEventListener("resize", maintainScroll);

  // Close the modal when clicking outside the modal content
  window.addEventListener("click", (event) => {
    if (event.target === contactModal) {
      closeModal();
    }
  });
  // When the contact link is clicked, open the modal
  contactLink?.addEventListener("click", (e) => {
    e.preventDefault();
    openModal();
  });
  // When the close button is clicked, close the modal
  closeButton?.addEventListener("click", closeModal);
}
