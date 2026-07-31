/*
/api/* (Astro endpoints) 	Network-only 	Same reasoning—any server-side logic that touches Stripe or inventory must be live.
Non-GET requests globally 	Network-only 	Belt-and-suspenders: even if a URL slips through the hostname checks, POST/PUT/DELETE are never cached.


One last thing: the React Island (cart page)

Your cart island hydrates client-side and talks to your Netlify function for Stripe prices. Because the island's JS bundle lives under /_astro/, it gets the Cache-First rule (safe, because the filename is hashed). But the data it fetches at runtime hits /.netlify/functions/…, which is Network-only. So the island's code loads instantly from cache, but every price and checkout session is always live. No special handling needed—the routing rules above already cover it.

This setup should get you the Lighthouse PWA/Performance points, a genuinely offline-capable shell, and zero risk of a cached Stripe token or stale checkout session making it to a customer. And six months from now when Astro 8 drops, you'll npm update, deploy, and never think about the service worker again.
*/

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

  // CRITICAL: Don't cache Netlify Functions or Stripe!
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

// Images, fonts, videos (stable + offline friendly)
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  // Allow opaque responses (cross-origin assets/CDNs)
  if (response.ok || response.type === "opaque") {
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
  }
  return response;
}

// Assets, JS + CSS (fast UX)
async function staleWhileRevalidate(request, cacheName) {
  const cached = await caches.match(request);
  const fetchPromise = fetch(request).then((response) => {
    // Allow opaque responses (cross-origin assets/CDNs)
    if (response.ok || response.type === "opaque") {
      const clonedResponse = response.clone();
      caches
        .open(cacheName)
        .then((cache) => cache.put(request, clonedResponse));
    }
    return response;
  });
  return cached || fetchPromise;
}

// HTML pages
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
