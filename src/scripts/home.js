// export function handleParallax() {
//   const leaves = document.querySelectorAll(".leaf");
//   let scrolled = window.scrollY;

//   requestAnimationFrame(() => {
//     leaves.forEach((leaf) => {
//       const speed = leaf.classList.contains("leaf-left") ? 0.5 : 0.7;
//       const translateX = scrolled * speed;
//       const rotate = scrolled * 0.02;
//       const opacity = 1 - scrolled * 0.003;

//       leaf.style.transform = `
//             translateX(${leaf.classList.contains("leaf-left") ? -translateX : translateX}px)
//             rotate(${leaf.classList.contains("leaf-left") ? -rotate : rotate}deg)
//           `;
//       leaf.style.opacity = Math.max(opacity, 0).toString();
//     });
//   });
// }

// export function initParallax() {
//   const debouncedHandle = debounce(handleParallax, 16); // 60fps
//   window.addEventListener("scroll", debouncedHandle);

//   // Cleanup on page navigation
//   document.addEventListener("astro:before-swap", () => {
//     window.removeEventListener("scroll", debouncedHandle);
//   });
// }

// function debounce(func, wait) {
//   let timeout;
//   return function executedFunction(...args) {
//     const later = () => {
//       clearTimeout(timeout);
//       func(...args);
//     };
//     clearTimeout(timeout);
//     timeout = setTimeout(later, wait);
//   };
// }
