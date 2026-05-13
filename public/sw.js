const CACHE_NAME = "vangular-cache-v1";

// What files should be available offline
const urlsToCache = [
  "/",
  "/styles/global.css",
  "/manifest.json",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/assets/images/web/logo_eyewhites.png",
  "favicon.ico",
  "/scripts/main.js",
  "/pages/index.html",
];

// Install the service worker
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      // First try to add all resources
      try {
        return await cache.addAll(urlsToCache);
      } catch (err) {
        console.warn("Some resources failed to cache:", err);
        return await Promise.resolve();
      }
    })
  );
});

// Use cached content when offline
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches
      .match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
