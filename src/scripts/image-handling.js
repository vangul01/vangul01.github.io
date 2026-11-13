const SELECTOR = "img[data-img-fade]";
let initialized = false;

function markLoaded(img) {
  img.classList.remove("is-error");
  img.classList.add("is-loaded");
}

function applyFallback(img) {
  const fallback = img.dataset.fallback;
  if (!fallback || img.dataset.fallbackTried === "true") return false;

  img.dataset.fallbackTried = "true";
  img.classList.remove("is-loaded", "is-error");
  img.removeAttribute("srcset");
  img.removeAttribute("sizes");
  img.src = fallback;
  return true;
}

function markError(img) {
  if (applyFallback(img)) return;

  img.classList.remove("is-loaded");
  img.classList.add("is-error");
}

function initImage(img) {
  if (img.complete) {
    if (img.naturalWidth > 0) markLoaded(img);
    else markError(img);
    return;
  }
}

function bindGlobalListeners() {
  document.addEventListener(
    "load",
    (event) => {
      const target = event.target;
      if (target instanceof HTMLImageElement && target.matches(SELECTOR)) {
        markLoaded(target);
      }
    },
    true,
  );

  document.addEventListener(
    "error",
    (event) => {
      const target = event.target;
      if (target instanceof HTMLImageElement && target.matches(SELECTOR)) {
        markError(target);
      }
    },
    true,
  );
}

export function initImageHandling() {
  if (initialized) return;
  initialized = true;

  bindGlobalListeners();
  document.querySelectorAll(SELECTOR).forEach(initImage);
}

if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initImageHandling);
  } else {
    initImageHandling();
  }
}
