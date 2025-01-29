// ---------------------- BODY: MODAL CONTACT FORM----------------------
// Selecting Elements
// const contactButton = document.getElementById("contact-button");
const contactLink = document.getElementById("contact-link");
const contactModal = document.getElementById("contact-modal");
const closeButton = document.querySelector(".close-button");

// Show the modal when the button is clicked
// contactButton.addEventListener("click", () => {
//   contactModal.style.display = "flex";
// });

// Contact Modal
function openModal() {
  contactModal.style.display = "flex";
  document.body.classList.add("no-scroll");
}

function closeModal() {
  contactModal.style.display = "none";
  document.body.classList.remove("no-scroll");
}

// Prevent scrolling when the modal is open, even on resize
function maintainScroll() {
  if (
    contactModal.style.display === "flex" ||
    navLinks.classList.contains("show-nav-links")
  ) {
    document.body.classList.add("no-scroll");
  } else {
    document.body.classList.remove("no-scroll");
  }
}

// Add resize event listener
window.addEventListener("resize", maintainScroll);

contactLink.addEventListener("click", (e) => {
  e.preventDefault();
  openModal();
});

closeButton.addEventListener("click", closeModal);

// Close the modal when clicking outside the modal content
window.addEventListener("click", (event) => {
  if (event.target === contactModal) {
    closeModal();
  }
});

// ----------------------RESPONSIVE NAV HEADER ----------------------
// Select elements
const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");
const navOverlay = document.querySelector(".nav-overlay");
const minWindowWidth = 768;

// Only open the nav when the toggle is clicked
navToggle.addEventListener("click", () => {
  navLinks.classList.toggle("show-nav-links");
  navToggle.classList.toggle("active");
  navOverlay.classList.toggle("visible");
  document.body.classList.toggle("no-scroll");
});

// Close the nav when a link is clicked
document.querySelectorAll(".nav-link").forEach((link) => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("show-nav-links");
    navToggle.classList.remove("active");
    navOverlay.classList.remove("visible");
    document.body.classList.remove("no-scroll");
  });
});

// Function to close the sidenav
function closeNav() {
  navLinks.classList.remove("show-nav-links");
  navToggle.classList.remove("active");
  navOverlay.classList.remove("visible");
  document.body.classList.remove("no-scroll");
}

// Event listeners for closing the nav when clicking outside the nav
navOverlay.addEventListener("click", closeNav);

// Close the nav when the window is resized
window.onresize = function () {
  var w = window.outerWidth;
  if (w > minWindowWidth) {
    navLinks.classList.remove("show-nav-links");
    navToggle.classList.remove("active");
    navOverlay.classList.remove("visible");
    document.body.classList.remove("no-scroll");
  }
};

// ----------------------BODY AND NAV HEADER: CART----------------------

// Cart array to store items
let cart = [];

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart)); // Convert array to JSON string
}

// after checkout, clear the cart like this!
function clearCart() {
  localStorage.removeItem("cart");
  cart = [];
  //   updateCart();
  updateCartCount();
}

// Load cart from local storage on page load
window.addEventListener("load", () => {
  const savedCart = localStorage.getItem("cart");
  if (savedCart) {
    cart = JSON.parse(savedCart); // Convert JSON string back to array
    // updateCart(); // Refresh the cart display
    updateCartCount(); // Update the cart count in the icon
  }
});

// Change button text when clicked
function changeButtonText(button, newText, originalText) {
  button.textContent = newText; // Change the button text

  setTimeout(function () {
    button.textContent = originalText; // Revert to the original text
  }, 1000); // 1 second timeout
}

// Add to Cart button logic
document.querySelectorAll(".add-to-cart").forEach((button) => {
  const originalButtonText = "Add to Cart";
  const newButtonText = "Added!";

  button.addEventListener("click", function () {
    const productId = this.dataset.id;
    const productName = this.dataset.name;
    const productPrice = parseFloat(this.dataset.price);

    // Add product to cart
    const existingProduct = cart.find((item) => item.id === productId);
    if (existingProduct) {
      existingProduct.quantity += 1;
    } else {
      cart.push({
        id: productId,
        name: productName,
        price: productPrice,
        quantity: 1,
      });
    }

    saveCart(); // Save cart to local storage
    updateCartCount(); // Update cart count in icon

    // Change button text
    changeButtonText(this, newButtonText, originalButtonText);
  });
});

// Update the cart count in the icon
function updateCartCount() {
  //   const cartCountElement = document.getElementById("cart-count");
  const cartCountElement = document.querySelector(".cart-count");
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  cartCountElement.textContent = totalItems;
}

// ----------------------FOOTER: COPYWRITE YEAR UPDATE----------------------
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("copyright-year").textContent =
    new Date().getFullYear();
});
