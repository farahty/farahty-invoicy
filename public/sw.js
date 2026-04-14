// Bump CACHE_NAME whenever the caching policy changes so old caches are
// evicted on the next visit. Historically this SW cached every HTML page
// it saw, which caused stale invoice totals to persist across deploys.
const CACHE_NAME = "farahty-v2";
const OFFLINE_URL = "/offline";

// Only precache truly static, versioned assets. Dynamic HTML must never
// be served from cache because the server renders fresh data per user
// and per invoice.
const STATIC_ASSETS = [
  OFFLINE_URL,
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

const isStaticAsset = (url) => {
  const { pathname } = new URL(url);
  return (
    pathname.startsWith("/_next/static/") ||
    pathname.startsWith("/icons/") ||
    pathname.startsWith("/splash/") ||
    pathname.startsWith("/fonts/") ||
    pathname === "/manifest.json" ||
    /\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff2?|ttf|otf|eot|css|js|map)$/i.test(
      pathname
    )
  );
};

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(STATIC_ASSETS);
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
      await self.clients.claim();
    })()
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (!event.request.url.startsWith(self.location.origin)) return;
  if (event.request.url.includes("/api/")) return;

  const isNavigation =
    event.request.mode === "navigate" ||
    (event.request.destination === "" &&
      event.request.headers.get("accept")?.includes("text/html"));

  // Navigation / HTML: always go to network. Never write HTML to cache.
  // Falls back to the offline page only when the network is unreachable.
  if (isNavigation) {
    event.respondWith(
      (async () => {
        try {
          return await fetch(event.request);
        } catch {
          const cache = await caches.open(CACHE_NAME);
          const offline = await cache.match(OFFLINE_URL);
          return (
            offline ||
            new Response("Offline", {
              status: 503,
              statusText: "Service Unavailable",
            })
          );
        }
      })()
    );
    return;
  }

  // Static assets: cache-first with network fallback.
  if (isStaticAsset(event.request.url)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE_NAME);
        const cached = await cache.match(event.request);
        if (cached) return cached;
        try {
          const networkResponse = await fetch(event.request);
          if (networkResponse.ok) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        } catch {
          return new Response("Offline", {
            status: 503,
            statusText: "Service Unavailable",
          });
        }
      })()
    );
    return;
  }

  // Everything else: straight to the network, no caching.
});
