// Footer functionality
export function updateCopyrightYear() {
  const yearElement = document.getElementById("copyright-year");
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
}
