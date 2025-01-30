// ----------------------RESPONSIVE NAV BAR----------------------

const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");

navToggle.addEventListener("click", () => {
  navLinks.classList.toggle("show-nav-links");
});

// ----------------------CART----------------------

// Cart array to store items
let cart = [];

// Load cart from local storage on page load
window.addEventListener("load", () => {
  const savedCart = localStorage.getItem("cart");
  if (savedCart) {
    cart = JSON.parse(savedCart); // Convert JSON string back to array
    updateCart(); // Refresh the cart display
    updateCartCount(); // Update the cart count in the icon
  }
});

function saveCart() {
  localStorage.setItem("cart", JSON.stringify(cart)); // Convert array to JSON string
}

// after checkout, clear the cart like this!
function clearCart() {
  localStorage.removeItem("cart");
  cart = [];
  updateCart();
  updateCartCount();
}

// Remove all quantities of item from cart
function removeFromCart(productId) {
  // Find the product in the cart
  const productIndex = cart.findIndex((item) => item.id === productId);
  //   const productQuantity = cart[productIndex].quantity;

  if (productIndex < 0) {
    console.error("Product not found in cart!");
    return;
  } else {
    cart.splice(productIndex, 1);
    console.log("Product Removed!");
  }

  saveCart(); // Save cart to local storage
  updateCart(); // Refresh cart display
  updateCartCount();
}

function editQuantity(productId) {
  // Find the product in the cart
  const productIndex = cart.findIndex((item) => item.id === productId);

  if (productIndex < 0) {
    console.error("Product not found in cart!");
    return;
  }

  const product = cart[productIndex];

  // Locate the item's list element in the DOM
  const listItem = document.querySelector(`#cart-item-${productId}`);
  if (!listItem) {
    console.error("List item element not found!");
    return;
  }

  // Check if the input already exists (to avoid duplicates)
  let quantityInput = listItem.querySelector(".quantity-input");

  if (!quantityInput) {
    // Create quantity input if it doesn't exist
    quantityInput = document.createElement("input");
    quantityInput.type = "number";
    quantityInput.min = "1";
    quantityInput.value = product.quantity;
    quantityInput.className = "quantity-input";
    quantityInput.style.width = "50px";
    quantityInput.style.marginLeft = "10px";

    // Add an event listener for changes
    quantityInput.addEventListener("change", (e) => {
      newQuantity = parseInt(e.target.value);
      if (newQuantity > 0) {
        product.quantity = newQuantity; // Update the quantity in the cart

        saveCart(); // Save changes to localStorage
        updateCart(); // Refresh display
        updateCartCount(); // Update cart count in the icon
      } else {
        alert("Choose a quantity greater than 0");
        e.target.value = product.quantity; // Revert to the old value
      }
    });

    // Append the input to the list item
    listItem.appendChild(quantityInput);
  }

  // Focus on the input field (optional)
  quantityInput.focus();
}

// Update cart display and button quantity
function updateCart() {
  const cartItemsContainer = document.getElementById("checkout-cart-items");
  const totalPriceElement = document.getElementById("checkout-total-price");
  const totalQuantityElement = document.getElementById(
    "checkout-total-quantity"
  );

  let totalPrice = 0;

  // Clear cart items
  cartItemsContainer.innerHTML = "";

  // Display updated cart
  cart.forEach((item) => {
    totalPrice += item.price * item.quantity;

    // Create cart item element
    const listItem = document.createElement("li");
    listItem.textContent = `${item.name} - $${item.price} x ${item.quantity} `;
    listItem.id = `cart-item-${item.id}`; // Add an ID for targeting
    listItem.style.marginBottom = "10px";

    // Create Edit button
    const editButton = document.createElement("button");
    editButton.textContent = "Edit";
    editButton.style.marginLeft = "10px";
    editButton.className = "edit-button";

    // Attach event listener to Edit button
    editButton.addEventListener("click", () => {
      editQuantity(item.id);
    });

    // Create Remove button
    const removeButton = document.createElement("button");
    removeButton.textContent = "Remove";
    removeButton.style.marginLeft = "10px";

    // Attach event listener to Remove button
    removeButton.addEventListener("click", () => {
      removeFromCart(item.id);
    });

    listItem.appendChild(editButton); // put it into the DOM
    listItem.appendChild(removeButton);
    cartItemsContainer.appendChild(listItem);
  });

  //   if (cart.length === 0) {
  //     totalPriceElement.textContent = "Cart is empty!";
  //     totalQuantityElement.textContent = "";
  //     return;
  //   } else {
  //Update total quantity
  totalQuantityElement.textContent = `Items: ${cart.reduce(
    (sum, item) => sum + item.quantity,
    0
  )}`;

  // Update total price
  totalPriceElement.textContent = `Total Amount: $${totalPrice}`;
  //   }
}

// Update the cart count in the icon
function updateCartCount() {
  //   const cartCountElement = document.getElementById("cart-count");
  const cartCountElement = document.querySelector(".cart-count");
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  cartCountElement.textContent = totalItems;
}

document.querySelector("#clear-cart").addEventListener("click", () => {
  console.log("clear cart");
  clearCart();
});

// ----------------------NAVIGATION CSS----------------------

// .nav-container {
//   position: relative;
//   /* margin: auto; */
//   padding: 1rem;
//   display: flex;
//   align-items: center;
//   /* justify-content: space-between; */
//   z-index: 3;

//   img {
//     padding-left: 1rem;
//     padding-right: 5px;
//     justify-content: center;
//   }

//   a {
//     color: var(--secondary-font-color);
//     text-align: center;
//     /* padding: 14px 16px; */
//     text-decoration: none;
//     font-family: var(--secondary-font), var(--backup-font2);
//     font-size: calc(12px + 0.5rem);
//     /* padding-inline: 1rem; */
//   }

//   /* Change the link color to #111 (black) on hover */
//   a:hover {
//     /* background-color: var(--secondary-font-color); */
//     color: var(--dark-purple);
//     /* font-weight: bolder; */
//   }

//   .nav-toggle {
//     float: right;
//     color: var(--dark-purple);
//     /* color: transparent; */
//   }

//   .fa-shopping-cart {
//     font-size: var(--icon-size);
//     /* position: fixed;
//     top: 10px;
//     right: 10px;
//     background: #f39c12;
//     padding: 10px 15px;
//     border-radius: 50px;
//     color: white;
//     cursor: pointer; */
//   }

//   .cart-count {
//     font-size: var(--fsize);
//     font-weight: bold;
//     margin-left: 5px;
//   }

//   cart-button {
//     font-size: var(--fsize);
//     font-weight: bold;
//     margin-left: 5px;
//     float: right;
//   }
// }
// /* Hide links by default */
// .nav-links {
//   height: 0;
//   overflow: hidden;
//   transition: all;
// }

// /* toggle class */
// .show-nav-links {
//   height: 10rem;
// }

// @media (min-width: 768px) {
//   .nav-container {
//     max-width: 1170px;
//     margin: 0 auto;
//     display: flex;
//     align-items: center;
//     justify-content: space-between;
//     /* z-index: 3; */
//   }

//   .nav-header {
//     padding: 0;
//   }

//   .nav-toggle {
//     display: none;
//   }

//   .nav-links {
//     height: auto;
//     display: flex;
//   }

//   .nav-links a {
//     padding-inline: 1rem;
//     color: var(--secondary-font-color);
//   }

//   .nav-links a:hover {
//     color: var(--dark-purple);
//   }
// }
