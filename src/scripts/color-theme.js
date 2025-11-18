export function initTheme() {
  // Set initial theme
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    setTheme(savedTheme);
  } else {
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    setTheme(prefersDark ? "dark" : "light");
  }

  // Add toggle listener
  //   const themeToggle = document.getElementById("theme-toggle");
  //   if (themeToggle) {
  //     themeToggle.addEventListener("click", () => {
  //       const current =
  //         localStorage.getItem("theme") === "dark" ? "light" : "dark";
  //       setTheme(current);
  //     });
  //   }
}

function setTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem("theme", theme);
}
