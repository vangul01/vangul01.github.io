const CACHE_VERSION = "v2";
const CACHES = {
  pages: `pages-${CACHE_VERSION}`,
  assets: `assets-${CACHE_VERSION}`,
  images: `images-${CACHE_VERSION}`,
};

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  const activeCaches = Object.values(CACHES);
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => !activeCaches.includes(name))
            .map((name) => caches.delete(name)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Respond only to GET requests - no POST or Stripe
  if (request.method !== "GET") return;

  // Don't cache Netlify Functions (CRITICAL: Stripe safety) or Stripe (CRITICAL: never cache payments)
  const url = new URL(request.url);

  if (
    url.pathname.startsWith("/.netlify/functions/") ||
    url.hostname.includes("stripe.com")
  ) {
    return;
  }

  if (
    request.destination === "image" ||
    request.destination === "video" ||
    request.destination === "font"
  ) {
    event.respondWith(cacheFirst(request, CACHES.images));
  } else if (
    request.destination === "style" ||
    request.destination === "script"
  ) {
    event.respondWith(staleWhileRevalidate(request, CACHES.assets));
  } else if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, CACHES.pages));
  }
});

// Images, fonts, videos (safe, fast refresh)
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  // Allow opaque (cross-origin) for fonts.googleapis.com CSS
  if (response.ok) {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }
  return response;
}

// Assets, JS + CSS (fast UX)
async function staleWhileRevalidate(request, cacheName) {
  const cached = await caches.match(request);
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      const clonedResponse = response.clone();
      caches
        .open(cacheName)
        .then((cache) => cache.put(request, clonedResponse));
    }
    return response;
  });
  return cached || fetchPromise;
}

// HTML pages (safe, fast refresh)
async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    return cached || new Response("Offline", { status: 503 });
  }
}
