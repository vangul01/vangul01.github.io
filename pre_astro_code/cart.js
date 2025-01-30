// Shopping cart functionality
export function initCart() {
  // Cart array to store items
  let cart = [];

  function saveCart() {
    localStorage.setItem("cart", JSON.stringify(cart));
  }

  // after checkout, clear the cart like this!
  function clearCart() {
    localStorage.removeItem("cart");
    cart = [];
    updateCartCount();
  }

  // Update the cart count in the icon
  function updateCartCount() {
    //   const cartCountElement = document.getElementById("cart-count");
    const cartCountElement = document.querySelector(".cart-count");
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    cartCountElement.textContent = totalItems;
  }

  // Change button text when clicked
  function changeButtonText(button, newText, originalText) {
    button.textContent = newText;
    setTimeout(() => (button.textContent = originalText), 1000); // 1 second timeout
  }

  // Initialize cart from localStorage
  const savedCart = localStorage.getItem("cart");
  if (savedCart) {
    cart = JSON.parse(savedCart);
    updateCartCount();
  }

  // Add to Cart button handlers
  document.querySelectorAll(".add-to-cart").forEach((button) => {
    button.addEventListener("click", function () {
      const { id, name, price } = this.dataset;
      const existingProduct = cart.find((item) => item.id === id);

      if (existingProduct) {
        existingProduct.quantity += 1;
      } else {
        cart.push({
          id,
          name,
          price: parseFloat(price),
          quantity: 1,
        });
      }

      saveCart(); // Save cart to local storage
      updateCartCount(); // Update cart count in icon
      changeButtonText(this, "Added!", "Add to Cart");
    });
  });
}
