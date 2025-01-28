// ----------------------COPYWRITE YEAR UPDATE----------------------
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("copyright-year").textContent =
    new Date().getFullYear();
});

// ----------------------MODAL CONTACT FORM----------------------
// Selecting Elements
// const contactButton = document.getElementById("contact-button");
const contactLink = document.getElementById("contact-link");
const contactModal = document.getElementById("contact-modal");
const closeButton = document.querySelector(".close-button");

// Show the modal when the button is clicked
// contactButton.addEventListener("click", () => {
//   contactModal.style.display = "flex";
// });

contactLink.addEventListener("click", (e) => {
  e.preventDefault();
  contactModal.style.display = "flex";
});

// Close the modal when the close button is clicked
closeButton.addEventListener("click", () => {
  contactModal.style.display = "none";
});

// Close the modal when clicking outside the modal content
window.addEventListener("click", (event) => {
  if (event.target === contactModal) {
    contactModal.style.display = "none";
  }
});

// ----------------------RESPONSIVE NAV BAR----------------------
// Select elements
const navToggle = document.querySelector(".nav-toggle");
// const navLinks = document.querySelector(".nav-links");
const sideNav = document.querySelector(".side-nav"); //
const navOverlay = document.querySelector(".nav-overlay"); //

// navToggle.addEventListener("click", () => {
//   navLinks.classList.toggle("show-nav-links");
//   navToggle.classList.toggle("active");
// });

navToggle.addEventListener("click", () => {
  sideNav.classList.toggle("show-side-nav");
  navToggle.classList.toggle("active");
  navOverlay.classList.toggle("visible");
});

// Function to close the sidenav
function closeSidenav() {
  sideNav.classList.remove("open");
  navOverlay.classList.remove("visible");
}

// Event listeners
navOverlay.addEventListener("click", closeSidenav);

// ----------------------CART----------------------

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
