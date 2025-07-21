// // filepath: /Users/valerieangulo/Code/vangul01.github.io/src/scripts/cart/cart-island.js
// function loadCart() {
//   const savedCart = localStorage.getItem("cartItems");
//   return savedCart ? JSON.parse(savedCart) : [];
// }

// function saveCart(cart) {
//   localStorage.setItem("cartItems", JSON.stringify(cart));
// }

// function renderCart() {
//   const cart = loadCart();
//   const container = document.getElementById("cart-island");
//   container.innerHTML = "";

//   if (!cart.length) {
//     container.innerHTML = "<p>Your cart is empty.</p>";
//     return;
//   }

//   cart.forEach((item, idx) => {
//     const row = document.createElement("div");
//     row.className = "cart-products-grid cart-row";
//     row.innerHTML = `
//       <div class="cart-product-info">
//         <div class="cart-product-image">
//           <img src="${item.image || "/src/assets/images/web/logo.png"}" alt="${item.name}" loading="lazy" />
//         </div>
//         <div class="cart-product-text">
//           <p>${item.name}</p>
//           <p>$${item.price?.toFixed(2) || 0} per item</p>
//         </div>
//       </div>
//       <div class="cart-product-quantity">
//         <div class="quantity-controls">
//           <button class="quantity-btn minus" aria-label="Decrease quantity">-</button>
//           <span class="quantity">${item.quantity}</span>
//           <button class="quantity-btn plus" aria-label="Increase quantity">+</button>
//         </div>
//         <button class="delete-btn" aria-label="Remove item">
//           <i class="fa fa-trash"></i>
//         </button>
//       </div>
//       <div class="cart-product-total-price">
//         <p>$${(item.price * item.quantity).toFixed(2)}</p>
//       </div>
//     `;

//     // Quantity decrease
//     row.querySelector(".minus").addEventListener("click", () => {
//       if (item.quantity > 1) {
//         item.quantity--;
//         saveCart(cart);
//         renderCart();
//       }
//     });

//     // Quantity increase
//     row.querySelector(".plus").addEventListener("click", () => {
//       item.quantity++;
//       saveCart(cart);
//       renderCart();
//     });

//     // Delete item
//     row.querySelector(".delete-btn").addEventListener("click", () => {
//       cart.splice(idx, 1);
//       saveCart(cart);
//       renderCart();
//     });

//     container.appendChild(row);
//   });
// }

// document.addEventListener("DOMContentLoaded", renderCart);
